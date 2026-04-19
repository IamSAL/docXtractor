import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/runs/review/$id')({
  component: RunReviewComponent,
})

function RunReviewComponent() {
  const { id } = Route.useParams()
  const [introDismissed, setIntroDismissed] = useState(false)

  return (
    <div className="bg-[#FFFDF5] text-slate-900 font-sans h-screen flex flex-col overflow-hidden  w-full">
      <header className="flex-none bg-white border-b-2 border-[#1e293b] z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 no-underline">
              <div className="size-10 bg-[#BFA1FF] border-2 border-[#1e293b] flex items-center justify-center text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b]">
                <span className="material-symbols-outlined text-[24px]">description</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">DocXTractor</h2>
            </Link>
            <div className="h-8 w-0.5 bg-[#1e293b]"></div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Run</span>
              <span className="font-bold text-slate-900">#{id.substring(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] font-bold text-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              <span className="material-symbols-outlined text-[18px]">help</span>
              Help
            </button>
            <div className="size-10 bg-[#FFDE59] rounded-full border-2 border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] overflow-hidden cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCMFXdo8ufwymj2LhvrLA-Gq7zmPP4fSpYIJymMTVVYZRLUesMg7I0Fghp0R6vCJ6w8E40PDKa2sFTS-YuGm8cyPFyzLBqntlqyJ-JjcIAswZKQUbpPS_b2wVrOm84Pc5sf1RvWtb3bL-VfFLC38P__v2UMzufalC_bx_R6HiZuxYD6kmqm13Xekui7kNIJEiDSqXThDEavqMoHAwLziP5vLHsBaZ9Z-cJiBc7wASnd1P_L--KslVWJv-fpjUgNJxht6_0RWKeN-u__')" }}></div>
            </div>
          </div>
        </div>
      </header>

      {!introDismissed && (
        <div className="flex-none bg-[#FFFDF5] border-b-2 border-[#1e293b] px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#1e293b] shrink-0 mt-0.5">info</span>
            <p className="text-sm text-slate-700">
              <strong>Review your extracted data.</strong> We'll show you each value alongside where it came from in the document.
              Accept values that look correct, or edit and reject ones that don't. This helps improve accuracy over time.
            </p>
          </div>
          <button
            className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
            onClick={() => setIntroDismissed(true)}
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        {/* PDF Viewer Area */}
        <div className="w-full lg:w-[60%] flex flex-col bg-slate-50 border-r-2 border-[#1e293b] relative group/viewer">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white p-2 border-2 border-[#1e293b] shadow-[4px_4px_0px_0px_#1e293b] transition-transform hover:scale-105">
            <button className="size-8 flex items-center justify-center hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded">
              <span className="material-symbols-outlined text-[20px]">remove</span>
            </button>
            <span className="flex items-center justify-center px-2 text-sm font-bold w-12">100%</span>
            <button className="size-8 flex items-center justify-center hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 flex flex-col items-center gap-8 bg-[#f8fafc]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            <div className="flex flex-col gap-0 w-full max-w-[700px]">
              <div className="bg-[#8ADCFF] border-2 border-[#1e293b] border-b-0 p-3 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] relative z-10">
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-tight">
                  <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  SOURCE 1: invoice_INV-{id}.pdf
                </div>
                <span className="bg-white border-2 border-[#1e293b] text-xs font-bold px-2 py-0.5 rounded-full">Page 1 of 1</span>
              </div>
              <div className="relative w-full bg-white border-2 border-[#1e293b] shadow-[4px_4px_0px_0px_#1e293b] min-h-[600px] overflow-hidden">
                <img alt="Scanned document" className="w-full h-auto opacity-90 select-none grayscale-[20%] contrast-[1.1]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1hHIZltR_OZusjywor0c-owcs7dF2FIHukwXiSkCu0hUTBAJSh1qoCFJTouXf64yxi8ZsMckKFt9s-50_8PIV-FkAl-UKCBhQO3rBK9nnugN-CqzT2NF2v48wMtPtG7Rvw-cB38UTZbjuK9mb1DxfP92j2bqSM9xur1zhbPS84L31b6HEKs35vTtaUxqn6zWpdeLXimVmmzLufDI4exxrNJvuOzLISi20zoaZhzXxjAdtrha8JqLu2-Y5ZKmVFtc37l09f8XvsmR6" />
                <div className="absolute bottom-[15%] right-[8%] w-[18%] h-[4%] bg-[#FFDE59]/40 border-2 border-[#FFDE59] cursor-pointer mix-blend-multiply ring-2 ring-offset-2 ring-[#FFDE59] z-10 animate-pulse">
                  <div className="absolute -right-3 -top-3 size-6 bg-[#FFDE59] border-2 border-[#1e293b] flex items-center justify-center shadow-sm z-20">
                    <span className="material-symbols-outlined text-slate-900 text-[14px] font-bold">star</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Panel Area */}
        <div className="flex-1 bg-white flex flex-col h-full min-w-[400px] z-10 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="px-8 py-6 border-b-2 border-[#1e293b] bg-[#FFFDF5]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Currently Reviewing</span>
              <div className="flex items-center gap-2 px-2 py-1 bg-green-100 border border-green-200 text-green-800 rounded text-xs font-bold">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                High Confidence
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-none mb-4 uppercase tracking-tighter">Total Amount</h2>
            <div className="relative group">
              <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Extracted Value</label>
              <input className="w-full text-2xl font-bold text-slate-800 bg-slate-50 border-2 border-[#1e293b] p-4 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08)] focus:ring-0 focus:border-[#FFDE59] focus:bg-white transition-all rounded-lg" type="text" defaultValue="$4,250.00" />
              <div className="absolute right-4 top-[34px] flex gap-2">
                <button className="p-1 hover:text-[#1e293b] text-slate-400">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">format_quote</span>
              Sources & Citations
            </h3>
            {/* Citation Card */}
            <div className="bg-[#FFFDF5] border-2 border-[#1e293b] p-4 shadow-[4px_4px_0px_0px_#1e293b] group hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1e293b] transition-all relative rounded-sm">
              <div className="absolute -top-3 -right-3 bg-[#FFDE59] text-slate-900 border-2 border-[#1e293b] p-1 shadow-sm z-10 rounded-full">
                <span className="material-symbols-outlined text-[20px] block">star</span>
              </div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <span className="size-3 rounded-full bg-[#8ADCFF] border-2 border-[#1e293b]"></span>
                  Invoice.pdf
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase">Page 1</span>
              </div>
              <div className="mb-3">
                <img alt="snippet" className="w-full h-16 object-cover object-bottom opacity-70 grayscale border-2 border-slate-200 rounded-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1hHIZltR_OZusjywor0c-owcs7dF2FIHukwXiSkCu0hUTBAJSh1qoCFJTouXf64yxi8ZsMckKFt9s-50_8PIV-FkAl-UKCBhQO3rBK9nnugN-CqzT2NF2v48wMtPtG7Rvw-cB38UTZbjuK9mb1DxfP92j2bqSM9xur1zhbPS84L31b6HEKs35vTtaUxqn6zWpdeLXimVmmzLufDI4exxrNJvuOzLISi20zoaZhzXxjAdtrha8JqLu2-Y5ZKmVFtc37l09f8XvsmR6" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Found Value</p>
                  <p className="text-lg font-bold tracking-tight">$4,250.00</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">99% Match</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t-2 border-[#1e293b]">
            <div className="flex gap-4">
              <button className="flex-1 h-14 bg-white border-2 border-[#1e293b] shadow-[4px_4px_0px_0px_#1e293b] hover:translate-y-1 hover:shadow-none transition-all font-bold text-lg flex items-center justify-center gap-2 text-slate-700 group rounded-md">
                <span className="material-symbols-outlined group-hover:text-red-500 transition-colors">close</span>
                Reject
              </button>
              <button className="flex-1 h-14 bg-[#FFDE59] border-2 border-[#1e293b] shadow-[4px_4px_0px_0px_#1e293b] hover:translate-y-1 hover:shadow-none transition-all font-bold text-lg flex items-center justify-center gap-2 text-slate-900 rounded-md">
                <span className="material-symbols-outlined">check</span>
                Accept Field
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex-none h-16 bg-[#1e293b] text-white flex items-center justify-between px-6 z-30 shadow-[0_-4px_15px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-slate-700 rounded border border-slate-500 flex items-center justify-center font-mono font-bold text-sm shadow-[0_3px_0_0_rgba(0,0,0,0.3)] border-b-4 border-b-slate-800 uppercase">A</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accept</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-8 bg-slate-700 rounded border border-slate-500 flex items-center justify-center font-mono font-bold text-sm shadow-[0_3px_0_0_rgba(0,0,0,0.3)] border-b-4 border-b-slate-800 uppercase">R</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reject</span>
          </div>
        </div>
        <div className="flex items-center gap-4 w-1/3 justify-center">
          <span className="text-sm font-bold whitespace-nowrap text-slate-300">15 of 20 fields validated</span>
          <div className="h-3 w-48 bg-slate-800 rounded-full border border-slate-600 overflow-hidden p-[2px]">
            <div className="h-full bg-[#8AFF8A] w-[75%] rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-white/30 w-full h-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-bold text-slate-400 hover:text-white transition-colors" type="button">Skip for later</button>
          <div className="h-6 w-px bg-slate-600 mx-2"></div>
          <button className="px-6 py-2 bg-[#8AFF8A] text-slate-900 font-bold border-2 border-black shadow-[2px_2px_0_0_rgba(255,255,255,0.3)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all rounded-sm uppercase tracking-tighter" type="button">
            Finish Review
          </button>
        </div>
      </footer>
    </div>
  )
}
