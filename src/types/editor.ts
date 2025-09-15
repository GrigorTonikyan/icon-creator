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

// Path Object
export interface PathObject extends BaseCanvasObject {
    type: "path";
    pathData: string; // SVG path data
    style: ShapeStyle;
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

    // History
    canUndo: boolean;
    canRedo: boolean;
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
    | { type: "TOGGLE_SNAP_TO_GRID" };

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
