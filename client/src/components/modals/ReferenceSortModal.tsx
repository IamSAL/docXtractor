import { useState, useCallback } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { read, utils } from "xlsx";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Select } from "@/components/retroui/Select";

export interface SortConfig {
  referenceValues: string[];
  matchColumn: string;
  fileName: string;
  referenceColumn: string;
}

interface ReferenceSortModalProps {
  columnLabels: string[];
}

export const ReferenceSortModal = NiceModal.create(
  ({ columnLabels }: ReferenceSortModalProps) => {
    const modal = useModal();

    const [file, setFile] = useState<File | null>(null);
    const [sheets, setSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState("");
    const [xlsxColumns, setXlsxColumns] = useState<string[]>([]);
    const [referenceColumn, setReferenceColumn] = useState("");
    const [matchColumn, setMatchColumn] = useState("");
    const [previewValues, setPreviewValues] = useState<string[]>([]);
    const [error, setError] = useState("");

    const parseFile = useCallback((f: File, sheetName?: string) => {
      setError("");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = read(data, { type: "array" });

          if (!sheetName) {
            setSheets(wb.SheetNames);
            setSelectedSheet(wb.SheetNames[0]);
            sheetName = wb.SheetNames[0];
          }

          const ws = wb.Sheets[sheetName];
          const jsonData = utils.sheet_to_json<Record<string, unknown>>(ws, {
            defval: "",
          });

          if (jsonData.length === 0) {
            setError("The selected sheet has no data rows.");
            setXlsxColumns([]);
            return;
          }

          const cols = Object.keys(jsonData[0]);
          setXlsxColumns(cols);
          setReferenceColumn(cols[0] || "");

          // Show preview of first column values
          const firstCol = cols[0];
          if (firstCol) {
            const vals = jsonData
              .map((row) => String(row[firstCol] ?? "").trim())
              .filter(Boolean);
            setPreviewValues(vals.slice(0, 5));
          }
        } catch {
          setError(
            "Failed to parse file. Please upload a valid .xlsx or .csv file.",
          );
          setXlsxColumns([]);
        }
      };
      reader.readAsArrayBuffer(f);
    }, []);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setReferenceColumn("");
        setMatchColumn("");
        setPreviewValues([]);
        parseFile(f);
      },
      [parseFile],
    );

    const handleSheetChange = useCallback(
      (val: string) => {
        setSelectedSheet(val);
        if (file) parseFile(file, val);
      },
      [file, parseFile],
    );

    const handleReferenceColumnChange = useCallback(
      (col: string) => {
        setReferenceColumn(col);
        // Update preview
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target!.result as ArrayBuffer);
            const wb = read(data, { type: "array" });
            const ws = wb.Sheets[selectedSheet];
            const jsonData = utils.sheet_to_json<Record<string, unknown>>(ws, {
              defval: "",
            });
            const vals = jsonData
              .map((row) => String(row[col] ?? "").trim())
              .filter(Boolean);
            setPreviewValues(vals.slice(0, 5));
          } catch {
            // ignore
          }
        };
        reader.readAsArrayBuffer(file);
      },
      [file, selectedSheet],
    );

    const handleConfirm = useCallback(() => {
      if (!file || !referenceColumn || !matchColumn) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = read(data, { type: "array" });
          const ws = wb.Sheets[selectedSheet];
          const jsonData = utils.sheet_to_json<Record<string, unknown>>(ws, {
            defval: "",
          });
          const referenceValues = jsonData
            .map((row) => String(row[referenceColumn] ?? "").trim())
            .filter(Boolean);

          const config: SortConfig = {
            referenceValues,
            matchColumn,
            fileName: file.name,
            referenceColumn,
          };
          modal.resolve(config);
          modal.hide();
        } catch {
          setError("Failed to read file data.");
        }
      };
      reader.readAsArrayBuffer(file);
    }, [file, referenceColumn, matchColumn, selectedSheet, modal]);

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
      >
        <Dialog.Content className="max-w-lg">
          <Dialog.Header>Sort Rows by Reference File</Dialog.Header>

          <Dialog.Description className="px-5 pt-3 text-sm text-gray-600">
            Upload an XLSX or CSV file and select a column to define the row
            order.
          </Dialog.Description>

          <div className="flex flex-col gap-4 px-5 py-4">
            {/* File Upload */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">
                Reference File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="block w-full text-sm border-2 border-black p-2 bg-white file:mr-3 file:border-0 file:bg-black file:text-white file:text-xs file:font-bold file:px-3 file:py-1 file:uppercase file:tracking-wide"
              />
            </div>

            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}

            {/* Sheet selector (if multiple) */}
            {sheets.length > 1 && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">
                  Sheet
                </label>
                <Select value={selectedSheet} onValueChange={handleSheetChange}>
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {sheets.map((s) => (
                      <Select.Item key={s} value={s}>
                        {s}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            )}

            {/* Column mapping */}
            {xlsxColumns.length > 0 && (
              <>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">
                    Reference Column (from uploaded file)
                  </label>
                  <Select
                    value={referenceColumn}
                    onValueChange={handleReferenceColumnChange}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {xlsxColumns.map((col) => (
                        <Select.Item key={col} value={col}>
                          {col}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">
                    Match Column (from extraction results)
                  </label>
                  <Select value={matchColumn} onValueChange={setMatchColumn}>
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {columnLabels.map((col) => (
                        <Select.Item key={col} value={col}>
                          {col}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                {/* Preview */}
                {previewValues.length > 0 && (
                  <div className="bg-gray-50 border-2 border-gray-200 p-3 rounded-sm">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                      Reference order preview
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewValues.map((v, i) => (
                        <span
                          key={i}
                          className="text-xs bg-white border border-gray-300 px-2 py-0.5 font-mono"
                        >
                          {i + 1}. {v}
                        </span>
                      ))}
                      {previewValues.length < 5 ? null : (
                        <span className="text-xs text-gray-400">...</span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <Dialog.Footer className="flex justify-end gap-2 px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => modal.hide()}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!file || !referenceColumn || !matchColumn}
            >
              Apply Sort
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    );
  },
);
