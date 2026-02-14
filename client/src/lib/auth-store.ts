import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authApi from "@/api/endpoints/auth/auth";
import type { UserResponseDto } from "@/api/models";

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
      },

      // Refresh access token
      refreshAccessToken: async () => {
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
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
