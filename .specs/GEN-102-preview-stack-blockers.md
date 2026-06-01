# GEN-102: Unblock shared dev preview stack startup

**Parent issue:** GEN-102 (`87661998-7d65-40f1-904c-817605985160`)
**Branch:** existing worktree branch (`agent/lead/ca4a03bc`) — DO NOT create new branch; you are already on this branch in the agent worktree. Commit there and open PR back to `main`.
**Single PR back to `main`.**

## Goal

Two follow-up blockers from PR #48 prevent `scripts/preview-up.sh` from starting on a host that already runs the prod stack. Fix both in one PR.

## File scope (exclusive)

- `docker-compose.yml`
- `docker-compose.agent.yml`
- `server/package.json`

Do NOT touch `docker-compose.prod.yml`, `docker-compose.stage.yml`, `scripts/preview-up.sh`, `scripts/preview-down.sh`, `scripts/agent-test.sh`, or any application source.

## Blocker 1 — `container_name:` collisions with prod

**Problem:** `docker-compose.yml` hardcodes `container_name: docxtractor-db / -redis / -server / -client / -minio / -extractor`. Prod stack on same host uses identical names → `docker compose -p docxtractor-preview ... up -d --build` aborts with `Error response from daemon: Conflict. The container name "/docxtractor-db" is already in use`.

**Fix:**

1. In `docker-compose.yml`, remove every `container_name:` directive. Six services declare it: `db`, `redis`, `server`, `client`, `minio`, `extraction-service`. Compose's `-p <project>` prefix produces unique names (`docxtractor-preview-db-1`, etc.).
2. In `docker-compose.agent.yml`, remove the now-redundant `container_name: !reset null` lines from `db`, `redis`, `server`, `client`, `minio`, `extraction-service`. **Keep** the `ports: !reset []` lines unchanged.

## Blocker 2 — `server/Dockerfile.dev` pnpm install fails with `ERR_PNPM_IGNORED_BUILDS`

**Problem:** pnpm 10 (`PNPM_VERSION=10.11.0`) hard-fails `--frozen-lockfile` when postinstall build scripts are ignored:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @nestjs/core@11.1.3, @scarf/scarf@1.4.0, @swc/core@1.12.7, bcrypt@6.0.0, msgpackr-extract@3.0.3
```

**Fix:** Add `pnpm.onlyBuiltDependencies` to `server/package.json` (most reproducible — works inside and outside docker, no Dockerfile mutation, no new files):

```json
"pnpm": {
  "onlyBuiltDependencies": [
    "@nestjs/core",
    "@scarf/scarf",
    "@swc/core",
    "bcrypt",
    "msgpackr-extract"
  ]
}
```

Place the `"pnpm"` key at top level of `server/package.json` (sibling of `dependencies`, `devDependencies`). Preserve JSON formatting/indentation of surrounding keys. Do NOT edit `Dockerfile.dev`. Do NOT add `.npmrc` (neither `client/` nor `server/` currently uses one; we keep that convention).

No `client/package.json` change is needed — `client/Dockerfile.dev` also uses pnpm 10 but its dependency tree doesn't trigger the same ignored-builds error today; leave it alone.

## Verification (run all of these before reporting done)

```bash
# 1. container_name fully purged from base compose
docker compose -p docxtractor-preview -f docker-compose.yml config | grep container_name
# expected: empty (no output)

# 2. container_name fully purged from agent overlay
docker compose -p docxtractor-preview -f docker-compose.yml -f docker-compose.agent.yml config | grep container_name
# expected: empty

# 3. server build succeeds (prod stack on host is fine — won't collide because we never run `up`)
docker compose -p docxtractor-preview -f docker-compose.yml build server
# expected: exit 0, no ERR_PNPM_IGNORED_BUILDS in output
```

If you cannot run docker on the worktree host, post a comment naming exactly which verification step couldn't run, but still complete the file edits.

## Acceptance

- `docker-compose.yml` has zero `container_name:` lines.
- `docker-compose.agent.yml` has zero `container_name:` lines but retains all six `ports: !reset []` lines.
- `server/package.json` has a top-level `"pnpm": { "onlyBuiltDependencies": [...] }` block with the five packages exactly as listed.
- No changes to any other file.
- All verification commands pass (or, if docker unavailable on host, posted as caveat).

## Workflow

1. Read this spec and the parent issue description (GEN-102) for full context.
2. Make the three file edits.
3. Run the three verification commands. Capture output.
4. Commit on current branch: `git add docker-compose.yml docker-compose.agent.yml server/package.json && git commit -m "fix(preview): drop container_name + allow pnpm builds in server dev image"`.
5. Push branch and open PR back to `main`. Title: `fix(preview): unblock shared dev stack on prod host`. Body should reference GEN-102 and list the two blockers + fixes.
6. Post `worker_done` comment on parent issue (`87661998-7d65-40f1-904c-817605985160`) with PR URL.
7. Set your own issue to `done`.

## Constraints recap

- Single PR. No refactors. No new services. No app code changes.
- Surgical edits only — match existing JSON/YAML formatting.
