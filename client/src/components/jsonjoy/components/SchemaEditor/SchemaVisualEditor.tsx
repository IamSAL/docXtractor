import { type FC, useRef, useState } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import {
  createFieldSchema,
  renameObjectProperty,
  updateObjectProperty,
  updatePropertyRequired,
} from "../../lib/schemaEditor.ts";
import type { JSONSchema, NewField } from "../../types/jsonSchema.ts";
import { asObjectSchema, isBooleanSchema } from "../../types/jsonSchema.ts";
import AddFieldButton from "./AddFieldButton.tsx";
import SchemaFieldList from "./SchemaFieldList.tsx";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { EmptyBlock } from "@/components/EmptyBlock.tsx";
import { SchemaInferencer } from "../features/SchemaInferencer.tsx";
import { generateSchema } from "@/api/generate";
import { toast } from "sonner";

/** @public */
export interface SchemaVisualEditorProps {
  schema: JSONSchema;
  readOnly: boolean;
  onChange: (schema: JSONSchema) => void;
}

/** @public */
const SchemaVisualEditor: FC<SchemaVisualEditorProps> = ({
  schema,
  onChange,
  readOnly = false,
}) => {
  const t = useTranslation();
  const [inferOpen, setInferOpen] = useState(false);
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;
    setAiGenerating(true);
    try {
      const result = await generateSchema(aiDescription.trim());
      onChange(result.schema as JSONSchema);
      toast.success("Schema generated successfully");
      setAiGenOpen(false);
      setAiDescription("");
    } catch (err: any) {
      toast.error("Failed to generate schema", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Check that FreeLLM is running",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // Handle adding a top-level field
  const handleAddField = (newField: NewField) => {
    // Create a field schema based on the new field data
    const fieldSchema = createFieldSchema(newField);

    // Add the field to the schema
    let newSchema = updateObjectProperty(
      asObjectSchema(schema),
      newField.name,
      fieldSchema,
    );

    // Update required status if needed
    if (newField.required) {
      newSchema = updatePropertyRequired(newSchema, newField.name, true);
    }

    // Update the schema
    onChange(newSchema);
  };

  // Handle editing a top-level field
  const handleEditField = (name: string, updatedField: NewField) => {
    // Create a field schema based on the updated field data
    const fieldSchema = createFieldSchema(updatedField);

    let newSchema = asObjectSchema(schema);

    // If name changed, rename the property while preserving order
    if (name !== updatedField.name) {
      newSchema = renameObjectProperty(newSchema, name, updatedField.name);
      // Update the field schema after rename
      newSchema = updateObjectProperty(
        newSchema,
        updatedField.name,
        fieldSchema,
      );
    } else {
      // Name didn't change, just update the schema
      newSchema = updateObjectProperty(newSchema, name, fieldSchema);
    }

    // Update required status
    newSchema = updatePropertyRequired(
      newSchema,
      updatedField.name,
      updatedField.required || false,
    );

    // Update the schema
    onChange(newSchema);
  };

  // Handle deleting a top-level field
  const handleDeleteField = (name: string) => {
    // Check if the schema is valid first
    if (isBooleanSchema(schema) || !schema.properties) {
      return;
    }

    // Create a new schema without the field
    const { [name]: _, ...remainingProps } = schema.properties;

    const newSchema = {
      ...schema,
      properties: remainingProps,
    };

    // Remove from required array if present
    if (newSchema.required) {
      newSchema.required = newSchema.required.filter((field) => field !== name);
    }

    // Update the schema
    onChange(newSchema);
  };

  // Handle reordering fields
  const handleReorderFields = (updatedSchema: JSONSchema) => {
    onChange(updatedSchema);
  };

  const hasFields =
    !isBooleanSchema(schema) &&
    schema.properties &&
    Object.keys(schema.properties).length > 0;

  return (
    <div>
      <AccordionItem
        value="schema"
        className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border border-border-light xdark:border-border-dark overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <AccordionTrigger className="flex hover:bg-gray-50 transition-colors hover:no-underline items-center justify-between border-b border-border-light xdark:border-border-dark pr-4">
          <div className="flex-1 px-6 py-5  text-lg border-none">
            <div className="flex flex-col text-left">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  schema
                </span>
                Field Schema
              </h3>
              <p className="text-xs text-text-secondary-light xdark:text-text-secondary-dark mt-1 font-normal">
                Define the data points to be extracted from the documents.
              </p>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {!readOnly && (
              <div className="shrink-0 mb-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAiGenOpen(true);
                    setTimeout(() => aiInputRef.current?.focus(), 100);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-black bg-primary hover:brightness-95 border-2 border-black shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-x-px active:translate-y-px rounded-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    auto_awesome
                  </span>
                  AI Generate
                </button>
                <button
                  type="button"
                  onClick={() => setInferOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-100 border-2 border-gray-300 rounded-md transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    data_object
                  </span>
                  Paste JSON
                </button>
                <AddFieldButton onAddField={handleAddField} />
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          {aiGenOpen && (
            <div className="border-b-2 border-black bg-purple-50/50 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 text-[20px]">
                    auto_awesome
                  </span>
                  <h4 className="font-bold text-sm uppercase tracking-wide text-purple-900">
                    Generate Schema with AI
                  </h4>
                </div>
                <p className="text-xs text-gray-600">
                  Describe the fields you want to extract and AI will generate
                  the schema for you.
                </p>
                <textarea
                  ref={aiInputRef}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="e.g. Invoice with vendor name, date, total amount, tax, and line items with description, quantity, unit price"
                  className="w-full border-2 border-black rounded-md p-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-h-[80px]"
                  disabled={aiGenerating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAiGenerate();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">
                    {aiGenerating
                      ? "Generating... this may take a moment"
                      : "Ctrl+Enter to generate"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAiGenOpen(false);
                        setAiDescription("");
                      }}
                      disabled={aiGenerating}
                      className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-black border-2 border-gray-300 rounded-md transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={aiGenerating || !aiDescription.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-800 rounded-md transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                    >
                      {aiGenerating ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">
                            progress_activity
                          </span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">
                            auto_awesome
                          </span>
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="min-h-[400px] overflow-auto max-h-[1600px] bg-white text-left xdark:bg-surface-dark  border-border-light xdark:border-border-dark">
            <div className="jsonjoy h-full">
              <div className="p-4 h-full flex flex-col overflow-auto jsonjoy">
                <div className="grow overflow-auto">
                  {!hasFields ? (
                    <EmptyBlock
                      className="border-0 pt-16"
                      title={t.visualEditorNoFieldsHint1}
                      description={t.visualEditorNoFieldsHint2}
                    />
                  ) : (
                    <SchemaFieldList
                      schema={schema}
                      readOnly={readOnly}
                      onAddField={handleAddField}
                      onEditField={handleEditField}
                      onDeleteField={handleDeleteField}
                      onReorderFields={handleReorderFields}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <SchemaInferencer
        open={inferOpen}
        onOpenChange={setInferOpen}
        onSchemaInferred={(inferredSchema) => {
          onChange(inferredSchema);
          setInferOpen(false);
        }}
      />
    </div>
  );
};

export default SchemaVisualEditor;
