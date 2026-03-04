import { cn } from "@/lib/utils";
import React from "react";

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export function Tabs({
    value,
    onValueChange,
    defaultValue,
    children,
    className,
}: {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    children: React.ReactNode;
    className?: string;
}) {
    const [localValue, setLocalValue] = React.useState(defaultValue);
    const currentValue = value !== undefined ? value : localValue;

    const handleValueChange = React.useCallback(
        (val: string) => {
            if (value === undefined) {
                setLocalValue(val);
            }
            onValueChange?.(val);
        },
        [value, onValueChange]
    );

    return (
        <TabsContext.Provider value={{ value: currentValue || "", onValueChange: handleValueChange }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("inline-flex h-12 items-center justify-center rounded-lg border-2 border-black bg-gray-100 p-1 text-muted-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", className)}>
            {children}
        </div>
    );
}

export function TabsTrigger({
    value,
    children,
    className,
    disabled
}: {
    value: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isSelected = context.value === value;

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => context.onValueChange(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected
                    ? "bg-primary text-primary-foreground border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px] -translate-x-[1px]"
                    : "hover:bg-gray-200 text-gray-600",
                className
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({
    value,
    children,
    className,
}: {
    value: string;
    children: React.ReactNode;
    className?: string;
}) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.value !== value) return null;

    return (
        <div
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95 duration-200",
                className
            )}
        >
            {children}
        </div>
    );
}
