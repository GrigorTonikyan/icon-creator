// Canvas Object Types
export interface Point {
    x: number;
    y: number;
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Transform {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    originX?: number; // Transform origin X (0-1, default: 0.5 = center)
    originY?: number; // Transform origin Y (0-1, default: 0.5 = center)
}

// Base Canvas Object
export interface BaseCanvasObject {
    id: string;
    type: CanvasObjectType;
    name: string;
    transform: Transform;
    visible: boolean;
    locked: boolean;
    opacity: number;
    zIndex: number;
    layerId: string;
}

// Object Types
export type CanvasObjectType = "rectangle" | "circle" | "text" | "path" | "group";

// Shape Objects
export interface ShapeStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: number[];
}

export interface RectangleObject extends BaseCanvasObject {
    type: "rectangle";
    width: number;
    height: number;
    borderRadius?: number;
    style: ShapeStyle;
}

export interface CircleObject extends BaseCanvasObject {
    type: "circle";
    radius: number;
    style: ShapeStyle;
}

// Text Object
export interface TextStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    color: string;
    textAlign: "left" | "center" | "right";
    lineHeight: number;
}

export interface TextObject extends BaseCanvasObject {
    type: "text";
    content: string;
    style: TextStyle;
}

// Path Node for path editing
export interface PathNode {
    id: string;
    x: number;
    y: number;
    type: "move" | "line" | "curve"; // SVG path command type
    // For bezier curves
    controlPoint1?: Point;
    controlPoint2?: Point;
}

// Path Object
export interface PathObject extends BaseCanvasObject {
    type: "path";
    pathData: string; // SVG path data
    style: ShapeStyle;
    nodes?: PathNode[]; // Optional parsed nodes for editing
}

// Group Object
export interface GroupObject extends BaseCanvasObject {
    type: "group";
    children: string[]; // Array of child object IDs
}

// Union type for all canvas objects
export type CanvasObject = RectangleObject | CircleObject | TextObject | PathObject | GroupObject;

// Layer System
export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    objects: string[]; // Array of object IDs in this layer
    parentId?: string; // For nested layers/groups
    children: string[]; // Array of child layer IDs
    expanded?: boolean; // For group layers - whether children are visible in tree
    opacity?: number; // Layer opacity (0-1)
    blendMode?: LayerBlendMode; // How layer blends with layers below
    type: LayerType; // Layer type for different behaviors
    order: number; // Layer order within its parent (for stable sorting)
    createdAt: number; // Timestamp for creation order
    updatedAt: number; // Timestamp for last update
}

// Layer type enumeration
export type LayerType = "default" | "group" | "shape" | "text" | "image";

// Layer blend modes for advanced compositing
export type LayerBlendMode =
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "soft-light"
    | "hard-light"
    | "color-dodge"
    | "color-burn"
    | "darken"
    | "lighten"
    | "difference"
    | "exclusion";

// Layer tree node for hierarchical operations
export interface LayerTreeNode {
    layer: Layer;
    children: LayerTreeNode[];
    depth: number;
    index: number;
    parentNode?: LayerTreeNode;
}

// Layer operations for drag and drop and selection
export interface LayerOperation {
    type: "move" | "group" | "ungroup" | "duplicate" | "delete";
    sourceIds: string[];
    targetId?: string;
    targetPosition?: "before" | "after" | "inside";
}

// Path Operations
export type PathOperationType = "unite" | "subtract" | "intersect" | "exclude";

export interface PathOperation {
    type: PathOperationType;
    pathIds: string[]; // Array of path object IDs to operate on
}

// Layer selection state
export interface LayerSelection {
    selectedLayerIds: string[];
    activeLayerId?: string; // The primary selected layer for property editing
}

// Tool Types
export type ToolType = "select" | "rectangle" | "circle" | "text" | "pen" | "hand" | "zoom";

export interface Tool {
    type: ToolType;
    name: string;
    icon: string;
    shortcut?: string;
}

