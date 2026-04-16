# DocXtractor QA Audit Report

**Date:** 2026-04-16
**Scope:** Full project audit -- 5 parallel agents scanning frontend routes/navigation, frontend forms/UX, parsing pipeline, extraction pipeline, and WebSocket/auth flows

## Executive Summary

The audit identified **54 distinct issues** across the entire stack: 14 critical, 21 important, 9 incomplete features, and 10 security/cleanup items. The most severe problems are: (1) zero authentication on the WebSocket gateway leaking extraction data to anonymous users, (2) all file upload endpoints publicly accessible without auth, (3) Google OAuth login completely broken on page refresh due to missing user object, and (4) the Python extraction worker unable to read JSON Schema format, producing empty/garbage results for queue-based extraction providers. The frontend has several unprotected routes and numerous placeholder pages users can navigate to.

---

## Critical Issues (Must Fix -- Affects Users Now)

### Authentication & Security

- **Issue:** WebSocket gateway has zero authentication -- any anonymous client can join any run room
  - **Location:** `server/src/runs/runs.gateway.ts:31-33` (handleConnection), `:39-47` (handleJoinRun)
  - **Impact:** Anyone with the WebSocket URL can subscribe to `run:{anyRunId}` and receive real-time extraction results, source updates, and logs for any user's runs. Complete data leakage.
  - **Fix:** Add JWT verification in `handleConnection()`. Validate room ownership in `handleJoinRun` against the authenticated user.

- **Issue:** Socket client sends no auth token -- even if server auth is added, client would fail
  - **Location:** `client/src/lib/socket.ts:16-19`
  - **Impact:** Companion to the above. The `io()` call passes no `auth` option with a JWT.
  - **Fix:** Pass `auth: { token: accessToken }` in socket connection options.

- **Issue:** Google OAuth callback sets `isAuthenticated: true` but never fetches/sets the `user` object
  - **Location:** `client/src/routes/auth/callback.tsx:21-28` (sets tokens, no user), `client/src/lib/auth-store.ts:303` (rehydration checks `!state.user` and calls `logout()`)
  - **Impact:** Google OAuth login appears to work, then immediately logs user out on any page refresh or new tab. Completely broken flow.
  - **Fix:** After setting tokens, call the `/auth/me` or `/auth/profile` endpoint to fetch and set the user object.

- **Issue:** All file upload endpoints are public -- no authentication required
  - **Location:** `server/src/files/files.controller.ts:29`, `:100`, `:175`, `:203`, `:240` (all use `@Public()` decorator)
  - **Impact:** Any unauthenticated user can upload files, list files by userId, and confirm files. `userId` is a plain body parameter, not extracted from JWT. An attacker can fill MinIO storage or read other users' file metadata.
  - **Fix:** Remove `@Public()` decorators, extract userId from JWT token.

- **Issue:** Google OAuth bypasses invite-only mode
  - **Location:** `server/src/auth/auth.service.ts:331-352`
  - **Impact:** Self-hosted instance with invite-only enabled can be bypassed by anyone with a Google account. Defeats the entire invite system.
  - **Fix:** Check `allowPublicSignup` and invite status in `googleLogin` before creating new users.

- **Issue:** `verifyTokens` endpoint logs raw access and refresh tokens to stdout
  - **Location:** `server/src/auth/auth.service.ts:269`
  - **Impact:** Production logs contain valid JWT tokens. Anyone with log access can impersonate users.
  - **Fix:** Remove the `console.log` call.

- **Issue:** Tokens passed in URL during Google OAuth redirect
  - **Location:** `server/src/auth/auth.controller.ts:286-300`
  - **Impact:** Tokens visible in browser history, server access logs, referrer headers.
  - **Fix:** Use a short-lived authorization code exchanged via POST, or pass tokens via HTTP-only cookie.

### Extraction Pipeline

- **Issue:** Python extraction worker gets empty field descriptions for JSON Schema format
  - **Location:** `workers/extraction-service/src/extractor.py:99-102` and `:169-172`
  - **Impact:** `run_llm_extraction()` reads `schema_config.get('fields', [])` but NestJS sends JSON Schema format with `properties` key. Result: `fields_desc` is always empty -- LLM gets zero guidance on what to extract. Every queue-based extraction (doclo/langextract providers) produces garbage or empty results. FreeLLM provider works fine because it uses NestJS `LlmService` directly.
  - **Fix:** Update Python worker to handle both `fields` array and `properties` object formats, matching the logic in `server/src/shared/llm/llm.service.ts:183-203`.

