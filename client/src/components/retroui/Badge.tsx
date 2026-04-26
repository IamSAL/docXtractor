import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-hard-sm",
    {
        variants: {
            variant: {
                default: "bg-primary text-black",
                secondary: "bg-secondary text-white",
                destructive: "bg-destructive text-destructive-foreground",
                success: "bg-green-400 text-black",
                warning: "bg-yellow-400 text-black",
                outline: "bg-white text-black",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge };
