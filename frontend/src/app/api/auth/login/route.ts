/**
 * Route handler de login (BFF).
 *
 * Recibe credenciales del cliente, las valida contra Django, y si son
 * correctas guarda los tokens en cookies httpOnly. Al cliente solo le
 * devuelve los datos del usuario — nunca el JWT.
 */
import { NextResponse } from "next/server";

import type { LoginResponse } from "@/features/auth/types";
import { COOKIE_SECURE, DJANGO_API_URL } from "@/lib/config";
import { setAuthCookies } from "@/lib/server/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Cuerpo de la petición inválido." } },
      { status: 400 },
    );
  }

  const res = await fetch(`${DJANGO_API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    // Propaga el error de Django (ej. credenciales inválidas) tal cual.
    return NextResponse.json(data, { status: res.status });
  }

  const { access, refresh, user } = data as LoginResponse;
  const response = NextResponse.json({ user });
  setAuthCookies(response.cookies, access, refresh);
  // Username NO es sensible: cookie legible por el cliente solo para mostrarlo.
  response.cookies.set("username", user.username, {
    httpOnly: false,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
