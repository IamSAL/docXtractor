# Parse Viewer & Animated Spinner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add animated loading spinner to source cards, and a parse input/output viewer with a sneak-peek popover + full-screen side-by-side dialog (PDF left, parsed markdown right, proportional scroll sync).

**Architecture:** The spinner fix is a one-line CSS class addition. The viewer is a new `ParseViewerDialog` component using `react-pdf` for DOM-controlled PDF rendering (required for scroll sync) and a plain scrollable `<pre>` for markdown. The backend exposes the MinIO file URL by computing it in `FilesService` and injecting it into run source objects in `RunsService.findOne`.

**Tech Stack:** React 19, react-pdf (new dep), Radix Dialog/Popover (already present), TailwindCSS v4, NestJS, TypeORM.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `server/src/files/files.service.ts` | Modify | Add `getPublicFileUrl(fileKey)` method |
| `server/src/runs/entities/run.entity.ts` | Modify | Add `fileUrl?: string` to `RunSource` interface |
| `server/src/runs/runs.service.ts` | Modify | Transform sources in `findOne` to include `fileUrl` |
| `client/src/components/modals/ParseViewerDialog.tsx` | Create | Full-screen parse viewer dialog |
| `client/src/routes/runs/$id.tsx` | Modify | Spinner animation + preview button + dialog state |

---

## Task 1: Animate source card spinner

**Files:**
- Modify: `client/src/routes/runs/$id.tsx:638-661`

The status icon at the end of each source card currently shows `progress_activity` with no animation. Add `animate-spin` when the source is in a loading state.

- [ ] **Step 1: Locate and update the source card status icon**

Find the block around line 638 in `runs/$id.tsx`:

```tsx
<div
  className={`size-8 border-2 border-black rounded-full flex items-center justify-center ${
    source.extractionStatus === "done"
      ? "bg-green-400"
      : source.extractionStatus === "failed" ||
          source.status === "failed"
        ? "bg-red-500"
        : source.status === "parsed" &&
            !source.extractionStatus
          ? "bg-green-400"
          : "bg-[#FFD700]"
  }`}
>
  <span className="material-symbols-outlined text-[16px] font-black text-black">
    {source.extractionStatus === "done"
      ? "check"
      : source.extractionStatus === "failed" ||
          source.status === "failed"
        ? "close"
        : source.status === "parsed" &&
            !source.extractionStatus
          ? "check"
          : "progress_activity"}
  </span>
</div>
```

Replace with:

```tsx
{(() => {
  const isSourceLoading =
    source.status === "parsing" ||
    source.status === "pending" ||
    source.extractionStatus === "extracting" ||
    source.extractionStatus === "pending";
  const icon =
    source.extractionStatus === "done"
      ? "check"
      : source.extractionStatus === "failed" || source.status === "failed"
        ? "close"
        : source.status === "parsed" && !source.extractionStatus
          ? "check"
          : "progress_activity";
  const bg =
    source.extractionStatus === "done"
      ? "bg-green-400"
      : source.extractionStatus === "failed" || source.status === "failed"
        ? "bg-red-500"
        : source.status === "parsed" && !source.extractionStatus
          ? "bg-green-400"
          : "bg-[#FFD700]";
  return (
    <div
      className={`size-8 border-2 border-black rounded-full flex items-center justify-center ${bg}`}
    >
      <span
        className={`material-symbols-outlined text-[16px] font-black text-black ${isSourceLoading ? "animate-spin" : ""}`}
      >
        {icon}
      </span>
    </div>
  );
})()}
```

- [ ] **Step 2: Verify in browser**

Start dev server (`pnpm run dev` in `client/`). Open an active run that is parsing. The yellow spinner circle should now spin. Completed (green check) and failed (red X) sources should not spin.

- [ ] **Step 3: Commit**

```bash
cd client && git add src/routes/runs/\$id.tsx
git commit -m "feat: animate source card loading spinner during parse/extract"
```

---

## Task 2: Backend — expose file URL on run sources

File sources in a run only store `fileKey` (the MinIO storage key). The frontend needs the full public URL to embed the PDF. We compute it server-side and include it in the run response.

**Files:**
- Modify: `server/src/files/files.service.ts`
- Modify: `server/src/runs/entities/run.entity.ts`
- Modify: `server/src/runs/runs.service.ts`

- [ ] **Step 1: Add `getPublicFileUrl` to FilesService**

In `server/src/files/files.service.ts`, after the `listFiles` method, add:

