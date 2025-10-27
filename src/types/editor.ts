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
export type CanvasObjectType =
    | "rectangle"
    | "circle"
    | "text"
    | "path"
    | "group"
    | "component"
    | "symbol"
    | "custom-shape";

// Gradient and Pattern Types
export interface LinearGradient {
    type: "linear";
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stops: GradientStop[];
}

export interface RadialGradient {
    type: "radial";
    id: string;
    cx: number;
    cy: number;
    r: number;
    fx?: number;
    fy?: number;
    stops: GradientStop[];
}

export interface ConicGradient {
    type: "conic";
    id: string;
    cx: number;
    cy: number;
    startAngle: number; // degrees
    stops: GradientStop[];
}

export interface GradientStop {
    offset: number; // 0-1
    color: string;
    opacity?: number;
}

export interface Pattern {
    type: "pattern";
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    patternUnits: "userSpaceOnUse" | "objectBoundingBox";
    patternContentUnits: "userSpaceOnUse" | "objectBoundingBox";
    patternTransform?: string;
    href?: string; // For image patterns
    elements?: CanvasObject[]; // For vector patterns
    // Pattern presets
    patternType?: "dots" | "lines" | "grid" | "diagonal" | "checkerboard" | "custom";
}

export type Gradient = LinearGradient | RadialGradient | ConicGradient;
export type FillType = string | Gradient | Pattern;

// Effects Types
export interface DropShadow {
    type: "drop-shadow";
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity?: number;
}

export interface InnerShadow {
    type: "inner-shadow";
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
    opacity?: number;
}

export interface Glow {
    type: "glow";
    blur: number;
    color: string;
    opacity?: number;
    spread?: number; // Additional spread distance
}

export interface Blur {
    type: "blur";
    radius: number;
}

export interface Brightness {
    type: "brightness";
    value: number; // 0-2, where 1 is normal
}

export interface Contrast {
    type: "contrast";
    value: number; // 0-2, where 1 is normal
}

export interface Saturation {
    type: "saturation";
    value: number; // 0-2, where 1 is normal
}

export interface HueRotate {
    type: "hue-rotate";
    degrees: number; // 0-360
}

export type EffectType = DropShadow | InnerShadow | Glow | Blur | Brightness | Contrast | Saturation | HueRotate;

export interface Effect {
    id: string;
    enabled: boolean;
    effect: EffectType;
}

// Shape Objects
export interface ShapeStyle {
    fill?: FillType;
    stroke?: FillType;
    strokeWidth?: number;
    strokeDasharray?: number[];
    effects?: Effect[];
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
export interface TextStyle extends ShapeStyle {
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

// Custom Shape Extension System
export interface ShapeParameter {
    id: string;
    name: string;
    type: "number" | "color" | "boolean" | "select" | "range";
    value: any;
    min?: number;
    max?: number;
    step?: number;
    options?: string[]; // For select type
    description?: string;
    category?: string;
}

export interface ShapeGeneratorConfig {
    id: string;
    name: string;
    description: string;
    category: string;
    icon?: string;
    parameters: ShapeParameter[];
    presets?: ShapePreset[];
    version: string;
    author?: string;
    tags?: string[];
}

export interface ShapePreset {
    id: string;
    name: string;
    description?: string;
    parameters: Record<string, any>;
    thumbnail?: string;
}

export interface GeneratedShape {
    pathData: string;
    style?: ShapeStyle;
    metadata?: Record<string, any>;
}

export interface ShapeGeneratorResult {
    success: boolean;
    shape?: GeneratedShape;
    error?: string;
    warnings?: string[];
}

export interface ShapeGenerator {
    config: ShapeGeneratorConfig;
    generate: (parameters: Record<string, any>) => ShapeGeneratorResult;
    validateParameters?: (parameters: Record<string, any>) => string[];
    getPreview?: (parameters: Record<string, any>) => string; // SVG preview
}

export interface CustomShapeObject extends BaseCanvasObject {
    type: "custom-shape";
    generatorId: string;
    parameters: Record<string, any>;
    pathData: string; // Generated path data
    style: ShapeStyle;
    lastGenerated: number; // Timestamp of last generation
    version: string; // Generator version used
}

export interface ShapeLibraryState {
    generators: Record<string, ShapeGenerator>;
    activeGenerator?: string;
    parameterValues: Record<string, Record<string, any>>; // generatorId -> parameters
    previewMode: boolean;
    lastUsed: string[]; // Array of generator IDs in usage order
    favorites: string[]; // Array of favorite generator IDs
    categories: string[];
}

// Tool Extension System for Custom Shapes
export interface CustomToolConfig {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category: "shape" | "utility" | "modifier";
    keyboardShortcut?: string;
    cursor?: string;
    parameters?: ShapeParameter[];
}

export interface CustomTool {
    config: CustomToolConfig;
    onActivate?: () => void;
    onDeactivate?: () => void;
    onCanvasMouseDown?: (event: MouseEvent, point: Point) => void;
    onCanvasMouseMove?: (event: MouseEvent, point: Point) => void;
    onCanvasMouseUp?: (event: MouseEvent, point: Point) => void;
    onCanvasKeyDown?: (event: KeyboardEvent) => void;
    onCanvasKeyUp?: (event: KeyboardEvent) => void;
    render?: (context: CanvasRenderingContext2D) => void;
}

export interface CustomToolState {
    tools: Record<string, CustomTool>;
    activeTool?: string;
    toolParameters: Record<string, Record<string, any>>; // toolId -> parameters
}

// Union type for all canvas objects
export type CanvasObject =
    | RectangleObject
    | CircleObject
    | TextObject
    | PathObject
    | GroupObject
    | ComponentInstance
    | SymbolInstance
    | CustomShapeObject;

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

