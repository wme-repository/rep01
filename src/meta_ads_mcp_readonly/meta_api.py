from __future__ import annotations

import hashlib
import hmac
import json
import logging
from typing import Any

import httpx

from .config import Settings, normalize_ad_account_id


logger = logging.getLogger(__name__)


def ensure_allowed_account(settings: Settings, account_id: str) -> str:
    normalized = normalize_ad_account_id(account_id)
    if not normalized:
        raise ValueError("account_id is required")

    if settings.allowed_ad_accounts and normalized not in settings.allowed_ad_accounts:
        raise ValueError(
            f"account_id {normalized} is not allowlisted in META_ALLOWED_AD_ACCOUNTS"
        )

    return normalized


class GraphApiClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = f"https://graph.facebook.com/{settings.meta_api_version}"

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
            logger.info("meta_usage endpoint=%s payload=%s", endpoint, usage_payload)

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
            try:
                response = await client.get(url, params=merged_params, headers=headers)
                self._log_usage_headers(response.headers, endpoint)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                self._log_usage_headers(exc.response.headers, endpoint)
                try:
                    error_payload = exc.response.json()
                except json.JSONDecodeError:
                    error_payload = {"message": exc.response.text}

                return {
                    "error": {
                        "message": "Meta Graph API request failed",
                        "status_code": exc.response.status_code,
                        "endpoint": endpoint,
                        "details": error_payload,
                    }
                }
            except httpx.RequestError as exc:
                return {
                    "error": {
                        "message": "Could not reach Meta Graph API",
                        "endpoint": endpoint,
                        "details": str(exc),
                    }
                }
