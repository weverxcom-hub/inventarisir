import { NextRequest, NextResponse } from "next/server";
import {
  getSheetData,
  appendRow,
  updateRow,
  generateRequestId,
  generateItemId,
} from "@/lib/google";
import { requireAuth, requireRole } from "@/lib/session";
import QRCode from "qrcode";

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

    const requestId = await generateRequestId();
    const now = new Date().toISOString();

    await appendRow("Procurement", [
      requestId,
      session.user.name || session.user.email || "Unknown",
      item_name,
      String(quantity),
      String(estimated_price),
      "Pending",
      nota_photo_drive_id || "",
      now,
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
      await requireRole(["Approver", "Admin"]);

      existing[5] = status;
      await updateRow("Procurement", rowIndex + 1, existing);

      return NextResponse.json({ success: true });
    }

    // Complete action — Admin converts to inventory item
    if (action === "complete") {
      await requireRole(["Admin"]);

      existing[5] = "Completed";
      await updateRow("Procurement", rowIndex + 1, existing);

      // Auto-add to inventory
      const itemId = await generateItemId();
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const itemUrl = `${appUrl}/item/${itemId}`;
      const qrDataUrl = await QRCode.toDataURL(itemUrl, {
        width: 300,
        margin: 1,
      });
      const now = new Date().toISOString();

      await appendRow("Inventory", [
        itemId,
        existing[2], // item_name
        "Umum", // default category
        existing[3], // quantity
        "-",
        "Good",
        "",
        "",
        qrDataUrl,
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