// Selection System
export interface Selection {
    objectIds: string[];
    bounds?: Bounds;
}

// Canvas State
export interface ViewportState {
    zoom: number;
    panX: number;
    panY: number;
    canvasWidth: number;
    canvasHeight: number;
}

// Smart Guides Types
export interface SmartGuide {
    id: string;
    type: "horizontal" | "vertical";
    position: number;
    objects: string[]; // IDs of objects that align to this guide
    visible: boolean;
}

export interface SmartGuidesState {
    enabled: boolean;
    showGuides: boolean;
    snapToObjects: boolean;
    snapToEdges: boolean;
    snapToCenter: boolean;
    threshold: number;
    activeGuides: SmartGuide[];
}

// Manual Guides Types
export interface ManualGuide {
    id: string;
    type: "horizontal" | "vertical";
    position: number; // Canvas coordinate
    locked: boolean;
    color?: string;
    visible: boolean;
}

export interface ManualGuidesState {
    guides: ManualGuide[];
    enabled: boolean;
    snapToGuides: boolean;
    showGuides: boolean;
    snapThreshold: number;
    defaultColor: string;
}

// Ruler and Measurement State
export type UnitType = "px" | "pt" | "in" | "cm" | "mm";

export interface RulersState {
    visible: boolean;
    unit: UnitType;
    showMeasurements: boolean;
    precision: number;
}

// Precision Input Types
export interface PrecisionInputValue {
    value: number;
    unit: UnitType;
}

export interface CoordinateDisplay {
    x: number;
    y: number;
    unit: UnitType;
}

export interface PrecisionInputState {
    visible: boolean;
    showCoordinates: boolean;
    showMousePosition: boolean;
    unit: UnitType;
    precision: number;
    lockAspectRatio: boolean;
    currentMousePosition?: CoordinateDisplay;
}

export interface PrecisionValueConstraints {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
}

// Editor State
export interface EditorState {
    // Canvas objects and layers
    objects: Record<string, CanvasObject>;
    layers: Record<string, Layer>;
    layerOrder: string[]; // Top to bottom rendering order

    // Current state
    selectedTool: ToolType;
    selection: Selection;
    layerSelection: LayerSelection; // Layer-specific selection state
    viewport: ViewportState;

    // UI state
    gridVisible: boolean;
    snapToGrid: boolean;
    gridSize: number;
    smartGuides: SmartGuidesState;
    manualGuides: ManualGuidesState;
    rulers: RulersState;
    precisionInputs: PrecisionInputState;

    // History
    canUndo: boolean;
    canRedo: boolean;
    history: HistoryState;

    // Auto-save
    autoSave: AutoSaveState;
}

// History System Types
export interface HistoryState {
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
    maxHistorySize: number;
    isExecutingHistory: boolean; // Prevent recursive history recording
}

export interface HistoryEntry {
    id: string;
    timestamp: number;
    description: string;
    action: EditorAction;
    previousState: SerializableEditorState;
    affectedObjectIds?: string[];
    affectedLayerIds?: string[];
}

// Auto-save Types
export interface AutoSaveSettings {
    enabled: boolean;
    interval: number; // in milliseconds
    maxAutoSaves: number; // maximum number of auto-saves to keep
    showRecoveryPrompt: boolean; // show recovery prompt on app load
}

export interface AutoSaveState {
    settings: AutoSaveSettings;
    intervalId: NodeJS.Timeout | null;
    lastSaveTime: number | null;
    isAutoSaving: boolean;
}

export interface SerializableEditorState {
    objects: Record<string, CanvasObject>;
    layers: Record<string, Layer>;
    layerOrder: string[];
    selection: Selection;
    layerSelection: LayerSelection;
    viewport: ViewportState;
    selectedTool: ToolType;
    gridVisible: boolean;
    snapToGrid: boolean;
    gridSize: number;
    smartGuides: SmartGuidesState;
    manualGuides: ManualGuidesState;
}

