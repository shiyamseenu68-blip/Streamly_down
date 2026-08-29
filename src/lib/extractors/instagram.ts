import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";
import { MediaMetadata, VideoFormat } from "../types/media";
import { validateMediaUrl } from "../utils/validators";

const execFileAsync = promisify(execFile);

function getFfmpegPath(): string {
  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    return ffmpegPath;
  }
  const projectLocal = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    os.platform() === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  if (fs.existsSync(projectLocal)) {
    return projectLocal;
  }
  return "ffmpeg";
}

export function sanitizeFilename(title: string): string {
  if (!title) return "instagram_media";
  const clean = title
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
  return clean.slice(0, 80) || "instagram_media";
}

export interface InstagramExtractionResult {
  success: true;
  data: MediaMetadata;
}

export interface InstagramExtractionError {
  success: false;
  error: {
    code: "INVALID_URL" | "MEDIA_UNAVAILABLE" | "PRIVATE_CONTENT" | "EXTRACTION_FAILED";
    message: string;
    detail?: string;
  };
}

export type InstagramExtractionResponse = InstagramExtractionResult | InstagramExtractionError;

/**
 * Extracts public Instagram metadata using Python yt-dlp module
 */
export async function extractInstagramMetadata(url: string): Promise<InstagramExtractionResponse> {
  try {
    const validation = validateMediaUrl(url);
    if (!validation.isValid || validation.platform !== "instagram") {
      return {
        success: false,
        error: {
          code: "INVALID_URL",
          message: "Please enter a valid public Instagram Reel or video link.",
        },
      };
    }

    const args = [
      "-m",
      "yt_dlp",
      "--dump-single-json",
      "--no-warnings",
      "--no-check-certificates",
      validation.cleanUrl,
    ];

    const { stdout } = await execFileAsync("python", args, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 25000,
    });

    const raw = JSON.parse(stdout);

    if (!raw || !raw.id) {
      return {
        success: false,
        error: {
          code: "EXTRACTION_FAILED",
          message: "Could not retrieve Instagram media details.",
        },
      };
    }

    const rawFormats: any[] = Array.isArray(raw.formats) ? raw.formats : [];
    const height = raw.height || rawFormats[0]?.height || 720;
    const qualityLabel = height >= 1080 ? "1080p Full HD" : height >= 720 ? "720p HD" : `${height}p`;

    const videoFormats: VideoFormat[] = [
      {
        quality: qualityLabel,
        formatId: raw.format_id || "best",
        ext: "mp4",
        hasAudio: true,
        requiresMerge: false,
        height,
        filesize: raw.filesize || raw.filesize_approx || undefined,
      },
    ];

    const durationInSeconds = Math.round(raw.duration || 0);

    const metadata: MediaMetadata = {
      platform: "instagram",
      id: raw.id,
      url: raw.webpage_url || validation.cleanUrl,
      title: raw.title || raw.description?.slice(0, 60) || "Instagram Media",
      thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || "",
      duration: durationInSeconds,
      uploader: raw.uploader || raw.channel || raw.uploader_id || "@instagram_user",
      formats: {
        audio: [],
        video: videoFormats,
      },
    };

    return {
      success: true,
      data: metadata,
    };
  } catch (error: any) {
    const errorMsg = error?.stderr || error?.message || "";

    if (
      errorMsg.includes("empty media response") ||
      errorMsg.includes("login") ||
      errorMsg.includes("authentication") ||
      errorMsg.includes("Private")
    ) {
      return {
        success: false,
        error: {
          code: "PRIVATE_CONTENT",
          message: "This Instagram Reel or post is private, restricted, or requires login to view.",
        },
      };
    }

    return {
      success: false,
      error: {
        code: "MEDIA_UNAVAILABLE",
        message: "This Instagram Reel or video post is unavailable or has been deleted.",
        detail: process.env.NODE_ENV === "development" ? errorMsg.slice(0, 200) : undefined,
      },
    };
  }
}

export interface InstagramDownloadResult {
  success: true;
  filePath: string;
  filename: string;
  filesize: number;
}

export interface InstagramDownloadError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type InstagramDownloadResponse = InstagramDownloadResult | InstagramDownloadError;

/**
 * Downloads public Instagram Reel or video post to MP4
 */
export async function processInstagramMp4(
  url: string,
  qualityLabel: string = "720p HD"
): Promise<InstagramDownloadResponse> {
  try {
    const validation = validateMediaUrl(url);
    if (!validation.isValid || validation.platform !== "instagram") {
      return {
        success: false,
        error: {
          code: "INVALID_URL",
          message: "A valid public Instagram URL is required.",
        },
      };
    }

    const uniqueId = `streamly_ig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = os.tmpdir();
    const outputTemplate = path.join(tempDir, `${uniqueId}.%(ext)s`);
    const expectedMp4Path = path.join(tempDir, `${uniqueId}.mp4`);

    const ffmpegBinary = getFfmpegPath();

    const args = [
      "-m",
      "yt_dlp",
      "--no-warnings",
      "--no-check-certificates",
      "-f",
      "bestvideo+bestaudio/best",
      "--merge-output-format",
      "mp4",
      "--ffmpeg-location",
      ffmpegBinary,
      "-o",
      outputTemplate,
      validation.cleanUrl,
    ];

    const { stderr } = await execFileAsync("python", args, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 90000,
    });

    if (!fs.existsSync(expectedMp4Path)) {
      return {
        success: false,
        error: {
          code: "PRIVATE_CONTENT",
          message: "Could not download Instagram video. This content may be private or restricted.",
        },
      };
    }

    const stats = fs.statSync(expectedMp4Path);
    if (stats.size === 0) {
      fs.unlinkSync(expectedMp4Path);
      return {
        success: false,
        error: {
          code: "EMPTY_FILE",
          message: "Downloaded Instagram file was empty.",
        },
      };
    }

    const cleanTitle = sanitizeFilename(validation.contentId || "instagram_media");

    return {
      success: true,
      filePath: expectedMp4Path,
      filename: `${cleanTitle}_instagram.mp4`,
      filesize: stats.size,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: "PRIVATE_CONTENT",
        message: "Failed to download Instagram Reel or post. Content may be private or restricted.",
      },
    };
  }
}
