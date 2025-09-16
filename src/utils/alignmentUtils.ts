import { CanvasObject } from "../types/editor";

export interface AlignmentOptions {
    // Object to align relative to (if not provided, align to selection bounds)
    target?: CanvasObject;
    // Whether to use the canvas bounds as alignment target
    alignToCanvas?: boolean;
    canvasWidth?: number;
    canvasHeight?: number;
}

export interface DistributionOptions {
    // Spacing between objects (if not provided, distribute evenly)
    spacing?: number;
    // Whether to use object centers or edges for distribution
    useCenter?: boolean;
}

/**
 * Calculate the bounding rectangle for an object
 */
export function getObjectBounds(object: CanvasObject): { x: number; y: number; width: number; height: number } {
    switch (object.type) {
        case "rectangle":
            return {
                x: object.transform.x,
                y: object.transform.y,
                width: object.width,
                height: object.height,
            };
        case "circle":
            return {
                x: object.transform.x - object.radius,
                y: object.transform.y - object.radius,
                width: object.radius * 2,
                height: object.radius * 2,
            };
        case "text":
            // For text, we'll need to estimate bounds based on font size
            // This is a simplified calculation
            const estimatedWidth = object.content.length * object.style.fontSize * 0.6;
            const estimatedHeight = object.style.fontSize;
            return {
                x: object.transform.x,
                y: object.transform.y - estimatedHeight,
                width: estimatedWidth,
                height: estimatedHeight,
            };
        case "path":
            // For paths, we need to calculate the bounding box from the path data
            // This is a simplified implementation
            return {
                x: object.transform.x,
                y: object.transform.y,
                width: 100, // Fallback values
                height: 100,
            };
        default:
            return { x: 0, y: 0, width: 0, height: 0 };
    }
}

/**
 * Calculate the bounding rectangle for multiple objects
 */
