import type { Layer, LayerHierarchyUtils, LayerOperation, LayerTreeNode } from "../types/editor";

/**
 * Utility functions for layer hierarchy management
 * Provides tree traversal, manipulation, and validation operations
 */

/**
 * Build a hierarchical tree structure from flat layer data
 */
export function buildLayerTree(layers: Record<string, Layer>, layerOrder: string[]): LayerTreeNode[] {
    const tree: LayerTreeNode[] = [];
    const nodeMap = new Map<string, LayerTreeNode>();

    // Create nodes for all layers
    Object.values(layers).forEach((layer) => {
        const node: LayerTreeNode = {
            layer,
            children: [],
            depth: 0,
            index: 0,
            parentNode: undefined,
        };
        nodeMap.set(layer.id, node);
    });

    // Build parent-child relationships
    layerOrder.forEach((layerId, index) => {
        const node = nodeMap.get(layerId);
        if (!node) return;

        const layer = node.layer;
        node.index = index;

        if (layer.parentId) {
            const parentNode = nodeMap.get(layer.parentId);
            if (parentNode) {
                node.parentNode = parentNode;
                node.depth = parentNode.depth + 1;
                parentNode.children.push(node);
            } else {
                // Parent not found, treat as root
                tree.push(node);
            }
        } else {
            // Root level layer
            tree.push(node);
        }
    });

    // Sort children by order within each parent
    const sortChildren = (nodes: LayerTreeNode[]) => {
        nodes.sort((a, b) => a.layer.order - b.layer.order);
        nodes.forEach((node) => sortChildren(node.children));
    };

    sortChildren(tree);
    return tree;
}

/**
 * Get the path from root to a specific layer
 */
export function getLayerPath(layers: Record<string, Layer>, layerId: string): string[] {
    const path: string[] = [];
    let currentId: string | undefined = layerId;

    while (currentId) {
        const layer: Layer | undefined = layers[currentId];
        if (!layer) break;

        path.unshift(currentId);
        currentId = layer.parentId;
    }

    return path;
}

/**
 * Get all descendant layer IDs of a given layer
 */
export function getLayerDescendants(layers: Record<string, Layer>, layerId: string): string[] {
    const descendants: string[] = [];
    const layer = layers[layerId];

    if (!layer) return descendants;

    const collectDescendants = (currentLayerId: string) => {
        const currentLayer = layers[currentLayerId];
        if (!currentLayer) return;

        currentLayer.children.forEach((childId) => {
            descendants.push(childId);
            collectDescendants(childId);
        });
    };

    collectDescendants(layerId);
    return descendants;
}

/**
 * Get all ancestor layer IDs of a given layer
 */
export function getLayerAncestors(layers: Record<string, Layer>, layerId: string): string[] {
    const ancestors: string[] = [];
    let currentId: string | undefined = layers[layerId]?.parentId;

    while (currentId) {
        ancestors.push(currentId);
        currentId = layers[currentId]?.parentId;
    }

    return ancestors;
}

/**
 * Check if a layer can be moved to a target position
 */
export function canMoveLayer(
    layers: Record<string, Layer>,
    sourceId: string,
    targetId: string,
    position: "before" | "after" | "inside"
): boolean {
    // Can't move to itself
    if (sourceId === targetId) return false;

    const sourceLayer = layers[sourceId];
    const targetLayer = layers[targetId];

    if (!sourceLayer || !targetLayer) return false;

    // Can't move a layer into its own descendants
    const descendants = getLayerDescendants(layers, sourceId);
    if (descendants.includes(targetId)) return false;

    // For "inside" position, target must be able to contain children
    if (position === "inside") {
        // Groups can always contain children
        if (targetLayer.type === "group") return true;

        // Other layers can only contain children if they're not locked
        return !targetLayer.locked;
    }

    return true;
}

/**
 * Calculate new layer order after a move operation
 */
