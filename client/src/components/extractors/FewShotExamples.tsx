import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/retroui/Button";
import { Textarea } from "@/components/retroui/Textarea";
import { useFormContext, useFieldArray } from "react-hook-form";
import type { ExtractorFormData } from "@/types/extractor";
import { cn } from "@/lib/utils";

export type SourceType = "file" | "url" | "text";

export interface Source {
  id: string;
  type: SourceType;
  name: string;
  description: string;
  content: string;
  storageKey?: string;
  parsedContent?: string;
}

export interface FewShotExample {
  id: string;
  name: string;
  sources: Source[];
  output: string;
}

interface FewShotExamplesProps {
  onUploadFile?: (file: File) => Promise<{ url: string; id: string; storageKey?: string }>;
}

export function FewShotExamples({ onUploadFile }: FewShotExamplesProps) {
  const { control } = useFormContext<ExtractorFormData>();
  const {
    fields: examples,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "fewShotExamples",
  });

  const addExample = () => {
    append({
      id: crypto.randomUUID(),
      name: `Example ${examples.length + 1}`,
      sources: [],
      output: "{\n  \n}",
    });
  };

  return (
    <div className="flex flex-col gap-4" id="few-shot-examples">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text-main-light xdark:text-text-secondary-dark font-head uppercase tracking-wider">
          Few-Shot Examples
        </label>
        <div className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold border border-yellow-200">
          PROMPT ENGINEERING
        </div>
      </div>

      {examples.length === 0 ? (
        <div className="border-4 border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50/50 justify-center flex flex-col">
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-hard-sm">
            <span className="material-symbols-outlined text-3xl text-gray-400">
              psychology
            </span>
          </div>
          <h4 className="text-lg font-bold text-black mb-1">
            No examples added yet
          </h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
            Adding examples helps the AI understand the extraction format
            better.
          </p>
          <Button
            type="button"
            onClick={addExample}
            className="bg-primary hover:bg-primary-hover shadow-hard  m-auto"
          >
            <span className="material-symbols-outlined mr-2">add_circle</span>
            CREATE FIRST EXAMPLE
          </Button>
        </div>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={examples.map((e) => e.id)}
          className="flex flex-col gap-6"
        >
          {examples.map((example, index) => (
            <FewShotExampleItem
              key={example.id}
              example={example}
              index={index}
              onRemove={() => remove(index)}
              onUploadFile={onUploadFile}
            />
          ))}
        </Accordion>
      )}

      {examples.length > 0 && (
        <div className="flex justify-center mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={addExample}
            className="text-primary hover:bg-primary/5 font-bold border-2 border-dashed border-primary/30 w-full py-4 text-sm uppercase tracking-widest"
          >
            <span className="material-symbols-outlined mr-2">add_circle</span>
            Add Another Example
          </Button>
        </div>
      )}
    </div>
  );
}

interface FewShotExampleItemProps {
  example: any;
  index: number;
  onRemove: () => void;
  onUploadFile?: (file: File) => Promise<{ url: string; id: string; storageKey?: string }>;
}

