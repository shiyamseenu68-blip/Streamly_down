import { NextRequest, NextResponse } from "next/server";
import { validateMediaUrl } from "@/lib/utils/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    const result = validateMediaUrl(url);

    if (result.isValid) {
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result,
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          isValid: false,
          code: "MALFORMED_URL",
          message: "An unexpected error occurred while parsing the URL.",
        },
      },
      { status: 500 }
    );
  }
}
