import React from "react";

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
}

export function ChevronRightIcon({ size = 16, className, color = "currentColor" }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12L10 8L6 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function TrashIcon({ size = 16, className, color = "currentColor" }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg">
            <path
                d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6.5 7V11M9.5 7V11M4 4H12L11.2 12.2C11.0895 13.2366 10.2366 14 9.2 14H6.8C5.76342 14 4.91048 13.2366 4.8 12.2L4 4Z"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
