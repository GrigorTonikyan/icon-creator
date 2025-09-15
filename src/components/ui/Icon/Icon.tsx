import cn from "classnames";
import "./Icon.css";

export type IconName =
    | "sun"
    | "moon"
    | "settings"
    | "check"
    | "x"
    | "chevron-down"
    | "chevron-up"
    | "chevron-right"
    | "folder"
    | "layer"
    | "lock"
    | "unlock"
    | "eye"
    | "eye-off";

export interface IconProps {
    name: IconName;
    size?: "sm" | "md" | "lg";
    className?: string;
    "aria-label"?: string;
}

const iconMap: Record<IconName, string> = {
    sun: "☀️",
    moon: "🌙",
    settings: "⚙️",
    check: "✓",
    x: "✕",
    "chevron-down": "▼",
    "chevron-up": "▲",
    "chevron-right": "▶",
    folder: "📁",
    layer: "▣",
    lock: "🔒",
    unlock: "🔓",
    eye: "👁",
    "eye-off": "👁‍🗨",
};

export function Icon({ name, size = "md", className, "aria-label": ariaLabel, ...props }: IconProps) {
    const iconCn = cn("Icon", className, {
        [`Icon--${size}`]: size,
    });

    return (
        <span className={iconCn} aria-label={ariaLabel} role={ariaLabel ? "img" : undefined} {...props}>
            {iconMap[name]}
        </span>
    );
}
