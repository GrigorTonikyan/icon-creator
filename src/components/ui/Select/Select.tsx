import cn from "classnames";
import type { SelectHTMLAttributes } from "react";
import "./Select.css";

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    error?: string;
}

export function Select({ options, placeholder, className, error, ...selectProps }: SelectProps) {
    const selectCn = cn("Select", className, {
        "Select--error": error,
    });

    return (
        <div className="Select__wrapper">
            <select className={selectCn} {...selectProps}>
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <div className="Select__error" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
}
