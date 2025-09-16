import type {
    CanvasObject,
    CoordinateDisplay,
    PrecisionInputValue,
    PrecisionValueConstraints,
    Transform,
    UnitType,
} from "../types/editor";

// Unit conversion factors (to pixels)
const UNIT_CONVERSION_FACTORS: Record<UnitType, number> = {
    px: 1,
    pt: 1.333333, // 1 point = 1.333333 pixels (at 96 DPI)
    in: 96, // 1 inch = 96 pixels (at 96 DPI)
    cm: 37.795276, // 1 cm = 37.795276 pixels (at 96 DPI)
    mm: 3.7795276, // 1 mm = 3.7795276 pixels (at 96 DPI)
};

/**
 * Convert a value from one unit to another
 */
export function convertUnit(value: number, fromUnit: UnitType, toUnit: UnitType): number {
    if (fromUnit === toUnit) return value;

    // Convert to pixels first, then to target unit
    const pixelValue = value * UNIT_CONVERSION_FACTORS[fromUnit];
    return pixelValue / UNIT_CONVERSION_FACTORS[toUnit];
}

/**
 * Format a number value with precision
 */
export function formatPrecisionValue(value: number, precision: number = 2): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Validate a precision input value against constraints
 */
export function validatePrecisionValue(
    value: number,
    constraints: PrecisionValueConstraints = {}
): { isValid: boolean; clampedValue: number; error?: string } {
    const { min, max, step, precision } = constraints;

    let clampedValue = value;
    let error: string | undefined;

    // Apply precision formatting
    if (precision !== undefined) {
        clampedValue = formatPrecisionValue(clampedValue, precision);
    }

    // Check minimum value
    if (min !== undefined && clampedValue < min) {
        clampedValue = min;
        error = `Value cannot be less than ${min}`;
    }

    // Check maximum value
    if (max !== undefined && clampedValue > max) {
        clampedValue = max;
        error = `Value cannot be greater than ${max}`;
    }

    // Check step value
    if (step !== undefined && step > 0) {
        const remainder = clampedValue % step;
        if (remainder !== 0) {
            clampedValue = Math.round(clampedValue / step) * step;
            if (precision !== undefined) {
                clampedValue = formatPrecisionValue(clampedValue, precision);
            }
        }
    }

    return {
        isValid: !error,
        clampedValue,
        error,
    };
}

/**
 * Parse a string input value to a number with validation
 */
export function parsePrecisionInput(
    input: string,
    constraints: PrecisionValueConstraints = {}
): { value: number; isValid: boolean; error?: string } {
    const trimmed = input.trim();

    if (trimmed === "") {
        return { value: 0, isValid: false, error: "Value is required" };
    }

    const parsed = parseFloat(trimmed);

    if (isNaN(parsed)) {
        return { value: 0, isValid: false, error: "Invalid number format" };
    }

    const validation = validatePrecisionValue(parsed, constraints);

    return {
        value: validation.clampedValue,
        isValid: validation.isValid,
        error: validation.error,
    };
}

/**
 * Calculate the center position of selected objects
 */
export function calculateSelectionCenter(objects: CanvasObject[]): { x: number; y: number } {
    if (objects.length === 0) {
        return { x: 0, y: 0 };
    }

    if (objects.length === 1) {
        const obj = objects[0];
        return {
            x: obj.transform.x,
            y: obj.transform.y,
        };
    }

    // Calculate average position for multiple objects
    const total = objects.reduce(
        (acc, obj) => ({
            x: acc.x + obj.transform.x,
            y: acc.y + obj.transform.y,
        }),
        { x: 0, y: 0 }
    );

    return {
        x: total.x / objects.length,
        y: total.y / objects.length,
    };
}

/**
 * Calculate the bounding box of selected objects
 */
