import { NextRequest, NextResponse } from "next/server";
import { uploadFileToDrive } from "@/lib/google";
import { requireAuth } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFileToDrive(file.name, file.type, buffer);

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload file";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
