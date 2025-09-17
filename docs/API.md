# API Reference

## Editor Context API

### EditorState Interface

```typescript
interface EditorState {
  // Objects and layers
  objects: Record<string, DrawableObject>;
  layers: Layer[];
  selectedObjects: string[];
  
  // Tools and modes
  activeTool: Tool;
  mode: EditorMode;
  
  // Canvas state
  canvas: CanvasState;
  viewport: ViewportState;
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // UI state
  ui: UIState;
}
```

### DrawableObject Interface

```typescript
interface DrawableObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'path';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  properties: ObjectProperties;
}
```

### Actions

#### Object Management

- **ADD_OBJECT**: Add a new object to the canvas
- **UPDATE_OBJECT**: Update object properties
- **DELETE_OBJECT**: Remove object from canvas
- **DUPLICATE_OBJECT**: Create a copy of an object

#### Selection Management

- **SELECT_OBJECTS**: Set selected objects
- **ADD_TO_SELECTION**: Add objects to current selection
- **REMOVE_FROM_SELECTION**: Remove objects from selection
- **CLEAR_SELECTION**: Clear all selections

#### Tool Management

- **SET_ACTIVE_TOOL**: Change the active tool
- **SET_TOOL_OPTIONS**: Update tool-specific options

#### Canvas Operations

- **UPDATE_CANVAS**: Update canvas properties
- **SET_VIEWPORT**: Change viewport position and zoom
- **RESET_VIEWPORT**: Reset to default view

#### History Management

- **UNDO**: Undo last action
- **REDO**: Redo next action
- **CREATE_CHECKPOINT**: Create history checkpoint

## Theme Context API

### ThemeContextType Interface

```typescript
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  customTheme: CustomTheme | null;
  setCustomTheme: (theme: CustomTheme) => void;
  applyTheme: (theme: Theme) => void;
}
```

### Theme Types

```typescript
type Theme = 'light' | 'dark' | 'auto' | 'custom';

interface CustomTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  spacing: {
    unit: number;
    small: number;
    medium: number;
    large: number;
  };
}
```

## Utility Functions

### Alignment Utilities

```typescript
// Align objects to the left
function alignLeft(objects: DrawableObject[]): DrawableObject[];

// Align objects to the right
function alignRight(objects: DrawableObject[]): DrawableObject[];

// Align objects to the top
function alignTop(objects: DrawableObject[]): DrawableObject[];

// Align objects to the bottom
function alignBottom(objects: DrawableObject[]): DrawableObject[];

// Center objects horizontally
function centerHorizontally(objects: DrawableObject[]): DrawableObject[];

// Center objects vertically
function centerVertically(objects: DrawableObject[]): DrawableObject[];

// Distribute objects horizontally
function distributeHorizontally(objects: DrawableObject[]): DrawableObject[];

// Distribute objects vertically
function distributeVertically(objects: DrawableObject[]): DrawableObject[];
```

### Grid Utilities

```typescript
// Snap point to grid
function snapToGrid(point: Point, gridSize: number): Point;

// Generate grid lines for canvas
function generateGridLines(bounds: Bounds, spacing: number): GridLine[];

// Check if point is on grid
function isOnGrid(point: Point, gridSize: number): boolean;
```

### Export Utilities

```typescript
// Export to SVG format
function exportToSVG(
  objects: DrawableObject[], 
  options: SVGExportOptions
): string;

// Export to PNG format
function exportToPNG(
  objects: DrawableObject[], 
  options: PNGExportOptions
): Promise<Blob>;

// Export to JSON format
function exportToJSON(
  objects: DrawableObject[], 
  options: JSONExportOptions
): string;
```

### Transform Utilities

```typescript
// Calculate object bounds
function getObjectBounds(object: DrawableObject): Bounds;

// Get combined bounds for multiple objects
function getCombinedBounds(objects: DrawableObject[]): Bounds;

// Apply transformation matrix
function applyTransform(
  object: DrawableObject, 
  transform: TransformMatrix
): DrawableObject;

// Rotate object around point
function rotateAroundPoint(
  object: DrawableObject, 
  point: Point, 
  angle: number
): DrawableObject;
```

