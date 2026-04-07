from __future__ import annotations

from dataclasses import dataclass
import os


def normalize_ad_account_id(account_id: str) -> str:
    value = (account_id or "").strip()
    if value and not value.startswith("act_"):
        return f"act_{value}"
    return value


def parse_account_allowlist(raw_value: str) -> tuple[str, ...]:
    if not raw_value.strip():
        return ()

    items = []
    for item in raw_value.split(","):
        normalized = normalize_ad_account_id(item)
        if normalized:
            items.append(normalized)
    return tuple(items)


@dataclass(frozen=True)
class Settings:
    meta_access_token: str
    meta_app_secret: str
    meta_api_version: str
    allowed_ad_accounts: tuple[str, ...]
    request_timeout_seconds: float

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            meta_access_token=os.getenv("META_ACCESS_TOKEN", "").strip(),
            meta_app_secret=os.getenv("META_APP_SECRET", "").strip(),
            meta_api_version=os.getenv("META_API_VERSION", "v24.0").strip() or "v24.0",
            allowed_ad_accounts=parse_account_allowlist(
                os.getenv("META_ALLOWED_AD_ACCOUNTS", "")
            ),
            request_timeout_seconds=float(
                os.getenv("META_REQUEST_TIMEOUT_SECONDS", "30").strip() or "30"
            ),
        )
