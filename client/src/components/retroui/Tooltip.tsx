import { cn } from "@/lib/utils";
import React, { useState } from "react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function Tooltip({ children, content, side = "top", className }: { children: React.ReactNode; content: React.ReactNode; side?: "top" | "bottom" | "left" | "right"; className?: string }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
            {children}
            {isVisible && (
                <div
                    className={cn(
                        "absolute z-50 px-3 py-2 text-sm font-bold text-black bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded pointer-events-none whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-100",
                        side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2",
                        side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2",
                        side === "left" && "right-full top-1/2 -translate-y-1/2 mr-2",
                        side === "right" && "left-full top-1/2 -translate-y-1/2 ml-2",
                        className
                    )}
                >
                    {content}
                </div>
            )}
        </div>
    );
}
