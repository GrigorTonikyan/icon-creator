/**
 * Tests for performance optimization utilities including progressive rendering
 */

import { describe, test, expect, beforeEach } from "vitest";
import type { CanvasObject } from "../types/editor";
import {
    determineRenderLevel,
    createSimplifiedObject,
    applyProgressiveRendering,
    simplifyPathData,
    isPathComplex,
    createProgressivePath,
    LODRenderer,
    type ProgressiveRenderOptions,
} from "./performance";

// Mock objects for testing
const mockRectObject: CanvasObject = {
    id: "rect1",
    type: "rectangle",
    name: "Test Rectangle",
    layerId: "layer1",
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    transform: {
        x: 100,
        y: 100,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
    },
    width: 200,
    height: 150,
    borderRadius: 10,
    style: {
        fill: "#007ACC",
        stroke: "#ffffff",
        strokeWidth: 2,
    },
};

const mockPathObject: CanvasObject = {
    id: "path1",
    type: "path",
    name: "Test Path",
    layerId: "layer1",
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    transform: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
    },
    pathData: "M10.123,20.456 L30.789,40.321 C50.654,60.987 70.123,80.456 90.789,100.321 Z",
    style: {
        fill: "none",
        stroke: "#007ACC",
        strokeWidth: 2,
    },
};

const defaultProgressiveOptions: ProgressiveRenderOptions = {
    enableLOD: true,
    lodThresholds: {
        full: 1.0,
        simplified: 0.5,
        placeholder: 0.1,
    },
    simplificationLevel: 0.7,
    enablePathProgressive: true,
    pathSegmentThreshold: 20,
};

describe("determineRenderLevel", () => {
    test("should return full render level for high zoom", () => {
        const result = determineRenderLevel(1.5, mockRectObject, defaultProgressiveOptions);
        expect(result).toBe("full");
    });

    test("should return simplified render level for medium zoom", () => {
        const result = determineRenderLevel(0.7, mockRectObject, defaultProgressiveOptions);
        expect(result).toBe("simplified");
    });

    test("should return placeholder render level for low zoom", () => {
        const result = determineRenderLevel(0.05, mockRectObject, defaultProgressiveOptions);
        expect(result).toBe("placeholder");
    });

    test("should return full when LOD is disabled", () => {
        const disabledOptions = { ...defaultProgressiveOptions, enableLOD: false };
        const result = determineRenderLevel(0.05, mockRectObject, disabledOptions);
        expect(result).toBe("full");
    });
});

describe("createSimplifiedObject", () => {
    test("should create simplified object with correct properties", () => {
        const simplified = createSimplifiedObject(mockRectObject, 0.5, false);

        expect(simplified.id).toBe(mockRectObject.id);
        expect(simplified.type).toBe(mockRectObject.type);
        expect(simplified.originalObject).toBe(mockRectObject);
        expect(simplified.simplificationLevel).toBe(0.5);
        expect(simplified.renderAsPlaceholder).toBe(false);
        expect(simplified.transform).toBe(mockRectObject.transform);
    });

    test("should create placeholder object when specified", () => {
        const placeholder = createSimplifiedObject(mockRectObject, 1, true);

        expect(placeholder.type).toBe("placeholder");
        expect(placeholder.renderAsPlaceholder).toBe(true);
        expect(placeholder.simplificationLevel).toBe(1);
    });
});

describe("applyProgressiveRendering", () => {
    test("should return original objects for high zoom", () => {
        const objects = [mockRectObject];
        const result = applyProgressiveRendering(objects, 1.5, defaultProgressiveOptions);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockRectObject);
    });

    test("should return simplified objects for medium zoom", () => {
        const objects = [mockRectObject];
        const result = applyProgressiveRendering(objects, 0.7, defaultProgressiveOptions);

        expect(result).toHaveLength(1);
        expect("originalObject" in result[0]).toBe(true);
        expect((result[0] as any).renderAsPlaceholder).toBe(false);
    });

    test("should return placeholder objects for low zoom", () => {
        const objects = [mockRectObject];
        const result = applyProgressiveRendering(objects, 0.05, defaultProgressiveOptions);

        expect(result).toHaveLength(1);
        expect("originalObject" in result[0]).toBe(true);
        expect((result[0] as any).renderAsPlaceholder).toBe(true);
    });
});

