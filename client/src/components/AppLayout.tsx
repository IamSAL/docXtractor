import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Button } from './retroui/Button'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
        () => typeof window !== 'undefined' && localStorage.getItem('sidebar-collapsed') === 'true'
    )
    const { user } = useAuth()

    return (
        <ProtectedRoute>
            <div className="flex flex-col lg:flex-row min-h-screen bg-yellow-50/30 w-full relative">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(c => {
                        const next = !c
                        localStorage.setItem('sidebar-collapsed', String(next))
                        return next
                    })}
                />

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
                        {user?.hasProfile ? (
                            <div className="w-full h-full flex items-center justify-center bg-primary font-bold text-lg">
                                {user.fullName?.[0] || user.email[0].toUpperCase()}
                            </div>
                        ) : (
                            <span className="material-symbols-outlined text-black">person</span>
                        )}
                    </Button>
                </header>

                <main className={`flex-1 flex flex-col min-h-[calc(100vh-64px)] lg:min-h-screen overflow-y-auto relative w-full lg:w-auto animate-fade-in transition-[margin-left] duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}
