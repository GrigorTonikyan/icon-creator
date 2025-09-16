/**
 * MeasurementIndicator component
 * Shows distance measurements between selected objects
 */

import React from "react";
import { type ViewportState, type RulersState, type CanvasObject } from "../../types/editor";
import {
    createObjectMeasurement,
    createPointMeasurement,
    canvasToScreenCoordinate,
    type DistanceMeasurement,
} from "../../utils/rulerUtils";
import "./measurementIndicator.css";

interface MeasurementIndicatorProps {
    viewport: ViewportState;
    rulers: RulersState;
    selectedObjects: CanvasObject[];
    className?: string;
}

export const MeasurementIndicator: React.FC<MeasurementIndicatorProps> = ({
    viewport,
    rulers,
    selectedObjects,
    className,
}) => {
    if (!rulers.visible || !rulers.showMeasurements || selectedObjects.length < 2) {
        return null;
    }

    // Generate measurements between all pairs of selected objects
    const measurements: DistanceMeasurement[] = [];

    for (let i = 0; i < selectedObjects.length - 1; i++) {
        for (let j = i + 1; j < selectedObjects.length; j++) {
            const object1 = selectedObjects[i];
            const object2 = selectedObjects[j];
            const measurementId = `${object1.id}-${object2.id}`;

            const measurement = createObjectMeasurement(object1, object2, measurementId, rulers.unit);

            measurements.push(measurement);
        }
    }

    // Render measurement lines and labels
    const renderMeasurements = () => {
        return measurements.map((measurement) => {
            // Convert canvas coordinates to screen coordinates
            const startScreenX = canvasToScreenCoordinate(measurement.startPoint.x, viewport, "x");
            const startScreenY = canvasToScreenCoordinate(measurement.startPoint.y, viewport, "y");
            const endScreenX = canvasToScreenCoordinate(measurement.endPoint.x, viewport, "x");
            const endScreenY = canvasToScreenCoordinate(measurement.endPoint.y, viewport, "y");
            const midScreenX = canvasToScreenCoordinate(measurement.midpoint.x, viewport, "x");
            const midScreenY = canvasToScreenCoordinate(measurement.midpoint.y, viewport, "y");

            // Calculate line length and angle for label positioning
            const lineLength = Math.sqrt(
                Math.pow(endScreenX - startScreenX, 2) + Math.pow(endScreenY - startScreenY, 2)
            );

            // Don't render very short measurements (less than 10 pixels on screen)
            if (lineLength < 10) {
                return null;
            }

            // Calculate label rotation to align with measurement line
            const labelAngle = Math.atan2(endScreenY - startScreenY, endScreenX - startScreenX) * (180 / Math.PI);

            // Normalize angle to keep text readable
            const normalizedAngle = (labelAngle + 360) % 360;
            const shouldFlip = normalizedAngle > 90 && normalizedAngle < 270;
            const finalAngle = shouldFlip ? normalizedAngle - 180 : normalizedAngle;

            return (
                <g key={measurement.id} className="measurement-indicator">
                    {/* Measurement line */}
                    <line
                        x1={startScreenX}
                        y1={startScreenY}
                        x2={endScreenX}
                        y2={endScreenY}
                        className="measurement-line"
                        markerStart="url(#measurement-arrow)"
                        markerEnd="url(#measurement-arrow)"
                    />

                    {/* Start point indicator */}
                    <circle cx={startScreenX} cy={startScreenY} r={2} className="measurement-point" />

                    {/* End point indicator */}
                    <circle cx={endScreenX} cy={endScreenY} r={2} className="measurement-point" />

                    {/* Distance label */}
                    <text
                        x={midScreenX}
                        y={midScreenY}
                        className="measurement-label"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${finalAngle}, ${midScreenX}, ${midScreenY})`}>
                        <tspan className="measurement-label-bg">{measurement.formattedDistance}</tspan>
                    </text>
                </g>
            );
        });
    };

    return (
        <div className={`measurement-indicators ${className || ""}`}>
            <svg
                className="measurement-svg"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 5,
                }}>
                {/* Define arrow markers for measurement lines */}
                <defs>
                    <marker
                        id="measurement-arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto"
                        className="measurement-arrow-marker">
                        <path d="M 0 0 L 10 5 L 0 10 Z" className="measurement-arrow-path" />
                    </marker>
                </defs>

                {/* Render all measurements */}
                <g className="measurements-group">{renderMeasurements()}</g>
            </svg>
        </div>
    );
};
