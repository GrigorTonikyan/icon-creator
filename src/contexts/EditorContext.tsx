import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
    type CanvasObject,
    type EditorAction,
    type EditorState,
    type Layer,
    type LayerOperation,
    type ToolType,
    type ViewportState,
} from "../types/editor";
import { calculateNewOrder } from "../utils/layerUtils";

// Initial State
const initialEditorState: EditorState = {
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
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    },
    layerOrder: ["default"],
    selectedTool: "select",
    selection: { objectIds: [] },
    layerSelection: {
        selectedLayerIds: [],
        activeLayerId: undefined,
    },
    viewport: {
        zoom: 1,
        panX: 0,
        panY: 0,
        canvasWidth: 800,
        canvasHeight: 600,
    },
    gridVisible: true,
    snapToGrid: false,
    gridSize: 20,
    canUndo: false,
    canRedo: false,
};

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
        case "SET_TOOL":
            return { ...state, selectedTool: action.payload };

        case "ADD_OBJECT": {
            const object = action.payload;
            const layerId = object.layerId || "default";

            // Ensure layer exists
            if (!state.layers[layerId]) {
                console.warn(`Layer ${layerId} does not exist, adding to default layer`);
                object.layerId = "default";
            }

            const targetLayer = state.layers[object.layerId];
            if (!targetLayer) return state;

            return {
                ...state,
                objects: { ...state.objects, [object.id]: object },
                layers: {
                    ...state.layers,
                    [object.layerId]: {
                        ...targetLayer,
                        objects: [...targetLayer.objects, object.id],
                    },
                },
            };
        }

        case "UPDATE_OBJECT": {
            const { id, updates } = action.payload;
            const existingObject = state.objects[id];
            if (!existingObject) return state;

            return {
                ...state,
                objects: {
                    ...state.objects,
                    [id]: { ...existingObject, ...updates } as CanvasObject,
                },
            };
        }

        case "DELETE_OBJECT": {
            const objectId = action.payload;
            const object = state.objects[objectId];
            if (!object) return state;

            const { [objectId]: deletedObject, ...remainingObjects } = state.objects;

            // Remove from layer
            const layer = state.layers[object.layerId];
            if (!layer) return state;

            const updatedLayer = {
                ...layer,
                objects: layer.objects.filter((id) => id !== objectId),
            };

            // Remove from selection if selected
            const newSelection = {
                ...state.selection,
                objectIds: state.selection.objectIds.filter((id) => id !== objectId),
            };

            return {
                ...state,
                objects: remainingObjects,
                layers: { ...state.layers, [object.layerId]: updatedLayer },
                selection: newSelection,
            };
        }

        case "SELECT_OBJECTS": {
            const selectedObjectIds = action.payload;

            // Find layers that contain the selected objects
            const selectedLayerIds = selectedObjectIds
                .map((objectId) => state.objects[objectId]?.layerId)
                .filter((layerId): layerId is string => layerId !== undefined)
                .filter((layerId, index, array) => array.indexOf(layerId) === index); // Remove duplicates

            return {
                ...state,
                selection: { objectIds: selectedObjectIds },
                layerSelection: {
                    selectedLayerIds,
                    activeLayerId: selectedLayerIds[0] || undefined,
                },
            };
        }

        case "CLEAR_SELECTION":
            return {
                ...state,
                selection: { objectIds: [] },
            };

        case "SET_VIEWPORT":
            return {
                ...state,
                viewport: { ...state.viewport, ...action.payload },
            };

        case "ADD_LAYER": {
            const layer = action.payload;
            return {
                ...state,
                layers: { ...state.layers, [layer.id]: layer },
                layerOrder: [...state.layerOrder, layer.id],
            };
        }

        case "UPDATE_LAYER": {
            const { id, updates } = action.payload;
            const existingLayer = state.layers[id];
            if (!existingLayer) return state;

            return {
                ...state,
                layers: {
                    ...state.layers,
                    [id]: { ...existingLayer, ...updates },
                },
            };
        }

        case "DELETE_LAYER": {
            const layerId = action.payload;
            if (layerId === "default") return state; // Can't delete default layer

            const layer = state.layers[layerId];
            if (!layer) return state;

            // Move objects to default layer
            const defaultLayer = state.layers.default;
            if (!defaultLayer) return state; // Should never happen

            const updatedDefaultLayer: Layer = {
                ...defaultLayer,
                objects: [...defaultLayer.objects, ...layer.objects],
            };

            // Update objects to point to default layer
            const updatedObjects = { ...state.objects };
            layer.objects.forEach((objectId) => {
                if (updatedObjects[objectId]) {
                    updatedObjects[objectId] = { ...updatedObjects[objectId], layerId: "default" };
                }
            });

            const { [layerId]: deletedLayer, ...remainingLayers } = state.layers;

            return {
                ...state,
                objects: updatedObjects,
                layers: { ...remainingLayers, default: updatedDefaultLayer },
                layerOrder: state.layerOrder.filter((id) => id !== layerId),
            };
        }

        case "REORDER_LAYERS":
            return {
                ...state,
                layerOrder: action.payload,
            };

        case "TOGGLE_GRID":
            return {
                ...state,
                gridVisible: !state.gridVisible,
            };

        case "SET_GRID_SIZE":
            return {
                ...state,
                gridSize: action.payload,
            };

        case "TOGGLE_SNAP_TO_GRID":
            return {
                ...state,
                snapToGrid: !state.snapToGrid,
            };

        case "SELECT_LAYERS": {
            const selectedLayerIds = action.payload;

            // Find objects that belong to the selected layers
            const selectedObjectIds = Object.values(state.objects)
                .filter((object) => selectedLayerIds.includes(object.layerId))
                .map((object) => object.id);

            return {
                ...state,
                layerSelection: {
                    ...state.layerSelection,
                    selectedLayerIds,
                    activeLayerId:
                        selectedLayerIds.length === 1 ? selectedLayerIds[0] : state.layerSelection.activeLayerId,
                },
                selection: { objectIds: selectedObjectIds },
            };
        }

        case "CLEAR_LAYER_SELECTION":
            return {
                ...state,
                layerSelection: {
                    selectedLayerIds: [],
                    activeLayerId: "",
                },
            };

        case "SET_ACTIVE_LAYER":
            return {
                ...state,
                layerSelection: {
                    ...state.layerSelection,
                    activeLayerId: action.payload,
                    selectedLayerIds: state.layerSelection.selectedLayerIds.includes(action.payload)
                        ? state.layerSelection.selectedLayerIds
                        : [action.payload],
                },
            };

        case "TOGGLE_LAYER_VISIBILITY": {
            const layerId = action.payload;
            const layer = state.layers[layerId];
            if (!layer) return state;

            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerId]: {
                        ...layer,
                        visible: !layer.visible,
                        updatedAt: Date.now(),
                    },
                },
            };
        }

        case "TOGGLE_LAYER_LOCK": {
            const layerId = action.payload;
            const layer = state.layers[layerId];
            if (!layer) return state;

            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerId]: {
                        ...layer,
                        locked: !layer.locked,
                        updatedAt: Date.now(),
                    },
                },
            };
        }

        case "RENAME_LAYER": {
            const { layerId, newName } = action.payload;
            const layer = state.layers[layerId];
            if (!layer || !newName.trim()) return state;

            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerId]: {
                        ...layer,
                        name: newName.trim(),
                        updatedAt: Date.now(),
                    },
                },
            };
        }

        case "EXPAND_LAYER": {
            const layerId = action.payload;
            const layer = state.layers[layerId];
            if (!layer) return state;

            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerId]: {
                        ...layer,
                        expanded: true,
                        updatedAt: Date.now(),
                    },
                },
            };
        }

        case "COLLAPSE_LAYER": {
            const layerId = action.payload;
            const layer = state.layers[layerId];
            if (!layer) return state;

            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerId]: {
                        ...layer,
                        expanded: false,
                        updatedAt: Date.now(),
                    },
                },
            };
        }

        case "GROUP_LAYERS": {
            const { layerIds, groupName } = action.payload;
            if (layerIds.length < 2) return state;

            const groupId = `group-${Date.now()}`;
            const now = Date.now();

            // Create new group layer
            const groupLayer: Layer = {
                id: groupId,
                name: groupName || "Group",
                visible: true,
                locked: false,
                objects: [],
                children: layerIds,
                expanded: true,
                opacity: 1,
                blendMode: "normal",
                type: "group",
                order: Math.max(...layerIds.map((id) => state.layers[id]?.order || 0)) + 1,
                createdAt: now,
                updatedAt: now,
            };

            // Update child layers to have the group as parent
            const updatedLayers = { ...state.layers };
            layerIds.forEach((layerId) => {
                if (updatedLayers[layerId]) {
                    updatedLayers[layerId] = {
                        ...updatedLayers[layerId],
                        parentId: groupId,
                        updatedAt: now,
                    };
                }
            });

            // Add group layer
            updatedLayers[groupId] = groupLayer;

            // Update layer order - remove grouped layers from root and add group
            const newLayerOrder = state.layerOrder.filter((id) => !layerIds.includes(id));

            // Insert group at the position of the highest ordered grouped layer
            const firstGroupedIndex = state.layerOrder.findIndex((id) => layerIds.includes(id));
            newLayerOrder.splice(firstGroupedIndex, 0, groupId);

            return {
                ...state,
                layers: updatedLayers,
                layerOrder: newLayerOrder,
            };
        }

        case "UNGROUP_LAYER": {
            const groupId = action.payload;
            const groupLayer = state.layers[groupId];
            if (!groupLayer || groupLayer.type !== "group") return state;

            const now = Date.now();
            const updatedLayers = { ...state.layers };

            // Update child layers to remove parent reference
            groupLayer.children.forEach((layerId) => {
                if (updatedLayers[layerId]) {
                    updatedLayers[layerId] = {
                        ...updatedLayers[layerId],
                        parentId: undefined,
                        updatedAt: now,
                    };
                }
            });

            // Remove group layer
            delete updatedLayers[groupId];

            // Update layer order - remove group and add its children
            const groupIndex = state.layerOrder.indexOf(groupId);
            const newLayerOrder = [...state.layerOrder];
            newLayerOrder.splice(groupIndex, 1, ...groupLayer.children);

            return {
                ...state,
                layers: updatedLayers,
                layerOrder: newLayerOrder,
                layerSelection: {
                    ...state.layerSelection,
                    selectedLayerIds: state.layerSelection.selectedLayerIds.filter((id) => id !== groupId),
                    activeLayerId:
                        state.layerSelection.activeLayerId === groupId ? undefined : state.layerSelection.activeLayerId,
                },
            };
        }

        case "DUPLICATE_LAYERS": {
            const layerIds = action.payload;
            const now = Date.now();
            const updatedLayers = { ...state.layers };
            const newLayerIds: string[] = [];

            layerIds.forEach((layerId) => {
                const originalLayer = state.layers[layerId];
                if (!originalLayer) return;

                const duplicateId = `${layerId}-copy-${now}`;
                const duplicateLayer: Layer = {
                    ...originalLayer,
                    id: duplicateId,
                    name: `${originalLayer.name} copy`,
                    objects: [], // Objects would need separate duplication
                    children: [], // Child layers would need separate handling
                    createdAt: now,
                    updatedAt: now,
                };

                updatedLayers[duplicateId] = duplicateLayer;
                newLayerIds.push(duplicateId);
            });

            const originalOrder = state.layerOrder;
            const newLayerOrder = [...originalOrder];

            // Insert duplicated layers after their originals
            layerIds.forEach((layerId, index) => {
                const originalIndex = originalOrder.indexOf(layerId);
                if (originalIndex !== -1 && newLayerIds[index]) {
                    newLayerOrder.splice(originalIndex + 1 + index, 0, newLayerIds[index]);
                }
            });

            return {
                ...state,
                layers: updatedLayers,
                layerOrder: newLayerOrder,
            };
        }

        case "MOVE_LAYERS": {
            const operation = action.payload;
            const { sourceIds, targetId, targetPosition } = operation;

            if (!targetId || !targetPosition || sourceIds.length === 0) {
                return state;
            }

            const now = Date.now();
            let updatedLayers = { ...state.layers };
            let newLayerOrder = [...state.layerOrder];

            if (targetPosition === "inside") {
                // Moving layers inside another layer (parent-child relationship)
                const targetLayer = updatedLayers[targetId];
                if (!targetLayer || targetLayer.type !== "group") {
                    console.warn(`Cannot move layers inside non-group layer ${targetId}`);
                    return state;
                }

                // Update source layers to have new parent
                sourceIds.forEach((sourceId: string) => {
                    const sourceLayer = updatedLayers[sourceId];
                    if (sourceLayer) {
                        updatedLayers[sourceId] = {
                            ...sourceLayer,
                            parentId: targetId,
                            updatedAt: now,
                        };
                    }
                });

                // Update target layer's children
                const existingChildren = targetLayer.children.filter((id) => !sourceIds.includes(id));
                updatedLayers[targetId] = {
                    ...targetLayer,
                    children: [...existingChildren, ...sourceIds],
                    updatedAt: now,
                };

                // Remove source layers from root layer order
                newLayerOrder = newLayerOrder.filter((id) => !sourceIds.includes(id));
            } else {
                // Moving layers before/after another layer (reordering)
                newLayerOrder = calculateNewOrder(updatedLayers, newLayerOrder, operation);

                // Update timestamps for moved layers
                sourceIds.forEach((sourceId: string) => {
                    const sourceLayer = updatedLayers[sourceId];
                    if (sourceLayer) {
                        updatedLayers[sourceId] = {
                            ...sourceLayer,
                            updatedAt: now,
                        };
                    }
                });
            }

            return {
                ...state,
                layers: updatedLayers,
                layerOrder: newLayerOrder,
            };
        }

        default:
            return state;
    }
}

