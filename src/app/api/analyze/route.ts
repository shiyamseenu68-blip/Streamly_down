import { NextRequest, NextResponse } from "next/server";
import { validateMediaUrl } from "@/lib/utils/validators";
import { extractYouTubeMetadata } from "@/lib/extractors/youtube";
import { extractInstagramMetadata } from "@/lib/extractors/instagram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // 1. Stage 2 URL & SSRF Validation
    const validation = validateMediaUrl(url);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation },
        { status: 400 }
      );
    }

    const backendUrl = process.env.STREAMLY_BACKEND_URL;
    const apiSecret = process.env.STREAMLY_API_SECRET || "";

    // 2. Production Proxy to Render Python Backend (if configured)
    if (backendUrl) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiSecret) {
        headers["Authorization"] = `Bearer ${apiSecret}`;
      }

      const proxyRes = await fetch(`${backendUrl}/api/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: validation.cleanUrl }),
      });

      const proxyJson = await proxyRes.json();
      if (!proxyRes.ok || !proxyJson.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: proxyJson.detail?.includes("private") ? "PRIVATE_CONTENT" : "EXTRACTION_FAILED",
              message: proxyJson.detail || proxyJson.error?.message || "Failed to extract media details from remote service.",
            },
          },
          { status: proxyRes.status || 400 }
        );
      }

      return NextResponse.json(proxyJson, { status: 200 });
    }

    // 3. Fallback to Local Extraction (for local development)
    let result;
    if (validation.platform === "youtube") {
      result = await extractYouTubeMetadata(validation.cleanUrl);
    } else if (validation.platform === "instagram") {
      result = await extractInstagramMetadata(validation.cleanUrl);
    } else {
      return NextResponse.json(
        { success: false, error: { code: "UNSUPPORTED_PLATFORM", message: "Unsupported platform." } },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "An unexpected server error occurred during metadata analysis.",
        },
      },
      { status: 500 }
    );
  }
}
