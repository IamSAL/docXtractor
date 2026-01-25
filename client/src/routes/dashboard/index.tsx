import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'

export const Route = createFileRoute('/dashboard/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <AppLayout>
            {/* Header Section */}
            <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-black mb-1">
                        Dashboard
                    </h2>
                    <p className="text-black font-medium opacity-70">
                        Welcome back! Here is your extraction overview.
                    </p>
                </div>
                <button className="neobrutal-btn flex items-center gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>New Pipeline</span>
                </button>
            </header>
            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Stat 1 */}
                <div className="neobrutal-card p-6 flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-sm uppercase text-gray-600">
                            Total Documents
                        </p>
                        <div className="p-1.5 bg-accent-teal/20 border-2 border-black rounded-md text-teal-800">
                            <span className="material-symbols-outlined text-[20px]">
                                file_copy
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black">1,248</h3>
                        <div className="flex items-center gap-1 mt-1 text-sm font-bold text-green-700">
                            <span className="material-symbols-outlined text-base">
                                trending_up
                            </span>
                            <span>+12%</span>
                        </div>
                    </div>
                </div>
                {/* Stat 2 */}
                <div className="neobrutal-card p-6 flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-sm uppercase text-gray-600">
                            Active Pipelines
                        </p>
                        <div className="p-1.5 bg-accent-purple/20 border-2 border-black rounded-md text-purple-800">
                            <span className="material-symbols-outlined text-[20px]">hub</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black">8</h3>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            Running smoothly
                        </p>
                    </div>
                </div>
                {/* Stat 3 */}
                <div className="neobrutal-card p-6 flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-sm uppercase text-gray-600">
                            Pages Processed
                        </p>
                        <div className="p-1.5 bg-blue-100 border-2 border-black rounded-md text-blue-800">
                            <span className="material-symbols-outlined text-[20px]">
                                layers
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black">14.5k</h3>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            Lifetime usage
                        </p>
                    </div>
                </div>
                {/* Stat 4 */}
                <div className="neobrutal-card p-6 flex flex-col justify-between h-40 bg-green-50">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-sm uppercase text-gray-600">
                            Success Rate
                        </p>
                        <div className="p-1.5 bg-green-200 border-2 border-black rounded-md text-green-800">
                            <span className="material-symbols-outlined text-[20px]">
                                check_circle
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-green-700">98.2%</h3>
                        <p className="text-sm font-medium text-green-800 mt-1">
                            High accuracy
                        </p>
                    </div>
                </div>
            </section>
            {/* Main Content Grid Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Recent Pipelines */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-extrabold border-b-4 border-primary inline-block pr-2">
                            Recent Pipelines
                        </h3>
                        <a
                            className="text-sm font-bold hover:underline flex items-center gap-1"
                            href="#"
                        >
                            View All{" "}
                            <span className="material-symbols-outlined text-base">
                                arrow_forward
                            </span>
                        </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Pipeline Card 1 */}
                        <div className="neobrutal-card p-5 group cursor-pointer bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gray-100 p-2 rounded border-2 border-black">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                </div>
                                <span className="bg-primary px-2 py-0.5 rounded text-xs font-bold border border-black">
                                    v1.2
                                </span>
                            </div>
                            <h4 className="font-bold text-lg leading-tight mb-1">
                                Invoice Processor
                            </h4>
                            <p className="text-xs text-gray-500 font-mono mb-4">
                                ID: INV-2023-X
                            </p>
                            <div className="border-t-2 border-dashed border-gray-300 my-3" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-600">
                                    Last run: 2h ago
                                </span>
                                <button className="size-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-black hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-lg">
                                        play_arrow
                                    </span>
                                </button>
                            </div>
                        </div>
                        {/* Pipeline Card 2 */}
                        <div className="neobrutal-card p-5 group cursor-pointer bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gray-100 p-2 rounded border-2 border-black">
                                    <span className="material-symbols-outlined">gavel</span>
                                </div>
                                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold border border-black">
                                    v2.0
                                </span>
                            </div>
                            <h4 className="font-bold text-lg leading-tight mb-1">
                                Contract Analyzer
                            </h4>
                            <p className="text-xs text-gray-500 font-mono mb-4">
                                ID: LEG-2023-A
                            </p>
                            <div className="border-t-2 border-dashed border-gray-300 my-3" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-600">
                                    Last run: 1d ago
                                </span>
                                <button className="size-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-black hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-lg">
                                        play_arrow
                                    </span>
                                </button>
                            </div>
                        </div>
                        {/* Pipeline Card 3 */}
                        <div className="neobrutal-card p-5 group cursor-pointer bg-white">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gray-100 p-2 rounded border-2 border-black">
                                    <span className="material-symbols-outlined">
                                        qr_code_scanner
                                    </span>
                                </div>
                                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold border border-black">
                                    v1.0
                                </span>
                            </div>
                            <h4 className="font-bold text-lg leading-tight mb-1">
                                Receipt Scanner
                            </h4>
                            <p className="text-xs text-gray-500 font-mono mb-4">
                                ID: RCP-2023-B
                            </p>
                            <div className="border-t-2 border-dashed border-gray-300 my-3" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-600">
                                    Last run: 5m ago
                                </span>
                                <button className="size-8 flex items-center justify-center rounded-full border-2 border-black hover:bg-black hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-lg">
                                        play_arrow
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right Column: Recent Activity / Jobs (as a taller panel on XL screens) */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <h3 className="text-2xl font-extrabold border-b-4 border-primary inline-block pr-2">
                        Activity Feed
                    </h3>
                    <div className="neobrutal-card p-0 overflow-hidden flex-1 bg-white">
                        {/* List Header */}
                        <div className="bg-primary/20 p-4 border-b-2 border-black flex items-center justify-between">
                            <span className="font-bold uppercase text-sm">Latest Jobs</span>
                            <span className="material-symbols-outlined">history</span>
                        </div>
                        {/* List Items */}
                        <div className="divide-y-2 divide-gray-100">
                            {/* Item 1 */}
                            <div className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm">#JOB-8823</span>
                                    <span className="status-badge bg-green-200 text-green-900 border-green-900">
                                        Success
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 mb-1">Invoice Processor</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>12 Docs</span>
                                    <span>2 mins ago</span>
                                </div>
                            </div>
                            {/* Item 2 */}
                            <div className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm">#JOB-8822</span>
                                    <span className="status-badge bg-yellow-200 text-yellow-900 border-yellow-900 flex items-center gap-1">
                                        <span className="animate-spin material-symbols-outlined text-[10px]">
                                            progress_activity
                                        </span>
                                        Processing
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 mb-1">Contract Analyzer</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>1 Doc</span>
                                    <span>5 mins ago</span>
                                </div>
                            </div>
                            {/* Item 3 */}
                            <div className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm">#JOB-8821</span>
                                    <span className="status-badge bg-red-200 text-red-900 border-red-900">
                                        Failed
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 mb-1">Receipt Scanner</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>45 Docs</span>
                                    <span>1 hour ago</span>
                                </div>
                            </div>
                            {/* Item 4 */}
                            <div className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-sm">#JOB-8820</span>
                                    <span className="status-badge bg-green-200 text-green-900 border-green-900">
                                        Success
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 mb-1">Invoice Processor</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>8 Docs</span>
                                    <span>3 hours ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Full Width Jobs Table Section */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-extrabold border-b-4 border-primary inline-block pr-2">
                        Extraction History
                    </h3>
                    <div className="flex gap-2">
                        <button className="bg-white border-2 border-black rounded px-3 py-1 text-sm font-bold shadow-hard-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all">
                            Filter
                        </button>
                        <button className="bg-white border-2 border-black rounded px-3 py-1 text-sm font-bold shadow-hard-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all">
                            Export
                        </button>
                    </div>
                </div>
                <div className="neobrutal-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-black">
                                    <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                                        Job ID
                                    </th>
                                    <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                                        Pipeline
                                    </th>
                                    <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                                        Date
                                    </th>
                                    <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                                        Documents
                                    </th>
                                    <th className="p-4 font-bold text-sm uppercase tracking-wide border-r-2 border-black/10">
                                        Status
                                    </th>
                                    <th className="p-4 font-bold text-sm uppercase tracking-wide text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-gray-100 bg-white">
                                {/* Row 1 */}
                                <tr className="hover:bg-yellow-50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-sm">#JOB-8823</td>
                                    <td className="p-4 font-medium text-sm">Invoice Processor</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        Oct 24, 2023 10:42 AM
                                    </td>
                                    <td className="p-4 text-sm font-bold">12</td>
                                    <td className="p-4">
                                        <span className="status-badge bg-green-300 text-black border-black">
                                            Success
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-black hover:bg-black hover:text-white p-1 rounded border border-black">
                                            <span className="material-symbols-outlined text-sm block">
                                                download
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 2 */}
                                <tr className="hover:bg-yellow-50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-sm">#JOB-8822</td>
                                    <td className="p-4 font-medium text-sm">Contract Analyzer</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        Oct 24, 2023 10:35 AM
                                    </td>
                                    <td className="p-4 text-sm font-bold">1</td>
                                    <td className="p-4">
                                        <span className="status-badge bg-yellow-300 text-black border-black flex w-max items-center gap-1">
                                            <span className="animate-spin material-symbols-outlined text-[12px]">
                                                progress_activity
                                            </span>
                                            Running
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-black hover:bg-black hover:text-white p-1 rounded border border-black">
                                            <span className="material-symbols-outlined text-sm block">
                                                cancel
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 3 */}
                                <tr className="hover:bg-yellow-50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-sm">#JOB-8821</td>
                                    <td className="p-4 font-medium text-sm">Receipt Scanner</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        Oct 23, 2023 04:15 PM
                                    </td>
                                    <td className="p-4 text-sm font-bold">45</td>
                                    <td className="p-4">
                                        <span className="status-badge bg-red-300 text-black border-black">
                                            Failed
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-black hover:bg-black hover:text-white p-1 rounded border border-black">
                                            <span className="material-symbols-outlined text-sm block">
                                                refresh
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 4 */}
                                <tr className="hover:bg-yellow-50 transition-colors group">
                                    <td className="p-4 font-mono font-bold text-sm">#JOB-8820</td>
                                    <td className="p-4 font-medium text-sm">Invoice Processor</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        Oct 23, 2023 02:00 PM
                                    </td>
                                    <td className="p-4 text-sm font-bold">8</td>
                                    <td className="p-4">
                                        <span className="status-badge bg-green-300 text-black border-black">
                                            Success
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-black hover:bg-black hover:text-white p-1 rounded border border-black">
                                            <span className="material-symbols-outlined text-sm block">
                                                download
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 border-t-2 border-black p-3 flex justify-center">
                        <button className="text-sm font-bold hover:underline">
                            View All History
                        </button>
                    </div>
                </div>
            </section>
        </AppLayout>
    )
}
