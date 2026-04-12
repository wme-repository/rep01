import json
from pathlib import Path
import sys
import unittest
from unittest.mock import AsyncMock, Mock, patch

import httpx


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from meta_ads_mcp_readonly.config import Settings
import meta_ads_mcp_readonly.meta_api as meta_api_module
from meta_ads_mcp_readonly.meta_api import (
    GraphApiClient,
    ensure_allowed_account,
    ensure_object_belongs_to_account,
    ensure_object_is_allowlisted,
    resolve_object_account_id,
)


def make_settings(**overrides: object) -> Settings:
    values = {
        "meta_access_token": "token",
        "meta_app_secret": "",
        "meta_api_version": "v24.0",
        "allowed_ad_accounts": ("act_123",),
        "unsafe_allow_all_ad_accounts": False,
        "request_timeout_seconds": 30.0,
        "max_retries": 2,
        "retry_backoff_seconds": 1.0,
        "log_format": "json",
        "http_bearer_token": "",
        "unsafe_allow_unauthenticated_http": False,
    }
    values.update(overrides)
    return Settings(**values)


class StubClient:
    def __init__(self, payloads: dict[str, dict]):
        self.payloads = payloads
        self.calls: list[tuple[str, dict | None]] = []

    async def get(self, endpoint: str, params: dict | None = None) -> dict:
        self.calls.append((endpoint, params))
        return self.payloads[endpoint]


class FakeResponse:
    def __init__(self, status_code: int, payload: dict, headers: dict | None = None):
        self.status_code = status_code
        self._payload = payload
        self.headers = httpx.Headers(headers or {})
        self.text = json.dumps(payload)
        self.request = httpx.Request("GET", "https://graph.facebook.com/test")

    def json(self) -> dict:
        return self._payload

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                f"HTTP {self.status_code}",
                request=self.request,
                response=self,
            )


class FakeInvalidJsonResponse(FakeResponse):
    def json(self) -> dict:
        raise json.JSONDecodeError("invalid json", self.text, 0)


class FakeAsyncClient:
    def __init__(self, responses: list[object]):
        self.responses = list(responses)
        self.calls: list[tuple[str, dict | None, dict | None]] = []

    async def __aenter__(self) -> "FakeAsyncClient":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        return False

    async def get(
        self,
        url: str,
        params: dict | None = None,
        headers: dict | None = None,
    ) -> object:
        self.calls.append((url, params, headers))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class EnsureAllowedAccountTest(unittest.TestCase):
    def test_ensure_allowed_account_normalizes_id(self) -> None:
        settings = make_settings()

        self.assertEqual(ensure_allowed_account(settings, "123"), "act_123")

    def test_ensure_allowed_account_rejects_non_allowlisted_id(self) -> None:
        settings = make_settings()

        with self.assertRaisesRegex(ValueError, "is not allowlisted"):
            ensure_allowed_account(settings, "act_999")


class MetaOwnershipHelpersTest(unittest.IsolatedAsyncioTestCase):
    async def test_resolve_object_account_id_reads_account_field(self) -> None:
        client = StubClient({"cmp_1": {"account_id": "123"}})

        account_id = await resolve_object_account_id(client, "cmp_1", "campaign_id")

        self.assertEqual(account_id, "act_123")
        self.assertEqual(client.calls, [("cmp_1", {"fields": "account_id"})])

    async def test_resolve_object_account_id_surfaces_api_errors(self) -> None:
        client = StubClient(
            {
                "cmp_1": {
                    "error": {
                        "message": "Meta Graph API request failed",
                        "details": {"error": {"message": "Object does not exist"}},
                    }
                }
            }
        )

        with self.assertRaisesRegex(ValueError, "Object does not exist"):
            await resolve_object_account_id(client, "cmp_1", "campaign_id")

    async def test_ensure_object_belongs_to_account_rejects_mismatch(self) -> None:
        settings = make_settings()
        client = StubClient({"cmp_1": {"account_id": "999"}})

        with self.assertRaisesRegex(ValueError, "does not belong to account_id act_123"):
            await ensure_object_belongs_to_account(
                client,
                settings,
                "cmp_1",
                "act_123",
                "campaign_id",
            )

    async def test_ensure_object_is_allowlisted_rejects_non_allowlisted_owner(self) -> None:
        settings = make_settings()
        client = StubClient({"ad_1": {"account_id": "act_999"}})

        with self.assertRaisesRegex(ValueError, "is not allowlisted"):
            await ensure_object_is_allowlisted(client, settings, "ad_1", "ad_id")


