from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import re
from typing import Any

import httpx

from .config import Settings, normalize_ad_account_id


logger = logging.getLogger(__name__)
ACCESS_TOKEN_URL_PATTERN = re.compile(r"([?&]access_token=)[^&]+")


def ensure_allowed_account(settings: Settings, account_id: str) -> str:
    normalized = normalize_ad_account_id(account_id)
    if not normalized:
        raise ValueError("account_id is required")

    if settings.allowed_ad_accounts and normalized not in settings.allowed_ad_accounts:
        raise ValueError(
            f"account_id {normalized} is not allowlisted in META_ALLOWED_AD_ACCOUNTS"
        )

    return normalized


def _extract_error_message(error_payload: dict[str, Any]) -> str:
    details = error_payload.get("details")
    if isinstance(details, dict):
        nested_error = details.get("error")
        if isinstance(nested_error, dict) and nested_error.get("message"):
            return str(nested_error["message"])
        if details.get("message"):
            return str(details["message"])
    if error_payload.get("message"):
        return str(error_payload["message"])
    return "unknown error"


def _extract_meta_error(error_payload: dict[str, Any]) -> dict[str, Any]:
    details = error_payload.get("details")
    if isinstance(details, dict):
        nested_error = details.get("error")
        if isinstance(nested_error, dict):
            return nested_error
    return {}


def _build_action_required(error_payload: dict[str, Any]) -> str | None:
    meta_error = _extract_meta_error(error_payload)
    code = meta_error.get("code")
    message = str(meta_error.get("message", ""))

    if code == 190 and "Application has been deleted" in message:
        return (
            "Generate a new access token from an active Meta app. "
            "The current token is tied to an app Meta reports as deleted."
        )

    if code == 190:
        return "Generate a fresh Meta access token and verify the app is active."

    return None


class GraphApiClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = f"https://graph.facebook.com/{settings.meta_api_version}"

    def _retry_delay_seconds(self, attempt: int) -> float:
        return self.settings.retry_backoff_seconds * (2**attempt)

    def _should_retry_status(self, status_code: int) -> bool:
        return status_code == 429 or status_code >= 500

    async def _sleep_before_retry(
        self,
        endpoint: str,
        attempt: int,
        *,
        reason: str,
        status_code: int | None = None,
    ) -> None:
        delay_seconds = self._retry_delay_seconds(attempt)
        logger.warning(
            "meta_request_retry",
            extra={
                "event": "meta_request_retry",
                "endpoint": endpoint,
                "attempt": attempt + 1,
                "max_retries": self.settings.max_retries,
                "delay_seconds": delay_seconds,
                "status_code": status_code,
                "reason": reason,
            },
        )
        await asyncio.sleep(delay_seconds)

    def _build_appsecret_proof(self) -> str | None:
        if not self.settings.meta_app_secret or not self.settings.meta_access_token:
            return None

        return hmac.new(
            self.settings.meta_app_secret.encode("utf-8"),
            self.settings.meta_access_token.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _base_params(self) -> dict[str, Any]:
        params: dict[str, Any] = {"access_token": self.settings.meta_access_token}
        appsecret_proof = self._build_appsecret_proof()
        if appsecret_proof:
            params["appsecret_proof"] = appsecret_proof
        return params

    def _log_usage_headers(self, headers: httpx.Headers, endpoint: str) -> None:
        raw_headers = {
            "x-app-usage": headers.get("x-app-usage"),
            "x-business-use-case-usage": headers.get("x-business-use-case-usage"),
            "x-ad-account-usage": headers.get("x-ad-account-usage"),
        }

        usage_payload: dict[str, Any] = {}
        for key, value in raw_headers.items():
            if not value:
                continue
            try:
                usage_payload[key] = json.loads(value)
            except json.JSONDecodeError:
                usage_payload[key] = value

        if usage_payload:
            logger.info(
                "meta_usage",
                extra={
                    "event": "meta_usage",
                    "endpoint": endpoint,
                    "usage": usage_payload,
                },
            )

    def _parse_json_body(
        self,
        response: httpx.Response,
        endpoint: str,
    ) -> dict[str, Any]:
        try:
            payload = response.json()
        except json.JSONDecodeError:
            return {
                "error": {
                    "message": "Meta Graph API returned invalid JSON",
                    "status_code": response.status_code,
                    "endpoint": endpoint,
                    "details": response.text,
                }
            }
        return self._sanitize_payload(payload)

    def _sanitize_string(self, value: str) -> str:
        sanitized = ACCESS_TOKEN_URL_PATTERN.sub(r"\1[REDACTED]", value)
        if self.settings.meta_access_token:
            sanitized = sanitized.replace(
                self.settings.meta_access_token,
                "[REDACTED]",
            )
        return sanitized

    def _sanitize_payload(self, value: Any) -> Any:
        if isinstance(value, str):
            return self._sanitize_string(value)
        if isinstance(value, list):
            return [self._sanitize_payload(item) for item in value]
        if isinstance(value, tuple):
            return tuple(self._sanitize_payload(item) for item in value)
        if isinstance(value, dict):
            return {key: self._sanitize_payload(item) for key, item in value.items()}
        return value

    async def get(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.settings.meta_access_token:
            return {
                "error": {
                    "message": "META_ACCESS_TOKEN is not configured",
                    "action_required": "Set META_ACCESS_TOKEN before using the MCP",
                }
            }

        merged_params = self._base_params()
        for key, value in (params or {}).items():
            if isinstance(value, (dict, list)):
                merged_params[key] = json.dumps(value)
            else:
                merged_params[key] = value

        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {"User-Agent": "meta-ads-mcp-readonly/0.1.0"}

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            for attempt in range(self.settings.max_retries + 1):
                try:
                    response = await client.get(url, params=merged_params, headers=headers)
                    response.raise_for_status()
                    self._log_usage_headers(response.headers, endpoint)
                    return self._parse_json_body(response, endpoint)
                except httpx.HTTPStatusError as exc:
                    self._log_usage_headers(exc.response.headers, endpoint)
                    try:
                        error_payload = self._sanitize_payload(exc.response.json())
                    except json.JSONDecodeError:
                        error_payload = {"message": self._sanitize_string(exc.response.text)}

                    if (
                        attempt < self.settings.max_retries
                        and self._should_retry_status(exc.response.status_code)
                    ):
                        await self._sleep_before_retry(
                            endpoint,
                            attempt,
                            reason=_extract_error_message(
                                {
                                    "message": "Meta Graph API request failed",
                                    "details": error_payload,
                                }
                            ),
                            status_code=exc.response.status_code,
                        )
                        continue

                    return {
                        "error": {
                            "message": "Meta Graph API request failed",
                            "status_code": exc.response.status_code,
                            "endpoint": endpoint,
                            "details": error_payload,
                            "action_required": _build_action_required(
                                {
                                    "message": "Meta Graph API request failed",
                                    "details": error_payload,
                                }
                            ),
                        }
                    }
                except httpx.RequestError as exc:
                    if attempt < self.settings.max_retries:
                        await self._sleep_before_retry(
                            endpoint,
                            attempt,
                            reason=str(exc),
                        )
                        continue

                    return {
                        "error": {
                            "message": "Could not reach Meta Graph API",
                            "endpoint": endpoint,
                            "details": str(exc),
                        }
                    }


async def resolve_object_account_id(
    client: GraphApiClient,
    object_id: str,
    object_label: str,
) -> str:
    normalized_object_id = str(object_id or "").strip()
    if not normalized_object_id:
        raise ValueError(f"{object_label} is required")

    payload = await client.get(normalized_object_id, {"fields": "account_id"})
    error_payload = payload.get("error")
    if isinstance(error_payload, dict):
        raise ValueError(
            f"Could not verify {object_label} {normalized_object_id}: "
            f"{_extract_error_message(error_payload)}"
        )

    account_id = normalize_ad_account_id(payload.get("account_id", ""))
    if not account_id:
        raise ValueError(
            f"Could not verify {object_label} {normalized_object_id}: "
            "response did not include account_id"
        )

    return account_id


async def ensure_object_belongs_to_account(
    client: GraphApiClient,
    settings: Settings,
    object_id: str,
    account_id: str,
    object_label: str,
) -> str:
    normalized_object_id = str(object_id or "").strip()
    if not normalized_object_id:
        raise ValueError(f"{object_label} is required")

    normalized_account_id = ensure_allowed_account(settings, account_id)
    owner_account_id = await resolve_object_account_id(
        client, normalized_object_id, object_label
    )
    if owner_account_id != normalized_account_id:
        raise ValueError(
            f"{object_label} {normalized_object_id} does not belong to "
            f"account_id {normalized_account_id}"
        )

    return normalized_object_id


async def ensure_object_is_allowlisted(
    client: GraphApiClient,
    settings: Settings,
    object_id: str,
    object_label: str,
) -> str:
    normalized_object_id = str(object_id or "").strip()
    if not normalized_object_id:
        raise ValueError(f"{object_label} is required")

    owner_account_id = await resolve_object_account_id(
        client, normalized_object_id, object_label
    )
    ensure_allowed_account(settings, owner_account_id)
    return normalized_object_id
