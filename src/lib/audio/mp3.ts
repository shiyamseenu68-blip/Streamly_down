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
  if (!title) return "audio";
  const clean = title
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
  return clean.slice(0, 80) || "audio";
}

export interface Mp3ProcessingResult {
  success: true;
  filePath: string;
  filename: string;
  filesize: number;
}

export interface Mp3ProcessingError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type Mp3Response = Mp3ProcessingResult | Mp3ProcessingError;

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
 * Downloads YouTube audio stream and converts to MP3 at target bitrate safely
 */
export async function processYouTubeMp3(
  url: string,
  qualityLabel: string = "192kbps"
): Promise<Mp3Response> {
  const uniqueId = `streamly_mp3_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const tempDir = os.tmpdir();
  const expectedMp3Path = path.join(tempDir, `${uniqueId}.mp3`);

  try {
    const validation = validateMediaUrl(url);
    if (!validation.isValid || validation.platform !== "youtube") {
      return {
        success: false,
        error: {
          code: "INVALID_URL",
          message: "A valid YouTube URL is required for MP3 processing.",
        },
      };
    }

    let bitrateArg = "192k";
    if (qualityLabel.includes("320")) bitrateArg = "320k";
    else if (qualityLabel.includes("256")) bitrateArg = "256k";
    else if (qualityLabel.includes("128")) bitrateArg = "128k";
    else if (qualityLabel.includes("192")) bitrateArg = "192k";

    const outputTemplate = path.join(tempDir, `${uniqueId}.%(ext)s`);
    const ffmpegBinary = getFfmpegPath();

    const args = [
      "-m",
      "yt_dlp",
      "--no-warnings",
      "--no-call-home",
      "--no-check-certificates",
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      bitrateArg,
      "--ffmpeg-location",
      ffmpegBinary,
      "-o",
      outputTemplate,
      validation.cleanUrl,
    ];

    await execFileAsync("python", args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
    });

    // Remove any leftover raw .webm / .m4a intermediate download files
    cleanupIntermediateFiles(uniqueId, expectedMp3Path);

    if (!fs.existsSync(expectedMp3Path)) {
      return {
        success: false,
        error: {
          code: "MP3_CONVERSION_FAILED",
          message: "Failed to generate MP3 audio file.",
        },
      };
    }

    const stats = fs.statSync(expectedMp3Path);
    if (stats.size === 0) {
      cleanupIntermediateFiles(uniqueId);
      return {
        success: false,
        error: {
          code: "EMPTY_FILE",
          message: "Generated MP3 file was empty.",
        },
      };
    }

    const cleanTitle = sanitizeFilename(validation.contentId || "audio");

    return {
      success: true,
      filePath: expectedMp3Path,
      filename: `${cleanTitle}_${qualityLabel}.mp3`,
      filesize: stats.size,
    };
  } catch (error: any) {
    cleanupIntermediateFiles(uniqueId);

    const isTimeout = error?.killed || error?.code === "ETIMEDOUT";
    return {
      success: false,
      error: {
        code: isTimeout ? "TIMEOUT_ERROR" : "MP3_PROCESSING_ERROR",
        message: isTimeout
          ? "MP3 audio extraction request timed out. Please try again."
          : "Failed to process YouTube MP3 audio stream.",
      },
    };
  }
}
