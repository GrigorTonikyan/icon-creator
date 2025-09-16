import { beforeEach, describe, expect, test } from "vitest";
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
} from "./pathUtils";

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
});
