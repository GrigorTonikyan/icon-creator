import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PathObject, PathOperation } from "../types/editor";
import { EditorProvider, useEditor } from "./EditorContext";

// Mock Paper.js operations
vi.mock("../utils/pathUtils", () => ({
    performPathOperation: vi.fn((operation: string, paths: string[]) => {
        switch (operation) {
            case "unite":
                return "M 0 0 L 20 0 L 20 20 L 0 20 Z";
            case "subtract":
                return "M 0 0 L 5 0 L 5 5 L 0 5 Z";
            case "intersect":
                return "M 5 5 L 10 5 L 10 10 L 5 10 Z";
            case "exclude":
                return "M 0 0 L 15 0 L 15 15 L 0 15 Z";
            default:
                return paths[0] || "";
        }
    }),
    parsePathData: vi.fn(() => [
        { id: "node1", x: 0, y: 0, type: "move" },
        { id: "node2", x: 10, y: 0, type: "line" },
        { id: "node3", x: 10, y: 10, type: "line" },
        { id: "node4", x: 0, y: 10, type: "line" },
    ]),
    nodesToPathData: vi.fn(() => "M 0 0 L 10 0 L 10 10 L 0 10 Z"),
    addNodeAtPosition: vi.fn((nodes, position, index) => [
        ...nodes.slice(0, index || nodes.length),
        { id: `node-${Date.now()}`, x: position.x, y: position.y, type: "line" },
        ...nodes.slice(index || nodes.length),
    ]),
    removeNode: vi.fn((nodes, nodeId) => nodes.filter((n: any) => n.id !== nodeId)),
    updateNodePosition: vi.fn((nodes, nodeId, position) =>
        nodes.map((n: any) => (n.id === nodeId ? { ...n, x: position.x, y: position.y } : n))
    ),
}));

const createMockPathObject = (id: string, pathData: string): PathObject => ({
    id,
    type: "path",
    name: `Path ${id}`,
    pathData,
    style: {
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 1,
    },
    transform: {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
    },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    layerId: "layer1",
});

const wrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

