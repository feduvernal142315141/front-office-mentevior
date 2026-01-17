import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login-error"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and dynamic login routes
  if (PUBLIC_PATHS.includes(pathname) || pathname.match(/^\/[^/]+\/login$/)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("mv_fo_token");

  if (!token) {
    console.warn("No token in cookie → letting client-side auth handle it.");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/users/:path*", "/organizations/:path*"],
};