    // Component Library
    componentLibrary: ComponentLibraryState;

    // Symbol Library
    symbolLibrary: SymbolLibraryState;

    // Animation System
    animationTimeline: AnimationTimeline | null;
    animationPreview: AnimationPreview | null;
    isAnimationPanelOpen: boolean;

    // Collaborative Editing - Stage 12 Step 6
    collaboration: CollaborationState;

    // Plugin System - Stage 12 Step 7
    plugins: PluginManagerState;
    pluginManager: PluginManagerState;

    // Custom Shape Extensions - Stage 12 Step 9
    shapeLibrary: ShapeLibraryState;
    customTools: CustomToolState;
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
    componentLibrary: ComponentLibraryState;
    symbolLibrary: SymbolLibraryState;
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
    // Advanced Path Operations - Stage 12 Step 8
    | { type: "PERFORM_BOOLEAN_OPERATION"; payload: { operation: PathOperationType; pathIds: string[] } }
    | {
          type: "SIMPLIFY_PATH";
          payload: {
              pathId: string;
              options?: { tolerance?: number; preserveCorners?: boolean; optimize?: boolean; precision?: number };
          };
      }
    | {
          type: "SMOOTH_PATH";
          payload: {
              pathId: string;
              options?: { smoothingFactor?: number; preserveEnds?: boolean; optimize?: boolean };
          };
      }
    | {
          type: "OFFSET_PATH";
          payload: {
              pathId: string;
              offset: number;
              options?: { joinType?: "miter" | "round" | "bevel"; optimize?: boolean };
          };
      }
    | { type: "REVERSE_PATH"; payload: { pathId: string } }
    | { type: "CONVERT_PATH_TO_ABSOLUTE"; payload: { pathId: string } }
    | { type: "ANALYZE_PATH"; payload: { pathId: string } }
    | { type: "IMPORT_OBJECTS"; payload: { objects: CanvasObject[]; layers: Layer[] } }
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "CLEAR_HISTORY" }
    | { type: "LOAD_PROJECT"; payload: ProjectData }
    | { type: "SET_PROJECT_METADATA"; payload: Partial<ProjectMetadata> }
    | { type: "UPDATE_AUTO_SAVE_SETTINGS"; payload: Partial<AutoSaveSettings> }
    | { type: "SET_AUTO_SAVE_STATE"; payload: Partial<AutoSaveState> }
    | { type: "LOAD_COMPONENT_LIBRARY"; payload: ComponentLibrary }
    | { type: "SET_ACTIVE_COMPONENT_LIBRARY"; payload: string }
    | { type: "SET_COMPONENT_LIBRARY_SEARCH"; payload: string }
    | { type: "SET_COMPONENT_LIBRARY_CATEGORY"; payload: string | undefined }
    | { type: "TOGGLE_COMPONENT_LIBRARY_PANEL" }
    | { type: "SAVE_COMPONENT"; payload: ComponentSaveOptions & { objectIds: string[] } }
    | {
          type: "INSTANTIATE_COMPONENT";
          payload: { templateId: string; position?: Point; propertyOverrides?: Record<string, any> };
      }
    | { type: "UPDATE_COMPONENT_INSTANCE"; payload: { id: string; propertyOverrides: Record<string, any> } }
    // Symbol Library Actions
    | { type: "LOAD_SYMBOL_LIBRARY"; payload: SymbolLibrary }
    | { type: "SET_ACTIVE_SYMBOL_LIBRARY"; payload: string }
    | { type: "SET_SYMBOL_LIBRARY_SEARCH"; payload: string }
    | { type: "SET_SYMBOL_LIBRARY_CATEGORY"; payload: string | undefined }
    | { type: "TOGGLE_SYMBOL_LIBRARY_PANEL" }
    | { type: "SET_SYMBOL_SYNC_MODE"; payload: "auto" | "manual" }
    | { type: "SAVE_SYMBOL"; payload: SymbolSaveOptions & { objectId: string } }
    | {
          type: "INSTANTIATE_SYMBOL";
          payload: { symbolId: string; position?: Point; propertyOverrides?: Record<string, any> };
      }
    | { type: "UPDATE_SYMBOL_INSTANCE"; payload: { id: string; propertyOverrides: Record<string, any> } }
    | { type: "SYNC_SYMBOL_INSTANCE"; payload: { id: string; forceSync?: boolean } }
    | { type: "DETACH_SYMBOL_INSTANCE"; payload: { id: string } }
    | { type: "UPDATE_SYMBOL_MASTER"; payload: { symbolId: string; masterObject: CanvasObject } }

