import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'

export const Route = createFileRoute('/extractors/$id')({
  component: ExtractorDetailComponent,
})

function ExtractorDetailComponent() {
  const { id } = Route.useParams()

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#f8f9fa]">
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Link to="/extractors" className="text-gray-500 hover:text-black transition-colors no-underline uppercase tracking-widest">Extractors</Link>
            <span className="text-gray-500">/</span>
            <span className="text-black font-black uppercase tracking-widest leading-none">View Extractor</span>
          </div>
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-black leading-none uppercase italic border-b-4 border-black">Invoice Extraction V2</h2>
                <span className="px-2 py-1 rounded border-3 border-black bg-white text-xs font-black shadow-[2px_2px_0px_0px_#000000] uppercase tracking-widest">v1.2</span>
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-1 font-black mt-4 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                OWNER: ALEX MORGAN • LAST SAVED: 10:42 AM
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/extractors/edit/$id"
                params={{ id }}
                className="bg-white border-3 border-black text-black font-black h-12 px-6 flex items-center gap-2 rounded-sm shadow-[4px_4px_0px_#000000] hover:bg-gray-50 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all no-underline uppercase tracking-widest text-xs"
              >
                <span className="material-symbols-outlined">edit</span>
                EDIT
              </Link>
              <button
                className="bg-[#e5d161] border-3 border-black text-black font-black h-12 px-6 flex items-center gap-2 rounded-sm shadow-[4px_4px_0px_#000000] hover:bg-[#d4c04a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest text-xs"
                type="button"
              >
                <span className="material-symbols-outlined font-black">play_arrow</span>
                RUN NOW
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-col xl:flex-row gap-8 pb-12">
          <div className="flex-1 flex flex-col gap-8">
            {/* Info Section */}
            <section className="bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000] rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-gray-50">
                <h3 className="font-black text-xl uppercase tracking-tighter italic flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#d4c04a] font-black">info</span>
                  Extractor Details
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">DOCUMENT TYPE</label>
                  <p className="text-xl font-black italic tracking-tight">Invoice (PDF/Image)</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">TARGET ENTITY</label>
                  <p className="text-xl font-black italic tracking-tight">Standard Commercial Invoice</p>
                </div>
              </div>
            </section>

            {/* Schema Section */}
            <section className="bg-white border-3 border-black shadow-[6px_6px_0px_0px_#000000] rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-gray-50">
                <h3 className="font-black text-xl uppercase tracking-tighter italic flex items-center gap-2">
                  <span className="material-symbols-outlined text-black font-black">schema</span>
                  Field Schema
                </h3>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">3 FIELDS DEFINED</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#1e1e1e] text-white">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] border-r border-gray-700">Name</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] border-r border-gray-700">Type</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Extraction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {[
                      { name: 'Vendor Name', type: 'String', mode: 'AI Auto', color: '#a855f7' },
                      { name: 'PO Number', type: 'String', mode: 'Deterministic', color: '#2dd4bf' },
                      { name: 'Total Amount', type: 'Currency', mode: 'AI Auto', color: '#a855f7' }
                    ].map((field, i) => (
                      <tr key={i} className="hover:bg-yellow-50 transition-colors">
                        <td className="px-6 py-5">
                          <span className="font-black text-sm uppercase tracking-tight">{field.name}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-mono text-xs border border-black px-2 py-1 bg-white font-bold">{field.type}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-full border-2 border-black" style={{ backgroundColor: field.color }}>
                            {field.mode}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Meta/Stats Panel */}
          <aside className="w-full xl:w-80 flex flex-col gap-8">
            <section className="bg-black text-white p-6 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] rounded-sm italic">
              <h4 className="font-black uppercase tracking-widest text-xs mb-4 text-[#e5d161]">SYSTEM STATUS</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[10px] uppercase tracking-widest opacity-70">Extraction Health</span>
                <span className="text-[#00FF99] font-black underline underline-offset-4">PRIME</span>
              </div>
              <div className="w-full h-1 bg-white/20 rounded-full mb-6">
                <div className="w-[94%] h-full bg-[#00FF99]"></div>
              </div>
              <p className="text-[10px] font-medium leading-relaxed opacity-60">This extractor is utilizing GPT-4 with a confidence threshold of 85%. Multi-source validation is enabled.</p>
            </section>

            <section className="bg-white p-6 border-3 border-black shadow-[6px_6px_0px_0px_#000000] rounded-sm">
              <h4 className="font-black uppercase tracking-widest text-xs mb-6 border-b-2 border-black pb-2">Destinations</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-green-50 border-2 border-black rounded-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-sm">table_chart</span>
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-tight">Google Sheets API</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-blue-50 border-2 border-black rounded-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-sm">webhook</span>
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-tight">Enterprise Webhook</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