## Component Props

### Canvas Component

```typescript
interface CanvasProps {
  width: number;
  height: number;
  zoom: number;
  offset: Point;
  gridVisible: boolean;
  gridSize: number;
  onObjectSelect: (objectIds: string[]) => void;
  onObjectUpdate: (objectId: string, updates: Partial<DrawableObject>) => void;
}
```

### PropertyPanel Component

```typescript
interface PropertyPanelProps {
  selectedObjects: DrawableObject[];
  onPropertyChange: (objectId: string, property: string, value: any) => void;
}
```

### LayerPanel Component

```typescript
interface LayerPanelProps {
  layers: Layer[];
  selectedObjects: string[];
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerLockToggle: (layerId: string) => void;
}
```

### Toolbar Component

```typescript
interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  tools: ToolDefinition[];
}
```

## Event Handlers

### Canvas Events

```typescript
interface CanvasEventHandlers {
  onMouseDown: (event: MouseEvent, point: Point) => void;
  onMouseMove: (event: MouseEvent, point: Point) => void;
  onMouseUp: (event: MouseEvent, point: Point) => void;
  onWheel: (event: WheelEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onKeyUp: (event: KeyboardEvent) => void;
}
```

### Object Events

```typescript
interface ObjectEventHandlers {
  onObjectClick: (objectId: string, event: MouseEvent) => void;
  onObjectDoubleClick: (objectId: string, event: MouseEvent) => void;
  onObjectDragStart: (objectId: string, point: Point) => void;
  onObjectDrag: (objectId: string, delta: Point) => void;
  onObjectDragEnd: (objectId: string) => void;
}
```

## Keyboard Shortcuts

### Navigation

- `Arrow Keys`: Move selected objects (1px)
- `Shift + Arrow Keys`: Move selected objects (10px)
- `Ctrl/Cmd + Arrow Keys`: Nudge selected objects (0.1px)

### Selection

- `Ctrl/Cmd + A`: Select all objects
- `Ctrl/Cmd + Shift + A`: Deselect all objects
- `Tab`: Select next object
- `Shift + Tab`: Select previous object

### Tools

- `V`: Select tool
- `R`: Rectangle tool
- `O`: Circle tool
- `T`: Text tool
- `P`: Path tool

### Edit Operations

- `Ctrl/Cmd + C`: Copy selected objects
- `Ctrl/Cmd + X`: Cut selected objects
- `Ctrl/Cmd + V`: Paste objects
- `Ctrl/Cmd + D`: Duplicate selected objects
- `Delete`: Delete selected objects

### View Operations

- `Ctrl/Cmd + 0`: Fit to screen
- `Ctrl/Cmd + 1`: Zoom to 100%
- `Ctrl/Cmd + Plus`: Zoom in
- `Ctrl/Cmd + Minus`: Zoom out
- `Space + Drag`: Pan canvas

### History

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo (Windows)
- `Ctrl/Cmd + Shift + Z`: Redo (Mac)

## Error Handling

### Error Types

```typescript
interface EditorError {
  type: 'validation' | 'runtime' | 'network' | 'permission';
  message: string;
  code?: string;
  details?: any;
}
```

### Error Recovery

```typescript
interface ErrorRecoveryOptions {
  retry: () => void;
  dismiss: () => void;
  reportBug: () => void;
}
```

## Performance Monitoring

### Performance Metrics

```typescript
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  objectCount: number;
  frameRate: number;
}
```

### Performance Events

```typescript
interface PerformanceEvents {
  onSlowRender: (metrics: PerformanceMetrics) => void;
  onMemoryWarning: (usage: number) => void;
  onFrameRateDrop: (fps: number) => void;
}
```