export interface ProjectMetadata {
    id: string;
    name: string;
    version: string;
    createdAt: number;
    lastModified: number;
    description?: string;
    tags?: string[];
    thumbnailData?: string; // Base64 image data
}

export interface ProjectData {
    metadata: ProjectMetadata;
    editorState: SerializableEditorState;
    historySnapshot?: HistoryEntry[]; // Optional history preservation
}

// Action Types for Reducer
export type EditorAction =
    | { type: "SET_TOOL"; payload: ToolType }
    | { type: "ADD_OBJECT"; payload: CanvasObject }
    | { type: "UPDATE_OBJECT"; payload: { id: string; updates: Partial<CanvasObject> } }
    | { type: "DELETE_OBJECT"; payload: string }
    | { type: "SELECT_OBJECTS"; payload: string[] }
    | { type: "CLEAR_SELECTION" }
    | { type: "SET_VIEWPORT"; payload: Partial<ViewportState> }
    | { type: "ADD_LAYER"; payload: Layer }
    | { type: "UPDATE_LAYER"; payload: { id: string; updates: Partial<Layer> } }
    | { type: "DELETE_LAYER"; payload: string }
    | { type: "REORDER_LAYERS"; payload: string[] }
    | { type: "RENAME_LAYER"; payload: { layerId: string; newName: string } }
    | { type: "SELECT_LAYERS"; payload: string[] }
    | { type: "CLEAR_LAYER_SELECTION" }
    | { type: "SET_ACTIVE_LAYER"; payload: string }
    | { type: "TOGGLE_LAYER_VISIBILITY"; payload: string }
    | { type: "TOGGLE_LAYER_LOCK"; payload: string }
    | { type: "EXPAND_LAYER"; payload: string }
    | { type: "COLLAPSE_LAYER"; payload: string }
    | { type: "GROUP_LAYERS"; payload: { layerIds: string[]; groupName?: string } }
    | { type: "UNGROUP_LAYER"; payload: string }
    | { type: "DUPLICATE_LAYERS"; payload: string[] }
    | { type: "MOVE_LAYERS"; payload: LayerOperation }
    | { type: "TOGGLE_GRID" }
    | { type: "SET_GRID_SIZE"; payload: number }
    | { type: "TOGGLE_SNAP_TO_GRID" }
    | { type: "TOGGLE_SMART_GUIDES" }
    | { type: "SET_SMART_GUIDES_OPTIONS"; payload: Partial<SmartGuidesState> }
    | { type: "SET_ACTIVE_GUIDES"; payload: SmartGuide[] }
    | { type: "ADD_MANUAL_GUIDE"; payload: ManualGuide }
    | { type: "UPDATE_MANUAL_GUIDE"; payload: { id: string; updates: Partial<ManualGuide> } }
    | { type: "DELETE_MANUAL_GUIDE"; payload: string }
    | { type: "CLEAR_MANUAL_GUIDES" }
    | { type: "TOGGLE_MANUAL_GUIDES" }
    | { type: "SET_MANUAL_GUIDES_OPTIONS"; payload: Partial<ManualGuidesState> }
    | { type: "TOGGLE_RULERS" }
    | { type: "SET_RULER_UNIT"; payload: UnitType }
    | { type: "TOGGLE_MEASUREMENTS" }
    | { type: "SET_MEASUREMENT_PRECISION"; payload: number }
    | { type: "TOGGLE_PRECISION_INPUTS" }
    | { type: "SET_PRECISION_UNIT"; payload: UnitType }
    | { type: "SET_PRECISION_OPTIONS"; payload: Partial<PrecisionInputState> }
    | { type: "UPDATE_MOUSE_POSITION"; payload: CoordinateDisplay }
    | {
          type: "ALIGN_OBJECTS";
          payload: {
              type: "left" | "right" | "center-horizontal" | "top" | "bottom" | "center-vertical";
              objectIds: string[];
              options?: { alignToCanvas?: boolean; canvasWidth?: number; canvasHeight?: number };
          };
      }
    | {
          type: "DISTRIBUTE_OBJECTS";
          payload: {
              type: "horizontal" | "vertical";
              objectIds: string[];
              options?: { spacing?: number; useCenter?: boolean };
          };
      }
    | { type: "PATH_OPERATION"; payload: PathOperation }
    | { type: "IMPORT_OBJECTS"; payload: { objects: CanvasObject[]; layers: Layer[] } }
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "CLEAR_HISTORY" }
    | { type: "LOAD_PROJECT"; payload: ProjectData }
    | { type: "SET_PROJECT_METADATA"; payload: Partial<ProjectMetadata> }
    | { type: "UPDATE_AUTO_SAVE_SETTINGS"; payload: Partial<AutoSaveSettings> }
    | { type: "SET_AUTO_SAVE_STATE"; payload: Partial<AutoSaveState> };

