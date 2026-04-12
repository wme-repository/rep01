import json
import logging
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from meta_ads_mcp_readonly.config import Settings
from meta_ads_mcp_readonly import server


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


class SensitiveValueFilterTest(unittest.TestCase):
    def test_filter_masks_message_and_args(self) -> None:
        sensitive_filter = server.SensitiveValueFilter(
            "test",
            {"access_token": "secret-token-1234"},
        )
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="token=%s nested=%s",
            args=(
                "secret-token-1234",
                {"nested": "Bearer secret-token-1234"},
            ),
            exc_info=None,
        )

        sensitive_filter.filter(record)

        self.assertEqual(record.msg, "token=%s nested=%s")
        self.assertEqual(record.args[0], "[REDACTED-access_token-1234]")
        self.assertEqual(
            record.args[1]["nested"],
            "Bearer [REDACTED-access_token-1234]",
        )

    def test_filter_masks_multiple_sensitive_values(self) -> None:
        sensitive_filter = server.SensitiveValueFilter(
            "test",
            {
                "access_token": "secret-token-1234",
                "appsecret_proof": "proof-value-5678",
            },
        )
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="proof=%s",
            args=("proof-value-5678",),
            exc_info=None,
        )

        sensitive_filter.filter(record)

        self.assertEqual(record.args[0], "[REDACTED-appsecret_proof-5678]")

    def test_filter_masks_extra_fields(self) -> None:
        sensitive_filter = server.SensitiveValueFilter(
            "test",
            {"access_token": "secret-token-1234"},
        )
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="server_start",
            args=(),
            exc_info=None,
        )
        record.transport = "stdio"
        record.access_token_suffix = "prefix-secret-token-1234-suffix"

        sensitive_filter.filter(record)

        self.assertEqual(
            record.access_token_suffix,
            "prefix-[REDACTED-access_token-1234]-suffix",
        )


class JsonLogFormatterTest(unittest.TestCase):
    def test_formatter_emits_json_with_extra_fields(self) -> None:
        formatter = server.JsonLogFormatter()
        record = logging.LogRecord(
            name="meta_ads_mcp_readonly.server",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="server_start",
            args=(),
            exc_info=None,
        )
        record.event = "server_start"
        record.transport = "stdio"

        payload = json.loads(formatter.format(record))

        self.assertEqual(payload["event"], "server_start")
        self.assertEqual(payload["transport"], "stdio")
        self.assertEqual(payload["message"], "server_start")


class ConfigureLoggingTest(unittest.TestCase):
    def tearDown(self) -> None:
        server.reset_runtime_state()

    def test_configure_logging_quiets_httpx_loggers(self) -> None:
        settings = make_settings()

        server.configure_logging(settings)

        self.assertEqual(logging.getLogger("httpx").level, logging.WARNING)
        self.assertEqual(logging.getLogger("httpcore").level, logging.WARNING)

    def test_configure_logging_masks_appsecret_proof(self) -> None:
        settings = make_settings(
            meta_access_token="secret-token-1234",
            meta_app_secret="app-secret",
        )

        server.configure_logging(settings)

        proof = settings.build_appsecret_proof()
        self.assertIsNotNone(proof)

        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg=f"proof={proof}",
            args=(),
            exc_info=None,
        )

        for log_filter in logging.getLogger().filters:
            log_filter.filter(record)

        self.assertIn("[REDACTED-appsecret_proof-", record.msg)