// Context
interface EditorContextType {
    state: EditorState;
    dispatch: React.Dispatch<EditorAction>;

    // Convenience methods
    setTool: (tool: ToolType) => void;
    addObject: (object: CanvasObject) => void;
    updateObject: (id: string, updates: Partial<CanvasObject>) => void;
    deleteObject: (id: string) => void;
    selectObjects: (objectIds: string[]) => void;
    clearSelection: () => void;
    setViewport: (viewport: Partial<ViewportState>) => void;
    addLayer: (layer: Layer) => void;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    deleteLayer: (id: string) => void;
    reorderLayers: (layerOrder: string[]) => void;

    // New layer management methods
    selectLayers: (layerIds: string[]) => void;
    clearLayerSelection: () => void;
    setActiveLayer: (layerId: string) => void;
    toggleLayerVisibility: (layerId: string) => void;
    toggleLayerLock: (layerId: string) => void;
    renameLayer: (layerId: string, newName: string) => void;
    expandLayer: (layerId: string) => void;
    collapseLayer: (layerId: string) => void;
    groupLayers: (layerIds: string[], groupName?: string) => void;
    ungroupLayer: (layerId: string) => void;
    duplicateLayers: (layerIds: string[]) => void;
    moveLayers: (operation: LayerOperation) => void;

