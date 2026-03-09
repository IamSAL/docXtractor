import {
	useState,
	useRef,
	useMemo,
	useCallback,
	useEffect,
} from "react";
import Spreadsheet, { type CellBase, type Matrix } from "react-spreadsheet";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import {
	ReferenceSortModal,
	type SortConfig,
} from "./modals/ReferenceSortModal";
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

interface SpreadsheetViewProps {
	results: Record<string, unknown>;
	fieldOrder?: string[];
	sortConfig?: SortConfig | null;
	onSortChange?: (config: SortConfig | null) => void;
}

export function SpreadsheetView({
	results,
	fieldOrder,
	sortConfig,
	onSortChange,
}: SpreadsheetViewProps) {
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearch, setShowSearch] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

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
		const handleChange = () =>
			setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", handleChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleChange);
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
	const rowLabels = useMemo(
		() => data.map((_, i) => String(i + 1)),
		[data],
	);

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

			{/* Spreadsheet */}
			<div
				className={
					isFullscreen
						? "spreadsheet-scroll spreadsheet-scroll--fullscreen"
						: "spreadsheet-scroll"
				}
			>
				<Spreadsheet
					data={filteredData}
					columnLabels={columnLabels}
					rowLabels={rowLabels}
					onChange={setData}
					className="spreadsheet-excel"
				/>
			</div>

			{/* Status bar */}
			<div className="spreadsheet-statusbar">
				<span>
					{data.length} rows | {columnLabels.length} columns
					{sortConfig && ` | Sorted by "${sortConfig.matchColumn}" (ref: ${sortConfig.fileName})`}
				</span>
				<span className="text-gray-400">
					Click cells to edit | Ctrl+F to search | Arrow keys to navigate
				</span>
			</div>
		</div>
	);
}