    // Animation actions
    | { type: "CREATE_ANIMATION_TIMELINE"; payload: { timeline: AnimationTimeline } }
    | { type: "UPDATE_ANIMATION_TIMELINE"; payload: { timeline: Partial<AnimationTimeline> } }
    | { type: "DELETE_ANIMATION_TIMELINE" }
    | { type: "ADD_ANIMATION_TRACK"; payload: { track: AnimationTrack } }
    | { type: "UPDATE_ANIMATION_TRACK"; payload: { trackId: string; track: Partial<AnimationTrack> } }
    | { type: "DELETE_ANIMATION_TRACK"; payload: { trackId: string } }
    | { type: "ADD_KEYFRAME"; payload: { trackId: string; keyframe: AnimationKeyframe } }
    | {
          type: "UPDATE_KEYFRAME";
          payload: { trackId: string; keyframeId: string; keyframe: Partial<AnimationKeyframe> };
      }
    | { type: "DELETE_KEYFRAME"; payload: { trackId: string; keyframeId: string } }
    | { type: "ADD_MOTION_PATH"; payload: { motionPath: MotionPath } }
    | { type: "UPDATE_MOTION_PATH"; payload: { pathId: string; motionPath: Partial<MotionPath> } }
    | { type: "DELETE_MOTION_PATH"; payload: { pathId: string } }
    | { type: "PLAY_ANIMATION" }
    | { type: "PAUSE_ANIMATION" }
    | { type: "STOP_ANIMATION" }
    | { type: "SEEK_ANIMATION"; payload: { time: number } }
    | { type: "SET_ANIMATION_PREVIEW"; payload: { preview: AnimationPreview | null } }
    | { type: "TOGGLE_ANIMATION_PANEL"; payload: { isOpen: boolean } }

    // Collaborative Editing Actions - Stage 12 Step 6
    | { type: "ENABLE_COLLABORATION"; payload: { session: CollaborationSession; user: User } }
    | { type: "DISABLE_COLLABORATION" }
    | { type: "UPDATE_COLLABORATION_STATE"; payload: Partial<CollaborationState> }
    | { type: "ADD_USER"; payload: { user: User } }
    | { type: "REMOVE_USER"; payload: { userId: string } }
    | { type: "UPDATE_USER_PRESENCE"; payload: { presence: UserPresence } }
    | { type: "REMOVE_USER_PRESENCE"; payload: { userId: string } }
    | { type: "ADD_OPERATION"; payload: { operation: ChangeOperation } }
    | { type: "APPLY_OPERATION"; payload: { operation: ChangeOperation } }
    | { type: "RESOLVE_CONFLICT"; payload: { resolution: ConflictResolution } }
    | { type: "UPDATE_CONNECTION_STATUS"; payload: { status: CollaborationState["connectionStatus"]; error?: string } }
    | { type: "SYNC_STATE"; payload: { operations: ChangeOperation[]; version: string } }
    | { type: "CREATE_VERSION"; payload: { version: VersionControl } }
    | { type: "ROLLBACK_TO_VERSION"; payload: { version: string } }
    // Plugin System Actions - Stage 12 Step 7
    | { type: "LOAD_PLUGIN"; payload: { plugin: Plugin } }
    | { type: "UNLOAD_PLUGIN"; payload: { pluginId: string } }
    | { type: "ENABLE_PLUGIN"; payload: { pluginId: string } }
    | { type: "DISABLE_PLUGIN"; payload: { pluginId: string } }
    | { type: "UPDATE_PLUGIN_STATE"; payload: { pluginId: string; state: any } }
    | { type: "ADD_PLUGIN_ERROR"; payload: { error: PluginError } }
    | { type: "CLEAR_PLUGIN_ERRORS"; payload: { pluginId?: string } }
    | { type: "REGISTER_EXTENSION_POINT"; payload: { extensionPoint: ExtensionPoint } }
    | { type: "UNREGISTER_EXTENSION_POINT"; payload: { extensionPointId: string } }
    | { type: "EXECUTE_PLUGIN_ACTION"; payload: { pluginId: string; actionId: string; params?: any; result?: any } }

