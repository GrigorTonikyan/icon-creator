/**
 * Grid and snapping utilities for precise object positioning
 */

export interface GridSnapResult {
    x: number;
    y: number;
    snapped: boolean;
}

export interface SnapOptions {
    snapToGrid: boolean;
    gridSize: number;
    threshold?: number; // Distance within which snapping occurs
}

/**
 * Snaps a point to the nearest grid intersection
 */
export function snapToGrid(x: number, y: number, gridSize: number): { x: number; y: number } {
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    return { x: snappedX, y: snappedY };
}

/**
 * Snaps a point conditionally based on snap options
 */
export function snapPoint(x: number, y: number, options: SnapOptions): GridSnapResult {
    if (!options.snapToGrid) {
        return { x, y, snapped: false };
    }

    const snapped = snapToGrid(x, y, options.gridSize);
    return { x: snapped.x, y: snapped.y, snapped: true };
}

/**
 * Snaps a rectangle's position and size to grid
 */
export function snapRectangle(x: number, y: number, width: number, height: number, options: SnapOptions) {
    if (!options.snapToGrid) {
        return { x, y, width, height, snapped: false };
    }

    // Snap position to grid
    const snappedPos = snapToGrid(x, y, options.gridSize);

    // Snap size to grid multiples (ensuring minimum size)
    const minSize = options.gridSize;
    const snappedWidth = Math.max(minSize, Math.round(width / options.gridSize) * options.gridSize);
    const snappedHeight = Math.max(minSize, Math.round(height / options.gridSize) * options.gridSize);

    return {
        x: snappedPos.x,
        y: snappedPos.y,
        width: snappedWidth,
        height: snappedHeight,
        snapped: true,
    };
}

/**
 * Snaps a circle's center and radius to grid
 */
export function snapCircle(centerX: number, centerY: number, radius: number, options: SnapOptions) {
    if (!options.snapToGrid) {
        return { centerX, centerY, radius, snapped: false };
    }

    // Snap center to grid
    const snappedCenter = snapToGrid(centerX, centerY, options.gridSize);

    // Snap radius to grid multiples (ensuring minimum radius)
    const minRadius = options.gridSize / 2;
    const snappedRadius = Math.max(minRadius, Math.round(radius / (options.gridSize / 2)) * (options.gridSize / 2));

    return {
        centerX: snappedCenter.x,
        centerY: snappedCenter.y,
        radius: snappedRadius,
        snapped: true,
    };
}

/**
 * Checks if snapping should be temporarily disabled (e.g., when holding Ctrl/Cmd)
 */
export function shouldDisableSnap(event: MouseEvent | KeyboardEvent): boolean {
    return event.ctrlKey || event.metaKey;
}

/**
 * Converts screen coordinates to canvas coordinates (accounting for viewport transform)
 */
export function screenToCanvas(
    screenX: number,
    screenY: number,
    viewportState: { x: number; y: number; zoom: number }
): { x: number; y: number } {
    return {
        x: (screenX - viewportState.x) / viewportState.zoom,
        y: (screenY - viewportState.y) / viewportState.zoom,
    };
}

/**
 * Provides visual feedback for snapping operations
 */
export function getSnapIndicators(
    originalPoint: { x: number; y: number },
    snappedPoint: { x: number; y: number },
    gridSize: number
): Array<{ type: "vertical" | "horizontal"; position: number }> {
    const indicators: Array<{ type: "vertical" | "horizontal"; position: number }> = [];

    if (Math.abs(originalPoint.x - snappedPoint.x) > 0.1) {
        indicators.push({ type: "vertical", position: snappedPoint.x });
    }

    if (Math.abs(originalPoint.y - snappedPoint.y) > 0.1) {
        indicators.push({ type: "horizontal", position: snappedPoint.y });
    }

    return indicators;
}
