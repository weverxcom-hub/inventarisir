import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
      authorized: ({ token }) => !!token,
    },
  }
);

export default function middleware(req: NextRequest) {
  // Allow SSO callback route through without auth check
  if (req.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }
  return (authMiddleware as unknown as (req: NextRequest) => Promise<NextResponse>)(req);
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
