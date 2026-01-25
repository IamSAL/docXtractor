import { cn } from "@/lib/utils";
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    shadowsize?: "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, shadowsize = "md", ...props }, ref) => {
        const shadowClass = {
            sm: "shadow-hard-sm",
            md: "shadow-hard",
            lg: "shadow-hard-lg",
        }[shadowsize];

        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white border-4 border-black rounded-lg",
                    shadowClass,
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = "Card";
