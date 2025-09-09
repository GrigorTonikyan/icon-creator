import cn from "classnames";

import "./button.css";

export interface ButtonProps {
    /** Is this the principal call to action on the page? */
    primary?: boolean;
    /** What background color to use */
    backgroundColor?: string;
    /** How large should the button be? */
    size?: "small" | "medium" | "large";
    /** Button contents */
    label: string;
    /** Optional click handler */
    onClick?: () => void;
}

/** Primary UI component for user interaction */
export const Button = ({ primary = false, size = "medium", backgroundColor, label, ...props }: ButtonProps) => {
    const buttonCn = cn("storybook-button", `storybook-button--${size}`, {
        "storybook-button--primary": primary,
        "storybook-button--secondary": !primary,
    });

    return (
        <button type="button" className={buttonCn} style={{ backgroundColor }} {...props}>
            {label}
        </button>
    );
};
