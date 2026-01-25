/**
 * Auth API Service
 * Handles all authentication-related API calls
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: string
    isEmailVerified: boolean
    hasProfile: boolean
    fullName: string
  }
}

export interface VerifyEmailRequest {
  email: string
  otp: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Login failed')
  }

  return response.json()
}

/**
 * Sign up new user
 */
export async function signup(data: SignupRequest): Promise<{ id: string; email: string }> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Signup failed')
  }

  return response.json()
}

/**
 * Verify email with OTP
 */
export async function verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/email/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Email verification failed')
  }

  return response.json()
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/email/verify/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to resend verification email')
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Token refresh failed')
  }

  return response.json()
}

/**
 * Verify tokens are valid
 */
export async function verifyTokens(accessToken: string, refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/verify-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken, refreshToken }),
    })

    return response.ok
  } catch {
    return false
  }
}

/**
 * Get current user profile (protected endpoint example)
 */
export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${API_URL}/user/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user profile')
  }

  return response.json()
}
