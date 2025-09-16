/**
 * Smart guides and object snapping utilities for precise alignment
 */

export interface SmartGuide {
    id: string;
    type: "horizontal" | "vertical";
    position: number;
    objects: string[]; // IDs of objects that align to this guide
    visible: boolean;
}

export interface ObjectSnapResult {
    x: number;
    y: number;
    snapped: boolean;
    snapType?: "edge-left" | "edge-right" | "edge-top" | "edge-bottom" | "center-x" | "center-y";
    guides: SmartGuide[];
}

export interface ObjectBounds {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface SmartSnapOptions {
    enabled: boolean;
    threshold: number; // Distance within which snapping occurs
    showGuides: boolean;
    snapToEdges: boolean;
    snapToCenter: boolean;
}

/**
 * Calculate bounds for an object
 */
export function calculateObjectBounds(obj: any): ObjectBounds {
    const x = obj.transform?.x || 0;
    const y = obj.transform?.y || 0;
    const width = obj.width || 0;
    const height = obj.height || obj.radius ? obj.radius * 2 : 0;

    return {
        id: obj.id,
        x,
        y,
        width,
        height,
        centerX: x + width / 2,
        centerY: y + height / 2,
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
    };
}

/**
 * Generate smart guides based on object positions
 */
export function generateSmartGuides(objects: any[], excludeId?: string): SmartGuide[] {
    const guides: SmartGuide[] = [];
    const bounds = objects.filter((obj) => obj.id !== excludeId).map(calculateObjectBounds);

    // Group objects by alignment positions
    const horizontalPositions = new Map<number, string[]>();
    const verticalPositions = new Map<number, string[]>();

    bounds.forEach((bound) => {
        // Horizontal guides (for vertical alignment)
        [bound.left, bound.centerX, bound.right].forEach((x) => {
            if (!horizontalPositions.has(x)) {
                horizontalPositions.set(x, []);
            }
            horizontalPositions.get(x)!.push(bound.id);
        });

        // Vertical guides (for horizontal alignment)
        [bound.top, bound.centerY, bound.bottom].forEach((y) => {
            if (!verticalPositions.has(y)) {
                verticalPositions.set(y, []);
            }
            verticalPositions.get(y)!.push(bound.id);
        });
    });

    // Create guides for positions with multiple objects
    horizontalPositions.forEach((objectIds, position) => {
        if (objectIds.length >= 1) {
            // Show guide even for single object to help with alignment
            guides.push({
                id: `vertical-${position}`,
                type: "vertical",
                position,
                objects: objectIds,
                visible: false, // Will be set to true when snapping
            });
        }
    });

    verticalPositions.forEach((objectIds, position) => {
        if (objectIds.length >= 1) {
            guides.push({
                id: `horizontal-${position}`,
                type: "horizontal",
                position,
                objects: objectIds,
                visible: false,
            });
        }
    });

    return guides;
}

/**
 * Find snap candidates for an object
 */
export function findSnapCandidates(
    objectBounds: ObjectBounds,
    otherObjects: any[],
    options: SmartSnapOptions
): ObjectSnapResult {
    if (!options.enabled) {
        return {
            x: objectBounds.x,
            y: objectBounds.y,
            snapped: false,
            guides: [],
        };
    }

    const guides = generateSmartGuides(otherObjects);
    const threshold = options.threshold;

    let bestSnapX = objectBounds.x;
    let bestSnapY = objectBounds.y;
    let snapped = false;
    let snapType: ObjectSnapResult["snapType"];
    const activeGuides: SmartGuide[] = [];

    // Test snapping to vertical guides (left, center, right edges)
    if (options.snapToEdges || options.snapToCenter) {
        guides.forEach((guide) => {
            if (guide.type === "vertical") {
                const snapPositions: Array<{
                    position: number;
                    targetX: number;
                    type: "edge-left" | "edge-right" | "center-x";
                }> = [];

                if (options.snapToEdges) {
                    // Snap left edge to guide
                    snapPositions.push({
                        position: guide.position,
                        targetX: guide.position,
                        type: "edge-left",
                    });

                    // Snap right edge to guide
                    snapPositions.push({
                        position: guide.position,
                        targetX: guide.position - objectBounds.width,
                        type: "edge-right",
                    });
                }

                if (options.snapToCenter) {
                    // Snap center to guide
                    snapPositions.push({
                        position: guide.position,
                        targetX: guide.position - objectBounds.width / 2,
                        type: "center-x",
                    });
                }

                snapPositions.forEach((snap) => {
                    const distance = Math.abs(objectBounds.x - snap.targetX);
                    if (distance <= threshold && distance < Math.abs(objectBounds.x - bestSnapX)) {
                        bestSnapX = snap.targetX;
                        snapType = snap.type;
                        snapped = true;

                        // Mark guide as active
                        const activeGuide = { ...guide, visible: true };
                        activeGuides.push(activeGuide);
                    }
                });
            }
        });
    }

    // Test snapping to horizontal guides (top, center, bottom edges)
    if (options.snapToEdges || options.snapToCenter) {
        guides.forEach((guide) => {
            if (guide.type === "horizontal") {
                const snapPositions: Array<{
                    position: number;
                    targetY: number;
                    type: "edge-top" | "edge-bottom" | "center-y";
                }> = [];

                if (options.snapToEdges) {
                    // Snap top edge to guide
                    snapPositions.push({
                        position: guide.position,
                        targetY: guide.position,
                        type: "edge-top",
                    });

                    // Snap bottom edge to guide
                    snapPositions.push({
                        position: guide.position,
                        targetY: guide.position - objectBounds.height,
                        type: "edge-bottom",
                    });
                }

                if (options.snapToCenter) {
                    // Snap center to guide
                    snapPositions.push({
                        position: guide.position,
                        targetY: guide.position - objectBounds.height / 2,
                        type: "center-y",
                    });
                }

                snapPositions.forEach((snap) => {
                    const distance = Math.abs(objectBounds.y - snap.targetY);
                    if (distance <= threshold && distance < Math.abs(objectBounds.y - bestSnapY)) {
                        bestSnapY = snap.targetY;
                        snapType = snap.type;
                        snapped = true;

                        // Mark guide as active
                        const activeGuide = { ...guide, visible: true };
                        activeGuides.push(activeGuide);
                    }
                });
            }
        });
    }

    return {
        x: bestSnapX,
        y: bestSnapY,
        snapped,
        snapType,
        guides: activeGuides,
    };
}

/**
 * Snap an object to other objects using smart guides
 */
export function snapObjectToObjects(object: any, otherObjects: any[], options: SmartSnapOptions): ObjectSnapResult {
    const objectBounds = calculateObjectBounds(object);
    const filteredObjects = otherObjects.filter((obj) => obj.id !== object.id);

    return findSnapCandidates(objectBounds, filteredObjects, options);
}
