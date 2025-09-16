/**
 * HorizontalRuler component
 * Displays a horizontal ruler along the top edge of the canvas
 */

import React, { useState, useCallback } from "react";
import { type ViewportState, type RulersState } from "../../types/editor";
import { useEditor } from "../../contexts/EditorContext";
import { createManualGuide } from "../../utils/manualGuides";
import {
    generateRulerTicks,
    canvasToScreenCoordinate,
    DEFAULT_RULER_OPTIONS,
    type RulerTick,
    type RulerOptions,
} from "../../utils/rulerUtils";
import "./rulers.css";

interface HorizontalRulerProps {
    viewport: ViewportState;
    rulers: RulersState;
    width: number;
    height?: number;
    className?: string;
}

export const HorizontalRuler: React.FC<HorizontalRulerProps> = ({
    viewport,
    rulers,
    width,
    height = 20,
    className,
}) => {
    const { addManualGuide } = useEditor();
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);

    if (!rulers.visible) {
        return null;
    }

    // Calculate visible canvas range
    const startX = -viewport.panX / viewport.zoom;
    const endX = startX + width / viewport.zoom;

    // Generate ruler options based on current rulers state
    const rulerOptions: RulerOptions = {
        ...DEFAULT_RULER_OPTIONS,
        unit: rulers.unit,
        thickness: height,
    };

    // Generate ticks for the visible range
    const ticks = generateRulerTicks(startX, endX, rulerOptions, viewport);

    // Guide creation handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartY(e.clientY);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) return;
            // Visual feedback could be added here
        },
        [isDragging]
    );

    const handleMouseUp = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) return;

            const dragDistance = e.clientY - dragStartY;
            if (dragDistance > 10) {
                // Only create guide if dragged down enough
                // Calculate the Y position for the horizontal guide
                const rect = e.currentTarget.getBoundingClientRect();
                const canvasY = (e.clientY - rect.bottom) / viewport.zoom;

                // Create horizontal guide
                const guide = createManualGuide("horizontal", canvasY);
                addManualGuide(guide);
            }

            setIsDragging(false);
            setDragStartY(0);
        },
        [isDragging, dragStartY, viewport.zoom, addManualGuide]
    );

    // Render tick marks and labels
    const renderTicks = () => {
        return ticks.map((tick: RulerTick, index: number) => {
            const screenX = canvasToScreenCoordinate(tick.position, viewport, "x");

            // Skip ticks outside the visible area
            if (screenX < 0 || screenX > width) {
                return null;
            }

            const tickHeight = tick.type === "major" ? height * 0.8 : height * 0.4;
            const tickY = height - tickHeight;

            return (
                <g key={`tick-${index}`} className={`ruler-tick ruler-tick--${tick.type}`}>
                    {/* Tick line */}
                    <line x1={screenX} y1={tickY} x2={screenX} y2={height} className="ruler-tick-line" />

                    {/* Label for major ticks */}
                    {tick.type === "major" && tick.label && (
                        <text
                            x={screenX}
                            y={tickY - 2}
                            className="ruler-label"
                            textAnchor="middle"
                            dominantBaseline="text-after-edge">
                            {tick.label}
                        </text>
                    )}
                </g>
            );
        });
    };

    return (
        <div className={`horizontal-ruler ${className || ""}`}>
            <svg
                width={width}
                height={height}
                className="ruler-svg"
                style={{ display: "block", cursor: isDragging ? "grabbing" : "grab" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}>
                {/* Ruler background */}
                <rect x={0} y={0} width={width} height={height} className="ruler-background" />

                {/* Tick marks and labels */}
                <g className="ruler-ticks">{renderTicks()}</g>

                {/* Bottom border line */}
                <line x1={0} y1={height} x2={width} y2={height} className="ruler-border" />
            </svg>
        </div>
    );
};
