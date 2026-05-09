import { NextRequest, NextResponse } from "next/server";
import {
  getSheetData,
  appendRow,
  updateRow,
  generateRequestId,
  generateItemId,
  findRowIndex,
} from "@/lib/google";
import {
  apiHandler,
  badRequest,
  notFound,
  parseJson,
  requireRoles,
  requireSession,
} from "@/lib/api";
import { getAppUrl } from "@/lib/env";
import {
  procurementActionSchema,
  procurementCreateSchema,
} from "@/lib/validation";

export const GET = apiHandler(async () => {
  await requireSession();

  const data = await getSheetData("Procurement");
  const rows = data.slice(1);

  const requests = rows.map((row) => ({
    request_id: row[0] || "",
    requestor_name: row[1] || "",
    item_name: row[2] || "",
    quantity: parseInt(row[3] || "0", 10),
    estimated_price: parseFloat(row[4] || "0"),
    status: row[5] || "Pending",
    nota_photo_drive_id: row[6] || "",
    created_at: row[7] || "",
  }));

  return NextResponse.json({ requests });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const body = await parseJson(req, procurementCreateSchema);

  const requestId = await generateRequestId();
  const now = new Date().toISOString();

  await appendRow("Procurement", [
    requestId,
    session.user.name || session.user.email || "Unknown",
    body.item_name,
    String(body.quantity),
    String(body.estimated_price),
    "Pending",
    body.nota_photo_drive_id || "",
    now,
  ]);

  return NextResponse.json({ success: true, request_id: requestId });
});

export const PUT = apiHandler(async (req: NextRequest) => {
  await requireSession();
  const body = await parseJson(req, procurementActionSchema);

  const data = await getSheetData("Procurement");
  const rowIndex = findRowIndex(data, 0, body.request_id);
  if (rowIndex === -1) throw notFound("Permintaan tidak ditemukan");

  const existing = [...(data[rowIndex - 1] ?? [])];

  if (body.status === "Approved" || body.status === "Rejected") {
    await requireRoles(["Approver", "Admin"]);
    existing[5] = body.status;
    await updateRow("Procurement", rowIndex, existing);
    return NextResponse.json({ success: true });
  }

  if (body.action === "complete") {
    await requireRoles(["Admin"]);
    if (existing[5] !== "Approved") {
      throw badRequest(
        "Permintaan harus disetujui dulu sebelum diselesaikan"
      );
    }

    existing[5] = "Completed";
    await updateRow("Procurement", rowIndex, existing);

    const itemId = await generateItemId();
    const itemUrl = `${getAppUrl()}/item/${itemId}`;
    const now = new Date().toISOString();

    await appendRow("Inventory", [
      itemId,
      existing[2] || "Item",
      "Umum",
      existing[3] || "1",
      "-",
      "Good",
      "",
      "",
      itemUrl,
      now,
    ]);

    return NextResponse.json({ success: true, item_id: itemId });
  }

  throw badRequest("Aksi tidak dikenal");
});
