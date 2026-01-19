import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login-error"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

 
  if (PUBLIC_PATHS.includes(pathname) || pathname.match(/^\/[^/]+\/login$/)) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 1) {
    const companyIdentifier = segments[0];
    

    const url = req.nextUrl.clone();
    url.pathname = `/${companyIdentifier}/login`;
    
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get("mv_fo_token");

  if (!token) {
    console.warn("No token in cookie → letting client-side auth handle it.");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
       '/((?!api|_next|.*\\..*).*)',
  ],
};