describe("simplifyPathData", () => {
    const pathData = "M10.123,20.456 L30.789,40.321 C50.654,60.987 70.123,80.456 90.789,100.321 Z";

    test("should return original path data when simplification level is 0", () => {
        const result = simplifyPathData(pathData, 0);
        expect(result).toBe(pathData);
    });

    test("should reduce precision for simplified paths", () => {
        const result = simplifyPathData(pathData, 0.5);

        // Should contain simplified coordinates with less precision
        expect(result).toContain("M10");
        expect(result).toContain("20");
        expect(result).not.toContain(".123");
        expect(result).not.toContain(".456");
    });

    test("should handle extreme simplification", () => {
        const result = simplifyPathData(pathData, 1);

        // Should have minimal precision
        expect(result).toMatch(/M\d+,\d+/);
        expect(result).not.toContain(".");
    });
});

describe("isPathComplex", () => {
    test("should identify simple paths as not complex", () => {
        const simplePath = "M10,20 L30,40";
        const result = isPathComplex(simplePath, 5);
        expect(result).toBe(false);
    });

    test("should identify complex paths correctly", () => {
        const complexPath = "M10,20 L30,40 C50,60 70,80 90,100 Q110,120 130,140 T150,160 A170,180 0 0,1 190,200";
        const result = isPathComplex(complexPath, 5);
        expect(result).toBe(true);
    });
});

describe("createProgressivePath", () => {
    const pathData = "M10.123,20.456 L30.789,40.321 C50.654,60.987 70.123,80.456 90.789,100.321 Z";

    test("should return original path when progressive rendering is disabled", () => {
        const disabledOptions = { ...defaultProgressiveOptions, enablePathProgressive: false };
        const result = createProgressivePath(pathData, 0.5, disabledOptions);
        expect(result).toBe(pathData);
    });

    test("should simplify complex paths", () => {
        const complexPath =
            "M10.123,20.456 L30.789,40.321 C50.654,60.987 70.123,80.456 90.789,100.321 Q110.123,120.456 130.789,140.321";
        const lowThresholdOptions = { ...defaultProgressiveOptions, pathSegmentThreshold: 3 };

        const result = createProgressivePath(complexPath, 0.7, lowThresholdOptions);

        // Should be simplified (less precision)
        expect(result).not.toBe(complexPath);
        expect(result.length).toBeLessThanOrEqual(complexPath.length);
    });
});

describe("LODRenderer", () => {
    let lodRenderer: LODRenderer;

    beforeEach(() => {
        lodRenderer = new LODRenderer(defaultProgressiveOptions);
    });

    test("should create LOD renderer with options", () => {
        expect(lodRenderer).toBeInstanceOf(LODRenderer);
    });

    test("should return appropriate representation based on zoom", () => {
        // Full detail at high zoom
        const fullResult = lodRenderer.getRenderRepresentation(mockRectObject, 1.5);
        expect(fullResult).toBe(mockRectObject);

        // Simplified at medium zoom
        const simplifiedResult = lodRenderer.getRenderRepresentation(mockRectObject, 0.7);
        expect("originalObject" in simplifiedResult).toBe(true);
        expect((simplifiedResult as any).renderAsPlaceholder).toBe(false);

        // Placeholder at low zoom
        const placeholderResult = lodRenderer.getRenderRepresentation(mockRectObject, 0.05);
        expect("originalObject" in placeholderResult).toBe(true);
        expect((placeholderResult as any).renderAsPlaceholder).toBe(true);
    });

    test("should cache results for performance", () => {
        const result1 = lodRenderer.getRenderRepresentation(mockRectObject, 0.7);
        const result2 = lodRenderer.getRenderRepresentation(mockRectObject, 0.7);

        // Should return the same cached result
        expect(result1).toBe(result2);
    });

    test("should clear cache when requested", () => {
        lodRenderer.getRenderRepresentation(mockRectObject, 0.7);
        const statsBeforeClear = lodRenderer.getCacheStats();
        expect(statsBeforeClear.size).toBeGreaterThan(0);

        lodRenderer.clearCache();
        const statsAfterClear = lodRenderer.getCacheStats();
        expect(statsAfterClear.size).toBe(0);
    });

    test("should update options and clear cache", () => {
        lodRenderer.getRenderRepresentation(mockRectObject, 0.7);
        expect(lodRenderer.getCacheStats().size).toBeGreaterThan(0);

        lodRenderer.updateOptions({ simplificationLevel: 0.9 });
        expect(lodRenderer.getCacheStats().size).toBe(0);
    });

    test("should provide cache statistics", () => {
        lodRenderer.getRenderRepresentation(mockRectObject, 0.7);
        lodRenderer.getRenderRepresentation(mockPathObject, 0.5);

        const stats = lodRenderer.getCacheStats();
        expect(stats.size).toBe(2);
        expect(stats.memoryUsage).toBeGreaterThan(0);
    });
});
