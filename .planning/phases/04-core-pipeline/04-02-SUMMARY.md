# Summary 04-02: Keyword Research Module

**Phase:** 04 - Core Pipeline
**Status:** ✅ Implemented
**Date:** 2026-04-03

## Files Created

- `src/core/keyword-research.js` — Keyword research module

## Files Modified

- `src/cli/commands/plan.js` — Updated to use keyword-research module

## What Was Built

- `findKeywordGaps(mainSiteKeywords, competitorData)` — Identifies keywords competitors rank for that main site misses
- `prioritizeKeywords(gaps, options)` — Scores and sorts by funnel stage (awareness/consideration/decision)
- `runKeywordResearch()` — Orchestrates research using stored competitor data
- `plan --keywords [--count N]` CLI command

## Funnel Stage Scoring

- AWARENESS: what is, how to, guide, tutorial → score 1x
- CONSIDERATION: vs, compare, review, best → score 2x
- DECISION: buy, price, cost, discount → score 3x

## Verification

- `node src/cli/index.js plan --keywords --count 5` outputs prioritized keywords
