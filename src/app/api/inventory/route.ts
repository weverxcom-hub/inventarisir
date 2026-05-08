import { NextRequest, NextResponse } from "next/server";
import { getSheetData, appendRow, updateRow, deleteRow, generateItemId } from "@/lib/google";
import { requireRole } from "@/lib/session";
import QRCode from "qrcode";

export async function GET() {
  try {
    const data = await getSheetData("Inventory");
    const headers = data[0] || [];
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

    return NextResponse.json({ items, headers });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["Admin"]);

    const body = await req.json();
    const { name, category, quantity, location, condition, photo_url, receipt_url } = body;

    const itemId = await generateItemId();
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const itemUrl = `${appUrl}/item/${itemId}`;
    const qrDataUrl = await QRCode.toDataURL(itemUrl, { width: 300, margin: 1 });

    const now = new Date().toISOString();

    await appendRow("Inventory", [
      itemId,
      name,
      category,
      String(quantity),
      location,
      condition || "Good",
      photo_url || "",
      receipt_url || "",
      qrDataUrl,
      now,
    ]);

    return NextResponse.json({
      success: true,
      item_id: itemId,
      qr_url: qrDataUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create item";
    const status = message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(["Admin"]);

    const body = await req.json();
    const { item_id, name, category, quantity, location, condition, photo_url, receipt_url } = body;

    const data = await getSheetData("Inventory");
    const rowIndex = data.findIndex((row) => row[0] === item_id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const existing = data[rowIndex];
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const itemUrl = `${appUrl}/item/${item_id}`;
    const qrDataUrl = existing[8] || (await QRCode.toDataURL(itemUrl, { width: 300, margin: 1 }));

    await updateRow("Inventory", rowIndex + 1, [
      item_id,
      name ?? existing[1],
      category ?? existing[2],
      String(quantity ?? existing[3]),
      location ?? existing[4],
      condition ?? existing[5],
      photo_url ?? existing[6],
      receipt_url ?? existing[7],
      qrDataUrl,
      existing[9],
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    const status = message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(["Admin"]);

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("item_id");

    if (!itemId) {
      return NextResponse.json({ error: "item_id required" }, { status: 400 });
    }

    const data = await getSheetData("Inventory");
    const rowIndex = data.findIndex((row) => row[0] === itemId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await deleteRow("Inventory", rowIndex + 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete item";
    const status = message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
