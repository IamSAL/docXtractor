import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { AppLayout } from '../components/AppLayout'
import { PageHeader } from '../components/retroui/PageHeader'
import { Button } from '@/components/retroui/Button'
import { useAuthStore } from '@/lib/auth-store'

export const Route = createFileRoute('/settings')({
    component: SettingsLayout,
})

function SettingsLayout() {
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const navigate = useNavigate()
    const isAdmin = user?.role === 'admin'

    const tabs = [
        { label: 'Extraction', icon: 'tune', path: '/settings/extraction' },
        { label: 'Profile', icon: 'person', path: '/settings/profile' },
        { label: 'API Keys', icon: 'key', path: '/settings/api-keys' },
        { label: 'Notifications', icon: 'notifications', path: '/settings/notifications' },
        { label: 'Appearance', icon: 'palette', path: '/settings/appearance' },
        ...(isAdmin ? [{ label: 'Instance', icon: 'admin_panel_settings', path: '/settings/instance' }] : []),
    ]

    return (
        <AppLayout>
            <div className="w-full  mx-auto p-4 lg:p-12">
                <PageHeader
                    heading="Settings"
                    description="Configure your extraction engine. Tweak consensus algorithms and manage output formats."
                    breadcrumb="/ HOME / SETTINGS"
                >
                    <button
                        onClick={() => { logout(); navigate({ to: '/login' }); }}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide bg-white border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span>Logout</span>
                    </button>
                </PageHeader>



                <div className="overflow-x-auto mb-8 pb-1 no-scrollbar border-b-2 border-[#e6e3d1]">
                    <div className="flex min-w-max gap-8 px-2">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                className="group flex items-center gap-2 pb-3 border-b-4 transition-all no-underline text-[#948a51] hover:text-[#1a190e] border-transparent"
                                activeProps={{
                                    className: '!border-[#e5d161] !text-[#1a190e]'
                                }}
                            >
                                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                <span className="font-bold text-sm">{tab.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <Outlet />
            </div>
        </AppLayout>
    )
}