    toggleGrid: () => void;
    setGridSize: (size: number) => void;
    toggleSnapToGrid: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

// Provider
interface EditorProviderProps {
    children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
    const [state, dispatch] = useReducer(editorReducer, initialEditorState);

    // Convenience methods
    const setTool = (tool: ToolType) => dispatch({ type: "SET_TOOL", payload: tool });
    const addObject = (object: CanvasObject) => dispatch({ type: "ADD_OBJECT", payload: object });
    const updateObject = (id: string, updates: Partial<CanvasObject>) =>
        dispatch({ type: "UPDATE_OBJECT", payload: { id, updates } });
    const deleteObject = (id: string) => dispatch({ type: "DELETE_OBJECT", payload: id });
    const selectObjects = (objectIds: string[]) => dispatch({ type: "SELECT_OBJECTS", payload: objectIds });
    const clearSelection = () => dispatch({ type: "CLEAR_SELECTION" });
    const setViewport = (viewport: Partial<ViewportState>) => dispatch({ type: "SET_VIEWPORT", payload: viewport });
    const addLayer = (layer: Layer) => dispatch({ type: "ADD_LAYER", payload: layer });
    const updateLayer = (id: string, updates: Partial<Layer>) =>
        dispatch({ type: "UPDATE_LAYER", payload: { id, updates } });
    const deleteLayer = (id: string) => dispatch({ type: "DELETE_LAYER", payload: id });
    const reorderLayers = (layerOrder: string[]) => dispatch({ type: "REORDER_LAYERS", payload: layerOrder });

