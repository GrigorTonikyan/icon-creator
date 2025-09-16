import { beforeEach, describe, expect, test, vi } from "vitest";
import type { EditorState } from "../types/editor";
import {
    createEmptyProject,
    deserializeProject,
    PROJECT_VERSION,
    serializeProject,
    validateProjectData,
} from "./project";

// Mock editor state for testing
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
            layerId: "default",
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
        default: {
            id: "default",
            name: "Layer 1",
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
    layerOrder: ["default"],
    selection: { objectIds: ["rect1"] },
    layerSelection: { selectedLayerIds: ["default"] },
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
    canUndo: true,
    canRedo: false,
    history: {
        undoStack: [
            {
                id: "history-1",
                timestamp: 1703097600000,
                description: "Add rectangle",
                action: {
                    type: "ADD_OBJECT",
                    payload: {
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
                        layerId: "default",
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
                previousState: {
                    objects: {},
                    layers: {
                        default: {
                            id: "default",
                            name: "Layer 1",
                            visible: true,
                            locked: false,
                            objects: [],
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
                    layerOrder: ["default"],
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
                },
            },
        ],
        redoStack: [],
        maxHistorySize: 50,
        isExecutingHistory: false,
    },
};

describe("project utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("serializeProject", () => {
        test("should serialize editor state with default metadata", () => {
            const result = serializeProject(mockEditorState);

            expect(result).toHaveProperty("metadata");
            expect(result).toHaveProperty("editorState");
            expect(result).toHaveProperty("historySnapshot");

            expect(result.metadata.version).toBe(PROJECT_VERSION);
            expect(result.metadata.name).toBe("Untitled Project");
            expect(result.metadata.id).toMatch(/^project_\d+$/);
            expect(typeof result.metadata.createdAt).toBe("number");
            expect(typeof result.metadata.lastModified).toBe("number");

            expect(result.editorState.objects).toEqual(mockEditorState.objects);
            expect(result.editorState.layers).toEqual(mockEditorState.layers);
            expect(result.editorState.selection).toEqual(mockEditorState.selection);
        });

        test("should serialize with custom metadata", () => {
            const customMetadata = {
                id: "custom-project-id",
                name: "My Custom Project",
                description: "A test project",
                tags: ["test", "icon"],
            };

            const result = serializeProject(mockEditorState, customMetadata);

            expect(result.metadata.id).toBe(customMetadata.id);
            expect(result.metadata.name).toBe(customMetadata.name);
            expect(result.metadata.description).toBe(customMetadata.description);
            expect(result.metadata.tags).toEqual(customMetadata.tags);
        });

        test("should include limited history snapshot", () => {
            const result = serializeProject(mockEditorState);

            expect(Array.isArray(result.historySnapshot)).toBe(true);
            expect(result.historySnapshot?.length).toBe(1);
            expect(result.historySnapshot?.[0]).toEqual(mockEditorState.history.undoStack[0]);
        });

        test("should exclude non-serializable editor state properties", () => {
            const result = serializeProject(mockEditorState);

            expect(result.editorState).not.toHaveProperty("canUndo");
            expect(result.editorState).not.toHaveProperty("canRedo");
            expect(result.editorState).not.toHaveProperty("history");
        });
    });

    describe("deserializeProject", () => {
        test("should deserialize valid project data", () => {
            const projectData = serializeProject(mockEditorState, { name: "Test Project" });
            const result = deserializeProject(projectData);

            expect(result.editorState).toEqual(projectData.editorState);
            expect(result.metadata).toEqual(projectData.metadata);
        });

        test("should throw error for incompatible version", () => {
            const projectData = serializeProject(mockEditorState);
            projectData.metadata.version = "2.0.0"; // Incompatible major version

            expect(() => deserializeProject(projectData)).toThrow(
                "Project version 2.0.0 is not compatible with current version"
            );
        });
    });

    describe("validateProjectData", () => {
        test("should validate correct project data", () => {
            const projectData = serializeProject(mockEditorState);
            expect(validateProjectData(projectData)).toBe(true);
        });

        test("should reject invalid data types", () => {
            expect(validateProjectData(null)).toBe(false);
            expect(validateProjectData(undefined)).toBe(false);
            expect(validateProjectData("string")).toBe(false);
            expect(validateProjectData(123)).toBe(false);
            expect(validateProjectData([])).toBe(false);
        });

        test("should reject missing required properties", () => {
            const validData = serializeProject(mockEditorState);

            // Missing metadata
            const missingMetadata = { ...validData };
            delete (missingMetadata as any).metadata;
            expect(validateProjectData(missingMetadata)).toBe(false);

            // Missing editorState
            const missingEditorState = { ...validData };
            delete (missingEditorState as any).editorState;
            expect(validateProjectData(missingEditorState)).toBe(false);
        });

        test("should reject invalid metadata properties", () => {
            const validData = serializeProject(mockEditorState);

            // Invalid metadata.id
            const invalidId = { ...validData };
            invalidId.metadata.id = 123 as any;
            expect(validateProjectData(invalidId)).toBe(false);

            // Invalid metadata.createdAt
            const invalidCreatedAt = { ...validData };
            invalidCreatedAt.metadata.createdAt = "not-a-number" as any;
            expect(validateProjectData(invalidCreatedAt)).toBe(false);
        });

        test("should reject invalid editor state structure", () => {
            const validData = serializeProject(mockEditorState);

            // Invalid objects
            const invalidObjects = { ...validData };
            invalidObjects.editorState.objects = "not-an-object" as any;
            expect(validateProjectData(invalidObjects)).toBe(false);

            // Invalid layerOrder
            const invalidLayerOrder = { ...validData };
            invalidLayerOrder.editorState.layerOrder = "not-an-array" as any;
            expect(validateProjectData(invalidLayerOrder)).toBe(false);
        });
    });

    describe("createEmptyProject", () => {
        test("should create empty project with default name", () => {
            const project = createEmptyProject();

            expect(project.metadata.name).toBe("New Project");
            expect(project.metadata.version).toBe(PROJECT_VERSION);
            expect(typeof project.metadata.id).toBe("string");
            expect(typeof project.metadata.createdAt).toBe("number");
            expect(typeof project.metadata.lastModified).toBe("number");

            expect(project.editorState.objects).toEqual({});
            expect(project.editorState.layers).toEqual({});
            expect(project.editorState.layerOrder).toEqual([]);
            expect(project.editorState.selection.objectIds).toEqual([]);
        });

        test("should create empty project with custom name", () => {
            const project = createEmptyProject("My New Icon");

            expect(project.metadata.name).toBe("My New Icon");
        });

        test("should create valid project structure", () => {
            const project = createEmptyProject();
            expect(validateProjectData(project)).toBe(true);
        });
    });
});
