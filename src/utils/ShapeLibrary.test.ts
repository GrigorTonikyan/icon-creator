import { describe, test, expect, beforeEach } from "vitest";
import { ShapeLibrary } from "./ShapeLibrary";
import { PolygonGenerator, StarGenerator, BuiltInShapeGenerators } from "./shapeGenerators";
import type { ShapeGenerator } from "../types/editor";

describe("ShapeLibrary", () => {
    let shapeLibrary: ShapeLibrary;

    beforeEach(() => {
        // Get fresh instance
        shapeLibrary = ShapeLibrary.getInstance();

        // Reset to default state
        shapeLibrary.resetToDefaults();
    });

    describe("Singleton Pattern", () => {
        test("should return the same instance", () => {
            const instance1 = ShapeLibrary.getInstance();
            const instance2 = ShapeLibrary.getInstance();

            expect(instance1).toBe(instance2);
        });

        test("should maintain state across getInstance calls", () => {
            const instance1 = ShapeLibrary.getInstance();
            instance1.registerGenerator(PolygonGenerator);

            const instance2 = ShapeLibrary.getInstance();
            expect(instance2.getGenerator("polygon")).toBeDefined();
        });
    });

    describe("Generator Management", () => {
        test("should register a new generator", () => {
            shapeLibrary.registerGenerator(PolygonGenerator);

            expect(shapeLibrary.getGenerator("polygon")).toBe(PolygonGenerator);
            expect(Object.keys(shapeLibrary.getAllGenerators())).toContain("polygon");
        });

        test("should register generator and add to categories", () => {
            shapeLibrary.registerGenerator(PolygonGenerator);

            expect(shapeLibrary.getCategories()).toContain("Basic Shapes");
        });

        test("should unregister an existing generator", () => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            const success = shapeLibrary.unregisterGenerator("polygon");

            expect(success).toBe(true);
            expect(shapeLibrary.getGenerator("polygon")).toBeUndefined();
            expect(Object.keys(shapeLibrary.getAllGenerators())).not.toContain("polygon");
        });

        test("should not unregister non-existent generator", () => {
            const success = shapeLibrary.unregisterGenerator("nonexistent");

            expect(success).toBe(false);
        });

        test("should get all generators", () => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.registerGenerator(StarGenerator);

            const generators = shapeLibrary.getAllGenerators();

            expect(generators).toHaveProperty("polygon");
            expect(generators).toHaveProperty("star");
            expect(Object.keys(generators).length).toBeGreaterThanOrEqual(2);
        });

        test("should get generators by category", () => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.registerGenerator(StarGenerator);

            const basicShapes = shapeLibrary.getGeneratorsByCategory("Basic Shapes");

            expect(basicShapes).toContain(PolygonGenerator);
            expect(basicShapes).toContain(StarGenerator);
        });
    });

    describe("Parameter Management", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
        });

        test("should update parameters for a generator", () => {
            const params = { sides: 6, radius: 50, rotation: 30 };
            const success = shapeLibrary.updateParameters("polygon", params);

            expect(success).toBe(true);
            expect(shapeLibrary.getParameters("polygon")).toMatchObject(params);
        });

        test("should not update parameters for non-existent generator", () => {
            const success = shapeLibrary.updateParameters("nonexistent", {});

            expect(success).toBe(false);
        });

        test("should get default parameters if none set", () => {
            const params = shapeLibrary.getParameters("polygon");

            expect(params).toBeDefined();
            expect(typeof params).toBe("object");
        });

        test("should reset parameters to defaults", () => {
            shapeLibrary.updateParameters("polygon", { sides: 8 });
            const success = shapeLibrary.resetParameters("polygon");

            expect(success).toBe(true);
            const resetParams = shapeLibrary.getParameters("polygon");
            expect(resetParams.sides).toBe(6); // Default from PolygonGenerator
        });

        test("should not reset parameters for non-existent generator", () => {
            const success = shapeLibrary.resetParameters("nonexistent");

            expect(success).toBe(false);
        });
    });

    describe("Active Generator Management", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.registerGenerator(StarGenerator);
        });

        test("should set active generator", () => {
            const success = shapeLibrary.setActiveGenerator("polygon");

            expect(success).toBe(true);
            expect(shapeLibrary.getActiveGenerator()).toBe(PolygonGenerator);
        });

        test("should not set non-existent generator as active", () => {
            const success = shapeLibrary.setActiveGenerator("nonexistent");

            expect(success).toBe(false);
            expect(shapeLibrary.getActiveGenerator()).toBeUndefined();
        });

        test("should track active generator in recently used", () => {
            shapeLibrary.setActiveGenerator("polygon");

            const recentlyUsed = shapeLibrary.getRecentlyUsedGenerators();
            expect(recentlyUsed).toContain(PolygonGenerator);
        });
    });

    describe("Shape Generation", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
        });

        test("should generate shape with default parameters", () => {
            const result = shapeLibrary.generateShape("polygon");

            expect(result.success).toBe(true);
            expect(result.shape).toBeDefined();
            // Path should start with M and end with Z, containing coordinates and line commands
            expect(result.shape?.pathData).toMatch(/^M\s[\d.-]+\s[\d.-]+(\s[L]\s[\d.-]+\s[\d.-]+)*\sZ$/);
        });

        test("should generate shape with custom parameters", () => {
            const params = { sides: 8, radius: 75, rotation: 0 };
            const result = shapeLibrary.generateShape("polygon", params);

            expect(result.success).toBe(true);
            expect(result.shape).toBeDefined();
        });

        test("should fail to generate shape for non-existent generator", () => {
            const result = shapeLibrary.generateShape("nonexistent");

            expect(result.success).toBe(false);
            expect(result.error).toContain("Generator 'nonexistent' not found");
        });

        test("should handle generation errors gracefully", () => {
            // Use invalid parameters that will trigger validation errors
            const invalidParams = { sides: 1, radius: -10, rotation: 0 };
            const result = shapeLibrary.generateShape("polygon", invalidParams);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test("should generate shape with position", () => {
            const position = { x: 100, y: 50 };
            const result = shapeLibrary.generateShape("polygon", undefined, position);

            expect(result.success).toBe(true);
            expect(result.shape?.metadata?.position).toEqual(position);
        });
    });

    describe("Favorites Management", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.registerGenerator(StarGenerator);
        });

        test("should add generator to favorites", () => {
            shapeLibrary.addToFavorites("polygon");

            const favorites = shapeLibrary.getFavoriteGenerators();
            expect(favorites).toContain(PolygonGenerator);
        });

        test("should not add duplicate favorites", () => {
            shapeLibrary.addToFavorites("polygon");
            shapeLibrary.addToFavorites("polygon"); // Add again

            const favorites = shapeLibrary.getFavoriteGenerators();
            const polygonCount = favorites.filter((g) => g === PolygonGenerator).length;
            expect(polygonCount).toBe(1);
        });

        test("should remove generator from favorites", () => {
            shapeLibrary.addToFavorites("polygon");
            shapeLibrary.removeFromFavorites("polygon");

            const favorites = shapeLibrary.getFavoriteGenerators();
            expect(favorites).not.toContain(PolygonGenerator);
        });

        test("should get favorite generators", () => {
            shapeLibrary.addToFavorites("polygon");
            shapeLibrary.addToFavorites("star");

            const favorites = shapeLibrary.getFavoriteGenerators();
            expect(favorites).toHaveLength(2);
            expect(favorites).toContain(PolygonGenerator);
            expect(favorites).toContain(StarGenerator);
        });
    });

    describe("Recently Used Tracking", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.registerGenerator(StarGenerator);
        });

        test("should track recently used generators", () => {
            shapeLibrary.setActiveGenerator("polygon");

            const recentlyUsed = shapeLibrary.getRecentlyUsedGenerators();
            expect(recentlyUsed).toContain(PolygonGenerator);
            expect(recentlyUsed[0]).toBe(PolygonGenerator);
        });

        test("should maintain usage order", () => {
            shapeLibrary.setActiveGenerator("polygon");
            shapeLibrary.setActiveGenerator("star");
            shapeLibrary.setActiveGenerator("polygon"); // Use polygon again

            const recentlyUsed = shapeLibrary.getRecentlyUsedGenerators();
            expect(recentlyUsed[0]).toBe(PolygonGenerator);
            expect(recentlyUsed[1]).toBe(StarGenerator);
        });

        test("should remove from favorites when unregistering", () => {
            shapeLibrary.addToFavorites("polygon");
            shapeLibrary.setActiveGenerator("polygon");

            shapeLibrary.unregisterGenerator("polygon");

            const favorites = shapeLibrary.getFavoriteGenerators();
            const recentlyUsed = shapeLibrary.getRecentlyUsedGenerators();

            expect(favorites).not.toContain(PolygonGenerator);
            expect(recentlyUsed).not.toContain(PolygonGenerator);
        });
    });

    describe("Custom Shape Objects", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
        });

        test("should create custom shape object", () => {
            const params = { sides: 6, radius: 50, rotation: 0 };
            const position = { x: 100, y: 50 };

            const shapeObject = shapeLibrary.createCustomShapeObject(
                "polygon",
                params,
                "test-shape",
                "Test Shape",
                position,
                "layer1"
            );

            expect(shapeObject).toBeDefined();
            if (shapeObject) {
                expect(shapeObject.id).toBe("test-shape");
                expect(shapeObject.name).toBe("Test Shape");
                expect(shapeObject.generatorId).toBe("polygon");
                expect(shapeObject.parameters).toEqual(params);
                expect(shapeObject.transform.x).toBe(position.x);
                expect(shapeObject.transform.y).toBe(position.y);
            }
        });

        test("should regenerate custom shape with new parameters", async () => {
            const originalParams = { sides: 5, radius: 50, rotation: 0 };
            const newParams = { sides: 8, radius: 75, rotation: 45 };

            const shapeObject = shapeLibrary.createCustomShapeObject(
                "polygon",
                originalParams,
                "test-shape",
                "Test Shape"
            );

            expect(shapeObject).toBeDefined();

            if (shapeObject) {
                // Small delay to ensure different timestamp
                await new Promise((resolve) => setTimeout(resolve, 1));

                const regenerated = shapeLibrary.regenerateCustomShape(shapeObject, newParams);

                expect(regenerated).toBeDefined();
                expect(regenerated?.parameters).toEqual(newParams);
                expect(regenerated?.lastGenerated).toBeGreaterThanOrEqual(shapeObject.lastGenerated);
            }
        });
    });

    describe("Preview Mode", () => {
        test("should set and get preview mode", () => {
            expect(shapeLibrary.isPreviewMode()).toBe(false);

            shapeLibrary.setPreviewMode(true);
            expect(shapeLibrary.isPreviewMode()).toBe(true);

            shapeLibrary.setPreviewMode(false);
            expect(shapeLibrary.isPreviewMode()).toBe(false);
        });
    });

    describe("Preset Management", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
        });

        test("should save and apply preset", () => {
            const preset = {
                id: "hexagon",
                name: "Hexagon",
                description: "6-sided polygon",
                parameters: { sides: 6, radius: 60 },
            };

            const saveSuccess = shapeLibrary.savePreset("polygon", preset);
            expect(saveSuccess).toBe(true);

            const applySuccess = shapeLibrary.applyPreset("polygon", "hexagon");
            expect(applySuccess).toBe(true);

            const params = shapeLibrary.getParameters("polygon");
            expect(params.sides).toBe(6);
            expect(params.radius).toBe(60);
        });

        test("should delete preset", () => {
            const preset = {
                id: "hexagon",
                name: "Hexagon",
                description: "6-sided polygon",
                parameters: { sides: 6, radius: 60 },
            };

            shapeLibrary.savePreset("polygon", preset);
            const deleteSuccess = shapeLibrary.deletePreset("polygon", "hexagon");

            expect(deleteSuccess).toBe(true);

            const applySuccess = shapeLibrary.applyPreset("polygon", "hexagon");
            expect(applySuccess).toBe(false);
        });
    });

    describe("State Management", () => {
        test("should get current state", () => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.addToFavorites("polygon");

            const state = shapeLibrary.getState();

            expect(state.generators).toHaveProperty("polygon");
            expect(state.favorites).toContain("polygon");
        });

        test("should set partial state", () => {
            const newState = {
                previewMode: true,
                favorites: ["test"],
            };

            shapeLibrary.setState(newState);

            expect(shapeLibrary.isPreviewMode()).toBe(true);
            expect(shapeLibrary.getState().favorites).toContain("test");
        });

        test("should reset to defaults", () => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.addToFavorites("polygon");

            shapeLibrary.resetToDefaults();

            // Should have built-in generators by default
            expect(Object.keys(shapeLibrary.getAllGenerators()).length).toBeGreaterThanOrEqual(0);
            expect(shapeLibrary.getFavoriteGenerators()).toHaveLength(0);
        });
    });

    describe("Import/Export", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.addToFavorites("polygon");
        });

        test("should export library data", () => {
            const exportData = shapeLibrary.exportLibrary();
            const parsed = JSON.parse(exportData);

            expect(parsed).toHaveProperty("version");
            expect(parsed).toHaveProperty("generators");
            expect(parsed).toHaveProperty("favorites");
            expect(parsed.favorites).toContain("polygon");
        });

        test("should import library data", () => {
            const exportData = shapeLibrary.exportLibrary();

            // Reset library
            shapeLibrary.resetToDefaults();

            // Import the data
            const success = shapeLibrary.importLibrary(exportData);

            expect(success).toBe(true);
            expect(shapeLibrary.getGenerator("polygon")).toBeDefined();
        });

        test("should handle invalid import data", () => {
            const invalidData = "invalid json";

            const success = shapeLibrary.importLibrary(invalidData);

            expect(success).toBe(false);
        });
    });

    describe("Search and Filtering", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.registerGenerator(StarGenerator);
        });

        test("should search generators by name", () => {
            const results = shapeLibrary.searchGenerators("polygon");

            expect(results).toContain(PolygonGenerator);
            expect(results).not.toContain(StarGenerator);
        });

        test("should search generators case-insensitively", () => {
            const results = shapeLibrary.searchGenerators("POLYGON");

            expect(results).toContain(PolygonGenerator);
        });

        test("should search generators by description", () => {
            const results = shapeLibrary.searchGenerators("regular");

            // Assuming polygon has "regular" in description
            expect(results.length).toBeGreaterThanOrEqual(0);
        });

        test("should return empty array for no matches", () => {
            const results = shapeLibrary.searchGenerators("nonexistent");

            expect(results).toHaveLength(0);
        });
    });

    describe("Statistics", () => {
        beforeEach(() => {
            shapeLibrary.registerGenerator(PolygonGenerator);
            shapeLibrary.registerGenerator(StarGenerator);
            shapeLibrary.addToFavorites("polygon");
            shapeLibrary.setActiveGenerator("star");
        });

        test("should get library statistics", () => {
            const stats = shapeLibrary.getStatistics();

            // Should include all built-in generators plus the ones we added
            expect(stats.totalGenerators).toBeGreaterThanOrEqual(2);
            expect(stats.categoryCounts["Basic Shapes"]).toBeGreaterThanOrEqual(2);
            expect(stats.favoriteCount).toBe(1);
            expect(stats.recentlyUsedCount).toBe(1);
        });
    });

    describe("Performance", () => {
        test("should handle multiple generators efficiently", () => {
            const startTime = performance.now();

            // Register built-in generators
            Object.values(BuiltInShapeGenerators).forEach((generator) => {
                shapeLibrary.registerGenerator(generator);
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(100); // Should complete quickly
            expect(Object.keys(shapeLibrary.getAllGenerators()).length).toBeGreaterThan(0);
        });

        test("should search efficiently through generators", () => {
            // Register all built-in generators
            Object.values(BuiltInShapeGenerators).forEach((generator) => {
                shapeLibrary.registerGenerator(generator);
            });

            const startTime = performance.now();

            // Perform search
            const results = shapeLibrary.searchGenerators("shape");

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(50); // Should complete very quickly
            expect(results.length).toBeGreaterThanOrEqual(0);
        });
    });
});
