import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'
import { Button } from '../../components/retroui/Button'
import { Input } from '../../components/retroui/Input'
import { Card } from '../../components/retroui/Card'
import { Badge } from '../../components/retroui/Badge'
import { PageHeader } from '../../components/retroui/PageHeader'

export const Route = createFileRoute('/extractors/')({
    component: ExtractorsComponent,
})

function ExtractorsComponent() {
    return (
        <AppLayout>
            <div className="flex flex-col h-full p-4 lg:p-12">
                {/* Page Header Block */}
                <PageHeader
                    heading="My Extractors"
                    description="Manage your AI extraction workflows. Create, test, and deploy data parsers."
                    breadcrumb="/ HOME / EXTRACTORS"
                >
                    <Link to="/extractors/new">
                        <Button className="gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wide">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>New Extractor</span>
                        </Button>
                    </Link>
                </PageHeader>

                {/* Filter & Search Toolbar */}
                <div className="bg-gray-100 border-2 border-black p-4 mb-8">
                    <div className="w-full flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative group">
                            <Input
                                className="w-full bg-white rounded-sm focus:border-[#e5d161] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1)] text-black font-mono text-sm placeholder:text-gray-400 transition-colors h-auto py-3"
                                placeholder="Search extractors by name or ID..."
                                type="text"
                                icon="search"
                            />
                        </div>
                        {/* Filter Chips */}
                        <div className="flex items-center gap-3 overflow-x-auto">
                            <Button variant="outline" className="flex items-center gap-2 px-3 py-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-sm cursor-pointer hover:-translate-y-[1px] transition-transform shrink-0 h-auto" type="button">
                                <span className="text-xs font-bold uppercase tracking-wider">Status: All</span>
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2 px-3 py-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-sm cursor-pointer hover:-translate-y-[1px] transition-transform shrink-0 h-auto" type="button">
                                <span className="text-xs font-bold uppercase tracking-wider">Owner: Me</span>
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </Button>
                            <Button variant="outline" className="flex items-center justify-center w-12 h-12 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] rounded-sm cursor-pointer hover:bg-gray-50 shrink-0 p-0" title="Sort Order" type="button">
                                <span className="material-symbols-outlined">sort</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 pb-12">
                    {/* Extractor Card Template */}
                    {[
                        { id: 'INV-2023-X99', title: 'Invoice Processor', desc: 'Automatically extracts total amount, date, vendor name, and line items from PDF invoices.', status: 'Active', fields: '5 fields', time: '1.2s' },
                        { id: 'RES-BETA-02', title: 'Resume Parser V2', desc: 'Extraction model for tech candidate resumes focusing on skills, experience years, and education.', status: 'Draft', fields: '12 fields', model: 'GPT-4' },
                        { id: 'RES-BETA-03', title: 'Resume Parser V3', desc: 'Extraction model for tech candidate resumes focusing on skills, experience years, and education.', status: 'Draft', fields: '12 fields', model: 'GPT-4' },
                        { id: 'LEG-2023-A01', title: 'Legal Contract Analyzer', desc: 'Identifies liability clauses and termination dates in MSA agreements.', status: 'Config Error', fields: '3 fields', error: 'API Key?' },
                        { id: 'LEG-2023-A02', title: 'Legal Contract Analyzer2', desc: 'Identifies liability clauses and termination dates in MSA agreements.', status: 'Config Error', fields: '3 fields', error: 'API Key?' },

                    ].map((extractor, i) => (
                        <Card key={i} className="flex flex-col bg-white border-2 border-black rounded-sm overflow-hidden h-full hover:shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 p-0" shadowsize="sm">
                            {/* Card Header */}
                            <div className={`h-32 border-b-2 border-black relative overflow-hidden ${extractor.status === 'Draft' ? 'bg-yellow-50' : extractor.status === 'Config Error' ? 'bg-red-50' : 'bg-gray-100'}`}>
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                <div className={`absolute top-3 right-3 text-black text-[10px] font-bold px-2 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider ${extractor.status === 'Active' ? 'bg-green-400' : 'bg-white'}`}>
                                    {extractor.status}
                                </div>
                                <div className="absolute bottom-3 left-3 flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-400 border border-black"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400 border border-black"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-400 border border-black"></div>
                                </div>
                            </div>
                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div>
                                    <h3 className="text-xl font-bold leading-tight mb-1">{extractor.title}</h3>
                                    <p className="text-xs font-mono text-gray-500">ID: {extractor.id}</p>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                    {extractor.desc}
                                </p>
                                <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-300 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <span className="material-symbols-outlined text-lg">data_object</span>
                                        <span className="text-xs font-bold font-mono uppercase">{extractor.fields}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        {extractor.time && (
                                            <>
                                                <span className="material-symbols-outlined text-lg">timer</span>
                                                <span className="text-xs font-bold font-mono uppercase">{extractor.time}</span>
                                            </>
                                        )}
                                        {extractor.model && (
                                            <>
                                                <span className="material-symbols-outlined text-lg">psychology</span>
                                                <span className="text-xs font-bold font-mono uppercase">{extractor.model}</span>
                                            </>
                                        )}
                                        {extractor.error && (
                                            <div className="flex items-center gap-2 text-red-500 font-bold">
                                                <span className="material-symbols-outlined text-lg">error</span>
                                                <span className="text-xs font-mono uppercase">{extractor.error}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Card Actions */}
                            <div className="grid grid-cols-[1fr_1fr_auto] border-t-2 border-black divide-x-2 divide-black">
                                <Link
                                    to="/extractors/edit/$id"
                                    params={{ id: (i + 1).toString() }}
                                    className="py-3 hover:bg-gray-100 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 group no-underline text-black"
                                >
                                    <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">edit</span>
                                    Edit
                                </Link>
                                <button className={`py-3 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 group ${extractor.status === 'Draft' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#e5d161]/20 hover:bg-[#e5d161] text-black'}`}>
                                    <span className={`material-symbols-outlined text-sm ${extractor.status === 'Draft' ? '' : 'group-hover:translate-x-1 transition-transform'}`}>
                                        {extractor.status === 'Draft' ? 'block' : 'play_arrow'}
                                    </span>
                                    Run
                                </button>
                                <button className="px-4 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center" title="Delete Extractor">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </Card>
                    ))}

                    {/* Placeholder for New */}
                    <Link
                        to="/extractors/new"
                        className="flex flex-col items-center justify-center p-8 bg-transparent border-3 border-dashed border-gray-400 rounded-sm h-full min-h-[300px] hover:border-[#e5d161] hover:bg-[#e5d161]/5 transition-all group no-underline"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 border-2 border-gray-400 group-hover:border-[#e5d161] group-hover:scale-110 transition-all">
                            <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-[#e5d161]">add</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-500 group-hover:text-black mb-1 uppercase">Create New Extractor</h3>
                        <p className="text-sm text-gray-400 text-center font-medium">Start from scratch or use a template</p>
                    </Link>
                </div>
            </div>
        </AppLayout>
    )
}
