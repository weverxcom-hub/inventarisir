import { google } from "googleapis";
import { Readable } from "stream";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

function getAuth() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"
  );
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
  return auth;
}

export function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

export function getDrive() {
  const auth = getAuth();
  return google.drive({ version: "v3", auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

// ─── Sheet Helpers ───────────────────────────────────────────────

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  return (res.data.values as string[][]) || [];
}

export async function appendRow(sheetName: string, values: string[]) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function updateRow(
  sheetName: string,
  rowIndex: number,
  values: string[]
) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function deleteRow(sheetName: string, rowIndex: number) {
  const sheets = getSheets();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );

  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
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

// ─── Drive Helpers ───────────────────────────────────────────────

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

export async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ fileId: string }> {
  const drive = getDrive();

  const fileMetadata = {
    name: fileName,
    parents: [DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType,
    body: Readable.from(buffer),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
  });

  // Deliberately not shared publicly — only the service account can read it.
  // Authenticated users view it through the app's own proxy route
  // (GET /api/drive-file/[id]), which enforces requireAuth() itself.
  return { fileId: res.data.id || "" };
}

export async function getDriveFile(
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const drive = getDrive();

  const meta = await drive.files.get({ fileId, fields: "mimeType" });
  const mimeType = meta.data.mimeType || "application/octet-stream";

  const media = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return { buffer: Buffer.from(media.data as ArrayBuffer), mimeType };
}

// ─── ID Generation ───────────────────────────────────────────────

// Sequential IDs are computed by scanning the sheet for the current max,
// which races if two requests overlap. Serializing per key on this process
// closes that window for a single-instance deployment (it does not help
// across multiple concurrently-running server instances).
const idLocks = new Map<string, Promise<unknown>>();

async function withIdLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = idLocks.get(key) ?? Promise.resolve();
  const current = previous.then(fn, fn);
  idLocks.set(
    key,
    current.catch(() => {})
  );
  return current;
}

function nextSequentialId(rows: string[][], yearPrefix: string): string {
  let maxNum = 0;
  for (const row of rows) {
    const id = row[0] || "";
    if (id.startsWith(yearPrefix)) {
      const numPart = parseInt(id.replace(yearPrefix, ""), 10);
      if (numPart > maxNum) maxNum = numPart;
    }
  }
  const nextNum = String(maxNum + 1).padStart(3, "0");
  return `${yearPrefix}${nextNum}`;
}

// Appends a new Inventory row with a freshly-computed sequential item_id.
// The read-max-then-write has to happen inside the lock, not just the ID
// computation — otherwise two overlapping calls can both compute the same
// "next" number before either one's row is visible to the other.
export async function createInventoryRow(
  restOfRow: string[]
): Promise<string> {
  return withIdLock("inventory", async () => {
    const year = new Date().getFullYear();
    const data = await getSheetData("Inventory");
    const itemId = nextSequentialId(
      data.slice(1),
      `UGMALANG-INV-${year}-`
    );
    await appendRow("Inventory", [itemId, ...restOfRow]);
    return itemId;
  });
}

export async function createProcurementRow(
  restOfRow: string[]
): Promise<string> {
  return withIdLock("procurement", async () => {
    const year = new Date().getFullYear();
    const data = await getSheetData("Procurement");
    const requestId = nextSequentialId(data.slice(1), `REQ-${year}-`);
    await appendRow("Procurement", [requestId, ...restOfRow]);
    return requestId;
  });
}
