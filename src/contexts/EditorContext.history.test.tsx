import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { RectangleObject } from "../types/editor";
import { EditorProvider, useEditor } from "./EditorContext";

describe("History System", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

    test("should start with empty history", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        expect(result.current.state.canUndo).toBe(false);
        expect(result.current.state.canRedo).toBe(false);
        expect(result.current.state.history.undoStack).toHaveLength(0);
        expect(result.current.state.history.redoStack).toHaveLength(0);
    });

    test("should record history when adding objects", () => {
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

        act(() => {
            result.current.addObject(testObject);
        });

        // Should record history and allow undo
        expect(result.current.state.canUndo).toBe(true);
        expect(result.current.state.canRedo).toBe(false);
        expect(result.current.state.history.undoStack).toHaveLength(1);
        expect(result.current.state.objects[testObject.id]).toBeDefined();
    });

    test("should undo object creation", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "undo-test",
            type: "rectangle",
            name: "Undo Test",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            style: {},
            layerId: "default",
            width: 100,
            height: 50,
        };

        // Add object
        act(() => {
            result.current.addObject(testObject);
        });

        // Verify object exists
        expect(result.current.state.objects[testObject.id]).toBeDefined();
        expect(result.current.state.canUndo).toBe(true);

        // Undo
        act(() => {
            result.current.undo();
        });

        // Object should be removed and redo should be available
        expect(result.current.state.objects[testObject.id]).toBeUndefined();
        expect(result.current.state.canUndo).toBe(false);
        expect(result.current.state.canRedo).toBe(true);
    });

    test("should redo object creation", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "redo-test",
            type: "rectangle",
            name: "Redo Test",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            layerId: "default",
            width: 100,
            height: 50,
        };

        // Add object and undo
        act(() => {
            result.current.addObject(testObject);
        });
        act(() => {
            result.current.undo();
        });

        // Verify object is gone and redo is available
        expect(result.current.state.objects[testObject.id]).toBeUndefined();
        expect(result.current.state.canRedo).toBe(true);

        // Redo
        act(() => {
            result.current.redo();
        });

        // Object should be back
        expect(result.current.state.objects[testObject.id]).toBeDefined();
        expect(result.current.state.canUndo).toBe(true);
        expect(result.current.state.canRedo).toBe(false);
    });

    test("should handle multiple operations and undo/redo", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const rect1: RectangleObject = {
            id: "rect1",
            type: "rectangle",
            name: "Rectangle 1",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            layerId: "default",
            width: 100,
            height: 50,
        };

        const rect2: RectangleObject = {
            id: "rect2",
            type: "rectangle",
            name: "Rectangle 2",
            transform: { x: 50, y: 25, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            layerId: "default",
            width: 75,
            height: 40,
        };

        // Add two objects
        act(() => {
            result.current.addObject(rect1);
        });
        act(() => {
            result.current.addObject(rect2);
        });

        // Should have 2 history entries
        expect(result.current.state.history.undoStack).toHaveLength(2);
        expect(Object.keys(result.current.state.objects)).toHaveLength(2);

        // Undo once
        act(() => {
            result.current.undo();
        });

        // Should only have rect1
        expect(result.current.state.objects.rect1).toBeDefined();
        expect(result.current.state.objects.rect2).toBeUndefined();
        expect(result.current.state.history.undoStack).toHaveLength(1);
        expect(result.current.state.history.redoStack).toHaveLength(1);

        // Undo again
        act(() => {
            result.current.undo();
        });

        // Should have no objects
        expect(Object.keys(result.current.state.objects)).toHaveLength(0);
        expect(result.current.state.history.undoStack).toHaveLength(0);
        expect(result.current.state.history.redoStack).toHaveLength(2);
    });

    test("should clear redo stack when new action is performed", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const rect1: RectangleObject = {
            id: "rect1",
            type: "rectangle",
            name: "Rectangle 1",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            layerId: "default",
            width: 100,
            height: 50,
        };

        const rect2: RectangleObject = {
            id: "rect2",
            type: "rectangle",
            name: "Rectangle 2",
            transform: { x: 50, y: 25, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            layerId: "default",
            width: 75,
            height: 40,
        };

        // Add object and undo
        act(() => {
            result.current.addObject(rect1);
        });
        act(() => {
            result.current.undo();
        });

        // Should have redo available
        expect(result.current.state.canRedo).toBe(true);

        // Add new object - should clear redo stack
        act(() => {
            result.current.addObject(rect2);
        });

        // Redo should no longer be available
        expect(result.current.state.canRedo).toBe(false);
        expect(result.current.state.history.redoStack).toHaveLength(0);
    });

    test("should not record history for non-recordable actions", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        // Actions like selection changes shouldn't create history
        act(() => {
            result.current.selectObjects(["nonexistent"]);
        });

        expect(result.current.state.history.undoStack).toHaveLength(0);
        expect(result.current.state.canUndo).toBe(false);
    });

    test("should clear history when requested", () => {
        const { result } = renderHook(() => useEditor(), { wrapper });

        const testObject: RectangleObject = {
            id: "clear-test",
            type: "rectangle",
            name: "Clear Test",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            layerId: "default",
            width: 100,
            height: 50,
        };

        // Add object to create history
        act(() => {
            result.current.addObject(testObject);
        });

        expect(result.current.state.canUndo).toBe(true);

        // Clear history
        act(() => {
            result.current.clearHistory();
        });

        expect(result.current.state.canUndo).toBe(false);
        expect(result.current.state.canRedo).toBe(false);
        expect(result.current.state.history.undoStack).toHaveLength(0);
        expect(result.current.state.history.redoStack).toHaveLength(0);
    });
});
