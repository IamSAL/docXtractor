import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { AppLayout } from '../components/AppLayout'
import { PageHeader } from '../components/retroui/PageHeader'
import { Button } from '@/components/retroui/Button'

export const Route = createFileRoute('/settings')({
    component: SettingsLayout,
})

function SettingsLayout() {
    return (
        <AppLayout>
            <div className="w-full  mx-auto p-4 lg:p-12">
                <PageHeader
                    heading="Settings"
                    description="Configure your extraction engine. Tweak consensus algorithms and manage output formats."
                    breadcrumb="/ HOME / EXTRACTORS"
                >
                    <Link to="/extractors/new">
                        <Button className="gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide bg-white">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span>Logout</span>
                        </Button>
                    </Link>
                </PageHeader>



                <div className="overflow-x-auto mb-8 pb-1 no-scrollbar border-b-2 border-[#e6e3d1]">
                    <div className="flex min-w-max gap-8 px-2">
                        {[
                            { label: 'Extraction', icon: 'tune', path: '/settings/extraction' },
                            { label: 'Profile', icon: 'person', path: '/settings/profile' },
                            { label: 'API Keys', icon: 'key', path: '/settings/api-keys' },
                            { label: 'Notifications', icon: 'notifications', path: '/settings/notifications' },
                            { label: 'Appearance', icon: 'palette', path: '/settings/appearance' }
                        ].map((tab) => (
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

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-white/80 backdrop-blur-md border-t border-[#e6e3d1] py-4 px-6 z-40">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="hidden sm:flex flex-col">
                        <span className="text-xs text-[#948a51] font-mono uppercase">UNSAVED CHANGES</span>
                        <span className="text-sm font-medium text-[#1a190e]">Configuration modified</span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none items-center justify-center px-6 py-2.5 rounded-lg border-2 border-[#e6e3d1] text-[#948a51] hover:text-[#1a190e] hover:bg-gray-50 font-bold text-sm transition-all shadow-sm">
                            Reset Defaults
                        </button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-[#e5d161] hover:bg-[#d4c04d] text-[#1a190e] font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-black transition-all">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