describe("EditorContext - Path Operations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Path Boolean Operations", () => {
        test("should unite paths", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            // Add paths to editor
            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", payload: path1 });
                result.current.dispatch({ type: "ADD_OBJECT", payload: path2 });
                result.current.dispatch({ type: "SELECT_OBJECTS", payload: ["path1", "path2"] });
            });

            // Perform unite operation
            act(() => {
                const operation: PathOperation = {
                    type: "unite",
                    pathIds: ["path1", "path2"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", payload: operation });
            });

            // Should create new unified path and remove originals
            expect(result.current.state.objects).toHaveLength(1);
            const unifiedPath = result.current.state.objects[0] as PathObject;
            expect(unifiedPath.type).toBe("path");
            expect(unifiedPath.pathData).toBe("M 0 0 L 20 0 L 20 20 L 0 20 Z");
        });

        test("should subtract paths", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", payload: path1 });
                result.current.dispatch({ type: "ADD_OBJECT", payload: path2 });
                result.current.dispatch({ type: "SELECT_OBJECTS", payload: ["path1", "path2"] });
            });

            act(() => {
                const operation: PathOperation = {
                    type: "subtract",
                    pathIds: ["path1", "path2"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", payload: operation });
            });

            expect(result.current.state.objects).toHaveLength(1);
            const resultPath = result.current.state.objects[0] as PathObject;
            expect(resultPath.pathData).toBe("M 0 0 L 5 0 L 5 5 L 0 5 Z");
        });

        test("should intersect paths", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", payload: path1 });
                result.current.dispatch({ type: "ADD_OBJECT", payload: path2 });
                result.current.dispatch({ type: "SELECT_OBJECTS", payload: ["path1", "path2"] });
            });

            act(() => {
                const operation: PathOperation = {
                    type: "intersect",
                    pathIds: ["path1", "path2"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", payload: operation });
            });

            expect(result.current.state.objects).toHaveLength(1);
            const resultPath = result.current.state.objects[0] as PathObject;
            expect(resultPath.pathData).toBe("M 5 5 L 10 5 L 10 10 L 5 10 Z");
        });

        test("should exclude paths", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", payload: path1 });
                result.current.dispatch({ type: "ADD_OBJECT", payload: path2 });
                result.current.dispatch({ type: "SELECT_OBJECTS", payload: ["path1", "path2"] });
            });

            act(() => {
                const operation: PathOperation = {
                    type: "exclude",
                    pathIds: ["path1", "path2"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", payload: operation });
            });

            expect(result.current.state.objects).toHaveLength(1);
            const resultPath = result.current.state.objects[0] as PathObject;
            expect(resultPath.pathData).toBe("M 0 0 L 15 0 L 15 15 L 0 15 Z");
        });

        test("should handle operation with insufficient paths", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", object: path1 });
                result.current.dispatch({ type: "SELECT_OBJECTS", objectIds: ["path1"] });
            });

            act(() => {
                const operation: PathOperation = {
                    type: "unite",
                    targetIds: ["path1"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", operation });
            });

            // Should not perform operation with only one path
            expect(result.current.state.objects).toHaveLength(1);
            expect(result.current.state.objects[0].id).toBe("path1");
        });

        test("should handle operation with non-path objects", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const rectangleObject = {
                id: "rect1",
                type: "rectangle" as const,
                name: "Rectangle 1",
                width: 100,
                height: 100,
                style: { fill: "#000000" },
                transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "layer1",
            };

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", object: rectangleObject });
                result.current.dispatch({ type: "ADD_OBJECT", object: path1 });
                result.current.dispatch({ type: "SELECT_OBJECTS", objectIds: ["rect1", "path1"] });
            });

            act(() => {
                const operation: PathOperation = {
                    type: "unite",
                    targetIds: ["rect1", "path1"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", operation });
            });

            // Should not perform operation with mixed object types
            expect(result.current.state.objects).toHaveLength(2);
        });
    });

    describe("Path Node Editing", () => {
        test("should update path when nodes are modified", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", object: path1 });
                result.current.dispatch({ type: "SELECT_OBJECTS", objectIds: ["path1"] });
            });

            // Update path node position
            act(() => {
                result.current.dispatch({
                    type: "UPDATE_OBJECT",
                    objectId: "path1",
                    updates: {
                        nodes: [
                            { id: "node1", x: 0, y: 0, type: "move" },
                            { id: "node2", x: 20, y: 0, type: "line" }, // Updated position
                            { id: "node3", x: 20, y: 20, type: "line" }, // Updated position
                            { id: "node4", x: 0, y: 20, type: "line" }, // Updated position
                        ],
                    },
                });
            });

            const updatedPath = result.current.state.objects[0] as PathObject;
            expect(updatedPath.nodes).toHaveLength(4);
            expect(updatedPath.nodes?.[1]?.x).toBe(20);
        });

        test("should maintain path data consistency with nodes", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", object: path1 });
            });

            // Simulate parsing path data to nodes
            act(() => {
                result.current.dispatch({
                    type: "UPDATE_OBJECT",
                    objectId: "path1",
                    updates: {
                        nodes: [
                            { id: "node1", x: 0, y: 0, type: "move" },
                            { id: "node2", x: 10, y: 0, type: "line" },
                            { id: "node3", x: 10, y: 10, type: "line" },
                            { id: "node4", x: 0, y: 10, type: "line" },
                        ],
                    },
                });
            });

            const updatedPath = result.current.state.objects[0] as PathObject;
            expect(updatedPath.nodes).toBeDefined();
            expect(updatedPath.nodes).toHaveLength(4);
        });
    });

    describe("Path Tool Integration", () => {
        test("should create path when path tool is active", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                result.current.dispatch({ type: "SET_ACTIVE_TOOL", tool: "path" });
            });

            expect(result.current.state.activeTool).toBe("path");

            // Simulate creating a path
            const newPath = createMockPathObject("new-path", "M 50 50 L 100 50 L 100 100");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", object: newPath });
            });

            expect(result.current.state.objects).toHaveLength(1);
            expect(result.current.state.objects[0].type).toBe("path");
        });

        test("should handle path creation workflow", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            // Start with path tool
            act(() => {
                result.current.dispatch({ type: "SET_ACTIVE_TOOL", tool: "path" });
            });

            // Create initial path
            const initialPath = createMockPathObject("temp-path", "M 10 10");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", object: initialPath });
            });

            // Update path as user adds points
            act(() => {
                result.current.dispatch({
                    type: "UPDATE_OBJECT",
                    objectId: "temp-path",
                    updates: {
                        pathData: "M 10 10 L 50 10 L 50 50",
                    },
                });
            });

            // Finalize path
            act(() => {
                result.current.dispatch({
                    type: "UPDATE_OBJECT",
                    objectId: "temp-path",
                    updates: {
                        pathData: "M 10 10 L 50 10 L 50 50 L 10 50 Z",
                        name: "Completed Path",
                    },
                });
            });

            const finalPath = result.current.state.objects[0] as PathObject;
            expect(finalPath.pathData).toBe("M 10 10 L 50 10 L 50 50 L 10 50 Z");
            expect(finalPath.name).toBe("Completed Path");
        });
    });

    describe("Error Handling", () => {
        test("should handle invalid path operations gracefully", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const path1 = createMockPathObject("path1", "invalid-path-data");

            act(() => {
                result.current.dispatch({ type: "ADD_OBJECT", object: path1 });
                result.current.dispatch({ type: "SELECT_OBJECTS", objectIds: ["path1"] });
            });

            // This should not crash the application
            act(() => {
                const operation: PathOperation = {
                    type: "unite",
                    targetIds: ["path1", "nonexistent"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", operation });
            });

            // Should maintain original state when operation fails
            expect(result.current.state.objects).toHaveLength(1);
            expect(result.current.state.objects[0].id).toBe("path1");
        });

        test("should handle missing target objects", async () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                const operation: PathOperation = {
                    type: "unite",
                    targetIds: ["nonexistent1", "nonexistent2"],
                };
                result.current.dispatch({ type: "PATH_OPERATION", operation });
            });

            // Should not crash or modify state
            expect(result.current.state.objects).toHaveLength(0);
        });
    });
});
