/**
 * Cliente HTTP del navegador.
 *
 * Apunta al proxy BFF (`/api/django`), mismo origen, así que las cookies
 * httpOnly viajan solas. No maneja tokens: de eso se encarga el servidor.
 * Solo normaliza errores y, si la sesión expiró del todo (401), manda a login.
 */
import axios, { AxiosError } from "axios";

import { API_PROXY_PREFIX } from "@/lib/config";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export const http = axios.create({
  baseURL: API_PROXY_PREFIX,
  withCredentials: true,
  timeout: 15_000,
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: ApiError }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Sesión irrecuperable: el proxy ya intentó refrescar y falló.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    const apiError: ApiError = error.response?.data?.error ?? {
      code: "network_error",
      message: "No se pudo conectar con el servidor.",
    };
    return Promise.reject(apiError);
  },
);
