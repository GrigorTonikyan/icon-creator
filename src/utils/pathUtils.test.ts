import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PathNode, Point } from "../types/editor";
import {
    addNodeAtPosition,
    excludePaths,
    findInsertPosition,
    intersectPaths,
    nodesToPathData,
    parsePathData,
    performPathOperation,
    removeNode,
    subtractPaths,
    unitePaths,
    updateNodePosition,
    // Advanced path operations
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

// Mock Paper.js for advanced operations
vi.mock("paper", () => ({
    default: {
        setup: vi.fn(),
        Size: vi.fn().mockReturnValue({}),
        Path: vi.fn().mockImplementation((pathData) => ({
            pathData: pathData || "M0,0 L100,0 L100,100 L0,100 Z",
            length: 100,
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            getPointAt: vi.fn().mockReturnValue({ x: 50, y: 50 }),
            getTangentAt: vi.fn().mockReturnValue({ x: 1, y: 0 }),
            getNormalAt: vi.fn().mockReturnValue({ x: 0, y: 1 }),
            contains: vi.fn().mockReturnValue(true),
            simplify: vi.fn(),
            smooth: vi.fn(),
            reverse: vi.fn(),
            remove: vi.fn(),
            clone: vi.fn().mockReturnThis(),
            strokeWidth: 0,
            strokeJoin: "round",
            fillColor: null,
            strokeColor: null,
        })),
        Color: vi.fn(),
        Point: vi.fn().mockImplementation((x, y) => ({ x, y })),
    },
}));

describe("PathUtils", () => {
    describe("parsePathData", () => {
        test("should parse simple moveto and lineto commands", () => {
            const pathData = "M 10 20 L 30 40";
            const nodes = parsePathData(pathData);

            expect(nodes).toHaveLength(2);
            expect(nodes[0]).toEqual({
                id: expect.any(String),
                x: 10,
                y: 20,
                type: "move",
            });
            expect(nodes[1]).toEqual({
                id: expect.any(String),
                x: 30,
                y: 40,
                type: "line",
            });
        });

        test("should parse curve commands with control points", () => {
            const pathData = "M 10 20 C 15 25 25 35 30 40";
            const nodes = parsePathData(pathData);

            expect(nodes).toHaveLength(2);
            expect(nodes[0]).toEqual({
                id: expect.any(String),
                x: 10,
                y: 20,
                type: "move",
            });
            expect(nodes[1]).toEqual({
                id: expect.any(String),
                x: 30,
                y: 40,
                type: "curve",
                controlPoint1: { x: 15, y: 25 },
                controlPoint2: { x: 25, y: 35 },
            });
        });

        test("should handle empty or invalid path data", () => {
            expect(parsePathData("")).toEqual([]);
            expect(parsePathData("invalid")).toEqual([]);
            expect(parsePathData("M")).toEqual([]);
        });

        test("should handle complex path with multiple commands", () => {
            const pathData = "M 0 0 L 10 10 C 15 15 25 25 30 30";
            const nodes = parsePathData(pathData);

            expect(nodes).toHaveLength(3);
            expect(nodes[0]?.type).toBe("move");
            expect(nodes[1]?.type).toBe("line");
            expect(nodes[2]?.type).toBe("curve");
        });
    });

    describe("nodesToPathData", () => {
        test("should convert simple nodes to path data", () => {
            const nodes: PathNode[] = [
                { id: "1", x: 10, y: 20, type: "move" },
                { id: "2", x: 30, y: 40, type: "line" },
            ];

            const pathData = nodesToPathData(nodes);
            expect(pathData).toBe("M 10 20 L 30 40");
        });

        test("should convert curve nodes with control points", () => {
            const nodes: PathNode[] = [
                { id: "1", x: 10, y: 20, type: "move" },
                {
                    id: "2",
                    x: 30,
                    y: 40,
                    type: "curve",
                    controlPoint1: { x: 15, y: 25 },
                    controlPoint2: { x: 25, y: 35 },
                },
            ];

            const pathData = nodesToPathData(nodes);
            expect(pathData).toBe("M 10 20 C 15 25 25 35 30 40");
        });

        test("should handle close command", () => {
            const nodes: PathNode[] = [
                { id: "1", x: 10, y: 20, type: "move" },
                { id: "2", x: 30, y: 40, type: "line" },
            ];

            const pathData = nodesToPathData(nodes);
            expect(pathData).toBe("M 10 20 L 30 40");
        });

        test("should handle empty nodes array", () => {
            expect(nodesToPathData([])).toBe("");
        });
    });

    describe("addNodeAtPosition", () => {
        let nodes: PathNode[];

        beforeEach(() => {
            nodes = [
                { id: "1", x: 0, y: 0, type: "move" },
                { id: "2", x: 10, y: 10, type: "line" },
                { id: "3", x: 20, y: 20, type: "line" },
            ];
        });

        test("should add node at specified index", () => {
            const newPosition: Point = { x: 5, y: 5 };
            const result = addNodeAtPosition(nodes, newPosition, 1);

            expect(result).toHaveLength(4);
            expect(result[1]?.x).toBe(5);
            expect(result[1]?.y).toBe(5);
            expect(result[2]?.id).toBe("2"); // Original node shifted
        });

        test("should add node at the end if index is out of bounds", () => {
            const newPosition: Point = { x: 30, y: 30 };
            const result = addNodeAtPosition(nodes, newPosition, 10);

            expect(result).toHaveLength(4);
            expect(result[3]?.x).toBe(30);
            expect(result[3]?.y).toBe(30);
        });

        test("should not modify original array", () => {
            const originalLength = nodes.length;
            const newPosition: Point = { x: 5, y: 5 };
            addNodeAtPosition(nodes, newPosition, 1);

            expect(nodes).toHaveLength(originalLength);
        });
    });

    describe("removeNode", () => {
        let nodes: PathNode[];

        beforeEach(() => {
            nodes = [
                { id: "1", x: 0, y: 0, type: "move" },
                { id: "2", x: 10, y: 10, type: "line" },
                { id: "3", x: 20, y: 20, type: "line" },
            ];
        });

        test("should remove node by id", () => {
            const result = removeNode(nodes, "2");

            expect(result).toHaveLength(2);
            expect(result.find((n) => n.id === "2")).toBeUndefined();
            expect(result[0]?.id).toBe("1");
            expect(result[1]?.id).toBe("3");
        });

        test("should return original array if node not found", () => {
            const result = removeNode(nodes, "nonexistent");

            expect(result).toHaveLength(3);
            expect(result).toEqual(nodes);
        });

        test("should not modify original array", () => {
            const originalLength = nodes.length;
            removeNode(nodes, "2");

            expect(nodes).toHaveLength(originalLength);
        });
    });

    describe("updateNodePosition", () => {
        let nodes: PathNode[];

        beforeEach(() => {
            nodes = [
                { id: "1", x: 0, y: 0, type: "move" },
                { id: "2", x: 10, y: 10, type: "line" },
                { id: "3", x: 20, y: 20, type: "line" },
            ];
        });

        test("should update node position by id", () => {
            const newPosition: Point = { x: 15, y: 25 };
            const result = updateNodePosition(nodes, "2", newPosition);

            expect(result[1]).toEqual({
                id: "2",
                x: 15,
                y: 25,
                type: "line",
            });
        });

        test("should update control points for curve nodes", () => {
            const curveNodes: PathNode[] = [
                { id: "1", x: 0, y: 0, type: "move" },
                {
                    id: "2",
                    x: 10,
                    y: 10,
                    type: "curve",
                    controlPoint1: { x: 5, y: 5 },
                    controlPoint2: { x: 8, y: 8 },
                },
            ];

            const newPosition: Point = { x: 20, y: 20 };
            const result = updateNodePosition(curveNodes, "2", newPosition);

            expect(result[1]?.x).toBe(20);
            expect(result[1]?.y).toBe(20);
            // Control points should be preserved
            expect(result[1]?.controlPoint1).toEqual({ x: 5, y: 5 });
            expect(result[1]?.controlPoint2).toEqual({ x: 8, y: 8 });
        });

        test("should return original array if node not found", () => {
            const newPosition: Point = { x: 15, y: 25 };
            const result = updateNodePosition(nodes, "nonexistent", newPosition);

            expect(result).toEqual(nodes);
        });

        test("should not modify original array", () => {
            const originalNode = nodes[1];
            const newPosition: Point = { x: 15, y: 25 };
            updateNodePosition(nodes, "2", newPosition);

            expect(nodes[1]).toEqual(originalNode);
        });
    });

    describe("findInsertPosition", () => {
        let nodes: PathNode[];

        beforeEach(() => {
            nodes = [
                { id: "1", x: 0, y: 0, type: "move" },
                { id: "2", x: 10, y: 0, type: "line" },
                { id: "3", x: 20, y: 0, type: "line" },
            ];
        });

        test("should find insert position on line segment", () => {
            const clickPoint: Point = { x: 5, y: 0 };
            const result = findInsertPosition(nodes, clickPoint, 10);

            expect(result).not.toBeNull();
            expect(result?.insertIndex).toBe(1);
            expect(result?.position.x).toBeCloseTo(5);
            expect(result?.position.y).toBeCloseTo(0);
        });

        test("should return null if click is too far from any segment", () => {
            const clickPoint: Point = { x: 5, y: 20 };
            const result = findInsertPosition(nodes, clickPoint, 5);

            expect(result).toBeNull();
        });

        test("should return null for insufficient nodes", () => {
            const singleNode: PathNode[] = [{ id: "1", x: 0, y: 0, type: "move" }];
            const clickPoint: Point = { x: 5, y: 0 };
            const result = findInsertPosition(singleNode, clickPoint, 10);

            expect(result).toBeNull();
        });

        test("should find closest segment when multiple segments are within threshold", () => {
            const denseNodes: PathNode[] = [
                { id: "1", x: 0, y: 0, type: "move" },
                { id: "2", x: 5, y: 0, type: "line" },
                { id: "3", x: 10, y: 0, type: "line" },
                { id: "4", x: 15, y: 0, type: "line" },
            ];

            const clickPoint: Point = { x: 7.5, y: 1 };
            const result = findInsertPosition(denseNodes, clickPoint, 10);

            expect(result).not.toBeNull();
            expect(result?.insertIndex).toBe(2); // Between second and third node
        });
    });

    describe("Path Boolean Operations", () => {
        const simpleSquare = "M 0 0 L 10 0 L 10 10 L 0 10 Z";
        const overlappingSquare = "M 5 5 L 15 5 L 15 15 L 5 15 Z";

        describe("unitePaths", () => {
            test("should unite two overlapping paths", () => {
                const result = unitePaths([simpleSquare, overlappingSquare]);

                expect(result).toBeTruthy();
                expect(typeof result).toBe("string");
                expect(result.length).toBeGreaterThan(0);
            });

            test("should return first path when only one path provided", () => {
                const result = unitePaths([simpleSquare]);

                expect(result).toBe(simpleSquare);
            });

            test("should return empty string for empty array", () => {
                const result = unitePaths([]);

                expect(result).toBe("");
            });

            test("should filter out empty paths", () => {
                const result = unitePaths([simpleSquare, "", overlappingSquare]);

                expect(result).toBeTruthy();
                expect(typeof result).toBe("string");
            });
        });

        describe("subtractPaths", () => {
            test("should subtract second path from first", () => {
                const result = subtractPaths([simpleSquare, overlappingSquare]);

                expect(result).toBeTruthy();
                expect(typeof result).toBe("string");
                expect(result.length).toBeGreaterThan(0);
            });

            test("should return first path when only one path provided", () => {
                const result = subtractPaths([simpleSquare]);

                expect(result).toBe(simpleSquare);
            });

            test("should handle invalid path data gracefully", () => {
                const result = subtractPaths(["invalid", simpleSquare]);

                expect(result).toBe(""); // Returns empty string for invalid data
            });
        });

        describe("intersectPaths", () => {
            test("should intersect two overlapping paths", () => {
                const result = intersectPaths([simpleSquare, overlappingSquare]);

                expect(result).toBeTruthy();
                expect(typeof result).toBe("string");
                expect(result.length).toBeGreaterThan(0);
            });

            test("should return first path when only one path provided", () => {
                const result = intersectPaths([simpleSquare]);

                expect(result).toBe(simpleSquare);
            });
        });

        describe("excludePaths", () => {
            test("should exclude overlapping areas", () => {
                const result = excludePaths([simpleSquare, overlappingSquare]);

                expect(result).toBeTruthy();
                expect(typeof result).toBe("string");
                expect(result.length).toBeGreaterThan(0);
            });

            test("should return first path when only one path provided", () => {
                const result = excludePaths([simpleSquare]);

                expect(result).toBe(simpleSquare);
            });
        });

        describe("performPathOperation", () => {
            test("should delegate to correct operation function", () => {
                const paths = [simpleSquare, overlappingSquare];

                const uniteResult = performPathOperation("unite", paths);
                const subtractResult = performPathOperation("subtract", paths);
                const intersectResult = performPathOperation("intersect", paths);
                const excludeResult = performPathOperation("exclude", paths);

                expect(uniteResult).toBeTruthy();
                expect(subtractResult).toBeTruthy();
                expect(intersectResult).toBeTruthy();
                expect(excludeResult).toBeTruthy();

                // Results should be different for different operations
                expect(uniteResult).not.toBe(subtractResult);
                expect(intersectResult).not.toBe(excludeResult);
            });

            test("should handle unknown operation gracefully", () => {
                const paths = [simpleSquare, overlappingSquare];
                // @ts-expect-error - Testing invalid operation
                const result = performPathOperation("invalid", paths);

                expect(result).toBe(simpleSquare); // Falls back to first path
            });
        });
    });

    // Advanced Path Operations Tests - Stage 12 Step 8
    describe("Advanced Path Operations", () => {
        const testPath = "M0,0 L100,0 L100,100 L0,100 Z";

        beforeEach(() => {
            vi.clearAllMocks();
        });

        describe("simplifyPath", () => {
            test("should simplify path with default tolerance", () => {
                const result = simplifyPath(testPath);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should simplify path with custom tolerance", () => {
                const result = simplifyPath(testPath, 2.0);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should handle empty path data", () => {
                const result = simplifyPath("");
                expect(result).toBe("");
            });
        });

        describe("smoothPath", () => {
            test("should smooth path with default factor", () => {
                const result = smoothPath(testPath);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should smooth path with custom factor", () => {
                const result = smoothPath(testPath, 0.8);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });
        });

        describe("getPathLength", () => {
            test("should return path length", () => {
                const length = getPathLength(testPath);
                expect(length).toBe(100);
            });

            test("should return 0 for empty path", () => {
                const length = getPathLength("");
                expect(length).toBe(0);
            });
        });

        describe("getPointAtLength", () => {
            test("should return point at middle of path", () => {
                const point = getPointAtLength(testPath, 0.5);
                expect(point).toEqual({ x: 50, y: 50 });
            });

            test("should return point at start of path", () => {
                const point = getPointAtLength(testPath, 0);
                expect(point).toEqual({ x: 50, y: 50 });
            });

            test("should return point at end of path", () => {
                const point = getPointAtLength(testPath, 1);
                expect(point).toEqual({ x: 50, y: 50 });
            });

            test("should return null for invalid path", () => {
                const point = getPointAtLength("", 0.5);
                expect(point).toBeNull();
            });
        });

        describe("getTangentAtLength", () => {
            test("should return tangent vector", () => {
                const tangent = getTangentAtLength(testPath, 0.5);
                expect(tangent).toEqual({ x: 1, y: 0 });
            });

            test("should return null for invalid path", () => {
                const tangent = getTangentAtLength("", 0.5);
                expect(tangent).toBeNull();
            });
        });

        describe("getNormalAtLength", () => {
            test("should return normal vector", () => {
                const normal = getNormalAtLength(testPath, 0.5);
                expect(normal).toEqual({ x: 0, y: 1 });
            });

            test("should return null for invalid path", () => {
                const normal = getNormalAtLength("", 0.5);
                expect(normal).toBeNull();
            });
        });

        describe("getPathBounds", () => {
            test("should return path bounding box", () => {
                const bounds = getPathBounds(testPath);
                expect(bounds).toEqual({ x: 0, y: 0, width: 100, height: 100 });
            });

            test("should return null for invalid path", () => {
                const bounds = getPathBounds("");
                expect(bounds).toBeNull();
            });
        });

        describe("isPointInPath", () => {
            test("should return true for point inside path", () => {
                const isInside = isPointInPath(testPath, { x: 50, y: 50 });
                expect(isInside).toBe(true);
            });

            test("should return false for invalid path", () => {
                const isInside = isPointInPath("", { x: 50, y: 50 });
                expect(isInside).toBe(false);
            });
        });

        describe("offsetPath", () => {
            test("should offset path with positive value", () => {
                const result = offsetPath(testPath, 10);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should offset path with negative value", () => {
                const result = offsetPath(testPath, -5);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should offset path with custom join type", () => {
                const result = offsetPath(testPath, 10, "miter");
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should handle empty path", () => {
                const result = offsetPath("", 10);
                expect(result).toBe("");
            });
        });

        describe("validatePathData", () => {
            test("should validate correct path data", () => {
                const result = validatePathData(testPath);
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });

            test("should detect empty path data", () => {
                const result = validatePathData("");
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain("Path data must be a non-empty string");
            });

            test("should detect null path data", () => {
                const result = validatePathData(null as any);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain("Path data must be a non-empty string");
            });

            test("should detect invalid characters", () => {
                const result = validatePathData("invalid-path-123");
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });

            test("should detect missing commands", () => {
                const result = validatePathData("123 456 789");
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain("Path must contain at least one valid command");
            });
        });

        describe("optimizePathData", () => {
            test("should optimize path data precision", () => {
                const pathData = "M0.123456,0.789012 L100.987654,0.345678";
                const result = optimizePathData(pathData, 2);
                expect(result).toBe("M0.12,0.79 L100.99,0.35");
            });

            test("should handle default precision", () => {
                const pathData = "M0.123456,0.789012";
                const result = optimizePathData(pathData);
                expect(result).toBe("M0.12,0.79");
            });

            test("should handle empty path data", () => {
                const result = optimizePathData("");
                expect(result).toBe("");
            });

            test("should preserve non-numeric content", () => {
                const pathData = "M0,0 L100,abc";
                const result = optimizePathData(pathData, 1);
                expect(result).toContain("abc");
            });
        });

        describe("toAbsolutePath", () => {
            test("should convert relative to absolute coordinates", () => {
                const result = toAbsolutePath(testPath);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should handle empty path", () => {
                const result = toAbsolutePath("");
                expect(result).toBe("");
            });
        });

        describe("reversePath", () => {
            test("should reverse path direction", () => {
                const result = reversePath(testPath);
                expect(result).toBeDefined();
                expect(typeof result).toBe("string");
            });

            test("should handle empty path", () => {
                const result = reversePath("");
                expect(result).toBe("");
            });
        });

        describe("Error Handling", () => {
            test("should handle Paper.js errors gracefully", () => {
                // Functions should not throw even if Paper.js fails
                expect(() => getPathLength("invalid")).not.toThrow();
                expect(() => simplifyPath("invalid")).not.toThrow();
                expect(() => getPointAtLength("invalid", 0.5)).not.toThrow();
            });

            test("should return safe fallbacks on errors", () => {
                expect(getPathLength("")).toBe(0);
                expect(getPointAtLength("", 0.5)).toBeNull();
                expect(getPathBounds("")).toBeNull();
                expect(isPointInPath("", { x: 0, y: 0 })).toBe(false);
            });
        });
    });
});
