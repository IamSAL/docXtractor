import { createFileRoute, Link } from '@tanstack/react-router'
import { AppLayout } from '../../components/AppLayout'

export const Route = createFileRoute('/autoruns/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#F7F7F5] selection:bg-[#ffdd00] selection:text-black">
        <header className="mb-10 flex flex-col gap-4 border-b-3 border-black pb-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
            <Link to="/autoruns" className="hover:text-black transition-colors no-underline">AUTORUNS</Link>
            <span>/</span>
            <span className="text-black">CREATE NEW AUTOMATION</span>
          </div>
          <div className="flex flex-wrap justify-between items-end gap-6 uppercase tracking-tighter">
            <div className="flex flex-col gap-1">
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-black leading-none border-b-4 border-[#ffdd00]">New AutoRun Flow</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1 font-black mt-4 tracking-widest uppercase">
                Automate document extraction by linking sources to pipelines.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/autoruns"
                className="px-6 h-12 rounded-sm border-3 border-transparent text-gray-500 text-xs font-black hover:bg-gray-100 transition-colors uppercase tracking-[0.2em] flex items-center no-underline"
              >
                CANCEL
              </Link>
              <button className="px-8 h-12 rounded-sm border-3 border-black bg-[#ffdd00] hover:bg-[#ffe64d] text-black text-xs font-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 uppercase tracking-[0.2em] italic" type="button">
                <span className="material-symbols-outlined font-black text-lg">schema</span>
                DEPLOY FLOW
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-8 max-w-2xl pb-20">
          <section className="bg-white border-3 border-black shadow-[8px_8px_0px_#000] rounded-sm p-8">
            <form className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">AUTOMATION NAME</label>
                <input
                  className="w-full px-5 py-4 bg-gray-50 border-3 border-black rounded-sm text-lg font-black italic focus:bg-white focus:outline-none focus:border-[#ffdd00] transition-colors shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)]"
                  placeholder="e.g. Daily Invoice Sync"
                  type="text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">INPUT SOURCE</label>
                  <div className="relative">
                    <select className="w-full px-5 py-4 bg-gray-50 border-3 border-black rounded-sm text-sm font-black uppercase tracking-widest focus:bg-white focus:outline-none flex items-center shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)] appearance-none">
                      <option>EXTERNAL WEBHOOK</option>
                      <option>EMAIL (IMAP)</option>
                      <option>GOOGLE DRIVE</option>
                      <option>S3 BUCKET</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 font-black pointer-events-none text-black">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">TARGET PIPELINE</label>
                  <div className="relative">
                    <select className="w-full px-5 py-4 bg-gray-50 border-3 border-black rounded-sm text-sm font-black uppercase tracking-widest focus:bg-white focus:outline-none flex items-center shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05)] appearance-none">
                      <option>INVOICE PROCESSOR V2</option>
                      <option>CV PARSER BETA</option>
                      <option>LEGAL ANALYZER</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 font-black pointer-events-none text-black">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="bg-black text-[#ffdd00] p-6 border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] rounded-sm">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-white border-2 border-[#ffdd00] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-black font-black">webhook</span>
                  </div>
                  <div className="h-[2px] bg-[#ffdd00] flex-grow relative after:content-[''] after:absolute after:right-[-2px] after:top-[-5px] after:border-t-[6px] after:border-t-transparent after:border-b-[6px] after:border-b-transparent after:border-left-[10px] after:border-left-[#ffdd00]"></div>
                  <div className="size-12 bg-[#ffdd00] border-2 border-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-black font-black">psychology</span>
                  </div>
                  <div className="h-[2px] bg-[#ffdd00] flex-grow relative after:content-[''] after:absolute after:right-[-2px] after:top-[-5px] after:border-t-[6px] after:border-t-transparent after:border-b-[6px] after:border-b-transparent after:border-left-[10px] after:border-left-[#ffdd00]"></div>
                  <div className="size-12 bg-white border-2 border-[#ffdd00] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-black font-black">database</span>
                  </div>
                </div>
                <p className="text-[10px] font-black uppercase text-center mt-6 tracking-[0.3em] opacity-80 italic">FLOW TOPOLOGY PREVIEW</p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
