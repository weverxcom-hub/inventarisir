import { google, sheets_v4, drive_v3 } from "googleapis";
import type { GoogleAuth } from "google-auth-library";
import { Readable } from "stream";
import {
  getServiceAccountKey,
  getSpreadsheetId,
  getDriveFolderId,
} from "./env";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

// ─── Auth singleton ──────────────────────────────────────────────
// Reusing the auth client across requests avoids re-parsing the
// service-account JSON and re-negotiating tokens on every call.

type AnyGoogleAuth = GoogleAuth<never>;

let cachedAuth: AnyGoogleAuth | null = null;
let cachedSheets: sheets_v4.Sheets | null = null;
let cachedDrive: drive_v3.Drive | null = null;
let cachedSheetIds: Map<string, number> | null = null;

function getAuth(): AnyGoogleAuth {
  if (cachedAuth) return cachedAuth;
  const credentials = JSON.parse(getServiceAccountKey());
  cachedAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  }) as AnyGoogleAuth;
  return cachedAuth;
}

export function getSheets(): sheets_v4.Sheets {
  if (cachedSheets) return cachedSheets;
  cachedSheets = google.sheets({ version: "v4", auth: getAuth() });
  return cachedSheets;
}

export function getDrive(): drive_v3.Drive {
  if (cachedDrive) return cachedDrive;
  cachedDrive = google.drive({ version: "v3", auth: getAuth() });
  return cachedDrive;
}

// ─── Sheet helpers ───────────────────────────────────────────────

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
  });
  return (res.data.values as string[][]) || [];
}

export async function appendRow(
  sheetName: string,
  values: string[]
): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function updateRow(
  sheetName: string,
  rowIndex: number,
  values: string[]
): Promise<void> {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function resolveSheetId(sheetName: string): Promise<number | null> {
  if (!cachedSheetIds) cachedSheetIds = new Map();
  if (cachedSheetIds.has(sheetName)) {
    return cachedSheetIds.get(sheetName) ?? null;
  }
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
  });
  for (const s of meta.data.sheets ?? []) {
    const title = s.properties?.title;
    const id = s.properties?.sheetId;
    if (title != null && id != null) cachedSheetIds.set(title, id);
  }
  return cachedSheetIds.get(sheetName) ?? null;
}

export async function deleteRow(
  sheetName: string,
  rowIndex: number
): Promise<void> {
  const sheets = getSheets();
  const sheetId = await resolveSheetId(sheetName);
  if (sheetId == null) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

/**
 * Returns the 1-based row index where `column` matches `value`, or -1 if not
 * found. Skips header row (row 1).
 */
export function findRowIndex(
  data: string[][],
  column: number,
  value: string
): number {
  for (let i = 1; i < data.length; i += 1) {
    if ((data[i]?.[column] ?? "") === value) return i + 1; // 1-based
  }
  return -1;
}

// ─── Drive helpers ───────────────────────────────────────────────

export async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = getDrive();

  const fileMetadata = {
    name: fileName,
    parents: [getDriveFolderId()],
  };

  const media = {
    mimeType,
    body: Readable.from(buffer),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, webViewLink",
  });

  // Make file publicly readable so it can be linked from the inventory UI.
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: res.data.id || "",
    webViewLink: res.data.webViewLink || "",
  };
}

// ─── ID generation ───────────────────────────────────────────────

function nextSequentialId(rows: string[][], yearPrefix: string): string {
  let maxNum = 0;
  for (const row of rows) {
    const id = row[0] || "";
    if (id.startsWith(yearPrefix)) {
      const numPart = parseInt(id.slice(yearPrefix.length), 10);
      if (!Number.isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    }
  }
  return `${yearPrefix}${String(maxNum + 1).padStart(3, "0")}`;
}

export async function generateItemId(): Promise<string> {
  const year = new Date().getFullYear();
  const data = await getSheetData("Inventory");
  return nextSequentialId(data.slice(1), `UGMALANG-INV-${year}-`);
}

export async function generateRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  const data = await getSheetData("Procurement");
  return nextSequentialId(data.slice(1), `REQ-${year}-`);
}
