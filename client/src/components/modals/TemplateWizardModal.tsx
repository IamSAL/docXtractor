import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  generateExtractor,
  parsePreviewFile,
  previewExtraction,
} from "@/api/generate";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import {
  type FieldRow,
  type FieldType,
  fieldsToSchema,
  normalizeGeneratedSchema,
  schemaToFields,
} from "@/lib/schema-converter";
import { AXIOS_INSTANCE } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { defaultExtractorFormValues } from "@/types/extractor";
import type { Extractor } from "@/api/models";

const CATEGORY_STYLE: Record<
  string,
  { icon: string; color: string; iconColor: string }
> = {
  Financial: {
    icon: "receipt_long",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  HR: {
    icon: "person_search",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  Legal: {
    icon: "home_work",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
  },
  Medical: {
    icon: "medication",
    color: "bg-red-50",
    iconColor: "text-red-600",
  },
  Logistics: {
    icon: "shopping_cart",
    color: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  Identity: {
    icon: "badge",
    color: "bg-slate-100",
    iconColor: "text-slate-800",
  },
  General: {
    icon: "data_object",
    color: "bg-gray-100",
    iconColor: "text-gray-600",
  },
};

function getTemplateStyle(extractor: Extractor) {
  const cat = extractor.category ?? "General";
  return CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.General;
}

export const TemplateWizardModal = NiceModal.create(() => {
  const modal = useModal();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "detail" | "ai-generate">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<Extractor | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Templates");
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);
  const [aiGeneratedData, setAiGeneratedData] = useState<{
    name: string;
    description: string;
    schema: Record<string, unknown>;
    systemPrompt: string;
  } | null>(null);
  const [fieldRows, setFieldRows] = useState<FieldRow[]>([]);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [previewResult, setPreviewResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [templates, setTemplates] = useState<Extractor[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    AXIOS_INSTANCE.get<Extractor[]>("/extractors?scope=instance")
      .then((res) => setTemplates(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSampleFile(file);
    setParsedText("");
    setPreviewResult(null);
    setIsParsing(true);
    try {
      const text = await parsePreviewFile(file);
      setParsedText(text);
      toast.success("File parsed — ready for preview");
    } catch {
      toast.error("Failed to parse file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;
    setAiGenerating(true);
    setPreviewResult(null);
    try {
      const result = await generateExtractor(
        aiDescription.trim(),
        parsedText || undefined,
      );
      const normalized = normalizeGeneratedSchema(
        result.schema as Record<string, unknown>,
      );
      const normalized2 = { ...result, schema: normalized };
      setAiGeneratedData(normalized2);
      setFieldRows(schemaToFields(normalized));
      toast.success("Extractor generated — review your fields");
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error("Failed to generate extractor", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "AI generation failed — please try again",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleRunPreview = async () => {
    if (!aiGeneratedData || !parsedText.trim()) return;
    setIsPreviewing(true);
    try {
      const schema = fieldsToSchema(fieldRows, aiGeneratedData.schema);
      const res = await previewExtraction({
        schema,
        systemPrompt: aiGeneratedData.systemPrompt,
        sampleText: parsedText,
      });
      setPreviewResult(res.extractionResult);
      if (res.error) toast.error(res.error);
    } catch {
      toast.error("Preview failed");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCreateExtractor = () => {
    if (!aiGeneratedData) return;
    const finalSchema = fieldsToSchema(fieldRows, aiGeneratedData.schema);
    navigate({
      to: "/extractors/new",
      state: {
        initialData: {
          ...defaultExtractorFormValues,
          name: aiGeneratedData.name,
          description: aiGeneratedData.description,
          schema: finalSchema,
          systemPrompt: aiGeneratedData.systemPrompt,
        },
      } as any,
    });
    modal.hide();
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    navigate({
      to: "/extractors/new",
      state: {
        initialData: {
          ...defaultExtractorFormValues,
          name: selectedTemplate.name,
          description: selectedTemplate.description ?? "",
          schema: selectedTemplate.schema,
          systemPrompt: selectedTemplate.systemPrompt,
          defaultModel: selectedTemplate.defaultModel,
          fewShotExamples: selectedTemplate.fewShotExamples ?? [],
          variants: selectedTemplate.variants ?? [],
        },
      } as any,
    });
    modal.hide();
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All Templates" ||
      (t.category ?? "General") === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <Dialog.Content
        className="max-w-5xl p-0 border-2 border-black bg-white shadow-hard h-[85vh] max-h-[900px] flex flex-col overflow-hidden"
        size="auto"
      >
        {view === "list" ? (
          <header className="border-b-2 border-black bg-white p-6 z-10 shrink-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-3xl">
                    token
                  </span>
                  Create Extractor
                </h1>
                <p className="text-sm text-gray-600 mt-1 font-medium">
                  Initialize extractor from a template.
                </p>
              </div>
              <button
                onClick={() => modal.hide()}
                className="text-gray-500 hover:text-black transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="w-full bg-gray-100 border-2 border-black p-1 flex relative">
              <div className="flex-1 bg-primary border-r-2 border-black flex items-center justify-center py-2 px-4 gap-2">
                <span className="bg-black text-primary text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  1
                </span>
                <span className="text-black font-bold text-sm uppercase">
                  Select Template
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center py-2 px-4 gap-2 border-r-2 border-black bg-white">
                <span className="bg-gray-300 text-gray-500 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  2
                </span>
                <span className="text-gray-400 font-medium text-sm uppercase">
                  Configure
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center py-2 px-4 gap-2 bg-white">
                <span className="bg-gray-300 text-gray-500 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  3
                </span>
                <span className="text-gray-400 font-medium text-sm uppercase">
                  Launch
                </span>
              </div>
            </div>
          </header>
        ) : (
          <header className="border-b-2 border-black bg-white p-5 shrink-0 flex justify-between items-center z-20 relative">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("list")}
                className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-gray-100 mr-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">
                    token
                  </span>
                  DocXTractor Wizard
                </h1>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  TEMPLATE: {selectedTemplate?.name.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => modal.hide()}
                className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-primary hover:text-black transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </header>
        )}

        <div className="flex flex-1 overflow-hidden min-h-0 bg-white relative">
          {view === "list" ? (
            <>
              <aside className="w-64 bg-gray-50 border-r-2 border-black p-4 hidden md:flex flex-col gap-6 overflow-y-auto min-h-0">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {[
                      "All Templates",
                      "Financial",
                      "Medical",
                      "Legal",
                      "Identity",
                      "HR",
                      "Logistics",
                    ].map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={activeCategory === cat}
                          onChange={() => setActiveCategory(cat)}
                          className="text-black focus:ring-black border-2 border-black rounded-none"
                        />
                        <span className="text-sm font-medium group-hover:text-black">
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </aside>
              <section className="flex-1 flex flex-col min-h-0 bg-gray-50/50 overflow-hidden">
                <div className="p-4 border-b-2 border-black bg-white sticky top-0 z-20 shrink-0">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      search
                    </span>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-black focus:ring-0 focus:border-primary font-mono text-sm"
                      placeholder="Search templates (e.g. Invoice, Receipt)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {/* AI Generate Card */}
                  <div
                    onClick={() => {
                      setView("ai-generate");
                      setTimeout(() => aiInputRef.current?.focus(), 150);
                    }}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-400 p-4 shadow-hard-sm hover:-translate-y-0.5 transition-transform duration-200 group cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 bg-purple-100 border-2 border-purple-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-purple-600">
                          auto_awesome
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-black">
                            Generate with AI
                          </h3>
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-purple-400 bg-purple-100 text-purple-700">
                            AI
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Describe your extraction use case and AI will generate
                          a complete extractor configuration.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-mono text-purple-500">
                          <span>Schema</span>
                          <span className="w-1 h-1 bg-purple-300 rounded-full" />
                          <span>System Prompt</span>
                          <span className="w-1 h-1 bg-purple-300 rounded-full" />
                          <span>Auto-configured</span>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-purple-400 group-hover:text-purple-600 transition-colors">
                      chevron_right
                    </span>
                  </div>

                  {filteredTemplates.map((template) => {
                    const style = getTemplateStyle(template);
                    return (
                      <div
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setView("detail");
                        }}
                        className="bg-white border-2 border-black p-4 shadow-hard-sm hover:-translate-y-0.5 transition-transform duration-200 group cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex gap-4 items-start">
                          <div
                            className={`w-12 h-12 ${style.color} border-2 border-black flex items-center justify-center shrink-0`}
                          >
                            <span
                              className={`material-symbols-outlined ${style.iconColor}`}
                            >
                              {template.icon ?? style.icon}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-black">
                                {template.name}
                              </h3>
                              {template.category && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-black bg-gray-200 text-gray-700">
                                  {template.category}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs font-mono text-gray-500 ">
                              {(template.tags ?? [])
                                .slice(0, 5)
                                .map((tag, i) => (
                                  <span
                                    key={i}
                                    className="flex items-center gap-1 "
                                  >
                                    {i > 0 && (
                                      <span className="w-1 h-1 bg-gray-400 rounded-full mx-1" />
                                    )}
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-gray-400 group-hover:text-black transition-colors">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredTemplates.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                      <p>No templates found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : view === "ai-generate" ? (
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <div className="w-[420px] shrink-0 border-r-2 border-black flex flex-col bg-cream overflow-y-auto">
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-black">
                    <div className="w-10 h-10 bg-purple-100 border-2 border-purple-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-purple-600">
                        auto_awesome
                      </span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Generate with AI</h2>
                      <p className="text-[10px] text-gray-500 font-mono">
                        AI-POWERED GENERATION
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        What do you want to extract?
                      </span>
                      <textarea
                        ref={aiInputRef}
                        value={aiDescription}
                        onChange={(e) => setAiDescription(e.target.value)}
                        placeholder="e.g. Extract vendor name, invoice date, line items and totals from supplier invoices"
                        className="w-full border-2 border-black p-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-h-[100px]"
                        disabled={aiGenerating}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleAiGenerate();
                          }
                        }}
                      />
                    </label>
                    <Button
                      onClick={handleAiGenerate}
                      disabled={!aiDescription.trim() || aiGenerating}
                      className="w-full bg-purple-100 border-2 border-purple-400 text-purple-800 font-bold text-sm uppercase hover:bg-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {aiGenerating ? "hourglass_empty" : "auto_awesome"}
                      </span>
                      {aiGenerating ? "Generating..." : "Generate Fields"}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Sample Document{" "}
                      <span className="text-gray-400 normal-case font-normal">
                        (optional — improves field inference &amp; enables
                        preview)
                      </span>
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-400 hover:border-blue-400 bg-white p-4 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {isParsing ? (
                        <>
                          <span className="material-symbols-outlined text-3xl animate-spin">
                            progress_activity
                          </span>
                          <span className="text-xs font-medium">
                            Parsing...
                          </span>
                        </>
                      ) : sampleFile ? (
                        <>
                          <span className="material-symbols-outlined text-3xl text-green-600">
                            check_circle
                          </span>
                          <span className="text-xs font-medium text-green-700 text-center break-all">
                            {sampleFile.name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Click to replace
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-3xl">
                            upload_file
                          </span>
                          <span className="text-xs font-medium">
                            Click to upload a sample document
                          </span>
                          <span className="text-[10px] text-gray-400">
                            PDF, DOCX, TXT, or image
                          </span>
                        </>
                      )}
                    </button>
                    <Button
                      onClick={handleRunPreview}
                      disabled={
                        !aiGeneratedData || !parsedText.trim() || isPreviewing
                      }
                      className="w-full border-2 border-black bg-white font-bold text-sm uppercase hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none shadow-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isPreviewing ? "hourglass_empty" : "play_arrow"}
                      </span>
                      {isPreviewing ? "Running Preview..." : "Run Preview"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
                {!aiGeneratedData ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-8">
                    <span className="material-symbols-outlined text-5xl">
                      table_rows
                    </span>
                    <p className="text-sm font-medium text-center">
                      Your fields will appear here after you generate.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-b-2 border-black px-4 py-3 bg-gray-50 shrink-0 flex items-center justify-between">
                      <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">
                          list
                        </span>
                        Your Fields
                        <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {fieldRows.length}
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setFieldRows((prev) => [
                            ...prev,
                            {
                              name: "new_field",
                              type: "string",
                              required: false,
                              description: "",
                            },
                          ])
                        }
                        className="flex items-center gap-1 text-xs font-bold uppercase border-2 border-black px-2 py-1 hover:bg-gray-100"
                      >
                        <span className="material-symbols-outlined text-sm">
                          add
                        </span>
                        Add Field
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                      <div className="grid grid-cols-[1fr_100px_60px_auto] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <span>Field Name</span>
                        <span>Type</span>
                        <span>Required</span>
                        <span />
                      </div>
                      {fieldRows.map((field, idx) => (
                        <div
                          key={`${field.name}-${idx}`}
                          className="grid grid-cols-[1fr_100px_60px_auto] gap-1 px-3 py-2 border-b border-gray-100 items-center hover:bg-gray-50"
                        >
                          <div className="flex flex-col gap-1">
                            <input
                              value={field.name}
                              onChange={(e) =>
                                setFieldRows((prev) =>
                                  prev.map((f, i) =>
                                    i === idx
                                      ? { ...f, name: e.target.value }
                                      : f,
                                  ),
                                )
                              }
                              className="border border-black px-2 py-1 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-black w-full"
                            />
                            <input
                              value={field.description}
                              onChange={(e) =>
                                setFieldRows((prev) =>
                                  prev.map((f, i) =>
                                    i === idx
                                      ? { ...f, description: e.target.value }
                                      : f,
                                  ),
                                )
                              }
                              placeholder="description..."
                              className="border border-gray-300 px-2 py-1 text-[10px] text-gray-500 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 w-full"
                            />
                            {previewResult && field.name in previewResult && (
                              <span className="text-[10px] text-blue-600 font-mono px-1 truncate">
                                → {String(previewResult[field.name] ?? "")}
                              </span>
                            )}
                          </div>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              setFieldRows((prev) =>
                                prev.map((f, i) =>
                                  i === idx
                                    ? {
                                        ...f,
                                        type: e.target.value as FieldType,
                                      }
                                    : f,
                                ),
                              )
                            }
                            className="border border-black px-1 py-1 text-xs bg-white focus:outline-none h-7"
                          >
                            {[
                              "string",
                              "number",
                              "integer",
                              "boolean",
                              "array",
                              "object",
                            ].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                setFieldRows((prev) =>
                                  prev.map((f, i) =>
                                    i === idx
                                      ? { ...f, required: e.target.checked }
                                      : f,
                                  ),
                                )
                              }
                              className="w-4 h-4 border-2 border-black rounded-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFieldRows((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="p-1 hover:text-red-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Detail View */
            <div className="flex-1 overflow-y-auto p-6 bg-cream min-h-0">
              {selectedTemplate &&
                (() => {
                  const style = getTemplateStyle(selectedTemplate);
                  return (
                    <div className="grid grid-cols-12 gap-6 min-h-0">
                      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white border-2 border-black p-5 shadow-hard-sm flex flex-col gap-4 relative overflow-hidden shrink-0">
                          <div className="flex items-start justify-between z-10">
                            <div
                              className={`w-14 h-14 ${style.color} border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                            >
                              <span
                                className={`material-symbols-outlined text-2xl ${style.iconColor}`}
                              >
                                {selectedTemplate.icon ?? style.icon}
                              </span>
                            </div>
                            <span className="bg-black text-white text-xs font-bold px-2 py-1 uppercase">
                              {selectedTemplate.category ?? "General"}
                            </span>
                          </div>
                          <div className="z-10">
                            <h2 className="text-2xl font-bold leading-tight mb-2">
                              {selectedTemplate.name}
                            </h2>
                            <p className="text-sm text-gray-600">
                              {selectedTemplate.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(selectedTemplate.tags ?? []).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-100 border border-black text-[10px] font-bold uppercase"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#282c34] border-2 border-black p-3 text-xs font-mono text-gray-300 overflow-hidden relative shadow-hard-sm shrink-0">
                          <div className="absolute top-0 right-0 bg-primary text-black px-2 py-0.5 text-[10px] font-bold border-l-2 border-b-2 border-black">
                            JSON SCHEMA
                          </div>
                          <pre className="overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-gray-600">
                            {JSON.stringify(selectedTemplate.schema, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 min-h-0">
                        <div className="bg-white border-2 border-black flex-1 flex flex-col shadow-hard-sm min-h-[500px]">
                          <div className="border-b-2 border-black p-3 bg-gray-50 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">
                                visibility
                              </span>
                              Example Output
                            </h3>
                          </div>
                          <div className="p-4 bg-gray-50 flex-1 overflow-auto min-h-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
                              <div className="border-2 border-dashed border-gray-300 p-4 bg-white flex flex-col items-center justify-center text-gray-400 text-sm font-medium min-h-[300px]">
                                <span className="material-symbols-outlined text-4xl mb-2">
                                  description
                                </span>
                                [ Document Preview ]
                              </div>
                              <div className="bg-white border-2 border-black p-4 font-mono text-xs overflow-auto min-h-[300px]">
                                <p className="text-gray-500 mb-2">
                                  // Extracted Data
                                </p>
                                <pre>
                                  {JSON.stringify(
                                    selectedTemplate.fewShotExamples?.[0]
                                      ?.output
                                      ? JSON.parse(
                                          selectedTemplate.fewShotExamples[0]
                                            .output,
                                        )
                                      : {},
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}
        </div>

        <footer
          className={cn(
            "border-t-2 border-black bg-white flex justify-between items-center z-10 shrink-0",
            { "p-4": view !== "list" },
          )}
        >
          {view === "list" ? (
            <div className="bg-black text-white p-3 flex justify-between items-center px-6 shrink-0 z-20 w-full">
              <span className="text-xs font-medium text-gray-400">
                No matching templates?
              </span>
              <button
                onClick={() => {
                  navigate({ to: "/extractors/new" });
                  modal.hide();
                }}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors group"
              >
                Create your own
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => setView("list")}
                className="border-black font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to List
              </Button>
              <div className="text-xs text-gray-400 font-mono hidden sm:block">
                DocXTractor v3.0.1-beta
              </div>
              {view === "ai-generate" ? (
                <Button
                  onClick={handleCreateExtractor}
                  disabled={!aiGeneratedData || fieldRows.length === 0}
                  className="px-8 py-2 bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary-hover transition-colors border-2 border-black flex items-center justify-center gap-2 shadow-hard-sm disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="material-symbols-outlined">
                    rocket_launch
                  </span>
                  Create Extractor
                </Button>
              ) : (
                <Button
                  onClick={handleUseTemplate}
                  className="px-8 py-2 bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary-hover transition-colors border-2 border-black flex items-center justify-center gap-2 shadow-hard-sm"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  Use This Template
                </Button>
              )}
            </>
          )}
        </footer>
      </Dialog.Content>
    </Dialog>
  );
});
