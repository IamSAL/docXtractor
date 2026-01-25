import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/extraction')({
  component: RouteComponent,
})

function RouteComponent() {
  return (<>
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-24">
      <div className="xl:col-span-8 flex flex-col gap-6">
        <div className="bg-surface-light xdark:bg-surface-dark border-2 border-border-light xdark:border-border-dark rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg text-text-main xdark:text-primary">
              <span className="material-symbols-outlined">how_to_vote</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main xdark:text-white leading-tight">
                Consensus Voting
              </h2>
              <p className="text-xs text-text-sub xdark:text-gray-400">
                Establish truth through multi-model agreement.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background-light xdark:bg-background-dark rounded-lg border border-border-light xdark:border-border-dark">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-text-main xdark:text-white">
                  Enable Consensus Mode
                </span>
                <span className="text-xs text-text-sub">
                  Requires 2+ active models
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input

                  className="sr-only peer"
                  type="checkbox"
                  defaultValue=""
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer xdark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all xdark:border-gray-600 peer-checked:bg-primary border-2 border-text-main" />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-main xdark:text-gray-300">
                  Confidence Threshold
                </label>
                <div className="relative">
                  <input
                    className="inset-input w-full bg-[#f3f4f6] xdark:bg-[#1a190e] border border-border-light xdark:border-border-dark rounded-lg px-4 py-3 text-text-main xdark:text-white font-mono text-sm focus:border-primary focus:ring-0"
                    placeholder="0-100"
                    type="number"
                    defaultValue={85}
                  />
                  <span className="absolute right-4 top-3 text-text-sub text-sm font-mono">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-text-sub flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    info
                  </span>
                  Recommended: &gt;80% for finance docs
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-text-main xdark:text-gray-300">
                  Conflict Resolution
                </label>
                <div className="relative">
                  <select className="inset-input w-full appearance-none bg-[#f3f4f6] xdark:bg-[#1a190e] border border-border-light xdark:border-border-dark rounded-lg px-4 py-3 text-text-main xdark:text-white font-medium text-sm focus:border-primary focus:ring-0">
                    <option>Majority Vote</option>
                    <option>Highest Confidence</option>
                    <option>Human Review (Flag)</option>
                    <option>Conservative Fallback</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-text-sub">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-light xdark:bg-surface-dark border-2 border-border-light xdark:border-border-dark rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg text-text-main xdark:text-primary">
              <span className="material-symbols-outlined">link</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main xdark:text-white leading-tight">
                Citation Tracking
              </h2>
              <p className="text-xs text-text-sub xdark:text-gray-400">
                Embed source metadata into extracted JSON.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-text-main xdark:text-white">
                Enable Source Linking
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" defaultValue="" />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer xdark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all xdark:border-gray-600 peer-checked:bg-primary border-2 border-text-main" />
              </label>
            </div>
            <div className="p-5 bg-background-light xdark:bg-background-dark rounded-lg border border-dashed border-text-sub/40">
              <label className="text-xs font-bold uppercase tracking-wider text-text-sub mb-3 block">
                Included Metadata
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input

                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-text-main xdark:border-gray-500 checked:bg-primary checked:border-text-main transition-all"
                      type="checkbox"
                    />
                    <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text-main text-[16px] opacity-0 peer-checked:opacity-100 font-bold">
                      check
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text-main xdark:text-white group-hover:text-primary-dark transition-colors">
                    PDF Page Number
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input

                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-text-main xdark:border-gray-500 checked:bg-primary checked:border-text-main transition-all"
                      type="checkbox"
                    />
                    <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text-main text-[16px] opacity-0 peer-checked:opacity-100 font-bold">
                      check
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text-main xdark:text-white group-hover:text-primary-dark transition-colors">
                    Bounding Box Coordinates
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-text-main xdark:border-gray-500 checked:bg-primary checked:border-text-main transition-all"
                      type="checkbox"
                    />
                    <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text-main text-[16px] opacity-0 peer-checked:opacity-100 font-bold">
                      check
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text-main xdark:text-white group-hover:text-primary-dark transition-colors">
                    Paragraph ID Hash
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-light xdark:bg-surface-dark border-2 border-border-light xdark:border-border-dark rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg text-text-main xdark:text-primary">
              <span className="material-symbols-outlined">neurology</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main xdark:text-white leading-tight">
                Model Parameters
              </h2>
              <p className="text-xs text-text-sub xdark:text-gray-400">
                Low-level LLM configuration.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main xdark:text-gray-300">
                Context Window
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-text-sub material-symbols-outlined text-[18px]">
                  memory
                </span>
                <input
                  className="inset-input w-full bg-[#f3f4f6] xdark:bg-[#1a190e] border border-border-light xdark:border-border-dark rounded-lg pl-10 pr-4 py-3 text-text-main xdark:text-white font-mono text-sm focus:border-primary focus:ring-0"
                  type="text"
                  defaultValue="128k"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main xdark:text-gray-300">
                Default Model
              </label>
              <div className="relative">
                <select className="inset-input w-full appearance-none bg-[#f3f4f6] xdark:bg-[#1a190e] border border-border-light xdark:border-border-dark rounded-lg px-4 py-3 text-text-main xdark:text-white font-medium text-sm focus:border-primary focus:ring-0">
                  <option>GPT-4o (High Accuracy)</option>
                  <option>Claude 3.5 Sonnet (Balanced)</option>
                  <option>Llama 3 70B (Local/Private)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-text-sub">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="xl:col-span-4 flex flex-col gap-6">
        <div className="sticky top-24">
          <div className="bg-gray-800 text-white xdark:bg-white xdark:text-text-main rounded-xl p-6 shadow-neubrutal mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Extraction Health</h3>
              <span className="material-symbols-outlined">ecg_heart</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono opacity-80 mb-1">
                  <span>Success Rate</span>
                  <span>98.2%</span>
                </div>
                <div className="w-full bg-white/20 xdark:bg-black/10 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: "98%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono opacity-80 mb-1">
                  <span>Token Usage</span>
                  <span>1.2M / 2M</span>
                </div>
                <div className="w-full bg-white/20 xdark:bg-black/10 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 xdark:border-black/10">
              <p className="text-xs opacity-70">Last optimized: 2 mins ago</p>
            </div>
          </div>
          <div className="bg-[#f0f9ff] xdark:bg-blue-900/20 border border-blue-200 xdark:border-blue-800 rounded-xl p-5">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-blue-600 xdark:text-blue-400">
                lightbulb
              </span>
              <div>
                <h4 className="font-bold text-sm text-blue-900 xdark:text-blue-100">
                  Did you know?
                </h4>
                <p className="text-xs text-blue-800 xdark:text-blue-200 mt-1 leading-relaxed">
                  Increasing the confidence threshold above 90% may result in more
                  documents being flagged for manual review but significantly
                  reduces hallucination risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </>)
}