- **Issue:** Python extraction worker has no JSON repair -- raw `json.loads` on LLM output
  - **Location:** `workers/extraction-service/src/extractor.py:129`
  - **Impact:** LLM output with trailing commas, unquoted keys, or markdown fences crashes Python extraction. NestJS uses `jsonrepair` library at `server/src/shared/llm/llm.service.ts:109`. Job fails with unhelpful error.
  - **Fix:** Add `json-repair` Python package or strip markdown fences before parsing.

- **Issue:** Rate limit (HTTP 429) causes infinite loop in LlmService
  - **Location:** `server/src/shared/llm/llm.service.ts:122-128` (extract method) and `:167-173` (generate method)
  - **Impact:** On 429, `attempt--` followed by `continue` means the loop counter never advances. Persistent 429 = infinite retry loop. Run stays in "extracting" forever. No timeout to break the loop.
  - **Fix:** Add max retry count for 429 responses, or use exponential backoff with a ceiling.

- **Issue:** Python consumer sends duplicate failure events on exception
  - **Location:** `workers/extraction-service/src/consumer.py:116-129`
  - **Impact:** On exception, consumer sends failure to `extraction-completed` queue AND re-raises. BullMQ may retry, causing duplicate failure processing. In PER_DOCUMENT mode, `progress.extracted` increments twice, corrupting completion detection.
  - **Fix:** Either send the failure event OR re-raise, not both.

### Parsing Pipeline

- **Issue:** No file size limit on uploads -- potential OOM crash
  - **Location:** `server/src/files/files.controller.ts:30` (`FileInterceptor('file')`) and `:101` (`FilesInterceptor('files', 10)`)
  - **Impact:** Multer is used without `limits` configuration. Multi-GB files are buffered entirely in Node.js memory (`file.buffer` at `files.service.ts:44`), potentially causing OOM crashes of the entire NestJS server.
  - **Fix:** Add `limits: { fileSize: ... }` to Multer configuration.

- **Issue:** No file type validation on uploads
  - **Location:** `server/src/files/files.service.ts:30-71`, `server/src/files/files.controller.ts:90-97`
  - **Impact:** Users can upload any file type. Parser-service hardcodes `filetype="pdf"` (PyMuPDF) or `InputFormat.PDF` (Docling), so non-PDF files cause cryptic parsing failures.
  - **Fix:** Add MIME type / extension whitelist at the controller level.

- **Issue:** Parser-service silently swallows `add_job` failures for result events
  - **Location:** `workers/parser-service/src/bullmq_client.py:39-40`
  - **Impact:** If Redis is temporarily unreachable when pushing to `parsed-documents` queue, the exception is caught and returned silently. Parsed result is lost forever. Run stays stuck in `parsing` with no error. User sees endless spinner.
  - **Fix:** Re-raise the exception so BullMQ can retry the job, or implement a retry loop for the `add_job` call.

---

## Important Issues (Should Fix -- Could Affect Users)

### Frontend UX

- **Issue:** Settings layout "Logout" button navigates to `/extractors/new` instead of logging out
  - **Location:** `client/src/routes/settings.tsx:32-37`
  - **Impact:** Users clicking "Logout" from settings are taken to the extractor creation page.
  - **Fix:** Call `useAuthStore.getState().logout()` and navigate to `/login`.

- **Issue:** Settings layout has always-visible "Unsaved Changes" bar with non-functional buttons
  - **Location:** `client/src/routes/settings.tsx:64-80`
  - **Impact:** "Reset Defaults" and "Save Changes" buttons are permanently visible on every settings sub-page with no onClick handlers and no connection to form state.
  - **Fix:** Wire to form dirty state; only show when changes exist.

- **Issue:** Settings breadcrumb shows "/ HOME / EXTRACTORS" instead of Settings
  - **Location:** `client/src/routes/settings.tsx:29`
  - **Impact:** Confusing navigation context for users on the settings page.
  - **Fix:** Update breadcrumb text.

