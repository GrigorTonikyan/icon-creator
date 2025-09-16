import cn from "classnames";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type WheelEvent } from "react";
import { useEditor } from "../../contexts/EditorContext";
import {
    type Bounds,
    type CanvasMouseEvent,
    type CanvasObject,
    type CircleObject,
    type PathObject,
    type PathOperationType,
    type Point,
    type RectangleObject,
    type TextObject,
    type ToolType,
} from "../../types/editor";
import { getVisibleLayers } from "../../utils/layerUtils";
import { nodesToPathData, parsePathData, removeNode, updateNodePosition } from "../../utils/pathUtils";
import { snapPoint, snapRectangle, snapCircle, shouldDisableSnap, type SnapOptions } from "../../utils/gridUtils";
import {
    snapToGuides,
    snapRectangleToGuides,
    snapCircleToGuides,
    type GuideSnapOptions,
    type GuideSnapResult,
} from "../../utils/manualGuides";
import {
    calculateObjectBounds,
    generateSmartGuides,
    snapObjectToObjects,
    type SmartSnapOptions,
    type SmartGuide,
    type ObjectSnapResult,
} from "../../utils/smartGuides";
import { SmartGuides } from "../SmartGuides";
import { ManualGuides } from "../ManualGuides";
import { HorizontalRuler } from "../HorizontalRuler";
import { VerticalRuler } from "../VerticalRuler";
import { MeasurementIndicator } from "../MeasurementIndicator";
import "./canvas.css";

interface CanvasProps {
    className?: string;
}

interface InteractionState {
    isPanning: boolean;
    lastPanPoint: Point | null;
    isCreatingShape: boolean;
    shapeStartPoint: Point | null;
    currentShapeId: string | null;
    isDraggingObject: boolean;
    dragStartPoint: Point | null;
    draggedObjectIds: string[];
    initialObjectPositions: Record<string, Point>;
    isResizing: boolean;
    resizeHandle: string | null;
    resizeObjectId: string | null;
    initialObjectBounds: Bounds | null;
    isRotating: boolean;
    rotationObjectId: string | null;
    rotationStartPoint: Point | null;
    initialRotation: number;
    rotationCenter: Point | null;
    isEditingOrigin: boolean;
    originObjectId: string | null;
    initialOrigin: { x: number; y: number } | null;
    isEditingText: boolean;
    editingTextId: string | null;
    isDrawingPath: boolean;
    currentPathId: string | null;
    pathPoints: Point[];
    // Path editing state
    isEditingPath: boolean;
    editingPathId: string | null;
    selectedNodeIds: string[];
    isDraggingNode: boolean;
    draggedNodeId: string | null;
    draggedNodeInitialPosition: Point | null;
    // Control point editing
    isDraggingControlPoint: boolean;
    draggedControlNodeId: string | null;
    draggedControlType: "control1" | "control2" | null;
}

