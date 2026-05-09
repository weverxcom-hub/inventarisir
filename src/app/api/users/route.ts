import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSheetData, appendRow } from "@/lib/google";
import {
  apiHandler,
  conflict,
  parseJson,
  requireRoles,
} from "@/lib/api";
import { userCreateSchema } from "@/lib/validation";

export const GET = apiHandler(async () => {
  await requireRoles(["Admin"]);

  const data = await getSheetData("Users");
  const rows = data.slice(1);

  const users = rows.map((row) => ({
    name: row[0] || "",
    email: row[1] || "",
    role: row[3] || "Staff",
  }));

  return NextResponse.json({ users });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireRoles(["Admin"]);
  const body = await parseJson(req, userCreateSchema);

  const data = await getSheetData("Users");
  const existing = data
    .slice(1)
    .find((row) => (row[1] || "").trim().toLowerCase() === body.email);
  if (existing) throw conflict("Email sudah terdaftar");

  const hashedPassword = await bcrypt.hash(body.password, 10);
  await appendRow("Users", [body.name, body.email, hashedPassword, body.role]);

  return NextResponse.json({ success: true });
});
