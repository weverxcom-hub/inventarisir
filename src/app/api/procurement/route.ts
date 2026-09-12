import { NextRequest, NextResponse } from "next/server";
import {
  getSheetData,
  updateRow,
  createProcurementRow,
  createInventoryRow,
} from "@/lib/google";
import { requireAuth, requireRole } from "@/lib/session";

export async function GET() {
  try {
    await requireAuth();

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
      updated_by: row[8] || "",
      updated_at: row[9] || "",
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch procurement";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const { item_name, quantity, estimated_price, nota_photo_drive_id } = body;

    if (!item_name) {
      return NextResponse.json({ error: "item_name is required" }, { status: 400 });
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be a positive whole number" },
        { status: 400 }
      );
    }
    if (typeof estimated_price !== "number" || estimated_price < 0) {
      return NextResponse.json(
        { error: "Estimated price must be a non-negative number" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const requestId = await createProcurementRow([
      session.user.name || session.user.email || "Unknown",
      item_name,
      String(quantity),
      String(estimated_price),
      "Pending",
      nota_photo_drive_id || "",
      now,
      "",
      "",
    ]);

    return NextResponse.json({ success: true, request_id: requestId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create request";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const { request_id, status, action } = body;

    const data = await getSheetData("Procurement");
    const rowIndex = data.findIndex((row) => row[0] === request_id);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const existing = data[rowIndex];

    // Approve/Reject action (Approver or Admin)
    if (status === "Approved" || status === "Rejected") {
      const approver = await requireRole(["Approver", "Admin"]);

      existing[5] = status;
      existing[8] = approver.user.email || "";
      existing[9] = new Date().toISOString();
      await updateRow("Procurement", rowIndex + 1, existing);

      return NextResponse.json({ success: true });
    }

    // Complete action — Admin converts to inventory item
    if (action === "complete") {
      const admin = await requireRole(["Admin"]);

      existing[5] = "Completed";
      existing[8] = admin.user.email || "";
      existing[9] = new Date().toISOString();
      await updateRow("Procurement", rowIndex + 1, existing);

      // Auto-add to inventory
      const now = new Date().toISOString();

      const itemId = await createInventoryRow([
        existing[2], // item_name
        "Umum", // default category
        existing[3], // quantity
        "-",
        "Good",
        "",
        "",
        "",
        now,
      ]);

      return NextResponse.json({ success: true, item_id: itemId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update request";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
