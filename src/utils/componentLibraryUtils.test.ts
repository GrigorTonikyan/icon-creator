import { describe, test, expect, beforeEach, vi } from "vitest";
import { ComponentLibraryUtils } from "./componentLibraryUtils";
import type { ComponentTemplate, ComponentSaveOptions, CanvasObject } from "../types/editor";

// Mock DOM and storage APIs
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

describe("ComponentLibraryUtils", () => {
    describe("ID Generation", () => {
        test("should generate unique IDs", () => {
            const id1 = ComponentLibraryUtils.generateId();
            const id2 = ComponentLibraryUtils.generateId();

            expect(id1).toBeDefined();
            expect(id2).toBeDefined();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^comp_\d+_[a-z0-9]+$/);
        });
    });

    describe("Default Library Creation", () => {
        test("should create default library with correct structure", () => {
            const library = ComponentLibraryUtils.createDefaultLibrary();

            expect(library.id).toBe("default");
            expect(library.name).toBe("Default Library");
            expect(library.version).toBe("1.0.0");
            expect(library.categories).toHaveLength(5);
            expect(library.templates).toHaveLength(0);
            expect(library.metadata.author).toBe("System");
        });

        test("should create default categories", () => {
            const categories = ComponentLibraryUtils.createDefaultCategories();

            expect(categories).toHaveLength(5);
            expect(categories[0].name).toBe("Basic Shapes");
            expect(categories[4].name).toBe("Custom");
            expect(categories.every((cat) => cat.order > 0)).toBe(true);
        });
    });

    describe("Component Bounds Calculation", () => {
        test("should calculate bounds for empty array", () => {
            const bounds = ComponentLibraryUtils.calculateComponentBounds([]);

            expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
        });

        test("should calculate bounds for single object", () => {
            const objects: CanvasObject[] = [
                {
                    id: "test-1",
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
            ];

            const bounds = ComponentLibraryUtils.calculateComponentBounds(objects);

            expect(bounds.x).toBe(10);
            expect(bounds.y).toBe(20);
            expect(bounds.width).toBe(100);
            expect(bounds.height).toBe(50);
        });
    });

    describe("Component Template Creation", () => {
        test("should create component template from objects", () => {
            const objects: CanvasObject[] = [
                {
                    id: "test-1",
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
            ];

            const options: ComponentSaveOptions = {
                name: "Test Component",
                description: "A test component",
                category: "basic-shapes",
                tags: ["test", "rectangle"],
            };

            const template = ComponentLibraryUtils.createComponentTemplate(objects, options);

            expect(template.name).toBe("Test Component");
            expect(template.description).toBe("A test component");
            expect(template.category).toBe("basic-shapes");
            expect(template.tags).toEqual(["test", "rectangle"]);
            expect(template.objects).toHaveLength(1);
            expect(template.metadata.bounds).toEqual({ x: 0, y: 0, width: 100, height: 50 });
            expect(template.metadata.version).toBe("1.0.0");
        });
    });

    describe("Component Instance Creation", () => {
        test("should create component instance", () => {
            const template: ComponentTemplate = {
                id: "template-1",
                name: "Test Template",
                category: "basic-shapes",
                tags: [],
                objects: [],
                metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: "1.0.0",
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                },
            };

            const position = { x: 50, y: 75 };
            const layerId = "test-layer";

            const instance = ComponentLibraryUtils.createComponentInstance(template, position, layerId);

            expect(instance.type).toBe("component");
            expect(instance.templateId).toBe("template-1");
            expect(instance.name).toBe("Test Template Instance");
            expect(instance.transform.x).toBe(50);
            expect(instance.transform.y).toBe(75);
            expect(instance.layerId).toBe("test-layer");
            expect(instance.propertyOverrides).toEqual({});
        });
    });

    describe("Search and Filtering", () => {
        test("should search templates by name", () => {
            const templates: ComponentTemplate[] = [
                {
                    id: "1",
                    name: "Red Rectangle",
                    category: "shapes",
                    tags: ["red", "rectangle"],
                    objects: [],
                    metadata: {
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        version: "1.0.0",
                        bounds: { x: 0, y: 0, width: 100, height: 100 },
                    },
                },
                {
                    id: "2",
                    name: "Blue Circle",
                    category: "shapes",
                    tags: ["blue", "circle"],
                    objects: [],
                    metadata: {
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        version: "1.0.0",
                        bounds: { x: 0, y: 0, width: 100, height: 100 },
                    },
                },
            ];

            const results = ComponentLibraryUtils.searchTemplates(templates, "red");

            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("Red Rectangle");
        });

        test("should filter templates by category", () => {
            const templates: ComponentTemplate[] = [
                {
                    id: "1",
                    name: "Shape 1",
                    category: "basic-shapes",
                    tags: [],
                    objects: [],
                    metadata: {
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        version: "1.0.0",
                        bounds: { x: 0, y: 0, width: 100, height: 100 },
                    },
                },
                {
                    id: "2",
                    name: "UI Element 1",
                    category: "ui-elements",
                    tags: [],
                    objects: [],
                    metadata: {
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        version: "1.0.0",
                        bounds: { x: 0, y: 0, width: 100, height: 100 },
                    },
                },
            ];

            const results = ComponentLibraryUtils.searchTemplates(templates, "", "basic-shapes");

            expect(results).toHaveLength(1);
            expect(results[0].category).toBe("basic-shapes");
        });
    });

    describe("Storage Operations", () => {
        test("should save and load libraries from storage", () => {
            const library = ComponentLibraryUtils.createDefaultLibrary();

            ComponentLibraryUtils.saveToStorage([library]);
            const loaded = ComponentLibraryUtils.loadFromStorage();

            expect(loaded).toHaveLength(1);
            expect(loaded[0].id).toBe(library.id);
            expect(loaded[0].name).toBe(library.name);
        });

        test("should handle empty storage gracefully", () => {
            // Clear storage first to ensure clean state
            global.localStorage.clear();

            const loaded = ComponentLibraryUtils.loadFromStorage();

            expect(loaded).toHaveLength(1); // Returns default library when storage is empty
            expect(loaded[0].id).toBe("default");
        });
    });

    describe("Import/Export", () => {
        test("should export library to JSON", () => {
            const library = ComponentLibraryUtils.createDefaultLibrary();

            const jsonData = ComponentLibraryUtils.exportLibrary(library);
            const parsed = JSON.parse(jsonData);

            expect(parsed.id).toBe(library.id);
            expect(parsed.name).toBe(library.name);
            expect(parsed.categories).toHaveLength(5);
        });

        test("should import library from JSON", () => {
            const library = ComponentLibraryUtils.createDefaultLibrary();
            const jsonData = ComponentLibraryUtils.exportLibrary(library);

            const imported = ComponentLibraryUtils.importLibrary(jsonData);

            expect(imported.id).toBe(library.id);
            expect(imported.name).toBe(library.name);
            expect(imported.categories).toHaveLength(5);
        });

        test("should handle invalid JSON gracefully", () => {
            expect(() => {
                ComponentLibraryUtils.importLibrary("invalid json");
            }).toThrow("Failed to import library");
        });
    });
});
