import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import {
    ACTION_DESCRIPTIONS,
    type AutoSaveSettings,
    type CanvasObject,
    type CoordinateDisplay,
    type EditorAction,
    type EditorState,
    type HistoryEntry,
    type HistoryState,
    type Layer,
    type LayerOperation,
    type ManualGuide,
    type ManualGuidesState,
    type PathOperationType,
    type PrecisionInputState,
    type ProjectData,
    type ProjectMetadata,
    type SerializableEditorState,
    type SmartGuide,
    type SmartGuidesState,
    type ToolType,
    type UnitType,
    type ViewportState,
} from "../types/editor";
import { calculateNewOrder } from "../utils/layerUtils";
import { createEmptyProject, deserializeProject, generateProjectThumbnail, serializeProject } from "../utils/project";
import {
    alignLeft,
    alignRight,
    alignCenterHorizontal,
    alignTop,
    alignBottom,
    alignCenterVertical,
    distributeHorizontal,
    distributeVertical,
} from "../utils/alignmentUtils";
import {
    autoSaveProject,
    clearAutoSavedProject,
    deleteProjectFromLocalStorage,
    downloadProject,
    getStoredProjects,
    hasAutoSavedProject,
    loadAutoSavedProject,
    loadProjectFromLocalStorage,
    saveProjectToLocalStorage,
    uploadProject,
    type StoredProjectMetadata,
} from "../utils/storage";

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
    smartGuides: {
        enabled: true,
        showGuides: true,
        snapToObjects: true,
        snapToEdges: true,
        snapToCenter: true,
        threshold: 5,
        activeGuides: [],
    },
    manualGuides: {
        guides: [],
        enabled: true,
        snapToGuides: true,
        showGuides: true,
        snapThreshold: 5,
        defaultColor: "#007BFF",
    },
    rulers: {
        visible: true,
        unit: "px",
        showMeasurements: true,
        precision: 1,
    },
    precisionInputs: {
        visible: true,
        showCoordinates: true,
        showMousePosition: false,
        unit: "px",
        precision: 2,
        lockAspectRatio: false,
    },
    canUndo: false,
    canRedo: false,
    history: {
        undoStack: [],
        redoStack: [],
        maxHistorySize: 50,
        isExecutingHistory: false,
    },
    autoSave: {
        settings: {
            enabled: true,
            interval: 30000, // 30 seconds default
            maxAutoSaves: 10,
            showRecoveryPrompt: true,
        },
        intervalId: null,
        lastSaveTime: null,
        isAutoSaving: false,
    },
};

// History Utilities
function serializeEditorState(state: EditorState): SerializableEditorState {
    return {
        objects: state.objects,
        layers: state.layers,
        layerOrder: state.layerOrder,
        selection: state.selection,
        layerSelection: state.layerSelection,
        viewport: state.viewport,
        selectedTool: state.selectedTool,
        gridVisible: state.gridVisible,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        smartGuides: state.smartGuides,
        manualGuides: state.manualGuides,
    };
}

function createHistoryEntry(action: EditorAction, previousState: EditorState, description?: string): HistoryEntry {
    const actionDescription = description || ACTION_DESCRIPTIONS[action.type] || action.type;

    // Extract affected object/layer IDs for optimization
    let affectedObjectIds: string[] | undefined;
    let affectedLayerIds: string[] | undefined;

    switch (action.type) {
        case "ADD_OBJECT":
        case "DELETE_OBJECT":
            affectedObjectIds = [typeof action.payload === "string" ? action.payload : action.payload.id];
            break;
        case "UPDATE_OBJECT":
            affectedObjectIds = [(action.payload as any).id];
            break;
        case "ADD_LAYER":
        case "DELETE_LAYER":
            affectedLayerIds = [typeof action.payload === "string" ? action.payload : (action.payload as any).id];
            break;
        case "UPDATE_LAYER":
            affectedLayerIds = [(action.payload as any).id];
            break;
        case "RENAME_LAYER":
            affectedLayerIds = [(action.payload as any).layerId];
            break;
        case "GROUP_LAYERS":
            affectedLayerIds = (action.payload as any).layerIds;
            break;
        case "DUPLICATE_LAYERS":
            affectedLayerIds = action.payload as string[];
            break;
        case "SELECT_OBJECTS":
            affectedObjectIds = action.payload as string[];
            break;
        case "SELECT_LAYERS":
            affectedLayerIds = action.payload as string[];
            break;
    }

    // For memory optimization, create delta storage for certain actions
    let optimizedPreviousState: SerializableEditorState;
    const shouldUseDeltaStorage =
        action.type === "UPDATE_OBJECT" && affectedObjectIds && affectedObjectIds.length === 1;

    if (shouldUseDeltaStorage && affectedObjectIds) {
        // For single object updates, only store the affected object's previous state
        // instead of the entire editor state to save memory
        const objectId = affectedObjectIds[0];
        if (objectId && previousState.objects[objectId]) {
            const affectedObject = previousState.objects[objectId];

            optimizedPreviousState = {
                ...serializeEditorState(previousState),
                // Only include the specific object that changed
                objects: { [objectId]: affectedObject },
            };
        } else {
            // Fallback to full state if object not found
            optimizedPreviousState = serializeEditorState(previousState);
        }
    } else {
        // Full state for complex operations or when delta storage isn't beneficial
        optimizedPreviousState = serializeEditorState(previousState);
    }

    return {
        id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        description: actionDescription,
        action,
        previousState: optimizedPreviousState,
        affectedObjectIds,
        affectedLayerIds,
    };
}

