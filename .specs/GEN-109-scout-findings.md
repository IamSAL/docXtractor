# Scout: docXtractor Playwright Integration Findings

**Issue**: GEN-116  
**Parent**: GEN-109 (Playwright 100% Coverage)  
**Scope**: Route inventory, auth strategy, LLM mocking, backend dep, seed data, vite config  
**Findings Date**: 2026-06-02

---

## 1. Route → File Confirmation

All 39 routes exist. Auth pages + public routes redirect to `/dashboard` if authenticated. No `beforeLoad` guards — auth is app-level via `useRedirectIfAuthenticated()` hook.

**Auth Routes (unauthenticated only)**
- `/login` → `client/src/routes/login.tsx`
- `/signup` → `client/src/routes/signup.tsx`
- `/setup` → `client/src/routes/setup.tsx` (first-run admin setup)
- `/invite.$token` → `client/src/routes/invite.$token.tsx` (invite link verification)
- `/auth/verify` → `client/src/routes/auth/verify.tsx`
- `/auth/callback` → `client/src/routes/auth/callback.tsx` (Google OAuth callback)

**Core App Routes (authenticated + must be after dashboard)**
- `/dashboard` → `client/src/routes/dashboard/index.tsx`
- `/extractors` → `client/src/routes/extractors/index.tsx`
- `/extractors/new` → `client/src/routes/extractors/new.tsx`
- `/extractors/$id` → `client/src/routes/extractors/$id.tsx`
- `/extractors/edit.$id` → `client/src/routes/extractors/edit.$id.tsx`
- `/extractors/templates` → `client/src/routes/extractors/templates.tsx`
- `/runs` → `client/src/routes/runs/index.tsx`
- `/runs/new` → `client/src/routes/runs/new.tsx`
- `/runs/$id` → `client/src/routes/runs/$id.tsx`
- `/runs/review.$id` → `client/src/routes/runs/review.$id.tsx`
- `/autoruns` → `client/src/routes/autoruns/index.tsx`
- `/autoruns/new` → `client/src/routes/autoruns/new.tsx`
- `/autoruns/$id` → `client/src/routes/autoruns/$id.tsx`
- `/autoruns/edit.$id` → `client/src/routes/autoruns/edit.$id.tsx`
- `/autoruns/builder.$id` → `client/src/routes/autoruns/builder.$id.tsx`
- `/autoruns/runs.$id` → `client/src/routes/autoruns/runs.$id.tsx`

**Settings Routes (authenticated)**
- `/settings` → `client/src/routes/settings.tsx` (parent layout, redirects)
- `/settings/profile` → `client/src/routes/settings/profile.tsx`
- `/settings/notifications` → `client/src/routes/settings/notifications.tsx`
- `/settings/instance` → `client/src/routes/settings/instance.tsx`
- `/settings/extraction` → `client/src/routes/settings/extraction.tsx`
- `/settings/backups` → `client/src/routes/settings/backups.tsx`
- `/settings/appearance` → `client/src/routes/settings/appearance.tsx`
- `/settings/api-keys` → `client/src/routes/settings/api-keys.tsx`

**Demo Routes (public, no auth required)**
- `/demo` → `client/src/routes/demo/index.tsx` (public demo tool)
- `/demo/result.$runId` → `client/src/routes/demo/result.$runId.tsx`
- Sub-components (internal): `demo/-step-1-upload.tsx`, `demo/-step-2-extract.tsx`, `demo/-step-3-result.tsx`, `demo/-result-card.tsx`

**Root/Index**
- `/` → `client/src/routes/index.tsx`
- `__root` → `client/src/routes/__root.tsx`

---

## 2. Auth Mechanism

**Storage Backend**: Cookies (via `cookieStorage`)  
**Zustand Store**: `client/src/lib/auth-store.ts`  
**Hooks**: `client/src/hooks/useAuth.ts`

### Auth State Shape
```typescript
interface AuthState {
  user: UserResponseDto | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // ... 7 action methods
}
```

### Storage Details
- **Storage Key**: `"auth-storage"` (persisted to cookies)
- **Persisted Fields**: `user`, `accessToken`, `refreshToken`, `isAuthenticated`
- **Storage Type**: Cookie-based (via `createJSONStorage(() => cookieStorage)`)

### Auth Flow
1. User logs in → `authControllerLogin(email, password)` → POST `/auth/login` → stored in zustand (persisted to cookie)
2. App rehydrates → zustand deserialization from cookie storage
3. Token expiry handled → access token expires in 15min, refresh every 14min via `useTokenRefresh()` hook (background interval)
4. **No `/api/auth/me` call on boot** — auth state fully derived from stored tokens/user object

