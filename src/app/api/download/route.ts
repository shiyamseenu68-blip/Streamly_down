import { NextRequest, NextResponse } from "next/server";
import { validateMediaUrl, validateDownloadParams } from "@/lib/utils/validators";
import { processYouTubeMp3 } from "@/lib/audio/mp3";
import { processYouTubeMp4 } from "@/lib/video/mp4";
import { processInstagramMp4 } from "@/lib/extractors/instagram";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const type = (searchParams.get("type") || "mp4").toLowerCase();
    const quality = searchParams.get("quality") || "720p HD";

    // 1. Parameter presence check
    if (!url) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_URL", message: "URL parameter is required." } },
        { status: 400 }
      );
    }

    // 2. Download parameter whitelist check
    const paramValidation = validateDownloadParams(type, quality);
    if (!paramValidation.isValid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PARAMETERS", message: paramValidation.message } },
        { status: 400 }
      );
    }

    // 3. Stage 2 URL & SSRF Validation
    const validation = validateMediaUrl(url);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation },
        { status: 400 }
      );
    }

    let result;
    let contentType = "video/mp4";

    if (validation.platform === "youtube") {
      if (type === "mp3") {
        result = await processYouTubeMp3(url, quality);
        contentType = "audio/mpeg";
      } else {
        result = await processYouTubeMp4(url, quality);
        contentType = "video/mp4";
      }
    } else if (validation.platform === "instagram") {
      result = await processInstagramMp4(url, quality);
      contentType = "video/mp4";
    } else {
      return NextResponse.json(
        { success: false, error: { code: "UNSUPPORTED_PLATFORM", message: "Unsupported platform." } },
        { status: 400 }
      );
    }

    if (!result.success) {
      const statusCode = result.error?.code === "TIMEOUT_ERROR" ? 504 : 400;
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      );
    }

    const { filePath, filename, filesize } = result;

    const nodeStream = fs.createReadStream(filePath);

    // Immediate temporary file cleanup handler
    const cleanup = () => {
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Temp file cleanup error:", err.message);
        }
      });
    };

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        nodeStream.on("end", () => {
          controller.close();
          cleanup();
        });
        nodeStream.on("error", (err) => {
          controller.error(err);
          cleanup();
        });
      },
      cancel() {
        nodeStream.destroy();
        cleanup();
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set("Content-Length", filesize.toString());
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return new NextResponse(webStream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "An unexpected server error occurred during media download.",
        },
      },
      { status: 500 }
    );
  }
}
