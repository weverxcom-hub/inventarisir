import { NextRequest, NextResponse } from "next/server";
import {
  getSheetData,
  appendRow,
  generateItemId,
} from "@/lib/google";
import { apiHandler, parseJson, requireRoles } from "@/lib/api";
import { getAppUrl } from "@/lib/env";
import { inventoryCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const data = await getSheetData("Inventory");
  const rows = data.slice(1);

  const items = rows.map((row) => ({
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
  }));

  return NextResponse.json({ items });
});

export const POST = apiHandler(async (req: NextRequest) => {
  await requireRoles(["Admin"]);
  const body = await parseJson(req, inventoryCreateSchema);

  const itemId = await generateItemId();
  const itemUrl = `${getAppUrl()}/item/${itemId}`;
  const now = new Date().toISOString();

  await appendRow("Inventory", [
    itemId,
    body.name,
    body.category,
    String(body.quantity),
    body.location,
    body.condition ?? "Good",
    body.photo_url || "",
    body.receipt_url || "",
    itemUrl, // QR_URL: store canonical URL only; client renders the QR.
    now,
  ]);

  return NextResponse.json({
    success: true,
    item_id: itemId,
    qr_url: itemUrl,
  });
});
