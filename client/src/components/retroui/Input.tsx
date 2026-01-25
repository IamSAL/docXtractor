import { cn } from "@/lib/utils";
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, icon, type, ...props }, ref) => {
        return (
            <div className="relative w-full">
                <input
                    type={type}
                    className={cn(
                        "w-full bg-white border-2 border-black rounded px-4 py-3 h-12 text-black font-medium placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-yellow-50 focus:border-black transition-all shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-hard focus:shadow-hard focus:-translate-x-0.5 focus:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pr-12",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {icon && (
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none">
                        {icon}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
