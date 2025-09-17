import { describe, test, expect } from "vitest";
import {
    snapToGrid,
    snapPoint,
    snapRectangle,
    snapCircle,
    shouldDisableSnap,
    screenToCanvas,
    getSnapIndicators,
    type SnapOptions,
} from "./gridUtils";

describe("Grid Utilities", () => {
    describe("snapToGrid", () => {
        test("should snap point to nearest grid intersection", () => {
            expect(snapToGrid(0, 0, 20)).toEqual({ x: 0, y: 0 });
            expect(snapToGrid(25, 35, 20)).toEqual({ x: 20, y: 40 });
            expect(snapToGrid(15, 15, 20)).toEqual({ x: 20, y: 20 });
            expect(snapToGrid(-5, -5, 20)).toEqual({ x: 0, y: 0 });
        });

        test("should handle different grid sizes", () => {
            expect(snapToGrid(17, 17, 10)).toEqual({ x: 20, y: 20 });
            expect(snapToGrid(23, 23, 25)).toEqual({ x: 25, y: 25 });
            expect(snapToGrid(7, 7, 5)).toEqual({ x: 5, y: 5 });
        });

        test("should handle negative coordinates", () => {
            expect(snapToGrid(-15, -25, 20)).toEqual({ x: -20, y: -20 });
            expect(snapToGrid(-35, -45, 20)).toEqual({ x: -40, y: -40 });
        });
    });

    describe("snapPoint", () => {
        const enabledOptions: SnapOptions = { snapToGrid: true, gridSize: 20 };
        const disabledOptions: SnapOptions = { snapToGrid: false, gridSize: 20 };

        test("should snap when enabled", () => {
            const result = snapPoint(15, 25, enabledOptions);
            expect(result).toEqual({ x: 20, y: 20, snapped: true });
        });

        test("should not snap when disabled", () => {
            const result = snapPoint(15, 25, disabledOptions);
            expect(result).toEqual({ x: 15, y: 25, snapped: false });
        });

        test("should handle exact grid positions", () => {
            const result = snapPoint(20, 40, enabledOptions);
            expect(result).toEqual({ x: 20, y: 40, snapped: true });
        });
    });

    describe("snapRectangle", () => {
        const options: SnapOptions = { snapToGrid: true, gridSize: 20 };

        test("should snap rectangle position and size to grid", () => {
            const result = snapRectangle(15, 25, 35, 45, options);
            expect(result).toEqual({
                x: 20,
                y: 20,
                width: 40,
                height: 40,
                snapped: true,
            });
        });

        test("should enforce minimum size equal to grid size", () => {
            const result = snapRectangle(10, 10, 5, 8, options);
            expect(result).toEqual({
                x: 20,
                y: 20,
                width: 20,
                height: 20,
                snapped: true,
            });
        });

        test("should not snap when disabled", () => {
            const disabledOptions: SnapOptions = { snapToGrid: false, gridSize: 20 };
            const result = snapRectangle(15, 25, 35, 45, disabledOptions);
            expect(result).toEqual({
                x: 15,
                y: 25,
                width: 35,
                height: 45,
                snapped: false,
            });
        });

        test("should handle large rectangles", () => {
            const result = snapRectangle(12, 18, 95, 105, options);
            expect(result).toEqual({
                x: 20,
                y: 20,
                width: 100,
                height: 100,
                snapped: true,
            });
        });
    });

    describe("snapCircle", () => {
        const options: SnapOptions = { snapToGrid: true, gridSize: 20 };

        test("should snap circle center to grid", () => {
            const result = snapCircle(15, 25, 30, options);
            expect(result.centerX).toBe(20);
            expect(result.centerY).toBe(20);
            expect(result.snapped).toBe(true);
        });

        test("should snap radius to grid multiples", () => {
            const result = snapCircle(20, 20, 15, options);
            expect(result.radius).toBe(20); // Should snap to grid size multiple
        });

        test("should enforce minimum radius", () => {
            const result = snapCircle(20, 20, 3, options);
            expect(result.radius).toBe(10); // Should be at least gridSize/2
        });

        test("should not snap when disabled", () => {
            const disabledOptions: SnapOptions = { snapToGrid: false, gridSize: 20 };
            const result = snapCircle(15, 25, 30, disabledOptions);
            expect(result).toEqual({
                centerX: 15,
                centerY: 25,
                radius: 30,
                snapped: false,
            });
        });
    });

    describe("shouldDisableSnap", () => {
        test("should detect Ctrl key", () => {
            const event = { ctrlKey: true, metaKey: false } as MouseEvent;
            expect(shouldDisableSnap(event)).toBe(true);
        });

        test("should detect Cmd key (Meta)", () => {
            const event = { ctrlKey: false, metaKey: true } as MouseEvent;
            expect(shouldDisableSnap(event)).toBe(true);
        });

        test("should return false when no modifier keys", () => {
            const event = { ctrlKey: false, metaKey: false } as MouseEvent;
            expect(shouldDisableSnap(event)).toBe(false);
        });

        test("should work with keyboard events", () => {
            const keyEvent = { ctrlKey: true, metaKey: false } as KeyboardEvent;
            expect(shouldDisableSnap(keyEvent)).toBe(true);
        });
    });

    describe("screenToCanvas", () => {
        test("should convert screen coordinates to canvas coordinates", () => {
            const viewport = { x: 100, y: 50, zoom: 2 };
            const result = screenToCanvas(200, 150, viewport);
            expect(result).toEqual({ x: 50, y: 50 });
        });

        test("should handle zoom level 1", () => {
            const viewport = { x: 0, y: 0, zoom: 1 };
            const result = screenToCanvas(100, 200, viewport);
            expect(result).toEqual({ x: 100, y: 200 });
        });

        test("should handle pan offset", () => {
            const viewport = { x: 50, y: 100, zoom: 1 };
            const result = screenToCanvas(200, 300, viewport);
            expect(result).toEqual({ x: 150, y: 200 });
        });

        test("should handle combined zoom and pan", () => {
            const viewport = { x: 20, y: 40, zoom: 0.5 };
            const result = screenToCanvas(100, 200, viewport);
            expect(result).toEqual({ x: 160, y: 320 });
        });
    });

    describe("getSnapIndicators", () => {
        test("should return indicators when coordinates differ", () => {
            const original = { x: 15, y: 25 };
            const snapped = { x: 20, y: 20 };
            const indicators = getSnapIndicators(original, snapped, 20);

            expect(indicators).toHaveLength(2);
            expect(indicators).toContainEqual({ type: "vertical", position: 20 });
            expect(indicators).toContainEqual({ type: "horizontal", position: 20 });
        });

        test("should not return indicators when coordinates are the same", () => {
            const original = { x: 20, y: 20 };
            const snapped = { x: 20, y: 20 };
            const indicators = getSnapIndicators(original, snapped, 20);

            expect(indicators).toHaveLength(0);
        });

        test("should return only vertical indicator when only x differs", () => {
            const original = { x: 15, y: 20 };
            const snapped = { x: 20, y: 20 };
            const indicators = getSnapIndicators(original, snapped, 20);

            expect(indicators).toHaveLength(1);
            expect(indicators[0]).toEqual({ type: "vertical", position: 20 });
        });

        test("should return only horizontal indicator when only y differs", () => {
            const original = { x: 20, y: 15 };
            const snapped = { x: 20, y: 20 };
            const indicators = getSnapIndicators(original, snapped, 20);

            expect(indicators).toHaveLength(1);
            expect(indicators[0]).toEqual({ type: "horizontal", position: 20 });
        });

        test("should handle small differences (threshold check)", () => {
            const original = { x: 20.05, y: 20.05 };
            const snapped = { x: 20, y: 20 };
            const indicators = getSnapIndicators(original, snapped, 20);

            expect(indicators).toHaveLength(0); // Differences are too small
        });
    });

    describe("Edge Cases", () => {
        test("should handle zero grid size gracefully", () => {
            expect(() => snapToGrid(10, 10, 0)).not.toThrow();
        });

        test("should handle very large grid sizes", () => {
            const result = snapToGrid(25, 25, 1000);
            expect(result).toEqual({ x: 0, y: 0 });
        });

        test("should handle fractional coordinates", () => {
            const result = snapToGrid(15.7, 25.3, 20);
            expect(result).toEqual({ x: 20, y: 20 });
        });

        test("should handle very small grid sizes", () => {
            const result = snapToGrid(5.5, 5.5, 1);
            expect(result).toEqual({ x: 6, y: 6 });
        });
    });
});
