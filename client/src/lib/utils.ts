import { ErrorModalProps, IError } from "@/types/common";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function showErrorModal(props: ErrorModalProps) {
  // NiceModal.show(CONSTANTS.MODAL_IDS.ERROR_MODAL, props);
}

export function parseErrorMessage(error: IError | any) {
  return (
    error?.data?.response?.description || error?.data?.message || error?.message
  );
}

export function jsonToSpreadsheetData(json: unknown): {
  data: Array<Array<{ value: string; readOnly: boolean }>>;
  columnLabels: string[];
} {
  // Handle array of objects (most common extraction result)
  if (Array.isArray(json)) {
    const items = json.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
    if (items.length === 0) {
      return {
        data: [[{ value: JSON.stringify(json), readOnly: true }]],
        columnLabels: ["Value"],
      };
    }
    const allKeys = Array.from(
      new Set(items.flatMap((item) => Object.keys(item))),
    );
    const rows = items.map((item) =>
      allKeys.map((key) => ({
        value: item[key] !== undefined ? formatCellValue(item[key]) : "",
        readOnly: true,
      })),
    );
    return { data: rows, columnLabels: allKeys };
  }

  // Handle single object — look for an array property to use as rows
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    const arrayKey = Object.keys(obj).find((key) => Array.isArray(obj[key]));
    if (arrayKey) {
      const nested = jsonToSpreadsheetData(obj[arrayKey]);
      return nested;
    }
    // Flat object: key-value pairs as rows
    const entries = Object.entries(obj);
    const rows = entries.map(([key, val]) => [
      { value: key, readOnly: true },
      { value: formatCellValue(val), readOnly: true },
    ]);
    return { data: rows, columnLabels: ["Key", "Value"] };
  }

  return {
    data: [[{ value: String(json), readOnly: true }]],
    columnLabels: ["Value"],
  };
}

export function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}
