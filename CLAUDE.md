# CLAUDE.md

HR Welfare dashboard → sub-topic "Officer Return". Visualises the monthly Welfare Officer Return workbook (.xlsx on Google Drive), synced live. Two apps plus one tool; no shared packages.

## Map
- `backend/` Node ≥20 ESM, Express 5, Mongoose 9, exceljs, @googleapis/drive, zod. Plain JS.
  - Flow: `jobs/syncScheduler` → `services/syncService.sync()` → `sources/*.getMetadata()` (revision) → if changed `download()` → `parsers/officerReturn/index.parseOfficerReturnWorkbook(buf)` → `domain/officerReturn/monthRecord.buildMonthRecord` (kpis + checks + contentHash) → Mongo upsert → `lib/eventBus` emit → SSE `/api/events`.
  - Reads: `services/officerReturnService` → `domain/officerReturn/annual.buildAnnualOverview` (computed per request from the 12 MonthlyReturn docs).
  - `parsers/officerReturn/schema.js` = all workbook knowledge (month order, section title regexes, header→field map, numeric/date fields). Edit here first when the sheet changes.
  - `domain/` is pure (no I/O); unit-tested in `test/officerReturn.test.js` against `test/fixtures/officer-return-2026-27.xlsx`.
  - AI: `services/insightService` → `domain/officerReturn/insightPrompt` (system prompt, JSON schema, aggregated context, no names/addresses) → `lib/gemini` (REST, structured output, falls back across `GEMINI_MODEL` + `GEMINI_FALLBACK_MODELS` on 429/5xx/404) → cached in `AiInsight` by `hashOf(context)`. `GET /api/officer-return/insights?period=`.
  - Drive auth: `sources/driveSource` uses an OAuth refresh token for the file owner (`scripts/authorize-drive.js`, `npm run drive:authorize`) if `GOOGLE_OAUTH_*` are set, else a service account.
  - `parsers/workbookReader` retries without `xl/drawings/*` when exceljs chokes on drawing parts. Manpower `closing` is derived when its formula has no cached value.
- `frontend/` Next 16 App Router, TS, Tailwind 4 (CSS-first, tokens in `src/app/globals.css`), next-auth v4 (Google), SWR, Recharts 3, motion (`motion/react`), lucide-react.
  - Browser → `/api/backend/[...path]` (session check, adds `x-api-key`, streams) → backend. Never call the backend from the client directly.
  - `src/proxy.ts` = Next 16 middleware (auth redirect). `src/lib/auth.ts` = NextAuth options + email allowlist (fails closed when empty). Credentials "Direct sign-in" exists only when `ENABLE_DIRECT_SIGNIN=true` AND not production, and still checks the allowlist. Never add a hardcoded secret fallback.
  - AI card: `features/officer-return/shared/ai-insights-card.tsx` (`useInsights(period)`), placed after the KPI tiles in annual and month views.
  - Page: `app/(dashboard)/hr-welfare/officer-return/page.tsx` → `features/officer-return/officer-return-dashboard.tsx` (period state ↔ `?period=`), `annual/*`, `month/month-view.tsx` + `month/sections/*`.
  - Live updates: `providers/live-sync-provider.tsx` (EventSource → `mutate(isBackendKey)` + toast).
  - Charts: `components/charts/{bar-chart,month-columns,donut-chart,chart-card}.tsx`. Colors from `lib/chart-palette.ts` via `useChartPalette()` (literal hex; SVG attrs can't use CSS vars).
  - Nav/sub-topics: `config/navigation.ts`. Sheet tab gids: `config/sheet-links.ts`.
- `tools/inspect_workbook.py` prints section row positions per sheet (finds layout drift).

## Domain rules (don't regress)
- FY months are Apr→Mar (`monthIndex` 0 = Apr). Jan–Mar belong to FY start year + 1.
- Locate sections by title regex, never by row number (Sep has an extra row after section D).
- Headcount = sum of manpower rows with `group:'type'` (Permanent/Contract/Temporary/Apprentice). Gender rows are a second breakdown of the same people. The sheet's TOTAL row double counts them, so never use it.
- KPIs come from detail sections, not from sheet section J or the "Annual Summary" tab (its formulas use fixed refs and break when rows shift). Disagreements become `checks`.
- `safetyIncidents` = all accident rows except compensation/claim (matches sheet J "Accidents"). `inspections` = activities whose label contains "inspection".
- `hasData` is based on numbers or named contractors only (template pre-fills header text and "Complied"/"Yes"). Blank months: trend values are `null` (gaps, not zeros), UI shows the "awaiting data" state.
- Placeholder text ("Enter key observations…") is ignored.

## Conventions
- Backend: ESM, named exports, factories (`createX({deps})`) for services with deps, pure functions in `domain/`. Errors: throw `HttpError`; Express 5 forwards async errors to `middleware/errorHandler`.
- Frontend: `'use client'` only where needed; features in `features/<topic>/`, reusable UI in `components/`. Types mirror the backend in `types/officer-return.ts`, so update both together.
- Charts (dataviz rules): categorical slots assigned in fixed order (series 0,1,2,3), ≤4 series, no dual axes, max bar 24px, rounded data-end, legend only for ≥2 series, every ChartCard gets a `table` (accessible view). Status colors (good/warning/critical) always with icon + text (`components/ui/badge.tsx`).
- Dark mode: `[data-theme=dark]` on `<html>`, set pre-paint by `themeInitScript`; Tailwind `dark:` variant is bound to it.

## Commands
```
backend:  npm run dev | npm test | npm run parse:file -- <xlsx> [sep] | npm run sync:once
frontend: npm run dev | npm run build | npm run typecheck
python tools/inspect_workbook.py <xlsx> [SheetName]
docker compose up -d   # local MongoDB
```

## Env
backend/.env: MONGODB_URI (Atlas, db `hr-welfare`), INTERNAL_API_KEY, DATA_SOURCE(drive|local), DRIVE_FILE_ID, GOOGLE_OAUTH_CLIENT_ID/_SECRET/_REFRESH_TOKEN (or GOOGLE_SERVICE_ACCOUNT_*), LOCAL_WORKBOOK_PATH, SYNC_INTERVAL_SECONDS, GEMINI_API_KEY, GEMINI_MODEL, GEMINI_FALLBACK_MODELS.
frontend/.env.local: NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, ALLOWED_EMAILS (vinod.meghwal@salasartechno.com, ambeydeep8052@gmail.com), ALLOWED_EMAIL_DOMAINS, ENABLE_DIRECT_SIGNIN, BACKEND_URL, BACKEND_API_KEY (= INTERNAL_API_KEY).
Workbook owner = vinod.meghwal@salasartechno.com (a user account, not a service account).

## Adding a field end-to-end
schema.js (map header/label) → kpis.js (compute) → annual.js TREND_KPIS/FLOW_KPIS if trended → test → types/officer-return.ts → UI section.
