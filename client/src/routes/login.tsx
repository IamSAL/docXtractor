import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '../components/retroui/Button'
import { Input } from '../components/retroui/Input'
import { Card } from '../components/retroui/Card'

export const Route = createFileRoute('/login')({
    component: LoginComponent,
})

function LoginComponent() {
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
                    <div className="flex flex-col gap-2">
                        <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="email">Email Address</label>
                        <Input
                            id="email"
                            placeholder="name@company.com"
                            type="email"
                            icon="mail"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <label className="text-black text-base font-bold uppercase tracking-wide" htmlFor="password">Password</label>
                            <Link to="." className="text-sm font-bold text-black hover:underline decoration-2 decoration-primary underline-offset-2 no-underline">Forgot password?</Link>
                        </div>
                        <Input
                            id="password"
                            placeholder="••••••••"
                            type="password"
                            icon="lock"
                        />
                    </div>
                    <Button className="mt-2 w-full h-14 text-lg justify-center gap-2" type="button">
                        Sign In
                        <span className="material-symbols-outlined font-bold">
                            login
                        </span>
                    </Button>
                </form>
                <div className="mt-8 flex flex-col gap-4">
                    <div className="relative flex items-center">
                        <div className="grow border-t-2 border-black"></div>
                        <span className="shrink mx-4 text-xs font-bold uppercase tracking-widest text-black">Or sign in quickly</span>
                        <div className="grow border-t-2 border-black"></div>
                    </div>
                    <Button variant="outline" className="w-full h-12 justify-center gap-2 bg-white" type="button">
                        <span className="material-symbols-outlined text-xl">person_search</span>
                        Login as Guest
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12 justify-center gap-2 bg-white" type="button">
                            <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG90Z0AqtXTsKm_McnzdJ534I7h656CC9oy9GK-L8ZmZ8LkmZRDXDuni-Z29mx0GbXvC9pBPIYa9JcxHyhBT7vkzXss60ytmXn70RiwQFONlZ2pbVv1sR_iA5RAfqJTDq72dxwRd6Q3UDl7hwzWCZ-d5OY-h3MiqHgRKrohV5Z8nLrHF8pSR2I-SKHwmS0Dqe2nNqQglAEBgT4ybbGq_eWDYduq4useGThVgxApzxbhshN5zeCbFU9jdehEln6RYHmgpexMGGhBbhx" />
                            Google
                        </Button>
                        <Button variant="outline" className="h-12 justify-center gap-2 bg-white" type="button">
                            <img alt="GitHub" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJMUz9gnmwg2rNWmZTwqtnrpb-7giKFAZA2FQ5iLbnFL2AnvM80PlQagw4RlysOaUuNFpuBd-FZ_53Z_MRstAWnXOCnGc4Uv3sXHD2sTF2QpVvJneQWcl9qNDsqfn8kJ_5ILp00--7Mu8bGKxAuhJMj-epmz8AFjYOnPPIJQlAfGBbfclxdb56VeuZe1-PYMNcdhzTQ1si-_1K02q8KuCrgZqaEfWT_wJKS2rt4x-diDQNrMxd_bzy9FEkAAPmByT5Y651eWk4vo_i" />
                            GitHub
                        </Button>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-black flex justify-center">
                    <p className="text-black font-medium text-sm">
                        Don't have an account?
                        <Link to="/signup" className="font-bold underline decoration-2 decoration-primary underline-offset-4 hover:bg-primary hover:text-black transition-colors px-1 ml-1 no-underline">Sign Up</Link>
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
