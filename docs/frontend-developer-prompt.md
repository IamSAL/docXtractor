# DocXTractor – Frontend Developer Prompt

## Your Task

Build the frontend for **DocXTractor** – an AI-powered document extraction web app. The UI designs (HTML templates + Figma) are already provided. This document gives you the business context, technical requirements, and implementation expectations.

---

## Tech Stack (Mandatory)


| Layer        | Technology                                         |
| -------------- | ---------------------------------------------------- |
| Build        | Vite                                               |
| Framework    | React 18+                                          |
| Language     | TypeScript (strict mode, no`any`)                  |
| Styling      | TailwindCSS (designs use RetroUI/Neubrutalism)     |
| Server State | TanStack Query v5                                  |
| Client State | Zustand                                            |
| Backend      | **Mock services** → localStorage (real API later) |

---

## What is DocXTractor?

DocXTractor lets users:

1. **Create Extractors** – Define extraction templates with fields (AI or regex-based)
2. **Run Extractions** – Upload documents (PDF, DOCX, URLs) and extract structured data
3. **Review Results** – Validate AI extractions with a citation viewer showing source locations
4. **Autoruns Extractors – Set up triggers (schedule, webhook) to run extractors automatically

### Core Concepts


| Concept              | Description                                                             |
| ---------------------- | ------------------------------------------------------------------------- |
| **Extractor**         | Reusable extraction template with configured fields                     |
| **Field**            | A data point to extract (e.g.,`invoice_number`, `total_amount`)         |
| **Extraction Mode**  | AI (OpenAI/LangExtract) or Deterministic (Regex/XPath/CSS)              |
| **Job**              | One execution of a extractor against documents                           |
| **Consensus Voting** | Run multiple AI extractions and vote on best result (improves accuracy) |
| **Citations**        | Track where each extracted value came from in the source document       |
| **Autoruns**         | Automation that triggers a extractor on schedule/webhook/file upload     |

---

## Mock Service Pattern

Create mock services that persist to localStorage and simulate network delays:

```typescript
// services/mock/mockService.ts
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const storage = {
  get: <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]'),
  set: <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data)),
};

export const mockExtractorService = {
  async getAll() {
    await delay();
    return storage.get<Extractor>('extractors');
  },
  async create(data: CreateExtractorDTO) {
    await delay(500);
    const extractors = storage.get<Extractor>('extractors');
    const newExtractor = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    storage.set('extractors', [...extractors, newExtractor]);
    return newExtractor;
  },
  // ... update, delete
};
```

Wrap with TanStack Query:

```typescript
export const useExtractors = () => useQuery({ 
  queryKey: ['extractors'], 
  queryFn: mockExtractorService.getAll 
});

export const useCreateExtractor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mockExtractorService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extractors'] }),
  });
};
```

---

## Code Quality Expectations

1. **Type Safety** – Strict TypeScript, no `any`, explicit return types
2. **Components** – Small, focused, reusable. Co-locate related files.
3. **State** – TanStack Query for server data, Zustand only for complex client state (editor forms)
4. **Readability** – Clear naming, consistent patterns, JSDoc for complex logic
5. **Maintainability** – Feature-based folder structure, barrel exports

### Folder Structure

```
src/
├── components/
│   ├── ui/           # Button, Card, Input, Badge, Modal, etc.
│   └── features/     # extractor/, jobs/, citations/, flows/
├── pages/            # Route-level components
├── hooks/
│   ├── queries/      # TanStack Query hooks
│   └── mutations/    # TanStack Mutation hooks
├── stores/           # Zustand stores
├── services/mock/    # Mock API services
├── types/            # TypeScript interfaces
└── utils/            # Helpers, formatters
```

---

## Success Criteria

✅ All screens implemented with correct states
✅ Full TypeScript coverage, no errors
✅ Mock data persists across page refreshes
✅ User flows work end-to-end (create extractor → run job → review results)
✅ Code is modular and easy to swap mock services for real APIs
