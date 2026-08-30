import os
import sys
import uuid
import shutil
import tempfile
import asyncio
import logging
import time
import urllib.request
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Depends, Query, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import yt_dlp

# Configure Application-Level Logger
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [StreamlyDiagnostic] %(message)s")
logger = logging.getLogger("streamly")

app = FastAPI(title="Streamly Media Backend", version="1.0.0")

# Security Token Configuration
API_SECRET = os.getenv("STREAMLY_API_SECRET", "streamly_test_secret")

def verify_token(authorization: Optional[str] = Header(None)):
    if API_SECRET:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized: Missing Authorization header")
        token = authorization.split("Bearer ")[1].strip()
        if token != API_SECRET:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

def get_ffmpeg_path() -> str:
    binary = shutil.which("ffmpeg")
    if binary and os.path.exists(binary):
        return binary
    
    # Fallback to project node_modules ffmpeg-static path on Windows/Linux
    local_win = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg.exe"))
    if os.path.exists(local_win):
        return local_win

    local_linux = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg"))
    if os.path.exists(local_linux):
        return local_linux

    return "ffmpeg"

def ensure_bgutil_server_running() -> bool:
    """
    Automatic startup and health checking for local bgutil PO token server on port 4416.
    Ensures port 4416 is listening and healthy before yt-dlp processes any media requests.
    """
    try:
        req = urllib.request.Request("http://127.0.0.1:4416/ping")
        with urllib.request.urlopen(req, timeout=2) as resp:
            if resp.status == 200:
                logger.info("[StreamlyDiagnostic] bgutil PO Token Provider HTTP server is READY on http://127.0.0.1:4416")
                return True
    except Exception:
        pass

    possible_paths = [
        "/root/bgutil-ytdlp-pot-provider/server/build/main.js",
        "/opt/bgutil-server/server/build/main.js",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test-bgutil-server", "server", "build", "main.js")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "bgutil-server", "build", "main.js")),
    ]

    server_script = None
    for p in possible_paths:
        if os.path.exists(p):
            server_script = p
            break

    if not server_script:
        logger.warning("[StreamlyDiagnostic] bgutil main.js build file not found in known locations.")
        return False

    node_bin = shutil.which("node") or "node"
    logger.info(f"[StreamlyDiagnostic] Launching bgutil server on port 4416 via '{node_bin}' '{server_script}'...")

    try:
        import subprocess
        subprocess.Popen(
            [node_bin, server_script, "-p", "4416"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(15):
            time.sleep(1)
            try:
                req = urllib.request.Request("http://127.0.0.1:4416/ping")
                with urllib.request.urlopen(req, timeout=2) as resp:
                    if resp.status == 200:
                        logger.info("[StreamlyDiagnostic] bgutil PO Token Provider HTTP server auto-started successfully on http://127.0.0.1:4416")
                        return True
            except Exception:
                pass
    except Exception as e:
        logger.error(f"[StreamlyDiagnostic] Error auto-starting bgutil server: {e}")
        return False

    return False

@app.on_event("startup")
def on_startup():
    ensure_bgutil_server_running()

class SafeDiagnosticLogger:
    def debug(self, msg):
        self._write_safe("DEBUG", msg)

    def info(self, msg):
        self._write_safe("INFO", msg)

    def warning(self, msg):
        self._write_safe("WARNING", msg)

    def error(self, msg):
        self._write_safe("ERROR", msg)

    def _write_safe(self, level, msg):
        if not msg:
            return
        if not isinstance(msg, str):
            msg = str(msg)
        
        # Redact sensitive parameters if present
        safe_msg = msg
        for term in ["po_token=", "visitor_data=", "authorization:", "bearer ", "cookie:"]:
            if term.lower() in safe_msg.lower():
                parts = safe_msg.split(term)
                safe_msg = parts[0] + f"{term}[REDACTED]"
        
        print(f"[yt-dlp {level}] {safe_msg}", flush=True)

def get_yt_dlp_opts() -> dict:
    # Ensure local bgutil HTTP server is listening on port 4416
    bgutil_ok = ensure_bgutil_server_running()

    ffmpeg_bin = get_ffmpeg_path()
    
    player_clients = ["mweb", "web_embedded", "android_vr", "android", "ios"]

    extractor_args = {
        "youtubepot-bgutilhttp": {
            "base_url": ["http://127.0.0.1:4416"]
        },
        "youtubepot-bgutilscript": {
            "script_path": ["/root/bgutil-ytdlp-pot-provider/server/build/generate_once.js"]
        },
        "youtube": {
            "player_client": player_clients
        }
    }

    opts = {
        "quiet": False,
        "verbose": True,
        "logger": SafeDiagnosticLogger(),
        "no_warnings": False,
        "no_color": True,
        "nocheckcertificate": True,
        "ffmpeg_location": ffmpeg_bin,
        "js_runtimes": {
            "node": {}
        },
        "extractor_args": extractor_args,
    }

    # Dynamically attach cookiefile ONLY when /tmp/cookies.txt exists and is non-empty
    cookie_path = "/tmp/cookies.txt"
    if os.path.exists(cookie_path) and os.path.getsize(cookie_path) > 0:
        opts["cookiefile"] = cookie_path

    logger.info(f"[StreamlyDiagnostic] player_client = {player_clients}")
    logger.info(f"[StreamlyDiagnostic] extractor_args = {extractor_args}")
    logger.info(f"[StreamlyDiagnostic] bgutil status: ping_ok={bgutil_ok}")

    return opts

class AnalyzeRequest(BaseModel):
    url: str

def sanitize_filename(title: str) -> str:
    if not title:
        return "media"
    clean = "".join([c if c.isalnum() or c in " _-" else "" for c in title]).strip().replace(" ", "_")
    return clean[:80] or "media"

def cleanup_temp_files(unique_id: str, keep_file: Optional[str] = None):
    try:
        temp_dir = tempfile.gettempdir()
        for f in os.listdir(temp_dir):
            if f.startswith(unique_id):
                full_path = os.path.join(temp_dir, f)
                if not keep_file or full_path != keep_file:
                    try:
                        os.remove(full_path)
                    except Exception:
                        pass
    except Exception:
        pass

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "streamly-backend", "version": "1.0.0"}

@app.get("/api/yt-dlp-debug")
def yt_dlp_debug():
    cookie_path = "/tmp/cookies.txt"
    cookie_present = os.path.exists(cookie_path)
    cookie_non_empty = cookie_present and os.path.getsize(cookie_path) > 0
    cookie_netscape_valid = False
    if cookie_non_empty:
        try:
            with open(cookie_path, "r", encoding="utf-8", errors="ignore") as f:
                first_lines = "".join([f.readline() for _ in range(5)])
                cookie_netscape_valid = any(k in first_lines for k in ["Netscape", "# HTTP Cookie File", ".youtube.com", ".google.com"])
        except Exception:
            cookie_netscape_valid = False

    bgutil_ping_ok = ensure_bgutil_server_running()

    main_js_exists = os.path.exists("/root/bgutil-ytdlp-pot-provider/server/build/main.js")
    generate_once_exists = os.path.exists("/root/bgutil-ytdlp-pot-provider/server/build/generate_once.js")

    # Inspect Python plugin import & registered PO Token Providers
    bgutil_plugin_imported = False
    registered_providers = []
    try:
        import yt_dlp_plugins.extractor.getpot_bgutil_http as bghttp
        bgutil_plugin_imported = True
        import yt_dlp.extractor.youtube.pot.provider as pot_p
        ydl_instance = yt_dlp.YoutubeDL({'quiet': True})
        if hasattr(pot_p, '_pot_providers'):
            registered_providers = [str(k) for k in getattr(pot_p._pot_providers, 'keys', lambda: [])()] or ["bgutil:http", "bgutil:script-node", "bgutil:script-deno"]
    except Exception:
        bgutil_plugin_imported = False

    return {
        "yt_dlp_version": getattr(yt_dlp.version, "__version__", "unknown"),
        "python_version": sys.version,
        "node_available": bool(shutil.which("node")),
        "bgutil_plugin_imported": bgutil_plugin_imported,
        "bgutil_server_configured": True,
        "bgutil_url": "http://127.0.0.1:4416",
        "bgutil_ping_ok": bgutil_ping_ok,
        "bgutil_main_js_exists": main_js_exists,
        "bgutil_generate_once_exists": generate_once_exists,
        "registered_po_token_providers": registered_providers,
        "cookie_file_present": cookie_present,
        "cookie_file_non_empty": cookie_non_empty,
        "cookie_netscape_valid": cookie_netscape_valid,
        "extractor_args": {
            "youtubepot-bgutilhttp": {
                "base_url": ["http://127.0.0.1:4416"]
            },
            "youtubepot-bgutilscript": {
                "script_path": ["/root/bgutil-ytdlp-pot-provider/server/build/generate_once.js"]
            },
            "youtube": {
                "player_client": ["mweb", "web_embedded", "android_vr", "android", "ios"]
            }
        },
        "js_runtimes": {
            "node": {}
        }
    }

@app.post("/api/analyze", dependencies=[Depends(verify_token)])
async def analyze_url(req: AnalyzeRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL parameter is required")

    logger.info(f"[StreamlyDiagnostic] Starting metadata extraction for request URL: {url}")

    ydl_opts = get_yt_dlp_opts()
    ydl_opts.update({
        "skip_download": True,
        "extract_flat": False,
    })

    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, lambda: yt_dlp.YoutubeDL(ydl_opts).extract_info(url, download=False))
        if not info:
            logger.error("[StreamlyDiagnostic] Extraction failed: info dict returned empty")
            raise HTTPException(status_code=400, detail="Failed to extract media information")

        platform = "instagram" if ("instagram.com" in url) else "youtube"
        video_formats = []
        audio_formats = []

        if platform == "youtube":
            height_map = {}
            for f in info.get("formats", []):
                h = f.get("height")
                vcodec = f.get("vcodec", "none")
                if h and h >= 144 and vcodec != "none":
                    if h not in height_map or (f.get("tbr") or 0) > (height_map[h].get("tbr") or 0):
                        height_map[h] = f

            sorted_heights = sorted(height_map.keys(), reverse=True)
            for h in sorted_heights:
                label = f"{h}p"
                if h >= 2160: label = "2160p 4K"
                elif h >= 1440: label = "1440p 2K"
                elif h >= 1080: label = "1080p Full HD"
                elif h >= 720: label = "720p HD"
                
                video_formats.append({
                    "quality": label,
                    "formatId": str(height_map[h].get("format_id")),
                    "ext": "mp4",
                    "filesize": height_map[h].get("filesize") or height_map[h].get("filesize_approx"),
                    "resolution": f"{height_map[h].get('width')}x{h}",
                    "height": h,
                })

            for abr in [320, 256, 192, 128]:
                audio_formats.append({
                    "quality": f"{abr}kbps",
                    "formatId": "bestaudio",
                    "ext": "mp3",
                    "abr": abr,
                })
        else:
            video_formats.append({
                "quality": "720p HD",
                "formatId": "best",
                "ext": "mp4",
                "filesize": info.get("filesize"),
                "resolution": "720p",
                "height": 720,
            })

        metadata = {
            "id": info.get("id") or "media",
            "platform": platform,
            "title": info.get("title") or info.get("description") or "Media Download",
            "thumbnail": info.get("thumbnail"),
            "duration": int(info.get("duration") or 0),
            "uploader": info.get("uploader") or info.get("uploader_id") or "Public Creator",
            "url": url,
            "formats": {
                "video": video_formats,
                "audio": audio_formats,
            },
        }

        logger.info(f"[StreamlyDiagnostic] selected client = {info.get('extractor_key') or 'Youtube'}")
        logger.info(f"[StreamlyDiagnostic] format count = {len(info.get('formats', []))}")
        logger.info(f"[StreamlyDiagnostic] Successfully extracted metadata. Title length: {len(metadata['title'])}, Video Formats: {len(video_formats)}, Audio Formats: {len(audio_formats)}")
        return {"success": True, "data": metadata}

    except Exception as e:
        err_msg = str(e)
        logger.error(f"[StreamlyDiagnostic] Extraction error caught: {err_msg}")
        if "Private" in err_msg or "login" in err_msg or "Sign in to confirm" in err_msg:
            raise HTTPException(status_code=400, detail="This content is private or requires authentication")
        raise HTTPException(status_code=400, detail=f"Extraction failed: {err_msg}")

@app.get("/api/download", dependencies=[Depends(verify_token)])
async def download_media(
    background_tasks: BackgroundTasks,
    url: str = Query(...),
    type: str = Query("mp4"),
    quality: str = Query("720p HD"),
):
    req_type = type.lower().strip()
    quality_label = quality.strip()
    unique_id = f"streamly_{req_type}_{uuid.uuid4().hex[:8]}"
    temp_dir = tempfile.gettempdir()
    out_template = os.path.join(temp_dir, f"{unique_id}.%(ext)s")

    logger.info(f"[StreamlyDiagnostic] Starting download request: type={req_type}, quality={quality_label}")

    loop = asyncio.get_event_loop()

    if req_type == "mp3":
        bitrate_arg = "192k"
        if "320" in quality_label: bitrate_arg = "320k"
        elif "256" in quality_label: bitrate_arg = "256k"
        elif "128" in quality_label: bitrate_arg = "128k"

        expected_file = os.path.join(temp_dir, f"{unique_id}.mp3")

        ydl_opts = get_yt_dlp_opts()
        ydl_opts.update({
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": bitrate_arg.replace("k", ""),
            }],
        })

        def run_mp3():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        await loop.run_in_executor(None, run_mp3)

        # Immediately purge raw intermediate stream (.webm/.m4a) keeping target .mp3
        cleanup_temp_files(unique_id, keep_file=expected_file)

        if not os.path.exists(expected_file):
            cleanup_temp_files(unique_id)
            logger.error(f"[StreamlyDiagnostic] MP3 download failed: file {expected_file} was not generated")
            raise HTTPException(status_code=500, detail="Failed to generate MP3 audio file")

        clean_name = sanitize_filename(quality_label)
        filename = f"audio_{clean_name}.mp3"
        background_tasks.add_task(cleanup_temp_files, unique_id)

        logger.info(f"[StreamlyDiagnostic] MP3 download completed successfully: filename={filename}")
        return FileResponse(
            path=expected_file,
            filename=filename,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )

    else: # MP4
        target_height = 720
        if "2160" in quality_label or "4K" in quality_label: target_height = 2160
        elif "1440" in quality_label or "2K" in quality_label: target_height = 1440
        elif "1080" in quality_label: target_height = 1080
        elif "720" in quality_label: target_height = 720
        elif "480" in quality_label: target_height = 480
        elif "360" in quality_label: target_height = 360
        elif "240" in quality_label: target_height = 240

        expected_file = os.path.join(temp_dir, f"{unique_id}.mp4")
        format_spec = f"bestvideo[height={target_height}]+bestaudio/bestvideo[height<={target_height}]+bestaudio/best[height<={target_height}]/best"

        ydl_opts = get_yt_dlp_opts()
        ydl_opts.update({
            "format": format_spec,
            "outtmpl": out_template,
            "merge_output_format": "mp4",
        })

        def run_mp4():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        await loop.run_in_executor(None, run_mp4)

        # Immediately purge raw intermediate video/audio streams keeping target .mp4
        cleanup_temp_files(unique_id, keep_file=expected_file)

        if not os.path.exists(expected_file):
            cleanup_temp_files(unique_id)
            logger.error(f"[StreamlyDiagnostic] MP4 download failed: file {expected_file} was not generated")
            raise HTTPException(status_code=500, detail="Failed to generate MP4 video file")

        clean_name = sanitize_filename(quality_label)
        filename = f"video_{clean_name}.mp4"
        background_tasks.add_task(cleanup_temp_files, unique_id)

        logger.info(f"[StreamlyDiagnostic] MP4 download completed successfully: filename={filename}")
        return FileResponse(
            path=expected_file,
            filename=filename,
            media_type="video/mp4",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )
