import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { RectangleObject } from "../types/editor";
import { EditorProvider, useEditor } from "./EditorContext";

describe("History Optimization", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

    // Mock console methods for development logging tests
    const originalEnv = process.env.NODE_ENV;
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    afterEach(() => {
        consoleSpy.mockClear();
        process.env.NODE_ENV = originalEnv;
    });

    test("should compress consecutive UPDATE_OBJECT actions for the same object", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "test-rect",
            type: "rectangle",
            name: "Test Rectangle",
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

        // Add initial object
        act(() => {
            result.current.addObject(testObject);
        });

        const initialHistoryLength = result.current.state.history.undoStack.length;

        // Update the same object multiple times consecutively
        act(() => {
            result.current.updateObject(testObject.id, { transform: { ...testObject.transform, x: 15 } });
        });

        act(() => {
            result.current.updateObject(testObject.id, { transform: { ...testObject.transform, x: 20 } });
        });

        act(() => {
            result.current.updateObject(testObject.id, { transform: { ...testObject.transform, x: 25 } });
        });

        // Should compress the consecutive updates into a single history entry
        // Should have: add object + compressed update = 2 entries instead of 4
        expect(result.current.state.history.undoStack.length).toBe(initialHistoryLength + 1);

        // Verify the object has the final value
        expect(result.current.state.objects[testObject.id]?.transform.x).toBe(25);

        // Undo should restore to state before all updates
        act(() => {
            result.current.undo();
        });

        expect(result.current.state.objects[testObject.id]?.transform.x).toBe(10);
    });

    test("should compress consecutive SET_VIEWPORT actions", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const initialHistoryLength = result.current.state.history.undoStack.length;

        // Multiple viewport changes
        act(() => {
            result.current.dispatch({ type: "SET_VIEWPORT", payload: { zoom: 1.5 } });
        });

        act(() => {
            result.current.dispatch({ type: "SET_VIEWPORT", payload: { panX: 10 } });
        });

        act(() => {
            result.current.dispatch({ type: "SET_VIEWPORT", payload: { panY: 20 } });
        });

        // Should compress viewport changes
        expect(result.current.state.history.undoStack.length).toBe(initialHistoryLength + 1);

        // Final viewport should have all changes
        expect(result.current.state.viewport.zoom).toBe(1.5);
        expect(result.current.state.viewport.panX).toBe(10);
        expect(result.current.state.viewport.panY).toBe(20);
    });

    test("should NOT compress different action types", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "test-rect",
            type: "rectangle",
            name: "Test Rectangle",
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

        const initialHistoryLength = result.current.state.history.undoStack.length;

        // Add object
        act(() => {
            result.current.addObject(testObject);
        });

        // Update object (different action type)
        act(() => {
            result.current.updateObject(testObject.id, { transform: { ...testObject.transform, x: 15 } });
        });

        // Should NOT compress different action types
        expect(result.current.state.history.undoStack.length).toBe(initialHistoryLength + 2);
    });

    test("should NOT compress UPDATE_OBJECT actions for different objects", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

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
            ...testObject1,
            id: "test-rect-2",
            name: "Test Rectangle 2",
        };

        // Add objects
        act(() => {
            result.current.addObject(testObject1);
        });

        act(() => {
            result.current.addObject(testObject2);
        });

        const historyAfterAdd = result.current.state.history.undoStack.length;

        // Update different objects
        act(() => {
            result.current.updateObject(testObject1.id, { transform: { ...testObject1.transform, x: 15 } });
        });

        act(() => {
            result.current.updateObject(testObject2.id, { transform: { ...testObject2.transform, x: 25 } });
        });

        // Should NOT compress updates to different objects
        expect(result.current.state.history.undoStack.length).toBe(historyAfterAdd + 2);
    });

    test("should limit history size for memory management", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Get the max history size
        const maxSize = result.current.state.history.maxHistorySize;

        // Add more objects than max history size
        for (let i = 0; i < maxSize + 10; i++) {
            const testObject: RectangleObject = {
                id: `test-rect-${i}`,
                type: "rectangle",
                name: `Test Rectangle ${i}`,
                transform: { x: i * 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                style: { fill: "#ff0000", stroke: "#000000" },
                layerId: "default",
                width: 100,
                height: 50,
            };

            act(() => {
                result.current.addObject(testObject);
            });
        }

        // History should be limited to max size
        expect(result.current.state.history.undoStack.length).toBeLessThanOrEqual(maxSize);
    });

    test("should use delta storage for single object updates", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "test-rect",
            type: "rectangle",
            name: "Test Rectangle",
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

        // Add object
        act(() => {
            result.current.addObject(testObject);
        });

        // Update the object
        act(() => {
            result.current.updateObject(testObject.id, { transform: { ...testObject.transform, x: 15 } });
        });

        // Get the last history entry (update action)
        const updateHistoryEntry =
            result.current.state.history.undoStack[result.current.state.history.undoStack.length - 1];

        // For delta storage, the previous state should only contain the affected object
        if (updateHistoryEntry) {
            expect(updateHistoryEntry.previousState.objects).toBeDefined();
            expect(Object.keys(updateHistoryEntry.previousState.objects)).toHaveLength(1);
            expect(updateHistoryEntry.previousState.objects[testObject.id]).toBeDefined();
        }
    });

    test("should calculate memory usage and log warnings in development", () => {
        process.env.NODE_ENV = "development";
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Create many large objects to trigger memory logging
        for (let i = 0; i < 50; i++) {
            const largeObject: RectangleObject = {
                id: `large-rect-${i}`,
                type: "rectangle",
                name: `Large Rectangle ${i}`.repeat(50), // Make it large
                transform: { x: i * 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                style: { fill: "#ff0000", stroke: "#000000" },
                layerId: "default",
                width: 100,
                height: 50,
            };

            act(() => {
                result.current.addObject(largeObject);
            });
        }

        // Should have logged memory usage warnings
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Memory usage"));
    });

    test("should handle memory optimization for large history stacks", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Create a scenario with many objects to test memory optimization
        const largeObjects: RectangleObject[] = [];
        for (let i = 0; i < 100; i++) {
            const obj: RectangleObject = {
                id: `memory-test-${i}`,
                type: "rectangle",
                name: `Memory Test ${i}`,
                transform: { x: i * 5, y: i * 5, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: i,
                style: { fill: `#${i.toString(16).padStart(6, "0")}`, stroke: "#000000" },
                layerId: "default",
                width: 100 + i,
                height: 50 + i,
            };
            largeObjects.push(obj);
        }

        // Add all objects
        act(() => {
            largeObjects.forEach((obj) => {
                result.current.addObject(obj);
            });
        });

        // Update all objects multiple times to create large history
        act(() => {
            largeObjects.forEach((obj, index) => {
                result.current.updateObject(obj.id, {
                    transform: { ...obj.transform, x: obj.transform.x + 100 },
                });
            });
        });

        // Memory optimization should keep history under control
        const historyLength = result.current.state.history.undoStack.length;
        const maxSize = result.current.state.history.maxHistorySize;

        expect(historyLength).toBeLessThanOrEqual(maxSize);
        expect(result.current.state.canUndo).toBe(true);
    });

    test("should properly restore delta storage entries during undo", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "delta-test",
            type: "rectangle",
            name: "Delta Test",
            transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            style: { fill: "#00ff00", stroke: "#000000" },
            layerId: "default",
            width: 150,
            height: 75,
        };

        // Add object
        act(() => {
            result.current.addObject(testObject);
        });

        const originalX = result.current.state.objects[testObject.id]?.transform.x;

        // Update object (should use delta storage)
        act(() => {
            result.current.updateObject(testObject.id, {
                transform: { ...testObject.transform, x: 300 },
                style: { ...testObject.style, fill: "#0000ff" },
            });
        });

        // Verify update applied
        expect(result.current.state.objects[testObject.id]?.transform.x).toBe(300);
        expect((result.current.state.objects[testObject.id] as RectangleObject)?.style.fill).toBe("#0000ff");

        // Undo should restore previous state using delta storage
        act(() => {
            result.current.undo();
        });

        // Should restore to original values
        expect(result.current.state.objects[testObject.id]?.transform.x).toBe(originalX);
        expect((result.current.state.objects[testObject.id] as RectangleObject)?.style.fill).toBe("#00ff00");
    });
});