export function calculateNewOrder(
    layers: Record<string, Layer>,
    layerOrder: string[],
    operation: LayerOperation
): string[] {
    const { sourceIds, targetId, targetPosition } = operation;

    if (!targetId || !targetPosition || sourceIds.length === 0) {
        return layerOrder;
    }

    // Validate the move
    for (const sourceId of sourceIds) {
        if (!canMoveLayer(layers, sourceId, targetId, targetPosition)) {
            console.warn(`Cannot move layer ${sourceId} to ${targetPosition} ${targetId}`);
            return layerOrder;
        }
    }

    let newOrder = layerOrder.filter((id) => !sourceIds.includes(id));
    const targetIndex = newOrder.indexOf(targetId);

    if (targetIndex === -1) return layerOrder;

    switch (targetPosition) {
        case "before":
            newOrder.splice(targetIndex, 0, ...sourceIds);
            break;
        case "after":
            newOrder.splice(targetIndex + 1, 0, ...sourceIds);
            break;
        case "inside":
            // For "inside", we need to handle parent-child relationships
            // This is more complex and should be handled in the reducer
            console.warn("Inside positioning requires parent-child relationship updates");
            return layerOrder;
    }

    return newOrder;
}

/**
 * Find the next available layer name
 */
function getNextLayerName(layers: Record<string, Layer>, baseName: string = "Layer"): string {
    const existingNames = new Set(Object.values(layers).map((l) => l.name));
    let counter = 1;
    let name = baseName;

    while (existingNames.has(name)) {
        counter++;
        name = `${baseName} ${counter}`;
    }

    return name;
}

/**
 * Validate layer hierarchy integrity
 */
function validateLayerHierarchy(
    layers: Record<string, Layer>,
    layerOrder: string[]
): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check for orphaned layers
    Object.values(layers).forEach((layer) => {
        if (layer.parentId && !layers[layer.parentId]) {
            errors.push(`Layer ${layer.id} has invalid parent ${layer.parentId}`);
        }
    });

    // Check for circular references
    Object.values(layers).forEach((layer) => {
        const ancestors = getLayerAncestors(layers, layer.id);
        if (ancestors.includes(layer.id)) {
            errors.push(`Circular reference detected for layer ${layer.id}`);
        }
    });

    // Check layer order consistency
    layerOrder.forEach((layerId) => {
        if (!layers[layerId]) {
            errors.push(`Layer order contains non-existent layer ${layerId}`);
        }
    });

    Object.keys(layers).forEach((layerId) => {
        const layer = layers[layerId];
        if (layer && !layer.parentId && !layerOrder.includes(layerId)) {
            errors.push(`Root layer ${layerId} not found in layer order`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get visible layers in rendering order (respects layer hierarchy and visibility)
 */
function getVisibleLayers(layers: Record<string, Layer>, layerOrder: string[]): string[] {
    const visibleLayers: string[] = [];

    const addVisibleLayer = (layerId: string) => {
        const layer = layers[layerId];
        if (!layer || !layer.visible) return;

        // Check if all ancestors are visible and expanded
        const ancestors = getLayerAncestors(layers, layerId);
        const allAncestorsVisible = ancestors.every((ancestorId) => {
            const ancestor = layers[ancestorId];
            return ancestor && ancestor.visible && ancestor.expanded;
        });

        if (allAncestorsVisible) {
            visibleLayers.push(layerId);
        }
    };

    // Process layers in order
    layerOrder.forEach(addVisibleLayer);

    return visibleLayers;
}

// Export the utility object that matches the interface
export const layerHierarchyUtils: LayerHierarchyUtils = {
    buildLayerTree,
    getLayerPath,
    getLayerDescendants,
    getLayerAncestors,
    canMoveLayer,
    calculateNewOrder,
};

// Individual exports for convenience
export { getNextLayerName, getVisibleLayers, validateLayerHierarchy };