function FewShotExampleItem({
  example,
  index,
  onRemove,
  onUploadFile,
}: FewShotExampleItemProps) {
  const { control, register, getValues } = useFormContext<ExtractorFormData>();
  const {
    fields,
    append: appendSource,
    remove: removeSource,
    update: updateSource,
  } = useFieldArray({
    control,
    name: `fewShotExamples.${index}.sources` as any,
  });

  const sources = fields as unknown as Source[];

  const addFileSource = async (file: File) => {
    const id = crypto.randomUUID();
    const newSource = {
      id,
      type: "file" as const,
      name: file.name,
      description: "Uploading...",
      content: "",
    };

    appendSource(newSource);

    try {
      if (onUploadFile) {
        const result = await onUploadFile(file);
        const currentSources = getValues(
          `fewShotExamples.${index}.sources` as any,
        );
        const sourceIndex = currentSources.findIndex((s: any) => s.id === id);
        if (sourceIndex !== -1) {
          updateSource(sourceIndex, {
            ...newSource,
            content: result.url,
            storageKey: result.storageKey,
            description: `${(file.size / 1024).toFixed(1)} KB`,
          });
        }
      }
    } catch (error) {
      console.error("File upload error:", error);
      const currentSources = getValues(
        `fewShotExamples.${index}.sources` as any,
      );
      const sourceIndex = currentSources.findIndex((s: any) => s.id === id);
      if (sourceIndex !== -1) {
        updateSource(sourceIndex, {
          ...newSource,
          description: "Upload failed",
        });
      }
    }
  };

  const addUrlSource = () => {
    appendSource({
      id: crypto.randomUUID(),
      type: "url",
      name: "External URL",
      description: "Enter document/webpage URL",
      content: "",
    });
  };

  const addTextSource = () => {
    appendSource({
      id: crypto.randomUUID(),
      type: "text",
      name: "Text Snippet",
      description: "Enter text",
      content: "",
    });
  };

  return (
    <AccordionItem
      value={example.id}
      className="border-4 border-black rounded-xl overflow-hidden bg-white shadow-hard transition-all hover:-translate-y-1 hover:shadow-hard-lg"
    >
      <div className="flex items-center justify-between border-b-4 border-black">
        <AccordionTrigger className="flex-1 px-6 py-4 font-black text-lg hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="bg-black text-white px-2 py-0.5 rounded text-xs font-mono">
              #{index + 1}
            </span>
            {example.name}
          </div>
        </AccordionTrigger>
        <div
          className="px-6 border-l-4 border-black h-full flex items-center bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
          onClick={onRemove}
        >
          <span className="material-symbols-outlined text-red-600 font-bold">
            delete
          </span>
        </div>
      </div>

      <AccordionContent className="p-0">
        <div className="p-6 flex flex-col gap-8 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side: Sources */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    input
                  </span>
                  Input Sources
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addTextSource}
                    className="text-[10px] font-bold uppercase tracking-wider bg-white border-2 border-black px-2 py-1 rounded hover:bg-yellow-50 active:translate-y-0.5 transition-all outline-none"
                  >
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={addUrlSource}
                    className="text-[10px] font-bold uppercase tracking-wider bg-white border-2 border-black px-2 py-1 rounded hover:bg-blue-50 active:translate-y-0.5 transition-all outline-none"
                  >
                    + URL
                  </button>
                </div>
              </div>

              {/* Source Dropzone-style area */}
              <div className="relative group cursor-pointer mb-2">
                <input
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) addFileSource(file);
                  }}
                />
                <div className="flex flex-row items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-all group-hover:border-black group-hover:bg-primary/5">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-hard-sm">
                    <span className="material-symbols-outlined text-xl text-black font-bold">
                      upload_file
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-black text-xs font-bold uppercase">
                      Add reference file
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Click or drag to upload benchmark
                    </p>
                  </div>
                </div>
              </div>

              {sources.length === 0 ? (
                <div className="border-2 border-black border-dashed rounded-lg p-6 text-center bg-gray-50/30 text-gray-400 text-xs font-medium">
                  No sources added. This example will be based <br /> only on
                  the Target Output.
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {sources.map((source, sIndex) => (
                    <div
                      key={source.id}
                      className="border-2 border-black rounded bg-white overflow-hidden shadow-hard-sm flex flex-col"
                    >
                      <div className="flex items-center justify-between p-3 border-b-2 border-black bg-white group/source">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div
                            className={cn(
                              "w-8 h-8 border-2 border-black flex items-center justify-center shrink-0 rounded shadow-hard-sm",
                              source.type === "file"
                                ? "bg-red-50"
                                : source.type === "url"
                                  ? "bg-blue-50"
                                  : "bg-yellow-50",
                            )}
                          >
                            <span className="material-symbols-outlined text-md font-bold">
                              {source.type === "file"
                                ? "description"
                                : source.type === "url"
                                  ? "link"
                                  : "text_fields"}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              {source.type === "url" ? (
                                <input
                                  {...register(
                                    `fewShotExamples.${index}.sources.${sIndex}.content` as any,
                                  )}
                                  placeholder="https://example.com/doc.pdf"
                                  className="text-sm font-bold bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-gray-300"
                                />
                              ) : source.type === "text" ? (
                                <span className="text-xs font-bold uppercase text-yellow-600">
                                  Text Provider
                                </span>
                              ) : (
                                <span className="text-sm font-bold truncate">
                                  {source.name}
                                </span>
                              )}
                              {(source.type === "file" || source.type === "url") && (
                                <span
                                  className={cn(
                                    "text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0",
                                    source.parsedContent
                                      ? "bg-green-50 text-green-700 border-green-300"
                                      : "bg-yellow-50 text-yellow-700 border-yellow-300",
                                  )}
                                >
                                  {source.parsedContent ? "✓ PARSED" : "⏳ QUEUED"}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] uppercase font-black text-gray-400">
                              {source.description}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSource(sIndex)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white rounded border-2 border-transparent hover:border-black transition-all shrink-0 ml-2"
                        >
                          <span className="material-symbols-outlined text-lg font-bold">
                            close
                          </span>
                        </button>
                      </div>

                      {/* Source Content Preview/Editor */}
                      {source.type === "text" && (
                        <div className="p-3 bg-yellow-50/30">
                          <Textarea
                            {...register(
                              `fewShotExamples.${index}.sources.${sIndex}.content` as any,
                            )}
                            placeholder="Paste reference text here..."
                            className="text-xs min-h-[100px] bg-white border-2 border-black focus:border-primary shadow-hard-sm"
                          />
                        </div>
                      )}

                      {source.type === "file" && source.content && (
                        <div className="p-3 bg-gray-50 border-t-2 border-black flex justify-center">
                          {source.content.match(
                            /\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff|avif)/i,
                          ) || source.content.startsWith("data:image") ? (
                            <img
                              src={source.content}
                              alt={source.name}
                              className="max-h-32 rounded border-2 border-black object-contain bg-white shadow-hard-sm"
                            />
                          ) : (
                            <div className="flex items-center gap-3 py-2">
                              <span className="material-symbols-outlined text-red-500 text-3xl font-bold">
                                picture_as_pdf
                              </span>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-gray-700">
                                  PDF Document
                                </span>
                                <a
                                  href={source.content}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary font-bold hover:underline break-all uppercase"
                                >
                                  View File
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Target Output */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sm">
                  output
                </span>
                Expected JSON Output
              </label>
              <div className="flex-1 relative">
                <Textarea
                  {...register(`fewShotExamples.${index}.output` as any)}
                  className="font-mono text-xs min-h-[250px] lg:h-full bg-gray-900 text-green-400 border-4 border-black p-4 focus:ring-0 focus:border-primary shadow-hard-lg"
                  placeholder="{}"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[9px] font-mono text-gray-400 uppercase font-black">
                  JSON
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium italic">
                Tip: Provide the exact JSON structure you expect for the given
                input.
              </p>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
