import { useAuthStore } from '@/lib/auth-store'
import { AXIOS_INSTANCE } from '@/lib/axios'
import { useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'

/**
 * Hook to access auth state and actions
 */
export function useAuth() {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    verifyEmail,
    logout,
    refreshAccessToken,
    clearError,
  } = useAuthStore()

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    verifyEmail,
    logout,
    refreshAccessToken,
    clearError,
  }
}

/**
 * Hook to protect routes - redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  return { isAuthenticated, isLoading }
}

/**
 * Hook to redirect authenticated users away from auth pages
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: redirectTo })
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

  return { isAuthenticated, isLoading }
}

/**
 * Hook to automatically refresh tokens before they expire
 */
export function useTokenRefresh() {
  const { accessToken, refreshAccessToken, logout } = useAuthStore()

  useEffect(() => {
    if (!accessToken) return

    // Refresh token every 14 minutes (access token expires in 15 minutes)
    const interval = setInterval(
      async () => {
        try {
          await refreshAccessToken()
        } catch (error) {
          console.error('Failed to refresh token:', error)
          logout()
        }
      },
      14 * 60 * 1000
    ) // 14 minutes

    return () => clearInterval(interval)
  }, [accessToken, refreshAccessToken, logout])
}

/**
 * Hook to make authenticated API requests with automatic token refresh
 */
export function useAuthenticatedFetch() {
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      // Create axios config from fetch options
      const config = {
        url,
        method: options.method || 'GET',
        headers: options.headers as any,
        data: options.body,
      }

      // We return the full response to mimic fetch's behavior somewhat,
      // but Axios response structure is different.
      // However, since this hook was returning `await fetch(...)` which returns a Response object,
      // switching to axios means we return `AxiosResponse`.
      // Callers calling `.json()` on it will fail if we return AxiosResponse directly.
      // BUT, checking the usage, it seems unused.
      // To be safe and aligned with "use axios", we simply return the axios promise.
      // If callers expect `response.json()`, they will need to change to `response.data`.
      return AXIOS_INSTANCE(config)
    },
    []
  )

  return authenticatedFetch
}

/**
 * Hook to logout with navigation
 */
export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return useCallback(() => {
    logout()
    navigate({ to: '/login' })
  }, [logout, navigate])
}
