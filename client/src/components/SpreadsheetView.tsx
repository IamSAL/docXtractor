import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import Spreadsheet, { type CellBase, type Matrix } from "react-spreadsheet";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import {
  ReferenceSortModal,
  type SortConfig,
} from "./modals/ReferenceSortModal";
import {
  RetryOptionsPopover,
  type RetryOptionsResult,
} from "./modals/RetryOptionsModal";
import "./spreadsheet-styles.css";

// --- JSON to Spreadsheet conversion ---

interface SpreadsheetResult {
  data: Matrix<CellBase>;
  columnLabels: string[];
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function jsonToSpreadsheetData(
  json: unknown,
  fieldOrder?: string[],
): SpreadsheetResult {
  // Array of objects — most common extraction result
  if (Array.isArray(json)) {
    const items = json.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
    if (items.length === 0) {
      return {
        data: [[{ value: JSON.stringify(json) }]],
        columnLabels: ["Value"],
      };
    }

    // Get all unique keys
    const allKeysSet = new Set(items.flatMap((item) => Object.keys(item)));

    // Order keys based on fieldOrder if provided
    let allKeys: string[];
    if (fieldOrder && fieldOrder.length > 0) {
      // Start with ordered fields that exist in the data
      const orderedKeys = fieldOrder.filter((key) => allKeysSet.has(key));
      // Add remaining keys that aren't in the order
      const remainingKeys = Array.from(allKeysSet).filter(
        (key) => !fieldOrder.includes(key),
      );
      allKeys = [...orderedKeys, ...remainingKeys];
    } else {
      allKeys = Array.from(allKeysSet);
    }

    const rows: Matrix<CellBase> = items.map((item) =>
      allKeys.map((key) => ({
        value: item[key] !== undefined ? formatCellValue(item[key]) : "",
      })),
    );
    return { data: rows, columnLabels: allKeys };
  }

  // Single object — look for a nested array property
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    const arrayKey = Object.keys(obj).find((key) => Array.isArray(obj[key]));
    if (arrayKey) {
      return jsonToSpreadsheetData(obj[arrayKey], fieldOrder);
    }
    // Flat object → key-value rows
    const entries = Object.entries(obj);
    const rows: Matrix<CellBase> = entries.map(([key, val]) => [
      { value: key },
      { value: formatCellValue(val) },
    ]);
    return { data: rows, columnLabels: ["Key", "Value"] };
  }

  return {
    data: [[{ value: String(json) }]],
    columnLabels: ["Value"],
  };
}

// --- Sort helpers ---

function normalize(val: unknown): string {
  return String(val ?? "")
    .trim()
    .toLowerCase();
}

function applySortConfig(
  data: Matrix<CellBase>,
  columnLabels: string[],
  sortConfig: SortConfig,
): Matrix<CellBase> {
  const matchColIdx = columnLabels.indexOf(sortConfig.matchColumn);
  if (matchColIdx === -1) return data;

  const posMap = new Map(
    sortConfig.referenceValues.map((v, i) => [normalize(v), i]),
  );

  // Stable sort: matched rows by reference position, unmatched at end
  const indexed = data.map((row, i) => ({ row, origIdx: i }));
  indexed.sort((a, b) => {
    const aVal = normalize(a.row[matchColIdx]?.value);
    const bVal = normalize(b.row[matchColIdx]?.value);
    const aPos = posMap.get(aVal) ?? Number.MAX_SAFE_INTEGER;
    const bPos = posMap.get(bVal) ?? Number.MAX_SAFE_INTEGER;
    if (aPos !== bPos) return aPos - bPos;
    return a.origIdx - b.origIdx; // preserve original order for ties
  });

  return indexed.map((item) => item.row);
}

// --- CSV Export ---

function matrixToCsv(data: Matrix<CellBase>, columnLabels: string[]): string {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const header = columnLabels.map(escape).join(",");
  const rows = data.map((row) =>
    row
      .map((cell) => escape(cell?.value != null ? String(cell.value) : ""))
      .join(","),
  );
  return [header, ...rows].join("\n");
}

// --- Component ---

interface SourceInfo {
  id: string;
  name: string;
}

