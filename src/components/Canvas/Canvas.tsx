import cn from "classnames";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type WheelEvent } from "react";
import { useEditor } from "../../contexts/EditorContext";
import {
    type Bounds,
    type CanvasMouseEvent,
    type CircleObject,
    type Point,
    type RectangleObject,
    type ToolType,
} from "../../types/editor";
import { getVisibleLayers } from "../../utils/layerUtils";
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
}

export const Canvas: React.FC<CanvasProps> = ({ className }) => {
    const { state, selectObjects, clearSelection, setViewport, addObject, updateObject, setTool } = useEditor();
    const svgRef = useRef<SVGSVGElement>(null);
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
    });

    const { viewport, objects, layers, layerOrder, selectedTool, selection } = state;

    const canvasCn = cn("Canvas", className);

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

            // Skip if an input field is focused or if modifier keys are pressed
            if (isInputFocused || event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            let newTool: ToolType | null = null;

            switch (event.key.toLowerCase()) {
                case "r":
                    newTool = "rectangle";
                    break;
                case "c":
                    newTool = "circle";
                    break;
                case "v":
                    newTool = "select";
                    break;
                case "h":
                    newTool = "hand";
                    break;
                default:
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
    }, [selectedTool, setTool]);

    // Calculate resize bounds based on handle position and mouse movement
    const calculateResizeBounds = useCallback(
        (initialBounds: Bounds, handle: string, currentPoint: Point, startPoint: Point): Bounds => {
            const deltaX = currentPoint.x - startPoint.x;
            const deltaY = currentPoint.y - startPoint.y;

            let newBounds = { ...initialBounds };

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
        const gridSize = 20;
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
            }

            const handleSize = 8;
            const halfHandle = handleSize / 2;

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
                setInteraction((prev) => ({
                    ...prev,
                    isCreatingShape: true,
                    shapeStartPoint: canvasPoint,
                    currentShapeId: rectId,
                }));

                // Create initial rectangle object with zero size
                const newRect: RectangleObject = {
                    id: rectId,
                    type: "rectangle",
                    name: "Rectangle",
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
                setInteraction((prev) => ({
                    ...prev,
                    isCreatingShape: true,
                    shapeStartPoint: canvasPoint,
                    currentShapeId: circleId,
                }));

                // Create initial circle object with zero radius
                const newCircle: CircleObject = {
                    id: circleId,
                    type: "circle",
                    name: "Circle",
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
                    radius: 0,
                    style: {
                        fill: "#007ACC",
                        stroke: "#ffffff",
                        strokeWidth: 1,
                    },
                };
                addObject(newCircle);
            } else {
                // Canvas clicked - clear selection
                clearSelection();
            }
        },
        [screenToCanvas, selectedTool, selectObjects, clearSelection]
    );

    const handleMouseMove = useCallback(
        (event: MouseEvent<SVGSVGElement>) => {
            const point = { x: event.clientX, y: event.clientY };
            const canvasPoint = screenToCanvas(event.clientX, event.clientY);

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
                        interaction.shapeStartPoint!
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
                        updateObject(objectId, {
                            transform: {
                                x: initialPos.x + deltaX,
                                y: initialPos.y + deltaY,
                                rotation: 0,
                                scaleX: 1,
                                scaleY: 1,
                            },
                        });
                    }
                });
                return;
            }

            // Handle shape creation
            if (interaction.isCreatingShape && interaction.shapeStartPoint && interaction.currentShapeId) {
                const startPoint = interaction.shapeStartPoint;

                if (selectedTool === "rectangle") {
                    const width = Math.abs(canvasPoint.x - startPoint.x);
                    const height = Math.abs(canvasPoint.y - startPoint.y);
                    const x = Math.min(canvasPoint.x, startPoint.x);
                    const y = Math.min(canvasPoint.y, startPoint.y);

                    // Update rectangle dimensions
                    updateObject(interaction.currentShapeId, {
                        transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
                        width,
                        height,
                    });
                } else if (selectedTool === "circle") {
                    // Calculate radius from center to mouse position
                    const radius = Math.sqrt(
                        Math.pow(canvasPoint.x - startPoint.x, 2) + Math.pow(canvasPoint.y - startPoint.y, 2)
                    );

                    // Update circle radius
                    updateObject(interaction.currentShapeId, {
                        radius,
                    });
                }
            }
        },
        [screenToCanvas, interaction, viewport.panX, viewport.panY, setViewport]
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
        [interaction.isPanning, screenToCanvas]
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
    return (
        <div className={canvasCn} data-tool={selectedTool}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                className="canvas-svg"
                viewBox={`${-viewport.panX / viewport.zoom} ${-viewport.panY / viewport.zoom} ${
                    viewport.canvasWidth / viewport.zoom
                } ${viewport.canvasHeight / viewport.zoom}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}>
                {renderGrid()}

                {/* Objects layer */}
                <g className="objects-layer">{renderObjects()}</g>

                {/* Selection layer */}
                <g className="selection-layer">{renderSelection()}</g>
            </svg>

            {/* UI overlay */}
            <div className="canvas-zoom-indicator">{Math.round(viewport.zoom * 100)}%</div>
        </div>
    );
};
