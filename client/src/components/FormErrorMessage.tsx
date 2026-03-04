interface FormErrorMessageProps {
    message?: string
}

export function FormErrorMessage({ message }: FormErrorMessageProps) {
    if (!message) return null

    return (
        <span className="text-xs text-red-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {message}
        </span>
    )
}
