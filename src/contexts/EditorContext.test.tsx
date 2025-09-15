import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { CircleObject, Layer, RectangleObject } from "../types/editor";
import { EditorProvider, useEditor } from "./EditorContext";

// Test wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

// Helper function to create test layers
const createTestLayer = (name: string, overrides: Partial<Layer> = {}): Layer => {
    const id = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
        id,
        name,
        visible: true,
        locked: false,
        objects: [],
        children: [],
        expanded: true,
        opacity: 1,
        blendMode: "normal",
        type: "default",
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
};

describe("EditorContext", () => {
    describe("Initial State", () => {
        test("should initialize with default state", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            expect(result.current.state.selectedTool).toBe("select");
            expect(result.current.state.selection.objectIds).toEqual([]);
            expect(result.current.state.viewport.zoom).toBe(1);
            expect(result.current.state.gridVisible).toBe(true);
            expect(result.current.state.layerOrder).toEqual(["default"]);
            expect(result.current.state.layers.default).toBeDefined();
            expect(result.current.state.layers.default?.name).toBe("Layer 1");
        });

        test("should provide all required context methods", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            expect(typeof result.current.addObject).toBe("function");
            expect(typeof result.current.updateObject).toBe("function");
            expect(typeof result.current.deleteObject).toBe("function");
            expect(typeof result.current.selectObjects).toBe("function");
            expect(typeof result.current.clearSelection).toBe("function");
            expect(typeof result.current.setTool).toBe("function");
            expect(typeof result.current.setViewport).toBe("function");
        });
    });

    describe("Tool Management", () => {
        test("should change selected tool", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                result.current.setTool("rectangle");
            });

            expect(result.current.state.selectedTool).toBe("rectangle");
        });
    });

    describe("Object Management", () => {
        test("should add rectangle object", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const rectangleObject: RectangleObject = {
                id: "rect-1",
                type: "rectangle",
                name: "Rectangle 1",
                transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "default",
                width: 100,
                height: 50,
                borderRadius: 0,
                style: {
                    fill: "#ff0000",
                    stroke: "#000000",
                    strokeWidth: 2,
                },
            };

            act(() => {
                result.current.addObject(rectangleObject);
            });

            expect(result.current.state.objects["rect-1"]).toBeDefined();
            expect(result.current.state.objects["rect-1"]).toEqual(rectangleObject);
            expect(result.current.state.layers.default?.objects).toContain("rect-1");
        });

        test("should add circle object", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const circleObject: CircleObject = {
                id: "circle-1",
                type: "circle",
                name: "Circle 1",
                transform: { x: 50, y: 60, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "default",
                radius: 25,
                style: {
                    fill: "#00ff00",
                    stroke: "#000000",
                    strokeWidth: 1,
                },
            };

            act(() => {
                result.current.addObject(circleObject);
            });

            expect(result.current.state.objects["circle-1"]).toBeDefined();
            expect(result.current.state.objects["circle-1"]).toEqual(circleObject);
            expect(result.current.state.layers.default?.objects).toContain("circle-1");
        });

        test("should update object properties", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const testObject: RectangleObject = {
                id: "test-rect",
                type: "rectangle",
                name: "Test Rectangle",
                transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "default",
                width: 100,
                height: 100,
                borderRadius: 0,
                style: { fill: "#blue" },
            };

            // Add object first
            act(() => {
                result.current.addObject(testObject);
            });

            // Update object
            act(() => {
                result.current.updateObject("test-rect", {
                    width: 200,
                    height: 150,
                    style: { fill: "#red", stroke: "#black" },
                });
            });

            const updatedObject = result.current.state.objects["test-rect"] as RectangleObject;
            expect(updatedObject.width).toBe(200);
            expect(updatedObject.height).toBe(150);
            expect(updatedObject.style?.fill).toBe("#red");
            expect(updatedObject.style?.stroke).toBe("#black");
        });

        test("should delete object", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const testObject: RectangleObject = {
                id: "delete-test",
                type: "rectangle",
                name: "Delete Test",
                transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "default",
                width: 50,
                height: 50,
                borderRadius: 0,
                style: {},
            };

            // Add object first
            act(() => {
                result.current.addObject(testObject);
            });

            expect(result.current.state.objects["delete-test"]).toBeDefined();
            expect(result.current.state.layers.default?.objects).toContain("delete-test");

            // Delete object
            act(() => {
                result.current.deleteObject("delete-test");
            });

            expect(result.current.state.objects["delete-test"]).toBeUndefined();
            expect(result.current.state.layers.default?.objects).not.toContain("delete-test");
        });
    });

    describe("Selection Management", () => {
        test("should select single object", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                result.current.selectObjects(["object-1"]);
            });

            expect(result.current.state.selection.objectIds).toEqual(["object-1"]);
        });

        test("should select multiple objects", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                result.current.selectObjects(["object-1", "object-2", "object-3"]);
            });

            expect(result.current.state.selection.objectIds).toEqual(["object-1", "object-2", "object-3"]);
        });

        test("should clear selection", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            // First select objects
            act(() => {
                result.current.selectObjects(["object-1", "object-2"]);
            });

            expect(result.current.state.selection.objectIds).toEqual(["object-1", "object-2"]);

            // Then clear selection
            act(() => {
                result.current.clearSelection();
            });

            expect(result.current.state.selection.objectIds).toEqual([]);
        });

        test("should remove deleted object from selection", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const testObject: RectangleObject = {
                id: "selected-object",
                type: "rectangle",
                name: "Selected Object",
                transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "default",
                width: 50,
                height: 50,
                borderRadius: 0,
                style: {},
            };

            // Add and select object
            act(() => {
                result.current.addObject(testObject);
                result.current.selectObjects(["selected-object", "other-object"]);
            });

            expect(result.current.state.selection.objectIds).toContain("selected-object");

            // Delete the selected object
            act(() => {
                result.current.deleteObject("selected-object");
            });

            // Should be removed from selection
            expect(result.current.state.selection.objectIds).not.toContain("selected-object");
            expect(result.current.state.selection.objectIds).toContain("other-object");
        });
    });

    describe("Viewport Management", () => {
        test("should update viewport zoom", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                result.current.setViewport({ zoom: 2 });
            });

            expect(result.current.state.viewport.zoom).toBe(2);
        });

        test("should update viewport pan", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                result.current.setViewport({ panX: 100, panY: 50 });
            });

            expect(result.current.state.viewport.panX).toBe(100);
            expect(result.current.state.viewport.panY).toBe(50);
        });

        test("should update multiple viewport properties", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            act(() => {
                result.current.setViewport({
                    zoom: 1.5,
                    panX: 25,
                    panY: 75,
                    canvasWidth: 1000,
                    canvasHeight: 800,
                });
            });

            const { viewport } = result.current.state;
            expect(viewport.zoom).toBe(1.5);
            expect(viewport.panX).toBe(25);
            expect(viewport.panY).toBe(75);
            expect(viewport.canvasWidth).toBe(1000);
            expect(viewport.canvasHeight).toBe(800);
        });
    });

    describe("Error Handling", () => {
        test("should handle updating non-existent object gracefully", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            // Should not throw error
            act(() => {
                result.current.updateObject("non-existent", { name: "Updated" });
            });

            // State should remain unchanged
            expect(result.current.state.objects["non-existent"]).toBeUndefined();
        });

        test("should handle deleting non-existent object gracefully", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const initialObjectCount = Object.keys(result.current.state.objects).length;

            // Should not throw error
            act(() => {
                result.current.deleteObject("non-existent");
            });

            // State should remain unchanged
            expect(Object.keys(result.current.state.objects)).toHaveLength(initialObjectCount);
        });

        test("should add object to default layer if specified layer does not exist", () => {
            const { result } = renderHook(() => useEditor(), { wrapper });

            const testObject: RectangleObject = {
                id: "orphan-object",
                type: "rectangle",
                name: "Orphan Object",
                transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "non-existent-layer",
                width: 50,
                height: 50,
                borderRadius: 0,
                style: {},
            };

            act(() => {
                result.current.addObject(testObject);
            });

            // Object should be added to default layer
            const addedObject = result.current.state.objects["orphan-object"];
            expect(addedObject).toBeDefined();
            expect(addedObject?.layerId).toBe("default");
            expect(result.current.state.layers.default?.objects).toContain("orphan-object");
        });
    });

    describe("Layer Management", () => {
        describe("Layer Creation", () => {
            test("should add new layer", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                const newLayer = createTestLayer("Layer 2");

                act(() => {
                    result.current.addLayer(newLayer);
                });

                const layerIds = Object.keys(result.current.state.layers);
                expect(layerIds).toHaveLength(2); // default + new layer

                expect(result.current.state.layers[newLayer.id]).toBeDefined();
                expect(result.current.state.layers[newLayer.id]?.name).toBe("Layer 2");
                expect(result.current.state.layerOrder).toContain(newLayer.id);
            });

            test("should add layer with custom name", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                const customLayer = createTestLayer("Custom Layer");

                act(() => {
                    result.current.addLayer(customLayer);
                });

                const layerIds = Object.keys(result.current.state.layers);
                const newLayerId = layerIds.find((id) => id !== "default");
                expect(result.current.state.layers[newLayerId!]?.name).toBe("Custom Layer");
            });
        });

        describe("Layer Deletion", () => {
            test("should delete layer and move objects to default", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                // Add layer and object
                let customLayerId: string;
                const testLayer = createTestLayer("Test Layer");
                act(() => {
                    result.current.addLayer(testLayer);
                });

                customLayerId = testLayer.id;

                const testObject: RectangleObject = {
                    id: "test-obj",
                    type: "rectangle",
                    name: "Test Object",
                    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 0,
                    layerId: customLayerId,
                    width: 50,
                    height: 50,
                    borderRadius: 0,
                    style: {},
                };

                act(() => {
                    result.current.addObject(testObject);
                });

                expect(result.current.state.layers[customLayerId]?.objects).toContain("test-obj");

                // Delete layer
                act(() => {
                    result.current.deleteLayer(customLayerId);
                });

                expect(result.current.state.layers[customLayerId]).toBeUndefined();
                expect(result.current.state.layerOrder).not.toContain(customLayerId);
                expect(result.current.state.objects["test-obj"]?.layerId).toBe("default");
                expect(result.current.state.layers.default?.objects).toContain("test-obj");
            });

            test("should not delete default layer", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                act(() => {
                    result.current.deleteLayer("default");
                });

                expect(result.current.state.layers.default).toBeDefined();
                expect(result.current.state.layerOrder).toContain("default");
            });
        });

        describe("Layer Rename", () => {
            test("should rename layer", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                act(() => {
                    result.current.renameLayer("default", "Renamed Default");
                });

                expect(result.current.state.layers.default?.name).toBe("Renamed Default");
            });

            test("should handle renaming non-existent layer gracefully", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                act(() => {
                    result.current.renameLayer("non-existent", "New Name");
                });

                // Should not affect existing layers
                expect(result.current.state.layers.default?.name).toBe("Layer 1");
            });
        });

        describe("Layer Visibility", () => {
            test("should toggle layer visibility", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                expect(result.current.state.layers.default?.visible).toBe(true);

                act(() => {
                    result.current.toggleLayerVisibility("default");
                });

                expect(result.current.state.layers.default?.visible).toBe(false);

                act(() => {
                    result.current.toggleLayerVisibility("default");
                });

                expect(result.current.state.layers.default?.visible).toBe(true);
            });
        });

        describe("Layer Locking", () => {
            test("should toggle layer lock", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                expect(result.current.state.layers.default?.locked).toBe(false);

                act(() => {
                    result.current.toggleLayerLock("default");
                });

                expect(result.current.state.layers.default?.locked).toBe(true);

                act(() => {
                    result.current.toggleLayerLock("default");
                });

                expect(result.current.state.layers.default?.locked).toBe(false);
            });
        });

        describe("Layer Reordering", () => {
            test("should reorder layers", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                // Add two more layers
                let layer2Id: string, layer3Id: string;
                const layer2 = createTestLayer("Layer 2");
                const layer3 = createTestLayer("Layer 3");
                act(() => {
                    result.current.addLayer(layer2);
                    result.current.addLayer(layer3);
                });

                layer2Id = layer2.id;
                layer3Id = layer3.id;

                expect(result.current.state.layerOrder).toEqual(["default", layer2Id, layer3Id]);

                // Reorder: move layer3 to first position
                act(() => {
                    result.current.reorderLayers([layer3Id, "default", layer2Id]);
                });

                expect(result.current.state.layerOrder).toEqual([layer3Id, "default", layer2Id]);
            });
        });

        describe("Layer Grouping", () => {
            test("should group layers", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                // Add more layers
                let layer2Id: string, layer3Id: string;
                const layer2 = createTestLayer("Layer 2");
                const layer3 = createTestLayer("Layer 3");
                act(() => {
                    result.current.addLayer(layer2);
                    result.current.addLayer(layer3);
                });

                layer2Id = layer2.id;
                layer3Id = layer3.id;

                act(() => {
                    result.current.groupLayers([layer2Id, layer3Id]);
                });

                // Should create a new group layer
                const groupLayerId = Object.keys(result.current.state.layers).find(
                    (id) => result.current.state.layers[id]?.type === "group"
                );
                expect(groupLayerId).toBeDefined();
                expect(result.current.state.layers[groupLayerId!]?.children).toEqual([layer2Id, layer3Id]);
            });

            test("should ungroup layers", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                // Add layers and group them
                let layer2Id: string, layer3Id: string, groupLayerId: string;
                const layer2 = createTestLayer("Layer 2");
                const layer3 = createTestLayer("Layer 3");
                act(() => {
                    result.current.addLayer(layer2);
                    result.current.addLayer(layer3);
                });

                layer2Id = layer2.id;
                layer3Id = layer3.id;

                act(() => {
                    result.current.groupLayers([layer2Id, layer3Id]);
                });

                groupLayerId = Object.keys(result.current.state.layers).find(
                    (id) => result.current.state.layers[id]?.type === "group"
                )!;

                act(() => {
                    result.current.ungroupLayer(groupLayerId);
                });

                // Group should be deleted, children should be moved to parent level
                expect(result.current.state.layers[groupLayerId]).toBeUndefined();
                expect(result.current.state.layerOrder).toContain(layer2Id);
                expect(result.current.state.layerOrder).toContain(layer3Id);
            });
        });

        describe("Layer Selection", () => {
            test("should select single layer", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                act(() => {
                    result.current.selectLayers(["default"]);
                });

                expect(result.current.state.layerSelection.selectedLayerIds).toEqual(["default"]);
                expect(result.current.state.layerSelection.activeLayerId).toBe("default");
            });

            test("should select multiple layers", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                let layer2Id: string;
                const layer2 = createTestLayer("Layer 2");
                act(() => {
                    result.current.addLayer(layer2);
                });

                layer2Id = layer2.id;

                act(() => {
                    result.current.selectLayers(["default", layer2Id]);
                });

                expect(result.current.state.layerSelection.selectedLayerIds).toEqual(["default", layer2Id]);
                expect(result.current.state.layerSelection.activeLayerId).not.toBe("default"); // Should not set active when multiple selected
            });

            test("should clear layer selection", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                act(() => {
                    result.current.selectLayers(["default"]);
                });

                expect(result.current.state.layerSelection.selectedLayerIds).toEqual(["default"]);

                act(() => {
                    result.current.clearLayerSelection();
                });

                expect(result.current.state.layerSelection.selectedLayerIds).toEqual([]);
                expect(result.current.state.layerSelection.activeLayerId).toBe("");
            });
        });

        describe("Bidirectional Selection Synchronization", () => {
            test("should select layers when objects are selected", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                // Add object to default layer
                const testObject: RectangleObject = {
                    id: "sync-test-obj",
                    type: "rectangle",
                    name: "Sync Test Object",
                    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 0,
                    layerId: "default",
                    width: 50,
                    height: 50,
                    borderRadius: 0,
                    style: {},
                };

                act(() => {
                    result.current.addObject(testObject);
                });

                // Select object - should automatically select layer
                act(() => {
                    result.current.selectObjects(["sync-test-obj"]);
                });

                expect(result.current.state.selection.objectIds).toEqual(["sync-test-obj"]);
                expect(result.current.state.layerSelection.selectedLayerIds).toEqual(["default"]);
                expect(result.current.state.layerSelection.activeLayerId).toBe("default");
            });

            test("should select objects when layers are selected", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                // Add objects to default layer
                const obj1: RectangleObject = {
                    id: "layer-sync-obj1",
                    type: "rectangle",
                    name: "Layer Sync Object 1",
                    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 0,
                    layerId: "default",
                    width: 50,
                    height: 50,
                    borderRadius: 0,
                    style: {},
                };

                const obj2: CircleObject = {
                    id: "layer-sync-obj2",
                    type: "circle",
                    name: "Layer Sync Object 2",
                    transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 1,
                    layerId: "default",
                    radius: 25,
                    style: {},
                };

                act(() => {
                    result.current.addObject(obj1);
                    result.current.addObject(obj2);
                });

                // Select layer - should automatically select all objects in layer
                act(() => {
                    result.current.selectLayers(["default"]);
                });

                expect(result.current.state.layerSelection.selectedLayerIds).toEqual(["default"]);
                expect(result.current.state.selection.objectIds).toEqual(
                    expect.arrayContaining(["layer-sync-obj1", "layer-sync-obj2"])
                );
            });

            test("should handle multi-layer object selection synchronization", () => {
                const { result } = renderHook(() => useEditor(), { wrapper });

                // Add second layer
                let layer2Id: string;
                const layer2 = createTestLayer("Layer 2");
                act(() => {
                    result.current.addLayer(layer2);
                });

                layer2Id = layer2.id;

                // Add objects to different layers
                const obj1: RectangleObject = {
                    id: "multi-layer-obj1",
                    type: "rectangle",
                    name: "Multi Layer Object 1",
                    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 0,
                    layerId: "default",
                    width: 50,
                    height: 50,
                    borderRadius: 0,
                    style: {},
                };

                const obj2: CircleObject = {
                    id: "multi-layer-obj2",
                    type: "circle",
                    name: "Multi Layer Object 2",
                    transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 1,
                    layerId: layer2Id,
                    radius: 25,
                    style: {},
                };

                act(() => {
                    result.current.addObject(obj1);
                    result.current.addObject(obj2);
                });

                // Select objects from both layers - should select both layers
                act(() => {
                    result.current.selectObjects(["multi-layer-obj1", "multi-layer-obj2"]);
                });

                expect(result.current.state.selection.objectIds).toEqual(
                    expect.arrayContaining(["multi-layer-obj1", "multi-layer-obj2"])
                );
                expect(result.current.state.layerSelection.selectedLayerIds).toEqual(
                    expect.arrayContaining(["default", layer2Id])
                );
            });
        });
    });
});
