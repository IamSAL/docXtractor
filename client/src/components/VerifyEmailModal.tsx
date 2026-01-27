import { useState } from 'react'
import { Button } from './retroui/Button'
import { Input } from './retroui/Input'
import { Card } from './retroui/Card'
import { useAuth } from '@/hooks/useAuth'
import { authControllerInitiateEmailVerification } from '@/api/endpoints/auth/auth'

interface VerifyEmailModalProps {
    email: string
    onSuccess: () => void
    onCancel: () => void
}

export function VerifyEmailModal({ email, onSuccess, onCancel }: VerifyEmailModalProps) {
    const [otp, setOtp] = useState('')
    const [isResending, setIsResending] = useState(false)
    const [resendMessage, setResendMessage] = useState('')
    const { verifyEmail, isLoading, error } = useAuth()

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await verifyEmail(email, otp)
            onSuccess()
        } catch (err) {
            console.error('Verification failed:', err)
        }
    }

    const handleResend = async () => {
        setIsResending(true)
        setResendMessage('')
        try {
            await authControllerInitiateEmailVerification({ email })
            setResendMessage('Verification code sent! Check your email.')
        } catch (err) {
            setResendMessage('Failed to resend code. Please try again.')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card shadowsize="lg" className="relative w-full max-w-md p-8 border-4">
                <div className="flex flex-col items-center justify-center mb-6 gap-3">
                    <div className="bg-primary w-16 h-16 border-2 border-black rounded flex items-center justify-center shadow-hard">
                        <span className="material-symbols-outlined text-4xl text-black">mail</span>
                    </div>
                    <div className="text-center mt-2">
                        <h2 className="text-2xl font-extrabold text-black tracking-tight leading-none uppercase">
                            Verify Your Email
                        </h2>
                        <p className="text-black font-medium text-sm mt-2">
                            We sent a verification code to
                        </p>
                        <p className="text-black font-bold text-sm">{email}</p>
                    </div>
                </div>

                <form onSubmit={handleVerify} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="otp">
                            Verification Code
                        </label>
                        <Input
                            id="otp"
                            placeholder="Enter 6-digit code"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            icon="key"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 p-3 text-red-700 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    {resendMessage && (
                        <div className={`border-2 p-3 text-sm font-bold ${resendMessage.includes('sent')
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-red-100 border-red-500 text-red-700'
                            }`}>
                            {resendMessage}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            className="flex-1 h-12 justify-center gap-2"
                            disabled={isLoading || otp.length !== 6}
                        >
                            {isLoading ? 'Verifying...' : 'Verify'}
                            <span className="material-symbols-outlined font-bold">check_circle</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 px-4"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    </div>

                    <div className="text-center pt-4 border-t-2 border-dashed border-stone-300">
                        <p className="text-sm text-stone-600 mb-2">Didn't receive the code?</p>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 text-sm"
                            onClick={handleResend}
                            disabled={isResending}
                        >
                            {isResending ? 'Sending...' : 'Resend Code'}
                        </Button>
                    </div>
                </form>

                <div className="absolute -top-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
            </Card>
        </div>
    )
}
