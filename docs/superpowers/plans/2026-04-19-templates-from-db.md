# Templates From DB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move 8 hardcoded frontend templates into DB seed data, exclude `isPublic` extractors from "My Extractors", and enrich the Extractor entity with `category`/`icon`/`tags` metadata for rich UI rendering.

**Architecture:** Add three nullable metadata columns to the `Extractor` entity (`category`, `icon`, `tags`). Seed data in `seed-extractors.json` gets the 8 templates with full metadata. The seed strategy changes from "run if DB is empty" to "upsert-by-name for system templates". The `findAll` default scope is fixed to return only the current user's own extractors. The `TemplateWizardModal` drops its static `TEMPLATES` array and sources everything from the `GET /extractors?scope=instance` API.

**Tech Stack:** NestJS + TypeORM (PostgreSQL, JSONB columns, `synchronize: true`), React 19, Orval-generated API client, Axios, TanStack Router.

---

## File Map

| File | Change |
|------|--------|
| `server/src/extractors/entities/extractor.entity.ts` | Add `category`, `icon`, `tags` columns |
| `server/src/extractors/dto/create-extractor.dto.ts` | Add optional `category`, `icon`, `tags` fields |
| `server/src/extractors/seed-extractors.json` | Append 8 templates with metadata |
| `server/src/extractors/extractors.service.ts` | Fix `findAll` default scope; change seed to upsert-by-name |
| `client/src/api/` (generated) | Regenerate via `pnpm run gen:api` |
| `client/src/components/modals/TemplateWizardModal.tsx` | Remove static array, use API templates with entity metadata |

---

### Task 1: Add metadata columns to Extractor entity and DTO

**Files:**
- Modify: `server/src/extractors/entities/extractor.entity.ts`
- Modify: `server/src/extractors/dto/create-extractor.dto.ts`

TypeORM has `synchronize: true` so columns are auto-added on restart — no migration needed.

- [ ] **Step 1: Add `category`, `icon`, `tags` to the entity**

In `server/src/extractors/entities/extractor.entity.ts`, add three columns after the `thumbnailUrl` column (around line 73):

```typescript
  @ApiPropertyOptional({ example: 'Financial', description: 'Template category for display' })
  @Column({ type: 'text', nullable: true })
  category?: string;

  @ApiPropertyOptional({ example: 'receipt_long', description: 'Material Symbols icon name' })
  @Column({ type: 'text', nullable: true })
  icon?: string;

  @ApiPropertyOptional({ type: [String], description: 'Display tags for templates' })
  @Column('jsonb', { nullable: true })
  tags?: string[];
```

- [ ] **Step 2: Add fields to CreateExtractorDto**

In `server/src/extractors/dto/create-extractor.dto.ts`, add after the `thumbnailUrl` field (after line 92):

```typescript
  @ApiPropertyOptional({ example: 'Financial' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'receipt_long' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ type: [String], example: ['24 Fields', 'Multi-Currency'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
```

`UpdateExtractorDto` extends `PartialType(CreateExtractorDto)` so it inherits these automatically.

- [ ] **Step 3: Restart server and verify columns appear**

```bash
cd server && pnpm run start:dev
```

