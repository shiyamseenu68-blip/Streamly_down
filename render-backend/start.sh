#!/bin/sh
set -eu

echo "[Streamly Startup] Verifying bgutil PO Token Provider server build..."
if [ ! -f "/root/bgutil-ytdlp-pot-provider/server/build/main.js" ]; then
    echo "[Streamly Startup Error] Compiled main.js not found at /root/bgutil-ytdlp-pot-provider/server/build/main.js" >&2
    exit 1
fi

if [ ! -f "/root/bgutil-ytdlp-pot-provider/server/build/generate_once.js" ]; then
    echo "[Streamly Startup Error] Compiled generate_once.js not found at /root/bgutil-ytdlp-pot-provider/server/build/generate_once.js" >&2
    exit 1
fi

# Cookie decoding logic (if YOUTUBE_COOKIES_BASE64 environment variable is present and non-empty)
if [ -n "${YOUTUBE_COOKIES_BASE64:-}" ]; then
    echo "[Streamly Startup] YOUTUBE_COOKIES_BASE64 detected. Decoding into /tmp/cookies.txt..."
    if echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > /tmp/cookies.txt 2>/dev/null; then
        chmod 600 /tmp/cookies.txt
        if [ -s /tmp/cookies.txt ]; then
            if head -n 5 /tmp/cookies.txt | grep -q -E "(Netscape|# HTTP Cookie File|\.youtube\.com|\.google\.com)"; then
                echo "[Streamly Startup] YouTube Netscape cookies.txt verified successfully."
            else
                echo "[Streamly Startup Warning] Decoded /tmp/cookies.txt is non-empty but does not match standard Netscape header format."
            fi
        else
            echo "[Streamly Startup Error] Decoded /tmp/cookies.txt is 0 bytes." >&2
            exit 1
        fi
    else
        echo "[Streamly Startup Error] Failed to decode YOUTUBE_COOKIES_BASE64 variable." >&2
        exit 1
    fi
else
    echo "[Streamly Startup] YOUTUBE_COOKIES_BASE64 not configured. Continuing without cookiefile."
fi

# Launch bgutil PO Token Provider HTTP server on localhost:4416
echo "[Streamly Startup] Launching bgutil PO Token Provider server on localhost:4416..."
node /root/bgutil-ytdlp-pot-provider/server/build/main.js -p 4416 > /tmp/bgutil.log 2>&1 &
BGUTIL_PID=$!

# Health check loop for bgutil server (up to 30 attempts)
echo "[Streamly Startup] Waiting for bgutil PO Token Provider server to become healthy on port 4416..."
HEALTHY=0
for i in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:4416/ping >/dev/null 2>&1; then
        HEALTHY=1
        echo "[Streamly Startup] bgutil PO Token Provider server is READY on http://127.0.0.1:4416 (PID $BGUTIL_PID)"
        break
    fi
    sleep 1
done

if [ "$HEALTHY" -ne 1 ]; then
    echo "[Streamly Startup Error] bgutil PO Token Provider server failed to become healthy after 30 seconds." >&2
    echo "--- Last 20 lines of /tmp/bgutil.log ---" >&2
    tail -n 20 /tmp/bgutil.log >&2 || true
    exit 1
fi

# Start FastAPI application through Gunicorn + UvicornWorker
echo "[Streamly Startup] Starting Gunicorn FastAPI server on port ${PORT:-10000}..."
exec gunicorn main:app --bind 0.0.0.0:${PORT:-10000} --worker-class uvicorn.workers.UvicornWorker
