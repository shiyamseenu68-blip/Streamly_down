import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Streamly",
    version: "1.0.0",
    stage: 1,
    timestamp: new Date().toISOString(),
  });
}
