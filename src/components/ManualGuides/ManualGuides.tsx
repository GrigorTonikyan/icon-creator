/**
 * ManualGuides component
 * Renders user-created manual guides on the canvas
 */

import React from "react";
import cn from "classnames";
import { type ManualGuide } from "../../types/editor";
import "./manualGuides.css";

interface ManualGuidesProps {
    guides: ManualGuide[];
    viewport: {
        zoom: number;
        panX: number;
        panY: number;
        canvasWidth: number;
        canvasHeight: number;
    };
    className?: string;
}

export function ManualGuides({ guides, viewport, className }: ManualGuidesProps) {
    const manualGuidesCn = cn("ManualGuides", className);

    // Filter to only show visible guides
    const visibleGuides = guides.filter((guide) => guide.visible);

    if (visibleGuides.length === 0) {
        return null;
    }

    return (
        <g className={manualGuidesCn}>
            {visibleGuides.map((guide) => {
                const strokeWidth = 1 / viewport.zoom; // Keep line width constant regardless of zoom
                const color = guide.color || "#007BFF";
                const dashArray = `${6 / viewport.zoom} ${4 / viewport.zoom}`;

                if (guide.type === "horizontal") {
                    // Horizontal guide line
                    const y = guide.position;

                    return (
                        <line
                            key={guide.id}
                            x1={-viewport.canvasWidth}
                            y1={y}
                            x2={viewport.canvasWidth * 2}
                            y2={y}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            opacity={0.9}
                            pointerEvents="none"
                            className="manual-guide horizontal-guide"
                        />
                    );
                } else {
                    // Vertical guide line
                    const x = guide.position;

                    return (
                        <line
                            key={guide.id}
                            x1={x}
                            y1={-viewport.canvasHeight}
                            x2={x}
                            y2={viewport.canvasHeight * 2}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            opacity={0.9}
                            pointerEvents="none"
                            className="manual-guide vertical-guide"
                        />
                    );
                }
            })}
        </g>
    );
}
