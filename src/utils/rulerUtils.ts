/**
 * Ruler and measurement utilities for the visual editor
 * Provides functionality for rulers, tick marks, and distance measurements
 */

import type { Point, ViewportState, CanvasObject, Bounds } from "../types/editor";

export type UnitType = "px" | "pt" | "in" | "cm" | "mm";

export interface RulerTick {
    position: number;
    type: "major" | "minor" | "label";
    label?: string;
}

export interface MeasurementOptions {
    unit: UnitType;
    precision: number;
    showLabels: boolean;
}

export interface RulerOptions {
    unit: UnitType;
    majorTickInterval: number;
    minorTicksPerMajor: number;
    showLabels: boolean;
    thickness: number;
}

export interface DistanceMeasurement {
    id: string;
    startPoint: Point;
    endPoint: Point;
    distance: number;
    formattedDistance: string;
    angle: number; // In degrees
    midpoint: Point;
}

/**
 * Unit conversion functions
 */
export const UNIT_CONVERSIONS: Record<UnitType, number> = {
    px: 1, // Base unit: pixels
    pt: 1.333, // Points (1 pt = 1.333 px at 96 DPI)
    in: 96, // Inches (1 in = 96 px at 96 DPI)
    cm: 37.795, // Centimeters (1 cm = 37.795 px at 96 DPI)
    mm: 3.7795, // Millimeters (1 mm = 3.7795 px at 96 DPI)
};

export const UNIT_LABELS: Record<UnitType, string> = {
    px: "px",
    pt: "pt",
    in: "in",
    cm: "cm",
    mm: "mm",
};

/**
 * Convert pixels to specified unit
 */
export function convertPixelsToUnit(pixels: number, unit: UnitType): number {
    return pixels / UNIT_CONVERSIONS[unit];
}

/**
 * Convert from specified unit to pixels
 */
export function convertUnitToPixels(value: number, unit: UnitType): number {
    return value * UNIT_CONVERSIONS[unit];
}

/**
 * Format distance value with appropriate precision and unit label
 */
export function formatDistance(pixels: number, unit: UnitType, precision: number = 1): string {
    const converted = convertPixelsToUnit(pixels, unit);
    const rounded = Number(converted.toFixed(precision));
    return `${rounded}${UNIT_LABELS[unit]}`;
}

/**
 * Calculate optimal tick intervals based on zoom level and unit
 */
export function calculateTickInterval(unit: UnitType, zoom: number, minPixelInterval: number = 50): number {
    const baseInterval = convertUnitToPixels(1, unit);
    const scaledInterval = baseInterval * zoom;

    // Find appropriate multiplier to get nice intervals
    const multipliers = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

    for (const multiplier of multipliers) {
        const interval = scaledInterval * multiplier;
        if (interval >= minPixelInterval) {
            return convertUnitToPixels(multiplier, unit);
        }
    }

    // Fallback to largest multiplier
    return convertUnitToPixels(100, unit);
}

/**
 * Generate ruler ticks for a given range and interval
 */