function shouldRecordHistory(action: EditorAction): boolean {
    const nonHistoryActions = new Set([
        "UNDO",
        "REDO",
        "CLEAR_HISTORY",
        "SELECT_OBJECTS",
        "CLEAR_SELECTION",
        "SELECT_LAYERS",
        "CLEAR_LAYER_SELECTION",
        "SET_ACTIVE_LAYER",
        "EXPAND_LAYER",
        "COLLAPSE_LAYER",
        "SET_VIEWPORT", // Navigation actions typically don't need undo
        "SET_TOOL", // Tool changes typically don't need undo
    ]);

    return !nonHistoryActions.has(action.type);
}

/**
 * Calculate approximate memory size of a history entry for optimization
 */
function calculateHistoryEntrySize(entry: HistoryEntry): number {
    try {
        // Use a replacer function to avoid circular references
        const jsonString = JSON.stringify(entry, (key, value) => {
            // Skip functions, DOM elements, and other problematic objects
            if (
                typeof value === "function" ||
                value instanceof Node ||
                value instanceof Event ||
                (value &&
                    typeof value === "object" &&
                    value.constructor &&
                    (value.constructor.name === "Timeout" ||
                        value.constructor.name === "TimersList" ||
                        value.constructor.name.includes("Timer")))
            ) {
                return "[Circular]";
            }
            return value;
        });
        return jsonString.length;
    } catch (error) {
        // Fallback to rough estimation if JSON.stringify fails
        return JSON.stringify({
            id: entry.id,
            timestamp: entry.timestamp,
            description: entry.description,
            dataSize: Object.keys(entry).length * 100, // rough estimate
        }).length;
    }
}

/**
 * Get memory usage statistics for the history system
 */
function getHistoryMemoryStats(
    undoStack: HistoryEntry[],
    redoStack: HistoryEntry[]
): {
    totalEntries: number;
    undoEntries: number;
    redoEntries: number;
    totalMemoryBytes: number;
    averageEntrySize: number;
    largestEntrySize: number;
} {
    const allEntries = [...undoStack, ...redoStack];
    const sizes = allEntries.map(calculateHistoryEntrySize);
    const totalMemory = sizes.reduce((sum, size) => sum + size, 0);

    return {
        totalEntries: allEntries.length,
        undoEntries: undoStack.length,
        redoEntries: redoStack.length,
        totalMemoryBytes: totalMemory,
        averageEntrySize: allEntries.length > 0 ? totalMemory / allEntries.length : 0,
        largestEntrySize: sizes.length > 0 ? Math.max(...sizes) : 0,
    };
}

/**
 * Check if two actions can be compressed together
 */
function canCompressActions(prevAction: EditorAction, currentAction: EditorAction): boolean {
    // Only compress actions of the same type
    if (prevAction.type !== currentAction.type) return false;

    switch (currentAction.type) {
        case "UPDATE_OBJECT":
            // Compress consecutive updates to the same object
            return (prevAction as any).payload.id === (currentAction as any).payload.id;

        case "SET_VIEWPORT":
            // Compress consecutive viewport changes (panning/zooming)
            return true;

        case "SET_GRID_SIZE":
            // Compress consecutive grid size changes
            return true;

        default:
            return false;
    }
}

/**
 * Compress two similar actions into one optimized action
 */
function compressActions(
    prevEntry: HistoryEntry,
    currentAction: EditorAction,
    currentState: EditorState
): HistoryEntry {
    switch (currentAction.type) {
        case "UPDATE_OBJECT": {
            // Merge object updates
            const prevAction = prevEntry.action as { type: "UPDATE_OBJECT"; payload: { id: string; updates: any } };
            const currentPayload = (currentAction as any).payload;

            return {
                ...prevEntry,
                timestamp: Date.now(), // Update timestamp to current
                action: {
                    type: "UPDATE_OBJECT",
                    payload: {
                        id: prevAction.payload.id,
                        updates: { ...prevAction.payload.updates, ...currentPayload.updates },
                    },
                },
            };
        }

        case "SET_VIEWPORT": {
            // Merge viewport changes
            const prevPayload = (prevEntry.action as any).payload;
            const currentPayload = (currentAction as any).payload;

            return {
                ...prevEntry,
                timestamp: Date.now(),
                action: {
                    type: "SET_VIEWPORT",
                    payload: { ...prevPayload, ...currentPayload },
                },
            };
        }

        case "SET_GRID_SIZE": {
            // Replace with latest grid size
            return {
                ...prevEntry,
                timestamp: Date.now(),
                action: currentAction,
            };
        }

        default:
            return prevEntry;
    }
}

/**
 * Optimize history by removing redundant entries and managing memory
 */