- **Issue:** Extraction Settings form save is a mock -- only calls `console.log`
  - **Location:** `client/src/routes/settings/extraction.tsx:25-28`
  - **Impact:** Users believe settings are saved but nothing persists. Data lost on page reload.
  - **Fix:** Implement actual API call to persist extraction settings.

- **Issue:** Auth store logs out on transient network errors during token refresh
  - **Location:** `client/src/lib/auth-store.ts:274`
  - **Impact:** `refreshAccessToken` calls `logout()` on ANY non-401/403 error, including timeouts and 500s. Users get force-logged-out during temporary connectivity issues.
  - **Fix:** Only logout on 401/403; retry on transient errors.

- **Issue:** HttpClient type mismatch forces unsafe casts across codebase
  - **Location:** `client/src/lib/axios.ts` (HttpClient function)
  - **Impact:** `HttpClient<T>` returns `Promise<T>` but wraps responses as `{ data, status, headers }`. Consumers must cast: `(result as any).data` (e.g., `client/src/components/extractors/ExtractorForm.tsx:79`).
  - **Fix:** Fix the return type to match actual behavior, or unwrap `response.data`.

- **Issue:** "Forgot password?" link loops back to login page
  - **Location:** `client/src/routes/login.tsx:161`
  - **Impact:** `<Link to=".">` links to self. No forgot-password flow exists.
  - **Fix:** Link to a forgot-password route or show a modal.

- **Issue:** Signup page Terms/Privacy links loop back to signup page
  - **Location:** `client/src/routes/signup.tsx:162`
  - **Impact:** Both links use `to="."`.
  - **Fix:** Link to actual Terms and Privacy pages or remove the links.

- **Issue:** Dashboard hardcodes user name "Alex Designer" and avatar URL
  - **Location:** `client/src/routes/dashboard/index.tsx:91-95`
  - **Impact:** Every user sees a fake identity on their dashboard.
  - **Fix:** Read from auth store `user` object.

- **Issue:** Runs list: shared `isPending` disables ALL retry buttons when any single retry is in progress
  - **Location:** `client/src/routes/runs/index.tsx:409`
  - **Impact:** Clicking retry on row A disables retry buttons on all other rows.
  - **Fix:** Track pending state per-runId.

- **Issue:** Setup and Invite pages: submit button stuck in loading state on success
  - **Location:** `client/src/routes/setup.tsx:84`, `client/src/routes/invite.$token.tsx`
  - **Impact:** `setIsLoading(false)` only in `catch` block; on success with slow/failed navigation, button stays loading forever.
  - **Fix:** Move `setIsLoading(false)` to `finally` block.

- **Issue:** Instance Settings: zero form validation on both general and SMTP forms
  - **Location:** `client/src/routes/settings/instance.tsx`
  - **Impact:** Users can submit empty required fields (blank instance name, malformed SMTP host).
  - **Fix:** Add zodResolver validation and FormErrorMessage components.

- **Issue:** ExtractorForm schema field validation bypassed with `z.any()`
  - **Location:** `client/src/components/extractors/ExtractorForm.tsx:29`
  - **Impact:** Users can save extractors with empty or malformed JSON Schema; problem only surfaces at extraction time.
  - **Fix:** Validate schema is valid JSON Schema with required properties.

### Backend Pipeline

- **Issue:** No retry configuration on parse and extraction queue jobs
  - **Location:** `server/src/shared/queue/queue.service.ts:38-41`
  - **Impact:** BullMQ defaults to 0 retries. Any transient failure (OOM, subprocess timeout, network blip) is permanent. Compare with workflow queue at line 146 which correctly sets `attempts: 2`.
  - **Fix:** Add `attempts` and `backoff` options to `addJob`.

- **Issue:** Race condition in run creation -- partial queue failure leaves run inconsistent
  - **Location:** `server/src/runs/runs.service.ts:276-306`
  - **Impact:** If `addJob` throws on the 3rd of 5 documents, already-dispatched parse jobs complete and wait forever for unqueued sources. Run is stuck.
  - **Fix:** Use a transaction or compensating action to clean up on partial failure.

- **Issue:** `retrySourcesBatch` with `PARSE_AND_EXTRACTION` mode does not increment `retryGeneration`
  - **Location:** `server/src/runs/runs.service.ts:1484-1535`
  - **Impact:** Stale results from a previous parse attempt could be accepted, causing wrong parsed content to be used for extraction.
  - **Fix:** Increment `retryGeneration` in batch retry path, matching single-source retry behavior.

