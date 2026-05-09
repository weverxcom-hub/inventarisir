import { NextRequest, NextResponse } from "next/server";
import { uploadFileToDrive } from "@/lib/google";
import { apiHandler, badRequest, requireSession } from "@/lib/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

export const POST = apiHandler(async (req: NextRequest) => {
  await requireSession();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) throw badRequest("File tidak ditemukan");

  if (file.size > MAX_FILE_SIZE) {
    throw badRequest("Ukuran file maksimal 10 MB");
  }

  const allowed = ALLOWED_MIME_PREFIXES.some((p) =>
    (file.type || "").startsWith(p)
  );
  if (!allowed) {
    throw badRequest("Tipe file tidak didukung (gunakan gambar atau PDF)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFileToDrive(file.name, file.type, buffer);

  return NextResponse.json({
    success: true,
    fileId: result.fileId,
    webViewLink: result.webViewLink,
  });
});
