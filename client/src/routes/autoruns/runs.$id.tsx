import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '../../components/retroui/PageHeader'
import { AppLayout } from '../../components/AppLayout'

export const Route = createFileRoute('/autoruns/runs/$id')({
  component: AutoRunHistoryComponent,
})

function AutoRunHistoryComponent() {
  const { id } = Route.useParams()

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#ffffff] selection:bg-[#0df2f2] selection:text-black p-4 lg:p-12">
        <PageHeader
          breadcrumb="AutoRuns / History"
          heading="Run History"
          description="Invoice Auto-Processor"
          className="border-b-4 border-black pb-6"
        >
          <div className="flex items-center gap-4">
            <span className="bg-black text-white px-2 py-1 text-xs font-black uppercase tracking-[0.2em] italic">Workflow ID: {id}</span>
            <button
              className="relative bg-[#0df2f2] text-black border-3 border-black px-8 py-3 font-black uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center gap-2 group italic"
              type="button"
            >
              <span className="material-symbols-outlined font-black group-hover:animate-pulse">play_arrow</span>
              Run Now
            </button>
          </div>
        </PageHeader>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          {[
            { label: 'Total Runs', value: '1,241', icon: 'history', shadow: 'shadow-[4px_4px_0px_#000000]' },
            { label: 'Successful', value: '1,202', icon: 'check_circle', bg: 'bg-[#0df2f2]', shadow: 'shadow-[4px_4px_0px_#000000]' },
            { label: 'Failed', value: '38', icon: 'warning', text: 'text-[#FF4d4d]', shadow: 'shadow-[4px_4px_0px_#FF4d4d]' }
          ].map((stat, i) => (
            <div key={i} className={`bg-white border-3 border-black p-6 ${stat.shadow} flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 ${stat.bg || ''}`}>
              <div className="flex justify-between items-start mb-4">
                <p className={`font-black uppercase tracking-widest text-[10px] ${stat.text || 'text-black'}`}>{stat.label}</p>
                <span className={`material-symbols-outlined text-3xl font-black opacity-20 ${stat.text || 'text-black'}`}>{stat.icon}</span>
              </div>
              <p className={`text-4xl font-black tracking-tighter italic ${stat.text || 'text-black'}`}>{stat.value}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-12">
          <main className="lg:col-span-9 w-full overflow-hidden border-3 border-black bg-white shadow-[6px_6px_0px_#000000] relative">
            <div className="bg-black text-white px-4 py-2 flex justify-between items-center border-b-2 border-black">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em]">/logs/autorun_stream</span>
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-yellow-400 animate-pulse"></div>
                <div className="size-3 rounded-full bg-[#0df2f2]"></div>
                <div className="size-3 rounded-full bg-[#FF4d4d]"></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-3 border-black italic">
                    <th className="p-4 border-r-2 border-black text-[10px] font-black uppercase tracking-widest w-36">Status</th>
                    <th className="p-4 border-r-2 border-black text-[10px] font-black uppercase tracking-widest w-32">Run ID</th>
                    <th className="p-4 border-r-2 border-black text-[10px] font-black uppercase tracking-widest">Trigger</th>
                    <th className="p-4 border-r-2 border-black text-[10px] font-black uppercase tracking-widest text-center w-24">Docs</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Started</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-xs uppercase tracking-tight">
                  <tr className="border-b-2 border-black bg-yellow-50 animate-pulse cursor-pointer">
                    <td className="p-4 border-r-2 border-black">
                      <span className="inline-flex items-center gap-2 px-2 py-1 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_#000] text-[10px] font-black">
                        <span className="material-symbols-outlined text-[14px] animate-spin font-black">progress_activity</span> RUNNING
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-black font-mono">#RUN-1241</td>
                    <td className="p-4 border-r-2 border-black flex items-center gap-2 mt-1">
                      <span className="material-symbols-outlined text-sm font-black">webhook</span>
                      WEBHOOK
                    </td>
                    <td className="p-4 border-r-2 border-black text-center italic">8</td>
                    <td className="p-4 text-right opacity-60">JUST NOW</td>
                  </tr>
                  {[1, 2, 3].map(i => (
                    <tr key={i} className="border-b-2 border-black hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="p-4 border-r-2 border-black border-transparent group-hover:border-black">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#0df2f2] border-2 border-black shadow-[2px_2px_0px_#000] text-[10px] font-black">
                          <span className="material-symbols-outlined text-[14px] font-black">check</span> SUCCESS
                        </span>
                      </td>
                      <td className="p-4 border-r-2 border-black font-mono">#RUN-{1240 - i}</td>
                      <td className="p-4 border-r-2 border-black">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm font-black">schedule</span>
                          SCHEDULED
                        </div>
                      </td>
                      <td className="p-4 border-r-2 border-black text-center italic">{5 + i}</td>
                      <td className="p-4 text-right opacity-60 italic">{i * 5} MINS AGO</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 p-4 flex justify-between items-center italic">
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Showing 1-4 of 1,241 runs</p>
              <div className="flex gap-4">
                <button className="size-10 flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_#000] bg-white group hover:bg-[#0df2f2] transition-colors" type="button">
                  <span className="material-symbols-outlined font-black">chevron_left</span>
                </button>
                <button className="size-10 flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_#000] bg-white group hover:bg-[#0df2f2] transition-colors" type="button">
                  <span className="material-symbols-outlined font-black">chevron_right</span>
                </button>
              </div>
            </div>
          </main>

          <aside className="lg:col-span-3 flex flex-col gap-8">
            <section className="bg-black text-[#0df2f2] p-6 border-3 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] italic">
              <h4 className="font-black uppercase tracking-widest text-xs mb-4 text-white">PRO TIP</h4>
              <p className="text-[10px] font-black leading-relaxed tracking-wider uppercase">
                You can download the output JSON directly from the "Action logs" for any successful run to debug your integration flow.
              </p>
              <button className="mt-4 w-full border-2 border-[#0df2f2] py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0df2f2] hover:text-black transition-colors" type="button">
                Read documentation
              </button>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
