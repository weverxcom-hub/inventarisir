/**
 * Convert a Google Drive `webViewLink` (e.g. https://drive.google.com/file/d/{id}/view?usp=drivesdk)
 * or any URL containing an `id=` query param into an inline-renderable
 * thumbnail URL. For non-Drive URLs, returns the input unchanged so the
 * caller can pass any user-supplied URL through this helper safely.
 *
 * The thumbnail endpoint works for files whose link sharing is set to
 * "Anyone with the link". `uploadFileToDrive()` already configures that
 * permission for every file it writes.
 */
export function toPreviewUrl(url: string, sz: number = 800): string {
  if (!url) return "";

  // /file/d/{id}/...
  const pathMatch = url.match(/\/file\/d\/([^/?#]+)/);
  if (pathMatch) {
    return `https://drive.google.com/thumbnail?id=${pathMatch[1]}&sz=w${sz}`;
  }

  // open?id={id} or any URL with id={id} query param
  const queryMatch = url.match(/[?&]id=([^&#]+)/);
  if (queryMatch && url.includes("drive.google.com")) {
    return `https://drive.google.com/thumbnail?id=${queryMatch[1]}&sz=w${sz}`;
  }

  return url;
}
