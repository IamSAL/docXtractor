import { cn } from "@/lib/utils";
import React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { }

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn(
                    "text-black text-base font-bold uppercase tracking-wide cursor-pointer",
                    className
                )}
                {...props}
            />
        );
    }
);

Label.displayName = "Label";
