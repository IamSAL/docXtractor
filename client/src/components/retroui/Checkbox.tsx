import { cn } from "@/lib/utils";
import React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, ...props }, ref) => {
        return (
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    className={cn(
                        "peer h-5 w-5 cursor-pointer appearance-none border-2 border-black bg-white checked:bg-primary transition-all hover:bg-stone-100 rounded-none checked:border-black focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100">
                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                </span>
            </div>
        );
    }
);

Checkbox.displayName = "Checkbox";
