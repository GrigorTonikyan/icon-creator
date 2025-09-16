import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ProjectData, RectangleObject } from "../types/editor";
import * as storageUtils from "../utils/storage";
import { EditorProvider, useEditor } from "./EditorContext";

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
            return Object.keys(store).length;
        },
    };
})();

Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});

describe("Persistence and Recovery Integration", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("should save and load project with complete state", async () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Create test objects
        const testObject1: RectangleObject = {
            id: "test-rect-1",
            type: "rectangle",
            name: "Test Rectangle 1",
            transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            style: { fill: "#ff0000", stroke: "#000000" },
            layerId: "default",
            width: 100,
            height: 50,
        };

        const testObject2: RectangleObject = {
            id: "test-rect-2",
            type: "rectangle",
            name: "Test Rectangle 2",
            transform: { x: 110, y: 120, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 0.5,
            zIndex: 1,
            style: { fill: "#00ff00", stroke: "#000000" },
            layerId: "default",
            width: 150,
            height: 75,
        };

        // Add objects and create history
        act(() => {
            result.current.addObject(testObject1);
        });

        act(() => {
            result.current.addObject(testObject2);
        });

        act(() => {
            result.current.updateObject(testObject1.id, {
                transform: { ...testObject1.transform, x: 50 },
            });
        });

        // Verify initial state
        expect(result.current.state.objects[testObject1.id]).toBeDefined();
        expect(result.current.state.objects[testObject2.id]).toBeDefined();
        expect(result.current.state.canUndo).toBe(true);
        expect(result.current.state.history.undoStack.length).toBeGreaterThan(0);

        // Save project
        const projectData = result.current.saveProject({
            name: "Test Project",
            description: "Integration test project",
        });

        // Verify project data structure
        expect(projectData.metadata.name).toBe("Test Project");
        expect(projectData.metadata.description).toBe("Integration test project");
        expect(projectData.editorState.objects[testObject1.id]).toBeDefined();
        expect(projectData.editorState.objects[testObject2.id]).toBeDefined();

        // Save to storage
        await storageUtils.saveProjectToLocalStorage(projectData);

        // Clear editor state
        act(() => {
            result.current.dispatch({ type: "CLEAR_HISTORY" });
            result.current.deleteObject(testObject1.id);
            result.current.deleteObject(testObject2.id);
        });

        // Verify cleared state
        expect(result.current.state.objects[testObject1.id]).toBeUndefined();
        expect(result.current.state.objects[testObject2.id]).toBeUndefined();
        expect(result.current.state.canUndo).toBe(false);

        // Load project back
        const loadedProject = await storageUtils.loadProjectFromLocalStorage(projectData.metadata.id);
        expect(loadedProject).toBeTruthy();

        if (loadedProject) {
            act(() => {
                result.current.loadProject(loadedProject);
            });

            // Verify restored state
            expect(result.current.state.objects[testObject1.id]).toBeDefined();
            expect(result.current.state.objects[testObject2.id]).toBeDefined();
            expect(result.current.state.objects[testObject1.id]?.transform.x).toBe(50); // Updated value
            expect(result.current.state.objects[testObject2.id]?.opacity).toBe(0.5);
        }
    });

    test("should handle auto-save and recovery workflow", async () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Enable auto-save
        act(() => {
            result.current.updateAutoSaveSettings({
                enabled: true,
                interval: 1000, // 1 second for testing
                maxAutoSaves: 3,
                showRecoveryPrompt: true,
            });
        });

        // Add test content
        const testObject: RectangleObject = {
            id: "auto-save-test",
            type: "rectangle",
            name: "Auto Save Test",
            transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            style: { fill: "#0000ff", stroke: "#000000" },
            layerId: "default",
            width: 200,
            height: 100,
        };

        act(() => {
            result.current.addObject(testObject);
        });

        // Trigger auto-save manually
        const projectData = result.current.saveProject({
            name: "Auto Save Test",
            description: "Test auto-save functionality",
        });
        await storageUtils.autoSaveProject(projectData);

        // Verify auto-save exists
        expect(storageUtils.hasAutoSavedProject()).toBe(true);

        // Load auto-saved project
        const autoSavedProject = await storageUtils.loadAutoSavedProject();
        expect(autoSavedProject).toBeTruthy();
        expect(autoSavedProject?.metadata.name).toBe("Auto Save Test");
        expect(autoSavedProject?.editorState.objects[testObject.id]).toBeDefined();

        // Clear auto-save
        storageUtils.clearAutoSavedProject();
        expect(storageUtils.hasAutoSavedProject()).toBe(false);
    });

    test("should handle crash recovery scenario", async () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Simulate working on a project
        const testObjects: RectangleObject[] = [];
        for (let i = 0; i < 5; i++) {
            const obj: RectangleObject = {
                id: `crash-test-${i}`,
                type: "rectangle",
                name: `Crash Test ${i}`,
                transform: { x: i * 50, y: i * 30, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: i,
                style: { fill: `#${i}${i}${i}${i}${i}${i}`, stroke: "#000000" },
                layerId: "default",
                width: 100,
                height: 60,
            };
            testObjects.push(obj);

            act(() => {
                result.current.addObject(obj);
            });
        }

        // Perform some operations to create history
        act(() => {
            result.current.updateObject(testObjects[0]!.id, {
                transform: { ...testObjects[0]!.transform, x: 999 },
            });
        });

        act(() => {
            result.current.deleteObject(testObjects[1]!.id);
        });

        // Simulate auto-save before crash
        const projectBeforeCrash = result.current.saveProject({
            name: "Crash Recovery Test",
            description: "Project with unsaved changes",
        });
        await storageUtils.autoSaveProject(projectBeforeCrash);

        // Simulate crash (create new editor instance)
        const { result: newResult } = renderHook(() => useEditor(), { wrapper });

        // Check for auto-saved data (crash recovery scenario)
        expect(storageUtils.hasAutoSavedProject()).toBe(true);

        // Load crashed project
        const recoveredProject = await storageUtils.loadAutoSavedProject();
        expect(recoveredProject).toBeTruthy();

        if (recoveredProject) {
            act(() => {
                newResult.current.loadProject(recoveredProject);
            });

            // Verify recovered state
            expect(newResult.current.state.objects[testObjects[0]!.id]?.transform.x).toBe(999);
            expect(newResult.current.state.objects[testObjects[1]!.id]).toBeUndefined(); // Was deleted
            expect(newResult.current.state.objects[testObjects[2]!.id]).toBeDefined();
            expect(Object.keys(newResult.current.state.objects)).toHaveLength(4); // 5 - 1 deleted
        }
    });

    test("should preserve history with action compression during save/load", async () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "compression-test",
            type: "rectangle",
            name: "Compression Test",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            style: { fill: "#ff00ff", stroke: "#000000" },
            layerId: "default",
            width: 100,
            height: 100,
        };

        // Add object
        act(() => {
            result.current.addObject(testObject);
        });

        // Perform multiple consecutive updates (should be compressed)
        for (let i = 1; i <= 10; i++) {
            act(() => {
                result.current.updateObject(testObject.id, {
                    transform: { ...testObject.transform, x: i * 10 },
                });
            });
        }

        // Verify compression occurred
        const historyLength = result.current.state.history.undoStack.length;
        expect(historyLength).toBeLessThan(11); // Should be compressed

        // Save project with history
        const projectData = result.current.saveProject({
            name: "Compression Test",
            description: "Test history compression",
        });
        projectData.historySnapshot = result.current.state.history.undoStack;

        // Save and reload
        await storageUtils.saveProjectToLocalStorage(projectData);
        const reloadedProject = await storageUtils.loadProjectFromLocalStorage(projectData.metadata.id);

        if (reloadedProject) {
            act(() => {
                result.current.loadProject(reloadedProject);
            });

            // Verify history was preserved
            expect(result.current.state.canUndo).toBe(true);
            expect(result.current.state.objects[testObject.id]?.transform.x).toBe(100); // Final value

            // Test undo functionality
            act(() => {
                result.current.undo();
            });

            // Should undo the compressed update
            expect(result.current.state.objects[testObject.id]?.transform.x).toBe(0); // Original value
        }
    });

    test("should handle memory optimization during large operations", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Create many objects to test memory management
        const largeObjects: RectangleObject[] = [];
        for (let i = 0; i < 200; i++) {
            const obj: RectangleObject = {
                id: `memory-test-${i}`,
                type: "rectangle",
                name: `Memory Test Object ${i}`,
                transform: { x: (i % 20) * 50, y: Math.floor(i / 20) * 40, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: i,
                style: { fill: `#${(i % 256).toString(16).padStart(2, "0")}0000`, stroke: "#000000" },
                layerId: "default",
                width: 40,
                height: 30,
            };
            largeObjects.push(obj);
        }

        // Add all objects at once
        act(() => {
            largeObjects.forEach((obj) => {
                result.current.addObject(obj);
            });
        });

        // Perform updates to create large history
        act(() => {
            largeObjects.slice(0, 50).forEach((obj) => {
                result.current.updateObject(obj.id, {
                    transform: { ...obj.transform, x: obj.transform.x + 100 },
                });
            });
        });

        // Verify memory management kept history under control
        const maxHistorySize = result.current.state.history.maxHistorySize;
        expect(result.current.state.history.undoStack.length).toBeLessThanOrEqual(maxHistorySize);

        // Verify functionality still works
        expect(result.current.state.canUndo).toBe(true);
        expect(Object.keys(result.current.state.objects)).toHaveLength(200);
    });

    test("should handle edge cases and error scenarios", async () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Test with corrupted auto-save data
        localStorageMock.setItem("icon-creator-autosave", '{"invalid": "data"}');
        const corruptedResult = await storageUtils.loadAutoSavedProject();
        expect(corruptedResult).toBeNull();

        // Test with missing project data
        const missingProject = await storageUtils.loadProjectFromLocalStorage("non-existent-id");
        expect(missingProject).toBeNull();

        // Test clearing non-existent auto-save
        storageUtils.clearAutoSavedProject();
        expect(storageUtils.hasAutoSavedProject()).toBe(false);

        // Test project validation with invalid data
        const invalidProjectData = {
            metadata: { id: "test", name: "Test" }, // Missing required fields
            editorState: {}, // Invalid structure
        } as ProjectData;

        expect(() => {
            act(() => {
                result.current.loadProject(invalidProjectData);
            });
        }).not.toThrow(); // Should handle gracefully
    });

    test("should maintain performance with delta storage optimization", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "delta-performance-test",
            type: "rectangle",
            name: "Delta Performance Test",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            style: { fill: "#ffffff", stroke: "#000000" },
            layerId: "default",
            width: 100,
            height: 100,
        };

        // Add object
        act(() => {
            result.current.addObject(testObject);
        });

        // Track memory usage before updates
        const initialHistoryEntry = result.current.state.history.undoStack[0];
        const initialSize = JSON.stringify(initialHistoryEntry).length;

        // Perform single object update (should use delta storage)
        act(() => {
            result.current.updateObject(testObject.id, {
                transform: { ...testObject.transform, x: 500 },
            });
        });

        // Check that delta storage was used
        const updateHistoryEntry =
            result.current.state.history.undoStack[result.current.state.history.undoStack.length - 1];
        if (updateHistoryEntry) {
            const updateSize = JSON.stringify(updateHistoryEntry).length;
            // Delta storage should be more memory efficient for single object updates
            expect(Object.keys(updateHistoryEntry.previousState.objects)).toHaveLength(1);
        }

        // Verify undo still works correctly with delta storage
        act(() => {
            result.current.undo();
        });

        expect(result.current.state.objects[testObject.id]?.transform.x).toBe(0);
    });
});
