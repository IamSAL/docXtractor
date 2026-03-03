import { cn } from "@/lib/utils";
import React from "react";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => {
        return (
            <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
                <input
                    type="checkbox"
                    className="sr-only peer"
                    ref={ref}
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                    {...props}
                />
                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-primary border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] peer-checked:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"></div>
                <div className="absolute left-1 top-1 bg-white border-2 border-black rounded-full h-5 w-5 peer-checked:translate-x-full transition-transform duration-200"></div>
            </label>
        );
    }
);

Switch.displayName = "Switch";