// History action descriptions for UI display
export const ACTION_DESCRIPTIONS: Record<string, string> = {
    ADD_OBJECT: "Add object",
    UPDATE_OBJECT: "Update object",
    DELETE_OBJECT: "Delete object",
    ADD_LAYER: "Add layer",
    UPDATE_LAYER: "Update layer",
    DELETE_LAYER: "Delete layer",
    REORDER_LAYERS: "Reorder layers",
    RENAME_LAYER: "Rename layer",
    GROUP_LAYERS: "Group layers",
    UNGROUP_LAYER: "Ungroup layer",
    DUPLICATE_LAYERS: "Duplicate layers",
    MOVE_LAYERS: "Move layers",
    PATH_OPERATION: "Path operation",
    SET_TOOL: "Change tool",
    SELECT_OBJECTS: "Select objects",
    CLEAR_SELECTION: "Clear selection",
    SET_VIEWPORT: "Change viewport",
    TOGGLE_LAYER_VISIBILITY: "Toggle layer visibility",
    TOGGLE_LAYER_LOCK: "Toggle layer lock",
    EXPAND_LAYER: "Expand layer",
    COLLAPSE_LAYER: "Collapse layer",
    TOGGLE_GRID: "Toggle grid",
    SET_GRID_SIZE: "Change grid size",
    TOGGLE_SNAP_TO_GRID: "Toggle snap to grid",
    ALIGN_OBJECTS: "Align objects",
    DISTRIBUTE_OBJECTS: "Distribute objects",
    TOGGLE_RULERS: "Toggle rulers",
    SET_RULER_UNIT: "Change ruler unit",
    TOGGLE_MEASUREMENTS: "Toggle measurements",
    SET_MEASUREMENT_PRECISION: "Change measurement precision",
    ADD_MANUAL_GUIDE: "Add guide",
    UPDATE_MANUAL_GUIDE: "Update guide",
    DELETE_MANUAL_GUIDE: "Delete guide",
    CLEAR_MANUAL_GUIDES: "Clear all guides",
    TOGGLE_MANUAL_GUIDES: "Toggle guides",
};

// Event Types
export interface CanvasMouseEvent {
    point: Point;
    canvasPoint: Point;
    originalEvent: MouseEvent;
}

export interface CanvasKeyEvent {
    key: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    originalEvent: KeyboardEvent;
}

// Layer Utility Types
export interface LayerHierarchyUtils {
    // Build tree structure from flat layer data
    buildLayerTree: (layers: Record<string, Layer>, layerOrder: string[]) => LayerTreeNode[];

    // Find layer path from root to specific layer
    getLayerPath: (layers: Record<string, Layer>, layerId: string) => string[];

    // Get all descendants of a layer
    getLayerDescendants: (layers: Record<string, Layer>, layerId: string) => string[];

    // Get all ancestors of a layer
    getLayerAncestors: (layers: Record<string, Layer>, layerId: string) => string[];

