import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { PathOperations } from "../utils/PathOperations";
import type { PathObject } from "../types/editor";

// Mock Paper.js
vi.mock("paper", () => ({
    default: {
        setup: vi.fn(),
        Size: vi.fn().mockReturnValue({}),
        Path: vi.fn().mockImplementation((pathData) => ({
            pathData,
            length: 100,
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            getPointAt: vi.fn().mockReturnValue({ x: 50, y: 50 }),
            getTangentAt: vi.fn().mockReturnValue({ x: 1, y: 0 }),
            getNormalAt: vi.fn().mockReturnValue({ x: 0, y: 1 }),
            contains: vi.fn().mockReturnValue(true),
            simplify: vi.fn(),
            smooth: vi.fn(),
            reverse: vi.fn(),
            unite: vi.fn().mockReturnValue({
                pathData: "M0,0 L100,0 L100,100 L0,100 Z",
                remove: vi.fn(),
            }),
            subtract: vi.fn().mockReturnValue({
                pathData: "M0,0 L50,0 L50,50 L0,50 Z",
                remove: vi.fn(),
            }),
            intersect: vi.fn().mockReturnValue({
                pathData: "M25,25 L75,25 L75,75 L25,75 Z",
                remove: vi.fn(),
            }),
            exclude: vi.fn().mockReturnValue({
                pathData: "M0,0 L100,0 L100,100 L0,100 Z",
                remove: vi.fn(),
            }),
            remove: vi.fn(),
        })),
        Color: vi.fn(),
    },
}));

