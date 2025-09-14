import cn from "classnames";
import type { InputHTMLAttributes } from "react";
import "./Input.css";

export type InputVariant = "text" | "color" | "range";

export interface BaseInputProps {
    variant?: InputVariant;
    className?: string;
    error?: string;
    label?: string;
    id?: string;
}

export interface TextInputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    variant?: "text";
    type?: "text" | "email" | "password" | "number" | "url";
}

export interface ColorInputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    variant: "color";
}

export interface RangeInputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    variant: "range";
    min?: number;
    max?: number;
    step?: number;
    showValue?: boolean;
}

export type InputProps = TextInputProps | ColorInputProps | RangeInputProps;

export function Input(props: InputProps) {
    const { variant = "text", className, error, label, id, ...inputProps } = props;

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputCn = cn("Input", className, {
        [`Input--${variant}`]: variant,
        "Input--error": error,
    });

    const wrapperCn = cn("Input__wrapper", {
        [`Input__wrapper--${variant}`]: variant,
    });

    const renderInput = () => {
        switch (variant) {
            case "color":
                return <input {...(inputProps as ColorInputProps)} type="color" id={inputId} className={inputCn} />;
            case "range":
                const rangeProps = props as RangeInputProps;
                const { showValue, ...rangeInputProps } = rangeProps;
                const formatValue = (value: any) => {
                    const numValue = value || rangeProps.defaultValue || rangeProps.min || 0;
                    // Format icon size as px, others as % or plain number
                    if (rangeProps.min === 128) return `${numValue}px`; // Icon size
                    if (rangeProps.min === 15) return `${numValue}px`; // Border radius
                    if (rangeProps.min === 40) return `${numValue}%`; // Panel dimensions
                    return `${numValue}`;
                };

                return (
                    <div className="Input__range-container">
                        <input {...rangeInputProps} type="range" id={inputId} className={inputCn} />
                        {showValue && <span className="Input__range-value">{formatValue(rangeProps.value)}</span>}
                    </div>
                );
            default:
                const textProps = props as TextInputProps;
                return (
                    <input
                        {...(inputProps as TextInputProps)}
                        type={textProps.type || "text"}
                        id={inputId}
                        className={inputCn}
                    />
                );
        }
    };

    return (
        <div className={wrapperCn}>
            {label && (
                <label htmlFor={inputId} className="Input__label">
                    {label}
                </label>
            )}
            {renderInput()}
            {error && <span className="Input__error">{error}</span>}
        </div>
    );
}
