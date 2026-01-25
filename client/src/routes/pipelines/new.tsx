import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'

export const Route = createFileRoute('/pipelines/new')({
    component: NewPipelineComponent,
})

function NewPipelineComponent() {
    return (
        <AppLayout>
            <div className="flex flex-col h-full bg-[#f8f9fa] selection:bg-[#ffdd00] selection:text-black">
                <header className="mb-10 flex flex-col gap-4 border-b-3 border-black pb-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                        <Link to="/pipelines" className="hover:text-black transition-colors no-underline">PIPELINES</Link>
                        <span>/</span>
                        <span className="text-black">CREATE NEW PIPELINE</span>
                    </div>
                    <div className="flex flex-wrap justify-between items-end gap-6 uppercase tracking-tighter">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-black leading-none border-b-4 border-[#ffdd00]">New Extraction Pipeline</h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1 font-black mt-4 tracking-widest uppercase">
                                Configure a new target for automated AI document processing.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/pipelines"
                                className="px-6 h-12 rounded-sm border-3 border-transparent text-gray-500 text-xs font-black hover:bg-gray-100 transition-colors uppercase tracking-[0.2em] flex items-center no-underline"
                            >
                                CANCEL
                            </Link>
                            <button className="px-8 h-12 rounded-sm border-3 border-black bg-[#ffdd00] hover:bg-[#ffe64d] text-black text-xs font-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 uppercase tracking-[0.2em] italic" type="button">
                                <span className="material-symbols-outlined font-black text-lg">add</span>
                                CREATE PIPELINE
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-8 max-w-2xl pb-20">
                    <section className="bg-white border-3 border-black shadow-[8px_8px_0px_#000] rounded-sm p-8">
                        <form className="flex flex-col gap-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">PIPELINE NAME</label>
                                <input
                                    className="w-full px-5 py-4 bg-gray-50 border-3 border-black rounded-sm text-lg font-black italic focus:bg-white focus:outline-none focus:border-[#ffdd00] transition-colors shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)]"
                                    placeholder="e.g. Standard Invoice Scraper"
                                    type="text"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">DOCUMENT TYPE</label>
                                <div className="relative">
                                    <select className="w-full px-5 py-4 bg-gray-50 border-3 border-black rounded-sm text-sm font-black uppercase tracking-widest focus:bg-white focus:outline-none flex items-center shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)] appearance-none">
                                        <option>INVOICE (PDF/IMAGE)</option>
                                        <option>RECEIPT / EXPENSE</option>
                                        <option>LEGAL CONTRACT</option>
                                        <option>RESUME / CV</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 font-black pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">DESCRIPTION</label>
                                <textarea
                                    className="w-full h-32 px-5 py-4 bg-gray-50 border-3 border-black rounded-sm text-sm font-bold focus:bg-white focus:outline-none focus:border-[#ffdd00] transition-colors resize-none shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)]"
                                    placeholder="Briefly describe the purpose of this extraction pipeline..."
                                />
                            </div>

                            <div className="bg-yellow-50 border-3 border-black border-dashed p-6 rounded-sm">
                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2 italic">
                                    <span className="material-symbols-outlined text-sm font-black">auto_awesome</span>
                                    AI PRE-CONFIGURATION
                                </h4>
                                <p className="text-xs font-bold leading-relaxed text-yellow-800 uppercase tracking-tight">After creation, you will define the schema fields and provide samples for few-shot learning optimization.</p>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </AppLayout>
    )
}