    // New layer management methods
    const selectLayers = (layerIds: string[]) => dispatch({ type: "SELECT_LAYERS", payload: layerIds });
    const clearLayerSelection = () => dispatch({ type: "CLEAR_LAYER_SELECTION" });
    const setActiveLayer = (layerId: string) => dispatch({ type: "SET_ACTIVE_LAYER", payload: layerId });
    const toggleLayerVisibility = (layerId: string) => dispatch({ type: "TOGGLE_LAYER_VISIBILITY", payload: layerId });
    const toggleLayerLock = (layerId: string) => dispatch({ type: "TOGGLE_LAYER_LOCK", payload: layerId });
    const renameLayer = (layerId: string, newName: string) =>
        dispatch({ type: "RENAME_LAYER", payload: { layerId, newName } });
    const expandLayer = (layerId: string) => dispatch({ type: "EXPAND_LAYER", payload: layerId });
    const collapseLayer = (layerId: string) => dispatch({ type: "COLLAPSE_LAYER", payload: layerId });
    const groupLayers = (layerIds: string[], groupName?: string) =>
        dispatch({ type: "GROUP_LAYERS", payload: { layerIds, groupName } });
    const ungroupLayer = (layerId: string) => dispatch({ type: "UNGROUP_LAYER", payload: layerId });
    const duplicateLayers = (layerIds: string[]) => dispatch({ type: "DUPLICATE_LAYERS", payload: layerIds });
    const moveLayers = (operation: LayerOperation) => dispatch({ type: "MOVE_LAYERS", payload: operation });

    const toggleGrid = () => dispatch({ type: "TOGGLE_GRID" });
    const setGridSize = (size: number) => dispatch({ type: "SET_GRID_SIZE", payload: size });
    const toggleSnapToGrid = () => dispatch({ type: "TOGGLE_SNAP_TO_GRID" });

    const contextValue: EditorContextType = {
        state,
        dispatch,
        setTool,
        addObject,
        updateObject,
        deleteObject,
        selectObjects,
        clearSelection,
        setViewport,
        addLayer,
        updateLayer,
        deleteLayer,
        reorderLayers,
        selectLayers,
        clearLayerSelection,
        setActiveLayer,
        toggleLayerVisibility,
        toggleLayerLock,
        renameLayer,
        expandLayer,
        collapseLayer,
        groupLayers,
        ungroupLayer,
        duplicateLayers,
        moveLayers,
        toggleGrid,
        setGridSize,
        toggleSnapToGrid,
    };

    return <EditorContext.Provider value={contextValue}>{children}</EditorContext.Provider>;
}

// Hook
export function useEditor(): EditorContextType {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
}