class StreamableHttpValidationTest(unittest.TestCase):
    def test_validate_streamable_http_settings_requires_bearer_or_explicit_local_override(
        self,
    ) -> None:
        settings = make_settings()

        with self.assertRaisesRegex(ValueError, "META_HTTP_BEARER_TOKEN is required"):
            server.validate_streamable_http_settings(settings, "127.0.0.1")

    def test_validate_streamable_http_settings_accepts_bearer_token(self) -> None:
        settings = make_settings(http_bearer_token="http-secret")

        server.validate_streamable_http_settings(settings, "0.0.0.0")

    def test_validate_streamable_http_settings_rejects_unsafe_override_on_public_host(
        self,
    ) -> None:
        settings = make_settings(unsafe_allow_unauthenticated_http=True)

        with self.assertRaisesRegex(ValueError, "only allowed with localhost"):
            server.validate_streamable_http_settings(settings, "0.0.0.0")

    def test_validate_streamable_http_settings_accepts_unsafe_override_on_localhost(
        self,
    ) -> None:
        settings = make_settings(unsafe_allow_unauthenticated_http=True)

        server.validate_streamable_http_settings(settings, "localhost")


class ServerToolsTest(unittest.IsolatedAsyncioTestCase):
    async def test_get_adsets_rejects_campaign_from_other_account(self) -> None:
        settings = make_settings()
        client = StubClient({"cmp_1": {"account_id": "act_999"}})

        with patch.object(server, "get_settings", return_value=settings), patch.object(
            server, "get_client", return_value=client
        ):
            payload = json.loads(
                await server.get_adsets("act_123", campaign_id="cmp_1")
            )

        self.assertIn("does not belong to account_id act_123", payload["error"]["message"])

    async def test_get_insights_rejects_object_from_non_allowlisted_account(self) -> None:
        settings = make_settings()
        client = StubClient({"ad_1": {"account_id": "act_999"}})

        with patch.object(server, "get_settings", return_value=settings), patch.object(
            server, "get_client", return_value=client
        ):
            payload = json.loads(await server.get_insights("ad_1", level="ad"))

        self.assertIn("is not allowlisted", payload["error"]["message"])

    async def test_get_ad_accounts_filters_allowlisted_data(self) -> None:
        settings = make_settings()
        client = StubClient(
            {
                "me/adaccounts": {
                    "data": [
                        {"id": "act_123", "account_id": "123", "name": "allowed"},
                        {"id": "act_999", "account_id": "999", "name": "blocked"},
                    ]
                }
            }
        )

        with patch.object(server, "get_settings", return_value=settings), patch.object(
            server, "get_client", return_value=client
        ):
            payload = json.loads(await server.get_ad_accounts())

        self.assertEqual(
            payload["data"],
            [{"id": "act_123", "account_id": "123", "name": "allowed"}],
        )

    async def test_get_ad_accounts_rejects_invalid_limit(self) -> None:
        settings = make_settings()
        client = StubClient({"me/adaccounts": {"data": []}})

        with patch.object(server, "get_settings", return_value=settings), patch.object(
            server, "get_client", return_value=client
        ):
            payload = json.loads(await server.get_ad_accounts(limit=0))

        self.assertEqual(payload["error"]["message"], "limit must be between 1 and 500")

    async def test_get_ads_uses_campaign_edge_when_campaign_id_is_provided(self) -> None:
        settings = make_settings()
        client = StubClient(
            {
                "cmp_1": {"account_id": "act_123"},
                "cmp_1/ads": {"data": []},
            }
        )

        with patch.object(server, "get_settings", return_value=settings), patch.object(
            server, "get_client", return_value=client
        ):
            payload = json.loads(await server.get_ads("act_123", campaign_id="cmp_1"))

        self.assertEqual(payload["data"], [])
        self.assertEqual(client.calls[1][0], "cmp_1/ads")

    async def test_get_ads_uses_adset_edge_when_adset_id_is_provided(self) -> None:
        settings = make_settings()
        client = StubClient(
            {
                "set_1": {"account_id": "act_123"},
                "set_1/ads": {"data": []},
            }
        )

        with patch.object(server, "get_settings", return_value=settings), patch.object(
            server, "get_client", return_value=client
        ):
            payload = json.loads(await server.get_ads("act_123", adset_id="set_1"))

        self.assertEqual(payload["data"], [])
        self.assertEqual(client.calls[1][0], "set_1/ads")