interface RetryPopoverConfig {
  variants: {
    id: string;
    name: string;
    schema: Record<string, any>;
    isDefault: boolean;
  }[];
  defaultSchema: Record<string, any>;
  currentVariantId?: string | null;
}

interface SpreadsheetViewProps {
  results: Record<string, unknown>;
  fieldOrder?: string[];
  sortConfig?: SortConfig | null;
  onSortChange?: (config: SortConfig | null) => void;
  sources?: SourceInfo[];
  onRetry?: (sourceIds: string[], result: RetryOptionsResult) => void;
  retryConfig?: RetryPopoverConfig;
  isRetrying?: boolean;
}

export function SpreadsheetView({
  results,
  fieldOrder,
  sortConfig,
  onSortChange,
  sources,
  onRetry,
  retryConfig,
  isRetrying,
}: SpreadsheetViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIdx: number;
  } | null>(null);

  const { data: rawData, columnLabels } = useMemo(
    () => jsonToSpreadsheetData(results, fieldOrder),
    [results, fieldOrder],
  );

  // Apply sort config to raw data
  const sortedData = useMemo(() => {
    if (!sortConfig) return rawData;
    return applySortConfig(rawData, columnLabels, sortConfig);
  }, [rawData, columnLabels, sortConfig]);

  const [data, setData] = useState<Matrix<CellBase>>(sortedData);

  // Sync when results or sort change
  useEffect(() => {
    setData(sortedData);
  }, [sortedData]);

  // Filtered data for search highlighting
  const { filteredData, matchCount } = useMemo(() => {
    if (!searchQuery.trim()) return { filteredData: data, matchCount: 0 };
    const q = searchQuery.toLowerCase();
    let count = 0;
    const highlighted: Matrix<CellBase> = data.map((row) =>
      row.map((cell) => {
        const val = cell?.value != null ? String(cell.value) : "";
        const isMatch = val.toLowerCase().includes(q);
        if (isMatch) count++;
        return {
          ...cell,
          className: isMatch ? "Spreadsheet__cell--search-match" : undefined,
        } as CellBase;
      }),
    );
    return { filteredData: highlighted, matchCount: count };
  }, [data, searchQuery]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd+F for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        if (
          isFullscreen ||
          containerRef.current?.contains(document.activeElement)
        ) {
          e.preventDefault();
          setShowSearch(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen, showSearch]);

  // CSV export
  const handleExportCsv = useCallback(() => {
    const csv = matrixToCsv(data, columnLabels);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extraction-results.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [data, columnLabels]);

  // Reference sort
  const handleOpenSortModal = useCallback(async () => {
    try {
      const config = await NiceModal.show(ReferenceSortModal, {
        columnLabels,
      });
      onSortChange?.(config as SortConfig);
    } catch {
      // modal dismissed
    }
  }, [columnLabels, onSortChange]);

  const handleClearSort = useCallback(() => {
    onSortChange?.(null);
  }, [onSortChange]);

  // Row labels (1-based numbers like Excel)
  const rowLabels = useMemo(() => data.map((_, i) => String(i + 1)), [data]);

  // Retry helpers
  const canRetry = !!sources?.length && !!onRetry;

  const getSourceForRow = useCallback(
    (rowIdx: number): SourceInfo | undefined => {
      if (!sources) return undefined;
      // In per_document mode, each source maps to rows by _source_document field
      // or by index if sources.length matches data.length
      if (sources.length === data.length) {
        return sources[rowIdx];
      }
      // Try to match by _source_document column
      const sourceDocCol = columnLabels.indexOf("_source_document");
      if (sourceDocCol !== -1) {
        const cellVal = String(data[rowIdx]?.[sourceDocCol]?.value ?? "");
        return sources.find((s) => s.name === cellVal);
      }
      return undefined;
    },
    [sources, data, columnLabels],
  );

  const getSourcesForRows = useCallback(
    (rowIndices: number[]): { ids: string[]; names: string[] } => {
      if (!sources) return { ids: [], names: [] };
      const sourceMap = new Map<string, string>();
      for (const idx of rowIndices) {
        const src = getSourceForRow(idx);
        if (src) sourceMap.set(src.id, src.name);
      }
      if (sourceMap.size === 0) {
        return {
          ids: sources.map((s) => s.id),
          names: sources.map((s) => s.name),
        };
      }
      return {
        ids: Array.from(sourceMap.keys()),
        names: Array.from(sourceMap.values()),
      };
    },
    [sources, getSourceForRow],
  );

  const toggleRowSelection = useCallback((rowIdx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIdx)) next.delete(rowIdx);
      else next.add(rowIdx);
      return next;
    });
  }, []);

  const toggleAllRows = useCallback(() => {
    setSelectedRows((prev) =>
      prev.size === data.length ? new Set() : new Set(data.map((_, i) => i)),
    );
  }, [data]);

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu]);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "spreadsheet-container spreadsheet-container--fullscreen"
          : "spreadsheet-container"
      }
    >
      {/* Toolbar */}
      <div className="spreadsheet-toolbar">
        <div className="spreadsheet-toolbar__left">
          <span className="text-xs font-black uppercase tracking-widest text-gray-600">
            Spreadsheet View
          </span>
          <span className="spreadsheet-toolbar__badge">
            {data.length} rows x {columnLabels.length} cols
          </span>
          {sortConfig && (
            <span className="inline-flex items-center gap-1 bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
              <span className="material-symbols-outlined text-[12px]">
                sort
              </span>
              Sorted by: {sortConfig.matchColumn}
              <button
                onClick={handleClearSort}
                className="ml-0.5 hover:text-red-600 transition-colors"
                title="Clear sort"
              >
                <span className="material-symbols-outlined text-[12px]">
                  close
                </span>
              </button>
            </span>
          )}
        </div>
        <div className="spreadsheet-toolbar__right">
          {/* Retry Selected */}
          {canRetry &&
            retryConfig &&
            selectedRows.size > 0 &&
            (() => {
              const { ids, names } = getSourcesForRows(
                Array.from(selectedRows),
              );
              return (
                <RetryOptionsPopover
                  sourceNames={names}
                  variants={retryConfig.variants}
                  defaultSchema={retryConfig.defaultSchema}
                  currentVariantId={retryConfig.currentVariantId}
                  onConfirm={(result) => onRetry?.(ids, result)}
                  disabled={isRetrying}
                >
                  <button
                    className="spreadsheet-toolbar__btn !bg-blue-50 !border-blue-400 !text-blue-700"
                    title={`Retry ${selectedRows.size} selected row(s)`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      replay
                    </span>
                    <span className="text-[10px] font-black">
                      Retry ({selectedRows.size})
                    </span>
                  </button>
                </RetryOptionsPopover>
              );
            })()}
          {/* Search */}
          {showSearch && (
            <div className="spreadsheet-search">
              <span className="material-symbols-outlined text-[14px] text-gray-400">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search cells..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="spreadsheet-search__input"
              />
              {searchQuery && (
                <span className="spreadsheet-search__count">
                  {matchCount} found
                </span>
              )}
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="spreadsheet-search__close"
              >
                <span className="material-symbols-outlined text-[14px]">
                  close
                </span>
              </button>
            </div>
          )}
          <button
            className="spreadsheet-toolbar__btn"
            onClick={() => {
              setShowSearch(!showSearch);
              if (!showSearch)
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            title="Search (Ctrl+F)"
          >
            <span className="material-symbols-outlined text-[16px]">
              search
            </span>
          </button>
          {onSortChange && (
            <button
              className={`spreadsheet-toolbar__btn ${sortConfig ? "!bg-blue-100 !border-blue-400 !text-blue-700" : ""}`}
              onClick={handleOpenSortModal}
              title="Sort rows by reference file"
            >
              <span className="material-symbols-outlined text-[16px]">
                sort
              </span>
              <span className="hidden sm:inline">Sort</span>
            </button>
          )}
          <button
            className="spreadsheet-toolbar__btn"
            onClick={handleExportCsv}
            title="Export CSV"
          >
            <span className="material-symbols-outlined text-[16px]">
              download
            </span>
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            className="spreadsheet-toolbar__btn spreadsheet-toolbar__btn--primary"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit" : "Expand"}
            </span>
          </button>
        </div>
      </div>

      {/* Spreadsheet with optional actions column */}
      <div
        className={
          isFullscreen
            ? "spreadsheet-scroll spreadsheet-scroll--fullscreen"
            : "spreadsheet-scroll"
        }
      >
        <div className="flex">
          {/* Actions column */}
          {canRetry && (
            <div className="flex-shrink-0 border-r-2 border-gray-200 bg-gray-50">
              {/* Header */}
              <div className="h-[30px] flex items-center justify-center px-1 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={toggleAllRows}
                  className="accent-black"
                  title="Select all"
                />
              </div>
              {/* Per-row actions */}
              {data.map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="h-[30px] flex items-center gap-0.5 px-1 border-b border-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIdx)}
                    onChange={() => toggleRowSelection(rowIdx)}
                    className="accent-black"
                  />
                  {retryConfig ? (
                    (() => {
                      const { ids, names } = getSourcesForRows([rowIdx]);
                      return (
                        <RetryOptionsPopover
                          sourceNames={names}
                          variants={retryConfig.variants}
                          defaultSchema={retryConfig.defaultSchema}
                          currentVariantId={retryConfig.currentVariantId}
                          onConfirm={(result) => onRetry?.(ids, result)}
                          disabled={isRetrying}
                        >
                          <button
                            type="button"
                            className="p-0.5 hover:bg-blue-100 rounded-sm transition-colors disabled:opacity-30"
                            title="Retry this row"
                          >
                            <span className="material-symbols-outlined text-[14px] text-blue-600">
                              replay
                            </span>
                          </button>
                        </RetryOptionsPopover>
                      );
                    })()
                  ) : (
                    <button
                      type="button"
                      className="p-0.5 hover:bg-blue-100 rounded-sm transition-colors disabled:opacity-30"
                      disabled={isRetrying}
                      title="Retry this row"
                    >
                      <span className="material-symbols-outlined text-[14px] text-blue-600">
                        replay
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div
            className="flex-1 min-w-0"
            onContextMenu={(e) => {
              if (!canRetry) return;
              // Find which row was right-clicked
              const target = e.target as HTMLElement;
              const cell = target.closest("td");
              if (!cell) return;
              const row = cell.closest("tr");
              if (!row) return;
              const tbody = row.closest("tbody");
              if (!tbody) return;
              const rowIdx = Array.from(tbody.children).indexOf(row);
              if (rowIdx < 0) return;
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                rowIdx,
              });
            }}
          >
            <Spreadsheet
              data={filteredData}
              columnLabels={columnLabels}
              rowLabels={rowLabels}
              onChange={setData}
              className="spreadsheet-excel"
            />
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu &&
        canRetry &&
        retryConfig &&
        (() => {
          const rowSources = getSourcesForRows([contextMenu.rowIdx]);
          const selectedSources = getSourcesForRows(Array.from(selectedRows));
          return (
            <div
              className="fixed z-[9999] bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] py-1 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <RetryOptionsPopover
                sourceNames={rowSources.names}
                variants={retryConfig.variants}
                defaultSchema={retryConfig.defaultSchema}
                currentVariantId={retryConfig.currentVariantId}
                onConfirm={(result) => {
                  onRetry?.(rowSources.ids, result);
                  setContextMenu(null);
                }}
              >
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-blue-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    replay
                  </span>
                  Retry this row
                </button>
              </RetryOptionsPopover>
              {selectedRows.size > 0 && (
                <RetryOptionsPopover
                  sourceNames={selectedSources.names}
                  variants={retryConfig.variants}
                  defaultSchema={retryConfig.defaultSchema}
                  currentVariantId={retryConfig.currentVariantId}
                  onConfirm={(result) => {
                    onRetry?.(selectedSources.ids, result);
                    setContextMenu(null);
                  }}
                >
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-blue-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      replay
                    </span>
                    Retry selected ({selectedRows.size})
                  </button>
                </RetryOptionsPopover>
              )}
            </div>
          );
        })()}

      {/* Status bar */}
      <div className="spreadsheet-statusbar">
        <span>
          {data.length} rows | {columnLabels.length} columns
          {sortConfig &&
            ` | Sorted by "${sortConfig.matchColumn}" (ref: ${sortConfig.fileName})`}
        </span>
        <span className="text-gray-400">
          Click cells to edit | Ctrl+F to search | Arrow keys to navigate
        </span>
      </div>
    </div>
  );
}