class GraphApiClientRetryTest(unittest.IsolatedAsyncioTestCase):
    async def test_get_retries_on_429_then_returns_success(self) -> None:
        settings = make_settings(max_retries=1, retry_backoff_seconds=0.25)
        graph_client = GraphApiClient(settings)
        fake_client = FakeAsyncClient(
            [
                FakeResponse(
                    429,
                    {"error": {"message": "Rate limit"}},
                    {"x-app-usage": "{\"call_count\": 99}"},
                ),
                FakeResponse(200, {"data": [{"id": "1"}]}),
            ]
        )

        with patch(
            "meta_ads_mcp_readonly.meta_api.httpx.AsyncClient",
            return_value=fake_client,
        ), patch(
            "meta_ads_mcp_readonly.meta_api.asyncio.sleep",
            new=AsyncMock(),
        ) as sleep_mock, patch.object(meta_api_module, "logger") as logger_mock:
            payload = await graph_client.get("act_123/campaigns", {"limit": 25})

        self.assertEqual(payload, {"data": [{"id": "1"}]})
        self.assertEqual(len(fake_client.calls), 2)
        sleep_mock.assert_awaited_once_with(0.25)
        logger_mock.warning.assert_called_once()
        logger_mock.info.assert_called_once()

    async def test_get_logs_usage_headers_once_for_failed_response(self) -> None:
        settings = make_settings(max_retries=0)
        graph_client = GraphApiClient(settings)
        graph_client._log_usage_headers = Mock()
        fake_client = FakeAsyncClient(
            [
                FakeResponse(
                    429,
                    {"error": {"message": "Rate limit"}},
                    {"x-app-usage": "{\"call_count\": 99}"},
                )
            ]
        )

        with patch(
            "meta_ads_mcp_readonly.meta_api.httpx.AsyncClient",
            return_value=fake_client,
        ):
            payload = await graph_client.get("act_123/campaigns", {"limit": 25})

        self.assertEqual(payload["error"]["status_code"], 429)
        self.assertEqual(graph_client._log_usage_headers.call_count, 1)

    async def test_get_returns_structured_error_for_invalid_json_success(self) -> None:
        settings = make_settings(max_retries=0)
        graph_client = GraphApiClient(settings)
        fake_client = FakeAsyncClient(
            [
                FakeInvalidJsonResponse(200, {"ok": True}),
            ]
        )

        with patch(
            "meta_ads_mcp_readonly.meta_api.httpx.AsyncClient",
            return_value=fake_client,
        ):
            payload = await graph_client.get("act_123/campaigns", {"limit": 25})

        self.assertEqual(payload["error"]["message"], "Meta Graph API returned invalid JSON")
        self.assertEqual(payload["error"]["status_code"], 200)

    async def test_get_returns_action_required_for_deleted_app_token(self) -> None:
        settings = make_settings(max_retries=0)
        graph_client = GraphApiClient(settings)
        fake_client = FakeAsyncClient(
            [
                FakeResponse(
                    400,
                    {
                        "error": {
                            "message": "Error validating application. Application has been deleted.",
                            "type": "OAuthException",
                            "code": 190,
                        }
                    },
                ),
            ]
        )

        with patch(
            "meta_ads_mcp_readonly.meta_api.httpx.AsyncClient",
            return_value=fake_client,
        ):
            payload = await graph_client.get("act_123/campaigns", {"limit": 25})

        self.assertEqual(payload["error"]["status_code"], 400)
        self.assertIn(
            "Generate a new access token from an active Meta app",
            payload["error"]["action_required"],
        )

    async def test_get_redacts_access_token_from_paging_urls(self) -> None:
        settings = make_settings(meta_access_token="secret-token", max_retries=0)
        graph_client = GraphApiClient(settings)
        fake_client = FakeAsyncClient(
            [
                FakeResponse(
                    200,
                    {
                        "data": [{"id": "1"}],
                        "paging": {
                            "next": "https://graph.facebook.com/v25.0/me/adaccounts?access_token=secret-token&limit=5"
                        },
                    },
                ),
            ]
        )

        with patch(
            "meta_ads_mcp_readonly.meta_api.httpx.AsyncClient",
            return_value=fake_client,
        ):
            payload = await graph_client.get("me/adaccounts", {"limit": 5})

        self.assertEqual(
            payload["paging"]["next"],
            "https://graph.facebook.com/v25.0/me/adaccounts?access_token=[REDACTED]&limit=5",
        )

    async def test_get_redacts_appsecret_proof_from_paging_urls(self) -> None:
        settings = make_settings(
            meta_access_token="secret-token",
            meta_app_secret="app-secret",
            max_retries=0,
        )
        graph_client = GraphApiClient(settings)
        appsecret_proof = settings.build_appsecret_proof()
        fake_client = FakeAsyncClient(
            [
                FakeResponse(
                    200,
                    {
                        "data": [{"id": "1"}],
                        "paging": {
                            "next": (
                                "https://graph.facebook.com/v25.0/me/adaccounts?"
                                f"access_token=secret-token&appsecret_proof={appsecret_proof}&limit=5"
                            )
                        },
                    },
                ),
            ]
        )

        with patch(
            "meta_ads_mcp_readonly.meta_api.httpx.AsyncClient",
            return_value=fake_client,
        ):
            payload = await graph_client.get("me/adaccounts", {"limit": 5})

        self.assertEqual(
            payload["paging"]["next"],
            "https://graph.facebook.com/v25.0/me/adaccounts?access_token=[REDACTED]&appsecret_proof=[REDACTED]&limit=5",
        )

    async def test_get_retries_on_request_error_then_returns_success(self) -> None:
        settings = make_settings(max_retries=1, retry_backoff_seconds=0.5)
        graph_client = GraphApiClient(settings)
        fake_client = FakeAsyncClient(
            [
                httpx.ReadTimeout("timeout", request=httpx.Request("GET", "https://graph.facebook.com/test")),
                FakeResponse(200, {"data": [{"id": "1"}]}),
            ]
        )

        with patch(
            "meta_ads_mcp_readonly.meta_api.httpx.AsyncClient",
            return_value=fake_client,
        ), patch(
            "meta_ads_mcp_readonly.meta_api.asyncio.sleep",
            new=AsyncMock(),
        ) as sleep_mock, patch.object(meta_api_module, "logger") as logger_mock:
            payload = await graph_client.get("act_123/campaigns", {"limit": 25})

        self.assertEqual(payload, {"data": [{"id": "1"}]})
        sleep_mock.assert_awaited_once_with(0.5)
        logger_mock.warning.assert_called_once()