function optimizeHistoryStack(undoStack: HistoryEntry[], maxSize: number, maxMemoryMB: number = 50): HistoryEntry[] {
    if (undoStack.length === 0) return undoStack;

    let optimizedStack = [...undoStack];
    const maxMemoryBytes = maxMemoryMB * 1024 * 1024; // Convert MB to bytes

    // Calculate current memory usage
    let currentMemory = optimizedStack.reduce((total, entry) => total + calculateHistoryEntrySize(entry), 0);

    // Remove oldest entries if memory limit exceeded
    while (currentMemory > maxMemoryBytes && optimizedStack.length > 1) {
        const removedEntry = optimizedStack.shift();
        if (removedEntry) {
            currentMemory -= calculateHistoryEntrySize(removedEntry);
        }
    }

    // Enforce max size limit
    while (optimizedStack.length > maxSize) {
        const removedEntry = optimizedStack.shift();
        if (removedEntry) {
            currentMemory -= calculateHistoryEntrySize(removedEntry);
        }
    }

    // Compress consecutive similar actions (work backwards to preserve most recent)
    for (let i = optimizedStack.length - 1; i > 0; i--) {
        const currentEntry = optimizedStack[i];
        const prevEntry = optimizedStack[i - 1];

        if (currentEntry && prevEntry && canCompressActions(prevEntry.action, currentEntry.action)) {
            // Merge the actions and remove the previous entry
            const compressedEntry = compressActions(prevEntry, currentEntry.action, {} as EditorState);
            optimizedStack[i] = compressedEntry;
            optimizedStack.splice(i - 1, 1);
            i--; // Adjust index after removal
        }
    }

    return optimizedStack;
}

function addToHistory(state: EditorState, historyEntry: HistoryEntry): EditorState {
    let newUndoStack = [...state.history.undoStack];

    // Check if we can compress with the last entry
    const lastEntry = newUndoStack[newUndoStack.length - 1];
    if (lastEntry && canCompressActions(lastEntry.action, historyEntry.action)) {
        // Replace last entry with compressed version
        const compressedEntry = compressActions(lastEntry, historyEntry.action, state);
        newUndoStack[newUndoStack.length - 1] = compressedEntry;

        // Debug logging for compression
        if (process.env.NODE_ENV === "development") {
            console.log(`History: Compressed ${historyEntry.action.type} action`);
        }
    } else {
        // Add new entry
        newUndoStack.push(historyEntry);
    }

    // Optimize the history stack for memory and size
    const originalLength = newUndoStack.length;
    newUndoStack = optimizeHistoryStack(newUndoStack, state.history.maxHistorySize);

    // Debug logging for memory optimization
    if (process.env.NODE_ENV === "development") {
        const stats = getHistoryMemoryStats(newUndoStack, state.history.redoStack);
        if (originalLength !== newUndoStack.length) {
            console.log(`History: Optimized stack from ${originalLength} to ${newUndoStack.length} entries`);
        }
        if (stats.totalMemoryBytes > 1024 * 1024) {
            console.log(
                `History: Memory usage: ${(stats.totalMemoryBytes / (1024 * 1024)).toFixed(2)}MB across ${
                    stats.totalEntries
                } entries`
            );
        }
    }

    return {
        ...state,
        history: {
            ...state.history,
            undoStack: newUndoStack,
            redoStack: [], // Clear redo stack when new action is performed
        },
    };
}
function restoreEditorState(
    currentState: EditorState,
    serializedState: SerializableEditorState,
    historyEntry?: HistoryEntry
): EditorState {
    // Check if this is a delta storage entry (partial object state)
    const isDeltaStorage =
        historyEntry &&
        historyEntry.action.type === "UPDATE_OBJECT" &&
        historyEntry.affectedObjectIds &&
        historyEntry.affectedObjectIds.length === 1 &&
        Object.keys(serializedState.objects).length === 1;

    if (isDeltaStorage && historyEntry?.affectedObjectIds) {
        // For delta storage, only restore the specific object that was affected
        const objectId = historyEntry.affectedObjectIds[0] as string;
        const previousObject = serializedState.objects[objectId];

        if (previousObject) {
            return {
                ...currentState,
                objects: {
                    ...currentState.objects,
                    [objectId]: previousObject,
                },
            };
        }
    }

    // Full state restoration for non-delta entries
    return {
        ...currentState,
        objects: serializedState.objects,
        layers: serializedState.layers,
        layerOrder: serializedState.layerOrder,
        selection: serializedState.selection,
        layerSelection: serializedState.layerSelection,
        viewport: serializedState.viewport,
        selectedTool: serializedState.selectedTool,
        gridVisible: serializedState.gridVisible,
        snapToGrid: serializedState.snapToGrid,
        gridSize: serializedState.gridSize,
    };
}

// Reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
    // Handle history actions first
    switch (action.type) {
        case "UNDO": {
            if (state.history.undoStack.length === 0) return state;

            const historyEntry = state.history.undoStack[state.history.undoStack.length - 1];
            if (!historyEntry) return state;

            const newUndoStack = state.history.undoStack.slice(0, -1);
            const newRedoStack = [...state.history.redoStack];

            // Create redo entry from current state
            const redoEntry = createHistoryEntry(historyEntry.action, state, `Redo ${historyEntry.description}`);
            newRedoStack.push(redoEntry);

            // Restore previous state
            const restoredState = restoreEditorState(state, historyEntry.previousState, historyEntry);

            return {
                ...restoredState,
                history: {
                    ...state.history,
                    undoStack: newUndoStack,
                    redoStack: newRedoStack,
                    isExecutingHistory: false,
                },
                canUndo: newUndoStack.length > 0,
                canRedo: true,
            };
        }

        case "REDO": {
            if (state.history.redoStack.length === 0) return state;

            const redoEntry = state.history.redoStack[state.history.redoStack.length - 1];
            if (!redoEntry) return state;

            const newRedoStack = state.history.redoStack.slice(0, -1);
            const newUndoStack = [...state.history.undoStack];

            // Create undo entry from current state
            const undoEntry = createHistoryEntry(redoEntry.action, state, redoEntry.description.replace("Redo ", ""));
            newUndoStack.push(undoEntry);

            // Restore redo state
            const restoredState = restoreEditorState(state, redoEntry.previousState, redoEntry);

            return {
                ...restoredState,
                history: {
                    ...state.history,
                    undoStack: newUndoStack,
                    redoStack: newRedoStack,
                    isExecutingHistory: false,
                },
                canUndo: true,
                canRedo: newRedoStack.length > 0,
            };
        }

        case "CLEAR_HISTORY": {
            return {
                ...state,
                history: {
                    ...state.history,
                    undoStack: [],
                    redoStack: [],
                },
                canUndo: false,
                canRedo: false,
            };
        }

        case "LOAD_PROJECT": {
            const projectData = action.payload;
            const restoredState = restoreEditorState(state, projectData.editorState);

            return {
                ...restoredState,
                history: {
                    undoStack: projectData.historySnapshot || [],
                    redoStack: [],
                    maxHistorySize: state.history.maxHistorySize,
                    isExecutingHistory: false,
                },
                canUndo: (projectData.historySnapshot || []).length > 0,
                canRedo: false,
            };
        }

        case "IMPORT_OBJECTS": {
            const { objects, layers } = action.payload;
            const newObjects: Record<string, import("../types/editor").CanvasObject> = {};
            const newLayers: Record<string, import("../types/editor").Layer> = {};

            // Add imported objects to state
            objects.forEach((obj) => {
                newObjects[obj.id] = obj;
            });

            // Convert import layers to editor layers
            layers.forEach((importLayer) => {
                const layer: import("../types/editor").Layer = {
                    id: importLayer.id,
                    name: importLayer.name,
                    visible: importLayer.visible,
                    locked: importLayer.locked,
                    objects: importLayer.objects,
                    parentId: undefined,
                    children: [],
                    expanded: true,
                    opacity: importLayer.opacity,
                    blendMode: "normal",
                    type: "default",
                    order: importLayer.order,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                newLayers[layer.id] = layer;
            });

            const newLayerOrder = [...state.layerOrder, ...Object.keys(newLayers)];
            const newState = {
                ...state,
                objects: { ...state.objects, ...newObjects },
                layers: { ...state.layers, ...newLayers },
                layerOrder: newLayerOrder,
                // Select imported objects
                selection: { objectIds: Object.keys(newObjects) },
            };

            return addToHistory(newState, {
                id: `import-${Date.now()}`,
                timestamp: Date.now(),
                description: `Import ${objects.length} objects`,
                action: action,
                previousState: serializeEditorState(state),
                affectedObjectIds: Object.keys(newObjects),
                affectedLayerIds: Object.keys(newLayers),
            });
        }
    }

    // Record history for other actions (if not executing history and action should be recorded)
    const shouldRecord = shouldRecordHistory(action) && !state.history.isExecutingHistory;
    const historyEntry = shouldRecord ? createHistoryEntry(action, state) : null;

    // Process the actual action
    let newState: EditorState;
    switch (action.type) {
        case "SET_TOOL":
            newState = { ...state, selectedTool: action.payload };
            break;

        case "ADD_OBJECT": {
            const object = action.payload;
            const layerId = object.layerId || "default";

            // Ensure layer exists
            if (!state.layers[layerId]) {
                console.warn(`Layer ${layerId} does not exist, adding to default layer`);
                object.layerId = "default";
            }

            const targetLayer = state.layers[object.layerId];
            if (!targetLayer) {
                newState = state;
                break;
            }

            newState = {
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
            break;
        }

        case "UPDATE_OBJECT": {
            const { id, updates } = action.payload;
            const existingObject = state.objects[id];
            if (!existingObject) {
                newState = state;
                break;
            }

            newState = {
                ...state,
                objects: {
                    ...state.objects,
                    [id]: { ...existingObject, ...updates } as CanvasObject,
                },
            };
            break;
        }

        case "DELETE_OBJECT": {
            const objectId = action.payload;
            const object = state.objects[objectId];
            if (!object) {
                newState = state;
                break;
            }

            const { [objectId]: deletedObject, ...remainingObjects } = state.objects;

            // Remove from layer
            const layer = state.layers[object.layerId];
            if (!layer) {
                newState = state;
                break;
            }

            const updatedLayer = {
                ...layer,
                objects: layer.objects.filter((id) => id !== objectId),
            };

            // Remove from selection if selected
            const newSelection = {
                ...state.selection,
                objectIds: state.selection.objectIds.filter((id) => id !== objectId),
            };

            newState = {
                ...state,
                objects: remainingObjects,
                layers: { ...state.layers, [object.layerId]: updatedLayer },
                selection: newSelection,
            };
            break;
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

        case "TOGGLE_SMART_GUIDES":
            return {
                ...state,
                smartGuides: {
                    ...state.smartGuides,
                    enabled: !state.smartGuides.enabled,
                },
            };

        case "SET_SMART_GUIDES_OPTIONS":
            return {
                ...state,
                smartGuides: {
                    ...state.smartGuides,
                    ...action.payload,
                },
            };

        case "SET_ACTIVE_GUIDES":
            return {
                ...state,
                smartGuides: {
                    ...state.smartGuides,
                    activeGuides: action.payload,
                },
            };

        case "ADD_MANUAL_GUIDE":
            return {
                ...state,
                manualGuides: {
                    ...state.manualGuides,
                    guides: [...state.manualGuides.guides, action.payload],
                },
            };

        case "UPDATE_MANUAL_GUIDE":
            return {
                ...state,
                manualGuides: {
                    ...state.manualGuides,
                    guides: state.manualGuides.guides.map((guide) =>
                        guide.id === action.payload.id ? { ...guide, ...action.payload.updates } : guide
                    ),
                },
            };

        case "DELETE_MANUAL_GUIDE":
            return {
                ...state,
                manualGuides: {
                    ...state.manualGuides,
                    guides: state.manualGuides.guides.filter((guide) => guide.id !== action.payload),
                },
            };

        case "CLEAR_MANUAL_GUIDES":
            return {
                ...state,
                manualGuides: {
                    ...state.manualGuides,
                    guides: [],
                },
            };

        case "TOGGLE_MANUAL_GUIDES":
            return {
                ...state,
                manualGuides: {
                    ...state.manualGuides,
                    enabled: !state.manualGuides.enabled,
                },
            };

        case "SET_MANUAL_GUIDES_OPTIONS":
            return {
                ...state,
                manualGuides: {
                    ...state.manualGuides,
                    ...action.payload,
                },
            };

        case "TOGGLE_RULERS":
            return {
                ...state,
                rulers: {
                    ...state.rulers,
                    visible: !state.rulers.visible,
                },
            };

        case "SET_RULER_UNIT":
            return {
                ...state,
                rulers: {
                    ...state.rulers,
                    unit: action.payload,
                },
            };

        case "TOGGLE_MEASUREMENTS":
            return {
                ...state,
                rulers: {
                    ...state.rulers,
                    showMeasurements: !state.rulers.showMeasurements,
                },
            };

        case "SET_MEASUREMENT_PRECISION":
            return {
                ...state,
                rulers: {
                    ...state.rulers,
                    precision: action.payload,
                },
            };

        case "TOGGLE_PRECISION_INPUTS":
            return {
                ...state,
                precisionInputs: {
                    ...state.precisionInputs,
                    visible: !state.precisionInputs.visible,
                },
            };

        case "SET_PRECISION_UNIT":
            return {
                ...state,
                precisionInputs: {
                    ...state.precisionInputs,
                    unit: action.payload,
                },
            };

        case "SET_PRECISION_OPTIONS":
            return {
                ...state,
                precisionInputs: {
                    ...state.precisionInputs,
                    ...action.payload,
                },
            };

        case "UPDATE_MOUSE_POSITION":
            return {
                ...state,
                precisionInputs: {
                    ...state.precisionInputs,
                    currentMousePosition: action.payload,
                },
            };

        case "ALIGN_OBJECTS": {
            const { type: alignType, objectIds, options } = action.payload;
            const objectsToAlign = objectIds
                .map((id) => state.objects[id])
                .filter((obj): obj is CanvasObject => obj !== undefined);

            if (objectsToAlign.length === 0) return state;

            let alignedObjects: CanvasObject[];

            // Determine which alignment function to use
            switch (alignType) {
                case "left":
                    alignedObjects = alignLeft(objectsToAlign, options || {});
                    break;
                case "right":
                    alignedObjects = alignRight(objectsToAlign, options || {});
                    break;
                case "center-horizontal":
                    alignedObjects = alignCenterHorizontal(objectsToAlign, options || {});
                    break;
                case "top":
                    alignedObjects = alignTop(objectsToAlign, options || {});
                    break;
                case "bottom":
                    alignedObjects = alignBottom(objectsToAlign, options || {});
                    break;
                case "center-vertical":
                    alignedObjects = alignCenterVertical(objectsToAlign, options || {});
                    break;
                default:
                    return state;
            }

            // Update the objects in state
            const updatedObjects = { ...state.objects };
            alignedObjects.forEach((obj) => {
                updatedObjects[obj.id] = obj;
            });

            return {
                ...state,
                objects: updatedObjects,
            };
        }

        case "DISTRIBUTE_OBJECTS": {
            const { type: distributeType, objectIds, options } = action.payload;
            const objectsToDistribute = objectIds
                .map((id) => state.objects[id])
                .filter((obj): obj is CanvasObject => obj !== undefined);

            if (objectsToDistribute.length < 3) return state;

            let distributedObjects: CanvasObject[];

            switch (distributeType) {
                case "horizontal":
                    distributedObjects = distributeHorizontal(objectsToDistribute, options || {});
                    break;
                case "vertical":
                    distributedObjects = distributeVertical(objectsToDistribute, options || {});
                    break;
                default:
                    return state;
            }

            // Update the objects in state
            const updatedObjects = { ...state.objects };
            distributedObjects.forEach((obj) => {
                updatedObjects[obj.id] = obj;
            });

            return {
                ...state,
                objects: updatedObjects,
            };
        }

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

        case "PATH_OPERATION": {
            const { type: operationType, pathIds } = action.payload;

            // Validate that we have at least 2 paths and all are path objects
            if (pathIds.length < 2) return state;

            const pathObjects = pathIds
                .map((id) => state.objects[id])
                .filter(
                    (obj): obj is import("../types/editor").PathObject => obj?.type === "path"
                ) as import("../types/editor").PathObject[];

            if (pathObjects.length < 2 || !pathObjects[0]) return state;

            try {
                // Import path operation functions synchronously
                const { performPathOperation } = require("../utils/pathUtils");

                // Extract path data from objects
                const pathDataArray = pathObjects.map((obj) => obj.pathData);

                // Perform the operation
                const resultPathData = performPathOperation(operationType, pathDataArray);

                if (!resultPathData) return state;

                // Create a new path object with the result
                const resultId = `path-${Date.now()}`;
                const firstPath = pathObjects[0];
                const newPath: import("../types/editor").PathObject = {
                    ...firstPath,
                    id: resultId,
                    type: "path" as const,
                    name: `${operationType} result`,
                    pathData: resultPathData,
                    nodes: undefined, // Clear nodes as they're no longer valid
                };

                // Remove the original paths and add the new one
                const newObjects = { ...state.objects };
                pathIds.forEach((id) => delete newObjects[id]);
                newObjects[resultId] = newPath;

                // Update layers to remove old objects and add new one
                const newLayers = { ...state.layers };
                const targetLayer = firstPath.layerId || "default";
                const layer = newLayers[targetLayer];

                if (layer) {
                    newLayers[targetLayer] = {
                        ...layer,
                        objects: layer.objects.filter((id) => !pathIds.includes(id)).concat(resultId),
                    };
                }

                // Update selection to the new path
                return {
                    ...state,
                    objects: newObjects,
                    layers: newLayers,
                    selection: { objectIds: [resultId] },
                };
            } catch (error) {
                console.error("Path operation failed:", error);
                return state;
            }
        }

        case "UPDATE_AUTO_SAVE_SETTINGS": {
            const settings = action.payload;
            newState = {
                ...state,
                autoSave: {
                    ...state.autoSave,
                    settings: {
                        ...state.autoSave.settings,
                        ...settings,
                    },
                },
            };
            break;
        }

        case "SET_AUTO_SAVE_STATE": {
            const autoSaveState = action.payload;
            newState = {
                ...state,
                autoSave: {
                    ...state.autoSave,
                    ...autoSaveState,
                },
            };
            break;
        }

        default:
            newState = state;
            break;
    }

    // Add history entry if needed and return updated state
    if (historyEntry && newState !== state) {
        const stateWithHistory = addToHistory(newState, historyEntry);
        return {
            ...stateWithHistory,
            canUndo: stateWithHistory.history.undoStack.length > 0,
            canRedo: stateWithHistory.history.redoStack.length > 0,
        };
    }

    return newState;
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

    // Smart guide methods
    toggleSmartGuides: () => void;
    setSmartGuidesOptions: (options: Partial<SmartGuidesState>) => void;
    setActiveGuides: (guides: SmartGuide[]) => void;

    // Manual guide methods
    addManualGuide: (guide: ManualGuide) => void;
    updateManualGuide: (id: string, updates: Partial<ManualGuide>) => void;
    deleteManualGuide: (id: string) => void;
    clearManualGuides: () => void;
    toggleManualGuides: () => void;
    setManualGuidesOptions: (options: Partial<ManualGuidesState>) => void;

    // Ruler methods
    toggleRulers: () => void;
    setRulerUnit: (unit: UnitType) => void;
    toggleMeasurements: () => void;
    setMeasurementPrecision: (precision: number) => void;

    // Precision input methods
    togglePrecisionInputs: () => void;
    setPrecisionUnit: (unit: UnitType) => void;
    setPrecisionOptions: (options: Partial<PrecisionInputState>) => void;
    updateMousePosition: (position: CoordinateDisplay) => void;

    // Alignment methods
    alignObjects: (
        type: "left" | "right" | "center-horizontal" | "top" | "bottom" | "center-vertical",
        objectIds: string[],
        options?: { alignToCanvas?: boolean; canvasWidth?: number; canvasHeight?: number }
    ) => void;
    distributeObjects: (
        type: "horizontal" | "vertical",
        objectIds: string[],
        options?: { spacing?: number; useCenter?: boolean }
    ) => void;

    // Path operations
    performPathOperation: (operation: PathOperationType, pathIds: string[]) => void;

    // History methods
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;

    // Project methods
    saveProject: (metadata?: Partial<ProjectMetadata>) => ProjectData;
    loadProject: (projectData: ProjectData) => void;
    importObjects: (objects: CanvasObject[], layers: Layer[]) => void;

    // Storage methods
    saveProjectToStorage: (metadata?: Partial<ProjectMetadata>) => Promise<void>;
    loadProjectFromStorage: (projectId: string) => Promise<void>;
    deleteProjectFromStorage: (projectId: string) => Promise<void>;
    downloadProjectFile: (metadata?: Partial<ProjectMetadata>) => Promise<void>;
    uploadProjectFile: (file: File) => Promise<void>;
    getStoredProjectsList: () => StoredProjectMetadata[];

    // Auto-save methods
    enableAutoSave: () => void;
    disableAutoSave: () => void;
    updateAutoSaveSettings: (settings: Partial<AutoSaveSettings>) => void;
    getAutoSaveSettings: () => AutoSaveSettings;
    checkAutoSavedProject: () => boolean;
    loadAutoSavedProjectData: () => Promise<ProjectData | null>;
    clearAutoSave: () => void;
    isAutoSaveEnabled: () => boolean;
    getLastSaveTime: () => number | null;

    // Project utilities
    createNewProject: (name?: string) => void;
    generateThumbnail: () => string | undefined;
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

    // Smart guide functions
    const toggleSmartGuides = () => dispatch({ type: "TOGGLE_SMART_GUIDES" });
    const setSmartGuidesOptions = (options: Partial<SmartGuidesState>) =>
        dispatch({ type: "SET_SMART_GUIDES_OPTIONS", payload: options });
    const setActiveGuides = (guides: SmartGuide[]) => dispatch({ type: "SET_ACTIVE_GUIDES", payload: guides });

    // Manual guide functions
    const addManualGuide = (guide: ManualGuide) => dispatch({ type: "ADD_MANUAL_GUIDE", payload: guide });
    const updateManualGuide = (id: string, updates: Partial<ManualGuide>) =>
        dispatch({ type: "UPDATE_MANUAL_GUIDE", payload: { id, updates } });
    const deleteManualGuide = (id: string) => dispatch({ type: "DELETE_MANUAL_GUIDE", payload: id });
    const clearManualGuides = () => dispatch({ type: "CLEAR_MANUAL_GUIDES" });
    const toggleManualGuides = () => dispatch({ type: "TOGGLE_MANUAL_GUIDES" });
    const setManualGuidesOptions = (options: Partial<ManualGuidesState>) =>
        dispatch({ type: "SET_MANUAL_GUIDES_OPTIONS", payload: options });

    // Ruler functions
    const toggleRulers = () => dispatch({ type: "TOGGLE_RULERS" });
    const setRulerUnit = (unit: UnitType) => dispatch({ type: "SET_RULER_UNIT", payload: unit });
    const toggleMeasurements = () => dispatch({ type: "TOGGLE_MEASUREMENTS" });
    const setMeasurementPrecision = (precision: number) =>
        dispatch({ type: "SET_MEASUREMENT_PRECISION", payload: precision });

    // Precision input functions
    const togglePrecisionInputs = () => dispatch({ type: "TOGGLE_PRECISION_INPUTS" });
    const setPrecisionUnit = (unit: UnitType) => dispatch({ type: "SET_PRECISION_UNIT", payload: unit });
    const setPrecisionOptions = (options: Partial<PrecisionInputState>) =>
        dispatch({ type: "SET_PRECISION_OPTIONS", payload: options });
    const updateMousePosition = (position: CoordinateDisplay) =>
        dispatch({ type: "UPDATE_MOUSE_POSITION", payload: position });

    // Alignment functions
    const alignObjects = (
        type: "left" | "right" | "center-horizontal" | "top" | "bottom" | "center-vertical",
        objectIds: string[],
        options?: { alignToCanvas?: boolean; canvasWidth?: number; canvasHeight?: number }
    ) => dispatch({ type: "ALIGN_OBJECTS", payload: { type, objectIds, options } });

    const distributeObjects = (
        type: "horizontal" | "vertical",
        objectIds: string[],
        options?: { spacing?: number; useCenter?: boolean }
    ) => dispatch({ type: "DISTRIBUTE_OBJECTS", payload: { type, objectIds, options } });

    const performPathOperation = (operation: PathOperationType, pathIds: string[]) => {
        dispatch({ type: "PATH_OPERATION", payload: { type: operation, pathIds } });
    };

    // History methods
    const undo = () => dispatch({ type: "UNDO" });
    const redo = () => dispatch({ type: "REDO" });
    const clearHistory = () => dispatch({ type: "CLEAR_HISTORY" });

    // Project methods
    const saveProject = (metadata?: Partial<ProjectMetadata>): ProjectData => {
        return serializeProject(state, metadata);
    };

    const loadProject = (projectData: ProjectData) => {
        const { editorState } = deserializeProject(projectData);
        dispatch({ type: "LOAD_PROJECT", payload: projectData });
    };

    const importObjects = (objects: CanvasObject[], layers: Layer[]) => {
        dispatch({ type: "IMPORT_OBJECTS", payload: { objects, layers } });
    };

    // Storage methods
    const saveProjectToStorage = async (metadata?: Partial<ProjectMetadata>): Promise<void> => {
        const projectData = serializeProject(state, metadata);
        await saveProjectToLocalStorage(projectData);
    };

    const loadProjectFromStorage = async (projectId: string): Promise<void> => {
        const projectData = await loadProjectFromLocalStorage(projectId);
        const { editorState } = deserializeProject(projectData);
        dispatch({ type: "LOAD_PROJECT", payload: projectData });
    };

    const deleteProjectFromStorage = async (projectId: string): Promise<void> => {
        await deleteProjectFromLocalStorage(projectId);
    };

    const downloadProjectFile = async (metadata?: Partial<ProjectMetadata>): Promise<void> => {
        const projectData = serializeProject(state, metadata);
        await downloadProject(projectData);
    };

    const uploadProjectFile = async (file: File): Promise<void> => {
        const projectData = await uploadProject(file);
        const { editorState } = deserializeProject(projectData);
        dispatch({ type: "LOAD_PROJECT", payload: projectData });
    };

    const getStoredProjectsList = (): StoredProjectMetadata[] => {
        return getStoredProjects();
    };

    // Auto-save methods
    const enableAutoSave = () => {
        if (state.autoSave.intervalId) return; // Already enabled

        const intervalId = setInterval(async () => {
            try {
                dispatch({ type: "SET_AUTO_SAVE_STATE", payload: { isAutoSaving: true } });
                await autoSaveProject(serializeProject(state));
                dispatch({
                    type: "SET_AUTO_SAVE_STATE",
                    payload: {
                        isAutoSaving: false,
                        lastSaveTime: Date.now(),
                    },
                });
            } catch (error) {
                console.warn("Auto-save failed:", error);
                dispatch({ type: "SET_AUTO_SAVE_STATE", payload: { isAutoSaving: false } });
            }
        }, state.autoSave.settings.interval);

        dispatch({ type: "SET_AUTO_SAVE_STATE", payload: { intervalId } });
    };

    const disableAutoSave = () => {
        if (state.autoSave.intervalId) {
            clearInterval(state.autoSave.intervalId);
            dispatch({ type: "SET_AUTO_SAVE_STATE", payload: { intervalId: null } });
        }
    };

    const updateAutoSaveSettings = (settings: Partial<AutoSaveSettings>) => {
        dispatch({ type: "UPDATE_AUTO_SAVE_SETTINGS", payload: settings });

        // If interval changed, restart auto-save
        if (settings.interval && state.autoSave.intervalId) {
            disableAutoSave();
            // Use setTimeout to ensure state is updated before re-enabling
            setTimeout(() => enableAutoSave(), 100);
        }

        // If auto-save was disabled
        if (settings.enabled === false && state.autoSave.intervalId) {
            disableAutoSave();
        }

        // If auto-save was enabled
        if (settings.enabled === true && !state.autoSave.intervalId) {
            enableAutoSave();
        }
    };

    const getAutoSaveSettings = (): AutoSaveSettings => {
        return state.autoSave.settings;
    };

    const isAutoSaveEnabled = (): boolean => {
        return state.autoSave.settings.enabled && state.autoSave.intervalId !== null;
    };

    const getLastSaveTime = (): number | null => {
        return state.autoSave.lastSaveTime;
    };

    const checkAutoSavedProject = (): boolean => {
        return hasAutoSavedProject();
    };

    const loadAutoSavedProjectData = async (): Promise<ProjectData | null> => {
        return await loadAutoSavedProject();
    };

    const clearAutoSave = (): void => {
        clearAutoSavedProject();
    };

    // Project utilities
    const createNewProject = (name?: string): void => {
        const newProject = createEmptyProject(name);
        dispatch({ type: "LOAD_PROJECT", payload: newProject });
    };

    const generateThumbnail = (): string | undefined => {
        const canvasElement = document.querySelector('svg[data-testid="canvas"]') as SVGElement;
        return generateProjectThumbnail(canvasElement);
    };

    // Initialize auto-save on mount and handle settings changes
    useEffect(() => {
        if (state.autoSave.settings.enabled && !state.autoSave.intervalId) {
            enableAutoSave();
        }

        // Cleanup on unmount
        return () => {
            if (state.autoSave.intervalId) {
                clearInterval(state.autoSave.intervalId);
            }
        };
    }, [state.autoSave.settings.enabled]);

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
        toggleSmartGuides,
        setSmartGuidesOptions,
        setActiveGuides,
        addManualGuide,
        updateManualGuide,
        deleteManualGuide,
        clearManualGuides,
        toggleManualGuides,
        setManualGuidesOptions,
        toggleRulers,
        setRulerUnit,
        toggleMeasurements,
        setMeasurementPrecision,
        togglePrecisionInputs,
        setPrecisionUnit,
        setPrecisionOptions,
        updateMousePosition,
        alignObjects,
        distributeObjects,
        performPathOperation,
        undo,
        redo,
        clearHistory,
        saveProject,
        loadProject,
        saveProjectToStorage,
        loadProjectFromStorage,
        deleteProjectFromStorage,
        downloadProjectFile,
        uploadProjectFile,
        getStoredProjectsList,
        enableAutoSave,
        disableAutoSave,
        updateAutoSaveSettings,
        getAutoSaveSettings,
        isAutoSaveEnabled,
        getLastSaveTime,
        checkAutoSavedProject,
        loadAutoSavedProjectData,
        clearAutoSave,
        createNewProject,
        generateThumbnail,
        importObjects,
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
