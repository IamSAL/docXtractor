import { cn } from "@/lib/utils";

interface EmptyBlockProps {
    title?: string;
    description?: string;
    icon?: string;
    tag?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: string;
    };
    className?: string;
}

export const EmptyBlock = ({
    title = "No Pipelines Detected",
    description = "Your workspace is strictly empty. Initiate your first extraction protocol to begin processing logic.",
    icon = "find_in_page",
    tag = "NULL",
    action,
    className,
}: EmptyBlockProps) => {
    return (
        <div
            className={cn(
                "bg-white border-2 border-black p-8 md:p-12 flex flex-col items-center text-center neu-shadow-lg relative overflow-hidden group",
                className
            )}
        >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 border-l-2 border-b-2 border-black rounded-bl-[4rem] -mr-2 -mt-2 z-0" />

            {/* Illustration */}
            <div className="relative z-10 w-48 h-48 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-black bg-white transform rotate-3" />
                <div className="absolute inset-0 border-2 border-black bg-white transform -rotate-2" />
                <div className="absolute inset-0 border-2 border-dashed border-black bg-gray-50 flex items-center justify-center flex-col gap-2">
                    <span className="material-symbols-outlined text-6xl text-gray-300">
                        {icon}
                    </span>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-primary border-2 border-black px-2 py-1 transform rotate-12 shadow-sm">
                    <span className="text-xs font-bold">{tag}</span>
                </div>
            </div>

            <h2 className="relative z-10 text-3xl font-black uppercase mb-3 tracking-tight">
                {title}
            </h2>
            <p className="relative z-10 text-gray-600 font-medium mb-8 max-w-sm leading-relaxed">
                {description}
            </p>

            {action && (
                <button
                    onClick={action.onClick}
                    className="relative z-10 flex items-center gap-3 bg-primary border-2 border-black px-8 py-4 text-sm font-bold uppercase tracking-wider neu-shadow transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-[#e6c809]"
                >
                    {action.icon && (
                        <span className="material-symbols-outlined">{action.icon}</span>
                    )}
                    {action.label}
                </button>
            )}
        </div>
    );
};
