import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/lib/google";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getSheetData("Inventory");
    const rows = data.slice(1);

    const row = rows.find((r) => r[0] === params.id);

    if (!row) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

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
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}