    // Custom Shape Extension Actions - Stage 12 Step 9
    | { type: "REGISTER_SHAPE_GENERATOR"; payload: { generator: ShapeGenerator } }
    | { type: "UNREGISTER_SHAPE_GENERATOR"; payload: { generatorId: string } }
    | { type: "SET_ACTIVE_SHAPE_GENERATOR"; payload: { generatorId: string } }
    | { type: "UPDATE_SHAPE_PARAMETERS"; payload: { generatorId: string; parameters: Record<string, any> } }
    | {
          type: "GENERATE_CUSTOM_SHAPE";
          payload: { generatorId: string; parameters: Record<string, any>; position?: Point };
      }
    | { type: "REGENERATE_CUSTOM_SHAPE"; payload: { objectId: string; parameters?: Record<string, any> } }
    | { type: "APPLY_SHAPE_PRESET"; payload: { generatorId: string; presetId: string } }
    | { type: "SAVE_SHAPE_PRESET"; payload: { generatorId: string; preset: ShapePreset } }
    | { type: "DELETE_SHAPE_PRESET"; payload: { generatorId: string; presetId: string } }
    | { type: "ADD_FAVORITE_SHAPE_GENERATOR"; payload: { generatorId: string } }
    | { type: "REMOVE_FAVORITE_SHAPE_GENERATOR"; payload: { generatorId: string } }
    | { type: "SET_SHAPE_LIBRARY_PREVIEW_MODE"; payload: { enabled: boolean } }

    // Custom Tool Extension Actions
    | { type: "REGISTER_CUSTOM_TOOL"; payload: { tool: CustomTool } }
    | { type: "UNREGISTER_CUSTOM_TOOL"; payload: { toolId: string } }
    | { type: "SET_ACTIVE_CUSTOM_TOOL"; payload: { toolId: string } }
    | { type: "UPDATE_CUSTOM_TOOL_PARAMETERS"; payload: { toolId: string; parameters: Record<string, any> } };

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
    // Advanced Path Operations - Stage 12 Step 8
    PERFORM_BOOLEAN_OPERATION: "Boolean path operation",
    SIMPLIFY_PATH: "Simplify path",
    SMOOTH_PATH: "Smooth path",
    OFFSET_PATH: "Offset path",
    REVERSE_PATH: "Reverse path direction",
    CONVERT_PATH_TO_ABSOLUTE: "Convert path to absolute",
    ANALYZE_PATH: "Analyze path",
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
    SAVE_COMPONENT: "Save component",
    INSTANTIATE_COMPONENT: "Instantiate component",
    UPDATE_COMPONENT_INSTANCE: "Update component properties",
    // Symbol actions
    LOAD_SYMBOL_LIBRARY: "Load symbol library",
    SET_ACTIVE_SYMBOL_LIBRARY: "Set active symbol library",
    SET_SYMBOL_LIBRARY_SEARCH: "Search symbols",
    SET_SYMBOL_LIBRARY_CATEGORY: "Filter symbol category",
    TOGGLE_SYMBOL_LIBRARY_PANEL: "Toggle symbol panel",
    SET_SYMBOL_SYNC_MODE: "Set symbol sync mode",
    SAVE_SYMBOL: "Save symbol",
    INSTANTIATE_SYMBOL: "Instantiate symbol",
    UPDATE_SYMBOL_INSTANCE: "Update symbol properties",
    SYNC_SYMBOL_INSTANCE: "Sync symbol instance",
    DETACH_SYMBOL_INSTANCE: "Detach symbol instance",
    UPDATE_SYMBOL_MASTER: "Update symbol master",
    // Animation actions
    CREATE_ANIMATION_TIMELINE: "Create animation timeline",
    UPDATE_ANIMATION_TIMELINE: "Update animation timeline",
    DELETE_ANIMATION_TIMELINE: "Delete animation timeline",
    ADD_ANIMATION_TRACK: "Add animation track",
    UPDATE_ANIMATION_TRACK: "Update animation track",
    DELETE_ANIMATION_TRACK: "Delete animation track",
    ADD_KEYFRAME: "Add keyframe",
    UPDATE_KEYFRAME: "Update keyframe",
    DELETE_KEYFRAME: "Delete keyframe",
    ADD_MOTION_PATH: "Add motion path",
    UPDATE_MOTION_PATH: "Update motion path",
    DELETE_MOTION_PATH: "Delete motion path",
    PLAY_ANIMATION: "Play animation",
    PAUSE_ANIMATION: "Pause animation",
    STOP_ANIMATION: "Stop animation",
    SEEK_ANIMATION: "Seek animation",
    SET_ANIMATION_PREVIEW: "Set animation preview",
    TOGGLE_ANIMATION_PANEL: "Toggle animation panel",

