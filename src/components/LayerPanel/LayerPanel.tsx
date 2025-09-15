import { useCallback, useMemo, useState } from "react";
import { useEditor } from "../../contexts/EditorContext";
import type { LayerOperation, LayerTreeNode } from "../../types/editor";
import { buildLayerTree } from "../../utils/layerUtils";
import { Button, Icon } from "../ui";

import cn from "classnames";
import "./layerPanel.css";

export interface LayerPanelProps {
    className?: string;
}

/**
 * LayerPanel Component
 *
 * Displays the layer hierarchy in a tree structure with controls for:
 * - Layer selection and multi-selection
 * - Visibility and lock toggles
 * - Layer renaming (double-click)
 * - Expand/collapse for groups
 * - Context menu for layer operations
 */
export function LayerPanel({ className }: LayerPanelProps) {
    const {
        state,
        selectLayers,
        clearLayerSelection,
        setActiveLayer,
        toggleLayerVisibility,
        toggleLayerLock,
        renameLayer,
        expandLayer,
        collapseLayer,
        moveLayers,
        groupLayers,
        ungroupLayer,
    } = useEditor();
    const { layers, layerOrder, layerSelection } = state;

    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>("");
    const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
    const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

    // Build the layer tree structure
    const layerTree = useMemo(() => {
        return buildLayerTree(layers, layerOrder);
    }, [layers, layerOrder]);

    // Handle layer selection
    const handleLayerSelect = useCallback(
        (layerId: string, event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey) {
                // Multi-select with Ctrl/Cmd
                const currentSelection = layerSelection.selectedLayerIds;
                if (currentSelection.includes(layerId)) {
                    // Remove from selection
                    const newSelection = currentSelection.filter((id) => id !== layerId);
                    selectLayers(newSelection);
                } else {
                    // Add to selection
                    selectLayers([...currentSelection, layerId]);
                }
            } else if (event.shiftKey && layerSelection.selectedLayerIds.length > 0) {
                // Range select with Shift
                const lastSelectedId = layerSelection.selectedLayerIds[layerSelection.selectedLayerIds.length - 1];
                if (lastSelectedId) {
                    const allLayerIds = layerOrder; // Simplified range selection
                    const startIndex = allLayerIds.indexOf(lastSelectedId);
                    const endIndex = allLayerIds.indexOf(layerId);

                    if (startIndex !== -1 && endIndex !== -1) {
                        const rangeStart = Math.min(startIndex, endIndex);
                        const rangeEnd = Math.max(startIndex, endIndex);
                        const rangeSelection = allLayerIds.slice(rangeStart, rangeEnd + 1);
                        selectLayers(rangeSelection);
                    }
                }
            } else {
                // Single select
                selectLayers([layerId]);
                setActiveLayer(layerId);
            }
        },
        [layerSelection.selectedLayerIds, layerOrder, selectLayers, setActiveLayer]
    );

    // Handle layer rename
    const handleLayerDoubleClick = useCallback(
        (layerId: string) => {
            const layer = layers[layerId];
            if (layer && !layer.locked) {
                setEditingLayerId(layerId);
                setEditingName(layer.name);
            }
        },
        [layers]
    );

    // Handle rename submit
    const handleRenameSubmit = useCallback(
        (layerId: string) => {
            if (editingName.trim()) {
                renameLayer(layerId, editingName.trim());
            }
            setEditingLayerId(null);
            setEditingName("");
        },
        [editingName, renameLayer]
    );

    // Handle rename cancel
    const handleRenameCancel = useCallback(() => {
        setEditingLayerId(null);
        setEditingName("");
    }, []);

    // Handle visibility toggle
    const handleVisibilityToggle = useCallback(
        (layerId: string, event: React.MouseEvent) => {
            event.stopPropagation();
            toggleLayerVisibility(layerId);
        },
        [toggleLayerVisibility]
    );

    // Handle lock toggle
    const handleLockToggle = useCallback(
        (layerId: string, event: React.MouseEvent) => {
            event.stopPropagation();
            toggleLayerLock(layerId);
        },
        [toggleLayerLock]
    );

    // Handle expand/collapse
    const handleExpandToggle = useCallback(
        (layerId: string, event: React.MouseEvent) => {
            event.stopPropagation();
            const layer = layers[layerId];
            if (layer && layer.children.length > 0) {
                if (layer.expanded) {
                    collapseLayer(layerId);
                } else {
                    expandLayer(layerId);
                }
            }
        },
        [layers, expandLayer, collapseLayer]
    );

    // Drag and drop handlers
    const handleDragStart = useCallback((layerId: string, event: React.DragEvent) => {
        setDraggedLayerId(layerId);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/layer-id", layerId);
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback(
        (targetLayerId: string, event: React.DragEvent) => {
            event.preventDefault();
            const draggedId = draggedLayerId;

            if (draggedId && draggedId !== targetLayerId) {
                // Create layer operation for reordering
                const operation: LayerOperation = {
                    type: "move",
                    sourceIds: [draggedId],
                    targetId: targetLayerId,
                    targetPosition: "after",
                };
                moveLayers(operation);
            }

            setDraggedLayerId(null);
            setDragOverLayerId(null);
        },
        [draggedLayerId, moveLayers]
    );

    const handleDragEnd = useCallback(() => {
        setDraggedLayerId(null);
        setDragOverLayerId(null);
    }, []);

    // Render a single layer item
    const renderLayerItem = useCallback(
        (node: LayerTreeNode, index: number) => {
            const { layer, depth } = node;
            const isSelected = layerSelection.selectedLayerIds.includes(layer.id);
            const isActive = layerSelection.activeLayerId === layer.id;
            const isEditing = editingLayerId === layer.id;
            const hasChildren = layer.children.length > 0;
            const isExpanded = layer.expanded && hasChildren;

            const layerItemClass = cn("layer-item", {
                "layer-item--selected": isSelected,
                "layer-item--active": isActive,
                "layer-item--locked": layer.locked,
                "layer-item--hidden": !layer.visible,
                "layer-item--group": layer.type === "group",
                "layer-item--dragging": draggedLayerId === layer.id,
                "layer-item--drag-over": dragOverLayerId === layer.id,
            });

            const indentStyle = {
                paddingLeft: `${depth * 16 + 8}px`,
            };

            return (
                <div key={layer.id} className={layerItemClass}>
                    <div
                        className="layer-item__content"
                        style={indentStyle}
                        draggable
                        onDragStart={(e) => handleDragStart(layer.id, e)}
                        onDragOver={(e) => {
                            handleDragOver(e);
                            setDragOverLayerId(layer.id);
                        }}
                        onDragLeave={() => setDragOverLayerId(null)}
                        onDrop={(e) => handleDrop(layer.id, e)}
                        onDragEnd={() => handleDragEnd()}
                        onClick={(e) => handleLayerSelect(layer.id, e)}
                        onDoubleClick={() => handleLayerDoubleClick(layer.id)}>
                        {/* Expand/Collapse button for groups */}
                        {hasChildren && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="layer-item__expand"
                                onClick={(e) => handleExpandToggle(layer.id, e)}
                                aria-label={isExpanded ? "Collapse group" : "Expand group"}>
                                <Icon name={isExpanded ? "chevron-down" : "chevron-right"} />
                            </Button>
                        )}

                        {/* Layer icon */}
                        <Icon name={layer.type === "group" ? "folder" : "layer"} className="layer-item__icon" />

                        {/* Layer name or editing input */}
                        {isEditing ? (
                            <input
                                type="text"
                                className="layer-item__name-input"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleRenameSubmit(layer.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleRenameSubmit(layer.id);
                                    } else if (e.key === "Escape") {
                                        handleRenameCancel();
                                    }
                                }}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                            />
                        ) : (
                            <span className="layer-item__name">{layer.name}</span>
                        )}

                        {/* Controls */}
                        <div className="layer-item__controls">
                            {/* Lock toggle */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className={cn("layer-item__control", {
                                    "layer-item__control--active": layer.locked,
                                })}
                                onClick={(e) => handleLockToggle(layer.id, e)}
                                aria-label={layer.locked ? "Unlock layer" : "Lock layer"}>
                                <Icon name={layer.locked ? "lock" : "unlock"} />
                            </Button>

                            {/* Visibility toggle */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className={cn("layer-item__control", {
                                    "layer-item__control--active": layer.visible,
                                })}
                                onClick={(e) => handleVisibilityToggle(layer.id, e)}
                                aria-label={layer.visible ? "Hide layer" : "Show layer"}>
                                <Icon name={layer.visible ? "eye" : "eye-off"} />
                            </Button>
                        </div>
                    </div>

                    {/* Render children if expanded */}
                    {isExpanded && node.children.map((childNode, childIndex) => renderLayerItem(childNode, childIndex))}
                </div>
            );
        },
        [
            layerSelection,
            editingLayerId,
            editingName,
            layers,
            handleLayerSelect,
            handleLayerDoubleClick,
            handleExpandToggle,
            handleVisibilityToggle,
            handleLockToggle,
            handleRenameSubmit,
            handleRenameCancel,
        ]
    );

    const layerPanelClass = cn("layer-panel", className);

    return (
        <div className={layerPanelClass}>
            <div className="layer-panel__header">
                <h3 className="layer-panel__title">Layers</h3>
                <div className="layer-panel__actions">
                    {/* Group selected layers */}
                    {layerSelection.selectedLayerIds.length > 1 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => groupLayers(layerSelection.selectedLayerIds)}
                            aria-label="Group selected layers">
                            <Icon name="folder" />
                        </Button>
                    )}

                    {/* Ungroup layer - show if active layer is a group */}
                    {layerSelection.activeLayerId && layers[layerSelection.activeLayerId]?.type === "group" && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => ungroupLayer(layerSelection.activeLayerId!)}
                            aria-label="Ungroup layer">
                            <Icon name="chevron-down" />
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => clearLayerSelection()}
                        aria-label="Clear layer selection">
                        <Icon name="x" />
                    </Button>
                </div>
            </div>

            <div className="layer-panel__content">
                {layerTree.length > 0 ? (
                    layerTree.map((node, index) => renderLayerItem(node, index))
                ) : (
                    <div className="layer-panel__empty">
                        <p>No layers</p>
                    </div>
                )}
            </div>
        </div>
    );
}
