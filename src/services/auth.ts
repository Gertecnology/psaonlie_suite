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

export async function forgotPassword(email: string) {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Error al enviar el correo de recuperación');
  }

  return response.json();
}

export async function verifyEmail(token: string) {
  const response = await fetch(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'manual', // Handle redirect manually to check status
  });

  // 302 means redirect (success or failure handled by backend redirect)
  if (response.status === 302) {
    // Get the redirect location from the response
    const location = response.headers.get('Location');
    return {
      success: true,
      redirect: location,
      status: response.status,
    };
  }

  // 400 means token invalid or expired
  if (response.status === 400) {
    let errorMessage = 'Token no proporcionado o inválido';
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If can't parse JSON, use default message
    }
    throw new Error(errorMessage);
  }

  // Other error statuses
  if (!response.ok) {
    throw new Error('Error al verificar el correo electrónico');
  }

  return response.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  // 200 means success
  if (response.status === 200) {
    return {
      success: true,
      message: 'Contraseña actualizada exitosamente.',
    };
  }

  // 400 means token invalid, expired, or password doesn't meet requirements
  if (response.status === 400) {
    let errorMessage = 'Token inválido, expirado, o contraseña no cumple los requisitos';
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If can't parse JSON, use default message
    }
    throw new Error(errorMessage);
  }

  // Other error statuses
  if (!response.ok) {
    throw new Error('Error al restablecer la contraseña');
  }

  return response.json();
}