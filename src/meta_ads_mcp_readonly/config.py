from __future__ import annotations

from dataclasses import dataclass
import os


def normalize_ad_account_id(account_id: str) -> str:
    value = str(account_id or "").strip()
    if value and not value.startswith("act_"):
        return f"act_{value}"
    return value


def parse_account_allowlist(raw_value: str) -> tuple[str, ...]:
    if not str(raw_value or "").strip():
        return ()

    items = []
    for item in raw_value.split(","):
        normalized = normalize_ad_account_id(item)
        if normalized:
            items.append(normalized)
    return tuple(items)


def parse_float_setting(raw_value: str, setting_name: str) -> float:
    value = str(raw_value or "").strip()
    try:
        return float(value)
    except ValueError as exc:
        raise ValueError(
            f"{setting_name} must be a valid number, got {value!r}"
        ) from exc


def parse_int_setting(raw_value: str, setting_name: str) -> int:
    value = str(raw_value or "").strip()
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(
            f"{setting_name} must be a valid integer, got {value!r}"
        ) from exc


@dataclass(frozen=True)
class Settings:
    meta_access_token: str
    meta_app_secret: str
    meta_api_version: str
    allowed_ad_accounts: tuple[str, ...]
    request_timeout_seconds: float
    max_retries: int
    retry_backoff_seconds: float
    log_format: str

    @classmethod
    def from_env(cls) -> "Settings":
        request_timeout_seconds = parse_float_setting(
            os.getenv("META_REQUEST_TIMEOUT_SECONDS", "30").strip() or "30",
            "META_REQUEST_TIMEOUT_SECONDS",
        )
        max_retries = parse_int_setting(
            os.getenv("META_MAX_RETRIES", "2").strip() or "2",
            "META_MAX_RETRIES",
        )
        retry_backoff_seconds = parse_float_setting(
            os.getenv("META_RETRY_BACKOFF_SECONDS", "1").strip() or "1",
            "META_RETRY_BACKOFF_SECONDS",
        )
        log_format = os.getenv("META_LOG_FORMAT", "json").strip().lower() or "json"

        return cls(
            meta_access_token=os.getenv("META_ACCESS_TOKEN", "").strip(),
            meta_app_secret=os.getenv("META_APP_SECRET", "").strip(),
            meta_api_version=os.getenv("META_API_VERSION", "v24.0").strip() or "v24.0",
            allowed_ad_accounts=parse_account_allowlist(
                os.getenv("META_ALLOWED_AD_ACCOUNTS", "")
            ),
            request_timeout_seconds=request_timeout_seconds,
            max_retries=max_retries,
            retry_backoff_seconds=retry_backoff_seconds,
            log_format=log_format,
        )

    def validate(self) -> None:
        """Validate settings and raise ValueError for invalid configuration."""
        if not self.meta_access_token or not self.meta_access_token.strip():
            raise ValueError(
                "META_ACCESS_TOKEN is required and cannot be empty. "
                "Set it in your environment or .env file."
            )
        if not self.meta_api_version.startswith("v"):
            raise ValueError(
                f"META_API_VERSION must start with 'v', got {self.meta_api_version!r}"
            )
        if self.request_timeout_seconds <= 0:
            raise ValueError(
                f"META_REQUEST_TIMEOUT_SECONDS must be positive, "
                f"got {self.request_timeout_seconds}"
            )
        if self.max_retries < 0:
            raise ValueError(
                f"META_MAX_RETRIES must be zero or greater, got {self.max_retries}"
            )
        if self.retry_backoff_seconds <= 0:
            raise ValueError(
                "META_RETRY_BACKOFF_SECONDS must be positive, "
                f"got {self.retry_backoff_seconds}"
            )
        if self.log_format not in {"json", "plain"}:
            raise ValueError(
                "META_LOG_FORMAT must be one of: json, plain, "
                f"got {self.log_format!r}"
            )
