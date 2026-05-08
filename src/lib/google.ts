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
): Promise<{ fileId: string; webViewLink: string }> {
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
    fields: "id, webViewLink",
  });

  // Make file publicly viewable
  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId: res.data.id || "",
    webViewLink: res.data.webViewLink || "",
  };
}

// ─── ID Generation ───────────────────────────────────────────────

export async function generateItemId(): Promise<string> {
  const year = new Date().getFullYear();
  const data = await getSheetData("Inventory");
  const rows = data.slice(1); // skip header

  const yearPrefix = `UGMALANG-INV-${year}-`;
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

export async function generateRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  const data = await getSheetData("Procurement");
  const rows = data.slice(1);

  const yearPrefix = `REQ-${year}-`;
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