- **Issue:** Partial success in PER_DOCUMENT mode shows as "Done"
  - **Location:** `server/src/runs/runs.service.ts:860-868` and `:1031-1041`
  - **Impact:** 10 documents uploaded, 9 fail, 1 succeeds -- run shows green "Done". User trusts incomplete results.
  - **Fix:** Use a `PARTIAL` or `REVIEW` status when some sources failed.

- **Issue:** Per-document extraction completion off-by-one when `extractionTotal=0` sentinel
  - **Location:** `server/src/runs/runs.service.ts:1029-1031`
  - **Impact:** Queue-based extraction path checks `extractedCount >= extractionTotal`. If total is still 0 (sentinel), condition is true after first extraction. Run may complete prematurely.
  - **Fix:** Add `extractionTotal > 0` guard matching the LLM path at line 859.

- **Issue:** `Promise.all` in `uploadMultipleFiles` causes all uploads to fail if one fails
  - **Location:** `server/src/files/files.service.ts:99-102`
  - **Impact:** One failed upload in a batch of 10 kills the entire batch. Successfully uploaded files are orphaned in MinIO.
  - **Fix:** Use `Promise.allSettled` and report partial results.

- **Issue:** Password reset tokens are reusable within the 1-hour expiry window
  - **Location:** `server/src/auth/auth.service.ts:302-311`
  - **Impact:** Intercepted reset links can be used multiple times.
  - **Fix:** Blacklist tokens after use or store a one-time nonce.

### WebSocket / Real-time

- **Issue:** Socket reconnection does not re-join rooms
  - **Location:** `client/src/lib/socket.ts:21-31` (only logs on reconnect), `client/src/routes/runs/$id.tsx:43-121` (room join in useEffect only)
  - **Impact:** User watching a run loses all real-time updates after a network blip. Page shows stale data with no visual indicator.
  - **Fix:** Re-emit `joinRun`/`joinRunsList` on reconnect event.

---

## Incomplete Features

### Password Reset Flow
- **Status:** Stub
  - **Location:** `server/src/auth/auth.service.ts:286-300`
  - **What's Missing:** `initiatePasswordReset` generates a token and logs to console but never sends an email. `updatePassword` returns user info without changing the password.
  - **What Works:** JWT token generation, endpoint routing, DTO validation.

### Settings: Profile Page
- **Status:** Placeholder
  - **Location:** `client/src/routes/settings/profile.tsx`
  - **What's Missing:** Entire page is an EmptyBlock component saying "Identity Protocol Offline". No form, no API integration.
  - **What Works:** Route exists, navigation works, auth protection via parent layout.

### Settings: Notifications Page
- **Status:** Placeholder
  - **Location:** `client/src/routes/settings/notifications.tsx`
  - **What's Missing:** EmptyBlock "Silence is Golden". No notification preferences UI.
  - **What Works:** Route and navigation.

### Settings: Appearance Page
- **Status:** Placeholder
  - **Location:** `client/src/routes/settings/appearance.tsx`
  - **What's Missing:** EmptyBlock "Vibe Override Locked". No theme/appearance controls.
  - **What Works:** Route and navigation.

### Settings: API Keys Page
- **Status:** Placeholder
  - **Location:** `client/src/routes/settings/api-keys.tsx`
  - **What's Missing:** "Generate New Key" button only does `console.log("Generate key")`. No API key management.
  - **What Works:** Route, navigation, layout with empty table.

### Run Review Page
- **Status:** Static mockup
  - **Location:** `client/src/routes/runs/review.$id.tsx`
  - **What's Missing:** All data is hardcoded ("CASE-2023-{id}", "$4,250.00", "15 of 20 fields validated"). No API calls, no data fetching. "Accept Field", "Reject", "Finish Review" buttons have no onClick handlers. Also: no auth protection -- page is accessible without login.
  - **What Works:** Visual layout renders.

### AutoRuns Edit Page
- **Status:** Bare placeholder
  - **Location:** `client/src/routes/autoruns/edit.$id.tsx`
  - **What's Missing:** Renders only `<div>Hello "/autoruns/edit/$id"!</div>`. No auth protection, no functionality. The autoruns index uses `/autoruns/builder/$id` for editing instead.
  - **What Works:** Route exists.

