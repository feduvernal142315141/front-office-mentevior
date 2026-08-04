import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login-error", "/set-cookie"];

/**
 * Rutas de la aplicación autenticada que NO deben ser interceptadas.
 *
 * ⚠️ Al agregar una ruta de primer nivel en `app/(app)/`, hay que agregarla acá
 * también. Si falta, el proxy la confunde con un identificador de compañía y
 * redirige a `/<ruta>/login`.
 */
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
  "/clinical-options",
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
    pathname.match(/^\/[^/]+\/forgot-password$/) ||
    pathname.match(/^\/[^/]+\/reset-password$/)
  ) {
    return NextResponse.next();
  }

  // Allow authenticated app routes
  if (APP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("mv_fo_token");
  const segments = pathname.split('/').filter(Boolean);

  // Un segmento suelto se interpreta como identificador de compañía y se manda
  // al login… pero eso sólo tiene sentido para una visita SIN sesión.
  //
  // Con sesión activa nunca se redirige: si la ruta faltaba en APP_ROUTES, antes
  // terminabas en `/<ruta>/login` pidiendo la config de una compañía que no
  // existe. Este chequeo corta esa clase de error de raíz, sin depender de que
  // la lista esté completa.
  if (segments.length === 1 && !token) {
    const companyIdentifier = segments[0];

    const url = req.nextUrl.clone();
    url.pathname = `/${companyIdentifier}/login`;

    return NextResponse.redirect(url);
  }

  if (!token) {
    console.warn("No token in cookie → letting client-side auth handle it.");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
       '/((?!api|_next|.*\\..*).*)',
  ],
};
