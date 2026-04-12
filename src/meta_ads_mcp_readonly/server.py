from __future__ import annotations

import argparse
from contextlib import asynccontextmanager
import hmac
import json
import logging
import re
from typing import Any

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount
import uvicorn

from .config import Settings
from .meta_api import (
    GraphApiClient,
    ensure_allowed_account,
    ensure_object_belongs_to_account,
    ensure_object_is_allowlisted,
)


load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
mcp = FastMCP("meta-ads-readonly")
_settings: Settings | None = None
_client: GraphApiClient | None = None
_sensitive_filter: "SensitiveValueFilter | None" = None
MAX_PAGE_LIMIT = 500
LOOPBACK_HOSTS = {"127.0.0.1", "::1", "localhost"}
_STANDARD_LOG_RECORD_KEYS = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "message",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
    "taskName",
}


class BearerTokenAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, bearer_token: str):
        super().__init__(app)
        self._expected_header = f"Bearer {bearer_token}"

    async def dispatch(self, request: Request, call_next: Any) -> Any:
        authorization = request.headers.get("authorization", "")
        if not hmac.compare_digest(authorization, self._expected_header):
            return JSONResponse(
                {"error": {"message": "Missing or invalid bearer token"}},
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )
        return await call_next(request)


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        event = getattr(record, "event", None)
        if event:
            payload["event"] = event

        for key, value in record.__dict__.items():
            if key in _STANDARD_LOG_RECORD_KEYS or key.startswith("_"):
                continue
            payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=False, default=str)


class SensitiveValueFilter(logging.Filter):
    """Replaces sensitive values in log messages with masked versions."""

    def __init__(self, name: str, sensitive_values: dict[str, str]):
        super().__init__(name)
        self._patterns: list[tuple[re.Pattern[str], str]] = []
        for key, value in sensitive_values.items():
            if value and len(value) > 4:
                suffix = value[-4:]
                pattern = re.compile(re.escape(value))
                self._patterns.append((pattern, f"[REDACTED-{key}-{suffix}]"))

    def _mask(self, value: Any) -> Any:
        if isinstance(value, str):
            masked = value
            for pattern, replacement in self._patterns:
                masked = pattern.sub(replacement, masked)
            return masked
        if isinstance(value, tuple):
            return tuple(self._mask(item) for item in value)
        if isinstance(value, list):
            return [self._mask(item) for item in value]
        if isinstance(value, dict):
            return {key: self._mask(item) for key, item in value.items()}
        return value

    def filter(self, record: logging.LogRecord) -> bool:
        if not self._patterns:
            return True
        record.msg = self._mask(record.msg)
        record.args = self._mask(record.args)
        for key, value in list(record.__dict__.items()):
            if key in _STANDARD_LOG_RECORD_KEYS or key.startswith("_"):
                continue
            record.__dict__[key] = self._mask(value)
        return True


def _iter_all_loggers() -> list[logging.Logger]:
    loggers: list[logging.Logger] = [logging.getLogger()]
    for logger in logging.root.manager.loggerDict.values():
        if isinstance(logger, logging.Logger):
            loggers.append(logger)
    return loggers


def configure_logging(settings: Settings) -> None:
    global _sensitive_filter

    root_logger = logging.getLogger()
    if not root_logger.handlers:
        root_logger.addHandler(logging.StreamHandler())

    formatter: logging.Formatter
    if settings.log_format == "plain":
        formatter = logging.Formatter("%(levelname)s:%(name)s:%(message)s")
    else:
        formatter = JsonLogFormatter()

    for handler in root_logger.handlers:
        handler.setFormatter(formatter)

    if _sensitive_filter is not None:
        for logger in _iter_all_loggers():
            logger.removeFilter(_sensitive_filter)
            for handler in logger.handlers:
                handler.removeFilter(_sensitive_filter)
        _sensitive_filter = None

    # Third-party request loggers can include full URLs; keep them quiet by default.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    if not settings.meta_access_token:
        return

    sensitive_values = {"access_token": settings.meta_access_token}
    appsecret_proof = settings.build_appsecret_proof()
    if appsecret_proof:
        sensitive_values["appsecret_proof"] = appsecret_proof

    _sensitive_filter = SensitiveValueFilter(
        "sensitive_filter",
        sensitive_values,
    )
    for logger in _iter_all_loggers():
        logger.addFilter(_sensitive_filter)
        for handler in logger.handlers:
            handler.addFilter(_sensitive_filter)


def get_settings() -> Settings:
    global _settings

    if _settings is None:
        settings = Settings.from_env()
        settings.validate()
        configure_logging(settings)
        _settings = settings
    return _settings


def get_client() -> GraphApiClient:
    global _client

    if _client is None:
        _client = GraphApiClient(get_settings())
    return _client


