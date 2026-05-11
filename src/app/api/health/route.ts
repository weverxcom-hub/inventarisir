import { NextRequest, NextResponse } from "next/server";
import { getDrive } from "@/lib/google";

/**
 * Health-check endpoint that surfaces *which* required environment variables
 * are missing without leaking their values. Useful when diagnosing the
 * NextAuth "Server error" page on a fresh deployment.
 *
 * Pass `?drive=1` to also ping the configured Drive folder using the service
 * account credentials. Surfaces the service-account email & exact Drive error
 * so the admin knows which address to re-share the folder with.
 */
export const GET = async (req: NextRequest) => {
  const required = [
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "GOOGLE_SERVICE_ACCOUNT_KEY",
    "GOOGLE_SPREADSHEET_ID",
    "GOOGLE_DRIVE_FOLDER_ID",
  ] as const;

  const missing = required.filter((name) => {
    const value = process.env[name];
    return !value || value.trim() === "";
  });

  let serviceAccountValid = true;
  let serviceAccountEmail: string | null = null;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      serviceAccountValid =
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.client_email === "string" &&
        typeof parsed.private_key === "string";
      if (
        serviceAccountValid &&
        typeof parsed.client_email === "string"
      ) {
        serviceAccountEmail = parsed.client_email;
      }
    } catch {
      serviceAccountValid = false;
    }
  }

  const envOk = missing.length === 0 && serviceAccountValid;

  let driveCheck:
    | {
        folder_id: string | null;
        accessible: boolean;
        folder_name?: string;
        error?: string;
      }
    | undefined;

  const wantDrive = req.nextUrl.searchParams.get("drive") === "1";
  if (wantDrive && envOk) {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    if (folderId) {
      try {
        const drive = getDrive();
        const meta = await drive.files.get({
          fileId: folderId,
          fields: "id, name, mimeType",
          supportsAllDrives: true,
        });
        driveCheck = {
          folder_id: folderId,
          accessible: true,
          folder_name: meta.data.name || undefined,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown Drive error";
        driveCheck = {
          folder_id: folderId,
          accessible: false,
          error: message,
        };
      }
    } else {
      driveCheck = { folder_id: null, accessible: false };
    }
  }

  const ok =
    envOk && (driveCheck ? driveCheck.accessible : true);

  return NextResponse.json(
    {
      ok,
      missing,
      service_account_key_valid: serviceAccountValid,
      service_account_email: serviceAccountEmail,
      drive: driveCheck,
      hint: ok
        ? "Semua env vars terisi."
        : driveCheck && !driveCheck.accessible
          ? `Share folder Drive ID ${driveCheck.folder_id} ke ${serviceAccountEmail} (role Editor / Content manager).`
          : "Set env vars yang hilang di Vercel/Hosting (Settings → Environment Variables) lalu redeploy.",
    },
    { status: ok ? 200 : 503 }
  );
};
