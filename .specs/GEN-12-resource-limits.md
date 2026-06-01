# GEN-12 — Resource Limits + pnpm Build Fix

Parent issue: cefdcc96-09d8-411f-b8b7-9b64427aa361
Branch (existing, push more commits onto it): `agent/orchestrator/07b19e7f`
Open PR: https://github.com/IamSAL/docXtractor/pull/52  (→ `stage`)

## Two problems to solve

### A. Server prod build is broken

`server/Dockerfile.prod` line 9 fails with:

```
ERROR  packages field missing or empty
```

Root cause: that Dockerfile installs `pnpm` with no version pin (`npm install -g pnpm`). The latest pnpm release rejects a `pnpm-workspace.yaml` that has no `packages:` field — the file in `server/` only carries `onlyBuiltDependencies`. The dev image (`server/Dockerfile.dev`) and the client prod image both pin `PNPM_VERSION=10.11.0` and work fine.

Fix: pin pnpm in `server/Dockerfile.prod` the same way the sibling Dockerfiles do.

Concrete edits in `server/Dockerfile.prod`:

1. At the very top, add the two ARG lines (matching `server/Dockerfile.dev`):
   ```dockerfile
   ARG NODE_VERSION=22.15.0
   ARG PNPM_VERSION=10.11.0
   ```
2. Change both `FROM node:22-alpine ...` lines to `FROM node:${NODE_VERSION}-alpine ...`.
3. In each stage, re-declare `ARG PNPM_VERSION` after the `FROM` (ARGs don't cross stages), and change `RUN npm install -g pnpm` to `RUN npm install -g pnpm@${PNPM_VERSION}`.

Do NOT touch `pnpm-workspace.yaml`, do NOT touch `client/Dockerfile.prod` (already pinned, already working).

### B. Original task: add CPU/mem limits

The branch currently has **no** resource-limit changes — only the broken pnpm fix. Add limits to `docker-compose.prod.yml` AND `docker-compose.stage.yml` for these services:

| Service           | mem_limit | mem_reservation | cpus  |
|-------------------|-----------|-----------------|-------|
| `server`          | `2g`      | `512m`          | `1.5` |
| `parser-service`  | `4g`      | `1g`            | `2.0` |

Rationale: `parser-service` runs docling (PyTorch CPU) on multi-page PDFs — heaviest service. `server` is a NestJS API. These caps are conservative ceilings (sized so a single runaway job cannot OOM the host) and are intentionally not tight — we want them to bite only on pathological jobs, not normal load. The triage comment on GEN-12 asked for ~1.5× baseline peak; absent fresh baselines, these defaults are reasonable starting points that match typical DocXtractor jobs and can be tuned later without a redeploy by the host operator.

Use top-level Compose keys (not `deploy.resources.limits`, which is Swarm-only and silently ignored by `docker compose up`):

```yaml
  server:
    ...
    mem_limit: 2g
    mem_reservation: 512m
    cpus: 1.5

  parser-service:
    ...
    mem_limit: 4g
    mem_reservation: 1g
    cpus: 2.0
```

Apply to BOTH `docker-compose.prod.yml` and `docker-compose.stage.yml`. Do NOT add limits to `client`, `extraction-service`, `db`, `redis`, `minio`, `createbuckets` — out of scope for this issue.

## File scope (single builder, no overlap)

- `server/Dockerfile.prod`
- `docker-compose.prod.yml`
- `docker-compose.stage.yml`

## Verify before push

1. From repo root, attempt the server build that previously failed:
   ```
   docker build -f server/Dockerfile.prod ./server
   ```
   Must reach completion (or at least pass the `pnpm install` step that failed before). If Docker is unavailable in the runtime, run `pnpm install --frozen-lockfile` inside `node:22.15.0-alpine` via `docker run` against a fresh `pnpm@10.11.0`; if even that is unavailable, document the gap in the result comment instead of skipping.
2. `docker compose -f docker-compose.prod.yml config` and `docker compose -f docker-compose.stage.yml config` must both exit 0 — confirms the YAML is valid and the new keys parse.
3. `git diff --stat` should show ONLY the three files above changed.

## Branch / push

- Branch: `agent/orchestrator/07b19e7f` (already pushed, has PR #52 open). Push directly on top — do not open a new PR.
- Commit message: `fix(server): pin pnpm@10.11.0; add cpu/mem limits to server + parser`

## Done criteria

- Server prod image builds past the `pnpm install` step.
- `mem_limit` / `cpus` keys present on `server` and `parser-service` in both compose files.
- New commit visible on `agent/orchestrator/07b19e7f` and reflected in PR #52.
- `worker_done` comment posted on the builder's sub-issue with the commit SHA.
