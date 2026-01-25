import { Sidebar } from './Sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-yellow-50/30 w-full">
            <Sidebar />
            <main className="ml-64 flex-1 flex flex-col min-h-screen overflow-y-auto p-8 lg:p-12 relative ">
                {children}
            </main>
        </div>
    )
}
