import type { FC } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import type { Translation } from "../../i18n/translation-keys.ts";
import { cn } from "../../lib/utils.ts";
import type { SchemaType } from "../../types/jsonSchema.ts";

interface SchemaTypeSelectorProps {
  id?: string;
  value: SchemaType;
  onChange: (value: SchemaType) => void;
}

interface TypeOption {
  id: SchemaType;
  label: keyof Translation;
  description: keyof Translation;
}

const typeOptions: TypeOption[] = [
  {
    id: "string",
    label: "fieldTypeTextLabel",
    description: "fieldTypeTextDescription",
  },
  {
    id: "number",
    label: "fieldTypeNumberLabel",
    description: "fieldTypeNumberDescription",
  },
  {
    id: "boolean",
    label: "fieldTypeBooleanLabel",
    description: "fieldTypeBooleanDescription",
  },
  {
    id: "object",
    label: "fieldTypeObjectLabel",
    description: "fieldTypeObjectDescription",
  },
  {
    id: "array",
    label: "fieldTypeArrayLabel",
    description: "fieldTypeArrayDescription",
  },
];

const SchemaTypeSelector: FC<SchemaTypeSelectorProps> = ({
  id,
  value,
  onChange,
}) => {
  const t = useTranslation();
  return (
    <div
      id={id}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {typeOptions.map((type) => (
        <button
          type="button"
          key={type.id}
          title={t[type.description]}
          style={{ padding: '8px' }}
          className={cn(
            "cursor-pointer rounded-xl border-2 text-left transition-all active:translate-y-0.5 active:shadow-none",
            value === type.id
              ? "border-black bg-primary/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-primary/20"
              : "border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5",
          )}
          onClick={() => onChange(type.id)}
        >
          <div className="font-black text-xs uppercase tracking-tight mb-1">{t[type.label]}</div>
          <div className="text-[10px] text-text-secondary-light font-medium line-clamp-1 uppercase">
            {t[type.description]}
          </div>
        </button>
      ))}
    </div>

  );
};

export default SchemaTypeSelector;
