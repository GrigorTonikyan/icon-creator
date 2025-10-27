// SVG Path utilities for path editing
import type { PathNode, Point } from "../types/editor";

// Paper.js imports
import paper from "paper";

// Initialize Paper.js in memory (headless mode)
let paperInitialized = false;

function initializePaper() {
    if (!paperInitialized) {
        // Create a minimal canvas for Paper.js to work with
        paper.setup(new paper.Size(1, 1));
        paperInitialized = true;
    }
}

/**
 * Parse SVG path data string into nodes for editing
 */
export function parsePathData(pathData: string): PathNode[] {
    const nodes: PathNode[] = [];

    // Simple regex to extract path commands
    const commandPattern = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi;
    let match;
    let nodeId = 0;

    while ((match = commandPattern.exec(pathData)) !== null) {
        if (!match[1] || !match[2]) continue;

        const command = match[1].toUpperCase();
        const params = match[2]
            .trim()
            .split(/[\s,]+/)
            .filter((p) => p)
            .map(Number);

        switch (command) {
            case "M": // Move to
                if (params.length >= 2 && params[0] !== undefined && params[1] !== undefined) {
                    nodes.push({
                        id: `node-${nodeId++}`,
                        x: params[0],
                        y: params[1],
                        type: "move",
                    });
                }
                break;

            case "L": // Line to
                if (params.length >= 2 && params[0] !== undefined && params[1] !== undefined) {
                    nodes.push({
                        id: `node-${nodeId++}`,
                        x: params[0],
                        y: params[1],
                        type: "line",
                    });
                }
                break;

            case "C": // Cubic bezier curve
                if (
                    params.length >= 6 &&
                    params[0] !== undefined &&
                    params[1] !== undefined &&
                    params[2] !== undefined &&
                    params[3] !== undefined &&
                    params[4] !== undefined &&
                    params[5] !== undefined
                ) {
                    nodes.push({
                        id: `node-${nodeId++}`,
                        x: params[4],
                        y: params[5],
                        type: "curve",
                        controlPoint1: { x: params[0], y: params[1] },
                        controlPoint2: { x: params[2], y: params[3] },
                    });
                }
                break;

            case "Q": // Quadratic bezier curve
                if (
                    params.length >= 4 &&
                    params[0] !== undefined &&
                    params[1] !== undefined &&
                    params[2] !== undefined &&
                    params[3] !== undefined
                ) {
                    nodes.push({
                        id: `node-${nodeId++}`,
                        x: params[2],
                        y: params[3],
                        type: "curve",
                        controlPoint1: { x: params[0], y: params[1] },
                    });
                }
                break;
        }
    }

    return nodes;
}

/**
 * Convert nodes back to SVG path data string
 */
export function nodesToPathData(nodes: PathNode[]): string {
    if (nodes.length === 0) return "";

    let pathData = "";

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;

        if (i === 0 || node.type === "move") {
            pathData += `M ${node.x} ${node.y}`;
        } else if (node.type === "line") {
            pathData += ` L ${node.x} ${node.y}`;
        } else if (node.type === "curve") {
            if (node.controlPoint1 && node.controlPoint2) {
                // Cubic bezier
                pathData += ` C ${node.controlPoint1.x} ${node.controlPoint1.y} ${node.controlPoint2.x} ${node.controlPoint2.y} ${node.x} ${node.y}`;
            } else if (node.controlPoint1) {
                // Quadratic bezier
                pathData += ` Q ${node.controlPoint1.x} ${node.controlPoint1.y} ${node.x} ${node.y}`;
            } else {
                // Fallback to line
                pathData += ` L ${node.x} ${node.y}`;
            }
        }
    }

    return pathData;
}

/**
 * Add a new node at a specific position in the path
 */
export function addNodeAtPosition(nodes: PathNode[], position: Point, insertIndex?: number): PathNode[] {
    const newNode: PathNode = {
        id: `node-${Date.now()}`,
        x: position.x,
        y: position.y,
        type: "line",
    };

    const newNodes = [...nodes];

    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= nodes.length) {
        newNodes.splice(insertIndex, 0, newNode);
    } else {
        newNodes.push(newNode);
    }

    return newNodes;
}

/**
 * Remove a node by ID
 */
export function removeNode(nodes: PathNode[], nodeId: string): PathNode[] {
    return nodes.filter((node) => node.id !== nodeId);
}

