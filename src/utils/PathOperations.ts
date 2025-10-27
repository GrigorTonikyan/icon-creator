import type { PathObject, PathOperation, PathOperationType, Point } from "../types/editor";
import {
    parsePathData,
    nodesToPathData,
    performPathOperation,
    simplifyPath,
    smoothPath,
    getPathLength,
    getPointAtLength,
    getTangentAtLength,
    getNormalAtLength,
    getPathBounds,
    isPointInPath,
    offsetPath,
    validatePathData,
    optimizePathData,
    toAbsolutePath,
    reversePath,
} from "./pathUtils";

/**
 * Advanced Path Operations Manager
 * Provides high-level interface for complex path manipulations with validation and error handling
 */
export class PathOperations {
    private static instance: PathOperations;

    public static getInstance(): PathOperations {
        if (!PathOperations.instance) {
            PathOperations.instance = new PathOperations();
        }
        return PathOperations.instance;
    }

    /**
     * Perform boolean operations on multiple path objects
     */
    performBooleanOperation(
        operation: PathOperationType,
        paths: PathObject[]
    ): { success: boolean; result?: PathObject; error?: string } {
        try {
            // Validate inputs
            if (!paths || paths.length < 2) {
                return { success: false, error: "At least two paths required for boolean operations" };
            }

            // Validate all path data
            const validationResults = paths.map((path) => validatePathData(path.pathData));
            const invalidPaths = validationResults.filter((result) => !result.isValid);

            if (invalidPaths.length > 0) {
                return {
                    success: false,
                    error: `Invalid path data: ${invalidPaths.map((r) => r.errors.join(", ")).join("; ")}`,
                };
            }

            // Extract path data strings
            const pathDataArray = paths.map((path) => path.pathData);

            // Perform the operation
            const resultPathData = performPathOperation(operation, pathDataArray);

            if (!resultPathData) {
                return { success: false, error: "Path operation returned empty result" };
            }

            // Create result path object
            const resultPath: PathObject = {
                id: `path-${Date.now()}`,
                type: "path",
                name: `${operation}-result`,
                transform: {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                },
                visible: true,
                locked: false,
                opacity: paths[0]?.opacity || 1,
                zIndex: 0,
                layerId: paths[0]?.layerId || "default",
                pathData: resultPathData,
                style: {
                    fill: paths[0]?.style?.fill || "#000000",
                    stroke: paths[0]?.style?.stroke || "none",
                    strokeWidth: paths[0]?.style?.strokeWidth || 0,
                },
            };

            // Update bounds based on actual path
            const bounds = getPathBounds(resultPathData);
            if (bounds) {
                resultPath.transform.x = bounds.x;
                resultPath.transform.y = bounds.y;
            }

            return { success: true, result: resultPath };
        } catch (error) {
            return {
                success: false,
                error: `Boolean operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Simplify path with advanced options
     */
    simplifyPath(
        path: PathObject,
        options: {
            tolerance?: number;
            preserveCorners?: boolean;
            optimize?: boolean;
            precision?: number;
        } = {}
    ): { success: boolean; result?: PathObject; error?: string } {
        try {
            const { tolerance = 1.0, optimize = true, precision = 2 } = options;

            // Validate path data
            const validation = validatePathData(path.pathData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid path data: ${validation.errors.join(", ")}` };
            }

            // Apply simplification
            let resultPathData = simplifyPath(path.pathData, tolerance);

            // Optimize if requested
            if (optimize) {
                resultPathData = optimizePathData(resultPathData, precision);
            }

            // Create result path
            const resultPath: PathObject = {
                ...path,
                id: `${path.id}-simplified`,
                pathData: resultPathData,
                name: `${path.name || "path"}-simplified`,
            };

            // Update bounds
            const bounds = getPathBounds(resultPathData);
            if (bounds) {
                resultPath.transform.x = bounds.x;
                resultPath.transform.y = bounds.y;
            }

            return { success: true, result: resultPath };
        } catch (error) {
            return {
                success: false,
                error: `Path simplification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Smooth path with advanced options
     */
    smoothPath(
        path: PathObject,
        options: {
            smoothingFactor?: number;
            preserveEnds?: boolean;
            optimize?: boolean;
        } = {}
    ): { success: boolean; result?: PathObject; error?: string } {
        try {
            const { smoothingFactor = 0.5, optimize = true } = options;

            // Validate path data
            const validation = validatePathData(path.pathData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid path data: ${validation.errors.join(", ")}` };
            }

            // Apply smoothing
            let resultPathData = smoothPath(path.pathData, smoothingFactor);

            // Optimize if requested
            if (optimize) {
                resultPathData = optimizePathData(resultPathData);
            }

            // Create result path
            const resultPath: PathObject = {
                ...path,
                id: `${path.id}-smoothed`,
                pathData: resultPathData,
                name: `${path.name || "path"}-smoothed`,
            };

            // Update bounds
            const bounds = getPathBounds(resultPathData);
            if (bounds) {
                resultPath.transform.x = bounds.x;
                resultPath.transform.y = bounds.y;
            }

