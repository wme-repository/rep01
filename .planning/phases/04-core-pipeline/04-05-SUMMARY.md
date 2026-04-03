# Summary 04-05: WordPress Publishing Adapter

**Phase:** 04 - Core Pipeline
**Status:** ✅ Implemented
**Date:** 2026-04-03

## Files Created

- `src/integrations/wordpress.js` — WordPress REST API integration

## Files Modified

- `src/cli/commands/publish.js` — Updated to use WordPress adapter

## What Was Built

- `publishArticle(article, options)` — Publishes to WordPress via REST API
- `publishFromCalendar(options)` — Batch publishes all generated articles
- WordPress REST API with Basic Auth (user:app_password)
- PUBLISH_MODE env var controls draft vs publish
- Idempotency via store: same articleId won't publish twice
- `publish --article [--id X] [--dry-run]` CLI command
- `publish --all [--dry-run]` CLI command

## Features

- --dry-run outputs preview without publishing (bypasses WP config requirement)
- Idempotent: checks store before publishing
- Status stored in calendar entry after publish

## Verification

- `node src/cli/index.js publish --article --id X --dry-run` shows preview
