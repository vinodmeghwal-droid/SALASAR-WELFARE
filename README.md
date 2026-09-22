# HR Welfare Dashboard — Officer Return

An analytics dashboard for Salasar Techno Engineering's monthly **Welfare Officer Return**. The officer keeps filling in the Excel workbook on Google Drive as usual. The dashboard picks up each change within about 30 seconds and turns it into charts, KPIs and data-quality checks.

- **Module:** HR Welfare → **Sub-topic:** Officer Return
- **Views:** Annual Summary (year to date) plus one tab per month, April to March (matching the workbook tabs)
- **Sign-in:** Google OAuth, limited to an email allowlist (`ALLOWED_EMAILS`)
- **Stack:** Next.js 16 · Tailwind CSS 4 · Recharts · Motion | Node.js · Express 5 · MongoDB Atlas (Mongoose) · Google Drive API · Gemini API | Python (workbook inspection tool)

---

## Features

| Area | What you get |
|---|---|
| **Annual Summary** | 8 KPI tiles, a 12-month submission tracker, monthly trend charts (workload, headcount by gender, joinings vs separations), year-to-date breakdowns (grievances, accidents, health, training, activities), compliance meters, a KPI-by-month table, and a data-checks panel |
| **Monthly return** | Every section of the sheet (A–J) visualised: manpower movement and gender split, facility cards, health and accident charts, grievance resolution, activities, contractor compliance matrix, statutory checklist, and a training calendar |
| **Live sync** | The backend polls Drive metadata every 30 s. When the file changes it downloads, re-parses and stores the data, then pushes a Server-Sent Event, and open dashboards refresh themselves with a toast naming the changed months. A **Sync now** button forces a sync immediately. |
| **AI analysis (Gemini)** | Each view (annual and each submitted month) gets an AI card: a 0–100 health score, headline and summary, key figures, what's going well, risks and data issues ranked by severity, and prioritised actions. It uses only the numbers on the page (no names or addresses are sent), is cached per data version, and regenerates automatically when the workbook changes. It falls back across models when Gemini is overloaded. |
| **Empty months** | Months that are still blank templates show an "awaiting data" state. They fill in automatically once the officer enters data. |
| **Data checks** | Flags inconsistencies in the workbook, e.g. the manpower TOTAL row counting workers twice, the Annual Summary tab reading the wrong rows, and ambiguous dates |
| **UX** | Responsive (phone → wide desktop), light/dark/system theme, animated transitions, count-up KPIs, chart ⇄ table toggle on every chart, keyboard-navigable tabs, and a colour-blind-safe validated palette |

## Architecture

```
Browser ──► Next.js (frontend/)                         Express API (backend/)          Google Drive
            • Google OAuth (NextAuth)                     • x-api-key auth               ┌────────────────────┐
            • proxy.ts route guard                        • /api/officer-return/*        │ Welfare_Officer_   │
            • /api/backend/* proxy ── x-api-key ────────► • /api/sync, /api/events (SSE) │ Return_2026-27.xlsx│
            • SWR cache ◄── SSE "sync-completed" ◄─────── • Sync scheduler (30 s) ──────►└────────────────────┘
                                                          • Parser → KPIs → checks
                                                          • MongoDB (MonthlyReturn, WorkbookMeta, SyncState, SyncLog)
```

