import cn from "classnames";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: ReactNode;
    className?: string;
    isLoading?: boolean;
}

export function Button({
    variant = "primary",
    size = "md",
    children,
    className,
    isLoading = false,
    disabled,
    ...props
}: ButtonProps) {
    const buttonCn = cn("Button", className, {
        [`Button--${variant}`]: variant,
        [`Button--${size}`]: size,
        "Button--loading": isLoading,
        "Button--disabled": disabled || isLoading,
    });

    return (
        <button className={buttonCn} disabled={disabled || isLoading} {...props}>
            {isLoading ? <span className="Button__spinner" /> : <span>{children}</span>}
        </button>
    );
}