describe("PathOperations", () => {
    let pathOperations: PathOperations;
    let mockPath1: PathObject;
    let mockPath2: PathObject;

    beforeEach(() => {
        pathOperations = PathOperations.getInstance();

        mockPath1 = {
            id: "path1",
            type: "path",
            name: "Test Path 1",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            layerId: "default",
            pathData: "M0,0 L100,0 L100,100 L0,100 Z",
            style: {
                fill: "#ff0000",
                stroke: "#000000",
                strokeWidth: 2,
            },
        };

        mockPath2 = {
            id: "path2",
            type: "path",
            name: "Test Path 2",
            transform: { x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 1,
            layerId: "default",
            pathData: "M50,50 L150,50 L150,150 L50,150 Z",
            style: {
                fill: "#00ff00",
                stroke: "#000000",
                strokeWidth: 2,
            },
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Boolean Operations", () => {
        test("should perform unite operation successfully", () => {
            const result = pathOperations.performBooleanOperation("unite", [mockPath1, mockPath2]);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.type).toBe("path");
            expect(result.result?.name).toBe("unite-result");
            expect(result.error).toBeUndefined();
        });

        test("should perform subtract operation successfully", () => {
            const result = pathOperations.performBooleanOperation("subtract", [mockPath1, mockPath2]);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.type).toBe("path");
            expect(result.result?.name).toBe("subtract-result");
        });

        test("should perform intersect operation successfully", () => {
            const result = pathOperations.performBooleanOperation("intersect", [mockPath1, mockPath2]);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.type).toBe("path");
            expect(result.result?.name).toBe("intersect-result");
        });

        test("should perform exclude operation successfully", () => {
            const result = pathOperations.performBooleanOperation("exclude", [mockPath1, mockPath2]);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.type).toBe("path");
            expect(result.result?.name).toBe("exclude-result");
        });

        test("should fail with insufficient paths", () => {
            const result = pathOperations.performBooleanOperation("unite", [mockPath1]);

            expect(result.success).toBe(false);
            expect(result.error).toBe("At least two paths required for boolean operations");
            expect(result.result).toBeUndefined();
        });

        test("should fail with empty paths array", () => {
            const result = pathOperations.performBooleanOperation("unite", []);

            expect(result.success).toBe(false);
            expect(result.error).toBe("At least two paths required for boolean operations");
        });
    });

    describe("Path Simplification", () => {
        test("should simplify path with default options", () => {
            const result = pathOperations.simplifyPath(mockPath1);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.id).toBe("path1-simplified");
            expect(result.result?.name).toBe("Test Path 1-simplified");
        });

        test("should simplify path with custom options", () => {
            const options = {
                tolerance: 2.0,
                preserveCorners: true,
                optimize: true,
                precision: 3,
            };

            const result = pathOperations.simplifyPath(mockPath1, options);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
        });

        test("should handle invalid path data", () => {
            const invalidPath = { ...mockPath1, pathData: "" };
            const result = pathOperations.simplifyPath(invalidPath);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Invalid path data");
        });
    });

    describe("Path Smoothing", () => {
        test("should smooth path with default options", () => {
            const result = pathOperations.smoothPath(mockPath1);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.id).toBe("path1-smoothed");
            expect(result.result?.name).toBe("Test Path 1-smoothed");
        });

        test("should smooth path with custom options", () => {
            const options = {
                smoothingFactor: 0.8,
                preserveEnds: false,
                optimize: true,
            };

            const result = pathOperations.smoothPath(mockPath1, options);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
        });
    });

    describe("Path Offset", () => {
        test("should offset path with positive value", () => {
            const result = pathOperations.offsetPath(mockPath1, 10);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.id).toBe("path1-offset");
            expect(result.result?.name).toBe("Test Path 1-offset-10");
        });

        test("should offset path with negative value", () => {
            const result = pathOperations.offsetPath(mockPath1, -5);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.name).toBe("Test Path 1-offset--5");
        });

        test("should offset path with custom join type", () => {
            const options = {
                joinType: "miter" as const,
                optimize: true,
            };

            const result = pathOperations.offsetPath(mockPath1, 15, options);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
        });
    });

    describe("Path Analysis", () => {
        test("should analyze path properties correctly", () => {
            const result = pathOperations.analyzePath(mockPath1);

            expect(result.success).toBe(true);
            expect(result.analysis).toBeDefined();
            expect(result.analysis?.length).toBe(100);
            expect(result.analysis?.bounds).toEqual({ x: 0, y: 0, width: 100, height: 100 });
            expect(result.analysis?.nodeCount).toBeGreaterThan(0);
            expect(result.analysis?.isClosed).toBe(true);
            expect(result.analysis?.complexity).toMatch(/simple|moderate|complex/);
            expect(result.analysis?.validation.isValid).toBe(true);
        });

        test("should detect complexity levels", () => {
            // Test simple path
            const simpleResult = pathOperations.analyzePath(mockPath1);
            expect(simpleResult.analysis?.complexity).toBe("simple");

            // Test with a path that would be considered complex
            const complexPath = {
                ...mockPath1,
                pathData:
                    "M" +
                    Array(100)
                        .fill(0)
                        .map((_, i) => `${i},${i}`)
                        .join(" L"),
            };

            const complexResult = pathOperations.analyzePath(complexPath);
            expect(complexResult.success).toBe(true);
        });
    });

    describe("Path Utilities", () => {
        test("should convert path to absolute coordinates", () => {
            const result = pathOperations.convertToAbsolute(mockPath1);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.id).toBe("path1-absolute");
            expect(result.result?.name).toBe("Test Path 1-absolute");
        });

        test("should reverse path direction", () => {
            const result = pathOperations.reversePath(mockPath1);

            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.result?.id).toBe("path1-reversed");
            expect(result.result?.name).toBe("Test Path 1-reversed");
        });

        test("should get point at specific position", () => {
            const result = pathOperations.getPointAt(mockPath1, 0.5);

            expect(result.success).toBe(true);
            expect(result.point).toEqual({ x: 50, y: 50 });
        });

        test("should check if point is inside path", () => {
            const result = pathOperations.containsPoint(mockPath1, { x: 50, y: 50 });

            expect(result.success).toBe(true);
            expect(result.contains).toBe(true);
        });
    });

    describe("Batch Processing", () => {
        test("should process multiple operations in batch", () => {
            const operations = [
                { type: "simplify" as const, path: mockPath1, options: { tolerance: 1.0 } },
                { type: "smooth" as const, path: mockPath2, options: { smoothingFactor: 0.6 } },
                { type: "reverse" as const, path: mockPath1 },
            ];

            const results = pathOperations.batchProcess(operations);

            expect(results).toHaveLength(3);
            expect(results[0]?.success).toBe(true);
            expect(results[1]?.success).toBe(true);
            expect(results[2]?.success).toBe(true);
        });

        test("should handle mixed success and failure in batch", () => {
            const invalidPath = { ...mockPath1, pathData: "" };
            const operations = [
                { type: "simplify" as const, path: mockPath1 },
                { type: "smooth" as const, path: invalidPath },
                { type: "reverse" as const, path: mockPath2 },
            ];

            const results = pathOperations.batchProcess(operations);

            expect(results).toHaveLength(3);
            expect(results[0]?.success).toBe(true);
            expect(results[1]?.success).toBe(false);
            expect(results[2]?.success).toBe(true);
        });
    });

    describe("Error Handling", () => {
        test("should handle Paper.js initialization errors", () => {
            // Mock Paper.js to throw an error
            vi.doMock("paper", () => ({
                default: {
                    setup: vi.fn(() => {
                        throw new Error("Paper.js error");
                    }),
                    Path: vi.fn(() => {
                        throw new Error("Path creation failed");
                    }),
                },
            }));

            const result = pathOperations.performBooleanOperation("unite", [mockPath1, mockPath2]);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Boolean operation failed");
        });

        test("should validate path data before operations", () => {
            const invalidPath = {
                ...mockPath1,
                pathData: "invalid-path-data-123",
            };

            const result = pathOperations.simplifyPath(invalidPath);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Invalid path data");
        });

        test("should handle null/undefined inputs gracefully", () => {
            const result = pathOperations.performBooleanOperation("unite", [mockPath1, null as any]);

            expect(result.success).toBe(false);
            expect(result.error).toBe("At least two paths required for boolean operations");
        });
    });

    describe("Singleton Pattern", () => {
        test("should return the same instance", () => {
            const instance1 = PathOperations.getInstance();
            const instance2 = PathOperations.getInstance();

            expect(instance1).toBe(instance2);
        });
    });
});
