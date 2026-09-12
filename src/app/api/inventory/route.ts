import { NextRequest, NextResponse } from "next/server";
import { getSheetData, updateRow, deleteRow, createInventoryRow } from "@/lib/google";
import { requireAuth, requireRole } from "@/lib/session";

const VALID_CONDITIONS = ["Good", "Repair", "Broken"];

export async function GET() {
  try {
    await requireAuth();

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
    const message =
      error instanceof Error ? error.message : "Failed to fetch inventory";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["Admin"]);

    const body = await req.json();
    const { name, category, quantity, location, condition, photo_url, receipt_url } = body;

    if (!name || !category || !location) {
      return NextResponse.json(
        { error: "Name, category, and location are required" },
        { status: 400 }
      );
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be a positive whole number" },
        { status: 400 }
      );
    }
    if (condition && !VALID_CONDITIONS.includes(condition)) {
      return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const itemId = await createInventoryRow([
      name,
      category,
      String(quantity),
      location,
      condition || "Good",
      photo_url || "",
      receipt_url || "",
      "",
      now,
    ]);

    return NextResponse.json({
      success: true,
      item_id: itemId,
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

    if (!item_id) {
      return NextResponse.json({ error: "item_id is required" }, { status: 400 });
    }
    if ([name, category, location].some((field) => field !== undefined && !field)) {
      return NextResponse.json(
        { error: "Name, category, and location cannot be empty" },
        { status: 400 }
      );
    }
    if (quantity !== undefined && (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1)) {
      return NextResponse.json(
        { error: "Quantity must be a positive whole number" },
        { status: 400 }
      );
    }
    if (condition && !VALID_CONDITIONS.includes(condition)) {
      return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
    }

    const data = await getSheetData("Inventory");
    const rowIndex = data.findIndex((row) => row[0] === item_id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const existing = data[rowIndex];

    await updateRow("Inventory", rowIndex + 1, [
      item_id,
      name ?? existing[1],
      category ?? existing[2],
      String(quantity ?? existing[3]),
      location ?? existing[4],
      condition ?? existing[5],
      photo_url ?? existing[6],
      receipt_url ?? existing[7],
      existing[8],
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
