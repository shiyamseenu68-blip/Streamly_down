import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";
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
  if (!title) return "video";
  const clean = title
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
  return clean.slice(0, 80) || "video";
}

export function parseTargetHeight(qualityLabel: string): number {
  if (qualityLabel.includes("2160") || qualityLabel.includes("4K")) return 2160;
  if (qualityLabel.includes("1440") || qualityLabel.includes("2K")) return 1440;
  if (qualityLabel.includes("1080")) return 1080;
  if (qualityLabel.includes("720")) return 720;
  if (qualityLabel.includes("480")) return 480;
  if (qualityLabel.includes("360")) return 360;
  if (qualityLabel.includes("240")) return 240;
  return 1080;
}

export interface Mp4ProcessingResult {
  success: true;
  filePath: string;
  filename: string;
  filesize: number;
}

export interface Mp4ProcessingError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type Mp4Response = Mp4ProcessingResult | Mp4ProcessingError;

/**
 * Cleans up any leftover intermediate files matching the unique execution ID
 */
function cleanupIntermediateFiles(uniqueId: string, keepFilePath?: string) {
  try {
    const tempDir = os.tmpdir();
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file.startsWith(uniqueId)) {
        const fullPath = path.join(tempDir, file);
        if (!keepFilePath || fullPath !== keepFilePath) {
          try {
            fs.unlinkSync(fullPath);
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Downloads YouTube video stream & audio stream, merging into a valid MP4 file via FFmpeg safely
 */
export async function processYouTubeMp4(
  url: string,
  qualityLabel: string = "720p HD"
): Promise<Mp4Response> {
  const uniqueId = `streamly_mp4_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const tempDir = os.tmpdir();
  const expectedMp4Path = path.join(tempDir, `${uniqueId}.mp4`);

  try {
    const validation = validateMediaUrl(url);
    if (!validation.isValid || validation.platform !== "youtube") {
      return {
        success: false,
        error: {
          code: "INVALID_URL",
          message: "A valid YouTube URL is required for MP4 processing.",
        },
      };
    }

    const targetHeight = parseTargetHeight(qualityLabel);
    const formatSpec = `bestvideo[height=${targetHeight}]+bestaudio/bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}]/best`;
    const outputTemplate = path.join(tempDir, `${uniqueId}.%(ext)s`);

    const ffmpegBinary = getFfmpegPath();

    const args = [
      "-m",
      "yt_dlp",
      "--no-warnings",
      "--no-call-home",
      "--no-check-certificates",
      "-f",
      formatSpec,
      "--merge-output-format",
      "mp4",
      "--ffmpeg-location",
      ffmpegBinary,
      "-o",
      outputTemplate,
      validation.cleanUrl,
    ];

    await execFileAsync("python", args, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120000,
    });

    // Remove any leftover intermediate video/audio stream files before merge
    cleanupIntermediateFiles(uniqueId, expectedMp4Path);

    if (!fs.existsSync(expectedMp4Path)) {
      return {
        success: false,
        error: {
          code: "MP4_MERGE_FAILED",
          message: "Failed to generate merged MP4 video file.",
        },
      };
    }

    const stats = fs.statSync(expectedMp4Path);
    if (stats.size === 0) {
      cleanupIntermediateFiles(uniqueId);
      return {
        success: false,
        error: {
          code: "EMPTY_MP4_FILE",
          message: "Generated MP4 file was empty.",
        },
      };
    }

    const cleanTitle = sanitizeFilename(validation.contentId || "video");
    const cleanQualityTag = qualityLabel.replace(/\s+/g, "_");

    return {
      success: true,
      filePath: expectedMp4Path,
      filename: `${cleanTitle}_${cleanQualityTag}.mp4`,
      filesize: stats.size,
    };
  } catch (error: any) {
    cleanupIntermediateFiles(uniqueId);

    const isTimeout = error?.killed || error?.code === "ETIMEDOUT";
    return {
      success: false,
      error: {
        code: isTimeout ? "TIMEOUT_ERROR" : "MP4_PROCESSING_ERROR",
        message: isTimeout
          ? "MP4 video processing request timed out. Please try again."
          : "Failed to process YouTube MP4 video download.",
      },
    };
  }
}
