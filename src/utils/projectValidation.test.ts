import { describe, expect, test } from "vitest";
import type { EditorState, ProjectData } from "../types/editor";
import { createEmptyProject, serializeProject } from "./project";
import { validateProjectDataEnhanced, validateProjectSchema, validateProjectWithDetails } from "./projectValidation";

// Create a valid test project
const validProject = createEmptyProject("Test Project");

// Create an editor state for testing
const mockEditorState: EditorState = {
    objects: {
        rect1: {
            id: "rect1",
            type: "rectangle",
            name: "Rectangle 1",
            width: 200,
            height: 150,
            style: {
                fill: "#ff0000",
                stroke: "#000000",
                strokeWidth: 2,
            },
            layerId: "layer1",
            zIndex: 1,
            locked: false,
            visible: true,
            opacity: 1,
            transform: {
                x: 100,
                y: 100,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
        },
    },
    layers: {
        layer1: {
            id: "layer1",
            name: "Main Layer",
            visible: true,
            locked: false,
            objects: ["rect1"],
            children: [],
            expanded: true,
            opacity: 1,
            blendMode: "normal",
            type: "default",
            order: 0,
            createdAt: 1703097600000,
            updatedAt: 1703097600000,
        },
    },
    layerOrder: ["layer1"],
    selection: { objectIds: [] },
    layerSelection: { selectedLayerIds: [] },
    viewport: {
        zoom: 1,
        panX: 0,
        panY: 0,
        canvasWidth: 800,
        canvasHeight: 600,
    },
    selectedTool: "select",
    gridVisible: true,
    snapToGrid: false,
    gridSize: 20,
    canUndo: false,
    canRedo: false,
    history: {
        undoStack: [],
        redoStack: [],
        maxHistorySize: 50,
        isExecutingHistory: false,
    },
};

const validComplexProject = serializeProject(mockEditorState, {
    id: "test-project",
    name: "Test Project",
    description: "A test project",
});

describe("projectValidation", () => {
    describe("validateProjectSchema", () => {
        test("should validate correct project data", () => {
            const result = validateProjectSchema(validProject);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("should reject null/undefined data", () => {
            expect(validateProjectSchema(null).valid).toBe(false);
            expect(validateProjectSchema(undefined).valid).toBe(false);
        });

        test("should reject non-object data", () => {
            expect(validateProjectSchema("string").valid).toBe(false);
            expect(validateProjectSchema(123).valid).toBe(false);
            expect(validateProjectSchema([]).valid).toBe(false);
        });

        test("should reject missing required fields", () => {
            const incompleteProject = { ...validProject };
            delete (incompleteProject as any).metadata;

            const result = validateProjectSchema(incompleteProject);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes("metadata"))).toBe(true);
        });

        test("should reject invalid metadata", () => {
            const invalidProject = {
                ...validProject,
                metadata: {
                    ...validProject.metadata,
                    id: 123, // Should be string
                },
            };

            const result = validateProjectSchema(invalidProject);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.path === "metadata.id")).toBe(true);
        });

        test("should reject invalid editor state", () => {
            const invalidProject = {
                ...validProject,
                editorState: {
                    ...validProject.editorState,
                    objects: "not-an-object", // Should be object
                },
            };

            const result = validateProjectSchema(invalidProject);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.path === "editorState.objects")).toBe(true);
        });

        test("should validate complex project with objects and layers", () => {
            const result = validateProjectSchema(validComplexProject);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe("validateProjectDataEnhanced", () => {
        test("should validate correct project data", () => {
            const result = validateProjectDataEnhanced(validComplexProject);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test("should check version compatibility", () => {
            const incompatibleProject = {
                ...validProject,
                metadata: {
                    ...validProject.metadata,
                    version: "2.0.0", // Incompatible major version
                },
            };

            const result = validateProjectDataEnhanced(incompatibleProject);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes("not compatible"))).toBe(true);
        });

        test("should check timestamp consistency", () => {
            const invalidTimestamps = {
                ...validProject,
                metadata: {
                    ...validProject.metadata,
                    createdAt: 2000,
                    lastModified: 1000, // Should be >= createdAt
                },
            };

            const result = validateProjectDataEnhanced(invalidTimestamps);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes("createdAt timestamp"))).toBe(true);
        });

        test("should check object-layer references", () => {
            const brokenReferences: ProjectData = {
                ...validComplexProject,
                editorState: {
                    ...validComplexProject.editorState,
                    objects: {
                        rect1: {
                            ...(validComplexProject.editorState.objects["rect1"] as any),
                            layerId: "non-existent-layer", // Reference to non-existent layer
                        },
                    },
                },
            };

            const result = validateProjectDataEnhanced(brokenReferences);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes("non-existent layer"))).toBe(true);
        });

        test("should check layer-object references", () => {
            const brokenReferences: ProjectData = {
                ...validComplexProject,
                editorState: {
                    ...validComplexProject.editorState,
                    layers: {
                        layer1: {
                            ...(validComplexProject.editorState.layers["layer1"] as any),
                            objects: ["non-existent-object"], // Reference to non-existent object
                        },
                    },
                },
            };

            const result = validateProjectDataEnhanced(brokenReferences);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes("non-existent object"))).toBe(true);
        });

        test("should check selection references", () => {
            const brokenSelection: ProjectData = {
                ...validComplexProject,
                editorState: {
                    ...validComplexProject.editorState,
                    selection: {
                        objectIds: ["non-existent-object"], // Reference to non-existent object
                    },
                },
            };

            const result = validateProjectDataEnhanced(brokenSelection);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes("Selection references non-existent object"))).toBe(
                true
            );
        });

        test("should check layer order references", () => {
            const brokenLayerOrder: ProjectData = {
                ...validComplexProject,
                editorState: {
                    ...validComplexProject.editorState,
                    layerOrder: ["non-existent-layer"], // Reference to non-existent layer
                },
            };

            const result = validateProjectDataEnhanced(brokenLayerOrder);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes("Layer order references non-existent layer"))).toBe(
                true
            );
        });
    });

    describe("validateProjectWithDetails", () => {
        test("should provide detailed validation results for valid project", () => {
            const result = validateProjectWithDetails(validProject);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.summary).toContain("valid and ready to load");
        });

        test("should provide detailed validation results for invalid project", () => {
            const invalidProject = {
                ...validProject,
                metadata: null, // Invalid metadata
            };

            const result = validateProjectWithDetails(invalidProject);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.summary).toContain("error(s) and cannot be loaded");
        });

        test("should generate warnings for large projects", () => {
            // Create a project with many objects
            const largeProject = JSON.parse(JSON.stringify(validComplexProject));
            const manyObjects: any = {};

            // Add 1001 objects to trigger warning, but put them all in layer1
            for (let i = 0; i < 1001; i++) {
                manyObjects[`object-${i}`] = {
                    ...validComplexProject.editorState.objects["rect1"],
                    id: `object-${i}`,
                    layerId: "layer1", // Ensure they reference an existing layer
                };
            }

            largeProject.editorState.objects = manyObjects;

            // Update layer1 to include all these objects (or disable validation)
            largeProject.editorState.layers.layer1.objects = Object.keys(manyObjects);

            const result = validateProjectWithDetails(largeProject);

            expect(result.isValid).toBe(true);
            expect(result.warnings.some((w: string) => w.includes("many objects"))).toBe(true);
        });

        test("should detect deep layer nesting", () => {
            const deepProject = JSON.parse(JSON.stringify(validComplexProject));
            const layers: any = {};

            // Create 12 nested layers
            for (let i = 0; i < 12; i++) {
                layers[`layer-${i}`] = {
                    ...validComplexProject.editorState.layers["layer1"],
                    id: `layer-${i}`,
                    name: `Layer ${i}`,
                    children: i < 11 ? [`layer-${i + 1}`] : [],
                    objects: [], // Empty objects to avoid validation errors
                };
            }

            deepProject.editorState.layers = layers;
            deepProject.editorState.layerOrder = Object.keys(layers);
            deepProject.editorState.objects = {}; // Remove all objects to avoid validation issues
            deepProject.editorState.selection = { objectIds: [] };
            deepProject.editorState.layerSelection = { selectedLayerIds: [], activeLayerId: null };

            const result = validateProjectWithDetails(deepProject);

            expect(result.warnings.some((w: string) => w.includes("Layer nesting is deep"))).toBe(true);
        });
    });
});
