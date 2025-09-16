import cn from "classnames";
import { SmartGuide } from "../../utils/smartGuides";
import "./smartGuides.css";

interface SmartGuidesProps {
    guides: SmartGuide[];
    viewport: {
        zoom: number;
        panX: number;
        panY: number;
        canvasWidth: number;
        canvasHeight: number;
    };
    className?: string;
}

export function SmartGuides({ guides, viewport, className }: SmartGuidesProps) {
    const smartGuidesCn = cn("SmartGuides", className);

    // Filter to only show visible guides
    const visibleGuides = guides.filter((guide) => guide.visible);

    if (visibleGuides.length === 0) {
        return null;
    }

    return (
        <g className={smartGuidesCn}>
            {visibleGuides.map((guide) => {
                if (guide.type === "horizontal") {
                    // Horizontal guide line
                    const y = guide.position;
                    const strokeWidth = 1 / viewport.zoom; // Keep line width constant regardless of zoom

                    return (
                        <line
                            key={guide.id}
                            x1={-viewport.canvasWidth}
                            y1={y}
                            x2={viewport.canvasWidth * 2}
                            y2={y}
                            stroke="#ff4081"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${4 / viewport.zoom} ${4 / viewport.zoom}`}
                            opacity={0.8}
                            pointerEvents="none"
                        />
                    );
                } else {
                    // Vertical guide line
                    const x = guide.position;
                    const strokeWidth = 1 / viewport.zoom;

                    return (
                        <line
                            key={guide.id}
                            x1={x}
                            y1={-viewport.canvasHeight}
                            x2={x}
                            y2={viewport.canvasHeight * 2}
                            stroke="#ff4081"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${4 / viewport.zoom} ${4 / viewport.zoom}`}
                            opacity={0.8}
                            pointerEvents="none"
                        />
                    );
                }
            })}
        </g>
    );
}
