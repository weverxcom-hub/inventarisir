import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/lib/google";
import { apiHandler, notFound } from "@/lib/api";

export const GET = apiHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    // Public so QR-style "view BAST" links work without login. Sensitive
    // signer info is the same as on the printed sheet anyway.
    const data = await getSheetData("Handovers");
    const row = data.slice(1).find((r) => r[0] === params.id);
    if (!row) throw notFound("BAST tidak ditemukan");

    const handover = {
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
    };

    // Hydrate items so the public page can render the table without
    // making N additional fetches.
    const inventory = await getSheetData("Inventory");
    const itemMap = new Map<string, string[]>();
    for (const r of inventory.slice(1)) {
      if (r[0]) itemMap.set(r[0], r);
    }
    const items = handover.item_ids.map((id) => {
      const r = itemMap.get(id);
      return {
        item_id: id,
        name: r?.[1] || "(item dihapus)",
        category: r?.[2] || "",
        quantity: parseInt(r?.[3] || "1", 10),
        condition: r?.[5] || "",
      };
    });

    return NextResponse.json({ handover, items });
  }
);
