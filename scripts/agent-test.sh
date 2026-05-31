#!/usr/bin/env bash
set -euo pipefail

PROJECT="docxtractor-agent-$(basename "$PWD")"

trap 'docker compose -p "$PROJECT" -f docker-compose.yml -f docker-compose.agent.yml down -v' EXIT

docker compose -p "$PROJECT" -f docker-compose.yml -f docker-compose.agent.yml up -d --build

docker compose -p "$PROJECT" -f docker-compose.yml -f docker-compose.agent.yml exec server pnpm run lint
docker compose -p "$PROJECT" -f docker-compose.yml -f docker-compose.agent.yml exec server pnpm run test
docker compose -p "$PROJECT" -f docker-compose.yml -f docker-compose.agent.yml exec client pnpm run lint