    // Collaborative Editing Descriptions - Stage 12 Step 6
    ENABLE_COLLABORATION: "Enable collaboration",
    DISABLE_COLLABORATION: "Disable collaboration",
    UPDATE_COLLABORATION_STATE: "Update collaboration state",
    ADD_USER: "Add user to session",
    REMOVE_USER: "Remove user from session",
    UPDATE_USER_PRESENCE: "Update user presence",
    REMOVE_USER_PRESENCE: "Remove user presence",
    ADD_OPERATION: "Add collaborative operation",
    APPLY_OPERATION: "Apply collaborative operation",
    RESOLVE_CONFLICT: "Resolve conflict",
    UPDATE_CONNECTION_STATUS: "Update connection status",
    SYNC_STATE: "Sync collaborative state",
    CREATE_VERSION: "Create version",
    ROLLBACK_TO_VERSION: "Rollback to version",
    // Plugin actions
    LOAD_PLUGIN: "Load plugin",
    UNLOAD_PLUGIN: "Unload plugin",
    ENABLE_PLUGIN: "Enable plugin",
    DISABLE_PLUGIN: "Disable plugin",

    // Custom Shape Extension Descriptions - Stage 12 Step 9
    REGISTER_SHAPE_GENERATOR: "Register shape generator",
    UNREGISTER_SHAPE_GENERATOR: "Unregister shape generator",
    SET_ACTIVE_SHAPE_GENERATOR: "Set active shape generator",
    UPDATE_SHAPE_PARAMETERS: "Update shape parameters",
    GENERATE_CUSTOM_SHAPE: "Generate custom shape",
    REGENERATE_CUSTOM_SHAPE: "Regenerate custom shape",
    APPLY_SHAPE_PRESET: "Apply shape preset",
    SAVE_SHAPE_PRESET: "Save shape preset",
    DELETE_SHAPE_PRESET: "Delete shape preset",
    ADD_FAVORITE_SHAPE_GENERATOR: "Add favorite shape generator",
    REMOVE_FAVORITE_SHAPE_GENERATOR: "Remove favorite shape generator",
    SET_SHAPE_LIBRARY_PREVIEW_MODE: "Set shape library preview mode",

    // Custom Tool Extension Descriptions
    REGISTER_CUSTOM_TOOL: "Register custom tool",
    UNREGISTER_CUSTOM_TOOL: "Unregister custom tool",
    SET_ACTIVE_CUSTOM_TOOL: "Set active custom tool",
    UPDATE_CUSTOM_TOOL_PARAMETERS: "Update custom tool parameters",
    UPDATE_PLUGIN_STATE: "Update plugin state",
    REGISTER_EXTENSION_POINT: "Register extension point",
    UNREGISTER_EXTENSION_POINT: "Unregister extension point",
    EXECUTE_PLUGIN_ACTION: "Execute plugin action",
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
    | "fill"
    | "effects"
    | "select"
    | "slider"
    | "checkbox"
    | "dimension"
    | "position";

// Property value types
export type PropertyValue = string | number | boolean | string[] | FillType | Effect[];

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

// Component Library Types
export interface ComponentTemplate {
    id: string;
    name: string;
    description?: string;
    category: string;
    tags: string[];
    thumbnail?: string; // Base64 encoded thumbnail image
    objects: CanvasObject[]; // Array of objects that make up this component
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        author?: string;
        version: string;
        bounds: Bounds; // Bounding box of the component
    };
    properties?: ComponentProperty[]; // Customizable properties
}

export interface ComponentProperty {
    id: string;
    name: string;
    type: "color" | "number" | "text" | "boolean" | "select";
    defaultValue: string | number | boolean;
    description?: string;
    options?: { value: string | number; label: string }[]; // For select type
    target: {
        objectId: string; // Which object this property affects
        path: string; // Path to the property (e.g., "style.fill", "transform.x")
    };
}

export interface ComponentInstance extends BaseCanvasObject {
    type: "component";
    templateId: string;
    propertyOverrides: Record<string, string | number | boolean>; // Key-value pairs for overridden properties
}

export interface ComponentCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    parentId?: string; // For nested categories
    order: number;
}

export interface ComponentLibrary {
    id: string;
    name: string;
    description?: string;
    version: string;
    categories: ComponentCategory[];
    templates: ComponentTemplate[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        author?: string;
    };
}

// Component Library Events
export interface ComponentLibraryState {
    libraries: ComponentLibrary[];
    activeLibraryId?: string;
    searchQuery: string;
    selectedCategoryId?: string;
    isLibraryPanelOpen: boolean;
}

export interface ComponentSaveOptions {
    name: string;
    description?: string;
    category: string;
    tags: string[];
    generateThumbnail?: boolean;
    createCustomProperties?: boolean;
}

// Symbol System Types
export interface Symbol {
    id: string;
    name: string;
    description?: string;
    category: string;
    tags: string[];
    thumbnail?: string; // Base64 encoded thumbnail image
    masterObject: CanvasObject; // The master object definition
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        author?: string;
        version: string;
        bounds: Bounds; // Bounding box of the symbol
        isLocked: boolean; // Whether the symbol master can be edited
    };
    properties?: SymbolProperty[]; // Customizable properties for instances
}