```typescript
/**
 * Compute the public URL for a file given its storage key.
 * Uses the same base URL as uploadFile.
 */
getPublicFileUrl(fileKey: string): string {
  return `${this.minioPublicUrl}/${fileKey}`;
}
```

- [ ] **Step 2: Add `fileUrl` to RunSource interface**

In `server/src/runs/entities/run.entity.ts`, locate the `RunSource` interface and add the optional field after `fileKey`:

```typescript
export interface RunSource {
  id: string;
  type: 'file' | 'url';
  name: string;
  url?: string;
  fileId?: string;
  fileKey?: string;
  fileUrl?: string;          // ← add this line
  status: 'pending' | 'parsing' | 'parsed' | 'failed';
  // ... rest of existing fields unchanged
```

- [ ] **Step 3: Populate `fileUrl` in `RunsService.findOne`**

In `server/src/runs/runs.service.ts`, replace the current `findOne` body (around line 371):

```typescript
async findOne(id: string, userId: string): Promise<Run> {
  const run = await this.runRepo.findOne({
    where: { id, userId },
    relations: ['extractor'],
  });
  if (!run) throw new NotFoundException('Run not found');

  // Attach computed public URL for file-type sources so the client
  // can embed the original PDF without needing to know MinIO's base URL.
  if (run.sources) {
    run.sources = run.sources.map((s) => ({
      ...s,
      fileUrl: s.fileKey
        ? this.filesService.getPublicFileUrl(s.fileKey)
        : undefined,
    }));
  }

  return run;
}
```

`filesService` is already injected in `RunsService` constructor (`private readonly filesService: FilesService`).

- [ ] **Step 4: Build the server to confirm no TS errors**

```bash
cd server && pnpm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
cd server && git add src/files/files.service.ts src/runs/entities/run.entity.ts src/runs/runs.service.ts
git commit -m "feat: expose fileUrl on run sources for PDF viewer"
```

---

## Task 3: Create ParseViewerDialog component

Full-screen dialog showing the original PDF source (left) beside the parsed markdown output (right). When either panel is scrolled, the other scrolls proportionally.

**Files:**
- Create: `client/src/components/modals/ParseViewerDialog.tsx`

- [ ] **Step 1: Install react-pdf**

```bash
cd client && pnpm add react-pdf
```

`react-pdf` bundles pdf.js. No separate pdfjs-dist install needed.

- [ ] **Step 2: Create the component file**

Create `client/src/components/modals/ParseViewerDialog.tsx`:

```tsx
import { useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Dialog } from "@/components/retroui/Dialog";

// Configure pdf.js worker (bundled with react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface ParseViewerDialogProps {
  open: boolean;
  onClose: () => void;
  sourceName: string;
  pdfUrl: string | undefined;   // undefined = URL source (no PDF to show)
  sourceUrl: string | undefined; // original URL for URL-type sources
  parsedContent: string;
  sourceType: "file" | "url";
}

export function ParseViewerDialog({
  open,
  onClose,
  sourceName,
  pdfUrl,
  sourceUrl,
  parsedContent,
  sourceType,
}: ParseViewerDialogProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // Proportional scroll sync: when one panel scrolls, mirror to other
  const syncLeft = useCallback(() => {
    if (isSyncing.current || !leftRef.current || !rightRef.current) return;
    isSyncing.current = true;
    const el = leftRef.current;
    const pct = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    const other = rightRef.current;
    other.scrollTop = pct * (other.scrollHeight - other.clientHeight);
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  const syncRight = useCallback(() => {
    if (isSyncing.current || !leftRef.current || !rightRef.current) return;
    isSyncing.current = true;
    const el = rightRef.current;
    const pct = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    const other = leftRef.current;
    other.scrollTop = pct * (other.scrollHeight - other.clientHeight);
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  const effectivePdfUrl = sourceType === "file" ? pdfUrl : sourceUrl;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content
        size="screen"
        className="h-screen border-4 border-black shadow-none rounded-none"
      >
        {/* Header */}
        <Dialog.Header className="border-b-4 border-black bg-black text-white px-6 py-3 flex items-center justify-between" asChild>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white">
                {sourceType === "file" ? "picture_as_pdf" : "link"}
              </span>
              <div>
                <p className="font-black text-sm uppercase tracking-tight">
                  {sourceName}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                  Parse Input / Output
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </Dialog.Header>

        {/* Two-panel body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left — PDF or URL source */}
          <div className="flex-1 flex flex-col border-r-4 border-black min-w-0">
            <div className="bg-gray-100 border-b-2 border-black px-4 py-2 flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-sm text-gray-600">
                {sourceType === "file" ? "picture_as_pdf" : "language"}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                {sourceType === "file" ? "PDF Source" : "URL Source"}
              </span>
            </div>
            <div
              ref={leftRef}
              onScroll={syncLeft}
              className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50"
            >
              {effectivePdfUrl ? (
                sourceType === "file" ? (
                  <Document
                    file={effectivePdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={
                      <div className="flex items-center justify-center p-8">
                        <span className="material-symbols-outlined animate-spin text-4xl text-gray-400">
                          progress_activity
                        </span>
                      </div>
                    }
                    error={
                      <div className="flex flex-col items-center justify-center p-8 gap-2">
                        <span className="material-symbols-outlined text-red-500 text-4xl">
                          error
                        </span>
                        <p className="text-xs font-bold text-red-500 uppercase">
                          Failed to load PDF
                        </p>
                        <a
                          href={effectivePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline"
                        >
                          Open in new tab
                        </a>
                      </div>
                    }
                  >
                    {Array.from({ length: numPages }, (_, i) => (
                      <div
                        key={i}
                        className="border-b-2 border-gray-300 flex justify-center bg-white"
                      >
                        <Page
                          pageNumber={i + 1}
                          width={Math.min(800, window.innerWidth / 2 - 32)}
                          renderTextLayer={true}
                          renderAnnotationLayer={false}
                        />
                      </div>
                    ))}
                  </Document>
                ) : (
                  <iframe
                    src={effectivePdfUrl}
                    title="Source URL"
                    className="w-full h-full min-h-[600px] border-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full p-8 text-gray-400">
                  <p className="text-sm font-bold uppercase">No source available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — Parsed markdown */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-gray-100 border-b-2 border-black px-4 py-2 flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-sm text-gray-600">
                description
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                Parsed Markdown
              </span>
              <span className="ml-auto text-[10px] text-gray-400 font-mono">
                {parsedContent.length.toLocaleString()} chars
              </span>
            </div>
            <div
              ref={rightRef}
              onScroll={syncRight}
              className="flex-1 overflow-y-auto overflow-x-hidden bg-white"
            >
              <pre className="p-6 text-xs font-mono leading-relaxed whitespace-pre-wrap text-gray-800 break-words">
                {parsedContent}
              </pre>
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && pnpm run build 2>&1 | head -40
```

Expected: no errors related to `ParseViewerDialog`. (Ignore unrelated pre-existing warnings.)

- [ ] **Step 4: Commit**

```bash
cd client && git add src/components/modals/ParseViewerDialog.tsx
git commit -m "feat: add ParseViewerDialog with PDF/markdown side-by-side view"
```

---

## Task 4: Add parse preview popover + wire dialog in source cards

When a source is `parsed` with content, show a small "eye" button. Clicking it opens a Popover with a content sneak-peek and a "View Full" button that opens the full-screen dialog.

**Files:**
- Modify: `client/src/routes/runs/$id.tsx`

- [ ] **Step 1: Add imports at top of `runs/$id.tsx`**

Add these imports after the existing import block:

```tsx
import { useState } from "react";  // already imported as part of react; ensure useState is included
import { Popover } from "@/components/retroui/Popover";
import { ParseViewerDialog } from "@/components/modals/ParseViewerDialog";
```

Note: `useEffect`, `useRef`, `useMemo`, `useCallback` are already imported. Add `useState` to that line if not present:

```tsx
import { useEffect, useRef, useMemo, useCallback, useState } from "react";
```

- [ ] **Step 2: Add viewer state inside `RunDetailComponent`**

After the existing `const isTerminalState = ...` line, add:

```tsx
// Parse viewer state
const [viewerSourceId, setViewerSourceId] = useState<string | null>(null);
const viewerSource = run.sources?.find((s: any) => s.id === viewerSourceId) ?? null;
```

- [ ] **Step 3: Add ParseViewerDialog at the bottom of the JSX return**

Just before the closing `</AppLayout>` tag, add:

```tsx
{viewerSource && (
  <ParseViewerDialog
    open={!!viewerSourceId}
    onClose={() => setViewerSourceId(null)}
    sourceName={viewerSource.name}
    pdfUrl={viewerSource.fileUrl}
    sourceUrl={viewerSource.url}
    parsedContent={viewerSource.parsedContent ?? ""}
    sourceType={viewerSource.type}
  />
)}
```

- [ ] **Step 4: Add preview button + popover inside the source card**