def reset_runtime_state() -> None:
    global _settings, _client

    _settings = None
    _client = None
    configure_logging(
        Settings(
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
    )


def is_loopback_host(host: str) -> bool:
    return str(host or "").strip().lower() in LOOPBACK_HOSTS


def validate_streamable_http_settings(settings: Settings, host: str) -> None:
    if settings.http_bearer_token:
        return

    if settings.unsafe_allow_unauthenticated_http:
        if not is_loopback_host(host):
            raise ValueError(
                "META_UNSAFE_ALLOW_UNAUTHENTICATED_HTTP=true is only allowed "
                "with localhost, 127.0.0.1, or ::1"
            )
        return

    raise ValueError(
        "META_HTTP_BEARER_TOKEN is required for streamable-http. "
        "Use META_UNSAFE_ALLOW_UNAUTHENTICATED_HTTP=true only for explicit "
        "localhost-only testing."
    )


@asynccontextmanager
async def mcp_http_lifespan(_: Starlette) -> Any:
    async with mcp.session_manager.run():
        yield


def create_streamable_http_app(settings: Settings) -> Starlette:
    middleware: list[Middleware] = []
    if settings.http_bearer_token:
        middleware.append(
            Middleware(
                BearerTokenAuthMiddleware,
                bearer_token=settings.http_bearer_token,
            )
        )

    return Starlette(
        routes=[Mount("/", app=mcp.streamable_http_app())],
        middleware=middleware,
        lifespan=mcp_http_lifespan,
    )


CAMPAIGN_FIELDS = (
    "id,name,objective,status,daily_budget,lifetime_budget,buying_type,"
    "start_time,stop_time,created_time,updated_time,bid_strategy,"
    "special_ad_categories"
)

ADSET_FIELDS = (
    "id,name,campaign_id,status,daily_budget,lifetime_budget,targeting,bid_amount,"
    "bid_strategy,bid_constraints,optimization_goal,billing_event,start_time,"
    "end_time,created_time,updated_time,is_dynamic_creative"
)

AD_FIELDS = (
    "id,name,adset_id,campaign_id,status,creative,created_time,updated_time,"
    "bid_amount,preview_shareable_link"
)

ACCOUNT_FIELDS = (
    "id,account_id,name,account_status,amount_spent,balance,currency,"
    "timezone_name,business_country_code"
)

DEFAULT_INSIGHTS_FIELDS = "impressions,reach,clicks,spend,cpm,cpc,ctr"


def to_json(payload: dict) -> str:
    return json.dumps(payload, indent=2, ensure_ascii=False)


def parse_csv_list(value: str) -> list[str]:
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def validate_limit(limit: int) -> int:
    if isinstance(limit, bool) or not isinstance(limit, int):
        raise ValueError("limit must be an integer")
    if limit < 1 or limit > MAX_PAGE_LIMIT:
        raise ValueError(f"limit must be between 1 and {MAX_PAGE_LIMIT}")
    return limit


def normalize_cursor(cursor: str) -> str:
    return str(cursor or "").strip()


@mcp.tool()
async def get_ad_accounts(user_id: str = "me", limit: int = 100, after: str = "") -> str:
    settings = get_settings()
    client = get_client()
    after = normalize_cursor(after)
    try:
        limit = validate_limit(limit)
    except ValueError as exc:
        return to_json({"error": {"message": str(exc)}})
    if user_id != "me":
        return to_json(
            {
                "error": {
                    "message": "Only user_id='me' is supported in v1",
                }
            }
        )

    params: dict[str, object] = {"fields": ACCOUNT_FIELDS, "limit": limit}
    if after:
        params["after"] = after

    payload = await client.get(f"{user_id}/adaccounts", params)
    if settings.allowed_ad_accounts and "data" in payload and isinstance(payload["data"], list):
        payload["data"] = [
            account
            for account in payload["data"]
            if account.get("id") in settings.allowed_ad_accounts
            or f"act_{account.get('account_id')}" in settings.allowed_ad_accounts
        ]
    return to_json(payload)


@mcp.tool()
async def get_campaigns(
    account_id: str,
    limit: int = 25,
    status_filter: str = "",
    objective_filter: str = "",
    after: str = "",
) -> str:
    settings = get_settings()
    client = get_client()
    after = normalize_cursor(after)
    status_filter = str(status_filter or "").strip()
    try:
        limit = validate_limit(limit)
        normalized_account_id = ensure_allowed_account(settings, account_id)
    except ValueError as exc:
        return to_json({"error": {"message": str(exc)}})

    params: dict[str, object] = {"fields": CAMPAIGN_FIELDS, "limit": limit}

    if status_filter:
        params["effective_status"] = [status_filter]

    objective_values = parse_csv_list(objective_filter)
    if objective_values:
        params["filtering"] = [
            {
                "field": "objective",
                "operator": "IN",
                "value": objective_values,
            }
        ]

    if after:
        params["after"] = after

    payload = await client.get(f"{normalized_account_id}/campaigns", params)
    return to_json(payload)


@mcp.tool()
async def get_adsets(
    account_id: str,
    limit: int = 25,
    campaign_id: str = "",
    after: str = "",
) -> str:
    settings = get_settings()
    client = get_client()
    after = normalize_cursor(after)
    try:
        limit = validate_limit(limit)
        normalized_account_id = ensure_allowed_account(settings, account_id)
        if campaign_id:
            campaign_id = await ensure_object_belongs_to_account(
                client,
                settings,
                campaign_id,
                normalized_account_id,
                "campaign_id",
            )
    except ValueError as exc:
        return to_json({"error": {"message": str(exc)}})

    endpoint = f"{campaign_id}/adsets" if campaign_id else f"{normalized_account_id}/adsets"
    params: dict[str, object] = {"fields": ADSET_FIELDS, "limit": limit}
    if after:
        params["after"] = after

    payload = await client.get(endpoint, params)
    return to_json(payload)


@mcp.tool()
async def get_ads(
    account_id: str,
    limit: int = 25,
    campaign_id: str = "",
    adset_id: str = "",
    after: str = "",
) -> str:
    settings = get_settings()
    client = get_client()
    after = normalize_cursor(after)
    try:
        limit = validate_limit(limit)
        normalized_account_id = ensure_allowed_account(settings, account_id)
        if campaign_id:
            campaign_id = await ensure_object_belongs_to_account(
                client,
                settings,
                campaign_id,
                normalized_account_id,
                "campaign_id",
            )
        if adset_id:
            adset_id = await ensure_object_belongs_to_account(
                client,
                settings,
                adset_id,
                normalized_account_id,
                "adset_id",
            )
    except ValueError as exc:
        return to_json({"error": {"message": str(exc)}})

    params: dict[str, object] = {"fields": AD_FIELDS, "limit": limit}
    if adset_id:
        endpoint = f"{adset_id}/ads"
    elif campaign_id:
        endpoint = f"{campaign_id}/ads"
    else:
        endpoint = f"{normalized_account_id}/ads"

    if after:
        params["after"] = after

    payload = await client.get(endpoint, params)
    return to_json(payload)


@mcp.tool()
async def get_insights(
    object_id: str,
    date_preset: str = "last_30d",
    fields: str = DEFAULT_INSIGHTS_FIELDS,
    time_increment: str = "all_days",
    level: str = "account",
    limit: int = 100,
    after: str = "",
) -> str:
    settings = get_settings()
    client = get_client()
    after = normalize_cursor(after)
    fields = str(fields or "").strip() or DEFAULT_INSIGHTS_FIELDS
    level = str(level or "account").strip().lower() or "account"
    date_preset = str(date_preset or "last_30d").strip() or "last_30d"
    time_increment = str(time_increment or "all_days").strip() or "all_days"
    try:
        limit = validate_limit(limit)
    except ValueError as exc:
        return to_json({"error": {"message": str(exc)}})

    if level == "account":
        try:
            object_id = ensure_allowed_account(settings, object_id)
        except ValueError as exc:
            return to_json({"error": {"message": str(exc)}})

    if level not in {"account", "campaign", "adset", "ad"}:
        return to_json(
            {
                "error": {
                    "message": "level must be one of: account, campaign, adset, ad",
                }
            }
        )

    if level != "account":
        try:
            object_id = await ensure_object_is_allowlisted(
                client,
                settings,
                object_id,
                f"{level}_id",
            )
        except ValueError as exc:
            return to_json({"error": {"message": str(exc)}})

    params: dict[str, object] = {
        "date_preset": date_preset,
        "fields": fields,
        "time_increment": time_increment,
        "level": level,
        "limit": limit,
    }
    if after:
        params["after"] = after

    payload = await client.get(f"{object_id}/insights", params)
    return to_json(payload)


def main() -> None:
    parser = argparse.ArgumentParser(description="Meta Ads MCP Read-Only")
    parser.add_argument(
        "--transport",
        choices=["stdio", "streamable-http"],
        default="stdio",
    )
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    settings = get_settings()
    logger.info(
        "server_start",
        extra={
            "event": "server_start",
            "transport": args.transport,
            "allowlisted_accounts": settings.allowed_ad_accounts,
        },
    )

    if args.transport == "streamable-http":
        validate_streamable_http_settings(settings, args.host)
        mcp.settings.host = args.host
        mcp.settings.port = args.port
        mcp.settings.stateless_http = True
        mcp.settings.json_response = True
        app = create_streamable_http_app(settings)
        logger.info(
            "server_http_ready",
            extra={
                "event": "server_http_ready",
                "host": args.host,
                "port": args.port,
                "auth_mode": (
                    "bearer"
                    if settings.http_bearer_token
                    else "unauthenticated-localhost-override"
                ),
            },
        )
        uvicorn.run(app, host=args.host, port=args.port)
        return

    mcp.run(transport="stdio")
