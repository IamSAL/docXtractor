import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: SignupComponent,
})

function SignupComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f0f0] w-full" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="relative w-full max-w-md bg-white border-4 border-black rounded-lg shadow-hard-lg p-8 md:p-10">
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
            <div className="relative">
              <input
                className="w-full bg-white border-2 border-black rounded px-4 py-3 h-12 text-black font-medium placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-yellow-50 focus:border-black transition-all shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-hard focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5"
                id="fullname"
                placeholder="e.g. Alex Smith"
                type="text"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
                person
              </span>
            </div>
          </div>
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="email">Email Address</label>
            <div className="relative">
              <input
                className="w-full bg-white border-2 border-black rounded px-4 py-3 h-12 text-black font-medium placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-yellow-50 focus:border-black transition-all shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-hard focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5"
                id="email"
                placeholder="name@company.com"
                type="email"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
                mail
              </span>
            </div>
          </div>
          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="password">Password</label>
            <div className="relative">
              <input
                className="w-full bg-white border-2 border-black rounded px-4 py-3 h-12 text-black font-medium placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-yellow-50 focus:border-black transition-all shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-hard focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5"
                id="password"
                placeholder="••••••••"
                type="password"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
                lock
              </span>
            </div>
          </div>
          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="confirm_password">Confirm Password</label>
            <div className="relative">
              <input
                className="w-full bg-white border-2 border-black rounded px-4 py-3 h-12 text-black font-medium placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-yellow-50 focus:border-black transition-all shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-hard focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5"
                id="confirm_password"
                placeholder="••••••••"
                type="password"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
                lock_reset
              </span>
            </div>
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

          <button className="mt-2 w-full h-14 bg-primary text-black text-lg font-extrabold uppercase tracking-wide border-2 border-black rounded shadow-hard active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 hover:bg-[#fde667]" type="button">
            Create Account
            <span className="material-symbols-outlined font-bold">
              arrow_forward
            </span>
          </button>
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
      </div>
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
