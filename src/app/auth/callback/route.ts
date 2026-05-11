import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/sso-client";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

/**
 * GET /auth/callback?code=xxx
 *
 * SSO callback for Inventarisir.
 * Exchanges the SSO code, then creates a NextAuth-compatible JWT session cookie.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  try {
    const tokenResponse = await exchangeCode(code);
    const ssoUser = tokenResponse.user;

    // Create a NextAuth-compatible JWT token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is not set");
    }

    const token = await encode({
      token: {
        name: ssoUser.name,
        email: ssoUser.email,
        role: ssoUser.role || "User",
        sub: ssoUser.email,
      },
      secret,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set the NextAuth session cookie
    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    cookies().set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  } catch (error) {
    console.error("SSO callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=sso_failed", req.nextUrl.origin)
    );
  }
}
