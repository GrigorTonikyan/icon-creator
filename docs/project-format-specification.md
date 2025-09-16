# Icon Creator Project File Format Specification

## Version 1.0.0

This document specifies the JSON format for Icon Creator project files (`.iconproject`).

## Overview

Icon Creator projects are saved as JSON files with a structured format that includes:

- Project metadata (name, version, timestamps)
- Editor state (objects, layers, viewport)
- History snapshot (for recovery)
- Optional custom data

## File Structure

```json
{
  "metadata": { ... },
  "editorState": { ... },
  "historySnapshot": [ ... ],
  "customData": { ... }
}
```

## Schema Definition

### Root Object

```typescript
interface ProjectData {
  metadata: ProjectMetadata;
  editorState: SerializableEditorState;
  historySnapshot?: HistoryEntry[];
  customData?: Record<string, unknown>;
}
```

### Project Metadata

```typescript
interface ProjectMetadata {
  id: string;                    // Unique project identifier
  name: string;                  // Display name
  version: string;               // Format version (semver)
  createdAt: number;            // Unix timestamp
  lastModified: number;         // Unix timestamp
  description?: string;         // Optional description
  tags?: string[];              // Optional tags for organization
  thumbnailData?: string;       // Base64 encoded thumbnail image
  author?: string;              // Creator information
  license?: string;             // License information
}
```

### Editor State

```typescript
interface SerializableEditorState {
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
}
```

### Canvas Objects

#### Base Object Structure

```typescript
interface BaseCanvasObject {
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
```

#### Transform

```typescript
interface Transform {
  x: number;          // X position
  y: number;          // Y position
  rotation: number;   // Rotation in degrees
  scaleX: number;     // X scale factor
  scaleY: number;     // Y scale factor
  originX?: number;   // Transform origin X (0-1, default: 0.5)
  originY?: number;   // Transform origin Y (0-1, default: 0.5)
}
```

#### Object Types

##### Rectangle Object

```typescript
interface RectangleObject extends BaseCanvasObject {
  type: "rectangle";
  width: number;
  height: number;
  borderRadius?: number;
  style: ShapeStyle;
}
```

##### Circle Object

```typescript
interface CircleObject extends BaseCanvasObject {
  type: "circle";
  radius: number;
  style: ShapeStyle;
}
```

##### Text Object

```typescript
interface TextObject extends BaseCanvasObject {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  textAlign: TextAlign;
  style: TextStyle;
}
```

##### Path Object

```typescript
interface PathObject extends BaseCanvasObject {
  type: "path";
  pathData: string;  // SVG path data
  style: ShapeStyle;
}
```

##### Group Object

```typescript
interface GroupObject extends BaseCanvasObject {
  type: "group";
  childIds: string[];
}
```

#### Style Definitions

```typescript
interface ShapeStyle {
  fill?: string;               // Fill color (hex, rgb, rgba)
  stroke?: string;             // Stroke color
  strokeWidth?: number;        // Stroke width in pixels
  strokeDasharray?: number[];  // Dash pattern
  shadowOffsetX?: number;      // Shadow offset X
  shadowOffsetY?: number;      // Shadow offset Y
  shadowBlur?: number;         // Shadow blur radius
  shadowColor?: string;        // Shadow color
}

interface TextStyle extends ShapeStyle {
  letterSpacing?: number;      // Letter spacing
  lineHeight?: number;         // Line height multiplier
  textDecoration?: string;     // Underline, overline, etc.
}
```

### Layer System

```typescript
interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  objects: string[];           // Object IDs in this layer
  children: string[];          // Child layer IDs
  expanded: boolean;           // UI state for layer tree
  opacity: number;             // Layer opacity (0-1)
  blendMode: BlendMode;        // Blend mode
  type: LayerType;
  order: number;               // Layer order
  createdAt: number;
  updatedAt: number;
}

type LayerType = "default" | "group" | "adjustment";
type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light";
```

### Selection State

