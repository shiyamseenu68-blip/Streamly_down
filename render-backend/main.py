import os
import sys
import uuid
import shutil
import tempfile
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Depends, Query, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import yt_dlp

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

@app.post("/api/analyze", dependencies=[Depends(verify_token)])
async def analyze_url(req: AnalyzeRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL parameter is required")

    ffmpeg_bin = get_ffmpeg_path()

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "no_color": True,
        "skip_download": True,
        "extract_flat": False,
        "nocheckcertificate": True,
        "ffmpeg_location": ffmpeg_bin,
    }

    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, lambda: yt_dlp.YoutubeDL(ydl_opts).extract_info(url, download=False))
        if not info:
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

        return {"success": True, "data": metadata}

    except Exception as e:
        err_msg = str(e)
        if "Private" in err_msg or "login" in err_msg:
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
    ffmpeg_bin = get_ffmpeg_path()

    loop = asyncio.get_event_loop()

    if req_type == "mp3":
        bitrate_arg = "192k"
        if "320" in quality_label: bitrate_arg = "320k"
        elif "256" in quality_label: bitrate_arg = "256k"
        elif "128" in quality_label: bitrate_arg = "128k"

        expected_file = os.path.join(temp_dir, f"{unique_id}.mp3")

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "ffmpeg_location": ffmpeg_bin,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": bitrate_arg.replace("k", ""),
            }],
        }

        def run_mp3():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        await loop.run_in_executor(None, run_mp3)

        # Immediately purge raw intermediate stream (.webm/.m4a) keeping target .mp3
        cleanup_temp_files(unique_id, keep_file=expected_file)

        if not os.path.exists(expected_file):
            cleanup_temp_files(unique_id)
            raise HTTPException(status_code=500, detail="Failed to generate MP3 audio file")

        clean_name = sanitize_filename(quality_label)
        filename = f"audio_{clean_name}.mp3"
        background_tasks.add_task(cleanup_temp_files, unique_id)

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

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "format": format_spec,
            "outtmpl": out_template,
            "merge_output_format": "mp4",
            "ffmpeg_location": ffmpeg_bin,
        }

        def run_mp4():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        await loop.run_in_executor(None, run_mp4)

        # Immediately purge raw intermediate video/audio streams keeping target .mp4
        cleanup_temp_files(unique_id, keep_file=expected_file)

        if not os.path.exists(expected_file):
            cleanup_temp_files(unique_id)
            raise HTTPException(status_code=500, detail="Failed to generate MP4 video file")

        clean_name = sanitize_filename(quality_label)
        filename = f"video_{clean_name}.mp4"
        background_tasks.add_task(cleanup_temp_files, unique_id)

        return FileResponse(
            path=expected_file,
            filename=filename,
            media_type="video/mp4",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )
