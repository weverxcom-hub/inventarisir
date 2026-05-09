import { toast } from "sonner";

type FetchOptions = RequestInit & {
  /** When true (default) shows a toast on error. */
  notifyOnError?: boolean;
  /** Optional success message to toast on 2xx. */
  successMessage?: string;
};

/**
 * Wrapper around fetch that:
 *   - Always parses JSON.
 *   - Surfaces server-side error messages via toast (no more silent catches).
 *   - Throws on non-2xx so callers can stop on failure.
 */
export async function apiFetch<T = unknown>(
  url: string,
  { notifyOnError = true, successMessage, ...init }: FetchOptions = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Tidak bisa menghubungi server";
    if (notifyOnError) toast.error(message);
    throw err;
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) || `Request gagal (${res.status})`;
    if (notifyOnError) toast.error(message);
    throw new Error(message);
  }

  if (successMessage) toast.success(successMessage);
  return payload as T;
}
