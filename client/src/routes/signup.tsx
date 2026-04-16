import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '../components/retroui/Button'
import { Input } from '../components/retroui/Input'
import { Card } from '../components/retroui/Card'
import { VerifyEmailModal } from '../components/VerifyEmailModal'
import { useAuth, useRedirectIfAuthenticated } from '../hooks/useAuth'

export const Route = createFileRoute('/signup')({
  component: SignupComponent,
})

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  terms: boolean
}

function SignupComponent() {
  const navigate = useNavigate()
  const { signup, isLoading, error, clearError } = useAuth()
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  // Redirect if already authenticated
  useRedirectIfAuthenticated('/dashboard')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>()

  const password = watch('password')

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data.email, data.password)
      setSignupEmail(data.email)
      setShowVerifyModal(true)
    } catch (err) {
      console.error('Signup error:', err)
    }
  }

  const handleVerificationSuccess = () => {
    setShowVerifyModal(false)
    navigate({ to: '/dashboard' })
  }

  const handleVerificationCancel = () => {
    setShowVerifyModal(false)
    clearError()
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f0f0] w-full" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <Card shadowsize="lg" className="relative w-full max-w-md p-8 md:p-10 border-4 animate-fade-in">
          <div className="flex flex-col items-center justify-center mb-8 gap-3">
            <div className="bg-primary w-16 h-16 border-2 border-black rounded flex items-center justify-center shadow-hard">
              <span className="material-symbols-outlined text-4xl text-black">
                description
              </span>
            </div>
            <div className="text-center mt-2">
              <h1 className="text-3xl font-extrabold text-black tracking-tight leading-none uppercase">DocXTractor</h1>
              <p className="text-black font-medium text-sm mt-1">Extract data with confidence.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border-2 border-red-500 p-4 text-red-700 text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="email">Email Address</label>
              <Input
                id="email"
                placeholder="name@company.com"
                type="email"
                icon="mail"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <span className="text-red-600 text-xs font-bold">{errors.email.message}</span>
              )}
            </div>
            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="password">Password</label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                icon="lock"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number',
                  },
                })}
              />
              {errors.password && (
                <span className="text-red-600 text-xs font-bold">{errors.password.message}</span>
              )}
            </div>
            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="confirm_password">Confirm Password</label>
              <Input
                id="confirm_password"
                placeholder="••••••••"
                type="password"
                icon="lock_reset"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <span className="text-red-600 text-xs font-bold">{errors.confirmPassword.message}</span>
              )}
            </div>

            <div className="flex items-start gap-3 mt-1">
              <div className="relative flex items-center">
                <input
                  className="peer h-5 w-5 cursor-pointer appearance-none border-2 border-black bg-white checked:bg-primary transition-all hover:bg-stone-100 rounded-none checked:border-black focus:ring-0 focus:ring-offset-0"
                  id="terms"
                  type="checkbox"
                  {...register('terms', {
                    required: 'You must accept the terms and conditions',
                  })}
                />
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100">
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                </span>
              </div>
              <label className="text-xs text-stone-600 leading-tight pt-1 cursor-pointer select-none font-medium" htmlFor="terms">
                I agree to the <span className="font-bold underline decoration-2 decoration-primary">Terms of Service</span> and <span className="font-bold underline decoration-2 decoration-primary">Privacy Policy</span>.
              </label>
            </div>
            {errors.terms && (
              <span className="text-red-600 text-xs font-bold -mt-4">{errors.terms.message}</span>
            )}

            <Button
              className="mt-2 w-full h-14 text-lg justify-center gap-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
              <span className="material-symbols-outlined font-bold">
                {isLoading ? 'hourglass_empty' : 'arrow_forward'}
              </span>
            </Button>
          </form>
          <div className="text-center border-t-2 border-dashed border-stone-300 pt-5 mt-2">
            <p className="text-sm text-stone-600">
              Already have an account?
              <Link to="/login" className="inline-block ml-1 font-bold text-black border-b-4 border-primary/50 hover:border-primary transition-colors no-underline">Sign In</Link>
            </p>
          </div>
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        </Card>
        <div className="fixed bottom-10 right-10 hidden xl:block animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="bg-white border-2 border-black p-2 shadow-hard-sm -rotate-6">
            <span className="material-symbols-outlined text-4xl">folder_zip</span>
          </div>
        </div>

        <div className="fixed top-32 left-20 hidden xl:block opacity-60">
          <div className="bg-primary/20 border-2 border-black p-4 shadow-hard-sm rotate-12 w-32 h-32 flex items-center justify-center">
            <span className="font-mono text-xs text-center font-bold">RAW DATA<br />PROCESSING...</span>
          </div>
        </div>
      </div>

      {showVerifyModal && (
        <VerifyEmailModal
          email={signupEmail}
          onSuccess={handleVerificationSuccess}
          onCancel={handleVerificationCancel}
        />
      )}
    </>
  )
}
