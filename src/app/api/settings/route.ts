import { NextRequest, NextResponse } from "next/server";
import { getSettings, setSetting } from "@/lib/google";
import { apiHandler, parseJson, requireRoles } from "@/lib/api";
import { settingsUpdateSchema } from "@/lib/validation";

// Public read so the BAST print page can render the custom letterhead
// without forcing a login. The values stored here are non-sensitive
// (URLs to public Drive images).
export const GET = apiHandler(async () => {
  const settings = await getSettings();
  return NextResponse.json({ settings });
});

export const PUT = apiHandler(async (req: NextRequest) => {
  await requireRoles(["Admin"]);
  const body = await parseJson(req, settingsUpdateSchema);

  if (typeof body.letterhead_url === "string") {
    await setSetting("letterhead_url", body.letterhead_url);
  }

  const settings = await getSettings();
  return NextResponse.json({ success: true, settings });
});
