/**
 * Proxy BFF hacia Django.
 *
 * El cliente llama a `/api/django/<lo-que-sea>` (mismo origen). Este handler:
 *  1. Lee el access token de la cookie httpOnly.
 *  2. Reenvía la petición a Django con `Authorization: Bearer`.
 *  3. Si Django responde 401, intenta refrescar el token y reintenta UNA vez.
 *  4. Si el refresh tiene éxito, persiste el nuevo access token en la cookie.
 *
 * Así el JWT nunca llega al navegador y el refresh es transparente.
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE, DJANGO_API_URL, REFRESH_COOKIE } from "@/lib/config";
import { refreshAccessToken, setAccessCookie } from "@/lib/server/auth";

const HOP_BY_HOP = new Set(["host", "connection", "content-length"]);

async function forward(
  request: NextRequest,
  path: string,
  accessToken: string | undefined,
): Promise<Response> {
  const search = request.nextUrl.search;
  const url = `${DJANGO_API_URL}/${path}/${search}`.replace(/\/\/+$/, "/");

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  return fetch(url, {
    method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });
}

async function handle(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const joined = path.join("/");
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;

  let djangoRes = await forward(request, joined, access);

  // Refresh transparente ante 401.
  if (djangoRes.status === 401) {
    const refresh = jar.get(REFRESH_COOKIE)?.value;
    const newAccess = refresh ? await refreshAccessToken(refresh) : null;

    if (newAccess) {
      djangoRes = await forward(request, joined, newAccess);
      const body = await djangoRes.text();
      const response = new NextResponse(body, {
        status: djangoRes.status,
        headers: { "Content-Type": "application/json" },
      });
      setAccessCookie(response.cookies, newAccess);
      return response;
    }
  }

  const body = await djangoRes.text();
  return new NextResponse(body, {
    status: djangoRes.status,
    headers: {
      "Content-Type":
        djangoRes.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