```typescript
interface Selection {
  objectIds: string[];
  boundingBox?: BoundingBox;
}

interface LayerSelection {
  selectedLayerIds: string[];
  activeLayerId?: string;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Viewport State

```typescript
interface ViewportState {
  zoom: number;          // Zoom level (1.0 = 100%)
  panX: number;          // Pan offset X
  panY: number;          // Pan offset Y
  canvasWidth: number;   // Canvas width
  canvasHeight: number;  // Canvas height
}
```

### History Snapshot

```typescript
interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  action: EditorAction;
  previousState: SerializableEditorState;
  affectedObjectIds?: string[];
  affectedLayerIds?: string[];
}
```

## Version Compatibility

### Current Version (1.0.0)

- Initial format specification
- Supports all basic object types and features

### Future Versions

- **1.x.x**: Backward compatible changes (new optional fields)
- **2.x.x**: Breaking changes requiring migration

### Version Checking

When loading a project:

1. Check `metadata.version` field
2. Compare major version with current application version
3. If major versions differ, show migration prompt or error
4. Minor/patch version differences are handled gracefully

## File Validation

### Required Fields

All projects must include:

- `metadata.id`
- `metadata.name`
- `metadata.version`
- `metadata.createdAt`
- `metadata.lastModified`
- `editorState` with all required properties

### Optional Fields

- `metadata.description`
- `metadata.tags`
- `metadata.thumbnailData`
- `historySnapshot`
- `customData`

### Validation Process

1. **JSON Parse**: Ensure valid JSON syntax
2. **Schema Validation**: Check required fields and types
3. **Version Check**: Verify compatibility
4. **Reference Integrity**: Ensure object/layer references are valid
5. **Value Ranges**: Check numeric values are within valid ranges

## Error Handling

### Common Error Types

1. **Parse Error**: Invalid JSON syntax
2. **Schema Error**: Missing required fields or wrong types
3. **Version Error**: Incompatible format version
4. **Reference Error**: Broken object/layer references
5. **Corruption Error**: Data integrity issues

### Recovery Strategies

1. **Graceful Degradation**: Load partial data when possible
2. **Default Values**: Use defaults for missing optional fields
3. **Reference Cleanup**: Remove broken references automatically
4. **Backup Loading**: Attempt to load from auto-save or backup

## Example Project File

```json
{
  "metadata": {
    "id": "project_1703097600000",
    "name": "My Icon Project",
    "version": "1.0.0",
    "createdAt": 1703097600000,
    "lastModified": 1703097700000,
    "description": "A sample icon project",
    "tags": ["icon", "logo", "design"],
    "author": "John Doe"
  },
  "editorState": {
    "objects": {
      "rect1": {
        "id": "rect1",
        "type": "rectangle",
        "name": "Background",
        "width": 100,
        "height": 100,
        "style": {
          "fill": "#3498db",
          "stroke": "#2c3e50",
          "strokeWidth": 2
        },
        "transform": {
          "x": 50,
          "y": 50,
          "rotation": 0,
          "scaleX": 1,
          "scaleY": 1
        },
        "visible": true,
        "locked": false,
        "opacity": 1,
        "zIndex": 1,
        "layerId": "layer1"
      }
    },
    "layers": {
      "layer1": {
        "id": "layer1",
        "name": "Main Layer",
        "visible": true,
        "locked": false,
        "objects": ["rect1"],
        "children": [],
        "expanded": true,
        "opacity": 1,
        "blendMode": "normal",
        "type": "default",
        "order": 0,
        "createdAt": 1703097600000,
        "updatedAt": 1703097600000
      }
    },
    "layerOrder": ["layer1"],
    "selection": {
      "objectIds": []
    },
    "layerSelection": {
      "selectedLayerIds": []
    },
    "viewport": {
      "zoom": 1,
      "panX": 0,
      "panY": 0,
      "canvasWidth": 800,
      "canvasHeight": 600
    },
    "selectedTool": "select",
    "gridVisible": true,
    "snapToGrid": false,
    "gridSize": 20
  },
  "historySnapshot": []
}
```

## Migration Guide

### From Future Versions

When new format versions are released, migration will be handled automatically:

1. **Detection**: Check version compatibility
2. **Migration**: Apply transformation rules
3. **Validation**: Ensure migrated data is valid
4. **Backup**: Keep original file as backup

### Custom Data

The `customData` field allows for storing additional application-specific data:

```typescript
interface CustomData {
  plugins?: Record<string, unknown>;
  userPreferences?: Record<string, unknown>;
  exportSettings?: Record<string, unknown>;
  [key: string]: unknown;
}
```

## Performance Considerations

### File Size Optimization

1. **Object Compression**: Remove default values
2. **History Limiting**: Store only essential history entries
3. **Thumbnail Optimization**: Use efficient image encoding

### Loading Performance

1. **Lazy Loading**: Load objects on demand for large projects
2. **Progressive Loading**: Show UI while loading in background
3. **Caching**: Cache parsed objects for faster access

## Security Considerations

1. **Input Validation**: Always validate file contents
2. **Size Limits**: Enforce reasonable file size limits
3. **Script Injection**: Sanitize text content
4. **Resource Limits**: Prevent excessive memory usage during parsing

---

*This specification is subject to change. Check the version field in project files and application compatibility before loading.*