export interface SymbolProperty {
    id: string;
    name: string;
    type: "color" | "number" | "text" | "boolean" | "select";
    defaultValue: string | number | boolean;
    description?: string;
    options?: { value: string | number; label: string }[]; // For select type
    target: {
        path: string; // Path to the property (e.g., "style.fill", "transform.x")
    };
}

export interface SymbolInstance extends BaseCanvasObject {
    type: "symbol";
    symbolId: string;
    propertyOverrides: Record<string, string | number | boolean>; // Key-value pairs for overridden properties
    isDetached: boolean; // Whether this instance is detached from the master symbol
    lastSyncedVersion: string; // Version of the master symbol this instance was last synced with
}

export interface SymbolLibrary {
    id: string;
    name: string;
    description?: string;
    version: string;
    categories: ComponentCategory[]; // Reuse existing category structure
    symbols: Symbol[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        author?: string;
    };
}

// Symbol Library State
export interface SymbolLibraryState {
    libraries: SymbolLibrary[];
    activeLibraryId?: string;
    searchQuery: string;
    selectedCategoryId?: string;
    isSymbolPanelOpen: boolean;
    syncMode: "auto" | "manual"; // How symbol instances should sync with masters
}

export interface SymbolSaveOptions {
    name: string;
    description?: string;
    category: string;
    tags: string[];
    generateThumbnail?: boolean;
    lockMaster?: boolean;
    createCustomProperties?: boolean;
}

// Animation System Types
export interface AnimationKeyframe {
    id: string;
    time: number; // Time in seconds
    properties: Record<string, unknown>; // Animated property values
    easing?: AnimationEasing;
}

export interface AnimationEasing {
    type: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic-bezier";
    values?: [number, number, number, number]; // For cubic-bezier
}

export interface AnimationTrack {
    id: string;
    objectId: string;
    property: string; // Property path (e.g., "transform.x", "style.fill")
    keyframes: AnimationKeyframe[];
    enabled: boolean;
}

export interface AnimationTimeline {
    id: string;
    name: string;
    duration: number; // Duration in seconds
    tracks: AnimationTrack[];
    loop: boolean;
    autoPlay: boolean;
    currentTime: number;
    isPlaying: boolean;
}

export interface MotionPath {
    id: string;
    objectId: string;
    path: string; // SVG path data
    duration: number;
    offset: number; // Start offset (0-1)
    rotate: boolean; // Rotate object along path
    easing?: AnimationEasing;
}

export interface AnimationPreview {
    timeline: AnimationTimeline;
    motionPaths: MotionPath[];
    showKeyframes: boolean;
    showPaths: boolean;
    playbackSpeed: number; // Multiplier (0.1x to 2x)
}

export interface AnimationExportOptions {
    format: "css" | "svg" | "lottie" | "gif";
    quality?: "low" | "medium" | "high";
    fps?: number;
    dimensions?: { width: number; height: number };
    includeMotionPaths?: boolean;
}

// ============================================================================
// Collaborative Editing Types - Stage 12 Step 6
// ============================================================================

export interface User {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    color: string; // Hex color for cursor and presence indicators
    role: "owner" | "editor" | "viewer";
    isOnline: boolean;
    lastSeen: number; // Timestamp
}

export interface UserPresence {
    userId: string;
    sessionId: string;
    cursor?: Point;
    selection: string[]; // Array of selected object IDs
    tool?: CanvasObjectType | "select" | "pan" | "zoom";
    viewport?: ViewportState;
    lastActivity: number; // Timestamp
    isActive: boolean;
}

export interface ChangeOperation {
    id: string;
    type: "create" | "update" | "delete" | "move" | "transform" | "style";
    timestamp: number;
    userId: string;
    sessionId: string;
    objectId?: string;
    layerId?: string;
    path?: string; // Property path for granular updates (e.g., "style.fill", "transform.x")
    beforeValue?: any;
    afterValue?: any;
    metadata?: Record<string, any>;
    dependencies?: string[]; // IDs of operations this depends on
}

export interface ConflictResolution {
    id: string;
    timestamp: number;
    conflictingOperations: ChangeOperation[];
    resolutionStrategy: "last-write-wins" | "manual" | "auto-merge" | "rollback";
    resolvedOperation?: ChangeOperation;
    resolvedBy?: string; // User ID
    isResolved: boolean;
}

export interface CollaborationSession {
    id: string;
    projectId: string;
    ownerId: string;
    name: string;
    description?: string;
    isPublic: boolean;
    maxUsers: number;
    users: User[];
    activePresence: UserPresence[];
    createdAt: number;
    lastActivity: number;
    settings: CollaborationSettings;
}

