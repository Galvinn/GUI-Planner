#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

# Backend is Flask (see backend/app.py) and Vite proxies /api -> :5001 by default.
BACKEND_HOST="127.0.0.1"
BACKEND_PORT="5001"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

VENV_DIR="${BACKEND_DIR}/venv"
BACKEND_PID=""
BACKEND_PGID=""

cleanup() {
  # Kill the whole process group to avoid leaving Flask reloader children behind.
  if [[ -n "${BACKEND_PGID}" ]]; then
    kill -TERM "-${BACKEND_PGID}" 2>/dev/null || true
    sleep 0.2
    kill -KILL "-${BACKEND_PGID}" 2>/dev/null || true
    return
  fi
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "==> Backend: setting up venv + deps"
if [[ ! -d "${VENV_DIR}" ]]; then
  python3 -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"
python -m pip install --upgrade pip >/dev/null
pip install -r "${BACKEND_DIR}/requirements.txt" >/dev/null

echo "==> Backend: starting Flask on http://${BACKEND_HOST}:${BACKEND_PORT}"
(cd "${BACKEND_DIR}" && python app.py) &
BACKEND_PID="$!"
BACKEND_PGID="$(ps -o pgid= "${BACKEND_PID}" | tr -d ' ' 2>/dev/null || true)"

echo "==> Backend: waiting until ready"
for _ in {1..60}; do
  if curl -fsS "http://${BACKEND_HOST}:${BACKEND_PORT}/plans" >/dev/null 2>&1; then
    echo "==> Backend: ready"
    break
  fi
  sleep 0.5
done

if ! curl -fsS "http://${BACKEND_HOST}:${BACKEND_PORT}/plans" >/dev/null 2>&1; then
  echo "Backend failed to start or is not responding at http://${BACKEND_HOST}:${BACKEND_PORT}"
  exit 1
fi

echo "==> Frontend: installing deps (if needed)"
if [[ ! -d "${FRONTEND_DIR}/node_modules" ]]; then
  (cd "${FRONTEND_DIR}" && npm install)
fi

echo "==> Frontend: starting Vite on http://localhost:${FRONTEND_PORT}"
cd "${FRONTEND_DIR}"
npm run dev -- --port "${FRONTEND_PORT}" --strictPort

