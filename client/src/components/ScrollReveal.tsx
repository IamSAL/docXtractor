import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: string; // e.g. "0s", "0.2s"
}

export default function ScrollReveal({ children, className = "", delay = "0s" }: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);
    return <> {children}</>
    return (
        <div
            ref={ref}
            className={`${className} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: delay }}
        >
            {children}
        </div>
    );
}
