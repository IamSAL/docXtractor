import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'

export const Route = createFileRoute('/jobs/$id')({
    component: JobDetailComponent,
})

function JobDetailComponent() {
    const { id } = Route.useParams()

    return (
        <AppLayout>
            <div className="flex flex-col h-full overflow-hidden relative">
                {/* Top Header */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                            <Link to="/jobs" className="hover:underline hover:text-black no-underline text-gray-500 uppercase tracking-widest">Jobs</Link>
                            <span>/</span>
                            <span className="text-black uppercase tracking-widest">Job #{id}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black">Invoice Processing Q3</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full uppercase tracking-widest text-xs font-black">
                            <span className="material-symbols-outlined text-lg">layers</span>
                            <span>6 Sources</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] border-3 border-black shadow-[2px_2px_0px_0px_#000000] rounded-full uppercase tracking-widest text-xs font-black">
                            <span className="w-3 h-3 bg-black rounded-full animate-pulse"></span>
                            <span>IN PROGRESS</span>
                        </div>
                    </div>
                </header>

                {/* Main Dashboard Area */}
                <div className="flex flex-col xl:flex-row gap-8 pb-12">
                    <div className="flex-1 flex flex-col gap-8">
                        {/* Unified Monitor Section */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-end justify-between">
                                <h3 className="text-xl font-black uppercase flex items-center gap-2 tracking-tighter">
                                    <span className="material-symbols-outlined font-black">monitor_heart</span>
                                    Unified Extraction Monitor
                                </h3>
                                <span className="text-xs font-black bg-black text-white px-2 py-1 rounded-sm uppercase tracking-widest">Step 2 of 3</span>
                            </div>
                            {/* Progress Card */}
                            <div className="bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000] p-6 rounded-sm flex flex-col gap-6">
                                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-500">
                                    <span className="text-[#007AFF]">01. Parsing</span>
                                    <span className="text-[#7A00FF]">02. Combining</span>
                                    <span className="text-gray-400">03. Extracting</span>
                                </div>
                                {/* Segmented Bar */}
                                <div className="w-full h-8 border-3 border-black bg-gray-100 flex rounded-sm overflow-hidden relative">
                                    <div className="h-full bg-[#007AFF] w-1/3 border-r-3 border-black flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-sm font-black">check</span>
                                    </div>
                                    <div className="h-full bg-[#7A00FF] w-1/3 border-r-3 border-black relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-20 animate-pulse" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)", backgroundSize: '10px 10px' }}></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-white font-black text-[10px] tracking-widest uppercase">Processing</span>
                                        </div>
                                    </div>
                                    <div className="h-full bg-gray-200 w-1/3"></div>
                                </div>
                                <div className="bg-blue-50 border-l-4 border-[#007AFF] p-4 flex gap-4 items-start">
                                    <span className="material-symbols-outlined text-[#007AFF] mt-0.5">info</span>
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-tight">Combining Context...</p>
                                        <p className="text-xs mt-1 text-gray-600 font-medium">Currently merging text streams from PDF parsers and URL scrapers into a unified context window for the LLM.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Sources List */}
                            <section className="flex flex-col gap-4">
                                <h3 className="text-lg font-black uppercase flex items-center gap-2 tracking-tighter">
                                    <span className="material-symbols-outlined font-black">folder_open</span>
                                    Active Sources
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { name: 'invoice_2024_Q3.pdf', type: '1.2 MB • Local File', icon: 'picture_as_pdf', iconColor: 'text-red-600', bg: 'bg-red-50', status: 'check', statusColor: 'bg-green-400' },
                                        { name: 'linkedin.com/acme-corp', type: 'URL Scraper', icon: 'link', iconColor: 'text-blue-600', bg: 'bg-blue-50', status: 'progress_activity', statusColor: 'bg-[#FFD700]', spin: true },
                                        { name: 'receipt_scanned.png', type: 'OCR Failed: Low Res', icon: 'image', iconColor: 'text-gray-600', bg: 'bg-gray-50', status: 'close', statusColor: 'bg-red-500', error: true }
                                    ].map((source, i) => (
                                        <div key={i} className={`bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000] p-3 rounded-sm flex items-center justify-between group hover:translate-x-1 transition-transform relative overflow-hidden`}>
                                            {source.error && <div className="absolute right-0 top-0 w-4 h-full bg-red-500 opacity-20 transform skew-x-12"></div>}
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 ${source.bg} border-2 border-black rounded-sm flex items-center justify-center shadow-[1px_1px_0px_0px_#000]`}>
                                                    <span className={`material-symbols-outlined ${source.iconColor}`}>{source.icon}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`font-black text-xs uppercase tracking-tight ${source.error ? 'text-red-600' : 'text-black'}`}>{source.name}</span>
                                                    <span className={`text-[10px] font-bold ${source.error ? 'text-red-500' : 'text-gray-400'}`}>{source.type}</span>
                                                </div>
                                            </div>
                                            <div className={`size-8 ${source.statusColor} border-2 border-black rounded-full flex items-center justify-center shadow-[1px_1px_0px_0px_#000] ${source.spin ? 'animate-spin' : ''}`}>
                                                <span className={`material-symbols-outlined text-[16px] font-black ${source.statusColor === 'bg-red-500' ? 'text-white' : 'text-black'}`}>{source.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Context Preview */}
                            <section className="flex flex-col gap-4">
                                <h3 className="text-lg font-black uppercase flex items-center gap-2 tracking-tighter">
                                    <span className="material-symbols-outlined font-black">terminal</span>
                                    Context Log
                                </h3>
                                <div className="bg-black text-white border-3 border-black shadow-[4px_4px_0px_0px_#000000] rounded-sm overflow-hidden flex flex-col h-full min-h-[250px]">
                                    <div className="bg-gray-800 border-b-2 border-black p-2 flex items-center justify-between px-4">
                                        <span className="text-[10px] font-mono text-[#00FF99] font-black uppercase tracking-widest">LIVE_STREAM_LOG</span>
                                    </div>
                                    <div className="p-4 font-mono text-[11px] leading-relaxed overflow-y-auto font-medium">
                                        <p className="text-gray-500 mb-2">// Stream merging started...</p>
                                        <p className="mb-1"><span className="text-[#007AFF]">[PDF]</span> <span className="text-white">Detected Total Amount: $4,500.00.</span></p>
                                        <p className="mb-1"><span className="text-[#FFD700]">[WEB]</span> <span className="text-white">Company Size: 51-200 employees.</span></p>
                                        <p className="mb-1"><span className="text-[#7A00FF]">[SYS]</span> <span className="text-white">Correlating Vendor Address...</span></p>
                                        <p className="animate-pulse text-[#00FF99]">_</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <aside className="w-full xl:w-72 flex flex-col gap-6">
                        <h3 className="text-lg font-black uppercase border-b-3 border-black pb-2 tracking-tighter">Execution Stats</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                            <div className="bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000000] p-4 rounded-sm relative overflow-hidden">
                                <div className="flex justify-between items-start">
                                    <span className="font-black text-[10px] text-gray-500 uppercase tracking-widest">Completed</span>
                                    <span className="material-symbols-outlined text-[#00FF99] font-black">check_circle</span>
                                </div>
                                <div className="mt-2 text-4xl font-black italic tracking-tighter">4</div>
                                <div className="w-full bg-gray-100 h-2 mt-3 border-2 border-black rounded-full overflow-hidden">
                                    <div className="bg-[#00FF99] h-full w-[66%]"></div>
                                </div>
                            </div>
                            <div className="bg-[#FF6B00] border-3 border-black shadow-[4px_4px_0px_0px_#000000] p-4 flex items-center justify-between cursor-pointer hover:bg-[#e66000] transition-colors rounded-sm">
                                <div className="flex flex-col text-white drop-shadow-md">
                                    <span className="font-black text-xl italic tracking-tighter leading-none">1 ISSUE</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-1">Needs Review</span>
                                </div>
                                <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">rate_review</span>
                            </div>
                        </div>
                        <div className="mt-auto flex flex-col gap-3">
                            <Link to="/jobs/review/$id" params={{ id }} className="bg-black text-white hover:bg-gray-800 w-full py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none no-underline">
                                <span className="material-symbols-outlined text-sm">rate_review</span>
                                HUMAN REVIEW
                            </Link>
                            <button className="bg-white hover:bg-gray-50 text-black w-full py-3 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_0px_#000000] transition-all" type="button">
                                <span className="material-symbols-outlined text-sm">description</span>
                                View Report
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </AppLayout>
    )
}
