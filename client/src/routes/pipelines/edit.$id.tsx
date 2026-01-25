import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'

export const Route = createFileRoute('/pipelines/edit/$id')({
    component: EditPipelineComponent,
})

function EditPipelineComponent() {
    const { id } = Route.useParams()

    return (
        <AppLayout>
            <div className="flex flex-col h-full bg-[#f8f9fa] selection:bg-[#e5d161] selection:text-black">
                <header className="mb-8 flex flex-col gap-4 border-b-3 border-black pb-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                        <Link to="/pipelines" className="hover:text-black transition-colors no-underline">PIPELINES</Link>
                        <span>/</span>
                        <span className="text-black">EDIT PIPELINE {id}</span>
                    </div>
                    <div className="flex flex-wrap justify-between items-end gap-6 uppercase tracking-tighter">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                                <h2 className="text-4xl font-black italic tracking-tighter text-black leading-none border-b-4 border-[#e5d161]">Invoice Processor V2</h2>
                                <span className="px-2 py-1 rounded border-3 border-black bg-white text-xs font-black shadow-[2px_2px_0px_#000]">BUILD: 142</span>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 font-black mt-4 tracking-widest">
                                <span className="material-symbols-outlined text-[16px] font-black">schedule</span>
                                LAST EDITED 2 MINS AGO
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="px-6 h-12 rounded-sm border-3 border-transparent text-gray-500 text-xs font-black hover:bg-gray-100 transition-colors uppercase tracking-[0.2em]">
                                DISCARD
                            </button>
                            <button className="px-8 h-12 rounded-sm border-3 border-black bg-[#e5d161] hover:bg-[#d4c04a] text-black text-xs font-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 uppercase tracking-[0.2em] italic" type="button">
                                <span className="material-symbols-outlined font-black">save</span>
                                SAVE PIPELINE
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-10 pb-20 max-w-6xl">
                    {/* Basic Info Section */}
                    <section className="bg-white border-3 border-black shadow-[6px_6px_0px_#000] rounded-sm overflow-hidden">
                        <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-gray-50 cursor-pointer hover:bg-yellow-50/30 transition-colors">
                            <h3 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter italic">
                                <span className="material-symbols-outlined text-[#d4c04a] font-black">info</span>
                                BASIC CONFIGURATION
                            </h3>
                            <span className="material-symbols-outlined font-black">expand_more</span>
                        </div>
                    </section>

                    {/* Field Schema Section */}
                    <section className="bg-white border-3 border-black shadow-[8px_8px_0px_#000] rounded-sm flex flex-col relative overflow-hidden">
                        <div className="px-6 py-5 border-b-3 border-black flex items-center justify-between bg-[#1e1e1e] text-white">
                            <div className="flex flex-col">
                                <h3 className="font-black text-2xl flex items-center gap-3 italic tracking-tighter leading-none">
                                    <span className="material-symbols-outlined text-[#e5d161] text-3xl font-black">schema</span>
                                    FIELD SCHEMA
                                </h3>
                                <p className="text-[10px] font-black tracking-[0.3em] uppercase mt-2 text-gray-400">DATA TARGET DEFINITION LAYER</p>
                            </div>
                            <button className="text-xs font-black bg-[#e5d161] border-3 border-black text-black hover:bg-white shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all px-6 py-3 rounded-sm flex items-center gap-2 uppercase tracking-widest italic" type="button">
                                <span className="material-symbols-outlined text-lg font-black">add_box</span>
                                NEW FIELD
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-black text-[10px] uppercase tracking-[0.2em] font-black border-b-3 border-black italic">
                                        <th className="w-12 py-5 text-center">#</th>
                                        <th className="px-6 py-5">FIELD NAME</th>
                                        <th className="px-6 py-5">TYPE</th>
                                        <th className="px-6 py-5 text-center">MODE</th>
                                        <th className="px-6 py-5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black/10 font-bold uppercase text-xs">
                                    <tr className="group hover:bg-yellow-50/50 transition-colors">
                                        <td className="text-center py-5 opacity-20"><span className="material-symbols-outlined font-black">drag_indicator</span></td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-gray-400 font-black">abc</span>
                                                <span className="font-black text-black">Vendor Name</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-[10px] opacity-60">STRING</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black tracking-widest">AI_AUTO</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined font-black">edit_square</span></button>
                                        </td>
                                    </tr>
                                    <tr className="bg-[#e5d161]/10 border-l-[6px] border-[#e5d161]">
                                        <td className="text-center py-5 text-black"><span className="material-symbols-outlined font-black">drag_indicator</span></td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-black font-black">attach_money</span>
                                                <span className="font-black text-black text-sm">TOTAL AMOUNT</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-[10px]">CURRENCY</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="px-3 py-1 bg-black text-[#e5d161] border-2 border-black rounded-full text-[9px] font-black tracking-widest italic">EDITING...</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="material-symbols-outlined font-black">expand_less</span>
                                        </td>
                                    </tr>
                                    <tr className="bg-white border-y-3 border-black">
                                        <td colSpan={5} className="p-0">
                                            <div className="p-8 bg-gray-50 border-b-3 border-black/5 flex flex-col gap-8">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">SAMPLE SOURCE TEXT</label>
                                                            <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black">CTX:341</span>
                                                        </div>
                                                        <div className="relative group">
                                                            <div className="absolute -inset-1 bg-black/10 rounded-sm blur transition group-hover:bg-[#e5d161]/20"></div>
                                                            <textarea
                                                                className="relative w-full h-44 px-5 py-4 bg-[#1a1a1a] text-[#00FF99] font-mono text-[11px] rounded-sm border-3 border-black focus:outline-none focus:border-[#e5d161] resize-none leading-relaxed shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5)]"
                                                                defaultValue={`... TOTAL AMOUNT DUE: $4,250.00 USD ...`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">EXPECTED DATA MAPPING</label>
                                                        </div>
                                                        <div className="p-6 bg-white border-3 border-black border-dashed rounded-sm flex flex-col justify-center h-44 shadow-hard-sm">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-[#d4c04a] mb-2">OUTPUT_VALUE</label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black italic">$</span>
                                                                <input className="w-full pl-8 pr-4 py-4 bg-gray-100 border-3 border-black text-xl font-black italic focus:bg-white transition-all uppercase tracking-tighter" defaultValue="4250.00" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <button className="text-[10px] font-black uppercase tracking-widest text-black underline underline-offset-4 decoration-2 decoration-[#e5d161] hover:text-[#d4c04a] font-black italic" type="button">AUTO-GENERATE WITH LLM</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-gray-50 border-t-3 border-black flex justify-center">
                            <button className="w-full py-4 border-3 border-dashed border-gray-400 rounded-sm text-gray-400 hover:border-black hover:text-black hover:bg-white transition-all flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-xs">
                                <span className="material-symbols-outlined font-black">add_circle</span>
                                APPEND NEW SCHEMA OBJECT
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    )
}
