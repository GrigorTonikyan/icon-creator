import { describe, test, expect, beforeEach } from "vitest";
import {
    PolygonGenerator,
    StarGenerator,
    GearGenerator,
    ArrowGenerator,
    SpeechBubbleGenerator,
    createDefaultShapeLibraryState,
    BuiltInShapeGenerators,
    ShapeGeneratorUtils,
} from "./shapeGenerators";
import type { ShapeParameter, ShapeGeneratorResult } from "../types/editor";

describe("ShapeGenerators", () => {
    describe("PolygonGenerator", () => {
        test("should generate valid polygon with default parameters", () => {
            const result = PolygonGenerator.generate({});

            expect(result.success).toBe(true);
            expect(result.shape).toBeDefined();
            expect(result.shape?.pathData).toMatch(/^M[\d\s,.-]+Z$/);
        });

        test("should generate triangle with 3 sides", () => {
            const result = PolygonGenerator.generate({ sides: 3 });

            expect(result.success).toBe(true);
            expect(result.shape?.pathData).toBeDefined();
            // Should have 3 line segments in the path
            const pathCommands = result.shape?.pathData.match(/[ML]/g);
            expect(pathCommands?.length).toBe(4); // M + 3 L commands
        });

        test("should generate hexagon with 6 sides", () => {
            const result = PolygonGenerator.generate({ sides: 6 });

            expect(result.success).toBe(true);
            expect(result.shape?.pathData).toBeDefined();
            // Should have 6 line segments in the path
            const pathCommands = result.shape?.pathData.match(/[ML]/g);
            expect(pathCommands?.length).toBe(7); // M + 6 L commands
        });

        test("should apply custom radius", () => {
            const smallResult = PolygonGenerator.generate({ radius: 25 });
            const largeResult = PolygonGenerator.generate({ radius: 100 });

            expect(smallResult.success).toBe(true);
            expect(largeResult.success).toBe(true);

            // Large polygon should have larger coordinates
            const smallPath = smallResult.shape?.pathData || "";
            const largePath = largeResult.shape?.pathData || "";

            const smallCoords = smallPath.match(/[\d.]+/g)?.map(Number) || [];
            const largeCoords = largePath.match(/[\d.]+/g)?.map(Number) || [];

            const maxSmall = Math.max(...smallCoords);
            const maxLarge = Math.max(...largeCoords);

            expect(maxLarge).toBeGreaterThan(maxSmall);
        });

        test("should validate parameters correctly", () => {
            const validParams = { sides: 5, radius: 50 };
            const invalidParams = { sides: 1, radius: -10 };

            const validErrors = PolygonGenerator.validateParameters?.(validParams);
            const invalidErrors = PolygonGenerator.validateParameters?.(invalidParams);

            expect(validErrors).toHaveLength(0);
            expect(invalidErrors?.length).toBeGreaterThan(0);
        });

        test("should handle edge cases", () => {
            // Maximum sides
            const maxResult = PolygonGenerator.generate({ sides: 20 });
            expect(maxResult.success).toBe(true);

            // Minimum valid sides
            const minResult = PolygonGenerator.generate({ sides: 3 });
            expect(minResult.success).toBe(true);
        });
    });

    describe("StarGenerator", () => {
        test("should generate valid star with default parameters", () => {
            const result = StarGenerator.generate({});

            expect(result.success).toBe(true);
            expect(result.shape).toBeDefined();
            expect(result.shape?.pathData).toMatch(/^M[\d\s,.-]+Z$/);
        });

        test("should generate 6-pointed star", () => {
            const result = StarGenerator.generate({ points: 6 });

            expect(result.success).toBe(true);
            expect(result.shape?.pathData).toBeDefined();
            // Star should have alternating outer and inner points
            const pathCommands = result.shape?.pathData.match(/[ML]/g);
            expect(pathCommands?.length).toBe(13); // M + 12 L commands (6 outer + 6 inner)
        });

        test("should apply inner radius correctly", () => {
            const result = StarGenerator.generate({
                points: 5,
                outerRadius: 50,
                innerRadius: 25,
            });

            expect(result.success).toBe(true);
            expect(result.shape?.pathData).toBeDefined();
        });

        test("should validate inner radius constraints", () => {
            const invalidParams = { outerRadius: 50, innerRadius: 60 };
            const errors = StarGenerator.validateParameters?.(invalidParams);

            expect(errors?.length).toBeGreaterThan(0);
            expect(errors?.[0]).toContain("inner radius");
        });
    });

    describe("GearGenerator", () => {
        test("should generate valid gear with default parameters", () => {
            const result = GearGenerator.generate({});

            expect(result.success).toBe(true);
            expect(result.shape).toBeDefined();
            expect(result.shape?.pathData).toMatch(/^M[\d\s,.-]+Z$/);
        });

        test("should generate gear with custom tooth count", () => {
            const result = GearGenerator.generate({ teeth: 12 });

            expect(result.success).toBe(true);
            expect(result.shape?.pathData).toBeDefined();
            // Gear should have multiple segments for teeth
            const pathData = result.shape?.pathData || "";
            expect(pathData.length).toBeGreaterThan(100); // Complex path for teeth
        });

        test("should apply tooth depth correctly", () => {
            const shallowResult = GearGenerator.generate({ toothDepth: 0.1 });
            const deepResult = GearGenerator.generate({ toothDepth: 0.5 });

            expect(shallowResult.success).toBe(true);
            expect(deepResult.success).toBe(true);

            // Deep gear should have more variation in coordinates
            const shallowPath = shallowResult.shape?.pathData || "";
            const deepPath = deepResult.shape?.pathData || "";

            expect(deepPath.length).toBeGreaterThanOrEqual(shallowPath.length);
        });
    });

    describe("ArrowGenerator", () => {
        test("should generate valid arrow with default parameters", () => {
            const result = ArrowGenerator.generate({});

            expect(result.success).toBe(true);
            expect(result.shape).toBeDefined();
            expect(result.shape?.pathData).toMatch(/^M[\d\s,.-]+Z$/);
        });

        test("should handle different directions", () => {
            const directions = ["up", "down", "left", "right"];

            directions.forEach((direction) => {
                const result = ArrowGenerator.generate({ direction });
                expect(result.success).toBe(true);
                expect(result.shape?.pathData).toBeDefined();
            });
        });

        test("should apply shaft width correctly", () => {
            const narrowResult = ArrowGenerator.generate({ shaftWidth: 0.2 });
            const wideResult = ArrowGenerator.generate({ shaftWidth: 0.8 });

            expect(narrowResult.success).toBe(true);
            expect(wideResult.success).toBe(true);
        });

        test("should validate direction parameter", () => {
            const invalidParams = { direction: "invalid" };
            const errors = ArrowGenerator.validateParameters?.(invalidParams);

            expect(errors?.length).toBeGreaterThan(0);
        });
    });

    describe("SpeechBubbleGenerator", () => {
        test("should generate valid speech bubble with default parameters", () => {
            const result = SpeechBubbleGenerator.generate({});

            expect(result.success).toBe(true);
            expect(result.shape).toBeDefined();
            expect(result.shape?.pathData).toMatch(/^M[\d\s,.-]+Z$/);
        });

        test("should handle different tail positions", () => {
            const positions = ["bottom-left", "bottom-center", "bottom-right", "left", "right"];

            positions.forEach((tailPosition) => {
                const result = SpeechBubbleGenerator.generate({ tailPosition });
                expect(result.success).toBe(true);
                expect(result.shape?.pathData).toBeDefined();
            });
        });

        test("should apply corner radius correctly", () => {
            const sharpResult = SpeechBubbleGenerator.generate({ cornerRadius: 0 });
            const roundResult = SpeechBubbleGenerator.generate({ cornerRadius: 20 });

            expect(sharpResult.success).toBe(true);
            expect(roundResult.success).toBe(true);

            // Round bubble should have curves (C commands)
            const roundPath = roundResult.shape?.pathData || "";
            expect(roundPath).toMatch(/C/);
        });
    });

    describe("Utility Functions", () => {
        describe("ShapeGeneratorUtils", () => {
            test("should generate polygon path data", () => {
                const pathData = ShapeGeneratorUtils.generatePolygon(6, 50, 0, 0, 0);
                expect(pathData).toMatch(/^M[\d\s,.-]+Z$/);
                expect(pathData).toContain("M");
                expect(pathData).toContain("L");
                expect(pathData).toContain("Z");
            });

            test("should handle different polygon sides", () => {
                const triangle = ShapeGeneratorUtils.generatePolygon(3, 50);
                const hexagon = ShapeGeneratorUtils.generatePolygon(6, 50);

                expect(triangle).toBeDefined();
                expect(hexagon).toBeDefined();
                expect(triangle.length).toBeLessThan(hexagon.length);
            });
        });

        describe("createDefaultShapeLibraryState", () => {
            test("should include all built-in generators", () => {
                const state = createDefaultShapeLibraryState();

                expect(state.generators).toHaveProperty("polygon");
                expect(state.generators).toHaveProperty("star");
                expect(state.generators).toHaveProperty("gear");
                expect(state.generators).toHaveProperty("arrow");
                expect(state.generators).toHaveProperty("speech-bubble");
            });

            test("should have valid initial state", () => {
                const state = createDefaultShapeLibraryState();

                expect(state.parameterValues).toBeDefined();
                expect(state.lastUsed).toEqual([]);
                expect(state.favorites).toEqual([]);
                expect(state.categories).toContain("Basic Shapes");
                expect(state.previewMode).toBe(false);
            });

            test("should reference built-in generators", () => {
                const state = createDefaultShapeLibraryState();

                expect(state.generators).toBe(BuiltInShapeGenerators);
                expect(Object.keys(state.generators)).toHaveLength(5);
            });
        });
    });

    describe("Error Handling", () => {
        test("should handle invalid parameters gracefully", () => {
            const result = PolygonGenerator.generate({ sides: "invalid" });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test("should provide helpful error messages", () => {
            const result = PolygonGenerator.generate({ sides: 1 });

            expect(result.success).toBe(false);
            expect(result.error).toContain("sides");
        });

        test("should handle missing required parameters", () => {
            // Test with completely empty parameters
            const generators = [PolygonGenerator, StarGenerator, GearGenerator, ArrowGenerator, SpeechBubbleGenerator];

            generators.forEach((generator) => {
                const result = generator.generate({});
                // Should either succeed with defaults or fail gracefully
                expect(typeof result.success).toBe("boolean");
                if (!result.success) {
                    expect(result.error).toBeDefined();
                }
            });
        });
    });

    describe("Performance", () => {
        test("should generate shapes efficiently", () => {
            const startTime = performance.now();

            // Generate multiple shapes
            for (let i = 0; i < 100; i++) {
                PolygonGenerator.generate({ sides: 6, radius: 50 });
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete 100 generations in reasonable time (less than 1 second)
            expect(duration).toBeLessThan(1000);
        });

        test("should handle complex shapes efficiently", () => {
            const startTime = performance.now();

            // Generate complex gear
            GearGenerator.generate({ teeth: 50, toothDepth: 0.3 });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Complex shape should still generate quickly (less than 100ms)
            expect(duration).toBeLessThan(100);
        });
    });
});
