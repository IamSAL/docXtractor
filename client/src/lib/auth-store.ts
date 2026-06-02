import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { cookieStorage } from "./cookie-storage";
import * as authApi from "@/api/endpoints/auth/auth";
import type { UserResponseDto } from "@/api/models";
import { disconnectSocket, setTokenRefresher } from "./socket";

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
  adminSetup: (
    email: string,
    password: string,
    instanceName?: string,
  ) => Promise<void>;
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
            error:
              (error as any)?.response?.data?.message ||
              (error instanceof Error ? error.message : "Login failed"),
            isLoading: false,
          });
          throw error;
        }
      },

      // Admin setup action (first-run)
      adminSetup: async (
        email: string,
        password: string,
        instanceName?: string,
      ) => {
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
            error:
              error instanceof Error ? error.message : "Admin setup failed",
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
        disconnectSocket();
        _clearQueryCache?.();
      },

      // Refresh access token — throws on failure; interceptor handles logout
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error("No refresh token");

        const response = await authApi.authControllerRefreshToken({
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = (
          response as unknown as {
            data: { accessToken: string; refreshToken: string };
          }
        ).data;

        set({ accessToken, refreshToken: newRefreshToken });
      },

      // Clear error
      clearError: () => set({ error: null }),

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
          if (state.isAuthenticated) {
            // Clear if essential data missing or refresh token expired
            if (
              !state.accessToken ||
              !state.refreshToken ||
              !state.user ||
              isTokenExpired(state.refreshToken)
            ) {
              state.logout();
            }
            // If access token expired but refresh token valid, leave state as-is.
            // The axios interceptor will refresh lazily on the first 401.
          }
          state.setHydrated(true);
        }
      },
    },
  ),
);

// Wire the socket token-refresher. auth-store already imports from socket.ts (disconnectSocket),
// so socket.ts cannot import back — we inject the callback here instead.
setTokenRefresher(() => useAuthStore.getState().refreshAccessToken());
