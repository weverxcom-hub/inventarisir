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
import { inventoryUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const data = await getSheetData("Inventory");
    const row = data.slice(1).find((r) => r[0] === params.id);
    if (!row) throw notFound("Item tidak ditemukan");

    const item = {
      item_id: row[0] || "",
      name: row[1] || "",
      category: row[2] || "",
      quantity: parseInt(row[3] || "0", 10),
      location: row[4] || "",
      condition: row[5] || "Good",
      photo_url: row[6] || "",
      receipt_url: row[7] || "",
      qr_url: row[8] || "",
      created_at: row[9] || "",
    };

    return NextResponse.json({ item });
  }
);

export const PUT = apiHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await requireRoles(["Admin"]);
    const body = await parseJson(req, inventoryUpdateSchema);

    const data = await getSheetData("Inventory");
    const rowIndex = findRowIndex(data, 0, params.id);
    if (rowIndex === -1) throw notFound("Item tidak ditemukan");

    const existing = data[rowIndex - 1];

    await updateRow("Inventory", rowIndex, [
      params.id,
      body.name ?? existing[1] ?? "",
      body.category ?? existing[2] ?? "",
      String(body.quantity ?? existing[3] ?? "0"),
      body.location ?? existing[4] ?? "",
      body.condition ?? existing[5] ?? "Good",
      body.photo_url ?? existing[6] ?? "",
      body.receipt_url ?? existing[7] ?? "",
      existing[8] ?? "",
      existing[9] ?? "",
    ]);

    return NextResponse.json({ success: true });
  }
);

export const DELETE = apiHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    await requireRoles(["Admin"]);

    const data = await getSheetData("Inventory");
    const rowIndex = findRowIndex(data, 0, params.id);
    if (rowIndex === -1) throw notFound("Item tidak ditemukan");

    await deleteRow("Inventory", rowIndex);
    return NextResponse.json({ success: true });
  }
);