### AutoRuns Run Detail Page
- **Status:** Static mockup
  - **Location:** `client/src/routes/autoruns/runs.$id.tsx`
  - **What's Missing:** All data hardcoded ("Total Runs: 1,241", "Successful: 1,202"). Pagination buttons have no handlers. "Run Now" does nothing. Only the `id` param is displayed.
  - **What Works:** Visual layout renders.

### Run Cancel Endpoint
- **Status:** Missing
  - **Location:** `server/src/runs/runs.controller.ts` (no cancel method)
  - **What's Missing:** `RunStatus.CANCELLED` enum exists, `queueService.removeJobsForRun` exists, but no API endpoint exposes cancellation to users. Only used internally during retry.
  - **What Works:** Backend infrastructure for cancellation exists but is not user-accessible.

---

## Dead Code & Cleanup

- `client/src/hooks/useAuth.ts:43-54` -- `useRequireAuth()` hook is defined but never imported by any route. Auth protection comes exclusively from `AppLayout > ProtectedRoute`.
- `server/src/auth/strategy/google.strategy.ts:15-17` -- Uses placeholder `'not-configured'` for client ID/secret when env vars are missing instead of disabling the strategy. Produces confusing errors if OAuth is attempted.
- `server/src/auth/auth.controller.ts:135-157` -- `verifyTokens` endpoint is public (inherits class-level `@Public()`), accepts raw tokens in body. Enables token probing by attackers.
- `server/src/runs/runs.service.ts:83` -- `extractionLocks` Map stores Promise chains per run ID. No TTL or periodic cleanup. If runs get stuck (from 429 loop or timeout issues), orphaned Promises accumulate. Memory grows over time.
- `client/src/routes/settings/extraction.tsx:53-80` -- Extraction Health sidebar shows hardcoded stats ("Success Rate: 98.2%", "Token Usage: 1.2M / 2M", "Last optimized: 2 mins ago") not from any API.
- `client/src/routes/index.tsx` -- Landing page footer: all links are `href="#"`. CTA email form "Get Access" button has no handler.

---

## Suggestions

- **Add `beforeLoad` route guards:** Currently auth is enforced only by wrapping components in `ProtectedRoute` via `AppLayout`. Routes that skip `AppLayout` (review page, autoruns/new, autoruns/builder, autoruns/edit) are unprotected. Adding TanStack Router `beforeLoad` guards provides defense-in-depth.
- **Use `Promise.allSettled` for batch operations:** Both `uploadMultipleFiles` (files.service.ts:99) and batch extraction should handle partial failures gracefully instead of all-or-nothing.
- **Add BullMQ dead letter queue and job timeouts:** Parsing and extraction jobs have no retry attempts, no timeouts, and no dead letter queue. A crashed worker leaves jobs orphaned forever.
- **Standardize schema contract between NestJS and Python workers:** The JSON Schema format vs. `fields` array mismatch between NestJS and Python is the root cause of broken queue-based extraction. Define a shared schema interface.
- **Add request timeouts on all LLM API calls:** Neither NestJS `LlmService` nor Python `extractor.py` set request timeouts. A hung FreeLLM blocks extraction indefinitely.
- **Replace `window.confirm()` with custom modal:** Delete confirmations in `client/src/routes/extractors/index.tsx`, `extractors/edit.$id.tsx`, `extractors/$id.tsx`, and `runs/index.tsx:107` all use native `window.confirm()` which is blocking and inconsistent with the neobrutalist design system.
- **Add validation that file-type sources have `fileId` and url-type sources have `url`:** Both are `@IsOptional()` in `server/src/runs/dto/create-run.dto.ts:14-32`. Bad input is accepted and fails deep in the pipeline instead of at the API boundary.
- **Implement no-concurrent-refresh mutex:** Multiple concurrent 401 responses independently call `refreshAccessToken()` at `client/src/lib/axios.ts:32-97`, potentially causing token rotation conflicts and spurious logouts.
- **Deprecate Axios CancelToken:** `client/src/lib/axios.ts` uses deprecated `axios.CancelToken` instead of standard `AbortController`. Will break when Axios removes the deprecated API.
- **Add error fallback UI on dashboard and extractors list:** Loading skeletons exist but no error states when queries fail. Pages show blank sections with no indication of failure.