### Guard Pattern
- `useRedirectIfAuthenticated("/dashboard")` — redirects already-logged-in users away from `/login`, `/signup`
- **No route-level `beforeLoad` guards** — all routes can be visited, but if not authenticated, lazy components/data queries will fail with 401

### Playwright Injection Strategy (RECOMMENDED)
1. **Best**: Use `page.addInitScript()` to inject auth state into cookie storage before navigation
   ```javascript
   // Inject complete auth-storage cookie
   await page.addInitScript(() => {
     const authState = {
       state: {
         user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
         accessToken: 'eyJhbGc...', // valid JWT
         refreshToken: 'eyJhbGc...',
         isAuthenticated: true
       }
     };
     document.cookie = `auth-storage=${encodeURIComponent(JSON.stringify(authState))}; path=/`;
   });
   ```
2. **Fallback**: Real login fixture against running backend (slower, more realistic but brittleness)

---

## 3. LLM / AI Providers

### Dependencies
- `@tanstack/ai` (latest)
- `@tanstack/ai-anthropic` (latest)
- `@tanstack/ai-client` (latest)
- `@tanstack/ai-gemini` (latest)
- `@tanstack/ai-openai` (latest)
- `@tanstack/ai-react` (latest)
- `@tanstack/react-ai-devtools` (latest)

### Usage Pattern
File: `client/src/lib/demo-ai-hook.ts`  
Endpoint: `POST /demo/api/ai/chat` (server-side streaming via `fetchServerSentEvents`)

### Outbound Calls (to MOCK)
Tests should intercept these URL patterns:
- **OpenAI**: `https://api.openai.com/**` → 200 + mocked completion
- **Anthropic**: `https://api.anthropic.com/**` → 200 + mocked completion
- **Google Gemini**: `https://generativelanguage.googleapis.com/**` → 200 + mocked completion

### Playwright Mocking
```javascript
// In test or global-setup
await page.route('https://api.openai.com/**', route => {
  route.abort('blockedbyclient'); // block calls
});
await page.route('https://api.anthropic.com/**', route => {
  route.abort('blockedbyclient');
});
```
OR mock at `/demo/api/ai/chat` endpoint level in playwright config `webServer.command`.

---

## 4. Backend Dependency

### Services (docker-compose.yml)
- **postgres:15-alpine** → port 5433 (local), db: docxtractor
- **redis:alpine** → port 6381 (local), custom port 6380
- **server** (NestJS) → port 3002 (local), port 3001 (internal)

### Decision: LIVE BACKEND REQUIRED
Routes tested require real API responses:
- `GET /api/dashboard/stats` → dashboard route loads stats
- `GET /api/extractors` → list extractors
- `GET /api/extractors/:id` → single extractor detail
- `GET /api/runs/:id`, `GET /api/runs/:runId` → run detail, review
- `GET /api/autoruns/:id`, `GET /api/demo/:runId` → similar

**Recommendation**: Tests MUST have `docker-compose up` running (postgres, redis, server). Alternatively:
1. Start server before test run (Playwright can wait for health check)
2. Use `webServer` in playwright.config.ts to auto-start
3. Mock API responses with `page.route()` for determinism (harder to maintain)

**Chosen Path**: Use `webServer` config to start docker-compose + server on localhost:3002 before tests run.

---

## 5. Seed Data Needs

For parameterized routes (`/:id`, `/:token`, `/:runId`), tests must seed or mock:

### Extractors (`/extractors/$id`, `/extractors/edit.$id`)
```typescript
// Mock or create fixture:
const extractorId = '11111111-1111-1111-1111-111111111111'
// GET /api/extractors/:id must return:
{
  "data": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Test Extractor",
    "description": "Test description",
    "schema": { /* schema object */ },
    "parserEngine": "docling",
    "extractionProvider": "openai",
    "createdAt": "2026-06-01T00:00:00Z"
  }
}
```

### Runs (`/runs/$id`, `/runs/review.$id`)
```typescript
const runId = '22222222-2222-2222-2222-222222222222'
// GET /api/runs/:id must return:
{
  "data": {
    "id": "22222222-2222-2222-2222-222222222222",
    "extractorId": "11111111-1111-1111-1111-111111111111",
    "status": "done",
    "results": { /* extracted data */ },
    "createdAt": "2026-06-01T00:00:00Z"
  }
}
```

