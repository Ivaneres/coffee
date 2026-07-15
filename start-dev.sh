#!/usr/bin/env bash
# Start backend (FastAPI) and frontend (React) for local development.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

cleanup() {
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    pkill -P "$BACKEND_PID" 2>/dev/null || true
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend (http://localhost:8000) …"
"$ROOT/start-backend.sh" &
BACKEND_PID=$!

echo "Starting frontend (http://localhost:3000) …"
"$ROOT/start-frontend.sh"
