import { NextRequest, NextResponse } from "next/server";
import {
  appendRow,
  ensureSheet,
  findRowIndex,
  generateBastId,
  getSheetData,
  updateRow,
} from "@/lib/google";
import {
  apiHandler,
  badRequest,
  parseJson,
  requireRoles,
  requireSession,
} from "@/lib/api";
import { handoverCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const HANDOVERS_HEADER = [
  "bast_id",
  "handover_date",
  "place",
  "giver_name",
  "giver_position",
  "receiver_name",
  "receiver_position",
  "receiver_unit",
  "item_ids",
  "notes",
  "created_at",
  "created_by",
  "nomor_surat",
];

function rowToHandover(row: string[]) {
  return {
    bast_id: row[0] || "",
    handover_date: row[1] || "",
    place: row[2] || "",
    giver_name: row[3] || "",
    giver_position: row[4] || "",
    receiver_name: row[5] || "",
    receiver_position: row[6] || "",
    receiver_unit: row[7] || "",
    item_ids: (row[8] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    notes: row[9] || "",
    created_at: row[10] || "",
    created_by: row[11] || "",
    nomor_surat: row[12] || "",
  };
}

export const GET = apiHandler(async () => {
  await requireSession();
  await ensureSheet("Handovers", HANDOVERS_HEADER);

  const data = await getSheetData("Handovers");
  const handovers = data
    .slice(1)
    .map(rowToHandover)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return NextResponse.json({ handovers });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await requireRoles(["Admin"]);
  await ensureSheet("Handovers", HANDOVERS_HEADER);

  const body = await parseJson(req, handoverCreateSchema);

  // Verify each item_id exists in Inventory before creating the BAST.
  const inventoryData = await getSheetData("Inventory");
  const inventoryIds = new Set(
    inventoryData.slice(1).map((row) => row[0] || "")
  );
  const missing = body.item_ids.filter((id) => !inventoryIds.has(id));
  if (missing.length > 0) {
    throw badRequest(
      `Barang tidak ditemukan di inventaris: ${missing.join(", ")}`
    );
  }

  const bastId = await generateBastId();
  const now = new Date().toISOString();

  await appendRow("Handovers", [
    bastId,
    body.handover_date,
    body.place,
    body.giver_name,
    body.giver_position || "",
    body.receiver_name,
    body.receiver_position || "",
    body.receiver_unit,
    body.item_ids.join(","),
    body.notes || "",
    now,
    session.user.email || "",
    body.nomor_surat || "",
  ]);

  // Optional: when items handed over, mark their inventory location as the
  // receiving unit so reports stay accurate. Disable by sending
  // update_inventory_location=false.
  if (body.update_inventory_location !== false) {
    for (const itemId of body.item_ids) {
      const rowIndex = findRowIndex(inventoryData, 0, itemId);
      if (rowIndex === -1) continue;
      const existing = inventoryData[rowIndex - 1];
      await updateRow("Inventory", rowIndex, [
        existing[0] ?? itemId,
        existing[1] ?? "",
        existing[2] ?? "",
        existing[3] ?? "0",
        body.receiver_unit, // location → receiver unit
        existing[5] ?? "Good",
        existing[6] ?? "",
        existing[7] ?? "",
        existing[8] ?? "",
        existing[9] ?? "",
      ]);
    }
  }

  return NextResponse.json({ success: true, bast_id: bastId });
});
