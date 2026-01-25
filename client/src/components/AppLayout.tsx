import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Button } from './retroui/Button'

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-yellow-50/30 w-full relative">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Header */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b-2 border-black px-4 py-3 flex items-center justify-between lg:hidden transition-all">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 hover:bg-gray-200 h-auto w-auto"
                >
                    <span className="material-symbols-outlined text-black text-3xl">menu</span>
                </Button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-black flex items-center justify-center rounded-sm border border-black">
                        <span className="material-symbols-outlined text-primary text-sm font-bold">description</span>
                    </div>
                    <h1 className="text-black text-lg font-black tracking-tighter uppercase">DocXTractor</h1>
                </div>
                <Button className="relative w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-primary shadow-hard-sm p-0 h-10 w-10">
                    <img
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPRa7B_KjGMFnt-GCzDzmllIlNq0fMO_xCTH4d0fYwyc_IJKp07LtB5AGrmYPqvi9hQpkmohkTuz4ITA5l8veRzLJIst8FCZ6JPuEIUyzfNOVqVDJ1r8TExfdcEd0vCZU3M6S7whm5PgsSteLx_VGKtH5_JEgneb4f2k4FIayqvDPhFQOoV-YoAqES6kkjrTaU2jiPWONvx9Kpqh3dTRM214SvdixEShPXEKGqztGfTcplP7gJINAIrgZgR3n8KluuAr_zfjH5mcq8"
                    />
                </Button>
            </header>

            <main className="lg:ml-64 flex-1 flex flex-col min-h-[calc(100vh-64px)] lg:min-h-screen overflow-y-auto relative w-full lg:w-auto">
                {children}
            </main>
        </div>
    )
}
