/**
 * Route handler de logout (BFF).
 *
 * Invalida el refresh token en Django (blacklist) y borra las cookies de
 * sesión. Es idempotente: aunque el blacklist falle, las cookies se limpian.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE, DJANGO_API_URL, REFRESH_COOKIE } from "@/lib/config";
import { clearAuthCookies } from "@/lib/server/auth";

export async function POST() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const access = jar.get(ACCESS_COOKIE)?.value;

  if (refresh && access) {
    try {
      await fetch(`${DJANGO_API_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
    } catch {
      // Se ignora: el objetivo principal es limpiar la sesión local.
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response.cookies);
  response.cookies.set("username", "", { path: "/", maxAge: 0 });
  return response;
}
