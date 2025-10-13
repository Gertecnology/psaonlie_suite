import { useAuth } from '@/context/auth-context'

/**
 * Global error handler for authentication errors
 * This function handles 401 errors by clearing the session and redirecting to sign-in
 */
export class AuthErrorHandler {
  private static authContext: ReturnType<typeof useAuth> | null = null

  /**
   * Set the auth context instance to use for logout
   */
  static setAuthContext(authContext: ReturnType<typeof useAuth>) {
    this.authContext = authContext
  }

  /**
   * Handle authentication errors
   * @param error - The error that occurred
   * @param redirectToSignIn - Whether to redirect to sign-in page (default: true)
   */
  static handleAuthError(error: Error, redirectToSignIn: boolean = true) {
    // Check if it's an authentication error
    if (error.message.includes('Sesión expirada') || error.message.includes('Session expired')) {
      // Clear the session
      if (this.authContext) {
        this.authContext.logout()
      } else {
        // Fallback: clear localStorage manually
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        localStorage.removeItem('refreshToken')
        sessionStorage.removeItem('socket-initialized')
        sessionStorage.removeItem('socket-state')
      }

      // Redirect to sign-in if requested
      if (redirectToSignIn) {
        // Use window.location for immediate redirect
        const currentUrl = window.location.href
        window.location.href = `/sign-in?redirect=${encodeURIComponent(currentUrl)}`
      }
    }
  }

  /**
   * Check if an error is an authentication error
   */
  static isAuthError(error: Error): boolean {
    return error.message.includes('Sesión expirada') || 
           error.message.includes('Session expired') ||
           error.message.includes('Unauthorized')
  }
}
