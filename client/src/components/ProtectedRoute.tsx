import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { useTokenRefresh } from '@/hooks/useAuth'

interface ProtectedRouteProps {
    children: React.ReactNode
}

/**
 * Protected Route Component
 * Wraps routes that require authentication
 * Automatically redirects to login if user is not authenticated
 * Also handles automatic token refresh
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuthStore()
    const navigate = useNavigate()

    // Enable automatic token refresh
    useTokenRefresh()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate({ to: '/login' })
        }
    }, [isAuthenticated, isLoading, navigate])

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-primary mx-auto"></div>
                    <p className="mt-4 text-black font-bold">Loading...</p>
                </div>
            </div>
        )
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}
