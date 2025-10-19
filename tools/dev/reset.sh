#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# Reinit Watchman for this repo
watchman watch-del "$ROOT" >/dev/null 2>&1 || true
watchman watch-project "$ROOT" >/dev/null

# Free Metro port
lsof -ti :8081 | xargs kill -9 2>/dev/null || true
pkill -f "react-native start" 2>/dev/null || true

# Start Metro freshly
npx react-native start --reset-cache --no-interactive
