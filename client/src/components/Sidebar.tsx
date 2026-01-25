import { Link } from '@tanstack/react-router'
import { useAuth, useLogout } from '@/hooks/useAuth'

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const { user } = useAuth()
    const logout = useLogout()

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-white border-r-3 border-black flex flex-col h-screen fixed left-0 top-0 z-50
                transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Area */}
                <div className="p-6 border-b-3 border-black bg-white flex justify-between items-center">
                    <Link to="/dashboard" className="flex items-center gap-3 no-underline text-black" onClick={onClose}>
                        <div className="size-10 bg-black text-white flex items-center justify-center rounded border-2 border-black shadow-hard-sm">
                            <span className="material-symbols-outlined text-[24px]">
                                description
                            </span>
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight">DocXTractor</h1>
                    </Link>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="lg:hidden text-black block">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {/* Navigation */}
                <nav className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                    <Link
                        to="/dashboard"
                        className="neobrutal-sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-black no-underline"
                        activeProps={{ className: 'active' }}
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="font-bold">Dashboard</span>
                    </Link>
                    <Link
                        to="/pipelines"
                        className="neobrutal-sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-black no-underline"
                        activeProps={{ className: 'active' }}
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined">fork_right</span>
                        <span className="font-bold">Pipelines</span>
                    </Link>
                    <Link
                        to="/jobs"
                        className="neobrutal-sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-black no-underline"
                        activeProps={{ className: 'active' }}
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined">list_alt</span>
                        <span className="font-bold">Jobs</span>
                    </Link>
                    <Link
                        to="/autoruns"
                        className="neobrutal-sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-black no-underline"
                        activeProps={{ className: 'active' }}
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined">auto_mode</span>
                        <span className="font-bold">AutoRuns</span>
                    </Link>
                    <div className="my-2 border-t-2 border-black border-dashed" />
                    <Link
                        to="/settings"
                        className="neobrutal-sidebar-item flex items-center gap-3 px-4 py-3 rounded-lg text-black no-underline"
                        activeProps={{ className: 'active' }}
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <span className="font-bold">Settings</span>
                    </Link>
                </nav>
                {/* User Profile */}
                <div className="p-4 border-t-3 border-black bg-yellow-50">
                    <div className="group relative">
                        <div className="flex items-center gap-3 p-2 rounded-lg border-2 border-black bg-white shadow-hard-sm cursor-pointer hover:bg-gray-50">
                            <div className="size-8 rounded-full bg-gray-200 border-2 border-black overflow-hidden flex items-center justify-center">
                                {user?.hasProfile ? (
                                    <div className="w-full h-full flex items-center justify-center bg-primary font-bold text-xs">
                                        {user.fullName?.[0] || user.email[0].toUpperCase()}
                                    </div>
                                ) : (
                                    <span className="material-symbols-outlined text-black text-lg">person</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{user?.fullName || user?.email}</p>
                                <p className="text-xs text-gray-600 truncate capitalize">{user?.role}</p>
                            </div>
                            <button onClick={logout} className="p-1 hover:bg-red-100 rounded" title="Logout">
                                <span className="material-symbols-outlined text-sm text-red-600">logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
