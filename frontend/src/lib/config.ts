/**
 * Configuración central del frontend.
 *
 * Distinción clave de seguridad (patrón BFF):
 * - `DJANGO_API_URL` es SERVER-ONLY (sin prefijo NEXT_PUBLIC). El navegador
 *   nunca la ve; solo el proxy y los route handlers de Next la usan para
 *   hablar con Django.
 * - El cliente siempre llama a `/api/django/...` (mismo origen), por lo que
 *   las cookies httpOnly viajan solas y el token JWT jamás toca el JS del
 *   navegador.
 */

/** Base de la API de Django, usada SOLO en el servidor (proxy / route handlers). */
export const DJANGO_API_URL =
  process.env.DJANGO_API_URL ?? "http://localhost:8000/api";

/** Prefijo del proxy interno que consume el cliente (mismo origen). */
export const API_PROXY_PREFIX = "/api/django";

/** Nombres de las cookies httpOnly que guardan los tokens. */
export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

/**
 * Marca `Secure` en las cookies. Configurable por entorno (no atado a
 * NODE_ENV): en local/Docker sobre HTTP debe ser false, o el navegador no
 * enviaría las cookies. En despliegue HTTPS real, COOKIE_SECURE=true.
 */
export const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

/** Vida de las cookies (segundos). Alineadas con SimpleJWT del backend. */
export const ACCESS_MAX_AGE = 60 * 15; // 15 min
export const REFRESH_MAX_AGE = 60 * 60 * 24; // 1 día
