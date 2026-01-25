import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '../components/retroui/Button'
import { Input } from '../components/retroui/Input'
import { Card } from '../components/retroui/Card'

export const Route = createFileRoute('/signup')({
  component: SignupComponent,
})

function SignupComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f0f0] w-full" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <Card shadowsize="lg" className="relative w-full max-w-md p-8 md:p-10 border-4">
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
        <form className="flex flex-col gap-6">
          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="fullname">Full Name</label>
            <Input
              id="fullname"
              placeholder="e.g. Alex Smith"
              type="text"
              icon="person"
            />
          </div>
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="email">Email Address</label>
            <Input
              id="email"
              placeholder="name@company.com"
              type="email"
              icon="mail"
            />
          </div>
          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="password">Password</label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              icon="lock"
            />
          </div>
          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="confirm_password">Confirm Password</label>
            <Input
              id="confirm_password"
              placeholder="••••••••"
              type="password"
              icon="lock_reset"
            />
          </div>

          <div className="flex items-start gap-3 mt-1">
            <div className="relative flex items-center">
              <input className="peer h-5 w-5 cursor-pointer appearance-none border-2 border-black bg-white checked:bg-primary transition-all hover:bg-stone-100 rounded-none checked:border-black focus:ring-0 focus:ring-offset-0" id="terms" type="checkbox" />
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100">
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              </span>
            </div>
            <label className="text-xs text-stone-600 leading-tight pt-1 cursor-pointer select-none font-medium" htmlFor="terms">
              I agree to the <Link to="." className="font-bold underline decoration-2 decoration-primary hover:text-black">Terms of Service</Link> and <Link to="." className="font-bold underline decoration-2 decoration-primary hover:text-black">Privacy Policy</Link>.
            </label>
          </div>

          <Button className="mt-2 w-full h-14 text-lg justify-center gap-2" type="button">
            Create Account
            <span className="material-symbols-outlined font-bold">
              arrow_forward
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
  )
}
