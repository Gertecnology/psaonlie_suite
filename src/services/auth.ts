const API_URL = import.meta.env.VITE_API_URL;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    urlPerfil?: string;
    roles: string[];
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Credenciales inválidas');
    }
    throw new Error('Error al iniciar sesión');
  }

  return response.json();
} 

export async function logout(refreshToken: string) {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Error al cerrar sesión');
  }

  return response.json();
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    urlPerfil?: string;
    roles: string[];
  };
}

export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Refresh token inválido o expirado');
    }
    throw new Error('Error al renovar el token');
  }

  return response.json();
}