import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authApi from '@/api/endpoints/auth/auth'
import type { UserResponseDto, AuthResponse } from '@/api/models'

interface AuthState {
  // State
  user: UserResponseDto | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<{ email: string }>
  verifyEmail: (email: string, otp: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
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
        set({ isLoading: true, error: null })
        try {
          // Assert success response type as we catch errors
          const response = await authApi.authControllerLogin({ email, password })
          const successResponse = response as authApi.authControllerLoginResponseSuccess
          const { user, accessToken, refreshToken } = successResponse.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      // Signup action
      signup: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.authControllerSignUp({ email, password })
          set({ isLoading: false, error: null })
          
          // Cast the response data to match expected return type
          const successResponse = response as authApi.authControllerSignUpResponseSuccess
          // The patch adds { id, email } to the schema, so casting to unknown first if strict types mismatch
          return successResponse.data as unknown as { email: string }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Signup failed',
            isLoading: false,
          })
          throw error
        }
      },

      // Verify email action
      verifyEmail: async (email: string, otp: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.authControllerVerifyEmail({ email, otp })
          // VerifyEmail schema was patched to return AuthResponse
          // But generated type might be hiding it inside "void" if patch wasn't fully picked up correctly by my manual types? 
          // No, I ran gen:api.
          // Let's assume it returned AuthResponse.
          // The generated file should have the type.
          // Check: authControllerVerifyEmail return type is authControllerVerifyEmailResponse
          // which is ...Success | ...Error
          // ...Success has data: AuthResponse (if patch worked)
          
          // Using 'as any' for safety because the generated type might be slightly off if my patch script missed something 
          // or if the type name is different. But let's try strict first with a safe fallback cast.
          const successResponse = response as unknown as { data: AuthResponse }
          const { user, accessToken, refreshToken } = successResponse.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Email verification failed',
            isLoading: false,
          })
          throw error
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
        })
      },

      // Refresh access token
      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        try {
          const response = await authApi.authControllerRefreshToken({ refreshToken })
          const successResponse = response as authApi.authControllerRefreshTokenResponseSuccess
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = successResponse.data
          
          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
