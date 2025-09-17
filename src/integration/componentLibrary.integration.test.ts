import { describe, test, expect, beforeEach, vi } from "vitest";
import { ComponentLibraryUtils } from "../utils/componentLibraryUtils";
import type { ComponentTemplate, ComponentSaveOptions, CanvasObject, ComponentLibrary } from "../types/editor";

// Mock DOM APIs for integration tests
beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    const mockStorage = new Map<string, string>();
    global.localStorage = {
        getItem: vi.fn((key: string) => mockStorage.get(key) || null),
        setItem: vi.fn((key: string, value: string) => {
            mockStorage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
            mockStorage.delete(key);
        }),
        clear: vi.fn(() => {
            mockStorage.clear();
        }),
        length: 0,
        key: vi.fn(() => null),
    };

    // Clear storage for each test
    mockStorage.clear();

    // Mock btoa for base64 encoding
    global.btoa = vi.fn((str: string) => Buffer.from(str).toString("base64"));
});

describe("Component Library Integration", () => {
    test("complete component library workflow", () => {
        // 1. Create a default library
        const library = ComponentLibraryUtils.createDefaultLibrary();
        expect(library.id).toBe("default");
        expect(library.name).toBe("Default Library");
        expect(library.templates).toHaveLength(0);

        // 2. Create sample canvas objects
        const canvasObjects: CanvasObject[] = [
            {
                id: "rect-1",
                type: "rectangle",
                name: "Test Rectangle",
                transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "default",
                style: {
                    fill: "#ff0000",
                    stroke: "#000000",
                    strokeWidth: 1,
                },
                width: 100,
                height: 50,
            },
            {
                id: "circle-1",
                type: "circle",
                name: "Test Circle",
                transform: { x: 150, y: 80, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 0.8,
                zIndex: 1,
                layerId: "default",
                style: {
                    fill: "#00ff00",
                    stroke: "#000000",
                    strokeWidth: 2,
                },
                radius: 30,
            },
        ];

        // 3. Create a component template from objects
        const saveOptions: ComponentSaveOptions = {
            name: "Test Component",
            description: "A test component with rectangle and circle",
            category: "basic-shapes",
            tags: ["test", "shapes"],
        };

        const template = ComponentLibraryUtils.createComponentTemplate(canvasObjects, saveOptions);

        // 4. Verify template creation
        expect(template.name).toBe("Test Component");
        expect(template.description).toBe("A test component with rectangle and circle");
        expect(template.category).toBe("basic-shapes");
        expect(template.tags).toEqual(["test", "shapes"]);
        expect(template.objects).toHaveLength(2);

        // Verify objects are normalized (positions relative to component bounds)
        expect(template.objects[0].transform.x).toBe(0); // Rectangle normalized from x:10 to x:0
        expect(template.objects[0].transform.y).toBe(0); // Rectangle normalized from y:20 to y:0
        expect(template.objects[1].transform.x).toBe(140); // Circle normalized from x:150 to x:140 (150-10=140, normalized to left edge)
        expect(template.objects[1].transform.y).toBe(60); // Circle normalized from y:80 to y:60 (80-20=60, normalized to top edge)

        // 5. Add template to library
        const updatedLibrary: ComponentLibrary = {
            ...library,
            templates: [template],
        };

        // 6. Save library to storage
        ComponentLibraryUtils.saveToStorage([updatedLibrary]);

        // 7. Load library from storage
        const loadedLibraries = ComponentLibraryUtils.loadFromStorage();
        expect(loadedLibraries).toHaveLength(1);
        expect(loadedLibraries[0].templates).toHaveLength(1);
        expect(loadedLibraries[0].templates[0].name).toBe("Test Component");

        // 8. Search templates by name
        const searchResults = ComponentLibraryUtils.searchTemplates(updatedLibrary.templates, "Test");
        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].name).toBe("Test Component");

        // 9. Filter templates by category (using search with category filter)
        const categoryResults = ComponentLibraryUtils.searchTemplates(updatedLibrary.templates, "", "basic-shapes");
        expect(categoryResults).toHaveLength(1);

        // 10. Create component instance from template
        const componentInstance = ComponentLibraryUtils.createComponentInstance(
            template,
            { x: 200, y: 100 },
            "default"
        );
        expect(componentInstance.templateId).toBe(template.id);
        expect(componentInstance.transform.x).toBe(200);
        expect(componentInstance.transform.y).toBe(100);

        // Get resolved objects for the instance
        const resolvedObjects = ComponentLibraryUtils.resolveComponentInstance(componentInstance, template);
        expect(resolvedObjects).toHaveLength(2);

        // Verify instance objects have correct absolute positions
        expect(resolvedObjects[0].transform.x).toBe(200); // Rectangle at instance position
        expect(resolvedObjects[0].transform.y).toBe(100);
        expect(resolvedObjects[1].transform.x).toBe(340); // Circle at instance position + offset (200 + 140)
        expect(resolvedObjects[1].transform.y).toBe(160); // Circle at instance position + offset (100 + 60)

        // 11. Export and import library
        const exportedJson = ComponentLibraryUtils.exportLibrary(updatedLibrary);
        expect(typeof exportedJson).toBe("string");

        const importedLibrary = ComponentLibraryUtils.importLibrary(exportedJson);
        expect(importedLibrary.id).toBe(updatedLibrary.id);
        expect(importedLibrary.templates).toHaveLength(1);
        expect(importedLibrary.templates[0].name).toBe("Test Component");

        // 12. Generate thumbnail
        const thumbnail = ComponentLibraryUtils.generateThumbnail(template);
        expect(typeof thumbnail).toBe("string");
        expect(thumbnail).toContain("data:image/svg+xml;base64,");

        // Decode and verify it contains SVG
        const base64Data = thumbnail.replace("data:image/svg+xml;base64,", "");
        const decodedSvg = Buffer.from(base64Data, "base64").toString();
        expect(decodedSvg).toContain("<svg");
        expect(decodedSvg).toContain("</svg>");
    });

    test("component library persistence and recovery", () => {
        // Create and save multiple libraries
        const library1 = ComponentLibraryUtils.createDefaultLibrary();
        library1.id = "lib1";
        library1.name = "Library 1";

        const library2 = ComponentLibraryUtils.createDefaultLibrary();
        library2.id = "lib2";
        library2.name = "Library 2";

        // Save multiple libraries
        ComponentLibraryUtils.saveToStorage([library1, library2]);

        // Load and verify
        const loaded = ComponentLibraryUtils.loadFromStorage();
        expect(loaded).toHaveLength(2);
        expect(loaded.find((lib) => lib.id === "lib1")).toBeDefined();
        expect(loaded.find((lib) => lib.id === "lib2")).toBeDefined();
    });

    test("error handling and edge cases", () => {
        // Test with empty objects array
        const emptyBounds = ComponentLibraryUtils.calculateComponentBounds([]);
        expect(emptyBounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });

        // Test invalid JSON import
        expect(() => {
            ComponentLibraryUtils.importLibrary("invalid json");
        }).toThrow("Failed to import library");

        // Test search with empty query
        const allTemplates = ComponentLibraryUtils.searchTemplates([], "");
        expect(allTemplates).toHaveLength(0);

        // Test filter with non-existent category (using search)
        const noResults = ComponentLibraryUtils.searchTemplates([], "", "non-existent");
        expect(noResults).toHaveLength(0);
    });
});
