import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { PageHeader } from '@/components/retroui/PageHeader'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'

export const Route = createFileRoute('/autoruns/')({
    component: AutoRunsComponent,
})

function AutoRunsComponent() {
    return (
        <AppLayout>
            <div className="flex flex-col h-full p-4 lg:p-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <PageHeader
                    heading="AutoRuns"
                    description="Manage and monitor your extraction workflows."
                    breadcrumb="/ HOME / PIPELINES"
                >

                    <Button className="gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide bg-white">
                        <span className="material-symbols-outlined mr-2">auto_awesome</span>
                        Generate with AI
                    </Button>


                    <Link to="/autoruns/new">
                        <Button className="gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>New AutoRun</span>
                        </Button>
                    </Link>
                </PageHeader>


                <div className="pb-6 flex gap-4 z-10 shrink-0">
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                        <Input
                            className="w-full h-12 border-2 border-black bg-white px-4 py-2 font-display text-black shadow-[4px_4px_0px_0px_#000000] placeholder:text-gray-500 focus:outline-none focus:ring-0"
                            placeholder="Search AutoRuns..."
                            type="text"
                            icon="search"
                        />

                    </div>
                    <div className="relative w-48">
                        <select className="w-full pl-4 pr-10 py-3 rounded-sm font-medium border-3 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus:shadow-[4px_4px_0px_#000000] appearance-none cursor-pointer focus:outline-none">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Paused</option>
                            <option>Draft</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-12 z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[
                            { name: 'Invoice Auto-Processor', status: 'Active', color: '#33FF57', icon1: 'mail', label1: 'Email', icon2: 'psychology', label2: 'GPT-4', icon3: 'table_chart', label3: 'Sheets', success: '99%', last: '2m ago' },
                            { name: 'HR Resume Parser', status: 'Active', color: '#33FF57', icon1: 'cloud_upload', label1: 'Upload', icon2: 'psychology', label2: 'Claude', icon3: 'api', label3: 'API', success: '92%', last: '4h ago' },
                            { name: 'Expense Receipts', status: 'Paused', color: '#fb923c', icon1: 'photo_camera', label1: 'Scan', icon2: 'psychology', label2: 'OCR', icon3: 'description', label3: 'CSV', success: '100%', last: '2d ago', paused: true },
                            { name: 'Expense Receipts', status: 'Paused', color: '#fb923c', icon1: 'photo_camera', label1: 'Scan', icon2: 'psychology', label2: 'OCR', icon3: 'description', label3: 'CSV', success: '100%', last: '2d ago', paused: true },
                            { name: 'Expense Receipts', status: 'Paused', color: '#fb923c', icon1: 'photo_camera', label1: 'Scan', icon2: 'psychology', label2: 'OCR', icon3: 'description', label3: 'CSV', success: '100%', last: '2d ago', paused: true },
                            { name: 'Expense Receipts', status: 'Paused', color: '#fb923c', icon1: 'photo_camera', label1: 'Scan', icon2: 'psychology', label2: 'OCR', icon3: 'description', label3: 'CSV', success: '100%', last: '2d ago', paused: true },
                        ].map((run, i) => (
                            <div key={i} className={`bg-white border-3 border-black shadow-[4px_4px_0px_#000000] rounded-sm flex flex-col group h-full transition-all hover:bg-yellow-50/50 ${run.paused ? 'opacity-90' : ''}`}>
                                <div className="p-5 border-b-3 border-black bg-gray-50 flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full border border-black shadow-[1px_1px_0px_#000]" style={{ backgroundColor: run.color }}></span>
                                            <span className="text-xs font-bold uppercase tracking-wider">{run.status}</span>
                                        </div>
                                        <h3 className="text-xl font-bold leading-tight mt-1">{run.name}</h3>
                                    </div>
                                    <button className="hover:bg-gray-200 p-1 rounded transition-colors">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                </div>
                                <div className={`p-6 flex items-center justify-between gap-2 bg-white relative overflow-hidden ${run.paused ? 'grayscale' : ''}`}>
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                                    <div className="relative z-10 flex flex-col items-center gap-1 group/node">
                                        <div className="size-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] group-hover/node:-translate-y-1 transition-transform">
                                            <span className="material-symbols-outlined text-sm">{run.icon1}</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase">{run.label1}</span>
                                    </div>
                                    <div className={`h-[3px] bg-black flex-grow relative after:content-[''] after:absolute after:right-[-2px] after:top-[-5px] after:border-t-[6px] after:border-t-transparent after:border-b-[6px] after:border-b-transparent after:border-left-[10px] after:border-left-black ${run.paused ? 'border-dashed' : ''}`}></div>

                                    <div className="relative z-10 flex flex-col items-center gap-1 group/node">
                                        <div className="size-10 bg-[#ffdd00] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] group-hover/node:-translate-y-1 transition-transform">
                                            <span className="material-symbols-outlined text-sm">{run.icon2}</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase">{run.label2}</span>
                                    </div>
                                    <div className={`h-[3px] bg-black flex-grow relative after:content-[''] after:absolute after:right-[-2px] after:top-[-5px] after:border-t-[6px] after:border-t-transparent after:border-b-[6px] after:border-b-transparent after:border-left-[10px] after:border-left-black ${run.paused ? 'border-dashed' : ''}`}></div>

                                    <div className="relative z-10 flex flex-col items-center gap-1 group/node">
                                        <div className="size-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] group-hover/node:-translate-y-1 transition-transform">
                                            <span className="material-symbols-outlined text-sm">{run.icon3}</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase">{run.label3}</span>
                                    </div>
                                </div>
                                <div className="px-5 py-3 border-t-3 border-black bg-[#F7F7F5] flex justify-between items-center text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">schedule</span>
                                        <span>{run.last}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold uppercase text-xs">Success:</span>
                                        <span className="bg-black text-[#33FF57] px-1.5 font-mono">{run.success}</span>
                                    </div>
                                </div>
                                <div className="p-4 pt-4 mt-auto border-t-3 border-black bg-white flex gap-3">
                                    <button className="bg-[#ffdd00] border-3 border-black text-black font-bold flex-1 py-3 text-sm flex justify-center items-center gap-1 shadow-[4px_4px_0px_#000] hover:bg-[#ffe64d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest rounded-sm">
                                        <span className="material-symbols-outlined text-lg">{run.paused ? 'resume' : 'play_arrow'}</span> {run.paused ? 'Resume' : 'Run'}
                                    </button>
                                    <Link
                                        to="/autoruns/runs/$id"
                                        params={{ id: (i + 1).toString() }}
                                        className="bg-white border-3 border-black text-black font-bold flex-1 py-3 text-sm flex justify-center items-center gap-1 shadow-[4px_4px_0px_#000] hover:bg-gray-50 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest no-underline rounded-sm"
                                    >
                                        History
                                    </Link>
                                </div>
                            </div>
                        ))}

                        <Link
                            to="/autoruns/new"
                            className="bg-[#F7F7F5] border-3 border-black border-dashed rounded-sm flex flex-col items-center justify-center h-full min-h-[350px] cursor-pointer hover:bg-yellow-50 transition-colors group no-underline"
                        >
                            <div className="size-16 bg-[#ffdd00] rounded-full border-3 border-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[4px_4px_0px_#000]">
                                <span className="material-symbols-outlined text-3xl font-black">add</span>
                            </div>
                            <h3 className="text-xl font-bold uppercase text-black">Create New AutoRun</h3>
                            <p className="text-sm font-medium mt-2 text-gray-600">Start from scratch or use a template</p>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
