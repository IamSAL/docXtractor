import { useAuthStore } from "@/lib/auth-store";
import { useCallback } from "react";
import { useEffect } from "react";
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
 * Hook to redirect authenticated users away from auth pages.
 * Waits for Zustand hydration before acting to prevent stale-cookie redirects.
 */
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || isLoading || !isAuthenticated) return;

    const currentPath = router.state.location.pathname;
    const isAuthPage =
      currentPath === "/login" ||
      currentPath === "/signup" ||
      currentPath === "/verify-email";

    if (isAuthPage) {
      navigate({ to: redirectTo, replace: true });
    }
  }, [
    isAuthenticated,
    isLoading,
    isHydrated,
    navigate,
    redirectTo,
    router.state.location.pathname,
  ]);

  return { isAuthenticated, isLoading };
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
