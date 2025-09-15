// src/features/Layout/LayoutRegion.tsx
import { type ReactNode } from "react";
import { useLayout } from "./LayoutContext";

interface LayoutRegionProps {
    name: string;
    children: ReactNode;
}

/**
 * A "headless" or "marker" component. It renders no DOM itself.
 * Its sole purpose is to call the `registerRegion` function from the
 * LayoutContext during the render pass, sending its name and children
 * up to the parent Layout component.
 */
export const LayoutRegion = ({ name, children }: LayoutRegionProps) => {
    const { registerRegion } = useLayout();

    // This is the magic: call the registration function synchronously during render.
    registerRegion(name, children);

    // This component produces no output, it only serves as a portal.
    return null;
};
