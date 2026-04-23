import { useState, useMemo } from "react";
import { Popover } from "@/components/retroui/Popover";
import { Button } from "@/components/retroui/Button";
import { Select } from "@/components/retroui/Select";
import { RetrySourcesDtoMode } from "@/api/models/retrySourcesDtoMode";

export interface RetryOptionsResult {
  mode: RetrySourcesDtoMode;
  schemaVariantId?: string;
  selectedFields?: string[];
}

interface SchemaVariant {
  id: string;
  name: string;
  schema: Record<string, any>;
  isDefault: boolean;
}

interface RetryOptionsPopoverProps {
  sourceNames: string[];
  variants: SchemaVariant[];
  defaultSchema: Record<string, any>;
  currentVariantId?: string | null;
  onConfirm: (result: RetryOptionsResult) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function RetryOptionsPopover({
  sourceNames,
  variants,
  defaultSchema,
  currentVariantId,
  onConfirm,
  children,
  disabled,
}: RetryOptionsPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        {children}
      </Popover.Trigger>
      <Popover.Content
        align="end"
        sideOffset={6}
        className="w-80 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000000] p-4"
      >
        <RetryOptionsContent
          sourceNames={sourceNames}
          variants={variants}
          defaultSchema={defaultSchema}
          currentVariantId={currentVariantId}
          onConfirm={(result) => {
            setOpen(false);
            onConfirm(result);
          }}
          onCancel={() => setOpen(false)}
        />
      </Popover.Content>
    </Popover>
  );
}

function RetryOptionsContent({
  sourceNames,
  variants,
  defaultSchema,
  currentVariantId,
  onConfirm,
  onCancel,
}: {
  sourceNames: string[];
  variants: SchemaVariant[];
  defaultSchema: Record<string, any>;
  currentVariantId?: string | null;
  onConfirm: (result: RetryOptionsResult) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<RetrySourcesDtoMode>(
    RetrySourcesDtoMode.extraction,
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    currentVariantId || "",
  );

  const activeSchema = useMemo(() => {
    if (selectedVariantId) {
      const variant = variants.find((v) => v.id === selectedVariantId);
      if (variant) return variant.schema;
    }
    return defaultSchema;
  }, [selectedVariantId, variants, defaultSchema]);

  const allFields = useMemo(() => {
    if (!activeSchema?.properties) return [];
    return Object.keys(activeSchema.properties);
  }, [activeSchema]);

  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(allFields),
  );

  const prevFieldsKey = allFields.join(",");
  const [lastFieldsKey, setLastFieldsKey] = useState(prevFieldsKey);
  if (prevFieldsKey !== lastFieldsKey) {
    setSelectedFields(new Set(allFields));
    setLastFieldsKey(prevFieldsKey);
  }

  const toggleField = (field: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedFields.size === allFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(allFields));
    }
  };

  const handleConfirm = () => {
    onConfirm({
      mode,
      schemaVariantId: selectedVariantId || undefined,
      selectedFields:
        selectedFields.size === allFields.length
          ? undefined
          : Array.from(selectedFields),
    });
  };

  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-tighter border-b-4 border-black pb-2 mb-3">
        Retry Options
      </h2>

      {/* Source names */}
      <div className="mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Retrying {sourceNames.length} document(s)
        </span>
        <div className="flex flex-wrap gap-1 mt-1">
          {sourceNames.slice(0, 3).map((name) => (
            <span
              key={name}
              className="text-[10px] font-bold bg-gray-100 border border-black px-2 py-0.5 rounded-sm"
            >
              {name}
            </span>
          ))}
          {sourceNames.length > 3 && (
            <span className="text-[10px] font-bold text-gray-400">
              +{sourceNames.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Retry Mode */}
      <div className="mb-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1.5">
          Retry Mode
        </label>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="retryMode"
              checked={mode === RetrySourcesDtoMode.extraction}
              onChange={() => setMode(RetrySourcesDtoMode.extraction)}
              className="accent-black"
            />
            <span className="text-[11px] font-bold">Extraction only</span>
            <span className="text-[10px] text-gray-400">(re-extract)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="retryMode"
              checked={mode === RetrySourcesDtoMode.parse_and_extraction}
              onChange={() => setMode(RetrySourcesDtoMode.parse_and_extraction)}
              className="accent-black"
            />
            <span className="text-[11px] font-bold">Parse + Extract</span>
            <span className="text-[10px] text-gray-400">(re-parse first)</span>
          </label>
        </div>
      </div>

      {/* Schema Variant */}
      {variants.length > 0 && (
        <div className="mb-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1.5">
            Schema Variant
          </label>
          <Select
            value={selectedVariantId || '__default__'}
            onValueChange={(val) => setSelectedVariantId(val === '__default__' ? '' : val)}
          >
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Default Schema" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="__default__">Default Schema</Select.Item>
              {variants.map((v) => (
                <Select.Item key={v.id} value={v.id}>
                  {v.name}{v.isDefault ? " (default)" : ""}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      )}

      {/* Field Selection */}
      {allFields.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              Fields ({selectedFields.size}/{allFields.length})
            </label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              {selectedFields.size === allFields.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-0.5 max-h-36 overflow-y-auto border-2 border-gray-200 p-1.5 rounded-sm">
            {allFields.map((field) => (
              <label
                key={field}
                className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedFields.has(field)}
                  onChange={() => toggleField(field)}
                  className="accent-black"
                />
                <span className="text-[10px] font-bold truncate">{field}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t-2 border-gray-200">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={selectedFields.size === 0}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
