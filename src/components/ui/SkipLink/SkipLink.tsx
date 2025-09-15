import cn from "classnames";
import "./skipLink.css";

export interface SkipLinkProps {
    href: string;
    children: string;
    className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
    const skipLinkCn = cn("SkipLink", className);

    return (
        <a href={href} className={skipLinkCn}>
            {children}
        </a>
    );
}
