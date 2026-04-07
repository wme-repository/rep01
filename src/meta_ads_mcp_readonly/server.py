from __future__ import annotations

import argparse
import json
import logging

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

from .config import Settings
from .meta_api import GraphApiClient, ensure_allowed_account


load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = Settings.from_env()
client = GraphApiClient(settings)
mcp = FastMCP("meta-ads-readonly")


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
    return [item.strip() for item in value.split(",") if item.strip()]


@mcp.tool()
async def get_ad_accounts(user_id: str = "me", limit: int = 100) -> str:
    if user_id != "me":
        return to_json(
            {
                "error": {
                    "message": "Only user_id='me' is supported in v1",
                }
            }
        )

    payload = await client.get(
        f"{user_id}/adaccounts",
        {"fields": ACCOUNT_FIELDS, "limit": limit},
    )
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
    try:
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
    try:
        normalized_account_id = ensure_allowed_account(settings, account_id)
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
    try:
        normalized_account_id = ensure_allowed_account(settings, account_id)
    except ValueError as exc:
        return to_json({"error": {"message": str(exc)}})

    params: dict[str, object] = {"fields": AD_FIELDS, "limit": limit}

    if campaign_id:
        params["campaign_id"] = campaign_id

    if adset_id:
        params["adset_id"] = adset_id

    if after:
        params["after"] = after

    payload = await client.get(f"{normalized_account_id}/ads", params)
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

    logger.info("starting meta-ads-readonly transport=%s", args.transport)
    logger.info("allowlisted_accounts=%s", settings.allowed_ad_accounts)

    if args.transport == "streamable-http":
        mcp.settings.host = args.host
        mcp.settings.port = args.port
        mcp.settings.stateless_http = True
        mcp.settings.json_response = True
        mcp.run(transport="streamable-http")
        return

    mcp.run(transport="stdio")
