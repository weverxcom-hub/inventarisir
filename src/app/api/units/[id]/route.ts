import { NextRequest, NextResponse } from "next/server";
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
import { unitUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const PUT = apiHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await requireRoles(["Admin"]);
    const body = await parseJson(req, unitUpdateSchema);

    const data = await getSheetData("Units");
    const rowIndex = findRowIndex(data, 0, params.id);
    if (rowIndex === -1) throw notFound("Unit tidak ditemukan");

    const existing = data[rowIndex - 1];
    const now = new Date().toISOString();

    await updateRow("Units", rowIndex, [
      params.id,
      body.name ?? existing[1] ?? "",
      body.code ?? existing[2] ?? "",
      body.description ?? existing[3] ?? "",
      existing[4] ?? now,
      now,
    ]);

    return NextResponse.json({ success: true });
  }
);

export const DELETE = apiHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    await requireRoles(["Admin"]);

    const data = await getSheetData("Units");
    const rowIndex = findRowIndex(data, 0, params.id);
    if (rowIndex === -1) throw notFound("Unit tidak ditemukan");

    await deleteRow("Units", rowIndex);
    return NextResponse.json({ success: true });
  }
);
