import { describe, test, expect } from "vitest";
import type { ViewportState } from "../types/editor";
import {
    convertPixelsToUnit,
    convertUnitToPixels,
    formatDistance,
    calculateTickInterval,
    generateRulerTicks,
    calculateDistance,
    calculateAngle,
    calculateMidpoint,
    createPointMeasurement,
    screenToCanvasCoordinate,
    canvasToScreenCoordinate,
    UNIT_CONVERSIONS,
    UNIT_LABELS,
    type UnitType,
    type RulerOptions,
} from "./rulerUtils";

describe("Ruler Utilities", () => {
    describe("Unit Conversion", () => {
        describe("convertPixelsToUnit", () => {
            test("should convert pixels to pixels (identity)", () => {
                expect(convertPixelsToUnit(100, "px")).toBe(100);
            });

            test("should convert pixels to points", () => {
                expect(convertPixelsToUnit(96, "pt")).toBeCloseTo(72, 1);
            });

            test("should convert pixels to inches", () => {
                expect(convertPixelsToUnit(96, "in")).toBe(1);
            });

            test("should convert pixels to centimeters", () => {
                expect(convertPixelsToUnit(96, "cm")).toBeCloseTo(2.54, 2);
            });

            test("should convert pixels to millimeters", () => {
                expect(convertPixelsToUnit(96, "mm")).toBeCloseTo(25.4, 1);
            });
        });

        describe("convertUnitToPixels", () => {
            test("should convert pixels to pixels (identity)", () => {
                expect(convertUnitToPixels(100, "px")).toBe(100);
            });

            test("should convert points to pixels", () => {
                expect(convertUnitToPixels(72, "pt")).toBeCloseTo(96, 1);
            });

            test("should convert inches to pixels", () => {
                expect(convertUnitToPixels(1, "in")).toBe(96);
            });

            test("should convert centimeters to pixels", () => {
                expect(convertUnitToPixels(2.54, "cm")).toBeCloseTo(96, 1);
            });

            test("should convert millimeters to pixels", () => {
                expect(convertUnitToPixels(25.4, "mm")).toBeCloseTo(96, 1);
            });
        });

        test("should have consistent round-trip conversions", () => {
            const units: UnitType[] = ["px", "pt", "in", "cm", "mm"];
            const testValue = 100;

            units.forEach((unit) => {
                const converted = convertPixelsToUnit(testValue, unit);
                const backConverted = convertUnitToPixels(converted, unit);
                expect(backConverted).toBeCloseTo(testValue, 2);
            });
        });
    });

    describe("formatDistance", () => {
        test("should format distance with correct unit labels", () => {
            expect(formatDistance(100, "px", 0)).toBe("100px");
            expect(formatDistance(96, "pt", 0)).toBe("72pt"); // 96px = 72pt at 96 DPI
            expect(formatDistance(96, "in", 2)).toBe("1in"); // Number() removes trailing zeros
            expect(formatDistance(37.795, "cm", 2)).toBe("1cm"); // Number() removes trailing zeros
            expect(formatDistance(37.795, "mm", 0)).toBe("10mm"); // 37.795px = 10mm
        });

        test("should respect precision parameter", () => {
            expect(formatDistance(100.567, "px", 0)).toBe("101px");
            expect(formatDistance(100.567, "px", 1)).toBe("100.6px");
            expect(formatDistance(100.567, "px", 2)).toBe("100.57px");
            expect(formatDistance(100.567, "px", 3)).toBe("100.567px");
        });

        test("should handle negative values", () => {
            expect(formatDistance(-50, "px", 0)).toBe("-50px");
            expect(formatDistance(-50, "px", 1)).toBe("-50px"); // No trailing zeros since Number() removes them
        });

        test("should handle zero values", () => {
            expect(formatDistance(0, "cm", 0)).toBe("0cm");
            expect(formatDistance(0, "cm", 2)).toBe("0cm"); // No trailing zeros since Number() removes them
        });
    });

    describe("calculateTickInterval", () => {
        test("should calculate appropriate tick intervals for different zoom levels", () => {
            const interval1 = calculateTickInterval("px", 1);
            const interval2 = calculateTickInterval("px", 2);
            const interval05 = calculateTickInterval("px", 0.5);

            // Higher zoom = smaller intervals needed (more ticks visible)
            // Lower zoom = larger intervals needed (fewer ticks visible)
            expect(interval2).toBeLessThanOrEqual(interval1);
            expect(interval1).toBeLessThanOrEqual(interval05);
        });

        test("should handle different units", () => {
            const pxInterval = calculateTickInterval("px", 1);
            const inInterval = calculateTickInterval("in", 1);
            const cmInterval = calculateTickInterval("cm", 1);

            expect(inInterval).toBeGreaterThan(pxInterval);
            expect(cmInterval).toBeGreaterThan(pxInterval);
        });

        test("should respect minimum pixel interval", () => {
            const interval = calculateTickInterval("px", 1, 100);
            expect(interval).toBeGreaterThanOrEqual(100);
        });
    });

    describe("generateRulerTicks", () => {
        const viewport: ViewportState = { zoom: 1, panX: 0, panY: 0, canvasWidth: 800, canvasHeight: 600 };
        const options: RulerOptions = {
            unit: "px",
            majorTickInterval: 50,
            minorTicksPerMajor: 5,
            showLabels: true,
            thickness: 20,
        };

        test("should generate ticks within the specified range", () => {
            const ticks = generateRulerTicks(0, 200, options, viewport);

            expect(ticks.length).toBeGreaterThan(0);
            ticks.forEach((tick) => {
                expect(tick.position).toBeGreaterThanOrEqual(0);
                expect(tick.position).toBeLessThanOrEqual(200);
            });
        });

        test("should generate both major and minor ticks", () => {
            const ticks = generateRulerTicks(0, 200, options, viewport);

            const majorTicks = ticks.filter((tick) => tick.type === "major");
            const minorTicks = ticks.filter((tick) => tick.type === "minor");

            expect(majorTicks.length).toBeGreaterThan(0);
            expect(minorTicks.length).toBeGreaterThan(0);
        });

        test("should include labels on major ticks when enabled", () => {
            const ticks = generateRulerTicks(0, 200, options, viewport);
            const majorTicks = ticks.filter((tick) => tick.type === "major");

            majorTicks.forEach((tick) => {
                expect(tick.label).toBeDefined();
                expect(tick.label).toContain("px");
            });
        });

        test("should not include labels when disabled", () => {
            const noLabelOptions = { ...options, showLabels: false };
            const ticks = generateRulerTicks(0, 200, noLabelOptions, viewport);
            const majorTicks = ticks.filter((tick) => tick.type === "major");

            majorTicks.forEach((tick) => {
                expect(tick.label).toBeUndefined();
            });
        });

        test("should handle negative ranges", () => {
            const ticks = generateRulerTicks(-100, 100, options, viewport);
            expect(ticks.length).toBeGreaterThan(0);

            const hasNegative = ticks.some((tick) => tick.position < 0);
            const hasPositive = ticks.some((tick) => tick.position > 0);
            expect(hasNegative).toBe(true);
            expect(hasPositive).toBe(true);
        });
    });

    describe("Distance and Angle Calculations", () => {
        describe("calculateDistance", () => {
            test("should calculate distance between two points", () => {
                const point1 = { x: 0, y: 0 };
                const point2 = { x: 3, y: 4 };
                expect(calculateDistance(point1, point2)).toBe(5);
            });

            test("should handle same points", () => {
                const point = { x: 10, y: 20 };
                expect(calculateDistance(point, point)).toBe(0);
            });

            test("should handle negative coordinates", () => {
                const point1 = { x: -5, y: -5 };
                const point2 = { x: 5, y: 5 };
                expect(calculateDistance(point1, point2)).toBeCloseTo(14.14, 2);
            });
        });

        describe("calculateAngle", () => {
            test("should calculate angle between two points", () => {
                const point1 = { x: 0, y: 0 };
                const point2 = { x: 1, y: 0 }; // Horizontal right = 0°
                expect(calculateAngle(point1, point2)).toBe(0);
            });

            test("should handle vertical line", () => {
                const point1 = { x: 0, y: 0 };
                const point2 = { x: 0, y: 1 }; // Vertical up = 90°
                expect(calculateAngle(point1, point2)).toBe(90);
            });

            test("should handle diagonal line", () => {
                const point1 = { x: 0, y: 0 };
                const point2 = { x: 1, y: 1 }; // 45° diagonal
                expect(calculateAngle(point1, point2)).toBeCloseTo(45, 1);
            });

            test("should return angles in range [-180, 180]", () => {
                const point1 = { x: 0, y: 0 };
                const testPoints = [
                    { x: 1, y: 1 }, // NE (45°)
                    { x: -1, y: 1 }, // NW (135°)
                    { x: -1, y: -1 }, // SW (-135°)
                    { x: 1, y: -1 }, // SE (-45°)
                ];

                testPoints.forEach((point2) => {
                    const angle = calculateAngle(point1, point2);
                    expect(angle).toBeGreaterThanOrEqual(-180);
                    expect(angle).toBeLessThanOrEqual(180);
                });
            });
        });

        describe("calculateMidpoint", () => {
            test("should calculate midpoint between two points", () => {
                const point1 = { x: 0, y: 0 };
                const point2 = { x: 10, y: 20 };
                expect(calculateMidpoint(point1, point2)).toEqual({ x: 5, y: 10 });
            });

            test("should handle same points", () => {
                const point = { x: 15, y: 25 };
                expect(calculateMidpoint(point, point)).toEqual(point);
            });

            test("should handle negative coordinates", () => {
                const point1 = { x: -10, y: -20 };
                const point2 = { x: 10, y: 20 };
                expect(calculateMidpoint(point1, point2)).toEqual({ x: 0, y: 0 });
            });
        });
    });

    describe("createPointMeasurement", () => {
        test("should create measurement with all properties", () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 3, y: 4 };
            const measurement = createPointMeasurement(point1, point2, "test-id", "px");

            expect(measurement.id).toBe("test-id");
            expect(measurement.startPoint).toEqual(point1);
            expect(measurement.endPoint).toEqual(point2);
            expect(measurement.distance).toBe(5);
            expect(measurement.formattedDistance).toBe("5px"); // No trailing zeros
            expect(measurement.angle).toBeCloseTo(53.13, 2);
            expect(measurement.midpoint).toEqual({ x: 1.5, y: 2 });
        });

        test("should use different units", () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 96, y: 0 };
            const measurement = createPointMeasurement(point1, point2, "test-id", "in");

            expect(measurement.formattedDistance).toBe("1in"); // No trailing zeros
        });
    });

    describe("Coordinate Conversion", () => {
        const viewport: ViewportState = { zoom: 2, panX: 100, panY: 50, canvasWidth: 800, canvasHeight: 600 };

        describe("screenToCanvasCoordinate", () => {
            test("should convert screen X coordinate to canvas", () => {
                const result = screenToCanvasCoordinate(200, viewport, "x");
                expect(result).toBe(50); // (200 / 2) - (100 / 2)
            });

            test("should convert screen Y coordinate to canvas", () => {
                const result = screenToCanvasCoordinate(300, viewport, "y");
                expect(result).toBe(125); // (300 / 2) - (50 / 2)
            });

            test("should handle zoom level 1", () => {
                const simpleViewport = { zoom: 1, panX: 0, panY: 0, canvasWidth: 800, canvasHeight: 600 };
                expect(screenToCanvasCoordinate(100, simpleViewport, "x")).toBe(100);
                expect(screenToCanvasCoordinate(200, simpleViewport, "y")).toBe(200);
            });
        });

        describe("canvasToScreenCoordinate", () => {
            test("should convert canvas X coordinate to screen", () => {
                const result = canvasToScreenCoordinate(50, viewport, "x");
                expect(result).toBe(200); // (50 + 100/2) * 2
            });

            test("should convert canvas Y coordinate to screen", () => {
                const result = canvasToScreenCoordinate(125, viewport, "y");
                expect(result).toBe(300); // (125 + 50/2) * 2
            });

            test("should be inverse of screenToCanvasCoordinate", () => {
                const screenX = 150;
                const canvasX = screenToCanvasCoordinate(screenX, viewport, "x");
                const backToScreen = canvasToScreenCoordinate(canvasX, viewport, "x");
                expect(backToScreen).toBeCloseTo(screenX, 2);
            });
        });
    });

    describe("Constants", () => {
        test("should have all unit conversions defined", () => {
            const expectedUnits: UnitType[] = ["px", "pt", "in", "cm", "mm"];
            expectedUnits.forEach((unit) => {
                expect(UNIT_CONVERSIONS[unit]).toBeDefined();
                expect(typeof UNIT_CONVERSIONS[unit]).toBe("number");
                expect(UNIT_CONVERSIONS[unit]).toBeGreaterThan(0);
            });
        });

        test("should have all unit labels defined", () => {
            const expectedUnits: UnitType[] = ["px", "pt", "in", "cm", "mm"];
            expectedUnits.forEach((unit) => {
                expect(UNIT_LABELS[unit]).toBeDefined();
                expect(typeof UNIT_LABELS[unit]).toBe("string");
                expect(UNIT_LABELS[unit]).toBe(unit);
            });
        });

        test("should have pixels as base unit (conversion factor 1)", () => {
            expect(UNIT_CONVERSIONS.px).toBe(1);
        });
    });

    describe("Edge Cases", () => {
        test("should handle very small distances", () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 0.001, y: 0.001 };
            const distance = calculateDistance(point1, point2);
            expect(distance).toBeGreaterThan(0);
        });

        test("should handle very large distances", () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 1000000, y: 1000000 };
            const distance = calculateDistance(point1, point2);
            expect(distance).toBe(Math.sqrt(2000000000000));
        });

        test("should handle extreme zoom levels", () => {
            const extremeViewport = { zoom: 0.001, panX: 0, panY: 0, canvasWidth: 800, canvasHeight: 600 };
            expect(() => screenToCanvasCoordinate(100, extremeViewport, "x")).not.toThrow();

            const highZoomViewport = { zoom: 1000, panX: 0, panY: 0, canvasWidth: 800, canvasHeight: 600 };
            expect(() => screenToCanvasCoordinate(100, highZoomViewport, "x")).not.toThrow();
        });

        test("should handle zero precision formatting", () => {
            expect(formatDistance(123.456, "px", 0)).toBe("123px");
        });

        test("should handle high precision formatting", () => {
            expect(formatDistance(123.123456789, "px", 5)).toBe("123.12346px");
        });
    });
});