export function calculateSelectionBounds(objects: CanvasObject[]): {
    x: number;
    y: number;
    width: number;
    height: number;
} {
    if (objects.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach((obj) => {
        const objMinX = obj.transform.x;
        const objMinY = obj.transform.y;

        let objMaxX = objMinX;
        let objMaxY = objMinY;

        // Calculate object bounds based on type
        if (obj.type === "rectangle") {
            objMaxX = objMinX + obj.width;
            objMaxY = objMinY + obj.height;
        } else if (obj.type === "circle") {
            objMaxX = objMinX + obj.radius * 2;
            objMaxY = objMinY + obj.radius * 2;
        } else if (obj.type === "text") {
            // For text, we'll use approximate bounds based on font size
            // This is simplified - actual text bounds would require measuring
            const approximateWidth = obj.content.length * obj.style.fontSize * 0.6;
            const approximateHeight = obj.style.fontSize * obj.style.lineHeight;
            objMaxX = objMinX + approximateWidth;
            objMaxY = objMinY + approximateHeight;
        }
        // For path and group objects, we'd need more complex calculations

        minX = Math.min(minX, objMinX);
        minY = Math.min(minY, objMinY);
        maxX = Math.max(maxX, objMaxX);
        maxY = Math.max(maxY, objMaxY);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * Create a coordinate display object
 */
export function createCoordinateDisplay(x: number, y: number, unit: UnitType): CoordinateDisplay {
    return { x, y, unit };
}

/**
 * Create a precision input value object
 */
export function createPrecisionInputValue(value: number, unit: UnitType): PrecisionInputValue {
    return { value, unit };
}

/**
 * Apply transform updates to multiple objects while maintaining relative positions
 */
export function applyTransformToObjects(
    objects: CanvasObject[],
    transformUpdate: Partial<Transform>,
    options: {
        maintainRelativePositions?: boolean;
        anchorPoint?: { x: number; y: number };
    } = {}
): Array<{ id: string; transform: Partial<Transform> }> {
    if (objects.length === 0) return [];

    const { maintainRelativePositions = true, anchorPoint } = options;

    if (objects.length === 1 || !maintainRelativePositions) {
        // Simple case: apply transform directly to each object
        return objects.map((obj) => ({
            id: obj.id,
            transform: transformUpdate,
        }));
    }

    // Complex case: maintain relative positions
    const center = anchorPoint || calculateSelectionCenter(objects);

    return objects.map((obj) => {
        let updatedTransform = { ...transformUpdate };

        // If updating position, maintain relative offsets from center
        if (transformUpdate.x !== undefined || transformUpdate.y !== undefined) {
            const offsetX = obj.transform.x - center.x;
            const offsetY = obj.transform.y - center.y;

            updatedTransform = {
                ...updatedTransform,
                x: (transformUpdate.x ?? center.x) + offsetX,
                y: (transformUpdate.y ?? center.y) + offsetY,
            };
        }

        return {
            id: obj.id,
            transform: updatedTransform,
        };
    });
}

/**
 * Get constraints for different transform properties
 */
export function getTransformConstraints(property: keyof Transform): PrecisionValueConstraints {
    switch (property) {
        case "x":
        case "y":
            return {
                precision: 2,
                step: 0.5,
            };
        case "rotation":
            return {
                min: 0,
                max: 360,
                precision: 1,
                step: 1,
            };
        case "scaleX":
        case "scaleY":
            return {
                min: 0.01,
                max: 100,
                precision: 2,
                step: 0.01,
            };
        case "originX":
        case "originY":
            return {
                min: 0,
                max: 1,
                precision: 2,
                step: 0.01,
            };
        default:
            return {
                precision: 2,
            };
    }
}

/**
 * Get constraints for object dimension properties
 */
export function getDimensionConstraints(property: string): PrecisionValueConstraints {
    switch (property) {
        case "width":
        case "height":
            return {
                min: 1,
                precision: 2,
                step: 0.5,
            };
        case "radius":
            return {
                min: 0,
                precision: 2,
                step: 0.5,
            };
        case "borderRadius":
            return {
                min: 0,
                precision: 2,
                step: 0.5,
            };
        default:
            return {
                min: 0,
                precision: 2,
            };
    }
}
