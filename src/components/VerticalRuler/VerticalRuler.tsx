/**
 * VerticalRuler component
 * Displays a vertical ruler along the left edge of the canvas
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

interface VerticalRulerProps {
    viewport: ViewportState;
    rulers: RulersState;
    width?: number;
    height: number;
    className?: string;
}

export const VerticalRuler: React.FC<VerticalRulerProps> = ({ viewport, rulers, width = 20, height, className }) => {
    const { addManualGuide } = useEditor();
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);

    if (!rulers.visible) {
        return null;
    }

    // Calculate visible canvas range
    const startY = -viewport.panY / viewport.zoom;
    const endY = startY + height / viewport.zoom;

    // Generate ruler options based on current rulers state
    const rulerOptions: RulerOptions = {
        ...DEFAULT_RULER_OPTIONS,
        unit: rulers.unit,
        thickness: width,
    };

    // Generate ticks for the visible range
    const ticks = generateRulerTicks(startY, endY, rulerOptions, viewport);

    // Guide creation handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
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

            const dragDistance = e.clientX - dragStartX;
            if (dragDistance > 10) {
                // Only create guide if dragged right enough
                // Calculate the X position for the vertical guide
                const rect = e.currentTarget.getBoundingClientRect();
                const canvasX = (e.clientX - rect.right) / viewport.zoom;

                // Create vertical guide
                const guide = createManualGuide("vertical", canvasX);
                addManualGuide(guide);
            }

            setIsDragging(false);
            setDragStartX(0);
        },
        [isDragging, dragStartX, viewport.zoom, addManualGuide]
    );

    // Render tick marks and labels
    const renderTicks = () => {
        return ticks.map((tick: RulerTick, index: number) => {
            const screenY = canvasToScreenCoordinate(tick.position, viewport, "y");

            // Skip ticks outside the visible area
            if (screenY < 0 || screenY > height) {
                return null;
            }

            const tickWidth = tick.type === "major" ? width * 0.8 : width * 0.4;
            const tickX = width - tickWidth;

            return (
                <g key={`tick-${index}`} className={`ruler-tick ruler-tick--${tick.type}`}>
                    {/* Tick line */}
                    <line x1={tickX} y1={screenY} x2={width} y2={screenY} className="ruler-tick-line" />

                    {/* Label for major ticks */}
                    {tick.type === "major" && tick.label && (
                        <text
                            x={tickX - 2}
                            y={screenY}
                            className="ruler-label ruler-label--vertical"
                            textAnchor="end"
                            dominantBaseline="central">
                            {tick.label}
                        </text>
                    )}
                </g>
            );
        });
    };

    return (
        <div className={`vertical-ruler ${className || ""}`}>
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

                {/* Right border line */}
                <line x1={width} y1={0} x2={width} y2={height} className="ruler-border" />
            </svg>
        </div>
    );
};
