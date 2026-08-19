/**
 * Central helper for building authenticated request headers.
 *
 * The access token is stored by AuthProvider under localStorage['accessToken'].
 * Several services historically read a non-existent 'token' key (always null),
 * which sent `Authorization: Bearer null`. Use this helper everywhere instead.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('accessToken')
}

/**
 * Returns request headers including the Bearer token when present.
 * @param extra additional headers to merge (e.g. Content-Type)
 */
export function getAuthHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const token = getAuthToken()
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** Convenience for JSON requests: Content-Type + Bearer token. */
export function getJsonAuthHeaders(): Record<string, string> {
  return getAuthHeaders({ 'Content-Type': 'application/json' })
}
