#!/bin/sh
set -e

echo "[Streamly Launch] Starting bgutil PO Token Provider server on port 4416..."
node /opt/bgutil-server/server/build/main.js -p 4416 &
BGUTIL_PID=$!

# Wait for PO Token Provider server to accept HTTP connections
echo "[Streamly Launch] Waiting for PO Token Provider to become healthy..."
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:4416/ping >/dev/null 2>&1 || curl -s http://127.0.0.1:4416 >/dev/null 2>&1; then
        echo "[Streamly Launch] bgutil PO Token Provider is READY on http://127.0.0.1:4416 (PID $BGUTIL_PID)"
        break
    fi
    sleep 1
done

echo "[Streamly Launch] Starting Gunicorn FastAPI server on port ${PORT:-10000}..."
exec gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-10000}
