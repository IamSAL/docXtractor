import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import { cn, getTypeLabel } from "../../lib/utils.ts";
import type { SchemaType } from "../../types/jsonSchema.ts";

export interface TypeDropdownProps {
  value: SchemaType;
  onChange: (value: SchemaType) => void;
  className?: string;
  readOnly: boolean;
}

const typeOptions: SchemaType[] = [
  "string",
  "number",
  "boolean",
  "object",
  "array",
  "null",
];

export const TypeDropdown: React.FC<TypeDropdownProps> = ({
  value,
  onChange,
  className,
  readOnly,
}) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={cn(
          "text-[10px] px-2 py-1 rounded font-mono border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-1 transition-all active:translate-y-0.5 active:shadow-none bg-white",
          readOnly ? "opacity-90" : "cursor-pointer hover:bg-gray-50",
          className
        )}
        onClick={() => !readOnly && setIsOpen(!isOpen)}
      >
        <span className="uppercase font-bold tracking-tight">{getTypeLabel(t, value)}</span>
        {!readOnly && <ChevronDown size={12} className={cn("transition-transform", isOpen && "rotate-180")} />}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-[140px] rounded border-2 border-black z-[99999] bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in-50 zoom-in-95 overflow-hidden">
          <div className="py-1">
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-xs flex items-center justify-between",
                  "hover:bg-primary/10 transition-colors border-b last:border-0 border-gray-100",
                  value === type && "bg-gray-50 font-bold"
                )}
                onClick={() => {
                  onChange(type);
                  setIsOpen(false);
                }}
              >
                <span className="uppercase tracking-tighter">
                  {getTypeLabel(t, type)}
                </span>
                {value === type && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeDropdown;
