#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-3002}"
python3 -m uvicorn miruro_api:app --host 0.0.0.0 --port "${PORT}"
