import { execFile } from "child_process";
import { promisify } from "util";
import { MediaMetadata, VideoFormat, AudioFormat } from "../types/media";

const execFileAsync = promisify(execFile);

export interface YouTubeExtractionResult {
  success: true;
  data: MediaMetadata;
}

export interface YouTubeExtractionError {
  success: false;
  error: {
    code: "INVALID_URL" | "MEDIA_UNAVAILABLE" | "PRIVATE_CONTENT" | "AGE_RESTRICTED" | "EXTRACTION_FAILED";
    message: string;
    detail?: string;
  };
}

export type YouTubeExtractionResponse = YouTubeExtractionResult | YouTubeExtractionError;

/**
 * Helper to select the highest resolution thumbnail
 */
function getBestThumbnail(rawThumbnails: any[], fallbackThumbnail: string): string {
  if (!Array.isArray(rawThumbnails) || rawThumbnails.length === 0) {
    return fallbackThumbnail || "";
  }
  // Sort by width/height descending
  const sorted = [...rawThumbnails].sort((a, b) => {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    return areaB - areaA;
  });
  return sorted[0]?.url || fallbackThumbnail || "";
}

/**
 * Formats height into human-readable quality label
 */
function getQualityLabel(height: number): string {
  if (height >= 2160) return "4K 2160p";
  if (height >= 1440) return "2K 1440p";
  if (height >= 1080) return "1080p Full HD";
  if (height >= 720) return "720p HD";
  if (height >= 480) return "480p";
  if (height >= 360) return "360p";
  if (height >= 240) return "240p";
  return `${height}p`;
}

/**
 * Extracts real YouTube metadata using python yt-dlp module
 */
export async function extractYouTubeMetadata(url: string): Promise<YouTubeExtractionResponse> {
  try {
    const args = [
      "-m",
      "yt_dlp",
      "--dump-single-json",
      "--no-warnings",
      "--no-call-home",
      "--no-check-certificates",
      url.trim(),
    ];

    // Execute python yt_dlp with 20 second timeout
    const { stdout } = await execFileAsync("python", args, {
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer
      timeout: 20000,
    });

    const raw = JSON.parse(stdout);

    if (!raw || !raw.id) {
      return {
        success: false,
        error: {
          code: "EXTRACTION_FAILED",
          message: "Could not retrieve media details from YouTube.",
        },
      };
    }

    const rawFormats: any[] = Array.isArray(raw.formats) ? raw.formats : [];

    // Parse real Video Formats
    const videoMap = new Map<number, VideoFormat>();
    
    // Process video formats
    for (const fmt of rawFormats) {
      const height = fmt.height;
      const vcodec = fmt.vcodec || "none";

      if (height && height >= 144 && vcodec !== "none") {
        const quality = getQualityLabel(height);
        const hasAudio = fmt.acodec && fmt.acodec !== "none";
        const filesize = fmt.filesize || fmt.filesize_approx || undefined;

        // Keep best stream for each unique resolution height
        if (!videoMap.has(height)) {
          videoMap.set(height, {
            quality,
            formatId: fmt.format_id,
            ext: "mp4",
            hasAudio,
            requiresMerge: !hasAudio,
            filesize,
            height,
            fps: fmt.fps || 30,
          });
        }
      }
    }

    // Sort video formats by height descending
    const videoFormats: VideoFormat[] = Array.from(videoMap.values()).sort(
      (a, b) => (b.height || 0) - (a.height || 0)
    );

    // Parse real Audio Formats based on best source audio bitrate (abr/tbr)
    const audioFormats: AudioFormat[] = [];
    
    // Find best source audio stream bitrate
    let maxAudioBitrate = 128;
    for (const fmt of rawFormats) {
      const acodec = fmt.acodec || "none";
      const vcodec = fmt.vcodec || "none";
      if (acodec !== "none" && vcodec === "none") {
        const abr = fmt.abr || fmt.tbr || 0;
        if (abr > maxAudioBitrate) {
          maxAudioBitrate = Math.round(abr);
        }
      }
    }

    // Include genuine realistic bitrate options (never exceed source capability artificially)
    const possibleBitrates = [
      { kbps: 128, label: "128 kbps" },
      { kbps: 192, label: "192 kbps" },
      { kbps: 256, label: "256 kbps" },
      { kbps: 320, label: "320 kbps" },
    ];

    for (const option of possibleBitrates) {
      // Only include bitrates that source supports (or standard 128/192/256/320 up to best source)
      if (option.kbps <= maxAudioBitrate || option.kbps === 128) {
        audioFormats.push({
          quality: option.label,
          formatId: "bestaudio",
          ext: "mp3",
        });
      }
    }

    const durationInSeconds = Math.round(raw.duration || 0);

    const metadata: MediaMetadata = {
      platform: "youtube",
      id: raw.id,
      url: raw.webpage_url || url,
      title: raw.title || "Untitled Video",
      thumbnail: getBestThumbnail(raw.thumbnails, raw.thumbnail),
      duration: durationInSeconds,
      uploader: raw.uploader || raw.channel || raw.uploader_id || "Unknown Channel",
      formats: {
        audio: audioFormats,
        video: videoFormats,
      },
    };

    return {
      success: true,
      data: metadata,
    };
  } catch (error: any) {
    const errorMsg = error?.stderr || error?.message || "";

    if (errorMsg.includes("Private video") || errorMsg.includes("private")) {
      return {
        success: false,
        error: {
          code: "PRIVATE_CONTENT",
          message: "This YouTube video is private or restricted by the owner.",
        },
      };
    }

    if (errorMsg.includes("Video unavailable") || errorMsg.includes("not available")) {
      return {
        success: false,
        error: {
          code: "MEDIA_UNAVAILABLE",
          message: "This YouTube video is unavailable or has been deleted.",
        },
      };
    }

    if (errorMsg.includes("Sign in") || errorMsg.includes("age-restricted")) {
      return {
        success: false,
        error: {
          code: "AGE_RESTRICTED",
          message: "This YouTube video is age-restricted or requires account sign-in.",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "EXTRACTION_FAILED",
        message: "Failed to extract metadata from YouTube. Please check the URL.",
        detail: process.env.NODE_ENV === "development" ? errorMsg.slice(0, 200) : undefined,
      },
    };
  }
}
