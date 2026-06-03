/**
 * Utilidades de autenticación server-side (patrón BFF).
 *
 * Los tokens viven en cookies httpOnly. Solo el servidor (route handlers /
 * proxy / middleware) las lee o escribe; el cliente nunca accede al JWT.
 */
import "server-only";

import type { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  COOKIE_SECURE,
  DJANGO_API_URL,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "@/lib/config";

type CookieJar = NextResponse["cookies"];

/** Opciones base de las cookies de sesión. */
function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: COOKIE_SECURE,
    path: "/",
  };
}

/** Escribe ambas cookies de sesión en la respuesta. */
export function setAuthCookies(
  cookies: CookieJar,
  access: string,
  refresh: string,
): void {
  cookies.set(ACCESS_COOKIE, access, {
    ...baseCookieOptions(),
    maxAge: ACCESS_MAX_AGE,
  });
  cookies.set(REFRESH_COOKIE, refresh, {
    ...baseCookieOptions(),
    maxAge: REFRESH_MAX_AGE,
  });
}

/** Actualiza solo el access token (tras un refresh). */
export function setAccessCookie(cookies: CookieJar, access: string): void {
  cookies.set(ACCESS_COOKIE, access, {
    ...baseCookieOptions(),
    maxAge: ACCESS_MAX_AGE,
  });
}

/** Borra las cookies de sesión (logout). */
export function clearAuthCookies(cookies: CookieJar): void {
  cookies.set(ACCESS_COOKIE, "", { ...baseCookieOptions(), maxAge: 0 });
  cookies.set(REFRESH_COOKIE, "", { ...baseCookieOptions(), maxAge: 0 });
}

/**
 * Intenta renovar el access token usando el refresh token.
 * Devuelve el nuevo access token o `null` si el refresh ya no es válido.
 */
export async function refreshAccessToken(
  refresh: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${DJANGO_API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access?: string };
    return data.access ?? null;
  } catch {
    return null;
  }
}
