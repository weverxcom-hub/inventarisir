import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import type { Session } from "next-auth";
import { getSession } from "./session";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const unauthorized = () =>
  new ApiError(401, "Unauthorized — please sign in");
export const forbidden = () =>
  new ApiError(403, "Forbidden — insufficient role");
export const badRequest = (msg = "Bad request") => new ApiError(400, msg);
export const notFound = (msg = "Resource not found") =>
  new ApiError(404, msg);
export const conflict = (msg = "Conflict") => new ApiError(409, msg);

/**
 * Wraps a route handler and turns thrown ApiError / ZodError / generic Error
 * into structured JSON responses. Reduces try/catch boilerplate in every
 * route file.
 */
export function apiHandler<TArgs extends unknown[]>(
  handler: (req: NextRequest, ...args: TArgs) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: TArgs): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status }
        );
      }
      if (err instanceof ZodError) {
        const message =
          err.issues[0]?.message ?? "Invalid request payload";
        return NextResponse.json(
          { error: message, issues: err.issues },
          { status: 400 }
        );
      }
      const message =
        err instanceof Error ? err.message : "Internal server error";
      console.error("[api] unhandled error:", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

/** Resolve current session or throw 401. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session?.user) throw unauthorized();
  return session;
}

/** Resolve current session and assert role membership or throw 403. */
export async function requireRoles(roles: string[]): Promise<Session> {
  const session = await requireSession();
  const role = session.user.role;
  if (!role || !roles.includes(role)) throw forbidden();
  return session;
}

/** Parse and validate JSON body with a Zod schema. */
export async function parseJson<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Body must be valid JSON");
  }
  return schema.parse(body);
}
