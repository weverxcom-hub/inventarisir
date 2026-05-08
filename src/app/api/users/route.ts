import { NextRequest, NextResponse } from "next/server";
import { getSheetData, appendRow, updateRow, deleteRow } from "@/lib/google";
import { requireRole } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireRole(["Admin"]);

    const data = await getSheetData("Users");
    const rows = data.slice(1);

    const users = rows.map((row) => ({
      name: row[0] || "",
      email: row[1] || "",
      role: row[3] || "Staff",
    }));

    return NextResponse.json({ users });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["Admin"]);

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const data = await getSheetData("Users");
    const existing = data.slice(1).find((row) => row[1] === email);
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await appendRow("Users", [name, email, hashedPassword, role]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(["Admin"]);

    const body = await req.json();
    const { email, name, role, password } = body;

    const data = await getSheetData("Users");
    const rowIndex = data.findIndex((row) => row[1] === email);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = data[rowIndex];
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : existing[2];

    await updateRow("Users", rowIndex + 1, [
      name ?? existing[0],
      email,
      hashedPassword,
      role ?? existing[3],
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(["Admin"]);

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const data = await getSheetData("Users");
    const rowIndex = data.findIndex((row) => row[1] === email);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await deleteRow("Users", rowIndex + 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
