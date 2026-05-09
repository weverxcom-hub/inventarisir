/**
 * Centralized, validated access to required environment variables.
 *
 * We validate lazily on first access (instead of at import time) so that
 * Next.js can build pages that don't actually use Google APIs without
 * requiring all env vars to be set (helps preview deployments / typecheck).
 */

type RequiredEnv =
  | "GOOGLE_SERVICE_ACCOUNT_KEY"
  | "GOOGLE_SPREADSHEET_ID"
  | "GOOGLE_DRIVE_FOLDER_ID"
  | "NEXTAUTH_SECRET";

function read(name: RequiredEnv): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Environment variable ${name} is required but missing or empty. ` +
        `Set it in .env.local (see .env.example).`
    );
  }
  return value;
}

export function getServiceAccountKey(): string {
  return read("GOOGLE_SERVICE_ACCOUNT_KEY");
}

export function getSpreadsheetId(): string {
  return read("GOOGLE_SPREADSHEET_ID");
}

export function getDriveFolderId(): string {
  return read("GOOGLE_DRIVE_FOLDER_ID");
}

export function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

/**
 * Best-effort validation surfaced at startup (logged, not thrown) so that
 * developers see the missing vars without breaking unrelated tooling.
 */
export function logEnvHealth(): void {
  const missing: string[] = [];
  for (const name of [
    "GOOGLE_SERVICE_ACCOUNT_KEY",
    "GOOGLE_SPREADSHEET_ID",
    "GOOGLE_DRIVE_FOLDER_ID",
    "NEXTAUTH_SECRET",
  ] as const) {
    if (!process.env[name]) missing.push(name);
  }
  if (missing.length > 0) {
    console.warn(
      `[env] Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
