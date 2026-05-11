import { NextRequest, NextResponse } from "next/server";
import {
  getSheetData,
  appendRow,
  ensureSheet,
  generateUnitId,
} from "@/lib/google";
import {
  apiHandler,
  conflict,
  parseJson,
  requireRoles,
  requireSession,
} from "@/lib/api";
import { unitCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const UNITS_HEADER = [
  "unit_id",
  "name",
  "code",
  "description",
  "created_at",
  "updated_at",
];

function rowToUnit(row: string[]) {
  return {
    unit_id: row[0] || "",
    name: row[1] || "",
    code: row[2] || "",
    description: row[3] || "",
    created_at: row[4] || "",
    updated_at: row[5] || "",
  };
}

export const GET = apiHandler(async () => {
  await requireSession();
  await ensureSheet("Units", UNITS_HEADER);

  const data = await getSheetData("Units");
  const units = data.slice(1).map(rowToUnit);
  return NextResponse.json({ units });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireRoles(["Admin"]);
  await ensureSheet("Units", UNITS_HEADER);

  const body = await parseJson(req, unitCreateSchema);

  const data = await getSheetData("Units");
  const duplicate = data
    .slice(1)
    .find(
      (row) =>
        (row[1] || "").trim().toLowerCase() ===
        body.name.trim().toLowerCase()
    );
  if (duplicate) throw conflict("Unit dengan nama ini sudah ada");

  const unitId = await generateUnitId();
  const now = new Date().toISOString();

  await appendRow("Units", [
    unitId,
    body.name,
    body.code || "",
    body.description || "",
    now,
    now,
  ]);

  return NextResponse.json({ success: true, unit_id: unitId });
});
