import { useEffect, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import type { RunExtractorFormData } from "@/types/run-extractor";
import { Select } from "@/components/retroui/Select";

interface SchemaVariant {
  id: string;
  name: string;
  description?: string;
  schema: Record<string, any>;
  isDefault: boolean;
}

interface RunExtractorFieldSelectorProps {
  schema: Record<string, any>;
  variants?: SchemaVariant[];
}

export function RunExtractorFieldSelector({
  schema,
  variants,
}: RunExtractorFieldSelectorProps) {
  const { setValue, watch } = useFormContext<RunExtractorFormData>();
  const skippedFields = watch("skippedFields") || [];
  const variantId = watch("variantId");

  // Determine the active schema based on variant selection
  const activeSchema = useMemo(() => {
    if (variantId && variants?.length) {
      const variant = variants.find((v) => v.id === variantId);
      if (variant) return variant.schema;
    }
    return schema;
  }, [variantId, variants, schema]);

  const fields = useMemo(() => {
    return Object.entries(activeSchema?.properties || {}).map(
      ([name, def]: [string, any]) => ({
        name,
        type: def.type || "string",
        description: def.description,
        isRequired: Array.isArray(activeSchema.required)
          ? activeSchema.required.includes(name)
          : false,
      }),
    );
  }, [activeSchema]);

  // Pre-select default variant when variants change and no selection exists
  useEffect(() => {
    if (variants?.length && !variantId) {
      const defaultVariant = variants.find((v) => v.isDefault);
      if (defaultVariant) {
        setValue("variantId", defaultVariant.id);
      }
    }
    // Only run when variants are loaded/changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants]);

  // Reset skippedFields when variant changes
  useEffect(() => {
    setValue("skippedFields", []);
  }, [variantId, setValue]);

  const toggleField = (fieldName: string) => {
    if (skippedFields.includes(fieldName)) {
      setValue(
        "skippedFields",
        skippedFields.filter((f) => f !== fieldName),
      );
    } else {
      setValue("skippedFields", [...skippedFields, fieldName]);
    }
  };

  const enabledCount = fields.length - skippedFields.length;
  const allSelected = fields.length > 0 && skippedFields.length === 0;
  const noneSelected =
    fields.length > 0 && skippedFields.length === fields.length;

  const selectAll = () => setValue("skippedFields", []);
  const deselectAll = () =>
    setValue(
      "skippedFields",
      fields.map((f) => f.name),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
          Schema Fields
        </label>
        <span className="text-[10px] font-mono text-gray-400">
          {enabledCount}/{fields.length} FIELDS ACTIVE
        </span>
      </div>

      {/* Variant Selector */}
      {variants && variants.length > 0 && (
        <Controller
          name="variantId"
          control={useFormContext<RunExtractorFormData>().control}
          render={({ field }) => (
            <Select
              value={field.value || "__base__"}
              onValueChange={(val) => {
                const newVal = val === "__base__" ? undefined : val;
                field.onChange(newVal);
              }}
            >
              <Select.Trigger className="border-2 border-black bg-white text-sm font-bold h-9">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.Item value="__base__">
                    Base Schema (All Fields)
                  </Select.Item>
                  {variants.map((v) => (
                    <Select.Item key={v.id} value={v.id}>
                      {v.name}
                      {v.isDefault ? " (Default)" : ""}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select>
          )}
        />
      )}

      {/* Field Checklist */}
      <div className="border-2 border-black rounded bg-gray-50 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Field
            </span>
            {fields.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={allSelected}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  disabled={noneSelected}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  None
                </button>
              </>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Include
          </span>
        </div>
        <div className="flex flex-col max-h-52 overflow-y-auto custom-scrollbar">
          {fields.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              No schema fields defined
            </div>
          ) : (
            fields.map((field) => {
              const isSkipped = skippedFields.includes(field.name);
              return (
                <label
                  key={field.name}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors hover:bg-white ${isSkipped ? "opacity-50" : ""}`}
                >
                  <div className="relative flex items-center shrink-0">
                    <input
                      type="checkbox"
                      className="peer h-4 w-4 cursor-pointer appearance-none border-2 border-black bg-white transition-all checked:bg-black"
                      checked={!isSkipped}
                      onChange={() => toggleField(field.name)}
                    />
                    <span className="material-symbols-outlined absolute opacity-0 peer-checked:opacity-100 text-white text-xs left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      check
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold truncate">
                        {field.name}
                      </span>
                      <span className="text-[9px] px-1 py-0 bg-gray-200 border border-gray-300 rounded text-gray-600 font-mono shrink-0">
                        {field.type}
                      </span>
                      {field.isRequired && (
                        <span className="text-[9px] px-1 py-0 bg-red-100 border border-red-300 rounded text-red-600 font-bold shrink-0">
                          REQ
                        </span>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {field.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
