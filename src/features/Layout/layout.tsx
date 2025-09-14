import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { LayoutContext, useLayout } from "./LayoutContext";

import cn from "classnames";
import "./layout.css";

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
    .flatMap((line) => {
        return line.split(" ").filter((area) => area.trim() !== "");
    });
const uniqueRegions = Array.from(new Set(allRegions));

interface LayoutProps {
    children: ReactNode;
    className?: string;
}

export const Layout = ({ children, className }: LayoutProps) => {
    const [regions, setRegions] = useState<Record<string, ReactNode>>({});

    const setRegionContent = useCallback((region: string, content: ReactNode) => {
        setRegions((prevRegions) => ({ ...prevRegions, [region]: content }));
    }, []);

    const contextValue = useMemo(
        () => ({
            regions,
            setRegionContent,
        }),
        [regions, setRegionContent]
    );

    const layoutStyle = {
        // gridTemplateColumns: `repeat(3, 1fr)`,
        // gridTemplateRows: `auto 1fr auto`,
        gridTemplateAreas: gridAreas,
        height: `calc(100vh - ${LAYOUT_CONFIG.headerHeight} - ${LAYOUT_CONFIG.footerHeight})`,
    };

    const layoutCn = cn("layout", className);

    return (
        <LayoutContext.Provider value={contextValue}>
            <div className={layoutCn} style={layoutStyle}>
                {children}
                {uniqueRegions
                    .filter((region) => regions[region] != null)
                    .map((region) => (
                        <div key={region} style={{ gridArea: region }}>
                            {regions[region]}
                        </div>
                    ))}
            </div>
        </LayoutContext.Provider>
    );
};

interface LayoutRegionProps {
    name: string;
    children: ReactNode;
}
export const LayoutRegion = ({ name, children }: LayoutRegionProps) => {
    const { setRegionContent } = useLayout();

    useEffect(() => {
        setRegionContent(name, children);
        return () => {
            // Clear region on unmount or name change
            setRegionContent(name, null);
        };
    }, [name, children, setRegionContent]);

    return null;
};
