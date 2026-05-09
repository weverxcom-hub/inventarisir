import { NextResponse } from "next/server";

/**
 * Health-check endpoint that surfaces *which* required environment variables
 * are missing without leaking their values. Useful when diagnosing the
 * NextAuth "Server error" page on a fresh deployment.
 */
export const GET = async () => {
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
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      serviceAccountValid =
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.client_email === "string" &&
        typeof parsed.private_key === "string";
    } catch {
      serviceAccountValid = false;
    }
  }

  const ok = missing.length === 0 && serviceAccountValid;

  return NextResponse.json(
    {
      ok,
      missing,
      service_account_key_valid: serviceAccountValid,
      hint: ok
        ? "Semua env vars terisi."
        : "Set env vars yang hilang di Vercel/Hosting (Settings → Environment Variables) lalu redeploy.",
    },
    { status: ok ? 200 : 503 }
  );
};
