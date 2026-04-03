# Summary 06-01: Weekly Runner Orchestration

**Phase:** 06 - Weekly Runner
**Status:** ✅ Implemented
**Date:** 2026-04-03

## Files Created

- `src/core/runners.js` — Pipeline orchestration module

## What Was Built

- `runWeeklyBlog(options)` — Full blog pipeline: analyze → keywords → calendar → generate → publish
- `runWeeklySocial(options)` — Social pipeline: RSS → generate → publish social
- Step-by-step progress output with ✓/✗ indicators
- Structured results: { success, steps[], errors[] }
- DRY_RUN support for all steps

## Commands

- `run-weekly --blog [--dry-run]` — Run blog pipeline
- `run-weekly --social [--dry-run]` — Run social pipeline
- `run-weekly --all [--dry-run]` — Run both pipelines

## Verification

- `DRY_RUN=true node src/cli/index.js run-weekly --blog` — step-by-step output
- `DRY_RUN=true node src/cli/index.js run-weekly --social` — step-by-step output
