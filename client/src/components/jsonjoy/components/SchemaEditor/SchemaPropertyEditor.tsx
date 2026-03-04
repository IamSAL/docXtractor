import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "../../components/ui/input.tsx";
import { useTranslation } from "../../hooks/use-translation.ts";
import { cn, getTypeIcon } from "../../lib/utils.ts";
import type {
  JSONSchema,
  ObjectJSONSchema,
  SchemaType,
} from "../../types/jsonSchema.ts";
import {
  asObjectSchema,
  getSchemaDescription,
  withObjectSchema,
} from "../../types/jsonSchema.ts";
import type { ValidationTreeNode } from "../../types/validation.ts";
import TypeDropdown from "./TypeDropdown.tsx";
import TypeEditor from "./TypeEditor.tsx";
import { Switch } from "@/components/retroui/Switch.tsx";
import { Textarea } from "@/components/retroui/Textarea.tsx";

export interface SchemaPropertyEditorProps {
  name: string;
  schema: JSONSchema;
  required: boolean;
  readOnly: boolean;
  validationNode?: ValidationTreeNode;
  onDelete: () => void;
  onNameChange: (newName: string) => void;
  onRequiredChange: (required: boolean) => void;
  onSchemaChange: (schema: ObjectJSONSchema) => void;
  depth?: number;
}

export const SchemaPropertyEditor: React.FC<SchemaPropertyEditorProps> = ({
  name,
  schema,
  required,
  readOnly = false,
  validationNode,
  onDelete,
  onNameChange,
  onRequiredChange,
  onSchemaChange,
  depth = 0,
}) => {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempDesc, setTempDesc] = useState(getSchemaDescription(schema));
  const type = withObjectSchema(
    schema,
    (s) => (s.type || "object") as SchemaType,
    "object" as SchemaType,
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name });

  // Update temp values when props change
  useEffect(() => {
    setTempName(name);
    setTempDesc(getSchemaDescription(schema));
  }, [name, schema]);

  const handleNameSubmit = () => {
    const trimmedName = tempName.trim();
    if (trimmedName && trimmedName !== name) {
      onNameChange(trimmedName);
    } else {
      setTempName(name);
    }
    setIsEditingName(false);
  };

  const handleDescSubmit = () => {
    const trimmedDesc = tempDesc.trim();
    if (trimmedDesc !== getSchemaDescription(schema)) {
      onSchemaChange({
        ...asObjectSchema(schema),
        description: trimmedDesc || undefined,
      });
    } else {
      setTempDesc(getSchemaDescription(schema));
    }
    setIsEditingDesc(false);
  };

  // Handle schema changes, preserving description
  const handleSchemaUpdate = (updatedSchema: ObjectJSONSchema) => {
    const description = getSchemaDescription(schema);
    onSchemaChange({
      ...updatedSchema,
      description: description || undefined,
    });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-2 group border-b border-border-light xdark:border-border-dark last:border-0 transition-colors",
        expanded
          ? " xdark:bg-background-dark/30 bg-gray-200 border-b-2 border-black rounded-2xl"
          : "hover:bg-yellow-50/50 xdark:hover:bg-background-dark/50",
        depth > 0 &&
          "ml-4 border-l border-border-light xdark:border-border-dark",
        isDragging && "opacity-50 z-50",
      )}
    >
      <div className="grid grid-cols-[48px_1fr_120px_100px_48px_48px] items-center py-2 px-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex justify-center text-gray-400 group-hover:text-black transition-colors cursor-grab active:cursor-grabbing"
        >
          <span className="material-symbols-outlined text-xl">
            drag_indicator
          </span>
        </div>

        {/* Name / Icon */}
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <span
            className={cn(
              "material-symbols-outlined text-text-secondary-light text-xl shrink-0",
            )}
          >
            {getTypeIcon(type)}
          </span>
          <div className="flex flex-col min-w-0 flex-1">
            {!readOnly && isEditingName ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                className="h-7 text-sm font-bold min-w-[120px] bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:shadow-none transition-all px-2"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : (
              <button
                type="button"
                onClick={() => !readOnly && setIsEditingName(true)}
                className="font-bold text-text-main-light xdark:text-white truncate text-left hover:underline decoration-2 underline-offset-4"
              >
                {name}
              </button>
            )}

            {/* Description (sub-text) */}
            {!readOnly && isEditingDesc ? (
              <Textarea
                value={tempDesc}
                onChange={(e) => setTempDesc(e.target.value)}
                onBlur={handleDescSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleDescSubmit()}
                placeholder={t.propertyDescriptionPlaceholder}
                className="h-6 mt-1 text-xs text-muted-foreground italic bg-white border border-gray-200 px-1"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            ) : tempDesc ? (
              <button
                type="button"
                onClick={() => !readOnly && setIsEditingDesc(true)}
                className="text-[10px] text-text-secondary-light xdark:text-text-secondary-dark truncate text-left"
              >
                {tempDesc}
              </button>
            ) : (
              !readOnly && (
                <button
                  type="button"
                  onClick={() => setIsEditingDesc(true)}
                  className="text-[10px] text-text-secondary-light/50 opacity-0 group-hover:opacity-100 transition-opacity truncate text-left"
                >
                  + description
                </button>
              )
            )}
          </div>
        </div>

        {/* Type */}
        <div className="flex justify-center">
          <TypeDropdown
            value={type}
            readOnly={readOnly}
            onChange={(newType) => {
              onSchemaChange({
                ...asObjectSchema(schema),
                type: newType,
              });
            }}
          />
        </div>

        {/* Required */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <Switch
              checked={required}
              onCheckedChange={(checked) =>
                !readOnly && onRequiredChange(checked)
              }
              disabled={readOnly}
            />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              {required ? t.propertyRequired : t.propertyOptional}
            </span>
          </div>
        </div>

        {/* Delete button */}
        <div className="flex justify-center">
          {!readOnly && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg border-2 border-transparent hover:border-black hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all active:translate-y-0.5 active:shadow-none"
              aria-label={t.propertyDelete}
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          )}
        </div>

        {/* Expand button */}
        <div className="flex justify-center">
          <button
            type="button"
            className={cn(
              "p-1.5 rounded-lg border-2 border-transparent hover:border-black hover:bg-primary/10 transition-all",
              expanded && "rotate-180",
            )}
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? t.collapse : t.expand}
          >
            <span className="material-symbols-outlined text-xl">
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Type-specific editor or nested fields */}
      {expanded && (
        <div className="border-t-2 border-black/5 bg-gray-50/30 xdark:bg-gray-800/10 p-4 animate-in slide-in-from-top-1">
          {readOnly && tempDesc && (
            <p className="mb-4 text-sm text-text-secondary-light">{tempDesc}</p>
          )}
          <TypeEditor
            schema={schema}
            readOnly={readOnly}
            validationNode={validationNode}
            onChange={handleSchemaUpdate}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
};

export default SchemaPropertyEditor;
