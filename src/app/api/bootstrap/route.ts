import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSheetData, appendRow } from "@/lib/google";
import { apiHandler, badRequest, parseJson } from "@/lib/api";
import { bootstrapSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/bootstrap
 *
 * Seeds the very first admin user when the Users sheet only contains the
 * header row. This avoids the friction of generating a bcrypt hash by hand.
 * Once any user exists this endpoint refuses, so it cannot be abused.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const data = await getSheetData("Users");
  const rows = data.slice(1).filter((row) => (row[1] || "").trim() !== "");
  if (rows.length > 0) {
    throw badRequest(
      "Bootstrap sudah pernah dijalankan. Tambah pengguna lewat halaman Kelola Pengguna."
    );
  }

  const body = await parseJson(req, bootstrapSchema);
  const hashedPassword = await bcrypt.hash(body.password, 10);
  await appendRow("Users", [body.name, body.email, hashedPassword, "Admin"]);

  return NextResponse.json({ success: true });
});

export const GET = apiHandler(async () => {
  const data = await getSheetData("Users");
  const rows = data.slice(1).filter((row) => (row[1] || "").trim() !== "");
  return NextResponse.json({ needsBootstrap: rows.length === 0 });
});
