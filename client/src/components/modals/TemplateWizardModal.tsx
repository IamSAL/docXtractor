import { useRef, useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Dialog } from "@/components/retroui/Dialog";
import { Button } from "@/components/retroui/Button";
import { useNavigate } from "@tanstack/react-router";
import { defaultExtractorFormValues } from "@/types/extractor";
import { cn } from "@/lib/utils";
import { generateExtractor } from "@/api/generate";
import { toast } from "sonner";

// Mock Data based on user request
// Mock Data based on real-world IDP (Intelligent Document Processing) use cases
const TEMPLATES = [
  {
    id: "invoice-parser-global",
    name: "Invoice Parser Global",
    version: "V2.4",
    description:
      "Standard extraction for invoices from 50+ countries. Optimized for digital PDFs and scanned bills.",
    icon: "receipt_long",
    tags: ["24 Fields", "Line Items", "Multi-Currency"],
    category: "Financial",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
    data: {
      ...defaultExtractorFormValues,
      name: "Invoice Parser Global",
      description:
        "Standard extraction for invoices from 50+ countries. Optimized for digital PDFs.",
      systemPrompt:
        "You are an expert accountant. Extract vendor, date, total, and line items from this invoice.",
      schema: {
        type: "object",
        properties: {
          vendor_name: { type: "string" },
          invoice_date: { type: "string", format: "date" },
          total_amount: { type: "number" },
          currency: { type: "string" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
                total: { type: "number" },
              },
            },
          },
        },
        required: ["vendor_name", "total_amount", "invoice_date"],
      },
    },
  },
  {
    id: "bank-statement-analyzer",
    name: "Bank Statement Analyzer",
    version: "V1.2",
    description:
      "Extract transactions, account info, and balances from monthly bank statements (PDF/Scanned).",
    icon: "account_balance",
    tags: ["Transaction List", "Balance Check"],
    category: "Financial",
    color: "bg-emerald-100",
    iconColor: "text-emerald-600",
    data: {
      ...defaultExtractorFormValues,
      name: "Bank Statement Analyzer",
      description:
        "Extracts summary and transaction details from bank statements.",
      systemPrompt:
        "Extract account holder details and all transaction rows from the statement.",
      schema: {
        type: "object",
        properties: {
          account_holder: { type: "string" },
          account_number: { type: "string" },
          statement_period: { type: "string" },
          opening_balance: { type: "number" },
          closing_balance: { type: "number" },
          transactions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                description: { type: "string" },
                amount: { type: "number" },
                type: { type: "string", enum: ["debit", "credit"] },
              },
            },
          },
        },
      },
    },
  },
  {
    id: "resume-cv-parser",
    name: "AI Resume Parser",
    version: "GPT-4o Ready",
    description:
      "Extract structured candidate data, skills, and work history from resumes and CVs.",
    icon: "person_search",
    tags: ["HR Tech", "Structured CV"],
    category: "HR",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
    data: {
      ...defaultExtractorFormValues,
      name: "AI Resume Parser",
      description:
        "Converts unstructured resumes into clean candidate profiles.",
      systemPrompt:
        "Act as a technical recruiter. Extract contact info, skills, and work history.",
      schema: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          experience: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                company: { type: "string" },
                duration: { type: "string" },
              },
            },
          },
          education: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  {
    id: "purchase-order-processor",
    name: "Purchase Order Processor",
    version: "SupplyChainPro",
    description:
      "Extract PO numbers, vendor details, and line item tables for automated procurement.",
    icon: "shopping_cart",
    tags: ["Logistics", "Procure-to-Pay"],
    category: "Logistics",
    color: "bg-orange-100",
    iconColor: "text-orange-600",
    data: {
      ...defaultExtractorFormValues,
      name: "Purchase Order Processor",
      description: "Automate PO entry into ERP systems.",
      systemPrompt:
        "Extract PO number, vendor, shipping address, and itemized list.",
      schema: {
        type: "object",
        properties: {
          po_number: { type: "string" },
          vendor_name: { type: "string" },
          shipping_address: { type: "string" },
          total_order_value: { type: "number" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sku: { type: "string" },
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
  {
    id: "legal-lease-agreement",
    name: "Lease Agreement Extractor",
    version: "RealEstate AI",
    description:
      "Pulls rent amounts, security deposits, and key dates from residential or commercial leases.",
    icon: "home_work",
    tags: ["PropTech", "Legal Clauses"],
    category: "Legal",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
    data: {
      ...defaultExtractorFormValues,
      name: "Lease Agreement Extractor",
      description: "Extract core terms from lease documents.",
      systemPrompt:
        "Identify landlord, tenant, rent amount, and lease term dates.",
      schema: {
        type: "object",
        properties: {
          landlord: { type: "string" },
          tenant: { type: "string" },
          property_address: { type: "string" },
          monthly_rent: { type: "number" },
          security_deposit: { type: "number" },
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
      },
    },
  },
  {
    id: "medical-prescription",
    name: "Medical Prescription Parser",
    version: "Healthcare AI",
    description:
      "Specialized pipeline for handwritten doctors notes and prescription pads. Uses advanced LLM inference.",
    icon: "medication",
    tags: ["MedTech", "Handwriting"],
    category: "Medical",
    color: "bg-red-50",
    iconColor: "text-red-600",
    data: {
      ...defaultExtractorFormValues,
      name: "Medical Prescription Parser",
      description:
        "Specialized pipeline for handwritten doctors notes and prescription pads.",
      systemPrompt:
        "You are a pharmacist's assistant. Extract patient info and medication details from this handwritten prescription.",
      schema: {
        type: "object",
        properties: {
          patient_name: { type: "string" },
          medications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                drug_name: { type: "string" },
                dosage: { type: "string" },
                frequency: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  {
    id: "id-passport",
    name: "ID / Passport Scanner",
    version: "Identity V3",
    description:
      "Extract MRZ codes, names, and bio-metric info from global identity documents.",
    icon: "badge",
    tags: ["KYC", "Auth"],
    category: "Identity",
    color: "bg-slate-100",
    iconColor: "text-slate-800",
    data: {
      ...defaultExtractorFormValues,
      name: "ID / Passport Scanner",
      description:
        "Extract MRZ codes and face photo coordinates from global identity documents.",
      systemPrompt:
        "Extract the MRZ code, full name, date of birth, and document number from this ID card or Passport.",
      schema: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          document_number: { type: "string" },
          date_of_birth: { type: "string", format: "date" },
          expiry_date: { type: "string", format: "date" },
          mrz_code: { type: "string" },
          nationality: { type: "string" },
        },
        required: ["full_name", "document_number", "mrz_code"],
      },
    },
  },
  {
    id: "insurance-claim-cms1500",
    name: "CMS-1500 Claim Parser",
    version: "Medical Billing",
    description:
      "Extract charges, ICD codes, and provider info from standard health insurance claim forms.",
    icon: "health_and_safety",
    tags: ["Billing", "Healthcare"],
    category: "Medical",
    color: "bg-cyan-50",
    iconColor: "text-cyan-600",
    data: {
      ...defaultExtractorFormValues,
      name: "CMS-1500 Claim Parser",
      description: "Convert medical claim forms into structured billing data.",
      systemPrompt:
        "Extract patient information, diagnosis codes, and service charges.",
      schema: {
        type: "object",
        properties: {
          patient_name: { type: "string" },
          diagnosis_codes: { type: "array", items: { type: "string" } },
          total_charge: { type: "number" },
          provider_npi: { type: "string" },
          services: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date_of_service: { type: "string" },
                procedure_code: { type: "string" },
                charge: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
];

export const TemplateWizardModal = NiceModal.create(() => {
  const modal = useModal();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "detail" | "ai-generate">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof TEMPLATES)[0] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Templates");
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;
    setAiGenerating(true);
    try {
      const result = await generateExtractor(aiDescription.trim());
      navigate({
        to: "/extractors/new",
        state: {
          initialData: {
            ...defaultExtractorFormValues,
            name: result.name,
            description: result.description,
            schema: result.schema,
            systemPrompt: result.systemPrompt,
          },
        } as any,
      });
      modal.hide();
      toast.success("Extractor generated successfully");
    } catch (err: any) {
      toast.error("Failed to generate extractor", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Check that Ollama is running",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All Templates" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      navigate({
        to: "/extractors/new",
        state: { initialData: selectedTemplate.data } as any,
      });
      modal.hide();
    }
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <Dialog.Content
        className="max-w-5xl p-0 border-2 border-black bg-white shadow-hard h-[85vh] max-h-[900px] flex flex-col overflow-hidden"
        size="auto"
      >
        {/* Header - Shared across views but technically part of the modal shell */}
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
            {/* Progress Stepper */}
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

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden min-h-0 bg-white relative">
          {view === "list" ? (
            <>
              {/* Sidebar Filters */}
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
              {/* Template List */}
              <section className="flex-1 flex flex-col min-h-0 bg-gray-50/50 overflow-hidden">
                {/* Search Bar */}
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
                {/* Scrollable List */}
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
                            Ollama
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Describe your extraction use case and AI will generate
                          a complete extractor configuration.
                        </p>
                        <div className="flex items-center gap-3 text-xs font-mono text-purple-500">
                          <span className="flex items-center gap-1">
                            Schema
                          </span>
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

                  {filteredTemplates.map((template) => (
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
                          className={`w-12 h-12 ${template.color} border-2 border-black flex items-center justify-center shrink-0`}
                        >
                          <span
                            className={`material-symbols-outlined ${template.iconColor || "text-black"}`}
                          >
                            {template.icon}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-black">
                              {template.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-black ${template.category === "Medical" ? "bg-[#8b5cf6] text-white" : "bg-gray-200 text-gray-700"}`}
                            >
                              {template.version}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                            {template.tags.map((tag, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && (
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mx-1"></span>
                                )}
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            handleUseTemplate();
                          }}
                          className="hidden group-hover:block bg-primary border-2 border-black px-4 py-2 font-bold text-sm shadow-hard-sm hover:bg-primary-hover active:shadow-none active:translate-x-px active:translate-y-px transition-all"
                        >
                          USE
                        </button>
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-black transition-colors">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredTemplates.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                      <p>No templates found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : view === "ai-generate" ? (
            /* AI Generation View */
            <div className="flex-1 overflow-y-auto p-6 bg-cream min-h-0">
              <div className="max-w-2xl mx-auto flex flex-col gap-6">
                <div className="bg-white border-2 border-black p-6 shadow-hard-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 border-2 border-purple-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-600 text-2xl">
                        auto_awesome
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Generate with AI</h2>
                      <p className="text-xs text-gray-500">Powered by Ollama</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Describe what kind of documents you want to process and what
                    data to extract. AI will generate the extractor name,
                    description, JSON schema, and system prompt.
                  </p>
                  <textarea
                    ref={aiInputRef}
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="e.g. I need to extract data from medical prescriptions including patient name, doctor name, medications with dosage and frequency, diagnosis, and prescription date"
                    className="w-full border-2 border-black rounded-sm p-4 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 min-h-[150px]"
                    disabled={aiGenerating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleAiGenerate();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {aiGenerating
                        ? "Generating... this may take a moment"
                        : "Ctrl+Enter to generate"}
                    </span>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-purple-50 border-2 border-purple-200 p-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-purple-700 mb-2">
                    Tips for better results
                  </h3>
                  <ul className="text-xs text-purple-800 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] mt-0.5 text-purple-500">
                        check
                      </span>
                      Mention the document type (invoice, receipt, contract,
                      etc.)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] mt-0.5 text-purple-500">
                        check
                      </span>
                      List specific fields you want extracted
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] mt-0.5 text-purple-500">
                        check
                      </span>
                      Mention if there are repeating items (line items,
                      transactions)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] mt-0.5 text-purple-500">
                        check
                      </span>
                      Include data types if important (dates, amounts,
                      percentages)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Detail View */
            <div className="flex-1 overflow-y-auto p-6 bg-cream min-h-0">
              <div className="grid grid-cols-12 gap-6 min-h-0">
                {/* Info Column */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-white border-2 border-black p-5 shadow-hard-sm flex flex-col gap-4 relative overflow-hidden shrink-0">
                    <div className="flex items-start justify-between z-10">
                      <div
                        className={`w-14 h-14 ${selectedTemplate?.color} border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                      >
                        <span
                          className={`material-symbols-outlined text-2xl ${selectedTemplate?.iconColor || "text-black"}`}
                        >
                          {selectedTemplate?.icon}
                        </span>
                      </div>
                      <span className="bg-black text-white text-xs font-bold px-2 py-1 uppercase">
                        {selectedTemplate?.category}
                      </span>
                    </div>
                    <div className="z-10">
                      <h2 className="text-2xl font-bold leading-tight mb-2">
                        {selectedTemplate?.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedTemplate?.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate?.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 border border-black text-[10px] font-bold uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Schema Preview */}
                  <div className="bg-[#282c34] border-2 border-black p-3 text-xs font-mono text-gray-300 overflow-hidden relative shadow-hard-sm shrink-0">
                    <div className="absolute top-0 right-0 bg-primary text-black px-2 py-0.5 text-[10px] font-bold border-l-2 border-b-2 border-black">
                      JSON SCHEMA
                    </div>
                    <pre className="overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-gray-600">
                      {JSON.stringify(selectedTemplate?.data.schema, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Preview Column */}
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
                        {/* Mock Input */}
                        <div className="border-2 border-dashed border-gray-300 p-4 bg-white flex flex-col items-center justify-center text-gray-400 text-sm font-medium min-h-[300px]">
                          <span className="material-symbols-outlined text-4xl mb-2">
                            description
                          </span>
                          [ Document Preview ]
                        </div>
                        {/* Mock Output */}
                        <div className="bg-white border-2 border-black p-4 font-mono text-xs overflow-auto min-h-[300px]">
                          <p className="text-gray-500 mb-2">
                            // Extracted Data
                          </p>
                          <pre>
                            {JSON.stringify(
                              selectedTemplate?.data.fewShotExamples?.[0]
                                ?.output
                                ? JSON.parse(
                                    selectedTemplate.data.fewShotExamples[0]
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
            </div>
          )}
        </div>

        {/* Footer - Shared across views for stability */}
        <footer
          className={cn(
            "border-t-2 border-black bg-white  flex justify-between items-center z-10 shrink-0",
            {
              "p-4": view !== "list",
            },
          )}
        >
          {view === "list" ? (
            <>
              {/* Create Custom Bar */}
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
            </>
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
              <Button
                onClick={handleUseTemplate}
                className="px-8 py-2 bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary-hover transition-colors border-2 border-black flex items-center justify-center gap-2 shadow-hard-sm"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Use This Template
              </Button>
            </>
          )}
        </footer>
      </Dialog.Content>
    </Dialog>
  );
});
