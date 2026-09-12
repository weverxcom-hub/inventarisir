import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/approvals") && token?.role !== "Approver" && token?.role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/users") && token?.role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Skip the auth check entirely for the SSO callback route, since it
      // sets its own session cookie before a NextAuth token exists yet.
      authorized: ({ req, token }) =>
        req.nextUrl.pathname.startsWith("/auth/") || !!token,
    },
  }
);

export default authMiddleware;

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
