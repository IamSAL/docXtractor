import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { cookieStorage } from "./cookie-storage";
import * as authApi from "@/api/endpoints/auth/auth";
import type { UserResponseDto } from "@/api/models";
import { disconnectSocket } from "./socket";

// Callback to clear query cache on logout, set by root-provider to avoid circular deps
let _clearQueryCache: (() => void) | null = null;
export function setQueryCacheClearer(fn: () => void) {
  _clearQueryCache = fn;
}

/** Check if a JWT is expired (or will expire within bufferSeconds). Returns true if expired/invalid. */
function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false; // no expiry claim — treat as valid
    return payload.exp * 1000 < Date.now() + bufferSeconds * 1000;
  } catch {
    return true; // malformed token
  }
}

interface AuthState {
  // State
  user: UserResponseDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ email: string }>;
  adminSetup: (email: string, password: string, instanceName?: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  // Hydration state
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.authControllerLogin({
            email,
            password,
          });
          const successResponse = response as unknown as {
            data: {
              user: UserResponseDto;
              accessToken: string;
              refreshToken: string;
            };
          };
          const { user, accessToken, refreshToken } = successResponse.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      // Admin setup action (first-run)
      adminSetup: async (email: string, password: string, instanceName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.authControllerAdminSetup({
            email,
            password,
            instanceName,
          });
          const successResponse = response as unknown as {
            data: {
              user: UserResponseDto;
              accessToken: string;
              refreshToken: string;
            };
          };
          const { user, accessToken, refreshToken } = successResponse.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Admin setup failed",
            isLoading: false,
          });
          throw error;
        }
      },

      // Signup action
      signup: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.authControllerSignUp({
            email,
            password,
          });
          set({ isLoading: false, error: null });

          const successResponse = response as unknown as {
            data: { email: string };
          };
          return successResponse.data;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Signup failed",
            isLoading: false,
          });
          throw error;
        }
      },

      // Verify email action
      verifyEmail: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.authControllerVerifyEmail({
            email,
            otp,
          });
          const successResponse = response as unknown as {
            data: {
              user: UserResponseDto;
              accessToken: string;
              refreshToken: string;
            };
          };
          const { user, accessToken, refreshToken } = successResponse.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Email verification failed",
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        // Disconnect socket on logout
        disconnectSocket();
        // Clear query cache to prevent stale data from previous session
        _clearQueryCache?.();
      },

      // Refresh access token
      refreshAccessToken: async () => {
        // First check if another tab already refreshed the token
        // Use cookieStorage directly for the freshest possible data
        const storedValue = cookieStorage.getItem("auth-storage");

        // Handle potential Promise from getItem (though our implementation is sync)
        const resolvedValue =
          storedValue instanceof Promise ? await storedValue : storedValue;

        if (resolvedValue) {
          try {
            const parsed = JSON.parse(resolvedValue);
            if (
              parsed.state?.refreshToken &&
              parsed.state.refreshToken !== get().refreshToken
            ) {
              set({
                accessToken: parsed.state.accessToken,
                refreshToken: parsed.state.refreshToken,
                user: parsed.state.user || get().user,
                isAuthenticated:
                  parsed.state.isAuthenticated ?? get().isAuthenticated,
              });
              return;
            }
          } catch (e) {
            console.error("Failed to parse auth storage during refresh", e);
          }
        }

        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        try {
          const response = await authApi.authControllerRefreshToken({
            refreshToken,
          });
          const successResponse = response as unknown as {
            data: { accessToken: string; refreshToken: string };
          };
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            successResponse.data;

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        } catch (error) {
          // Double check if it's already refreshed by another tab even if we failed
          const latestValue = cookieStorage.getItem("auth-storage");
          const resolvedLatest =
            latestValue instanceof Promise ? await latestValue : latestValue;

          if (resolvedLatest) {
            try {
              const parsed = JSON.parse(resolvedLatest);
              if (
                parsed.state?.refreshToken &&
                parsed.state.refreshToken !== refreshToken
              ) {
                set({
                  accessToken: parsed.state.accessToken,
                  refreshToken: parsed.state.refreshToken,
                });
                return;
              }
            } catch (e) {}
          }

          get().logout();
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Hydration state
      isHydrated: false,
      setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validate rehydrated auth state
          if (state.isAuthenticated) {
            // Missing essential data — clear immediately
            if (!state.accessToken || !state.refreshToken || !state.user) {
              state.logout();
            }
            // Access token expired — try refresh, or clear if refresh token is also expired
            else if (isTokenExpired(state.accessToken)) {
              if (isTokenExpired(state.refreshToken)) {
                state.logout();
              } else {
                // Access token expired but refresh token still valid — trigger refresh
                state.refreshAccessToken().catch(() => {
                  state.logout();
                });
              }
            }
          }
          state.setHydrated(true);
        }
      },
    },
  ),
);
