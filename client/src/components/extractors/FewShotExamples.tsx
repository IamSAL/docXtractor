import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/retroui/Button'
import { Textarea } from "@/components/retroui/Textarea"

export type SourceType = 'file' | 'url' | 'text';

export interface Source {
    id: string;
    type: SourceType;
    name: string;
    description: string;
    content?: string;
}

export interface FewShotExample {
    id: string;
    name: string;
    sources: Source[];
    output: string;
}

interface FewShotExamplesProps {
    examples: FewShotExample[];
    onChange: (examples: FewShotExample[]) => void;
}

export function FewShotExamples({ examples, onChange }: FewShotExamplesProps) {

    const updateExample = (id: string, updates: Partial<FewShotExample>) => {
        const newExamples = examples.map(ex =>
            ex.id === id ? { ...ex, ...updates } : ex
        );
        onChange(newExamples);
    };

    const addExample = () => {
        const newExample: FewShotExample = {
            id: crypto.randomUUID(),
            name: `Example ${examples.length + 1}`,
            sources: [],
            output: '{\n  \n}'
        };
        onChange([...examples, newExample]);
    };

    const removeExample = (id: string) => {
        onChange(examples.filter(ex => ex.id !== id));
    };

    const updateSource = (exampleId: string, sourceId: string, updates: Partial<Source>) => {
        const example = examples.find(e => e.id === exampleId);
        if (!example) return;
        updateExample(exampleId, {
            sources: example.sources.map(s => s.id === sourceId ? { ...s, ...updates } : s)
        });
    };

    const addSource = (exampleId: string, type: SourceType) => {
        const example = examples.find(e => e.id === exampleId);
        if (!example) return;

        if (type === 'file') {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const newSource: Source = {
                            id: crypto.randomUUID(),
                            type: 'file',
                            name: file.name,
                            description: `${(file.size / 1024).toFixed(1)} KB`,
                            content: reader.result as string
                        };
                        updateExample(exampleId, {
                            sources: [...example.sources, newSource]
                        });
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
            return;
        }

        let newSource: Source;
        if (type === 'url') {
            newSource = {
                id: crypto.randomUUID(),
                type: 'url',
                name: '',
                description: 'Enter URL',
                content: ''
            };
        } else {
            newSource = {
                id: crypto.randomUUID(),
                type: 'text',
                name: 'Text Snippet',
                description: 'Enter text',
                content: ''
            };
        }

        updateExample(exampleId, {
            sources: [...example.sources, newSource]
        });
    };

    const removeSource = (exampleId: string, sourceId: string) => {
        const example = examples.find(e => e.id === exampleId);
        if (!example) return;
        updateExample(exampleId, {
            sources: example.sources.filter(s => s.id !== sourceId)
        });
    }

    return (
        <div className="flex flex-col gap-3" id="few-shot-examples">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark">
                    Few-Shot Examples
                </label>
            </div>

            <Accordion type="multiple" defaultValue={examples.map(e => e.id)} className="flex flex-col gap-4">
                {examples.map((example) => (
                    <AccordionItem key={example.id} value={example.id} className="border-2 border-black rounded-lg overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between bg-white data-[state=open]:bg-yellow-50 border-b-2 border-black transition-colors">
                            <AccordionTrigger className="flex-1 px-6 py-4 font-bold hover:bg-yellow-50/50 hover:no-underline border-none data-[state=open]:border-none">
                                <span>{example.name}</span>
                            </AccordionTrigger>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeExample(example.id);
                                }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 mr-8 z-10"
                            >
                                Remove
                            </button>
                        </div>
                        <AccordionContent className="p-0 bg-white">
                            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Side: Sources */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-text-secondary-light uppercase">
                                            Input Sources
                                        </p>
                                        <div className="flex gap-2">
                                            {/* Add Source Buttons */}
                                            <button onClick={() => addSource(example.id, 'text')} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                                                + Text
                                            </button>
                                            <button onClick={() => addSource(example.id, 'url')} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                                                + URL
                                            </button>
                                            <button onClick={() => addSource(example.id, 'file')} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                                                + File
                                            </button>
                                        </div>
                                    </div>

                                    {example.sources.length === 0 ? (
                                        <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center text-gray-400 text-sm">
                                            No sources added. <br /> Add a file, URL, or text to provide context.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {example.sources.map((source) => (
                                                <div key={source.id} className="border-2 border-black rounded bg-white overflow-hidden shadow-neobrutalism-sm flex flex-col">
                                                    <div className="flex items-center justify-between p-3 border-b-2 last:border-b-0 border-black bg-white hover:bg-primary/5 transition-colors group">
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className={`shrink-0 w-9 h-9 rounded-sm border-2 border-black flex items-center justify-center ${source.type === 'file' ? 'bg-blue-50' :
                                                                source.type === 'url' ? 'bg-purple-50' : 'bg-yellow-50'
                                                                }`}>
                                                                <span className="material-symbols-outlined text-lg">
                                                                    {source.type === 'file' ? 'description' :
                                                                        source.type === 'url' ? 'link' : 'text_fields'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col w-full min-w-0">
                                                                {source.type === 'url' ? (
                                                                    <input
                                                                        type="text"
                                                                        value={source.name}
                                                                        onChange={(e) => updateSource(example.id, source.id, { name: e.target.value })}
                                                                        placeholder="https://example.com/doc.pdf"
                                                                        className="w-full bg-transparent border-none p-0 font-bold text-sm leading-tight text-black focus:ring-0 placeholder:text-gray-400"
                                                                    />
                                                                ) : (
                                                                    <span className="font-bold text-sm leading-tight text-black line-clamp-1 break-all">
                                                                        {source.name}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] uppercase font-bold text-gray-400">
                                                                    {source.description}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeSource(example.id, source.id)}
                                                            className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white rounded border border-transparent transition-all shrink-0 ml-2"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                    {source.type === 'text' && (
                                                        <div className="p-3 bg-gray-50 border-t-2 border-black">
                                                            <Textarea
                                                                value={source.content}
                                                                onChange={(e) => updateSource(example.id, source.id, { content: e.target.value })}
                                                                placeholder="Paste context text here..."
                                                                className="text-xs min-h-[100px] bg-white border-2 border-black focus:border-primary"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: JSON Editor */}
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-bold text-text-secondary-light uppercase">
                                        Target JSON Output
                                    </p>
                                    <Textarea
                                        value={example.output}
                                        onChange={(e) => updateExample(example.id, { output: e.target.value })}
                                        className="font-mono text-xs min-h-[160px] max-h-[300px] h-full bg-background-light xdark:bg-background-dark border-2 border-border-light focus:border-black"
                                        placeholder="{}"
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <div className="p-4 bg-background-light/30 xdark:bg-background-dark/30 border-2 border-dashed border-border-light xdark:border-border-dark rounded-lg flex justify-center">
                <Button
                    variant="ghost"
                    onClick={addExample}
                    className="text-text-secondary-light hover:text-primary hover:bg-transparent"
                >
                    <span className="material-symbols-outlined mr-2">add_circle</span>
                    Add New Example
                </Button>
            </div>
        </div>
    )
}
