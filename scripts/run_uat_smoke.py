from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
import sys
from typing import Any

from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

load_dotenv(ROOT / ".env")

from meta_ads_mcp_readonly import server  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run read-only UAT smoke checks against Meta Ads"
    )
    parser.add_argument("--account-id", default="", help="Allowlisted ad account ID")
    parser.add_argument("--campaign-id", default="", help="Optional campaign ID")
    parser.add_argument("--adset-id", default="", help="Optional ad set ID")
    parser.add_argument("--ad-id", default="", help="Optional ad ID")
    parser.add_argument("--limit", type=int, default=5, help="Page size for list calls")
    parser.add_argument(
        "--date-preset",
        default="last_30d",
        help="Meta date_preset for insights calls",
    )
    parser.add_argument(
        "--time-increment",
        default="all_days",
        help="Meta time_increment for insights calls",
    )
    return parser.parse_args()


def load_target_ids(args: argparse.Namespace) -> dict[str, str]:
    def value(cli_value: str, env_name: str) -> str:
        if cli_value.strip():
            return cli_value.strip()
        return str(os.environ.get(env_name, "")).strip()

    return {
        "account_id": value(args.account_id, "META_UAT_ACCOUNT_ID"),
        "campaign_id": value(args.campaign_id, "META_UAT_CAMPAIGN_ID"),
        "adset_id": value(args.adset_id, "META_UAT_ADSET_ID"),
        "ad_id": value(args.ad_id, "META_UAT_AD_ID"),
    }


def has_error(payload: Any) -> bool:
    return isinstance(payload, dict) and isinstance(payload.get("error"), dict)


async def run() -> int:
    args = parse_args()
    target_ids = load_target_ids(args)

    try:
        server.reset_runtime_state()
        server.get_settings()
    except Exception as exc:  # pragma: no cover - exercised manually
        print(
            json.dumps(
                {
                    "error": {
                        "message": "Server configuration validation failed",
                        "details": str(exc),
                    }
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        return 1

    results: dict[str, Any] = {}
    exit_code = 0

    results["get_ad_accounts"] = json.loads(
        await server.get_ad_accounts(limit=args.limit)
    )
    if has_error(results["get_ad_accounts"]):
        exit_code = 1

    account_id = target_ids["account_id"]
    if account_id:
        results["get_campaigns"] = json.loads(
            await server.get_campaigns(account_id=account_id, limit=args.limit)
        )
        results["get_adsets"] = json.loads(
            await server.get_adsets(account_id=account_id, limit=args.limit)
        )
        results["get_ads"] = json.loads(
            await server.get_ads(account_id=account_id, limit=args.limit)
        )
        results["get_insights_account"] = json.loads(
            await server.get_insights(
                object_id=account_id,
                level="account",
                limit=args.limit,
                date_preset=args.date_preset,
                time_increment=args.time_increment,
            )
        )

    campaign_id = target_ids["campaign_id"]
    if account_id and campaign_id:
        results["get_adsets_for_campaign"] = json.loads(
            await server.get_adsets(
                account_id=account_id,
                campaign_id=campaign_id,
                limit=args.limit,
            )
        )
        results["get_ads_for_campaign"] = json.loads(
            await server.get_ads(
                account_id=account_id,
                campaign_id=campaign_id,
                limit=args.limit,
            )
        )
        results["get_insights_campaign"] = json.loads(
            await server.get_insights(
                object_id=campaign_id,
                level="campaign",
                limit=args.limit,
                date_preset=args.date_preset,
                time_increment=args.time_increment,
            )
        )

    adset_id = target_ids["adset_id"]
    if account_id and adset_id:
        results["get_ads_for_adset"] = json.loads(
            await server.get_ads(
                account_id=account_id,
                adset_id=adset_id,
                limit=args.limit,
            )
        )
        results["get_insights_adset"] = json.loads(
            await server.get_insights(
                object_id=adset_id,
                level="adset",
                limit=args.limit,
                date_preset=args.date_preset,
                time_increment=args.time_increment,
            )
        )

    ad_id = target_ids["ad_id"]
    if ad_id:
        results["get_insights_ad"] = json.loads(
            await server.get_insights(
                object_id=ad_id,
                level="ad",
                limit=args.limit,
                date_preset=args.date_preset,
                time_increment=args.time_increment,
            )
        )

    for payload in results.values():
        if has_error(payload):
            exit_code = 1
            break

    print(json.dumps(results, indent=2, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
