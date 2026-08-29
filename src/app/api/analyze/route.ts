import { NextRequest, NextResponse } from "next/server";
import { validateMediaUrl } from "@/lib/utils/validators";
import { extractYouTubeMetadata } from "@/lib/extractors/youtube";
import { extractInstagramMetadata } from "@/lib/extractors/instagram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    // 1. Stage 2 URL validation
    const validation = validateMediaUrl(url);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation,
        },
        { status: 400 }
      );
    }

    // 2. Handle YouTube Platform
    if (validation.platform === "youtube") {
      const extraction = await extractYouTubeMetadata(validation.cleanUrl);

      if (!extraction.success) {
        return NextResponse.json(
          {
            success: false,
            error: extraction.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: extraction.data,
      });
    }

    // 3. Handle Instagram Platform (STAGE 6 ACTIVE)
    if (validation.platform === "instagram") {
      const extraction = await extractInstagramMetadata(validation.cleanUrl);

      if (!extraction.success) {
        return NextResponse.json(
          {
            success: false,
            error: extraction.error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: extraction.data,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNSUPPORTED_PLATFORM",
          message: "Unsupported platform.",
        },
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during media analysis.",
        },
      },
      { status: 500 }
    );
  }
}