export const Canvas: React.FC<CanvasProps> = ({ className }) => {
    const {
        state,
        selectObjects,
        clearSelection,
        setViewport,
        addObject,
        updateObject,
        setTool,
        performPathOperation,
        undo,
        redo,
        toggleGrid,
        setGridSize,
        toggleSnapToGrid,
        setActiveGuides,
        updateMousePosition,
    } = useEditor();

    const svgRef = useRef<SVGSVGElement>(null);

    // Destructure state first
    const {
        viewport,
        objects,
        layers,
        layerOrder,
        selectedTool,
        selection,
        gridVisible,
        snapToGrid,
        gridSize,
        smartGuides,
        manualGuides,
        rulers,
        precisionInputs,
    } = state;

    // Create snap options based on current editor state
    const snapOptions: SnapOptions = {
        snapToGrid: snapToGrid && gridVisible,
        gridSize: gridSize,
        threshold: 10, // pixel threshold for snapping
    };

    // Create smart guide options
    const smartSnapOptions: SmartSnapOptions = {
        enabled: smartGuides.enabled && smartGuides.snapToObjects,
        threshold: smartGuides.threshold,
        showGuides: smartGuides.showGuides,
        snapToEdges: smartGuides.snapToEdges,
        snapToCenter: smartGuides.snapToCenter,
    };

    // Create manual guide snap options
    const guideSnapOptions: GuideSnapOptions = {
        enabled: manualGuides.enabled && manualGuides.snapToGuides,
        threshold: manualGuides.snapThreshold,
        snapToHorizontal: true,
        snapToVertical: true,
    };
    const [interaction, setInteraction] = useState<InteractionState>({
        isPanning: false,
        lastPanPoint: null,
        isCreatingShape: false,
        shapeStartPoint: null,
        currentShapeId: null,
        isDraggingObject: false,
        dragStartPoint: null,
        draggedObjectIds: [],
        initialObjectPositions: {},
        isResizing: false,
        resizeHandle: null,
        resizeObjectId: null,
        initialObjectBounds: null,
        isRotating: false,
        rotationObjectId: null,
        rotationStartPoint: null,
        initialRotation: 0,
        rotationCenter: null,
        isEditingOrigin: false,
        originObjectId: null,
        initialOrigin: null,
        isEditingText: false,
        editingTextId: null,
        isDrawingPath: false,
        currentPathId: null,
        pathPoints: [],
        // Path editing state
        isEditingPath: false,
        editingPathId: null,
        selectedNodeIds: [],
        isDraggingNode: false,
        draggedNodeId: null,
        draggedNodeInitialPosition: null,
        // Control point editing
        isDraggingControlPoint: false,
        draggedControlNodeId: null,
        draggedControlType: null,
    });

    const canvasCn = cn("Canvas", className);

    // Helper function to calculate angle between two points
    const calculateAngle = useCallback((center: Point, point: Point): number => {
        return Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
    }, []);

    // Helper function to snap angle to the nearest increment
    const snapAngle = useCallback((angle: number, increment: number = 15): number => {
        return Math.round(angle / increment) * increment;
    }, []);

    // Keyboard shortcuts for tool switching
    useEffect(() => {
        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            // Only handle shortcuts when the canvas area has focus or no specific input is focused
            const activeElement = document.activeElement;
            const isInputFocused =
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    (activeElement as HTMLElement).contentEditable === "true");

            // Handle undo/redo shortcuts regardless of input focus (but not in text editing)
            if ((event.ctrlKey || event.metaKey) && !isInputFocused) {
                switch (event.key.toLowerCase()) {
                    case "z":
                        if (event.shiftKey) {
                            // Ctrl+Shift+Z or Cmd+Shift+Z for redo
                            redo();
                            event.preventDefault();
                            return;
                        } else {
                            // Ctrl+Z or Cmd+Z for undo
                            undo();
                            event.preventDefault();
                            return;
                        }
                    case "y":
                        // Ctrl+Y or Cmd+Y for redo (Windows style)
                        if (!event.shiftKey) {
                            redo();
                            event.preventDefault();
                            return;
                        }
                        break;
                }
            }

            // Skip if an input field is focused or if modifier keys are pressed (except for undo/redo handled above)
            if (isInputFocused || event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            let newTool: ToolType | null = null;

            switch (event.key.toLowerCase()) {
                case "escape":
                    // Exit path editing mode
                    if (interaction.isEditingPath) {
                        setInteraction((prev) => ({
                            ...prev,
                            isEditingPath: false,
                            editingPathId: null,
                            selectedNodeIds: [],
                            isDraggingNode: false,
                            draggedNodeId: null,
                            draggedNodeInitialPosition: null,
                            isDraggingControlPoint: false,
                            draggedControlNodeId: null,
                            draggedControlType: null,
                        }));
                        event.preventDefault();
                        return;
                    }
                    // Finish path drawing
                    if (interaction.isDrawingPath) {
                        setInteraction((prev) => ({
                            ...prev,
                            isDrawingPath: false,
                            currentPathId: null,
                            pathPoints: [],
                        }));
                        event.preventDefault();
                        return;
                    }
                    break;
                case "r":
                    newTool = "rectangle";
                    break;
                case "c":
                    newTool = "circle";
                    break;
                case "t":
                    newTool = "text";
                    break;
                case "p":
                    newTool = "pen";
                    break;
                case "v":
                    newTool = "select";
                    break;
                case "h":
                    newTool = "hand";
                    break;
                case "g":
                    // G key toggles grid, Shift+G toggles snap
                    if (event.shiftKey) {
                        toggleSnapToGrid();
                    } else {
                        toggleGrid();
                    }
                    event.preventDefault();
                    return;
                case "delete":
                case "backspace":
                    // Delete selected path nodes
                    if (
                        interaction.isEditingPath &&
                        interaction.editingPathId &&
                        interaction.selectedNodeIds.length > 0
                    ) {
                        const pathObject = objects[interaction.editingPathId] as PathObject;
                        if (pathObject && pathObject.nodes) {
                            let updatedNodes = [...pathObject.nodes];

                            // Remove selected nodes
                            interaction.selectedNodeIds.forEach((nodeId) => {
                                updatedNodes = removeNode(updatedNodes, nodeId);
                            });

                            // Clear selection
                            setInteraction((prev) => ({
                                ...prev,
                                selectedNodeIds: [],
                            }));

                            const newPathData = nodesToPathData(updatedNodes);
                            updateObject(interaction.editingPathId, {
                                nodes: updatedNodes,
                                pathData: newPathData,
                            });
                        }
                        event.preventDefault();
                        return;
                    }
                    break;
                default:
                    // Handle path operations with Shift key combinations
                    if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
                        const selectedPaths = selection.objectIds
                            .map((id) => objects[id])
                            .filter((obj): obj is PathObject => obj?.type === "path");

                        if (selectedPaths.length >= 2) {
                            let operation: PathOperationType | null = null;

                            switch (event.key.toLowerCase()) {
                                case "u": // Shift+U for Unite
                                    operation = "unite";
                                    break;
                                case "s": // Shift+S for Subtract
                                    operation = "subtract";
                                    break;
                                case "i": // Shift+I for Intersect
                                    operation = "intersect";
                                    break;
                                case "e": // Shift+E for Exclude
                                    operation = "exclude";
                                    break;
                            }

                            if (operation) {
                                performPathOperation(operation, selection.objectIds);
                                event.preventDefault();
                                return;
                            }
                        }
                    }

                    return; // Exit early if no tool mapping
            }

            if (newTool && newTool !== selectedTool) {
                event.preventDefault();
                setTool(newTool);
            }
        };

        // Add global keyboard listener
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedTool, setTool, interaction.isDrawingPath, setInteraction, toggleGrid, toggleSnapToGrid, undo, redo]);

    // Calculate resize bounds based on handle position and mouse movement
    const calculateResizeBounds = useCallback(
        (
            initialBounds: Bounds,
            handle: string,
            currentPoint: Point,
            startPoint: Point,
            options?: {
                proportional?: boolean; // Maintain aspect ratio (Shift key)
                fromCenter?: boolean; // Scale from center (Alt key)
            }
        ): Bounds => {
            const deltaX = currentPoint.x - startPoint.x;
            const deltaY = currentPoint.y - startPoint.y;
            const aspectRatio = initialBounds.width / initialBounds.height;

            let newBounds = { ...initialBounds };

            // Calculate basic resize based on handle
            switch (handle) {
                case "nw": // Northwest corner
                    newBounds.x = Math.min(currentPoint.x, initialBounds.x + initialBounds.width);
                    newBounds.y = Math.min(currentPoint.y, initialBounds.y + initialBounds.height);
                    newBounds.width = Math.abs(initialBounds.x + initialBounds.width - currentPoint.x);
                    newBounds.height = Math.abs(initialBounds.y + initialBounds.height - currentPoint.y);
                    break;
                case "ne": // Northeast corner
                    newBounds.x = initialBounds.x;
                    newBounds.y = Math.min(currentPoint.y, initialBounds.y + initialBounds.height);
                    newBounds.width = Math.max(0, currentPoint.x - initialBounds.x);
                    newBounds.height = Math.abs(initialBounds.y + initialBounds.height - currentPoint.y);
                    break;
                case "se": // Southeast corner
                    newBounds.x = initialBounds.x;
                    newBounds.y = initialBounds.y;
                    newBounds.width = Math.max(0, currentPoint.x - initialBounds.x);
                    newBounds.height = Math.max(0, currentPoint.y - initialBounds.y);
                    break;
                case "sw": // Southwest corner
                    newBounds.x = Math.min(currentPoint.x, initialBounds.x + initialBounds.width);
                    newBounds.y = initialBounds.y;
                    newBounds.width = Math.abs(initialBounds.x + initialBounds.width - currentPoint.x);
                    newBounds.height = Math.max(0, currentPoint.y - initialBounds.y);
                    break;
                case "n": // North edge
                    newBounds.x = initialBounds.x;
                    newBounds.y = Math.min(currentPoint.y, initialBounds.y + initialBounds.height);
                    newBounds.width = initialBounds.width;
                    newBounds.height = Math.abs(initialBounds.y + initialBounds.height - currentPoint.y);
                    break;
                case "e": // East edge
                    newBounds.x = initialBounds.x;
                    newBounds.y = initialBounds.y;
                    newBounds.width = Math.max(0, currentPoint.x - initialBounds.x);
                    newBounds.height = initialBounds.height;
                    break;
                case "s": // South edge
                    newBounds.x = initialBounds.x;
                    newBounds.y = initialBounds.y;
                    newBounds.width = initialBounds.width;
                    newBounds.height = Math.max(0, currentPoint.y - initialBounds.y);
                    break;
                case "w": // West edge
                    newBounds.x = Math.min(currentPoint.x, initialBounds.x + initialBounds.width);
                    newBounds.y = initialBounds.y;
                    newBounds.width = Math.abs(initialBounds.x + initialBounds.width - currentPoint.x);
                    newBounds.height = initialBounds.height;
                    break;
            }

            // Apply proportional scaling (Shift key) - maintain aspect ratio
            if (options?.proportional) {
                // For corner handles, maintain aspect ratio by constraining to the most limiting dimension
                if (["nw", "ne", "se", "sw"].includes(handle)) {
                    const widthRatio = newBounds.width / initialBounds.width;
                    const heightRatio = newBounds.height / initialBounds.height;

                    // Use the smaller ratio to ensure we don't exceed the mouse position
                    const ratio = Math.min(Math.abs(widthRatio), Math.abs(heightRatio));

                    newBounds.width = initialBounds.width * ratio;
                    newBounds.height = initialBounds.height * ratio;

                    // Adjust position based on handle to maintain the correct anchor point
                    switch (handle) {
                        case "nw":
                            newBounds.x = initialBounds.x + initialBounds.width - newBounds.width;
                            newBounds.y = initialBounds.y + initialBounds.height - newBounds.height;
                            break;
                        case "ne":
                            newBounds.x = initialBounds.x;
                            newBounds.y = initialBounds.y + initialBounds.height - newBounds.height;
                            break;
                        case "se":
                            newBounds.x = initialBounds.x;
                            newBounds.y = initialBounds.y;
                            break;
                        case "sw":
                            newBounds.x = initialBounds.x + initialBounds.width - newBounds.width;
                            newBounds.y = initialBounds.y;
                            break;
                    }
                } else {
                    // For edge handles, apply proportional scaling based on the changed dimension
                    if (handle === "n" || handle === "s") {
                        const heightRatio = newBounds.height / initialBounds.height;
                        newBounds.width = initialBounds.width * heightRatio;
                        newBounds.x = initialBounds.x + (initialBounds.width - newBounds.width) / 2;
                    } else if (handle === "e" || handle === "w") {
                        const widthRatio = newBounds.width / initialBounds.width;
                        newBounds.height = initialBounds.height * widthRatio;
                        newBounds.y = initialBounds.y + (initialBounds.height - newBounds.height) / 2;
                    }
                }
            }

            // Apply center-point scaling (Alt key) - scale from center instead of opposite edge
            if (options?.fromCenter) {
                const centerX = initialBounds.x + initialBounds.width / 2;
                const centerY = initialBounds.y + initialBounds.height / 2;

                // Calculate scale factors from center
                const scaleX = newBounds.width / initialBounds.width;
                const scaleY = newBounds.height / initialBounds.height;

                // For center scaling, we need to double the change since we're scaling in both directions
                let finalScaleX = 1 + (scaleX - 1) * 2;
                let finalScaleY = 1 + (scaleY - 1) * 2;

                // Ensure minimum size
                finalScaleX = Math.max(0.1, finalScaleX);
                finalScaleY = Math.max(0.1, finalScaleY);

                newBounds.width = initialBounds.width * finalScaleX;
                newBounds.height = initialBounds.height * finalScaleY;
                newBounds.x = centerX - newBounds.width / 2;
                newBounds.y = centerY - newBounds.height / 2;
            }

            return newBounds;
        },
        []
    );

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback(
        (screenX: number, screenY: number): Point => {
            if (!svgRef.current) return { x: 0, y: 0 };

            const rect = svgRef.current.getBoundingClientRect();
            const x = (screenX - rect.left - viewport.panX) / viewport.zoom;
            const y = (screenY - rect.top - viewport.panY) / viewport.zoom;

            return { x, y };
        },
        [viewport.zoom, viewport.panX, viewport.panY]
    );

    // Grid rendering
    const renderGrid = () => {
        // Don't render grid if not visible
        if (!gridVisible) return null;

        const viewportLeft = -viewport.panX / viewport.zoom;
        const viewportTop = -viewport.panY / viewport.zoom;
        const viewportWidth = viewport.canvasWidth / viewport.zoom;
        const viewportHeight = viewport.canvasHeight / viewport.zoom;

        const startX = Math.floor(viewportLeft / gridSize) * gridSize;
        const startY = Math.floor(viewportTop / gridSize) * gridSize;
        const endX = viewportLeft + viewportWidth;
        const endY = viewportTop + viewportHeight;

        const lines = [];

        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            lines.push(
                <line
                    key={`v-${x}`}
                    x1={x}
                    y1={viewportTop}
                    x2={x}
                    y2={viewportTop + viewportHeight}
                    className="grid-line"
                />
            );
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            lines.push(
                <line
                    key={`h-${y}`}
                    x1={viewportLeft}
                    y1={y}
                    x2={viewportLeft + viewportWidth}
                    y2={y}
                    className="grid-line"
                />
            );
        }

        return <g className="canvas-grid">{lines}</g>;
    };

    // Object rendering with layer hierarchy support
    const renderObjects = () => {
        const visibleLayerIds = getVisibleLayers(layers, layerOrder);

        return visibleLayerIds.map((layerId) => {
            const layer = layers[layerId];
            if (!layer) return null;

            return (
                <g key={layerId} className="canvas-layer" data-layer-id={layerId}>
                    {layer.objects.map((objectId) => {
                        const object = objects[objectId];
                        if (!object || !object.visible) return null;

                        switch (object.type) {
                            case "rectangle": {
                                const rect = object as RectangleObject;
                                // Calculate origin point based on object's transform origin or default to center
                                const originX = rect.transform.originX !== undefined ? rect.transform.originX : 0.5;
                                const originY = rect.transform.originY !== undefined ? rect.transform.originY : 0.5;
                                const centerX = rect.transform.x + rect.width * originX;
                                const centerY = rect.transform.y + rect.height * originY;
                                const rotation = rect.transform.rotation || 0;
                                const transform = `rotate(${rotation} ${centerX} ${centerY})`;

                                return (
                                    <rect
                                        key={objectId}
                                        data-object-id={objectId}
                                        x={rect.transform.x}
                                        y={rect.transform.y}
                                        width={rect.width}
                                        height={rect.height}
                                        rx={rect.borderRadius || 0}
                                        ry={rect.borderRadius || 0}
                                        fill={rect.style?.fill || "#007ACC"}
                                        stroke={rect.style?.stroke || "#ffffff"}
                                        strokeWidth={rect.style?.strokeWidth || 1}
                                        strokeDasharray={rect.style?.strokeDasharray?.join(" ") || "none"}
                                        opacity={rect.opacity}
                                        transform={transform}
                                        className={cn("canvas-object", {
                                            "canvas-object--selected": selection.objectIds.includes(objectId),
                                            "canvas-object--creating": interaction.currentShapeId === objectId,
                                        })}
                                        style={{
                                            cursor: selectedTool === "select" ? "move" : "default",
                                        }}
                                    />
                                );
                            }
                            case "circle": {
                                const circle = object as CircleObject;
                                // For circles, use transform origin or default to center (which is the circle's position)
                                const originX = circle.transform.originX !== undefined ? circle.transform.originX : 0.5;
                                const originY = circle.transform.originY !== undefined ? circle.transform.originY : 0.5;
                                // For circles, calculate the center based on origin
                                // If originX/Y = 0.5, this will be the circle's position (default behavior)
                                const offsetX = circle.radius * (0.5 - originX) * 2;
                                const offsetY = circle.radius * (0.5 - originY) * 2;
                                const centerX = circle.transform.x + offsetX;
                                const centerY = circle.transform.y + offsetY;
                                const rotation = circle.transform.rotation || 0;
                                const transform = `rotate(${rotation} ${centerX} ${centerY})`;

                                return (
                                    <circle
                                        key={objectId}
                                        data-object-id={objectId}
                                        cx={circle.transform.x}
                                        cy={circle.transform.y}
                                        r={circle.radius}
                                        fill={circle.style?.fill || "#007ACC"}
                                        stroke={circle.style?.stroke || "#ffffff"}
                                        strokeWidth={circle.style?.strokeWidth || 1}
                                        strokeDasharray={circle.style?.strokeDasharray?.join(" ") || "none"}
                                        opacity={circle.opacity}
                                        transform={transform}
                                        className={cn("canvas-object", {
                                            "canvas-object--selected": selection.objectIds.includes(objectId),
                                            "canvas-object--creating": interaction.currentShapeId === objectId,
                                        })}
                                        style={{
                                            cursor: selectedTool === "select" ? "move" : "default",
                                        }}
                                    />
                                );
                            }
                            case "text": {
                                const text = object as TextObject;
                                const rotation = text.transform.rotation || 0;
                                const transform = `rotate(${rotation} ${text.transform.x} ${text.transform.y})`;

                                return (
                                    <text
                                        key={objectId}
                                        data-object-id={objectId}
                                        x={text.transform.x}
                                        y={text.transform.y}
                                        fill={text.style?.color || "#000000"}
                                        fontSize={text.style?.fontSize || 16}
                                        fontFamily={text.style?.fontFamily || "Arial"}
                                        fontWeight={text.style?.fontWeight || "normal"}
                                        textAnchor={
                                            text.style?.textAlign === "center"
                                                ? "middle"
                                                : text.style?.textAlign === "right"
                                                ? "end"
                                                : "start"
                                        }
                                        dominantBaseline="hanging"
                                        opacity={text.opacity}
                                        transform={transform}
                                        className={cn("canvas-object canvas-object--text", {
                                            "canvas-object--selected": selection.objectIds.includes(objectId),
                                            "canvas-object--creating": interaction.currentShapeId === objectId,
                                        })}
                                        style={{
                                            cursor:
                                                selectedTool === "select"
                                                    ? "move"
                                                    : selectedTool === "text"
                                                    ? "text"
                                                    : "default",
                                        }}>
                                        {text.content}
                                    </text>
                                );
                            }
                            case "path": {
                                const path = object as PathObject;
                                const rotation = path.transform.rotation || 0;
                                const transform = `rotate(${rotation} 0 0)`;

                                return (
                                    <path
                                        key={objectId}
                                        data-object-id={objectId}
                                        d={path.pathData}
                                        fill={path.style?.fill || "none"}
                                        stroke={path.style?.stroke || "#007ACC"}
                                        strokeWidth={path.style?.strokeWidth || 2}
                                        strokeDasharray={path.style?.strokeDasharray?.join(" ") || "none"}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        opacity={path.opacity}
                                        transform={transform}
                                        className={cn("canvas-object canvas-object--path", {
                                            "canvas-object--selected": selection.objectIds.includes(objectId),
                                            "canvas-object--creating": interaction.currentPathId === objectId,
                                        })}
                                        style={{
                                            cursor: selectedTool === "select" ? "move" : "default",
                                        }}
                                    />
                                );
                            }
                            default:
                                return null;
                        }
                    })}
                </g>
            );
        });
    };

    // Selection rendering
    const renderSelection = () => {
        if (selection.objectIds.length === 0) return null;

        return selection.objectIds.map((objectId) => {
            const object = objects[objectId];
            if (!object) return null;

            // Calculate bounding box based on object type
            let bounds = { x: 0, y: 0, width: 0, height: 0 };

            switch (object.type) {
                case "rectangle": {
                    const rect = object as RectangleObject;
                    bounds = {
                        x: rect.transform.x,
                        y: rect.transform.y,
                        width: rect.width,
                        height: rect.height,
                    };
                    break;
                }
                case "circle": {
                    const circle = object as CircleObject;
                    bounds = {
                        x: circle.transform.x - circle.radius,
                        y: circle.transform.y - circle.radius,
                        width: circle.radius * 2,
                        height: circle.radius * 2,
                    };
                    break;
                }
                case "text": {
                    const text = object as TextObject;
                    // Approximate text bounds - in a real implementation, we'd measure the text
                    const fontSize = text.style?.fontSize || 16;
                    const textLength = text.content.length;
                    const estimatedWidth = textLength * fontSize * 0.6; // Rough estimation
                    const estimatedHeight = fontSize * (text.style?.lineHeight || 1.2);

                    bounds = {
                        x: text.transform.x,
                        y: text.transform.y,
                        width: Math.max(estimatedWidth, 20), // Minimum width for selection
                        height: estimatedHeight,
                    };
                    break;
                }
                case "path": {
                    const path = object as PathObject;
                    // Calculate path bounding box from path data
                    // For simplicity, use a basic approach to get approximate bounds
                    // In a real implementation, you'd parse the path data more thoroughly

                    // Extract coordinates from path data (basic approach)
                    const matches = path.pathData.match(/[\d.-]+/g);
                    if (matches && matches.length >= 2) {
                        const coords = matches.map(Number);
                        const xCoords = coords.filter((_, i) => i % 2 === 0);
                        const yCoords = coords.filter((_, i) => i % 2 === 1);

                        const minX = Math.min(...xCoords);
                        const maxX = Math.max(...xCoords);
                        const minY = Math.min(...yCoords);
                        const maxY = Math.max(...yCoords);

                        bounds = {
                            x: minX,
                            y: minY,
                            width: Math.max(maxX - minX, 10), // Minimum width for selection
                            height: Math.max(maxY - minY, 10), // Minimum height for selection
                        };
                    } else {
                        // Fallback bounds
                        bounds = { x: 0, y: 0, width: 20, height: 20 };
                    }
                    break;
                }
            }

            const handleSize = 8;
            const halfHandle = handleSize / 2;

            // Get transform origin or use default (0.5, 0.5 = center)
            const originX = object.transform.originX !== undefined ? object.transform.originX : 0.5;
            const originY = object.transform.originY !== undefined ? object.transform.originY : 0.5;

            // Calculate absolute position of origin point
            const originPointX = bounds.x + bounds.width * originX;
            const originPointY = bounds.y + bounds.height * originY;

            return (
                <g key={`selection-${objectId}`} className="selection-group">
                    {/* Selection box */}
                    <rect
                        x={bounds.x - 2}
                        y={bounds.y - 2}
                        width={bounds.width + 4}
                        height={bounds.height + 4}
                        className="selection-box"
                    />

                    {/* Transform origin indicator */}
                    <g
                        className={cn("transform-origin", {
                            "transform-origin--active":
                                interaction.isEditingOrigin && interaction.originObjectId === objectId,
                        })}>
                        {/* Crosshair lines */}
                        <line
                            x1={originPointX - 10}
                            y1={originPointY}
                            x2={originPointX + 10}
                            y2={originPointY}
                            stroke="#ff5722"
                            strokeWidth={1}
                        />
                        <line
                            x1={originPointX}
                            y1={originPointY - 10}
                            x2={originPointX}
                            y2={originPointY + 10}
                            stroke="#ff5722"
                            strokeWidth={1}
                        />
                        {/* Origin handle */}
                        <circle
                            cx={originPointX}
                            cy={originPointY}
                            r={5}
                            className="origin-handle"
                            data-position="origin"
                            fill="#ff5722"
                            fillOpacity={0.6}
                            stroke="#ff5722"
                            strokeWidth={1.5}
                            style={{ cursor: "move" }}
                        />
                    </g>

                    {/* Corner handles */}
                    <rect
                        x={bounds.x - halfHandle - 2}
                        y={bounds.y - halfHandle - 2}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "nw",
                        })}
                        data-position="nw"
                        style={{ cursor: "nw-resize" }}
                    />
                    <rect
                        x={bounds.x + bounds.width - halfHandle + 2}
                        y={bounds.y - halfHandle - 2}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "ne",
                        })}
                        data-position="ne"
                        style={{ cursor: "ne-resize" }}
                    />
                    <rect
                        x={bounds.x + bounds.width - halfHandle + 2}
                        y={bounds.y + bounds.height - halfHandle + 2}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "se",
                        })}
                        data-position="se"
                        style={{ cursor: "se-resize" }}
                    />
                    <rect
                        x={bounds.x - halfHandle - 2}
                        y={bounds.y + bounds.height - halfHandle + 2}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "sw",
                        })}
                        data-position="sw"
                        style={{ cursor: "sw-resize" }}
                    />

                    {/* Edge handles */}
                    <rect
                        x={bounds.x + bounds.width / 2 - halfHandle}
                        y={bounds.y - halfHandle - 2}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "n",
                        })}
                        data-position="n"
                        style={{ cursor: "n-resize" }}
                    />

                    {/* Rotation handle */}
                    <circle
                        cx={bounds.x + bounds.width / 2}
                        cy={bounds.y - 20}
                        r={5}
                        className={cn("rotation-handle", {
                            "selection-handle--active": interaction.isRotating,
                        })}
                        data-position="rotate"
                        style={{ cursor: "crosshair" }}
                    />
                    <line
                        x1={bounds.x + bounds.width / 2}
                        y1={bounds.y - 2}
                        x2={bounds.x + bounds.width / 2}
                        y2={bounds.y - 15}
                        stroke="#007bff"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        pointerEvents="none"
                    />
                    <rect
                        x={bounds.x + bounds.width - halfHandle + 2}
                        y={bounds.y + bounds.height / 2 - halfHandle}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "e",
                        })}
                        data-position="e"
                        style={{ cursor: "e-resize" }}
                    />
                    <rect
                        x={bounds.x + bounds.width / 2 - halfHandle}
                        y={bounds.y + bounds.height - halfHandle + 2}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "s",
                        })}
                        data-position="s"
                        style={{ cursor: "s-resize" }}
                    />
                    <rect
                        x={bounds.x - halfHandle - 2}
                        y={bounds.y + bounds.height / 2 - halfHandle}
                        width={handleSize}
                        height={handleSize}
                        className={cn("selection-handle", {
                            "selection-handle--active": interaction.isResizing && interaction.resizeHandle === "w",
                        })}
                        data-position="w"
                        style={{ cursor: "w-resize" }}
                    />
                </g>
            );
        });
    };

    // Text editor rendering
    const renderTextEditor = () => {
        if (!interaction.editingTextId || !svgRef.current) return null;

        const textObject = objects[interaction.editingTextId] as TextObject;
        if (!textObject) return null;

        // Calculate screen position of the text
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = textObject.transform.x * viewport.zoom + viewport.panX + svgRect.left;
        const y = textObject.transform.y * viewport.zoom + viewport.panY + svgRect.top;

        const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newContent = event.target.value;
            updateObject(interaction.editingTextId!, {
                content: newContent,
            });
        };

        const handleTextKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === "Escape") {
                // Exit text editing mode
                setInteraction((prev) => ({
                    ...prev,
                    isEditingText: false,
                    editingTextId: null,
                }));
            } else if (event.key === "Enter" && !event.shiftKey) {
                // Exit on Enter (unless Shift is held for newlines)
                event.preventDefault();
                setInteraction((prev) => ({
                    ...prev,
                    isEditingText: false,
                    editingTextId: null,
                }));
            }
        };

        const handleTextBlur = () => {
            // Exit text editing mode when focus is lost
            setInteraction((prev) => ({
                ...prev,
                isEditingText: false,
                editingTextId: null,
            }));
        };

        return (
            <textarea
                className="canvas-text-editor"
                value={textObject.content}
                onChange={handleTextChange}
                onKeyDown={handleTextKeyDown}
                onBlur={handleTextBlur}
                autoFocus
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    fontSize: (textObject.style?.fontSize || 16) * viewport.zoom,
                    fontFamily: textObject.style?.fontFamily || "Arial",
                    fontWeight: textObject.style?.fontWeight || "normal",
                    color: textObject.style?.color || "#000000",
                    background: "transparent",
                    border: "1px solid #007ACC",
                    outline: "none",
                    resize: "none",
                    minWidth: "50px",
                    minHeight: "20px",
                    transform: textObject.transform.rotation
                        ? `rotate(${textObject.transform.rotation}deg)`
                        : undefined,
                    pointerEvents: "all",
                    zIndex: 1000,
                }}
                rows={1}
            />
        );
    };

    // Path node rendering for editing
    const renderPathNodes = () => {
        if (!interaction.isEditingPath || !interaction.editingPathId) return null;

        const pathObject = objects[interaction.editingPathId] as PathObject;
        if (!pathObject || !pathObject.nodes) return null;

        return (
            <g className="path-nodes">
                {pathObject.nodes.map((node, index) => (
                    <g key={node.id}>
                        {/* Node handle */}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={4}
                            className={cn("path-node", {
                                "path-node--selected": interaction.selectedNodeIds.includes(node.id),
                                "path-node--dragging":
                                    interaction.isDraggingNode && interaction.draggedNodeId === node.id,
                            })}
                            data-node-id={node.id}
                            fill={node.type === "move" ? "#ff5722" : "#007bff"}
                            stroke="#ffffff"
                            strokeWidth={2}
                            style={{ cursor: "move" }}
                        />

                        {/* Control point handles for curves */}
                        {node.type === "curve" && node.controlPoint1 && (
                            <>
                                {/* Control line */}
                                <line
                                    x1={node.x}
                                    y1={node.y}
                                    x2={node.controlPoint1.x}
                                    y2={node.controlPoint1.y}
                                    stroke="#666"
                                    strokeWidth={1}
                                    strokeDasharray="2 2"
                                    pointerEvents="none"
                                />
                                {/* Control point handle */}
                                <circle
                                    cx={node.controlPoint1.x}
                                    cy={node.controlPoint1.y}
                                    r={3}
                                    className="path-control-point"
                                    data-node-id={node.id}
                                    data-control="control1"
                                    fill="#666"
                                    stroke="#ffffff"
                                    strokeWidth={1}
                                    style={{ cursor: "move" }}
                                />
                            </>
                        )}

                        {/* Second control point for cubic curves */}
                        {node.type === "curve" && node.controlPoint2 && (
                            <>
                                {/* Control line */}
                                <line
                                    x1={node.x}
                                    y1={node.y}
                                    x2={node.controlPoint2.x}
                                    y2={node.controlPoint2.y}
                                    stroke="#666"
                                    strokeWidth={1}
                                    strokeDasharray="2 2"
                                    pointerEvents="none"
                                />
                                {/* Control point handle */}
                                <circle
                                    cx={node.controlPoint2.x}
                                    cy={node.controlPoint2.y}
                                    r={3}
                                    className="path-control-point"
                                    data-node-id={node.id}
                                    data-control="control2"
                                    fill="#666"
                                    stroke="#ffffff"
                                    strokeWidth={1}
                                    style={{ cursor: "move" }}
                                />
                            </>
                        )}
                    </g>
                ))}
            </g>
        );
    };

    // Mouse event handlers
    const handleMouseDown = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            const point = { x: event.clientX, y: event.clientY };
            const canvasPoint = screenToCanvas(event.clientX, event.clientY);

            const canvasEvent: CanvasMouseEvent = {
                point,
                canvasPoint,
                originalEvent: event.nativeEvent,
            };

            // Handle panning with middle mouse or space+drag
            if (selectedTool === "hand" || event.button === 1 || (event.ctrlKey && event.button === 0)) {
                event.preventDefault();
                setInteraction((prev) => ({
                    ...prev,
                    isPanning: true,
                    lastPanPoint: point,
                }));
                return;
            }

            // Handle object selection
            const target = event.target as SVGElement;
            const objectId = target.getAttribute("data-object-id");
            const handlePosition = target.getAttribute("data-position");
            const nodeId = target.getAttribute("data-node-id");
            const controlType = target.getAttribute("data-control") as "control1" | "control2" | null;

            // Handle control point dragging
            if (interaction.isEditingPath && nodeId && controlType) {
                event.preventDefault();
                event.stopPropagation();

                setInteraction((prev) => ({
                    ...prev,
                    isDraggingControlPoint: true,
                    draggedControlNodeId: nodeId,
                    draggedControlType: controlType,
                }));
                return;
            }

            // Handle path node interaction
            if (interaction.isEditingPath && nodeId && !controlType) {
                event.preventDefault();
                event.stopPropagation();

                // Select the node
                setInteraction((prev) => ({
                    ...prev,
                    selectedNodeIds: [nodeId],
                    isDraggingNode: true,
                    draggedNodeId: nodeId,
                    draggedNodeInitialPosition: canvasPoint,
                }));
                return;
            }

            // Check if origin handle was clicked
            if (handlePosition === "origin" && selectedTool === "select") {
                const selectedObjectId = selection.objectIds[0]; // For now, only handle single selection origin editing
                if (selectedObjectId) {
                    const object = objects[selectedObjectId];
                    if (object) {
                        // Get current origin or default to center (0.5, 0.5)
                        const currentOriginX = object.transform.originX !== undefined ? object.transform.originX : 0.5;
                        const currentOriginY = object.transform.originY !== undefined ? object.transform.originY : 0.5;

                        setInteraction((prev) => ({
                            ...prev,
                            isEditingOrigin: true,
                            originObjectId: selectedObjectId,
                            dragStartPoint: canvasPoint,
                            initialOrigin: { x: currentOriginX, y: currentOriginY },
                        }));
                    }
                }
                return;
            }

            // Check if rotation handle was clicked
            if (handlePosition === "rotate" && selectedTool === "select") {
                const selectedObjectId = selection.objectIds[0]; // For now, only handle single selection rotate
                if (selectedObjectId) {
                    const object = objects[selectedObjectId];
                    if (object) {
                        // Calculate rotation center based on transform origin
                        let center: Point = { x: 0, y: 0 };

                        // Get origin values or default to center (0.5, 0.5)
                        const originX = object.transform.originX !== undefined ? object.transform.originX : 0.5;
                        const originY = object.transform.originY !== undefined ? object.transform.originY : 0.5;

                        switch (object.type) {
                            case "rectangle": {
                                const rect = object as RectangleObject;
                                center = {
                                    x: rect.transform.x + rect.width / 2,
                                    y: rect.transform.y + rect.height / 2,
                                };
                                break;
                            }
                            case "circle": {
                                const circle = object as CircleObject;
                                center = {
                                    x: circle.transform.x,
                                    y: circle.transform.y,
                                };
                                break;
                            }
                        }

                        setInteraction((prev) => ({
                            ...prev,
                            isRotating: true,
                            rotationObjectId: selectedObjectId,
                            rotationStartPoint: canvasPoint,
                            initialRotation: object.transform.rotation,
                            rotationCenter: center,
                        }));
                    }
                }
                return;
            }

            // Check if a resize handle was clicked
            if (handlePosition && target.classList.contains("selection-handle") && selectedTool === "select") {
                const selectedObjectId = selection.objectIds[0]; // For now, only handle single selection resize
                if (selectedObjectId) {
                    const object = objects[selectedObjectId];
                    if (object) {
                        // Calculate initial bounds for resize operation
                        let bounds = { x: 0, y: 0, width: 0, height: 0 };

                        switch (object.type) {
                            case "rectangle": {
                                const rect = object as RectangleObject;
                                bounds = {
                                    x: rect.transform.x,
                                    y: rect.transform.y,
                                    width: rect.width,
                                    height: rect.height,
                                };
                                break;
                            }
                            case "circle": {
                                const circle = object as CircleObject;
                                bounds = {
                                    x: circle.transform.x - circle.radius,
                                    y: circle.transform.y - circle.radius,
                                    width: circle.radius * 2,
                                    height: circle.radius * 2,
                                };
                                break;
                            }
                            case "text": {
                                const text = object as TextObject;
                                // Use the same estimation as in selection bounds
                                const fontSize = text.style?.fontSize || 16;
                                const textLength = text.content.length;
                                const estimatedWidth = textLength * fontSize * 0.6;
                                const estimatedHeight = fontSize * (text.style?.lineHeight || 1.2);

                                bounds = {
                                    x: text.transform.x,
                                    y: text.transform.y,
                                    width: Math.max(estimatedWidth, 20),
                                    height: estimatedHeight,
                                };
                                break;
                            }
                        }

                        setInteraction((prev) => ({
                            ...prev,
                            isResizing: true,
                            resizeHandle: handlePosition,
                            resizeObjectId: selectedObjectId,
                            initialObjectBounds: bounds,
                            shapeStartPoint: canvasPoint, // Store the initial mouse position for resize
                        }));
                    }
                }
                return;
            }

            if (objectId && selectedTool === "select") {
                // Object clicked - check if it's already selected
                if (selection.objectIds.includes(objectId)) {
                    // Already selected - start dragging
                    const initialPositions: Record<string, Point> = {};
                    selection.objectIds.forEach((id) => {
                        const obj = objects[id];
                        if (obj) {
                            initialPositions[id] = { x: obj.transform.x, y: obj.transform.y };
                        }
                    });

                    setInteraction((prev) => ({
                        ...prev,
                        isDraggingObject: true,
                        dragStartPoint: canvasPoint,
                        draggedObjectIds: selection.objectIds,
                        initialObjectPositions: initialPositions,
                    }));
                } else {
                    // Not selected - select it and prepare for potential drag
                    selectObjects([objectId]);
                    const obj = objects[objectId];
                    if (obj) {
                        setInteraction((prev) => ({
                            ...prev,
                            isDraggingObject: true,
                            dragStartPoint: canvasPoint,
                            draggedObjectIds: [objectId],
                            initialObjectPositions: { [objectId]: { x: obj.transform.x, y: obj.transform.y } },
                        }));
                    }
                }
            } else if (selectedTool === "rectangle") {
                // Start creating rectangle
                const rectId = `rect-${Date.now()}`;

                // Apply snapping to start point (unless Ctrl/Cmd is held)
                const shouldSnap = !shouldDisableSnap(event.nativeEvent);
                const startPoint = shouldSnap
                    ? snapPoint(canvasPoint.x, canvasPoint.y, snapOptions)
                    : { x: canvasPoint.x, y: canvasPoint.y, snapped: false };

                setInteraction((prev) => ({
                    ...prev,
                    isCreatingShape: true,
                    shapeStartPoint: startPoint,
                    currentShapeId: rectId,
                }));

                // Create initial rectangle object with zero size
                const newRect: RectangleObject = {
                    id: rectId,
                    type: "rectangle",
                    name: "Rectangle",
                    layerId: "default",
                    transform: {
                        x: startPoint.x,
                        y: startPoint.y,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                    },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 0,
                    width: 0,
                    height: 0,
                    style: {
                        fill: "#007ACC",
                        stroke: "#ffffff",
                        strokeWidth: 1,
                    },
                };
                addObject(newRect);
            } else if (selectedTool === "circle") {
                // Start creating circle
                const circleId = `circle-${Date.now()}`;

                // Apply snapping to start point (unless Ctrl/Cmd is held)
                const shouldSnap = !shouldDisableSnap(event.nativeEvent);
                const startPoint = shouldSnap
                    ? snapPoint(canvasPoint.x, canvasPoint.y, snapOptions)
                    : { x: canvasPoint.x, y: canvasPoint.y, snapped: false };

                setInteraction((prev) => ({
                    ...prev,
                    isCreatingShape: true,
                    shapeStartPoint: startPoint,
                    currentShapeId: circleId,
                }));

                // Create initial circle object with zero radius
                const newCircle: CircleObject = {
                    id: circleId,
                    type: "circle",
                    name: "Circle",
                    layerId: "default",
                    transform: {
                        x: startPoint.x,
                        y: startPoint.y,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                    },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 0,
                    radius: 0,
                    style: {
                        fill: "#007ACC",
                        stroke: "#ffffff",
                        strokeWidth: 1,
                    },
                };
                addObject(newCircle);
            } else if (selectedTool === "text") {
                // Create text object on click
                const textId = `text-${Date.now()}`;

                const newText: TextObject = {
                    id: textId,
                    type: "text",
                    name: "Text",
                    layerId: "default",
                    transform: {
                        x: canvasPoint.x,
                        y: canvasPoint.y,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                    },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 0,
                    content: "Type text here",
                    style: {
                        fontFamily: "Arial",
                        fontSize: 16,
                        fontWeight: "normal",
                        color: "#000000",
                        textAlign: "left",
                        lineHeight: 1.2,
                    },
                };
                addObject(newText);

                // Select the newly created text object and enter edit mode
                selectObjects([textId]);

                // Enter text editing mode immediately
                setTimeout(() => {
                    setInteraction((prev) => ({
                        ...prev,
                        isEditingText: true,
                        editingTextId: textId,
                    }));
                }, 10); // Small delay to ensure the text is rendered first
            } else if (selectedTool === "pen") {
                // Handle path drawing - add point to existing path or start new one
                if (interaction.isDrawingPath && interaction.currentPathId) {
                    // Add point to existing path
                    const newPoints = [...interaction.pathPoints, canvasPoint];

                    // Build SVG path data string
                    let pathData = "";
                    if (newPoints.length > 0) {
                        const firstPoint = newPoints[0];
                        if (firstPoint) {
                            pathData = `M ${firstPoint.x} ${firstPoint.y}`;
                            for (let i = 1; i < newPoints.length; i++) {
                                const point = newPoints[i];
                                if (point) {
                                    pathData += ` L ${point.x} ${point.y}`;
                                }
                            }
                        }
                    }

                    // Update the path object and state
                    updateObject(interaction.currentPathId, { pathData });
                    setInteraction((prev) => ({
                        ...prev,
                        pathPoints: newPoints,
                    }));
                } else {
                    // Start creating path
                    const pathId = `path-${Date.now()}`;

                    // Create initial path object with single point
                    const newPath: PathObject = {
                        id: pathId,
                        type: "path",
                        name: "Path",
                        layerId: "default",
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
                        pathData: `M ${canvasPoint.x} ${canvasPoint.y}`, // Start with move command
                        style: {
                            fill: "none",
                            stroke: "#007ACC",
                            strokeWidth: 2,
                        },
                    };
                    addObject(newPath);

                    // Set up path drawing state
                    setInteraction((prev) => ({
                        ...prev,
                        isDrawingPath: true,
                        currentPathId: pathId,
                        pathPoints: [canvasPoint],
                    }));

                    // Select the newly created path
                    selectObjects([pathId]);
                }
            } else {
                // Canvas clicked - handle based on current mode
                if (interaction.isEditingPath) {
                    // In path editing mode, just clear node selection
                    setInteraction((prev) => ({
                        ...prev,
                        selectedNodeIds: [],
                    }));
                } else {
                    // Normal mode - clear selection
                    clearSelection();
                }
            }
        },
        [screenToCanvas, selectedTool, selectObjects, clearSelection]
    );

    const handleMouseMove = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            const point = { x: event.clientX, y: event.clientY };
            const canvasPoint = screenToCanvas(event.clientX, event.clientY);

            // Update mouse position for precision inputs if enabled
            if (precisionInputs.showMousePosition) {
                updateMousePosition({
                    x: canvasPoint.x,
                    y: canvasPoint.y,
                    unit: precisionInputs.unit,
                });
            }

            // Handle panning
            if (interaction.isPanning && interaction.lastPanPoint) {
                const deltaX = point.x - interaction.lastPanPoint.x;
                const deltaY = point.y - interaction.lastPanPoint.y;

                setViewport({
                    panX: viewport.panX + deltaX,
                    panY: viewport.panY + deltaY,
                });

                setInteraction((prev) => ({
                    ...prev,
                    lastPanPoint: point,
                }));
                return;
            }

            // Handle origin editing
            if (
                interaction.isEditingOrigin &&
                interaction.originObjectId &&
                interaction.dragStartPoint &&
                interaction.initialOrigin
            ) {
                const objectId = interaction.originObjectId;
                const object = objects[objectId];

                if (object) {
                    // Calculate bounds based on object type
                    let bounds = { x: 0, y: 0, width: 0, height: 0 };

                    switch (object.type) {
                        case "rectangle": {
                            const rect = object as RectangleObject;
                            bounds = {
                                x: rect.transform.x,
                                y: rect.transform.y,
                                width: rect.width,
                                height: rect.height,
                            };
                            break;
                        }
                        case "circle": {
                            const circle = object as CircleObject;
                            bounds = {
                                x: circle.transform.x - circle.radius,
                                y: circle.transform.y - circle.radius,
                                width: circle.radius * 2,
                                height: circle.radius * 2,
                            };
                            break;
                        }
                    }

                    // Calculate new origin values (0-1 range) based on mouse position relative to object bounds
                    let newOriginX = (canvasPoint.x - bounds.x) / bounds.width;
                    let newOriginY = (canvasPoint.y - bounds.y) / bounds.height;

                    // Clamp values between 0 and 1
                    newOriginX = Math.max(0, Math.min(1, newOriginX));
                    newOriginY = Math.max(0, Math.min(1, newOriginY));

                    // Round to 2 decimal places for precision
                    newOriginX = Math.round(newOriginX * 100) / 100;
                    newOriginY = Math.round(newOriginY * 100) / 100;

                    // Update object with new origin
                    updateObject(objectId, {
                        transform: {
                            ...object.transform,
                            originX: newOriginX,
                            originY: newOriginY,
                        },
                    });

                    // Create visual indicator for transform origin position
                    const originIndicator = document.createElement("div");
                    originIndicator.className = "canvas-origin-indicator";
                    originIndicator.textContent = `Origin: ${Math.round(newOriginX * 100)}%, ${Math.round(
                        newOriginY * 100
                    )}%`;
                    originIndicator.style.position = "absolute";
                    originIndicator.style.left = `${canvasPoint.x * viewport.zoom + viewport.panX + 15}px`;
                    originIndicator.style.top = `${canvasPoint.y * viewport.zoom + viewport.panY - 15}px`;
                    originIndicator.style.backgroundColor = "rgba(255, 87, 34, 0.8)";
                    originIndicator.style.color = "white";
                    originIndicator.style.padding = "4px 8px";
                    originIndicator.style.borderRadius = "4px";
                    originIndicator.style.fontSize = "12px";
                    originIndicator.style.fontFamily = "monospace";
                    originIndicator.style.pointerEvents = "none";
                    originIndicator.style.zIndex = "1000";

                    // Remove any existing origin indicators
                    const existingIndicators = document.querySelectorAll(".canvas-origin-indicator");
                    existingIndicators.forEach((el) => el.remove());

                    // Add indicator to canvas container
                    if (svgRef.current?.parentElement) {
                        svgRef.current.parentElement.appendChild(originIndicator);
                    }
                }

                return;
            }

            // Handle rotation operation
            if (
                interaction.isRotating &&
                interaction.rotationObjectId &&
                interaction.rotationStartPoint &&
                interaction.rotationCenter
            ) {
                const objectId = interaction.rotationObjectId;
                const center = interaction.rotationCenter;
                const object = objects[objectId];

                if (object) {
                    // Calculate rotation angle based on mouse position relative to center
                    let startAngle = calculateAngle(center, interaction.rotationStartPoint);
                    let currentAngle = calculateAngle(center, canvasPoint);
                    let rotationChange = currentAngle - startAngle;

                    // New rotation is initial rotation plus the change
                    let newRotation = interaction.initialRotation + rotationChange;

                    // Snap to 15-degree increments if Shift key is held
                    if (event.shiftKey) {
                        newRotation = snapAngle(newRotation, 15);
                    }

                    // Normalize angle to 0-360 range
                    newRotation = ((newRotation % 360) + 360) % 360;

                    // Create rotation guide elements in DOM
                    // 1. Create a rotation indicator with angle value
                    const rotationIndicator = document.createElement("div");
                    rotationIndicator.className = "canvas-rotation-indicator";
                    rotationIndicator.textContent = `${Math.round(newRotation)}°`;
                    rotationIndicator.style.position = "absolute";
                    rotationIndicator.style.left = `${center.x * viewport.zoom + viewport.panX}px`;
                    rotationIndicator.style.top = `${center.y * viewport.zoom + viewport.panY - 40}px`;
                    rotationIndicator.style.backgroundColor = "rgba(0, 123, 255, 0.8)";
                    rotationIndicator.style.color = "white";
                    rotationIndicator.style.padding = "4px 8px";
                    rotationIndicator.style.borderRadius = "4px";
                    rotationIndicator.style.fontSize = "12px";
                    rotationIndicator.style.fontFamily = "monospace";
                    rotationIndicator.style.pointerEvents = "none";
                    rotationIndicator.style.zIndex = "1000";

                    // 2. Create circular guide
                    const rotationGuide = document.createElement("div");
                    rotationGuide.className = "canvas-rotation-guide";

                    // Get object dimensions for guide sizing
                    let objectWidth = 0;
                    let objectHeight = 0;

                    if (object.type === "rectangle") {
                        objectWidth = (object as RectangleObject).width;
                        objectHeight = (object as RectangleObject).height;
                    } else if (object.type === "circle") {
                        objectWidth = (object as CircleObject).radius * 2;
                        objectHeight = (object as CircleObject).radius * 2;
                    }

                    // Position and size the guide to match object
                    const guideSize = Math.max(100, Math.sqrt(Math.pow(objectWidth, 2) + Math.pow(objectHeight, 2)));
                    rotationGuide.style.position = "absolute";
                    rotationGuide.style.left = `${center.x * viewport.zoom + viewport.panX - guideSize / 2}px`;
                    rotationGuide.style.top = `${center.y * viewport.zoom + viewport.panY - guideSize / 2}px`;
                    rotationGuide.style.width = `${guideSize}px`;
                    rotationGuide.style.height = `${guideSize}px`;
                    rotationGuide.style.border = "1px dashed rgba(0, 123, 255, 0.5)";
                    rotationGuide.style.borderRadius = "50%";
                    rotationGuide.style.pointerEvents = "none";
                    rotationGuide.style.zIndex = "999";

                    // 3. Create rotation line
                    const rotationLine = document.createElement("div");
                    rotationLine.className = "canvas-rotation-line";
                    rotationLine.style.position = "absolute";
                    rotationLine.style.left = `${center.x * viewport.zoom + viewport.panX}px`;
                    rotationLine.style.top = `${center.y * viewport.zoom + viewport.panY}px`;
                    rotationLine.style.width = `${guideSize / 2}px`;
                    rotationLine.style.height = "1px";
                    rotationLine.style.background = "rgba(0, 123, 255, 0.8)";
                    rotationLine.style.transformOrigin = "left center";
                    rotationLine.style.transform = `rotate(${newRotation}deg)`;
                    rotationLine.style.pointerEvents = "none";
                    rotationLine.style.zIndex = "999";

                    // Remove any existing rotation guides
                    const existingElements = document.querySelectorAll(
                        ".canvas-rotation-indicator, .canvas-rotation-guide, .canvas-rotation-line"
                    );
                    existingElements.forEach((el) => el.remove());

                    // Add guides to canvas container
                    if (svgRef.current?.parentElement) {
                        svgRef.current.parentElement.appendChild(rotationGuide);
                        svgRef.current.parentElement.appendChild(rotationLine);
                        svgRef.current.parentElement.appendChild(rotationIndicator);

                        // Remove after a delay if no further updates
                        setTimeout(() => {
                            document
                                .querySelectorAll(
                                    ".canvas-rotation-indicator, .canvas-rotation-guide, .canvas-rotation-line"
                                )
                                .forEach((el) => {
                                    el.remove();
                                });
                        }, 2000);
                    }

                    // Update object with new rotation
                    updateObject(objectId, {
                        transform: {
                            ...object.transform,
                            rotation: newRotation,
                        },
                    });
                }
                return;
            }

            // Handle resize operation
            if (
                interaction.isResizing &&
                interaction.resizeHandle &&
                interaction.resizeObjectId &&
                interaction.initialObjectBounds
            ) {
                const resizeHandle = interaction.resizeHandle;
                const objectId = interaction.resizeObjectId;
                const initialBounds = interaction.initialObjectBounds;
                const object = objects[objectId];

                if (object) {
                    const newBounds = calculateResizeBounds(
                        initialBounds,
                        resizeHandle,
                        canvasPoint,
                        interaction.shapeStartPoint!,
                        {
                            proportional: event.shiftKey, // Maintain aspect ratio with Shift
                            fromCenter: event.altKey, // Scale from center with Alt
                        }
                    );

                    // Apply resize based on object type
                    switch (object.type) {
                        case "rectangle": {
                            updateObject(objectId, {
                                transform: {
                                    x: newBounds.x,
                                    y: newBounds.y,
                                    rotation: 0,
                                    scaleX: 1,
                                    scaleY: 1,
                                },
                                width: Math.max(5, newBounds.width), // Minimum width
                                height: Math.max(5, newBounds.height), // Minimum height
                            });
                            break;
                        }
                        case "circle": {
                            const radius = Math.max(2.5, Math.min(newBounds.width, newBounds.height) / 2); // Minimum radius
                            updateObject(objectId, {
                                transform: {
                                    x: newBounds.x + newBounds.width / 2,
                                    y: newBounds.y + newBounds.height / 2,
                                    rotation: 0,
                                    scaleX: 1,
                                    scaleY: 1,
                                },
                                radius,
                            });
                            break;
                        }
                        case "text": {
                            // For text objects, we'll update the font size based on resize
                            const text = object as TextObject;
                            const scaleX = newBounds.width / initialBounds.width;
                            const scaleY = newBounds.height / initialBounds.height;
                            const avgScale = (scaleX + scaleY) / 2; // Average scale for font size

                            const newFontSize = Math.max(8, (text.style?.fontSize || 16) * avgScale);

                            updateObject(objectId, {
                                transform: {
                                    x: newBounds.x,
                                    y: newBounds.y,
                                    rotation: 0,
                                    scaleX: 1,
                                    scaleY: 1,
                                },
                                style: {
                                    ...text.style,
                                    fontSize: newFontSize,
                                },
                            });
                            break;
                        }
                    }
                }
                return;
            }

            const canvasEvent: CanvasMouseEvent = {
                point,
                canvasPoint,
                originalEvent: event.nativeEvent,
            };

            // Handle object dragging
            if (interaction.isDraggingObject && interaction.dragStartPoint && interaction.draggedObjectIds.length > 0) {
                const deltaX = canvasPoint.x - interaction.dragStartPoint.x;
                const deltaY = canvasPoint.y - interaction.dragStartPoint.y;

                // Update positions of all dragged objects
                interaction.draggedObjectIds.forEach((objectId) => {
                    const initialPos = interaction.initialObjectPositions[objectId];
                    if (initialPos) {
                        // Calculate new position
                        const newPosition = {
                            x: initialPos.x + deltaX,
                            y: initialPos.y + deltaY,
                        };

                        // Apply grid snapping first
                        const gridSnappedPosition = snapPoint(newPosition.x, newPosition.y, snapOptions);

                        // Then try smart guides snapping if enabled
                        let finalPosition = { x: gridSnappedPosition.x, y: gridSnappedPosition.y };

                        if (smartSnapOptions.enabled) {
                            const currentObject = objects[objectId];
                            if (currentObject) {
                                // Create a temporary object with the new position for smart guide calculation
                                const tempObject = {
                                    ...currentObject,
                                    transform: {
                                        ...currentObject.transform,
                                        x: finalPosition.x,
                                        y: finalPosition.y,
                                    },
                                };

                                // Get all other objects for smart guide calculation
                                const otherObjects = Object.values(objects).filter(
                                    (obj) => obj && !interaction.draggedObjectIds.includes(obj.id)
                                );

                                // Apply smart guide snapping
                                const smartSnapResult = snapObjectToObjects(tempObject, otherObjects, smartSnapOptions);

                                if (smartSnapResult.snapped) {
                                    finalPosition = { x: smartSnapResult.x, y: smartSnapResult.y };

                                    // Update active guides for visual feedback
                                    if (smartSnapResult.guides.length > 0) {
                                        setActiveGuides(smartSnapResult.guides);
                                    }
                                }
                            }
                        }

                        // Finally try manual guide snapping if enabled
                        if (guideSnapOptions.enabled && manualGuides.guides.length > 0) {
                            const guideSnapResult = snapToGuides(finalPosition, manualGuides.guides, guideSnapOptions);
                            if (guideSnapResult.snapped) {
                                finalPosition = { x: guideSnapResult.x, y: guideSnapResult.y };
                            }
                        }

                        updateObject(objectId, {
                            transform: {
                                x: finalPosition.x,
                                y: finalPosition.y,
                                rotation: 0,
                                scaleX: 1,
                                scaleY: 1,
                            },
                        });
                    }
                });
                return;
            }

            // Handle path node dragging
            if (interaction.isDraggingNode && interaction.draggedNodeId && interaction.editingPathId) {
                const pathObject = objects[interaction.editingPathId] as PathObject;
                if (pathObject && pathObject.nodes) {
                    // Update node position
                    const updatedNodes = updateNodePosition(pathObject.nodes, interaction.draggedNodeId, canvasPoint);
                    const newPathData = nodesToPathData(updatedNodes);

                    updateObject(interaction.editingPathId, {
                        nodes: updatedNodes,
                        pathData: newPathData,
                    });
                }
                return;
            }

            // Handle control point dragging
            if (
                interaction.isDraggingControlPoint &&
                interaction.draggedControlNodeId &&
                interaction.draggedControlType &&
                interaction.editingPathId
            ) {
                const pathObject = objects[interaction.editingPathId] as PathObject;
                if (pathObject && pathObject.nodes) {
                    // Update control point position
                    const updatedNodes = pathObject.nodes.map((node) => {
                        if (node.id === interaction.draggedControlNodeId) {
                            const updatedNode = { ...node };
                            if (interaction.draggedControlType === "control1") {
                                updatedNode.controlPoint1 = canvasPoint;
                            } else if (interaction.draggedControlType === "control2") {
                                updatedNode.controlPoint2 = canvasPoint;
                            }
                            return updatedNode;
                        }
                        return node;
                    });

                    const newPathData = nodesToPathData(updatedNodes);
                    updateObject(interaction.editingPathId, {
                        nodes: updatedNodes,
                        pathData: newPathData,
                    });
                }
                return;
            } // Handle shape creation
            if (interaction.isCreatingShape && interaction.shapeStartPoint && interaction.currentShapeId) {
                const startPoint = interaction.shapeStartPoint;

                // Apply snap-to-grid to current mouse position during shape creation
                const snappedCurrentPoint = snapPoint(canvasPoint.x, canvasPoint.y, snapOptions);

                if (selectedTool === "rectangle") {
                    const width = Math.abs(snappedCurrentPoint.x - startPoint.x);
                    const height = Math.abs(snappedCurrentPoint.y - startPoint.y);
                    const x = Math.min(snappedCurrentPoint.x, startPoint.x);
                    const y = Math.min(snappedCurrentPoint.y, startPoint.y);

                    // Update rectangle dimensions
                    updateObject(interaction.currentShapeId, {
                        transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
                        width,
                        height,
                    });
                } else if (selectedTool === "circle") {
                    // Calculate radius from center to mouse position
                    const radius = Math.sqrt(
                        Math.pow(snappedCurrentPoint.x - startPoint.x, 2) +
                            Math.pow(snappedCurrentPoint.y - startPoint.y, 2)
                    );

                    // Update circle radius
                    updateObject(interaction.currentShapeId, {
                        radius,
                    });
                }
            }

            // Handle path drawing
            if (interaction.isDrawingPath && interaction.currentPathId && interaction.pathPoints.length > 0) {
                // Update path with current mouse position
                const pathPoints = [...interaction.pathPoints, canvasPoint];

                // Build SVG path data string - ensure first point exists
                const firstPoint = pathPoints[0];
                if (firstPoint) {
                    let pathData = `M ${firstPoint.x} ${firstPoint.y}`;
                    for (let i = 1; i < pathPoints.length; i++) {
                        const point = pathPoints[i];
                        if (point) {
                            pathData += ` L ${point.x} ${point.y}`;
                        }
                    }

                    // Update the path object
                    updateObject(interaction.currentPathId, {
                        pathData,
                    });
                }
            }
        },
        [screenToCanvas, interaction, viewport.panX, viewport.panY, setViewport, updateObject]
    );

    const handleMouseUp = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            // End panning
            if (interaction.isPanning) {
                setInteraction((prev) => ({
                    ...prev,
                    isPanning: false,
                    lastPanPoint: null,
                }));
                return;
            }

            const point = { x: event.clientX, y: event.clientY };
            const canvasPoint = screenToCanvas(event.clientX, event.clientY);

            const canvasEvent: CanvasMouseEvent = {
                point,
                canvasPoint,
                originalEvent: event.nativeEvent,
            };

            // End origin editing
            if (interaction.isEditingOrigin) {
                // Clean up origin indicator
                const existingIndicator = document.querySelector(".canvas-origin-indicator");
                if (existingIndicator) {
                    existingIndicator.remove();
                }

                setInteraction((prev) => ({
                    ...prev,
                    isEditingOrigin: false,
                    originObjectId: null,
                    dragStartPoint: null,
                    initialOrigin: null,
                }));
                return;
            }

            // End rotation
            if (interaction.isRotating) {
                // Clean up rotation indicator
                const existingIndicator = document.querySelector(".canvas-rotation-indicator");
                if (existingIndicator) {
                    existingIndicator.remove();
                }

                setInteraction((prev) => ({
                    ...prev,
                    isRotating: false,
                    rotationObjectId: null,
                    rotationStartPoint: null,
                    rotationCenter: null,
                }));
                return;
            }

            // End object dragging
            if (interaction.isDraggingObject) {
                setInteraction((prev) => ({
                    ...prev,
                    isDraggingObject: false,
                    dragStartPoint: null,
                    draggedObjectIds: [],
                    initialObjectPositions: {},
                }));
                return;
            }

            // End node dragging
            if (interaction.isDraggingNode) {
                setInteraction((prev) => ({
                    ...prev,
                    isDraggingNode: false,
                    draggedNodeId: null,
                    draggedNodeInitialPosition: null,
                }));
                return;
            }

            // End control point dragging
            if (interaction.isDraggingControlPoint) {
                setInteraction((prev) => ({
                    ...prev,
                    isDraggingControlPoint: false,
                    draggedControlNodeId: null,
                    draggedControlType: null,
                }));
                return;
            }

            // End resize operation
            if (interaction.isResizing) {
                setInteraction((prev) => ({
                    ...prev,
                    isResizing: false,
                    resizeHandle: null,
                    resizeObjectId: null,
                    initialObjectBounds: null,
                    shapeStartPoint: null,
                }));
                return;
            }

            // Handle shape creation completion
            if (interaction.isCreatingShape && interaction.currentShapeId) {
                // End shape creation
                setInteraction((prev) => ({
                    ...prev,
                    isCreatingShape: false,
                    shapeStartPoint: null,
                    currentShapeId: null,
                }));

                // Select the newly created shape
                selectObjects([interaction.currentShapeId]);
            }
        },
        [
            interaction.isPanning,
            screenToCanvas,
            precisionInputs.showMousePosition,
            precisionInputs.unit,
            updateMousePosition,
        ]
    );

    // Handle wheel events for zooming
    const handleWheel = useCallback(
        (event: WheelEvent<SVGSVGElement>) => {
            event.preventDefault();

            const zoomFactor = 0.1;
            const deltaZoom = event.deltaY > 0 ? -zoomFactor : zoomFactor;
            const newZoom = Math.max(0.1, Math.min(10, viewport.zoom + deltaZoom));

            setViewport({ zoom: newZoom });
        },
        [viewport.zoom, setViewport]
    );

    // Handle double-click for text and path editing
    const handleDoubleClick = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            const target = event.target as SVGElement;
            const objectId = target.getAttribute("data-object-id");

            if (objectId && objects[objectId]) {
                const object = objects[objectId];

                if (object.type === "text") {
                    event.preventDefault();
                    event.stopPropagation();

                    // Enter text editing mode
                    setInteraction((prev) => ({
                        ...prev,
                        isEditingText: true,
                        editingTextId: objectId,
                    }));

                    // Select the text object if not already selected
                    if (!selection.objectIds.includes(objectId)) {
                        selectObjects([objectId]);
                    }
                } else if (object.type === "path") {
                    event.preventDefault();
                    event.stopPropagation();

                    // Enter path editing mode
                    const pathObject = object as PathObject;

                    // Parse path data into nodes if not already done
                    if (!pathObject.nodes) {
                        const nodes = parsePathData(pathObject.pathData);
                        updateObject(objectId, { nodes });
                    }

                    setInteraction((prev) => ({
                        ...prev,
                        isEditingPath: true,
                        editingPathId: objectId,
                        selectedNodeIds: [],
                    }));

                    // Select the path object if not already selected
                    if (!selection.objectIds.includes(objectId)) {
                        selectObjects([objectId]);
                    }
                }
            }
        },
        [objects, selection.objectIds, selectObjects, updateObject]
    );

    // Get selected objects for measurements
    const selectedObjects = selection.objectIds
        .map((id) => objects[id])
        .filter((obj): obj is CanvasObject => obj !== undefined);

    return (
        <div className={canvasCn} data-tool={selectedTool}>
            {/* Horizontal ruler */}
            <HorizontalRuler
                viewport={viewport}
                rulers={rulers}
                width={viewport.canvasWidth}
                className="canvas-horizontal-ruler"
            />

            {/* Vertical ruler */}
            <VerticalRuler
                viewport={viewport}
                rulers={rulers}
                height={viewport.canvasHeight}
                className="canvas-vertical-ruler"
            />

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                className="canvas-svg"
                data-testid="canvas-svg"
                viewBox={`${-viewport.panX / viewport.zoom} ${-viewport.panY / viewport.zoom} ${
                    viewport.canvasWidth / viewport.zoom
                } ${viewport.canvasHeight / viewport.zoom}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                onWheel={handleWheel}>
                {renderGrid()}

                {/* Smart guides layer */}
                <SmartGuides guides={smartGuides.activeGuides} viewport={viewport} className="smart-guides-layer" />

                {/* Manual guides layer */}
                <ManualGuides guides={manualGuides.guides} viewport={viewport} className="manual-guides-layer" />

                {/* Objects layer */}
                <g className="objects-layer">{renderObjects()}</g>

                {/* Selection layer */}
                <g className="selection-layer">{renderSelection()}</g>

                {/* Path editing layer */}
                <g className="path-editing-layer">{renderPathNodes()}</g>
            </svg>

            {/* Measurement indicators */}
            <MeasurementIndicator
                viewport={viewport}
                rulers={rulers}
                selectedObjects={selectedObjects}
                className="canvas-measurement-indicators"
            />

            {/* Text editing overlay */}
            {interaction.isEditingText && interaction.editingTextId && renderTextEditor()}

            {/* UI overlay */}
            <div className="canvas-zoom-indicator">{Math.round(viewport.zoom * 100)}%</div>
        </div>
    );
};
