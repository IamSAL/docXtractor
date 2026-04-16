import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { Dialog } from "@/components/retroui/Dialog";

// Configure pdf.js worker via CDN to avoid Vite path resolution issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ParseViewerDialogProps {
  open: boolean;
  onClose: () => void;
  sourceName: string;
  pdfUrl: string | undefined;
  sourceUrl: string | undefined;
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
  const [pageWidth, setPageWidth] = useState(400);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

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

  useEffect(() => {
    const update = () =>
      setPageWidth(Math.min(800, window.innerWidth / 2 - 32));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const effectivePdfUrl = sourceType === "file" ? pdfUrl : sourceUrl;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Content
        size="4xl"
        className="h-[90vh] border-4 border-black shadow-none rounded-none "
      >
        {/* Header */}
        <Dialog.Header
          className="border-b-4 border-black bg-black text-white px-6 py-3"
          asChild
        >
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
                        key={`page-${i + 1}`}
                        className="border-b-2 border-gray-300 flex justify-center bg-white"
                      >
                        <Page
                          pageNumber={i + 1}
                          width={pageWidth}
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
                  <p className="text-sm font-bold uppercase">
                    No source available
                  </p>
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