In the source card's action area (the `<div className="flex items-center gap-2">` block around line 614), add the preview button before the existing retry/spinner block. The new button should only show when `source.parsedContent` exists:

```tsx
{/* Parse preview button — only shown when parsed content is available */}
{source.parsedContent && (
  <Popover>
    <Popover.Trigger asChild>
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gray-700 bg-gray-50 border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:bg-gray-100 transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">
          visibility
        </span>
        Parse
      </button>
    </Popover.Trigger>
    <Popover.Content
      className="w-80 border-2 border-black shadow-[4px_4px_0px_0px_#000000] bg-white p-0"
      side="top"
      align="end"
    >
      {/* Popover header */}
      <div className="border-b-2 border-black px-3 py-2 bg-gray-50 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest">
          Parsed Output Preview
        </span>
        <span className="text-[10px] text-gray-400 font-mono">
          {(source.parsedContent?.length ?? 0).toLocaleString()} chars
        </span>
      </div>
      {/* Truncated content */}
      <pre className="p-3 text-[10px] font-mono leading-relaxed text-gray-700 whitespace-pre-wrap max-h-32 overflow-hidden">
        {source.parsedContent.slice(0, 400)}
        {source.parsedContent.length > 400 && (
          <span className="text-gray-400">…</span>
        )}
      </pre>
      {/* View full button */}
      <div className="border-t-2 border-black px-3 py-2">
        <button
          type="button"
          className="w-full py-1.5 text-[10px] font-black uppercase tracking-wide text-white bg-black hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
          onClick={() => setViewerSourceId(source.id)}
        >
          <span className="material-symbols-outlined text-[14px]">
            open_in_full
          </span>
          View Full Side-by-Side
        </button>
      </div>
    </Popover.Content>
  </Popover>
)}
```

- [ ] **Step 5: Run client linter**

```bash
cd client && pnpm run check
```

Fix any Biome errors. Common ones: unused imports, double quotes vs single quotes, trailing commas.

- [ ] **Step 6: Commit**

```bash
cd client && git add src/routes/runs/\$id.tsx
git commit -m "feat: add parse preview popover and full-screen parse viewer to source cards"
```

---

## Task 5: End-to-end smoke test

- [ ] **Step 1: Start full stack**

```bash
docker-compose up -d
```

Check all services healthy:
```bash
docker-compose ps
```

- [ ] **Step 2: Run a document through the pipeline**

1. Go to `http://localhost:5174`
2. Create an extractor (any schema)
3. Upload a PDF file and start a run
4. Watch the run detail page (`/runs/:id`)

**Expected — spinner:**
- While source status is `parsing` or `pending`: the yellow circle shows a spinning `progress_activity` icon
- After parse completes (status `parsed`): yellow → green circle with static check icon

**Expected — preview button:**
- After parse completes: a "Parse" button appears next to the source name
- Clicking it opens a popover with the first 400 chars of parsed markdown
- The popover shows char count and "View Full Side-by-Side" button

**Expected — full-screen dialog:**
- Clicking "View Full Side-by-Side" opens a full-screen dialog
- Left panel: PDF renders page by page using react-pdf
- Right panel: full parsed markdown in monospace pre block
- Scrolling either panel causes the other to scroll proportionally

- [ ] **Step 3: Test URL-type source**

Add a URL source to a run. After parsing:
- Parse button appears
- Full-screen dialog: left panel shows an iframe of the original URL, right panel shows parsed markdown

---

## Self-Review Checklist

**Spec coverage:**
- [x] Spinning animation when loading → Task 1
- [x] Static icon when done/failed → Task 1 (only `animate-spin` when `isSourceLoading`)
- [x] Sneak-peek tooltip/popover → Task 4 (Popover with 400-char preview)
- [x] Full-screen popup on click → Task 3 + Task 4 (ParseViewerDialog)
- [x] Side-by-side layout — PDF left, markdown right → Task 3
- [x] Both scroll together → Task 3 (proportional syncLeft/syncRight)
- [x] File sources can show PDF → Task 2 (fileUrl from backend) + Task 3

**No placeholders:** All code blocks are complete and runnable.

**Type consistency:**
- `ParseViewerDialog` props: `pdfUrl`, `sourceUrl`, `parsedContent`, `sourceType` — all passed correctly from `runs/$id.tsx` using `viewerSource.fileUrl`, `viewerSource.url`, `viewerSource.parsedContent`, `viewerSource.type`
- `fileUrl` added to both `RunSource` interface (server) and used in frontend as `source.fileUrl`