### Autoruns (`/autoruns/$id`, `/autoruns/edit.$id`, `/autoruns/builder.$id`, `/autoruns/runs.$id`)
```typescript
const autorunId = '33333333-3333-3333-3333-333333333333'
// GET /api/autoruns/:id returns similar structure
```

### Demo Run (`/demo/result.$runId`)
```typescript
const demoRunId = 'demo-run-uuid'
// GET /api/demo/:runId (or /api/demo/result/:runId)
```

### Invite Token (`/invite.$token`)
```typescript
const inviteToken = 'test-invite-token-xyz'
// Fixture or GET /api/invites/verify/:token
```

**Recommendation**: Use deterministic UUIDs (fixed seed) + POST endpoint mocking or direct DB seeding before test run.

---

## 6. Vite Dev Server Preflight

### Dev Script
```json
"dev": "dotenv -e .env.local -- sh -c \"NODE_OPTIONS='--import ./instrument.server.mjs' vite dev --port 5173\""
```

### Port
**Port 5173** (hardcoded in script)

### Required Env Vars
- **None for basic dev** — the script uses `dotenv -e .env.local` but `.env.local` doesn't exist
- Sentry DSN via `VITE_SENTRY_DSN` (optional, dev mode works without it)
- Backend URL (defaults to `http://localhost:3002` if not set via VITE_BACKEND_URL — check `client/src/lib/axios.ts`)

### Confirm Dev Works
```bash
cd client/
pnpm install
pnpm dev
# Should start on http://localhost:5173
# Backend expected on http://localhost:3002
```

### Playwright Config Targeting
```typescript
// playwright.config.ts
webServer: {
  command: 'pnpm dev',
  port: 5173,
  reuseExistingServer: true,
}
```

---

## 7. Summary: Playwright Test Strategy

### Setup
1. **Docker backend**: `docker-compose up -d` (postgres, redis, server) before Playwright runs
2. **Auth fixture**: Pre-inject `auth-storage` cookie with valid JWT using `page.addInitScript()`
3. **API mocks**: Route LLM calls to OpenAI/Anthropic/Gemini to `page.abort('blockedbyclient')`
4. **Seed data**: Either:
   - Mock `GET /api/extractors/:id`, `GET /api/runs/:id` via `page.route()`
   - OR pre-seed postgres via fixture SQL before test suite

### Global Setup (Playwright)
- Start server (or assume docker-compose is running)
- Create auth token fixture
- Optional: seed test data fixtures

### Per-Test Fixture
- Inject auth cookie via `page.addInitScript()`
- Navigate to route
- Assert page loaded

### Routes → Test Scenarios
- **Auth routes** (login, signup, setup): test form submission, error states, redirect to dashboard if already logged in
- **Core app routes** (dashboard, extractors, runs): test data load, CRUD operations, navigation
- **Settings**: test form submission, validation
- **Demo**: test public access (no auth required), upload/extract flow

---

## 8. Recommended Next Steps (Builder Phase)

1. Create `client/playwright.config.ts`:
   - `webServer` pointing to `pnpm dev`
   - Port 5173
   - Devices: desktop + mobile
   - Timeout: 30s

2. Create `client/tests/fixtures/auth.ts`:
   - Fixture that injects JWT via `addInitScript()`
   - Fixture for seeding extractors/runs if using direct mocking

3. Create test files:
   - `client/tests/auth.spec.ts` — login, signup, setup flows
   - `client/tests/dashboard.spec.ts` — dashboard load, stats, extractor list
   - `client/tests/extractors.spec.ts` — CRUD, edit, templates
   - `client/tests/runs.spec.ts` — list, detail, review
   - `client/tests/autoruns.spec.ts` — CRUD, builder, runs view
   - `client/tests/settings.spec.ts` — all settings pages
   - `client/tests/demo.spec.ts` — public demo tool, upload, result page

4. Add to `package.json`:
   ```json
   "test:e2e": "playwright test"
   ```

5. Update `.gitignore`:
   ```
   client/.env.local
   client/test-results/
   client/playwright-report/
   ```

---

## References

- Auth store: `client/src/lib/auth-store.ts`
- Auth hooks: `client/src/hooks/useAuth.ts`
- Route tree: `client/src/routes/**/*`
- API client: `client/src/api/endpoints/auth/auth.ts`, others
- Vite config: `client/vite.config.ts`
- Docker config: `docker-compose.yml`
- Demo AI: `client/src/lib/demo-ai-hook.ts`
