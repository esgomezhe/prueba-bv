/** Cliente de autenticación (route handlers BFF, no Django directo). */
import axios from "axios";

import type { AuthUser, LoginCredentials } from "./types";

/** Login: el route handler guarda las cookies httpOnly y devuelve el usuario. */
export async function login(
  credentials: LoginCredentials,
): Promise<AuthUser> {
  try {
    const { data } = await axios.post<{ user: AuthUser }>(
      "/api/auth/login",
      credentials,
    );
    return data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const message =
        error.response.data?.error?.message ??
        "Usuario o contraseña incorrectos.";
      throw new Error(message);
    }
    throw new Error("No se pudo conectar con el servidor.");
  }
}

/** Logout: el route handler invalida el refresh y borra las cookies. */
export async function logout(): Promise<void> {
  await axios.post("/api/auth/logout");
}
