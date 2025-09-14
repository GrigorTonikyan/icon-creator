import cn from "classnames";
import type { ReactNode } from "react";
import "./FormField.css";

export interface FormFieldProps {
    children: ReactNode;
    label?: string;
    error?: string;
    required?: boolean;
    helpText?: string;
    className?: string;
    labelClassName?: string;
    inline?: boolean;
    htmlFor?: string;
}

export function FormField({
    children,
    label,
    error,
    required = false,
    helpText,
    className,
    labelClassName,
    inline = false,
    htmlFor,
}: FormFieldProps) {
    const fieldCn = cn("FormField", className, {
        "FormField--inline": inline,
        "FormField--error": error,
    });

    const labelCn = cn("FormField__label", labelClassName, {
        "FormField__label--required": required,
    });

    return (
        <div className={fieldCn}>
            {label && (
                <label className={labelCn} htmlFor={htmlFor}>
                    {label}
                    {required && <span className="FormField__required">*</span>}
                </label>
            )}
            <div className="FormField__input">{children}</div>
            {helpText && !error && <span className="FormField__help">{helpText}</span>}
            {error && <span className="FormField__error">{error}</span>}
        </div>
    );
}