- The browser **never** calls the backend directly. The Next.js server checks the Google session, then forwards the request with a server-only API key (backend-for-frontend pattern).
- The workbook is an uploaded **.xlsx**, not a native Google Sheet, so the backend reads it with the **Drive API** (download and parse) rather than the Sheets API. If it is ever converted to a Google Sheet, the backend exports it as .xlsx automatically, and no code change is needed.
- The parser finds sections **by their titles, not by row numbers**, so inserted rows (as in the Sep tab) don't break anything.
- KPIs are **computed from each month's detail sections**, not taken from the workbook's own summary formulas (see [Data notes](#data-notes)).

## Project structure

```
SALASAR-Welfare/
├── backend/                 Express API + Drive sync (Node ≥ 20, ESM)
│   ├── src/
│   │   ├── server.js        bootstrap: env → DB → scheduler → listen
│   │   ├── app.js           express app (helmet, cors, auth, routes, errors)
│   │   ├── config/          env.js (zod-validated), db.js
│   │   ├── sources/         driveSource.js, localSource.js  (fetch workbook + revision)
│   │   ├── parsers/         workbookReader.js (exceljs adapter), officerReturn/ (schema + parser)
│   │   ├── domain/          officerReturn/ kpis.js, dataChecks.js, annual.js, monthRecord.js  (pure logic)
│   │   ├── services/        syncService.js (detect→parse→persist→emit), officerReturnService.js (reads)
│   │   ├── models/          Mongoose models
│   │   ├── controllers/     HTTP handlers
│   │   ├── routes/          /api router
│   │   ├── middleware/      requireApiKey, errorHandler
│   │   ├── jobs/            syncScheduler.js
│   │   └── lib/             logger, eventBus (SSE pub/sub), httpError
│   ├── scripts/             parse-file.js, sync-once.js
│   └── test/                node:test suite + real workbook fixture
├── frontend/                Next.js 16 App Router (TypeScript)
│   └── src/
│       ├── app/             routes: login, (dashboard)/hr-welfare/officer-return, api/auth, api/backend proxy
│       ├── proxy.ts         auth guard (Next 16 "proxy", formerly middleware)
│       ├── features/officer-return/   annual/, month/sections/, shared/  (feature UI)
│       ├── components/      ui/ (cards, tiles, badges, states), charts/ (Recharts wrappers), layout/, brand/
│       ├── providers/       theme, toast, live-sync (SSE)
│       ├── hooks/           SWR data hooks
│       ├── config/          navigation (modules/sub-topics), sheet tab links
│       ├── lib/             api client, auth options, formatters, chart palette
│       └── types/           API payload types
├── tools/inspect_workbook.py   dump workbook layout (debug parser issues)
├── docker-compose.yml       local MongoDB
├── CLAUDE.md                condensed guide for AI assistants
└── README.md
```

## Setup

### Prerequisites
- Node.js ≥ 20 (tested on 24), npm
- MongoDB: `docker compose up -d`, a local install, or MongoDB Atlas
- A Google Cloud project (for OAuth sign-in and Drive access)
- Python 3 + `openpyxl` (optional, only for `tools/inspect_workbook.py`)

### 1. Google Cloud
1. **Enable** the *Google Drive API*.
2. **OAuth client** (used for both sign-in and Drive sync): APIs & Services → Credentials → *Create OAuth client ID* → Web application.
   - Authorised JavaScript origin: `http://localhost:3000` (plus your production URL)
   - Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google` **and** `http://localhost:5555/oauth2callback`
   - OAuth consent screen: add `vinod.meghwal@salasartechno.com` and `ambeydeep8052@gmail.com` as test users while the app is in *Testing*.
3. **Drive access as the workbook owner.** Put the client id/secret in `backend/.env` (`GOOGLE_OAUTH_CLIENT_ID/SECRET`), then run `npm run drive:authorize` in `backend/`, open the printed URL, sign in as **vinod.meghwal@salasartechno.com**, and approve read-only Drive access. Paste the printed `GOOGLE_OAUTH_REFRESH_TOKEN` into `backend/.env` and set `DATA_SOURCE=drive`.
   *Alternative:* a service account (`…@….iam.gserviceaccount.com` + JSON key) that the workbook is shared with as Viewer.
4. **Gemini** (optional): an API key from AI Studio in `GEMINI_API_KEY`.

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in MONGODB_URI, INTERNAL_API_KEY, Drive OAuth values, GEMINI_API_KEY
npm install
npm test                    # parser/KPI tests against the real workbook
npm run dev                 # http://localhost:4000  (GET /health)
```
Offline development without Drive: set `DATA_SOURCE=local` and `LOCAL_WORKBOOK_PATH=test/fixtures/officer-return-2026-27.xlsx`. Edit that file and the dashboard updates.

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local  # NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET, BACKEND_API_KEY (= backend INTERNAL_API_KEY)
npm install
npm run dev                 # http://localhost:3000
```

### Environment variables

| Backend (`backend/.env`) | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `INTERNAL_API_KEY` | Shared secret with the frontend (≥ 16 chars) |
| `DATA_SOURCE` | `drive` (default) or `local` |
| `DRIVE_FILE_ID` | Workbook file id (defaults to the 2026-27 workbook) |
| `GOOGLE_OAUTH_CLIENT_ID` / `_CLIENT_SECRET` / `_REFRESH_TOKEN` | Drive access as the file owner (`npm run drive:authorize`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `_PRIVATE_KEY` / `_KEY_FILE` | Alternative: service-account credentials |
| `SYNC_INTERVAL_SECONDS` | Poll interval (default 30, min 10) |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS` | AI analysis (optional; default model `gemini-flash-latest` + fallbacks) |
| `CORS_ORIGIN`, `PORT` | Server settings |

| Frontend (`frontend/.env.local`) | Purpose |
|---|---|
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth config |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth client |
| `ALLOWED_EMAILS`, `ALLOWED_EMAIL_DOMAINS` | Sign-in allowlist. Currently the two named accounts only; empty lists = nobody |
| `ENABLE_DIRECT_SIGNIN` | `true` enables password-less sign-in as the first allowed email, **local development only** (ignored in production builds) |
| `BACKEND_URL`, `BACKEND_API_KEY` | Where the proxy forwards to, and the shared key |

## API

All `/api/*` routes need the `x-api-key` header. The browser reaches them through `/api/backend/*` on the frontend.

| Method | Path | Returns |
|---|---|---|
| GET | `/health` | DB readiness (no auth) |
| GET | `/api/officer-return/years` | Financial years available |
| GET | `/api/officer-return/overview?fy=` | Annual view: KPIs, trend, breakdowns, checks |
| GET | `/api/officer-return/months/:month?fy=` | One month (`apr`…`mar`): parsed sections + KPIs + checks |
| GET | `/api/officer-return/insights?period=annual\|sep&refresh=1` | Gemini analysis (cached per data hash; `refresh=1` regenerates) |
| GET | `/api/sync/status` | Source, last check/sync/change, error, history |
| POST | `/api/sync` `{ force? }` | Sync now |
| GET | `/api/events` | SSE: `sync-started`, `sync-completed`, `sync-failed` |

## Data notes

Checks of the 2026-27 workbook turned up these issues. The dashboard works around them and lists them in its **Data checks** panel:

1. **Manpower TOTAL row counts workers twice.** It sums the employment-type rows *and* the gender rows (Sep: 248 instead of 124). The dashboard uses the employment-type rows.
2. **The Annual Summary tab reads the wrong cells for Sep.** The Sep tab has an extra "Observation" row under the accident statement, so the tab's fixed references (`=Sep!B108` …) point one row off (e.g. Grievances Received shows 11; the real figure is 7). The dashboard computes from each month's sections instead.
3. **Header "Total Workers" (700)** differs from the manpower statement (124). This may be intentional (all staff vs workers covered by the return), so it is flagged as a note, not a warning.
4. **Training dates**: some Sep dates were entered as `05-10-2026` and Excel read them as 10 May (month-day). Entering dates as `05-Oct-2026` avoids this.

## Adding things

- **A new sub-topic** under HR Welfare: add it to `frontend/src/config/navigation.ts` and create `frontend/src/app/(dashboard)/hr-welfare/<slug>/page.tsx`.
- **A new workbook field**: extend `backend/src/parsers/officerReturn/schema.js` (header or section matcher), compute it in `domain/officerReturn/kpis.js`, add it to `frontend/src/types/officer-return.ts`, then render it.
- **A new financial year**: point `DRIVE_FILE_ID` at the new workbook. Data is stored per FY, and `?fy=` selects one.

## Production notes

- Run the backend as a single instance (the in-process event bus and scheduler assume one). To scale out, move the scheduler to one worker and replace `lib/eventBus.js` with Redis pub/sub or MongoDB change streams.
- The proxy streams SSE. If a reverse proxy (nginx) sits in front, disable buffering for `/api/backend/events`.
- For instant updates instead of 30 s polling, Drive push notifications (`files.watch`) can call a webhook that triggers `syncService.sync({ trigger: 'webhook' })`. This needs a public HTTPS URL and channel renewal.
