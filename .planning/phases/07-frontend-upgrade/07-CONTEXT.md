# Phase 7: Frontend Upgrade - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Source:** User requirements

<domain>
## Phase Boundary

Frontend dashboard upgrade with:
1. Modern visual design (Tailwind CSS)
2. Settings form to edit .env variables (competitor URLs, credentials, etc.)
3. Keep existing functionality (Dashboard, Pipeline, Articles, Health tabs)
</domain>

<decisions>
## Implementation Decisions

### Stack
- Tailwind CSS for styling (keep Vite + React 19)
- shadcn/ui components for accessibility
- React Hook Form for settings form

### Settings Form Requirements
- Read .env file from server
- Edit environment variables via API endpoint
- Categories: API Keys (Arvo, WordPress, Blotado), Competitor URLs, General Settings
- Save writes back to .env file via server endpoint
- Input validation per variable type (URLs, tokens, etc.)

### Visual Design
- Dark theme (current style) with Tailwind slate/zinc palette
- Modern cards with subtle borders and shadows
- Responsive layout (mobile-friendly)
- Consistent spacing using Tailwind's 4px grid

### Architecture
- API endpoint: GET/PUT /api/settings for .env read/write
- Frontend: Settings tab alongside existing tabs
- Form auto-save with confirmation

### Claude's Discretion
- Whether to use React Query or keep simple useEffect
- How to structure the .env parsing/serialization on server
- Modal vs inline editing for settings
</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Project Files
- `frontend/src/App.jsx` — current app structure
- `frontend/src/components/` — existing components
- `src/server/index.js` — Express server (need to add settings endpoint)
- `.env.example` — environment variables template
</canonical_refs>

<specifics>
## Specific Ideas

**Competitor URLs to add:**
- Site URL principal
- 2-3 URLs de concorrentes para análise

**API Keys to manage:**
- ARVO_API_KEY
- WORDPRESS_URL, WORDPRESS_USERNAME, WORDPRESS_PASSWORD
- BLOTADO_API_KEY

**Form structure:**
- Tabs dentro de Settings: "Geral", "Competidores", "APIs"
</specifics>

<deferred>
## Deferred Ideas

None — scope is well defined
</deferred>

---

*Phase: 07-frontend-upgrade*
*Context gathered: 2026-04-03*