            return { success: true, result: resultPath };
        } catch (error) {
            return {
                success: false,
                error: `Path smoothing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Offset path with advanced options
     */
    offsetPath(
        path: PathObject,
        offset: number,
        options: {
            joinType?: "miter" | "round" | "bevel";
            optimize?: boolean;
        } = {}
    ): { success: boolean; result?: PathObject; error?: string } {
        try {
            const { joinType = "round", optimize = true } = options;

            // Validate path data
            const validation = validatePathData(path.pathData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid path data: ${validation.errors.join(", ")}` };
            }

            // Apply offset
            let resultPathData = offsetPath(path.pathData, offset, joinType);

            // Optimize if requested
            if (optimize) {
                resultPathData = optimizePathData(resultPathData);
            }

            // Create result path
            const resultPath: PathObject = {
                ...path,
                id: `${path.id}-offset`,
                pathData: resultPathData,
                name: `${path.name || "path"}-offset-${offset}`,
            };

            // Update bounds
            const bounds = getPathBounds(resultPathData);
            if (bounds) {
                resultPath.transform.x = bounds.x;
                resultPath.transform.y = bounds.y;
            }

            return { success: true, result: resultPath };
        } catch (error) {
            return {
                success: false,
                error: `Path offset failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Analyze path properties
     */
    analyzePath(path: PathObject): {
        success: boolean;
        analysis?: {
            length: number;
            bounds: { x: number; y: number; width: number; height: number };
            nodeCount: number;
            isClosed: boolean;
            complexity: "simple" | "moderate" | "complex";
            validation: { isValid: boolean; errors: string[] };
        };
        error?: string;
    } {
        try {
            // Validate path data
            const validation = validatePathData(path.pathData);

            // Calculate properties
            const length = getPathLength(path.pathData);
            const bounds = getPathBounds(path.pathData);
            const nodes = parsePathData(path.pathData);
            const nodeCount = nodes.length;
            const isClosed = path.pathData.toLowerCase().includes("z");

            // Determine complexity
            let complexity: "simple" | "moderate" | "complex" = "simple";
            if (nodeCount > 50 || length > 1000) {
                complexity = "complex";
            } else if (nodeCount > 20 || length > 500) {
                complexity = "moderate";
            }

            return {
                success: true,
                analysis: {
                    length,
                    bounds: bounds || { x: 0, y: 0, width: 0, height: 0 },
                    nodeCount,
                    isClosed,
                    complexity,
                    validation,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: `Path analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Convert path to absolute coordinates
     */
    convertToAbsolute(path: PathObject): { success: boolean; result?: PathObject; error?: string } {
        try {
            // Validate path data
            const validation = validatePathData(path.pathData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid path data: ${validation.errors.join(", ")}` };
            }

            // Convert to absolute
            const resultPathData = toAbsolutePath(path.pathData);

            // Create result path
            const resultPath: PathObject = {
                ...path,
                id: `${path.id}-absolute`,
                pathData: resultPathData,
                name: `${path.name || "path"}-absolute`,
            };

            return { success: true, result: resultPath };
        } catch (error) {
            return {
                success: false,
                error: `Path conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Reverse path direction
     */
    reversePath(path: PathObject): { success: boolean; result?: PathObject; error?: string } {
        try {
            // Validate path data
            const validation = validatePathData(path.pathData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid path data: ${validation.errors.join(", ")}` };
            }

            // Reverse path
            const resultPathData = reversePath(path.pathData);

            // Create result path
            const resultPath: PathObject = {
                ...path,
                id: `${path.id}-reversed`,
                pathData: resultPathData,
                name: `${path.name || "path"}-reversed`,
            };

            return { success: true, result: resultPath };
        } catch (error) {
            return {
                success: false,
                error: `Path reversal failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Get point at specific position along path
     */
    getPointAt(path: PathObject, position: number): { success: boolean; point?: Point; error?: string } {
        try {
            // Validate path data
            const validation = validatePathData(path.pathData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid path data: ${validation.errors.join(", ")}` };
            }

            // Get point
            const point = getPointAtLength(path.pathData, position);

            if (!point) {
                return { success: false, error: "Could not calculate point at position" };
            }

            return { success: true, point };
        } catch (error) {
            return {
                success: false,
                error: `Point calculation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Check if point is inside path
     */
    containsPoint(path: PathObject, point: Point): { success: boolean; contains?: boolean; error?: string } {
        try {
            // Validate path data
            const validation = validatePathData(path.pathData);
            if (!validation.isValid) {
                return { success: false, error: `Invalid path data: ${validation.errors.join(", ")}` };
            }

            // Check containment
            const contains = isPointInPath(path.pathData, point);

            return { success: true, contains };
        } catch (error) {
            return {
                success: false,
                error: `Point containment check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Batch process multiple operations
     */
    batchProcess(
        operations: Array<{
            type: "simplify" | "smooth" | "offset" | "reverse" | "absolute";
            path: PathObject;
            options?: any;
        }>
    ): Array<{ success: boolean; result?: PathObject; error?: string }> {
        return operations.map((operation) => {
            switch (operation.type) {
                case "simplify":
                    return this.simplifyPath(operation.path, operation.options);
                case "smooth":
                    return this.smoothPath(operation.path, operation.options);
                case "offset":
                    return this.offsetPath(operation.path, operation.options?.offset || 0, operation.options);
                case "reverse":
                    return this.reversePath(operation.path);
                case "absolute":
                    return this.convertToAbsolute(operation.path);
                default:
                    return { success: false, error: `Unknown operation type: ${(operation as any).type}` };
            }
        });
    }
}

// Export singleton instance
export const pathOperations = PathOperations.getInstance();
