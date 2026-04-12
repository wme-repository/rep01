import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from meta_ads_mcp_readonly.config import (
    Settings,
    normalize_ad_account_id,
    parse_account_allowlist,
    parse_bool_setting,
)


class ConfigHelpersTest(unittest.TestCase):
    def test_normalize_ad_account_id_accepts_numeric_values(self) -> None:
        self.assertEqual(normalize_ad_account_id("123"), "act_123")
        self.assertEqual(normalize_ad_account_id(123), "act_123")
        self.assertEqual(normalize_ad_account_id("act_123"), "act_123")

    def test_parse_account_allowlist_discards_empty_values(self) -> None:
        self.assertEqual(
            parse_account_allowlist(" act_1, 2, ,act_3 "),
            ("act_1", "act_2", "act_3"),
        )
        self.assertEqual(parse_account_allowlist(""), ())

    def test_parse_bool_setting_accepts_common_values(self) -> None:
        self.assertTrue(parse_bool_setting("true", "FLAG"))
        self.assertTrue(parse_bool_setting("1", "FLAG"))
        self.assertFalse(parse_bool_setting("false", "FLAG"))
        self.assertFalse(parse_bool_setting("", "FLAG"))


class SettingsTest(unittest.TestCase):
    def test_from_env_parses_timeout_and_allowlist(self) -> None:
        with patch.dict(
            os.environ,
            {
                "META_ACCESS_TOKEN": "token",
                "META_ALLOWED_AD_ACCOUNTS": "123,act_456",
                "META_REQUEST_TIMEOUT_SECONDS": "45.5",
                "META_MAX_RETRIES": "4",
                "META_RETRY_BACKOFF_SECONDS": "1.5",
                "META_LOG_FORMAT": "plain",
                "META_HTTP_BEARER_TOKEN": "http-secret",
            },
            clear=False,
        ):
            settings = Settings.from_env()

        self.assertEqual(settings.meta_access_token, "token")
        self.assertEqual(settings.allowed_ad_accounts, ("act_123", "act_456"))
        self.assertEqual(settings.request_timeout_seconds, 45.5)
        self.assertEqual(settings.max_retries, 4)
        self.assertEqual(settings.retry_backoff_seconds, 1.5)
        self.assertEqual(settings.log_format, "plain")
        self.assertEqual(settings.http_bearer_token, "http-secret")
        self.assertFalse(settings.unsafe_allow_all_ad_accounts)
        self.assertFalse(settings.unsafe_allow_unauthenticated_http)

    def test_from_env_rejects_invalid_timeout(self) -> None:
        with patch.dict(
            os.environ,
            {
                "META_REQUEST_TIMEOUT_SECONDS": "abc",
            },
            clear=False,
        ):
            with self.assertRaisesRegex(
                ValueError, "META_REQUEST_TIMEOUT_SECONDS must be a valid number"
            ):
                Settings.from_env()

    def test_validate_rejects_missing_token(self) -> None:
        settings = Settings(
            meta_access_token="",
            meta_app_secret="",
            meta_api_version="v24.0",
            allowed_ad_accounts=(),
            unsafe_allow_all_ad_accounts=False,
            request_timeout_seconds=30.0,
            max_retries=2,
            retry_backoff_seconds=1.0,
            log_format="json",
            http_bearer_token="",
            unsafe_allow_unauthenticated_http=False,
        )

        with self.assertRaisesRegex(ValueError, "META_ACCESS_TOKEN is required"):
            settings.validate()

    def test_validate_rejects_invalid_api_version(self) -> None:
        settings = Settings(
            meta_access_token="token",
            meta_app_secret="",
            meta_api_version="24.0",
            allowed_ad_accounts=(),
            unsafe_allow_all_ad_accounts=True,
            request_timeout_seconds=30.0,
            max_retries=2,
            retry_backoff_seconds=1.0,
            log_format="json",
            http_bearer_token="",
            unsafe_allow_unauthenticated_http=False,
        )

        with self.assertRaisesRegex(ValueError, "META_API_VERSION must start with 'v'"):
            settings.validate()

    def test_validate_rejects_non_positive_timeout(self) -> None:
        settings = Settings(
            meta_access_token="token",
            meta_app_secret="",
            meta_api_version="v24.0",
            allowed_ad_accounts=(),
            unsafe_allow_all_ad_accounts=True,
            request_timeout_seconds=0.0,
            max_retries=2,
            retry_backoff_seconds=1.0,
            log_format="json",
            http_bearer_token="",
            unsafe_allow_unauthenticated_http=False,
        )

        with self.assertRaisesRegex(
            ValueError, "META_REQUEST_TIMEOUT_SECONDS must be positive"
        ):
            settings.validate()

    def test_validate_rejects_negative_retries(self) -> None:
        settings = Settings(
            meta_access_token="token",
            meta_app_secret="",
            meta_api_version="v24.0",
            allowed_ad_accounts=(),
            unsafe_allow_all_ad_accounts=True,
            request_timeout_seconds=30.0,
            max_retries=-1,
            retry_backoff_seconds=1.0,
            log_format="json",
            http_bearer_token="",
            unsafe_allow_unauthenticated_http=False,
        )

        with self.assertRaisesRegex(
            ValueError, "META_MAX_RETRIES must be zero or greater"
        ):
            settings.validate()

    def test_validate_rejects_invalid_log_format(self) -> None:
        settings = Settings(
            meta_access_token="token",
            meta_app_secret="",
            meta_api_version="v24.0",
            allowed_ad_accounts=(),
            unsafe_allow_all_ad_accounts=True,
            request_timeout_seconds=30.0,
            max_retries=2,
            retry_backoff_seconds=1.0,
            log_format="xml",
            http_bearer_token="",
            unsafe_allow_unauthenticated_http=False,
        )

        with self.assertRaisesRegex(
            ValueError, "META_LOG_FORMAT must be one of: json, plain"
        ):
            settings.validate()

    def test_validate_rejects_empty_allowlist_without_override(self) -> None:
        settings = Settings(
            meta_access_token="token",
            meta_app_secret="",
            meta_api_version="v24.0",
            allowed_ad_accounts=(),
            unsafe_allow_all_ad_accounts=False,
            request_timeout_seconds=30.0,
            max_retries=2,
            retry_backoff_seconds=1.0,
            log_format="json",
            http_bearer_token="",
            unsafe_allow_unauthenticated_http=False,
        )

        with self.assertRaisesRegex(
            ValueError, "META_ALLOWED_AD_ACCOUNTS is required unless"
        ):
            settings.validate()

    def test_validate_allows_empty_allowlist_with_explicit_override(self) -> None:
        settings = Settings(
            meta_access_token="token",
            meta_app_secret="",
            meta_api_version="v24.0",
            allowed_ad_accounts=(),
            unsafe_allow_all_ad_accounts=True,
            request_timeout_seconds=30.0,
            max_retries=2,
            retry_backoff_seconds=1.0,
            log_format="json",
            http_bearer_token="",
            unsafe_allow_unauthenticated_http=False,
        )

        settings.validate()

    def test_validate_rejects_conflicting_http_auth_flags(self) -> None:
        settings = Settings(
            meta_access_token="token",
            meta_app_secret="",
            meta_api_version="v24.0",
            allowed_ad_accounts=("act_123",),
            unsafe_allow_all_ad_accounts=False,
            request_timeout_seconds=30.0,
            max_retries=2,
            retry_backoff_seconds=1.0,
            log_format="json",
            http_bearer_token="http-secret",
            unsafe_allow_unauthenticated_http=True,
        )

        with self.assertRaisesRegex(ValueError, "Use either META_HTTP_BEARER_TOKEN"):
            settings.validate()