export function generateRulerTicks(
    start: number,
    end: number,
    options: RulerOptions,
    viewport: ViewportState
): RulerTick[] {
    const ticks: RulerTick[] = [];
    const interval = calculateTickInterval(options.unit, viewport.zoom);
    const minorInterval = interval / options.minorTicksPerMajor;

    // Calculate start position aligned to grid
    const alignedStart = Math.floor(start / interval) * interval;

    // Generate major ticks
    for (let pos = alignedStart; pos <= end; pos += interval) {
        if (pos >= start) {
            ticks.push({
                position: pos,
                type: "major",
                label: options.showLabels ? formatDistance(pos, options.unit, 0) : undefined,
            });
        }
    }

    // Generate minor ticks
    if (options.minorTicksPerMajor > 1) {
        for (let pos = alignedStart; pos <= end; pos += minorInterval) {
            if (pos >= start && !ticks.some((tick) => Math.abs(tick.position - pos) < 0.1)) {
                ticks.push({
                    position: pos,
                    type: "minor",
                });
            }
        }
    }

    return ticks.sort((a, b) => a.position - b.position);
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points in degrees
 */
export function calculateAngle(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const radians = Math.atan2(dy, dx);
    return radians * (180 / Math.PI);
}

/**
 * Calculate midpoint between two points
 */
export function calculateMidpoint(point1: Point, point2: Point): Point {
    return {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2,
    };
}

/**
 * Get object bounds in canvas coordinates
 */
export function getObjectBounds(object: CanvasObject): Bounds {
    const { transform } = object;

    let width = 0;
    let height = 0;

    switch (object.type) {
        case "rectangle":
            width = object.width;
            height = object.height;
            break;
        case "circle":
            width = height = object.radius * 2;
            break;
        case "text":
            // Approximate text bounds - would need actual text metrics in real implementation
            width = object.content.length * object.style.fontSize * 0.6;
            height = object.style.fontSize * object.style.lineHeight;
            break;
        case "path":
            // For paths, we'd need to calculate actual path bounds
            // This is a simplified version
            width = 100;
            height = 100;
            break;
        default:
            width = height = 50;
    }

    return {
        x: transform.x,
        y: transform.y,
        width: width * transform.scaleX,
        height: height * transform.scaleY,
    };
}

/**
 * Create measurement between two objects
 */
export function createObjectMeasurement(
    object1: CanvasObject,
    object2: CanvasObject,
    measurementId: string,
    unit: UnitType = "px"
): DistanceMeasurement {
    const bounds1 = getObjectBounds(object1);
    const bounds2 = getObjectBounds(object2);

    // Calculate center points
    const center1: Point = {
        x: bounds1.x + bounds1.width / 2,
        y: bounds1.y + bounds1.height / 2,
    };

    const center2: Point = {
        x: bounds2.x + bounds2.width / 2,
        y: bounds2.y + bounds2.height / 2,
    };

    const distance = calculateDistance(center1, center2);
    const angle = calculateAngle(center1, center2);
    const midpoint = calculateMidpoint(center1, center2);

    return {
        id: measurementId,
        startPoint: center1,
        endPoint: center2,
        distance,
        formattedDistance: formatDistance(distance, unit, 1),
        angle,
        midpoint,
    };
}

/**
 * Create measurement from point to point
 */
export function createPointMeasurement(
    point1: Point,
    point2: Point,
    measurementId: string,
    unit: UnitType = "px"
): DistanceMeasurement {
    const distance = calculateDistance(point1, point2);
    const angle = calculateAngle(point1, point2);
    const midpoint = calculateMidpoint(point1, point2);

    return {
        id: measurementId,
        startPoint: point1,
        endPoint: point2,
        distance,
        formattedDistance: formatDistance(distance, unit, 1),
        angle,
        midpoint,
    };
}

/**
 * Screen coordinates to canvas coordinates conversion for rulers
 */
export function screenToCanvasCoordinate(screenPos: number, viewport: ViewportState, axis: "x" | "y"): number {
    if (axis === "x") {
        return screenPos / viewport.zoom - viewport.panX / viewport.zoom;
    } else {
        return screenPos / viewport.zoom - viewport.panY / viewport.zoom;
    }
}

/**
 * Canvas coordinates to screen coordinates conversion for rulers
 */
export function canvasToScreenCoordinate(canvasPos: number, viewport: ViewportState, axis: "x" | "y"): number {
    if (axis === "x") {
        return (canvasPos + viewport.panX / viewport.zoom) * viewport.zoom;
    } else {
        return (canvasPos + viewport.panY / viewport.zoom) * viewport.zoom;
    }
}

/**
 * Default ruler options
 */
export const DEFAULT_RULER_OPTIONS: RulerOptions = {
    unit: "px",
    majorTickInterval: 50,
    minorTicksPerMajor: 5,
    showLabels: true,
    thickness: 20,
};

/**
 * Default measurement options
 */
export const DEFAULT_MEASUREMENT_OPTIONS: MeasurementOptions = {
    unit: "px",
    precision: 1,
    showLabels: true,
};
