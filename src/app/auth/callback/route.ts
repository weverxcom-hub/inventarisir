import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/sso-client";
import { getSheetData } from "@/lib/google";
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

    // The SSO server only vouches for identity, not for this app's roles.
    // Authorization stays governed by our own Users sheet: an SSO login is
    // only accepted for an email that an Admin has already provisioned here,
    // using the role recorded there — never the role claim from the SSO
    // token, which we don't control.
    const users = await getSheetData("Users");
    const userRow = users
      .slice(1)
      .find((row) => row[1] === ssoUser.email);

    if (!userRow) {
      return NextResponse.redirect(
        new URL("/login?error=sso_unregistered", req.nextUrl.origin)
      );
    }

    const [name, email, , role] = userRow;

    // Create a NextAuth-compatible JWT token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("NEXTAUTH_SECRET is not set");
    }

    const token = await encode({
      token: {
        name: name || ssoUser.name,
        email,
        role,
        sub: email,
      },
      secret,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set the NextAuth session cookie. NextAuth itself decides the
    // "__Secure-" prefix based on whether the app is served over HTTPS.
    // Trust the actual request scheme first (correct even if NEXTAUTH_URL
    // is misconfigured behind a proxy), falling back to NEXTAUTH_URL.
    const isSecure =
      req.nextUrl.protocol === "https:" ||
      !!process.env.NEXTAUTH_URL?.startsWith("https://");
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
