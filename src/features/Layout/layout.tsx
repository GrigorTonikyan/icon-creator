import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import cn from "classnames";
import "./layout.css";
import { LayoutContext } from "./LayoutContext";

// --- CONFIGURATION (no changes) ---
const LAYOUT_CONFIG = {
    headerHeight: "60px",
    footerHeight: "40px",
    sidebarWidth: "250px",
};

const gridAreas = `
    "navbar     navbar      navbar"
    "aside-l    main        aside-r"
    ".          footer      ."
`;

const allRegions = gridAreas
    .replace(/["',.]/g, "")
    .split("\n")
    .flatMap((line) => line.split(" ").filter((area) => area.trim() !== ""));
const uniqueRegions = Array.from(new Set(allRegions));

interface LayoutProps {
    children: ReactNode;
    className?: string;
}

export const Layout = ({ children, className }: LayoutProps) => {
    // Use ref to store region content and a flag to track changes
    const regions = useRef<Record<string, ReactNode>>({});
    const hasChanges = useRef(false);
    const [renderKey, setRenderKey] = useState(0);

    // Force re-render when regions change
    useEffect(() => {
        if (hasChanges.current) {
            hasChanges.current = false;
            setRenderKey((prev) => prev + 1);
        }
    });

    // This function will be passed down via context. Nested LayoutRegion components
    // will call it during their render to synchronously populate the ref.
    const registerRegion = useCallback((name: string, content: ReactNode) => {
        regions.current[name] = content;
        hasChanges.current = true;
    }, []);

    // Memoize the context value to prevent unnecessary re-renders in consumers.
    const contextValue = useMemo(
        () => ({
            registerRegion,
        }),
        [registerRegion]
    );

    const layoutStyle = {
        gridTemplateAreas: gridAreas,
        height: `calc(100vh - ${LAYOUT_CONFIG.headerHeight} - ${LAYOUT_CONFIG.footerHeight})`,
    };

    const layoutCn = cn("layout", className);

    // Get only the populated regions
    const populatedRegions = Object.keys(regions.current);

    // Render children first (invisible LayoutRegion components that register content),
    // then render the grid with only the populated regions
    return (
        <LayoutContext.Provider value={contextValue}>
            {children}
            <div className={layoutCn} style={layoutStyle}>
                {populatedRegions.map((regionName) => {
                    const content = regions.current[regionName];

                    // Use semantic HTML elements based on grid area name
                    switch (regionName) {
                        case "navbar":
                            return (
                                <header key={regionName} style={{ gridArea: regionName }} role="banner">
                                    {content}
                                </header>
                            );
                        case "aside-l":
                        case "aside-r":
                            return (
                                <aside key={regionName} style={{ gridArea: regionName }} role="complementary">
                                    {content}
                                </aside>
                            );
                        case "main":
                            return (
                                <main key={regionName} style={{ gridArea: regionName }} role="main">
                                    {content}
                                </main>
                            );
                        case "footer":
                            return (
                                <footer key={regionName} style={{ gridArea: regionName }} role="contentinfo">
                                    {content}
                                </footer>
                            );
                        default:
                            return (
                                <div key={regionName} style={{ gridArea: regionName }}>
                                    {content}
                                </div>
                            );
                    }
                })}
            </div>
        </LayoutContext.Provider>
    );
};