Expected: Server starts, TypeORM logs `ALTER TABLE "extractor" ADD COLUMN "category"`, `"icon"`, `"tags"`. No errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/extractors/entities/extractor.entity.ts server/src/extractors/dto/create-extractor.dto.ts
git commit -m "feat(extractors): add category, icon, tags metadata columns to Extractor entity"
```

---

### Task 2: Fix `findAll` default scope

**Files:**
- Modify: `server/src/extractors/extractors.service.ts:145-162`

Currently the default scope returns `{ userId } OR { isPublic: true }` which bleeds system templates into "My Extractors". Fix it to return only the user's own extractors.

- [ ] **Step 1: Fix the `findAll` method**

In `server/src/extractors/extractors.service.ts`, replace the `findAll` method (lines 145–162):

```typescript
  async findAll(userId: string, scope?: string): Promise<Extractor[]> {
    if (scope === 'instance') {
      return this.extractorRepository.find({
        where: { isPublic: true, userId: IsNull() },
        order: { createdAt: 'DESC' },
      });
    }
    if (scope === 'mine-public') {
      return this.extractorRepository.find({
        where: { isPublic: true, userId },
        order: { createdAt: 'DESC' },
      });
    }
    // Default: only the user's own extractors (no public bleed-through)
    return this.extractorRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
```

- [ ] **Step 2: Verify in browser**

With the server running, navigate to `/extractors`. Confirm only your own extractors appear — no system templates mixed in. The "My Extractors" page should be clean.

- [ ] **Step 3: Commit**

```bash
git add server/src/extractors/extractors.service.ts
git commit -m "fix(extractors): exclude public templates from default findAll scope"
```

---

### Task 3: Add 8 templates to seed data + fix seed strategy

**Files:**
- Modify: `server/src/extractors/seed-extractors.json`
- Modify: `server/src/extractors/extractors.service.ts:45-58`

The current seed runs only when `total count === 0`. Change to upsert-by-name for `isPublic+userId=null` records so existing instances also get the new templates on next restart.

- [ ] **Step 1: Change seed strategy in `onModuleInit`**

In `server/src/extractors/extractors.service.ts`, replace `onModuleInit` (lines 45–58):

```typescript
  async onModuleInit() {
    const seedData = this.loadSeedData();
    if (seedData.length === 0) return;

    this.logger.log('Checking system templates...');
    for (const d of seedData) {
      const existing = await this.extractorRepository.findOne({
        where: { name: d.name, isPublic: true, userId: IsNull() },
      });
      if (!existing) {
        await this.extractorRepository.save(
          this.extractorRepository.create({ ...d, isPublic: true, userId: null }),
        );
        this.logger.log(`Seeded template: ${d.name}`);
      }
    }
  }
```

- [ ] **Step 2: Append the 8 templates to `seed-extractors.json`**

Open `server/src/extractors/seed-extractors.json`. It is a JSON array. Append the following 8 objects inside that array (before the closing `]`). Make sure to add a comma after the last existing entry first.

```json
  {
    "name": "Invoice Parser Global",
    "description": "Standard extraction for invoices from 50+ countries. Optimized for digital PDFs and scanned bills.",
    "category": "Financial",
    "icon": "receipt_long",
    "tags": ["24 Fields", "Line Items", "Multi-Currency"],
    "defaultModel": "free",
    "systemPrompt": "You are an expert accountant. Extract vendor, date, total, and line items from this invoice. Return null for any field not present in the document. Ensure amounts are returned as numbers, not strings.",
    "schema": {
      "type": "object",
      "properties": {
        "vendor_name": { "type": "string", "description": "Name of the vendor or seller" },
        "invoice_date": { "type": "string", "format": "date", "description": "Date of the invoice" },
        "total_amount": { "type": "number", "description": "Total invoice amount" },
        "currency": { "type": "string", "description": "Currency code, e.g. USD, EUR" },
        "line_items": {
          "type": "array",
          "description": "Individual line items on the invoice",
          "items": {
            "type": "object",
            "properties": {
              "description": { "type": "string" },
              "quantity": { "type": "number" },
              "unit_price": { "type": "number" },
              "total": { "type": "number" }
            }
          }
        }
      },
      "required": ["vendor_name", "total_amount", "invoice_date"]
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  },
  {
    "name": "Bank Statement Analyzer",
    "description": "Extract transactions, account info, and balances from monthly bank statements (PDF/Scanned).",
    "category": "Financial",
    "icon": "account_balance",
    "tags": ["Transaction List", "Balance Check"],
    "defaultModel": "free",
    "systemPrompt": "Extract account holder details and all transaction rows from the bank statement. Return transaction amounts as numbers (positive for credits, negative for debits). Return null for missing fields.",
    "schema": {
      "type": "object",
      "properties": {
        "account_holder": { "type": "string", "description": "Name of the account holder" },
        "account_number": { "type": "string", "description": "Bank account number" },
        "statement_period": { "type": "string", "description": "Period covered by the statement" },
        "opening_balance": { "type": "number", "description": "Opening balance" },
        "closing_balance": { "type": "number", "description": "Closing balance" },
        "transactions": {
          "type": "array",
          "description": "List of transactions",
          "items": {
            "type": "object",
            "properties": {
              "date": { "type": "string" },
              "description": { "type": "string" },
              "amount": { "type": "number" },
              "type": { "type": "string", "enum": ["debit", "credit"] }
            }
          }
        }
      }
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  },
  {
    "name": "AI Resume Parser",
    "description": "Extract structured candidate data, skills, and work history from resumes and CVs.",
    "category": "HR",
    "icon": "person_search",
    "tags": ["HR Tech", "Structured CV"],
    "defaultModel": "free",
    "systemPrompt": "Act as a technical recruiter. Extract contact info, skills, and work history from this resume or CV. Return skills as a list of strings. Return null for any field not present.",
    "schema": {
      "type": "object",
      "properties": {
        "full_name": { "type": "string", "description": "Candidate's full name" },
        "email": { "type": "string", "description": "Email address" },
        "phone": { "type": "string", "description": "Phone number" },
        "skills": { "type": "array", "items": { "type": "string" }, "description": "List of skills" },
        "experience": {
          "type": "array",
          "description": "Work experience entries",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "company": { "type": "string" },
              "duration": { "type": "string" }
            }
          }
        },
        "education": { "type": "array", "items": { "type": "string" }, "description": "Education entries" }
      }
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  },
  {
    "name": "Purchase Order Processor",
    "description": "Extract PO numbers, vendor details, and line item tables for automated procurement.",
    "category": "Logistics",
    "icon": "shopping_cart",
    "tags": ["Logistics", "Procure-to-Pay"],
    "defaultModel": "free",
    "systemPrompt": "Extract PO number, vendor, shipping address, and itemized list from this purchase order. Return numeric values as numbers. Return null for missing fields.",
    "schema": {
      "type": "object",
      "properties": {
        "po_number": { "type": "string", "description": "Purchase order number" },
        "vendor_name": { "type": "string", "description": "Vendor name" },
        "shipping_address": { "type": "string", "description": "Shipping address" },
        "total_order_value": { "type": "number", "description": "Total order value" },
        "items": {
          "type": "array",
          "description": "Ordered items",
          "items": {
            "type": "object",
            "properties": {
              "sku": { "type": "string" },
              "description": { "type": "string" },
              "quantity": { "type": "number" },
              "unit_price": { "type": "number" }
            }
          }
        }
      }
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  },
  {
    "name": "Lease Agreement Extractor",
    "description": "Pulls rent amounts, security deposits, and key dates from residential or commercial leases.",
    "category": "Legal",
    "icon": "home_work",
    "tags": ["PropTech", "Legal Clauses"],
    "defaultModel": "free",
    "systemPrompt": "Identify landlord, tenant, rent amount, and lease term dates from this lease agreement. Return monetary values as numbers. Return null for any field not present in the document.",
    "schema": {
      "type": "object",
      "properties": {
        "landlord": { "type": "string", "description": "Landlord name" },
        "tenant": { "type": "string", "description": "Tenant name" },
        "property_address": { "type": "string", "description": "Property address" },
        "monthly_rent": { "type": "number", "description": "Monthly rent amount" },
        "security_deposit": { "type": "number", "description": "Security deposit amount" },
        "start_date": { "type": "string", "description": "Lease start date" },
        "end_date": { "type": "string", "description": "Lease end date" }
      }
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  },
  {
    "name": "Medical Prescription Parser",
    "description": "Specialized pipeline for handwritten doctors notes and prescription pads.",
    "category": "Medical",
    "icon": "medication",
    "tags": ["MedTech", "Handwriting"],
    "defaultModel": "free",
    "systemPrompt": "You are a pharmacist's assistant. Extract patient info and medication details from this handwritten prescription. Be precise about dosage and frequency. Return null for any field not legible or present.",
    "schema": {
      "type": "object",
      "properties": {
        "patient_name": { "type": "string", "description": "Patient's full name" },
        "medications": {
          "type": "array",
          "description": "List of prescribed medications",
          "items": {
            "type": "object",
            "properties": {
              "drug_name": { "type": "string" },
              "dosage": { "type": "string" },
              "frequency": { "type": "string" }
            }
          }
        }
      }
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  },
  {
    "name": "ID / Passport Scanner",
    "description": "Extract MRZ codes, names, and bio-metric info from global identity documents.",
    "category": "Identity",
    "icon": "badge",
    "tags": ["KYC", "Auth"],
    "defaultModel": "free",
    "systemPrompt": "Extract the MRZ code, full name, date of birth, and document number from this ID card or Passport. Return dates in YYYY-MM-DD format. Return null for fields not present or not legible.",
    "schema": {
      "type": "object",
      "properties": {
        "full_name": { "type": "string", "description": "Full name as on document" },
        "document_number": { "type": "string", "description": "Document number" },
        "date_of_birth": { "type": "string", "format": "date", "description": "Date of birth" },
        "expiry_date": { "type": "string", "format": "date", "description": "Document expiry date" },
        "mrz_code": { "type": "string", "description": "Machine readable zone code" },
        "nationality": { "type": "string", "description": "Nationality" }
      },
      "required": ["full_name", "document_number", "mrz_code"]
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  },
  {
    "name": "CMS-1500 Claim Parser",
    "description": "Extract charges, ICD codes, and provider info from standard health insurance claim forms.",
    "category": "Medical",
    "icon": "health_and_safety",
    "tags": ["Billing", "Healthcare"],
    "defaultModel": "free",
    "systemPrompt": "Extract patient information, diagnosis codes, and service charges from this CMS-1500 health insurance claim form. Return charge amounts as numbers. Return null for missing fields.",
    "schema": {
      "type": "object",
      "properties": {
        "patient_name": { "type": "string", "description": "Patient's full name" },
        "diagnosis_codes": { "type": "array", "items": { "type": "string" }, "description": "ICD diagnosis codes" },
        "total_charge": { "type": "number", "description": "Total charge amount" },
        "provider_npi": { "type": "string", "description": "Provider NPI number" },
        "services": {
          "type": "array",
          "description": "Individual services billed",
          "items": {
            "type": "object",
            "properties": {
              "date_of_service": { "type": "string" },
              "procedure_code": { "type": "string" },
              "charge": { "type": "number" }
            }
          }
        }
      }
    },
    "fewShotExamples": [],
    "variants": [],
    "consensusEnabled": false,
    "confidenceThreshold": 85,
    "conflictResolution": "majority",
    "parserEngine": "docling",
    "citationEnabled": false,
    "citationIncludePdfPage": false,
    "citationIncludeBbox": false,
    "citationIncludeParagraphId": false,
    "contextWindow": "128k"
  }
```

- [ ] **Step 3: Restart server, verify templates seeded**

```bash
cd server && pnpm run start:dev
```

Expected: Server logs 8 lines like `Seeded template: Invoice Parser Global`. Then verify:

```bash
# In another terminal:
curl -s "http://localhost:3001/extractors?scope=instance" \
  -H "Authorization: Bearer <your_jwt>" | jq '.[].name'
```

Expected: all 8 new template names appear in the output alongside existing system templates.

- [ ] **Step 4: Commit**

```bash
git add server/src/extractors/seed-extractors.json server/src/extractors/extractors.service.ts
git commit -m "feat(extractors): seed 8 system templates with metadata; upsert-by-name seed strategy"
```

---

### Task 4: Regenerate frontend API client

**Files:**
- Modify: `client/src/api/models/extractor.ts` (generated)
- Modify: `client/src/api/schemas/extractor.ts` (generated)

Orval reads the Swagger JSON from the running NestJS server. The server must be running for this step.

- [ ] **Step 1: Regenerate typed client**

```bash
cd client && pnpm run gen:api
```

Expected: Orval outputs success. The `Extractor` model in `src/api/models/extractor.ts` now includes `category?: string`, `icon?: string`, `tags?: string[]`.

- [ ] **Step 2: Verify generated type**

```bash
grep -A3 "category" client/src/api/models/extractor.ts
```

Expected output includes:
```
category?: string;
icon?: string;
tags?: string[];
```

- [ ] **Step 3: Commit generated files**

```bash
git add client/src/api/
git commit -m "chore(client): regenerate API client with Extractor metadata fields"
```

---

### Task 5: Update TemplateWizardModal to use API templates

**Files:**
- Modify: `client/src/components/modals/TemplateWizardModal.tsx`

Remove the 332-line static `TEMPLATES` array and all code that references it. Source everything from the `scope=instance` API call that already exists in the component. Use entity metadata (`category`, `icon`, `tags`) for rich display.

- [ ] **Step 1: Replace the entire file**

Replace `client/src/components/modals/TemplateWizardModal.tsx` with the following. Read the current file carefully first — the structure (header, list view, ai-generate view, detail view, footer) is preserved; only the data source and type of `selectedTemplate` change.

Key changes:
- Remove static `TEMPLATES` const (lines 26–331)
- Add `CATEGORY_STYLE` map for icon/color per category
- `selectedTemplate` becomes `Extractor | null`
- `filteredTemplates` sources from `apiTemplates` (entity metadata)
- `handleUseTemplate` uses entity fields (same as old `handleUseApiTemplate`)
- Detail view uses `selectedTemplate.schema`, `selectedTemplate.fewShotExamples`, `selectedTemplate.category`, `selectedTemplate.icon`, `selectedTemplate.tags`
- Remove `filteredApiTemplates` and the "Instance Templates" section divider (now all templates are from API)
- Category sidebar filter works on `extractor.category`

```tsx
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
			.then((res) =>
				setTemplates(Array.isArray(res.data) ? res.data : []),
			)
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
														<div className="flex items-center gap-3 text-xs font-mono text-gray-500">
															{(template.tags ?? []).map((tag, i) => (
																<span key={i} className="flex items-center gap-1">
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
													<button
														onClick={(e) => {
															e.stopPropagation();
															setSelectedTemplate(template);
															navigate({
																to: "/extractors/new",
																state: {
																	initialData: {
																		...defaultExtractorFormValues,
																		name: template.name,
																		description: template.description ?? "",
																		schema: template.schema,
																		systemPrompt: template.systemPrompt,
																		defaultModel: template.defaultModel,
																	},
																} as any,
															});
															modal.hide();
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
												(optional — improves field inference &amp; enables preview)
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
													<span className="text-xs font-medium">Parsing...</span>
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
																		? { ...f, type: e.target.value as FieldType }
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
							{selectedTemplate && (() => {
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
																	selectedTemplate.fewShotExamples?.[0]?.output
																		? JSON.parse(
																				selectedTemplate.fewShotExamples[0].output,
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
```

- [ ] **Step 2: Run Biome check**

```bash
cd client && pnpm run check
```

Expected: No errors. If Biome auto-formats, accept the changes.

- [ ] **Step 3: Verify in browser**

Navigate to `/extractors`. Confirm no templates appear (only user's own extractors). Click "New Extractor" to open the wizard. Confirm:
- All 8 seeded templates appear in the list with correct icons and colors
- Category filter works (Financial shows 2 templates, Medical shows 2, etc.)
- Search works
- Clicking a template shows the detail view with schema preview
- "USE" button and "Use This Template" navigate to `/extractors/new` with pre-filled data
- AI Generate tab still works

- [ ] **Step 4: Commit**

```bash
git add client/src/components/modals/TemplateWizardModal.tsx
git commit -m "feat(client): source TemplateWizardModal templates from DB instead of hardcoded array"
```

---

## Self-Review

**Spec coverage:**
- ✅ `isPublic` extractors excluded from "My Extractors" → Task 2 fixes `findAll` default scope
- ✅ Static modal templates moved to DB seed data → Task 3 adds 8 templates to `seed-extractors.json`
- ✅ Templates importable by users → already works via `POST /extractors/:id/clone` (unchanged); templates.tsx page also unchanged
- ✅ `category`, `icon`, `tags` metadata on entity → Task 1
- ✅ Modal uses entity metadata for rich display → Task 5

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:**
- `Extractor` type from `@/api/models` is used consistently after regeneration in Task 4
- `getTemplateStyle(extractor: Extractor)` helper defined at top of modal file, used in list view and detail view
- `selectedTemplate: Extractor | null` used in `handleUseTemplate`, detail view, and header sub-title
- `templates` state (renamed from `apiTemplates`) is `Extractor[]` throughout