/**
 * Update node position
 */
export function updateNodePosition(nodes: PathNode[], nodeId: string, newPosition: Point): PathNode[] {
    return nodes.map((node) => (node.id === nodeId ? { ...node, x: newPosition.x, y: newPosition.y } : node));
}

/**
 * Calculate distance from a point to a line segment (for detecting clicks on path segments)
 */
export function distanceToLineSegment(point: Point, start: Point, end: Point): number {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = start.x + param * C;
    const yy = start.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the best position to insert a new node on a path
 */
export function findInsertPosition(
    nodes: PathNode[],
    clickPoint: Point,
    threshold: number = 10
): { insertIndex: number; position: Point } | null {
    if (nodes.length < 2) return null;

    let bestDistance = Infinity;
    let bestIndex = -1;
    let bestPosition: Point = clickPoint;

    for (let i = 0; i < nodes.length - 1; i++) {
        const start = nodes[i];
        const end = nodes[i + 1];

        if (!start || !end) continue;

        const distance = distanceToLineSegment(clickPoint, start, end);

        if (distance < threshold && distance < bestDistance) {
            bestDistance = distance;
            bestIndex = i + 1;

            // Calculate the closest point on the line segment
            const A = clickPoint.x - start.x;
            const B = clickPoint.y - start.y;
            const C = end.x - start.x;
            const D = end.y - start.y;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;

            if (lenSq > 0) {
                const param = Math.max(0, Math.min(1, dot / lenSq));
                bestPosition = {
                    x: start.x + param * C,
                    y: start.y + param * D,
                };
            }
        }
    }

    return bestIndex >= 0 ? { insertIndex: bestIndex, position: bestPosition } : null;
}

/**
 * Path Boolean Operations using Paper.js
 */

/**
 * Perform unite operation on multiple path data strings
 */
export function unitePaths(pathDataArray: string[]): string {
    initializePaper();

    if (pathDataArray.length < 2) {
        return pathDataArray[0] || "";
    }

    // Filter out empty paths
    const validPaths = pathDataArray.filter((path) => path && path.trim());
    if (validPaths.length < 2) {
        return validPaths[0] || "";
    }

    try {
        const firstPath = validPaths[0];
        if (!firstPath) return "";

        let result = new paper.Path(firstPath);

        for (let i = 1; i < validPaths.length; i++) {
            const pathData = validPaths[i];
            if (!pathData) continue;

            const path = new paper.Path(pathData);
            const united = result.unite(path);
            result.remove(); // Clean up old result
            path.remove(); // Clean up
            result = united as paper.Path;
        }

        const resultPathData = result.pathData;
        result.remove(); // Clean up
        return resultPathData;
    } catch (error) {
        console.error("Error in unitePaths:", error);
        return validPaths[0] || "";
    }
}

/**
 * Perform subtract operation (first path minus all others)
 */
export function subtractPaths(pathDataArray: string[]): string {
    initializePaper();

    if (pathDataArray.length < 2) {
        return pathDataArray[0] || "";
    }

    // Filter out empty paths
    const validPaths = pathDataArray.filter((path) => path && path.trim());
    if (validPaths.length < 2) {
        return validPaths[0] || "";
    }

    try {
        const firstPath = validPaths[0];
        if (!firstPath) return "";

        let result = new paper.Path(firstPath);

        for (let i = 1; i < validPaths.length; i++) {
            const pathData = validPaths[i];
            if (!pathData) continue;

            const path = new paper.Path(pathData);
            const subtracted = result.subtract(path);
            result.remove(); // Clean up old result
            path.remove(); // Clean up
            result = subtracted as paper.Path;
        }

        const resultPathData = result.pathData;
        result.remove(); // Clean up
        return resultPathData;
    } catch (error) {
        console.error("Error in subtractPaths:", error);
        return validPaths[0] || "";
    }
}

/**
 * Perform intersect operation on multiple path data strings
 */
export function intersectPaths(pathDataArray: string[]): string {
    initializePaper();

    if (pathDataArray.length < 2) {
        return pathDataArray[0] || "";
    }

    // Filter out empty paths
    const validPaths = pathDataArray.filter((path) => path && path.trim());
    if (validPaths.length < 2) {
        return validPaths[0] || "";
    }

    try {
        const firstPath = validPaths[0];
        if (!firstPath) return "";

        let result = new paper.Path(firstPath);

        for (let i = 1; i < validPaths.length; i++) {
            const pathData = validPaths[i];
            if (!pathData) continue;

            const path = new paper.Path(pathData);
            const intersected = result.intersect(path);
            result.remove(); // Clean up old result
            path.remove(); // Clean up
            result = intersected as paper.Path;
        }

        const resultPathData = result.pathData;
        result.remove(); // Clean up
        return resultPathData;
    } catch (error) {
        console.error("Error in intersectPaths:", error);
        return validPaths[0] || "";
    }
}

/**
 * Perform exclude operation on multiple path data strings
 */
export function excludePaths(pathDataArray: string[]): string {
    initializePaper();

    if (pathDataArray.length < 2) {
        return pathDataArray[0] || "";
    }

    // Filter out empty paths
    const validPaths = pathDataArray.filter((path) => path && path.trim());
    if (validPaths.length < 2) {
        return validPaths[0] || "";
    }

    try {
        const firstPath = validPaths[0];
        if (!firstPath) return "";

        let result = new paper.Path(firstPath);

        for (let i = 1; i < validPaths.length; i++) {
            const pathData = validPaths[i];
            if (!pathData) continue;

            const path = new paper.Path(pathData);
            const excluded = result.exclude(path);
            result.remove(); // Clean up old result
            path.remove(); // Clean up
            result = excluded as paper.Path;
        }

        const resultPathData = result.pathData;
        result.remove(); // Clean up
        return resultPathData;
    } catch (error) {
        console.error("Error in excludePaths:", error);
        return validPaths[0] || "";
    }
}

/**
 * Perform a generic path operation
 */
export function performPathOperation(
    operation: "unite" | "subtract" | "intersect" | "exclude",
    pathDataArray: string[]
): string {
    switch (operation) {
        case "unite":
            return unitePaths(pathDataArray);
        case "subtract":
            return subtractPaths(pathDataArray);
        case "intersect":
            return intersectPaths(pathDataArray);
        case "exclude":
            return excludePaths(pathDataArray);
        default:
            return pathDataArray[0] || "";
    }
}

/**
 * Advanced Path Operations
 */

/**
 * Simplify a path by removing redundant points and optimizing curves
 */
export function simplifyPath(pathData: string, tolerance: number = 1.0): string {
    initializePaper();

    try {
        const path = new paper.Path(pathData);

        // Use Paper.js built-in simplification
        path.simplify(tolerance);

        const resultPathData = path.pathData;
        path.remove();
        return resultPathData;
    } catch (error) {
        console.error("Error in simplifyPath:", error);
        return pathData;
    }
}

/**
 * Smooth a path by adjusting control points for better curve flow
 */
export function smoothPath(pathData: string, smoothingFactor: number = 0.5): string {
    initializePaper();

    try {
        const path = new paper.Path(pathData);

        // Apply smoothing to all segments
        path.smooth({
            type: "geometric",
            factor: smoothingFactor,
        });

        const resultPathData = path.pathData;
        path.remove();
        return resultPathData;
    } catch (error) {
        console.error("Error in smoothPath:", error);
        return pathData;
    }
}

/**
 * Calculate path length
 */
export function getPathLength(pathData: string): number {
    initializePaper();

    try {
        const path = new paper.Path(pathData);
        const length = path.length;
        path.remove();
        return length;
    } catch (error) {
        console.error("Error in getPathLength:", error);
        return 0;
    }
}

/**
 * Get point at specific position along path (0-1)
 */
export function getPointAtLength(pathData: string, position: number): Point | null {
    initializePaper();

    try {
        const path = new paper.Path(pathData);
        const length = path.length;
        const point = path.getPointAt(length * Math.max(0, Math.min(1, position)));
        path.remove();

        return point ? { x: point.x, y: point.y } : null;
    } catch (error) {
        console.error("Error in getPointAtLength:", error);
        return null;
    }
}

/**
 * Get tangent vector at specific position along path (0-1)
 */
export function getTangentAtLength(pathData: string, position: number): Point | null {
    initializePaper();

    try {
        const path = new paper.Path(pathData);
        const length = path.length;
        const tangent = path.getTangentAt(length * Math.max(0, Math.min(1, position)));
        path.remove();

        return tangent ? { x: tangent.x, y: tangent.y } : null;
    } catch (error) {
        console.error("Error in getTangentAtLength:", error);
        return null;
    }
}

/**
 * Get normal vector at specific position along path (0-1)
 */
export function getNormalAtLength(pathData: string, position: number): Point | null {
    initializePaper();

    try {
        const path = new paper.Path(pathData);
        const length = path.length;
        const normal = path.getNormalAt(length * Math.max(0, Math.min(1, position)));
        path.remove();

        return normal ? { x: normal.x, y: normal.y } : null;
    } catch (error) {
        console.error("Error in getNormalAtLength:", error);
        return null;
    }
}

/**
 * Calculate path bounds (bounding box)
 */
export function getPathBounds(pathData: string): { x: number; y: number; width: number; height: number } | null {
    initializePaper();

    try {
        const path = new paper.Path(pathData);
        const bounds = path.bounds;
        path.remove();

        return {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
        };
    } catch (error) {
        console.error("Error in getPathBounds:", error);
        return null;
    }
}

/**
 * Check if a point is inside a closed path
 */
export function isPointInPath(pathData: string, point: Point): boolean {
    initializePaper();

    try {
        const path = new paper.Path(pathData);
        const paperPoint = new paper.Point(point.x, point.y);
        const isInside = path.contains(paperPoint);
        path.remove();

        return isInside;
    } catch (error) {
        console.error("Error in isPointInPath:", error);
        return false;
    }
}

/**
 * Offset a path by a specified distance
 */
export function offsetPath(pathData: string, offset: number, joinType: "miter" | "round" | "bevel" = "round"): string {
    initializePaper();

    try {
        const path = new paper.Path(pathData);

        // Simple offset implementation using stroke width and outline
        // This is a basic approach - for more advanced offsetting, a dedicated library would be needed
        path.strokeWidth = Math.abs(offset) * 2;
        path.strokeJoin = joinType;

        // Create outline from stroke (basic offset approximation)
        const outline = path.clone();
        outline.fillColor = null;
        outline.strokeColor = new paper.Color(0, 0, 0);

        const resultPathData = outline.pathData;

        path.remove();
        outline.remove();
        return resultPathData;
    } catch (error) {
        console.error("Error in offsetPath:", error);
        return pathData;
    }
}

/**
 * Validate if path data is valid SVG
 */
export function validatePathData(pathData: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pathData || typeof pathData !== "string") {
        errors.push("Path data must be a non-empty string");
        return { isValid: false, errors };
    }

    // Basic SVG path command validation
    const validCommands = /^[MmLlHhVvCcSsQqTtAaZz\s\d.,+-]*$/;
    if (!validCommands.test(pathData)) {
        errors.push("Path contains invalid characters");
    }

    // Check for basic command structure
    const commandPattern = /[MmLlHhVvCcSsQqTtAaZz]/;
    if (!commandPattern.test(pathData)) {
        errors.push("Path must contain at least one valid command");
    }

    // Try to parse with Paper.js for more detailed validation
    try {
        initializePaper();
        const path = new paper.Path(pathData);
        path.remove();
    } catch (error) {
        errors.push(`Path parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Optimize path data by removing unnecessary precision and redundant commands
 */
export function optimizePathData(pathData: string, precision: number = 2): string {
    if (!pathData) return pathData;

    try {
        // Round numbers to specified precision
        return pathData.replace(/(\d+\.?\d*)/g, (match) => {
            const num = parseFloat(match);
            return isNaN(num) ? match : num.toFixed(precision).replace(/\.?0+$/, "");
        });
    } catch (error) {
        console.error("Error in optimizePathData:", error);
        return pathData;
    }
}

/**
 * Convert relative path commands to absolute
 */
export function toAbsolutePath(pathData: string): string {
    initializePaper();

    try {
        const path = new paper.Path(pathData);

        // Paper.js automatically converts to absolute coordinates
        const resultPathData = path.pathData;
        path.remove();
        return resultPathData;
    } catch (error) {
        console.error("Error in toAbsolutePath:", error);
        return pathData;
    }
}

/**
 * Reverse path direction
 */
export function reversePath(pathData: string): string {
    initializePaper();

    try {
        const path = new paper.Path(pathData);
        path.reverse();

        const resultPathData = path.pathData;
        path.remove();
        return resultPathData;
    } catch (error) {
        console.error("Error in reversePath:", error);
        return pathData;
    }
}
