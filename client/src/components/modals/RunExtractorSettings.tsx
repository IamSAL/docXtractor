import { Controller, useFormContext } from 'react-hook-form'
import type { RunExtractorFormData } from '@/types/run-extractor'

export function RunExtractorSettings() {
    const { control, watch } = useFormContext<RunExtractorFormData>()
    const processingMode = watch('processingMode')

    return (
        <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Extraction Provider */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Extraction Provider</label>
                <div className="bg-gray-50 border-2 border-black p-4 rounded flex flex-col gap-3">
                    <Controller
                        name="extractionProvider"
                        control={control}
                        render={({ field }) => (
                            <>
                                <label className="cursor-pointer relative group">
                                    <input
                                        type="radio"
                                        className="peer sr-only"
                                        checked={field.value === 'doclo'}
                                        onChange={() => field.onChange('doclo')}
                                    />
                                    <div className="bg-white border-2 border-black p-3 pr-4 flex gap-3 shadow-sm peer-checked:shadow-hard-sm peer-checked:border-black transition-all">
                                        <div className={`absolute left-0 top-0 bottom-0 w-2 bg-primary border-r-2 border-black ${field.value === 'doclo' ? 'block' : 'hidden'}`}></div>
                                        <div className="pl-2 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">Doclo (Cloud LLM)</span>
                                                <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${field.value === 'doclo' ? 'bg-black' : ''}`}>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-tight">Use cloud-based LLM (Gemini) for extraction via external worker.</p>
                                        </div>
                                    </div>
                                </label>

                                <label className="cursor-pointer relative group">
                                    <input
                                        type="radio"
                                        className="peer sr-only"
                                        checked={field.value === 'freellm'}
                                        onChange={() => field.onChange('freellm')}
                                    />
                                    <div className={`bg-white border-2 border-black p-3 pr-4 flex gap-3 transition-all ${field.value === 'freellm' ? 'shadow-hard-sm' : 'opacity-60 hover:opacity-100'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-2 bg-primary border-r-2 border-black ${field.value === 'freellm' ? 'block' : 'hidden'}`}></div>
                                        <div className="pl-2 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">FreeLLM (Cloud AI)</span>
                                                <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${field.value === 'freellm' ? 'bg-black' : ''}`}>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-tight">Use FreeLLM gateway (Groq, Gemini, Mistral, Cerebras) for extraction.</p>
                                        </div>
                                    </div>
                                </label>

                                <label className="cursor-pointer relative group">
                                    <input
                                        type="radio"
                                        className="peer sr-only"
                                        checked={field.value === 'langextract'}
                                        onChange={() => field.onChange('langextract')}
                                    />
                                    <div className={`bg-white border-2 border-black border-dashed p-3 pr-4 flex gap-3 transition-all ${field.value === 'langextract' ? 'shadow-hard-sm opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-2 bg-primary border-r-2 border-black ${field.value === 'langextract' ? 'block' : 'hidden'}`}></div>
                                        <div className="pl-2 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">LangExtract (Few-Shot)</span>
                                                <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${field.value === 'langextract' ? 'bg-black' : ''}`}>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-tight">Use LangExtract with few-shot examples for structured extraction.</p>
                                        </div>
                                    </div>
                                </label>
                            </>
                        )}
                    />
                </div>
            </div>

            {/* Processing Mode */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Processing Mode</label>
                <div className="bg-gray-50 border-2 border-black p-4 rounded flex flex-col gap-3">
                    <Controller
                        name="processingMode"
                        control={control}
                        render={({ field }) => (
                            <>
                                <label className="cursor-pointer relative group">
                                    <input
                                        type="radio"
                                        className="peer sr-only"
                                        checked={field.value === 'unified'}
                                        onChange={() => field.onChange('unified')}
                                    />
                                    <div className="bg-white border-2 border-black p-3 pr-4 flex gap-3 shadow-sm peer-checked:shadow-hard-sm peer-checked:border-black transition-all">
                                        <div className={`absolute left-0 top-0 bottom-0 w-2 bg-primary border-r-2 border-black ${field.value === 'unified' ? 'block' : 'hidden'}`}></div>
                                        <div className="pl-2 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">Unified Extraction</span>
                                                <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${field.value === 'unified' ? 'bg-black' : ''}`}>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-tight">Merge all inputs into a single context window for cross-document reasoning.</p>
                                        </div>
                                    </div>
                                </label>

                                <label className="cursor-pointer relative group">
                                    <input
                                        type="radio"
                                        className="peer sr-only"
                                        checked={field.value === 'per_document'}
                                        onChange={() => field.onChange('per_document')}
                                    />
                                    <div className={`bg-white border-2 border-black border-dashed p-3 pr-4 flex gap-3 transition-all ${field.value === 'per_document' ? 'shadow-hard-sm opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-2 bg-primary border-r-2 border-black ${field.value === 'per_document' ? 'block' : 'hidden'}`}></div>
                                        <div className="pl-2 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">Batch Processing</span>
                                                <div className={`w-4 h-4 rounded-full border-2 border-black flex items-center justify-center ${field.value === 'per_document' ? 'bg-black' : ''}`}>
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-tight">Process each file independently. Faster for unrelated documents.</p>
                                        </div>
                                    </div>
                                </label>
                            </>
                        )}
                    />
                </div>
            </div>

            {/* Advanced Options */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Configuration</label>
                <div className="border-2 border-black rounded bg-white overflow-hidden">
                    <details className="group">
                        <summary className="flex cursor-pointer items-center justify-between gap-4 p-3 bg-white hover:bg-gray-50 transition-colors select-none list-none text-marker-none">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-black text-lg">tune</span>
                                <span className="text-black text-xs font-bold uppercase">Advanced Options</span>
                            </div>
                            <span className="material-symbols-outlined text-black transition-transform duration-300 group-open:rotate-180">expand_more</span>
                        </summary>
                        <div className="p-3 border-t-2 border-black bg-gray-50 flex flex-col gap-3">
                            <Controller
                                name="consensusVoting"
                                control={control}
                                render={({ field }) => (
                                    <label className="flex items-start gap-3 cursor-pointer group/option">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none border-2 border-black bg-white transition-all checked:bg-black"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                            <span className="material-symbols-outlined absolute opacity-0 peer-checked:opacity-100 text-white text-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">check</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-black uppercase">Consensus Voting</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">Requires 3+ LLM models agreement on extracted fields.</span>
                                        </div>
                                    </label>
                                )}
                            />

                            <Controller
                                name="citationTracking"
                                control={control}
                                render={({ field }) => (
                                    <label className="flex items-start gap-3 cursor-pointer group/option">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none border-2 border-black bg-white transition-all checked:bg-black"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                            <span className="material-symbols-outlined absolute opacity-0 peer-checked:opacity-100 text-white text-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">check</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-black uppercase">Citation Tracking</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">Enable page-level referencing and text segment highlighting.</span>
                                        </div>
                                    </label>
                                )}
                            />
                        </div>
                    </details>
                </div>
            </div>
        </div>
    )
}