export interface CollaborationSettings {
    allowAnonymous: boolean;
    requireApproval: boolean;
    enableVoiceChat: boolean;
    enableTextChat: boolean;
    autoSaveInterval: number; // seconds
    conflictResolution: "auto" | "manual";
    presenceTimeout: number; // milliseconds
    operationTimeout: number; // milliseconds
}

export interface CollaborationState {
    isEnabled: boolean;
    isConnected: boolean;
    isHost: boolean;
    currentUser?: User;
    session?: CollaborationSession;
    connectionStatus: "disconnected" | "connecting" | "connected" | "error";
    lastSync: number; // Timestamp
    pendingOperations: ChangeOperation[];
    operationHistory: ChangeOperation[];
    conflicts: ConflictResolution[];
    presenceIndicators: boolean;
    showCursors: boolean;
    showSelections: boolean;
    error?: string;
}

export interface VersionControl {
    version: string; // Semantic version (e.g., "1.2.3")
    timestamp: number;
    authorId: string;
    message: string;
    operations: ChangeOperation[];
    parentVersion?: string;
    branches?: string[];
    tags?: string[];
    isSnapshot: boolean;
}

export interface CollaborationMessage {
    id: string;
    type: "operation" | "presence" | "cursor" | "selection" | "sync" | "conflict" | "user-joined" | "user-left";
    timestamp: number;
    userId: string;
    sessionId: string;
    data: any;
    acknowledge?: boolean;
    retry?: number;
}

// Plugin System Types - Stage 12 Step 7

// Plugin Manifest
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    homepage?: string;
    repository?: string;
    license?: string;
    keywords: string[];
    category: PluginCategory;
    iconUrl?: string;
    screenshots?: string[];
    minimumEditorVersion: string;
    dependencies?: PluginDependency[];
    permissions: PluginPermission[];
    extensionPoints: string[]; // Extension points this plugin provides
    requiredExtensionPoints?: string[]; // Extension points this plugin requires
}

export type PluginCategory = "tool" | "exporter" | "importer" | "effect" | "ui" | "utility" | "integration";

export interface PluginDependency {
    id: string;
    version: string; // Semantic version range (e.g., "^1.0.0")
    optional?: boolean;
}

export type PluginPermission =
    | "canvas:read"
    | "canvas:write"
    | "objects:read"
    | "objects:write"
    | "files:read"
    | "files:write"
    | "network:request"
    | "storage:read"
    | "storage:write"
    | "ui:create"
    | "ui:modify"
    | "system:notifications";

// Plugin Interface
export interface Plugin {
    manifest: PluginManifest;
    isLoaded: boolean;
    isEnabled: boolean;
    loadedAt?: number;
    enabledAt?: number;
    state: PluginState;
    error?: string;
    instance?: PluginInstance;
}

export interface PluginState {
    [key: string]: any;
}

export interface PluginInstance {
    initialize: (api: PluginAPI) => Promise<void>;
    activate?: () => Promise<void>;
    deactivate?: () => Promise<void>;
    destroy?: () => Promise<void>;
    executeAction?: (actionId: string, params?: any) => Promise<any>;
    getState?: () => PluginState;
    setState?: (state: Partial<PluginState>) => void;
}

// Plugin API for safe editor interaction
export interface PluginAPI {
    // Canvas API
    canvas: {
        getObjects: () => readonly CanvasObject[];
        getSelectedObjects: () => readonly CanvasObject[];
        addObject: (object: Omit<CanvasObject, "id">) => string;
        updateObject: (id: string, updates: Partial<CanvasObject>) => boolean;
        deleteObject: (id: string) => boolean;
        selectObjects: (objectIds: string[]) => void;
        clearSelection: () => void;
        getViewport: () => ViewportState;
        setViewport: (viewport: Partial<ViewportState>) => void;
        getBounds: (objectIds?: string[]) => Bounds;
    };

    // Layers API
    layers: {
        getLayers: () => readonly Layer[];
        addLayer: (layer: Omit<Layer, "id">) => string;
        updateLayer: (id: string, updates: Partial<Layer>) => boolean;
        deleteLayer: (id: string) => boolean;
        reorderLayers: (layerOrder: string[]) => void;
    };

    // Tools API
    tools: {
        getActiveTool: () => ToolType;
        setActiveTool: (tool: ToolType) => void;
        registerTool?: (tool: CustomTool) => boolean;
        unregisterTool?: (toolId: string) => boolean;
    };

    // Export/Import API
    io: {
        exportSVG: (options?: ExportOptions) => Promise<Blob>;
        exportPNG: (options?: ExportOptions) => Promise<Blob>;
        exportJSON: () => Promise<Blob>;
        importFromFile: (file: File) => Promise<boolean>;
        showFileDialog: (options: FileDialogOptions) => Promise<File[]>;
    };

