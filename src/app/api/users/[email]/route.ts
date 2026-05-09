import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getSheetData,
  updateRow,
  deleteRow,
  findRowIndex,
} from "@/lib/google";
import {
  apiHandler,
  notFound,
  parseJson,
  requireRoles,
} from "@/lib/api";
import { userUpdateSchema } from "@/lib/validation";

function normalizeEmail(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase();
}

export const PUT = apiHandler(
  async (req: NextRequest, { params }: { params: { email: string } }) => {
    await requireRoles(["Admin"]);
    const email = normalizeEmail(params.email);
    const body = await parseJson(req, userUpdateSchema);

    const data = await getSheetData("Users");
    const rowIndex = findRowIndex(data, 1, email);
    if (rowIndex === -1) throw notFound("Pengguna tidak ditemukan");

    const existing = data[rowIndex - 1];
    const hashedPassword = body.password
      ? await bcrypt.hash(body.password, 10)
      : existing[2] ?? "";

    await updateRow("Users", rowIndex, [
      body.name ?? existing[0] ?? "",
      email,
      hashedPassword,
      body.role ?? existing[3] ?? "Staff",
    ]);

    return NextResponse.json({ success: true });
  }
);

export const DELETE = apiHandler(
  async (_req: NextRequest, { params }: { params: { email: string } }) => {
    const session = await requireRoles(["Admin"]);
    const email = normalizeEmail(params.email);

    if (
      session.user.email &&
      session.user.email.trim().toLowerCase() === email
    ) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }

    const data = await getSheetData("Users");
    const rowIndex = findRowIndex(data, 1, email);
    if (rowIndex === -1) throw notFound("Pengguna tidak ditemukan");

    await deleteRow("Users", rowIndex);
    return NextResponse.json({ success: true });
  }
);
