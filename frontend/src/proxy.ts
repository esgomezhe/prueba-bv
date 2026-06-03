/**
 * Guard de rutas en el edge (Next.js 16: convención `proxy`, antes `middleware`).
 *
 * Chequeo optimista: decide el acceso por la presencia del refresh token
 * httpOnly (vida larga). El access token puede estar expirado; el proxy de
 * API lo refresca de forma transparente, así que basta una sesión viva.
 */
import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_COOKIE } from "@/lib/config";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Protege todo salvo assets, el proxy de API y los route handlers de auth.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
