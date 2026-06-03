/** Tipos de autenticación. */

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

/** Respuesta del backend en /api/auth/login/. */
export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}
