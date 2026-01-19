import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login-error", "/set-cookie"];

// Rutas de la aplicación autenticada que NO deben ser interceptadas
const APP_ROUTES = [
  "/dashboard",
  "/users",
  "/clients",
  "/schedules",
  "/events",
  "/my-company",
  "/my-profile",
  "/agreements",
  "/applicants",
  "/assessment",
  "/behavior-plan",
  "/billing",
  "/change-password",
  "/clinical-documents",
  "/clinical-monthly",
  "/data-collection",
  "/hr-documents",
  "/monthly-supervisions",
  "/service-log",
  "/session-note",
  "/signatures-caregiver",
  "/template-documents",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, dynamic login routes, and dynamic forgot-password routes
  if (
    PUBLIC_PATHS.includes(pathname) || 
    pathname.match(/^\/[^/]+\/login$/) ||
    pathname.match(/^\/[^/]+\/forgot-password$/)
  ) {
    return NextResponse.next();
  }

  // Allow authenticated app routes
  if (APP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  
  // Only redirect if it's a single segment (companyIdentifier) and not an app route
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