export function getSelectionBounds(objects: CanvasObject[]): { x: number; y: number; width: number; height: number } {
    if (objects.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach((object) => {
        const bounds = getObjectBounds(object);
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * Align objects to the left
 */
export function alignLeft(objects: CanvasObject[], options: AlignmentOptions = {}): CanvasObject[] {
    if (objects.length === 0) return objects;

    let targetX: number;

    if (options.alignToCanvas && options.canvasWidth) {
        targetX = 0;
    } else if (options.target) {
        const targetBounds = getObjectBounds(options.target);
        targetX = targetBounds.x;
    } else {
        const selectionBounds = getSelectionBounds(objects);
        targetX = selectionBounds.x;
    }

    return objects.map((object) => {
        const bounds = getObjectBounds(object);
        const deltaX = targetX - bounds.x;

        return {
            ...object,
            transform: {
                ...object.transform,
                x: object.transform.x + deltaX,
            },
        };
    });
}

/**
 * Align objects to the right
 */
export function alignRight(objects: CanvasObject[], options: AlignmentOptions = {}): CanvasObject[] {
    if (objects.length === 0) return objects;

    let targetX: number;

    if (options.alignToCanvas && options.canvasWidth) {
        targetX = options.canvasWidth;
    } else if (options.target) {
        const targetBounds = getObjectBounds(options.target);
        targetX = targetBounds.x + targetBounds.width;
    } else {
        const selectionBounds = getSelectionBounds(objects);
        targetX = selectionBounds.x + selectionBounds.width;
    }

    return objects.map((object) => {
        const bounds = getObjectBounds(object);
        const deltaX = targetX - (bounds.x + bounds.width);

        return {
            ...object,
            transform: {
                ...object.transform,
                x: object.transform.x + deltaX,
            },
        };
    });
}

/**
 * Align objects to the center horizontally
 */
export function alignCenterHorizontal(objects: CanvasObject[], options: AlignmentOptions = {}): CanvasObject[] {
    if (objects.length === 0) return objects;

    let targetCenterX: number;

    if (options.alignToCanvas && options.canvasWidth) {
        targetCenterX = options.canvasWidth / 2;
    } else if (options.target) {
        const targetBounds = getObjectBounds(options.target);
        targetCenterX = targetBounds.x + targetBounds.width / 2;
    } else {
        const selectionBounds = getSelectionBounds(objects);
        targetCenterX = selectionBounds.x + selectionBounds.width / 2;
    }

    return objects.map((object) => {
        const bounds = getObjectBounds(object);
        const objectCenterX = bounds.x + bounds.width / 2;
        const deltaX = targetCenterX - objectCenterX;

        return {
            ...object,
            transform: {
                ...object.transform,
                x: object.transform.x + deltaX,
            },
        };
    });
}

/**
 * Align objects to the top
 */
export function alignTop(objects: CanvasObject[], options: AlignmentOptions = {}): CanvasObject[] {
    if (objects.length === 0) return objects;

    let targetY: number;

    if (options.alignToCanvas && options.canvasHeight) {
        targetY = 0;
    } else if (options.target) {
        const targetBounds = getObjectBounds(options.target);
        targetY = targetBounds.y;
    } else {
        const selectionBounds = getSelectionBounds(objects);
        targetY = selectionBounds.y;
    }

    return objects.map((object) => {
        const bounds = getObjectBounds(object);
        const deltaY = targetY - bounds.y;

        return {
            ...object,
            transform: {
                ...object.transform,
                y: object.transform.y + deltaY,
            },
        };
    });
}

/**
 * Align objects to the bottom
 */
export function alignBottom(objects: CanvasObject[], options: AlignmentOptions = {}): CanvasObject[] {
    if (objects.length === 0) return objects;

    let targetY: number;

    if (options.alignToCanvas && options.canvasHeight) {
        targetY = options.canvasHeight;
    } else if (options.target) {
        const targetBounds = getObjectBounds(options.target);
        targetY = targetBounds.y + targetBounds.height;
    } else {
        const selectionBounds = getSelectionBounds(objects);
        targetY = selectionBounds.y + selectionBounds.height;
    }

    return objects.map((object) => {
        const bounds = getObjectBounds(object);
        const deltaY = targetY - (bounds.y + bounds.height);

        return {
            ...object,
            transform: {
                ...object.transform,
                y: object.transform.y + deltaY,
            },
        };
    });
}

/**
 * Align objects to the center vertically
 */
export function alignCenterVertical(objects: CanvasObject[], options: AlignmentOptions = {}): CanvasObject[] {
    if (objects.length === 0) return objects;

    let targetCenterY: number;

    if (options.alignToCanvas && options.canvasHeight) {
        targetCenterY = options.canvasHeight / 2;
    } else if (options.target) {
        const targetBounds = getObjectBounds(options.target);
        targetCenterY = targetBounds.y + targetBounds.height / 2;
    } else {
        const selectionBounds = getSelectionBounds(objects);
        targetCenterY = selectionBounds.y + selectionBounds.height / 2;
    }

    return objects.map((object) => {
        const bounds = getObjectBounds(object);
        const objectCenterY = bounds.y + bounds.height / 2;
        const deltaY = targetCenterY - objectCenterY;

        return {
            ...object,
            transform: {
                ...object.transform,
                y: object.transform.y + deltaY,
            },
        };
    });
}

/**
 * Distribute objects horizontally with equal spacing
 */
export function distributeHorizontal(objects: CanvasObject[], options: DistributionOptions = {}): CanvasObject[] {
    if (objects.length < 3) return objects; // Need at least 3 objects to distribute

    const sortedObjects = [...objects].sort((a, b) => {
        const boundsA = getObjectBounds(a);
        const boundsB = getObjectBounds(b);
        return options.useCenter
            ? boundsA.x + boundsA.width / 2 - (boundsB.x + boundsB.width / 2)
            : boundsA.x - boundsB.x;
    });

    const firstBounds = getObjectBounds(sortedObjects[0]);
    const lastBounds = getObjectBounds(sortedObjects[sortedObjects.length - 1]);

    const totalSpace = options.useCenter
        ? lastBounds.x + lastBounds.width / 2 - (firstBounds.x + firstBounds.width / 2)
        : lastBounds.x + lastBounds.width - firstBounds.x;

    const spaceBetween = totalSpace / (sortedObjects.length - 1);

    return sortedObjects.map((object, index) => {
        if (index === 0 || index === sortedObjects.length - 1) {
            return object; // Don't move first and last objects
        }

        const bounds = getObjectBounds(object);
        let targetX: number;

        if (options.useCenter) {
            const firstCenterX = firstBounds.x + firstBounds.width / 2;
            const targetCenterX = firstCenterX + spaceBetween * index;
            const currentCenterX = bounds.x + bounds.width / 2;
            targetX = object.transform.x + (targetCenterX - currentCenterX);
        } else {
            targetX = firstBounds.x + spaceBetween * index;
        }

        return {
            ...object,
            transform: {
                ...object.transform,
                x: targetX,
            },
        };
    });
}

/**
 * Distribute objects vertically with equal spacing
 */
export function distributeVertical(objects: CanvasObject[], options: DistributionOptions = {}): CanvasObject[] {
    if (objects.length < 3) return objects; // Need at least 3 objects to distribute

    const sortedObjects = [...objects].sort((a, b) => {
        const boundsA = getObjectBounds(a);
        const boundsB = getObjectBounds(b);
        return options.useCenter
            ? boundsA.y + boundsA.height / 2 - (boundsB.y + boundsB.height / 2)
            : boundsA.y - boundsB.y;
    });

    const firstBounds = getObjectBounds(sortedObjects[0]);
    const lastBounds = getObjectBounds(sortedObjects[sortedObjects.length - 1]);

    const totalSpace = options.useCenter
        ? lastBounds.y + lastBounds.height / 2 - (firstBounds.y + firstBounds.height / 2)
        : lastBounds.y + lastBounds.height - firstBounds.y;

    const spaceBetween = totalSpace / (sortedObjects.length - 1);

    return sortedObjects.map((object, index) => {
        if (index === 0 || index === sortedObjects.length - 1) {
            return object; // Don't move first and last objects
        }

        const bounds = getObjectBounds(object);
        let targetY: number;

        if (options.useCenter) {
            const firstCenterY = firstBounds.y + firstBounds.height / 2;
            const targetCenterY = firstCenterY + spaceBetween * index;
            const currentCenterY = bounds.y + bounds.height / 2;
            targetY = object.transform.y + (targetCenterY - currentCenterY);
        } else {
            targetY = firstBounds.y + spaceBetween * index;
        }

        return {
            ...object,
            transform: {
                ...object.transform,
                y: targetY,
            },
        };
    });
}
