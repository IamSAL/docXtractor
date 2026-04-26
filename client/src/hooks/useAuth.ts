import { useAuthStore } from "@/lib/auth-store";
import { useEffect, useCallback } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";

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
  } = useAuthStore();

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
  };
}

/**
 * Hook to protect routes - redirects to login if not authenticated
 */
function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to redirect authenticated users away from auth pages
 * Only redirects on initial mount, not on page reload
 */
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if:
    // 1. User is authenticated
    // 2. Not loading
    // 3. Current path is an auth page (login/signup)
    // 4. This is NOT a page reload (check if we're coming from another route)
    if (!isLoading && isAuthenticated) {
      const currentPath = router.state.location.pathname;
      const isAuthPage =
        currentPath === "/login" ||
        currentPath === "/signup" ||
        currentPath === "/verify-email";

      // Only redirect if we're on an auth page
      if (isAuthPage) {
        navigate({ to: redirectTo, replace: true });
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    navigate,
    redirectTo,
    router.state.location.pathname,
  ]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to automatically refresh tokens before they expire
 */
export function useTokenRefresh() {
  const { accessToken, refreshAccessToken, logout } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    // Refresh token every 14 minutes (access token expires in 15 minutes)
    const interval = setInterval(
      async () => {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error("Failed to refresh token in background:", error);
          // Don't logout here, let the axios interceptor handle it if a real request fails
          // This prevents background tabs from logging out the user due to race conditions
        }
      },
      14 * 60 * 1000,
    ); // 14 minutes

    return () => clearInterval(interval);
  }, [accessToken, refreshAccessToken, logout]);
}

/**
 * Hook to logout with navigation
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return useCallback(() => {
    logout();
    navigate({ to: "/login" });
  }, [logout, navigate]);
}