    // UI API
    ui: {
        showNotification: (message: string, type?: "info" | "success" | "warning" | "error") => void;
        showDialog: (config: DialogConfig) => Promise<any>;
        createPanel: (config: PanelConfig) => PanelInstance;
        registerMenuItem: (config: MenuItemConfig) => boolean;
        unregisterMenuItem: (id: string) => boolean;
    };

    // Storage API
    storage: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        remove: (key: string) => Promise<void>;
        clear: () => Promise<void>;
    };

    // Events API
    events: {
        on: (event: string, callback: (...args: any[]) => void) => () => void;
        emit: (event: string, ...args: any[]) => void;
        off: (event: string, callback: (...args: any[]) => void) => void;
    };

    // Plugin System API
    plugins: {
        getPlugin: (id: string) => Plugin | undefined;
        getPlugins: () => readonly Plugin[];
        executePluginAction: (pluginId: string, actionId: string, params?: any) => Promise<any>;
    };
}

// Extension Points System
export interface ExtensionPoint {
    id: string;
    name: string;
    description: string;
    type: ExtensionPointType;
    version: string;
    providedBy: string; // Plugin ID that provides this extension point
    config?: ExtensionPointConfig;
    handlers: ExtensionHandler[];
}

export type ExtensionPointType =
    | "tool"
    | "exporter"
    | "importer"
    | "effect"
    | "property-control"
    | "ui-component"
    | "menu-item"
    | "toolbar-button"
    | "panel"
    | "hook";

export interface ExtensionPointConfig {
    [key: string]: any;
}

export interface ExtensionHandler {
    id: string;
    pluginId: string;
    priority: number; // Higher number = higher priority
    enabled: boolean;
    handler: (...args: any[]) => any;
    metadata?: Record<string, any>;
}

// Custom tool definition for plugins
export interface CustomTool {
    id: string;
    name: string;
    icon: string;
    cursor?: string;
    options?: ToolOptions;
    onActivate?: () => void;
    onDeactivate?: () => void;
    onMouseDown?: (event: CanvasMouseEvent) => void;
    onMouseMove?: (event: CanvasMouseEvent) => void;
    onMouseUp?: (event: CanvasMouseEvent) => void;
    onKeyDown?: (event: CanvasKeyEvent) => void;
    onKeyUp?: (event: CanvasKeyEvent) => void;
}

export interface ToolOptions {
    [key: string]: any;
}

// Export options for plugins
export interface ExportOptions {
    width?: number;
    height?: number;
    scale?: number;
    format?: string;
    quality?: number;
    includeMetadata?: boolean;
    optimize?: boolean;
}

// File dialog options
export interface FileDialogOptions {
    accept?: string;
    multiple?: boolean;
    directory?: boolean;
}

// UI component interfaces for plugins
export interface DialogConfig {
    title: string;
    content: string | React.ComponentType;
    buttons?: DialogButton[];
    size?: "small" | "medium" | "large";
    modal?: boolean;
}

export interface DialogButton {
    label: string;
    action: "confirm" | "cancel" | "custom";
    variant?: "primary" | "secondary" | "danger";
    handler?: () => void;
}

export interface PanelConfig {
    id: string;
    title: string;
    content: React.ComponentType;
    position?: "left" | "right" | "bottom";
    size?: number;
    resizable?: boolean;
    collapsible?: boolean;
}

export interface PanelInstance {
    id: string;
    show: () => void;
    hide: () => void;
    toggle: () => void;
    setTitle: (title: string) => void;
    setContent: (content: React.ComponentType) => void;
    destroy: () => void;
}

export interface MenuItemConfig {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    group?: string;
    position?: number;
    separator?: boolean;
    submenu?: MenuItemConfig[];
    action: () => void;
}

// Plugin Manager State
export interface PluginManagerState {
    plugins: Record<string, Plugin>;
    extensionPoints: Record<string, ExtensionPoint>;
    isInitialized: boolean;
    loadingPlugins: string[];
    errors: PluginError[];
    lastUpdate: number;
}

export interface PluginError {
    pluginId: string;
    error: string;
    timestamp: number;
    critical?: boolean;
}

// Plugin Registry for discovery and management
export interface PluginRegistry {
    plugins: PluginRegistryEntry[];
    categories: PluginCategoryInfo[];
    tags: string[];
    lastUpdated: number;
}

export interface PluginRegistryEntry {
    manifest: PluginManifest;
    downloadUrl: string;
    fileSize: number;
    downloadCount: number;
    rating: number;
    reviews: number;
    verified: boolean;
    publishedAt: number;
    updatedAt: number;
}

export interface PluginCategoryInfo {
    id: PluginCategory;
    name: string;
    description: string;
    icon: string;
    count: number;
}

export interface OperationalTransform {
    id: string;
    operation: ChangeOperation;
    context: ChangeOperation[]; // Concurrent operations
    transformed: ChangeOperation;
    priority: number;
    isValid: boolean;
}
