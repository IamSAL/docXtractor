import { useAuthStore } from '@/lib/auth-store'
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