    // Check if layer can be moved to target position
    canMoveLayer: (
        layers: Record<string, Layer>,
        sourceId: string,
        targetId: string,
        position: "before" | "after" | "inside"
    ) => boolean;

    // Calculate new layer order after move operation
    calculateNewOrder: (layers: Record<string, Layer>, layerOrder: string[], operation: LayerOperation) => string[];
}

// Layer event types for component communication
export interface LayerPanelEvent {
    type: "select" | "toggle-visibility" | "toggle-lock" | "rename" | "expand" | "collapse" | "context-menu";
    layerId: string;
    data?: any;
}

// Property Panel System Types

// Property control types
export type PropertyControlType =
    | "number"
    | "text"
    | "color"
    | "select"
    | "slider"
    | "checkbox"
    | "dimension"
    | "position";

// Property value types
export type PropertyValue = string | number | boolean | string[];

// Property definition for dynamic controls
export interface PropertyDefinition {
    key: string;
    label: string;
    type: PropertyControlType;
    min?: number;
    max?: number;
    step?: number;
    options?: { value: string | number; label: string }[];
    unit?: string;
    validator?: (value: PropertyValue) => boolean;
    transform?: (value: PropertyValue) => PropertyValue;
}

// Property sections for organizing controls
export interface PropertySection {
    id: string;
    title: string;
    collapsible?: boolean;
    collapsed?: boolean;
    properties: PropertyDefinition[];
}

// Property schema for different object types
export interface PropertySchema {
    objectType: CanvasObjectType | "multi" | "none";
    sections: PropertySection[];
}

// Property update payload
export interface PropertyUpdate {
    objectId: string;
    property: string;
    value: PropertyValue;
    nested?: boolean; // For nested properties like style.fill
}

// Property validation result
export interface PropertyValidationResult {
    valid: boolean;
    error?: string;
    value?: PropertyValue; // Transformed/corrected value
}

// Property constraints based on object type and current state
export interface PropertyConstraints {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    minRadius?: number;
    maxRadius?: number;
    minOpacity?: number;
    maxOpacity?: number;
    validColors?: string[];
    validFonts?: string[];
}

// Property panel state
export interface PropertyPanelState {
    selectedObjectIds: string[];
    activeSchema: PropertySchema;
    constraints: PropertyConstraints;
    collapsedSections: Set<string>;
    validationErrors: Record<string, string>;
}

// Common property definitions for reuse
export const COMMON_PROPERTIES = {
    position: {
        x: {
            key: "transform.x",
            label: "X",
            type: "number" as PropertyControlType,
            unit: "px",
        },
        y: {
            key: "transform.y",
            label: "Y",
            type: "number" as PropertyControlType,
            unit: "px",
        },
    },
    dimensions: {
        width: {
            key: "width",
            label: "Width",
            type: "number" as PropertyControlType,
            min: 1,
            unit: "px",
        },
        height: {
            key: "height",
            label: "Height",
            type: "number" as PropertyControlType,
            min: 1,
            unit: "px",
        },
        radius: {
            key: "radius",
            label: "Radius",
            type: "number" as PropertyControlType,
            min: 0,
            unit: "px",
        },
    },
    appearance: {
        opacity: {
            key: "opacity",
            label: "Opacity",
            type: "slider" as PropertyControlType,
            min: 0,
            max: 1,
            step: 0.01,
        },
        visible: {
            key: "visible",
            label: "Visible",
            type: "checkbox" as PropertyControlType,
        },
        locked: {
            key: "locked",
            label: "Locked",
            type: "checkbox" as PropertyControlType,
        },
    },
    style: {
        fill: {
            key: "style.fill",
            label: "Fill",
            type: "color" as PropertyControlType,
        },
        stroke: {
            key: "style.stroke",
            label: "Stroke",
            type: "color" as PropertyControlType,
        },
        strokeWidth: {
            key: "style.strokeWidth",
            label: "Stroke Width",
            type: "number" as PropertyControlType,
            min: 0,
            unit: "px",
        },
    },
} as const;
