import { cn } from "@/lib/utils";
import React from "react";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
    heading: string;
    description?: string;
    breadcrumb?: string;
    children?: React.ReactNode;
}

export function PageHeader({
    heading,
    description,
    breadcrumb,
    children,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <header className={cn("mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6", className)} {...props}>
            <div>
                {breadcrumb && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500 font-mono text-sm tracking-widest uppercase">{breadcrumb}</span>
                    </div>
                )}
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black uppercase leading-none">
                    {heading}
                </h2>
                {description && (
                    <p className="mt-4 text-lg text-gray-600 font-medium max-w-xl">
                        {description}
                    </p>
                )}
            </div>
            {children && <div className="flex items-center gap-3">{children}</div>}
        </header>
    );
}
