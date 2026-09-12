import { NextRequest, NextResponse } from "next/server";
import { getDriveFile } from "@/lib/google";
import { requireAuth } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const { buffer, mimeType } = await getDriveFile(params.id);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch file";
    const status = message === "Unauthorized" ? 401 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
