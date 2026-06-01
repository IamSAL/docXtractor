#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker-compose.yml up -d --build
echo "Preview stack is up at http://127.0.0.1:8080 (via nginx)"
