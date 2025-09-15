import cn from "classnames";
import type { InputHTMLAttributes } from "react";
import "./Checkbox.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
    className?: string;
    error?: string;
    id?: string;
    role?: string;
    "aria-checked"?: boolean;
}

export function Checkbox({ label, className, error, id, role, "aria-checked": ariaChecked, ...props }: CheckboxProps) {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperCn = cn("Checkbox", className, {
        "Checkbox--error": error,
        "Checkbox--disabled": props.disabled,
    });

    const inputProps = {
        ...props,
        ...(role && { role }),
        ...(ariaChecked !== undefined && { "aria-checked": ariaChecked }),
    };

    return (
        <div className={wrapperCn}>
            <div className="Checkbox__input-wrapper">
                <input type="checkbox" id={checkboxId} className="Checkbox__input" {...inputProps} />
                <span className="Checkbox__checkmark" />
            </div>
            {label && (
                <label htmlFor={checkboxId} className="Checkbox__label">
                    {label}
                </label>
            )}
            {error && (
                <span className="Checkbox__error" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}
