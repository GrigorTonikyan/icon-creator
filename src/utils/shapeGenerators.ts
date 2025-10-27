import type {
    ShapeGenerator,
    ShapeGeneratorConfig,
    ShapeParameter,
    ShapePreset,
    ShapeGeneratorResult,
    GeneratedShape,
    ShapeStyle,
    Point,
} from "../types/editor";

/**
 * Built-in shape generators for the custom shape extension system
 * Provides procedural generation of complex shapes with customizable parameters
 */

// Utility functions for shape generation
export const ShapeGeneratorUtils = {
    /**
     * Generate SVG path data for a regular polygon
     */
    generatePolygon(
        sides: number,
        radius: number,
        centerX: number = 0,
        centerY: number = 0,
        rotation: number = 0
    ): string {
        if (sides < 3) return "";

        const angleStep = (2 * Math.PI) / sides;
        const rotationRad = (rotation * Math.PI) / 180;

        let pathData = "";

        for (let i = 0; i < sides; i++) {
            const angle = i * angleStep + rotationRad;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            if (i === 0) {
                pathData += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
            } else {
                pathData += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
            }
        }

        pathData += " Z";
        return pathData;
    },

    /**
     * Generate SVG path data for a star shape
     */
    generateStar(
        points: number,
        outerRadius: number,
        innerRadius: number,
        centerX: number = 0,
        centerY: number = 0,
        rotation: number = 0
    ): string {
        if (points < 3) return "";

        const angleStep = Math.PI / points;
        const rotationRad = (rotation * Math.PI) / 180;

        let pathData = "";

        for (let i = 0; i < points * 2; i++) {
            const angle = i * angleStep + rotationRad;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            if (i === 0) {
                pathData += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
            } else {
                pathData += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
            }
        }

        pathData += " Z";
        return pathData;
    },

    /**
     * Generate SVG path data for a gear shape
     */
    generateGear(
        teeth: number,
        outerRadius: number,
        innerRadius: number,
        toothHeight: number,
        centerX: number = 0,
        centerY: number = 0,
        rotation: number = 0
    ): string {
        if (teeth < 3) return "";

        const angleStep = (2 * Math.PI) / teeth;
        const toothAngle = angleStep * 0.3; // Tooth width
        const rotationRad = (rotation * Math.PI) / 180;

        let pathData = "";

        for (let i = 0; i < teeth; i++) {
            const baseAngle = i * angleStep + rotationRad;

            // Inner circle point
            const innerAngle1 = baseAngle - toothAngle / 2;
            const innerX1 = centerX + innerRadius * Math.cos(innerAngle1);
            const innerY1 = centerY + innerRadius * Math.sin(innerAngle1);

            // Tooth tip
            const toothAngle1 = baseAngle - toothAngle / 4;
            const toothX1 = centerX + (outerRadius + toothHeight) * Math.cos(toothAngle1);
            const toothY1 = centerY + (outerRadius + toothHeight) * Math.sin(toothAngle1);

            const toothAngle2 = baseAngle + toothAngle / 4;
            const toothX2 = centerX + (outerRadius + toothHeight) * Math.cos(toothAngle2);
            const toothY2 = centerY + (outerRadius + toothHeight) * Math.sin(toothAngle2);

            // Inner circle point
            const innerAngle2 = baseAngle + toothAngle / 2;
            const innerX2 = centerX + innerRadius * Math.cos(innerAngle2);
            const innerY2 = centerY + innerRadius * Math.sin(innerAngle2);

            if (i === 0) {
                pathData += `M ${innerX1.toFixed(2)} ${innerY1.toFixed(2)}`;
            } else {
                pathData += ` L ${innerX1.toFixed(2)} ${innerY1.toFixed(2)}`;
            }

            pathData += ` L ${toothX1.toFixed(2)} ${toothY1.toFixed(2)}`;
            pathData += ` L ${toothX2.toFixed(2)} ${toothY2.toFixed(2)}`;
            pathData += ` L ${innerX2.toFixed(2)} ${innerY2.toFixed(2)}`;
        }

        pathData += " Z";
        return pathData;
    },

    /**
     * Generate SVG path data for an arrow shape
     */
    generateArrow(
        length: number,
        width: number,
        headLength: number,
        headWidth: number,
        centerX: number = 0,
        centerY: number = 0,
        rotation: number = 0
    ): string {
        const shaftWidth = width;
        const shaftLength = length - headLength;

        // Arrow points (facing right)
        const points = [
            [-length / 2, -shaftWidth / 2],
            [shaftLength / 2, -shaftWidth / 2],
            [shaftLength / 2, -headWidth / 2],
            [length / 2, 0],
            [shaftLength / 2, headWidth / 2],
            [shaftLength / 2, shaftWidth / 2],
            [-length / 2, shaftWidth / 2],
        ];

        // Apply rotation
        const rotationRad = (rotation * Math.PI) / 180;
        const rotatedPoints = points.map(([x, y]) => {
            const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
            const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);
            return [centerX + rotatedX, centerY + rotatedY];
        });

        let pathData = `M ${rotatedPoints[0][0].toFixed(2)} ${rotatedPoints[0][1].toFixed(2)}`;
        for (let i = 1; i < rotatedPoints.length; i++) {
            pathData += ` L ${rotatedPoints[i][0].toFixed(2)} ${rotatedPoints[i][1].toFixed(2)}`;
        }
        pathData += " Z";

        return pathData;
    },

    /**
     * Generate SVG path data for a speech bubble
     */
    generateSpeechBubble(
        width: number,
        height: number,
        cornerRadius: number,
        tailWidth: number,
        tailHeight: number,
        tailPosition: number,
        centerX: number = 0,
        centerY: number = 0
    ): string {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const x = centerX - halfWidth;
        const y = centerY - halfHeight;

        // Tail position as percentage of width (0-1)
        const tailX = x + tailPosition * width;
        const tailY = y + height;

        let pathData = `M ${(x + cornerRadius).toFixed(2)} ${y.toFixed(2)}`;
        pathData += ` L ${(x + width - cornerRadius).toFixed(2)} ${y.toFixed(2)}`;
        pathData += ` Q ${(x + width).toFixed(2)} ${y.toFixed(2)} ${(x + width).toFixed(2)} ${(
            y + cornerRadius
        ).toFixed(2)}`;
        pathData += ` L ${(x + width).toFixed(2)} ${(y + height - cornerRadius).toFixed(2)}`;
        pathData += ` Q ${(x + width).toFixed(2)} ${(y + height).toFixed(2)} ${(x + width - cornerRadius).toFixed(
            2
        )} ${(y + height).toFixed(2)}`;

        // Tail
        if (tailPosition > 0.1 && tailPosition < 0.9) {
            pathData += ` L ${(tailX + tailWidth / 2).toFixed(2)} ${tailY.toFixed(2)}`;
            pathData += ` L ${tailX.toFixed(2)} ${(tailY + tailHeight).toFixed(2)}`;
            pathData += ` L ${(tailX - tailWidth / 2).toFixed(2)} ${tailY.toFixed(2)}`;
        }

        pathData += ` L ${(x + cornerRadius).toFixed(2)} ${(y + height).toFixed(2)}`;
        pathData += ` Q ${x.toFixed(2)} ${(y + height).toFixed(2)} ${x.toFixed(2)} ${(
            y +
            height -
            cornerRadius
        ).toFixed(2)}`;
        pathData += ` L ${x.toFixed(2)} ${(y + cornerRadius).toFixed(2)}`;
        pathData += ` Q ${x.toFixed(2)} ${y.toFixed(2)} ${(x + cornerRadius).toFixed(2)} ${y.toFixed(2)}`;
        pathData += " Z";

        return pathData;
    },

    /**
     * Validate parameters against their definitions
     */
    validateParameters(parameters: Record<string, any>, parameterDefinitions: ShapeParameter[]): string[] {
        const errors: string[] = [];

        for (const param of parameterDefinitions) {
            const value = parameters[param.id];

            if (value === undefined || value === null) {
                errors.push(`Parameter '${param.name}' is required`);
                continue;
            }

            switch (param.type) {
                case "number":
                case "range":
                    if (typeof value !== "number" || isNaN(value)) {
                        errors.push(`Parameter '${param.name}' must be a number`);
                    } else {
                        if (param.min !== undefined && value < param.min) {
                            errors.push(`Parameter '${param.name}' must be at least ${param.min}`);
                        }
                        if (param.max !== undefined && value > param.max) {
                            errors.push(`Parameter '${param.name}' must be at most ${param.max}`);
                        }
                    }
                    break;

                case "boolean":
                    if (typeof value !== "boolean") {
                        errors.push(`Parameter '${param.name}' must be a boolean`);
                    }
                    break;

                case "color":
                    if (typeof value !== "string" || !value.match(/^#[0-9A-Fa-f]{6}$/)) {
                        errors.push(`Parameter '${param.name}' must be a valid hex color`);
                    }
                    break;

                case "select":
                    if (!param.options || !param.options.includes(value)) {
                        errors.push(`Parameter '${param.name}' must be one of: ${param.options?.join(", ")}`);
                    }
                    break;
            }
        }

        return errors;
    },
};

// Built-in shape generators

/**
 * Regular Polygon Generator
 */
export const PolygonGenerator: ShapeGenerator = {
    config: {
        id: "polygon",
        name: "Regular Polygon",
        description: "Generate regular polygons with customizable sides and size",
        category: "Basic Shapes",
        icon: "⬡",
        version: "1.0.0",
        tags: ["polygon", "geometry", "basic"],
        parameters: [
            {
                id: "sides",
                name: "Sides",
                type: "number",
                value: 6,
                min: 3,
                max: 20,
                step: 1,
                description: "Number of sides",
                category: "Shape",
            },
            {
                id: "radius",
                name: "Radius",
                type: "number",
                value: 50,
                min: 10,
                max: 200,
                step: 1,
                description: "Polygon radius",
                category: "Size",
            },
            {
                id: "rotation",
                name: "Rotation",
                type: "range",
                value: 0,
                min: 0,
                max: 360,
                step: 1,
                description: "Rotation angle in degrees",
                category: "Transform",
            },
        ],
        presets: [
            { id: "triangle", name: "Triangle", parameters: { sides: 3, radius: 50, rotation: 0 } },
            { id: "square", name: "Square", parameters: { sides: 4, radius: 50, rotation: 45 } },
            { id: "pentagon", name: "Pentagon", parameters: { sides: 5, radius: 50, rotation: 0 } },
            { id: "hexagon", name: "Hexagon", parameters: { sides: 6, radius: 50, rotation: 0 } },
            { id: "octagon", name: "Octagon", parameters: { sides: 8, radius: 50, rotation: 0 } },
        ],
    },

    generate: (parameters: Record<string, any>): ShapeGeneratorResult => {
        const errors = ShapeGeneratorUtils.validateParameters(parameters, PolygonGenerator.config.parameters);
        if (errors.length > 0) {
            return { success: false, error: errors.join(", ") };
        }

        const { sides, radius, rotation } = parameters;
        const pathData = ShapeGeneratorUtils.generatePolygon(sides, radius, 0, 0, rotation);

        return {
            success: true,
            shape: {
                pathData,
                style: {
                    fill: "#3b82f6",
                    stroke: "#1d4ed8",
                    strokeWidth: 2,
                },
            },
        };
    },

    validateParameters: (parameters: Record<string, any>) => {
        return ShapeGeneratorUtils.validateParameters(parameters, PolygonGenerator.config.parameters);
    },
};

/**
 * Star Generator
 */
export const StarGenerator: ShapeGenerator = {
    config: {
        id: "star",
        name: "Star",
        description: "Generate star shapes with customizable points and ratios",
        category: "Basic Shapes",
        icon: "⭐",
        version: "1.0.0",
        tags: ["star", "geometry", "basic"],
        parameters: [
            {
                id: "points",
                name: "Points",
                type: "number",
                value: 5,
                min: 3,
                max: 12,
                step: 1,
                description: "Number of star points",
                category: "Shape",
            },
            {
                id: "outerRadius",
                name: "Outer Radius",
                type: "number",
                value: 50,
                min: 20,
                max: 200,
                step: 1,
                description: "Outer radius of star points",
                category: "Size",
            },
            {
                id: "innerRadius",
                name: "Inner Radius",
                type: "number",
                value: 25,
                min: 5,
                max: 100,
                step: 1,
                description: "Inner radius of star",
                category: "Size",
            },
            {
                id: "rotation",
                name: "Rotation",
                type: "range",
                value: 0,
                min: 0,
                max: 360,
                step: 1,
                description: "Rotation angle in degrees",
                category: "Transform",
            },
        ],
        presets: [
            {
                id: "five-star",
                name: "5-Point Star",
                parameters: { points: 5, outerRadius: 50, innerRadius: 20, rotation: 0 },
            },
            {
                id: "six-star",
                name: "6-Point Star",
                parameters: { points: 6, outerRadius: 50, innerRadius: 25, rotation: 0 },
            },
            {
                id: "eight-star",
                name: "8-Point Star",
                parameters: { points: 8, outerRadius: 50, innerRadius: 30, rotation: 0 },
            },
        ],
    },

    generate: (parameters: Record<string, any>): ShapeGeneratorResult => {
        const errors = ShapeGeneratorUtils.validateParameters(parameters, StarGenerator.config.parameters);
        if (errors.length > 0) {
            return { success: false, error: errors.join(", ") };
        }

        const { points, outerRadius, innerRadius, rotation } = parameters;
        const pathData = ShapeGeneratorUtils.generateStar(points, outerRadius, innerRadius, 0, 0, rotation);

        return {
            success: true,
            shape: {
                pathData,
                style: {
                    fill: "#fbbf24",
                    stroke: "#f59e0b",
                    strokeWidth: 2,
                },
            },
        };
    },

    validateParameters: (parameters: Record<string, any>) => {
        return ShapeGeneratorUtils.validateParameters(parameters, StarGenerator.config.parameters);
    },
};

/**
 * Gear Generator
 */
export const GearGenerator: ShapeGenerator = {
    config: {
        id: "gear",
        name: "Gear",
        description: "Generate mechanical gear shapes with customizable teeth",
        category: "Mechanical",
        icon: "⚙️",
        version: "1.0.0",
        tags: ["gear", "mechanical", "engineering"],
        parameters: [
            {
                id: "teeth",
                name: "Teeth",
                type: "number",
                value: 12,
                min: 6,
                max: 30,
                step: 1,
                description: "Number of gear teeth",
                category: "Shape",
            },
            {
                id: "outerRadius",
                name: "Outer Radius",
                type: "number",
                value: 40,
                min: 20,
                max: 150,
                step: 1,
                description: "Base gear radius",
                category: "Size",
            },
            {
                id: "innerRadius",
                name: "Inner Radius",
                type: "number",
                value: 20,
                min: 5,
                max: 100,
                step: 1,
                description: "Inner hole radius",
                category: "Size",
            },
            {
                id: "toothHeight",
                name: "Tooth Height",
                type: "number",
                value: 8,
                min: 2,
                max: 20,
                step: 1,
                description: "Height of gear teeth",
                category: "Shape",
            },
            {
                id: "rotation",
                name: "Rotation",
                type: "range",
                value: 0,
                min: 0,
                max: 360,
                step: 1,
                description: "Rotation angle in degrees",
                category: "Transform",
            },
        ],
        presets: [
            {
                id: "small-gear",
                name: "Small Gear",
                parameters: { teeth: 8, outerRadius: 30, innerRadius: 10, toothHeight: 5, rotation: 0 },
            },
            {
                id: "medium-gear",
                name: "Medium Gear",
                parameters: { teeth: 12, outerRadius: 40, innerRadius: 15, toothHeight: 8, rotation: 0 },
            },
            {
                id: "large-gear",
                name: "Large Gear",
                parameters: { teeth: 20, outerRadius: 60, innerRadius: 20, toothHeight: 10, rotation: 0 },
            },
        ],
    },

    generate: (parameters: Record<string, any>): ShapeGeneratorResult => {
        const errors = ShapeGeneratorUtils.validateParameters(parameters, GearGenerator.config.parameters);
        if (errors.length > 0) {
            return { success: false, error: errors.join(", ") };
        }

        const { teeth, outerRadius, innerRadius, toothHeight, rotation } = parameters;
        const pathData = ShapeGeneratorUtils.generateGear(teeth, outerRadius, innerRadius, toothHeight, 0, 0, rotation);

        return {
            success: true,
            shape: {
                pathData,
                style: {
                    fill: "#6b7280",
                    stroke: "#374151",
                    strokeWidth: 2,
                },
            },
        };
    },

    validateParameters: (parameters: Record<string, any>) => {
        return ShapeGeneratorUtils.validateParameters(parameters, GearGenerator.config.parameters);
    },
};

/**
 * Arrow Generator
 */
export const ArrowGenerator: ShapeGenerator = {
    config: {
        id: "arrow",
        name: "Arrow",
        description: "Generate arrow shapes with customizable proportions",
        category: "UI Elements",
        icon: "→",
        version: "1.0.0",
        tags: ["arrow", "ui", "direction", "navigation"],
        parameters: [
            {
                id: "length",
                name: "Length",
                type: "number",
                value: 100,
                min: 30,
                max: 300,
                step: 1,
                description: "Total arrow length",
                category: "Size",
            },
            {
                id: "width",
                name: "Shaft Width",
                type: "number",
                value: 20,
                min: 5,
                max: 50,
                step: 1,
                description: "Width of arrow shaft",
                category: "Size",
            },
            {
                id: "headLength",
                name: "Head Length",
                type: "number",
                value: 30,
                min: 10,
                max: 80,
                step: 1,
                description: "Length of arrow head",
                category: "Shape",
            },
            {
                id: "headWidth",
                name: "Head Width",
                type: "number",
                value: 40,
                min: 15,
                max: 100,
                step: 1,
                description: "Width of arrow head",
                category: "Shape",
            },
            {
                id: "rotation",
                name: "Rotation",
                type: "range",
                value: 0,
                min: 0,
                max: 360,
                step: 1,
                description: "Rotation angle in degrees",
                category: "Transform",
            },
        ],
        presets: [
            {
                id: "right-arrow",
                name: "Right Arrow",
                parameters: { length: 100, width: 20, headLength: 30, headWidth: 40, rotation: 0 },
            },
            {
                id: "up-arrow",
                name: "Up Arrow",
                parameters: { length: 100, width: 20, headLength: 30, headWidth: 40, rotation: -90 },
            },
            {
                id: "down-arrow",
                name: "Down Arrow",
                parameters: { length: 100, width: 20, headLength: 30, headWidth: 40, rotation: 90 },
            },
            {
                id: "left-arrow",
                name: "Left Arrow",
                parameters: { length: 100, width: 20, headLength: 30, headWidth: 40, rotation: 180 },
            },
        ],
    },

    generate: (parameters: Record<string, any>): ShapeGeneratorResult => {
        const errors = ShapeGeneratorUtils.validateParameters(parameters, ArrowGenerator.config.parameters);
        if (errors.length > 0) {
            return { success: false, error: errors.join(", ") };
        }

        const { length, width, headLength, headWidth, rotation } = parameters;
        const pathData = ShapeGeneratorUtils.generateArrow(length, width, headLength, headWidth, 0, 0, rotation);

        return {
            success: true,
            shape: {
                pathData,
                style: {
                    fill: "#ef4444",
                    stroke: "#dc2626",
                    strokeWidth: 2,
                },
            },
        };
    },

    validateParameters: (parameters: Record<string, any>) => {
        return ShapeGeneratorUtils.validateParameters(parameters, ArrowGenerator.config.parameters);
    },
};

/**
 * Speech Bubble Generator
 */
export const SpeechBubbleGenerator: ShapeGenerator = {
    config: {
        id: "speech-bubble",
        name: "Speech Bubble",
        description: "Generate speech bubbles with customizable tail position",
        category: "UI Elements",
        icon: "💬",
        version: "1.0.0",
        tags: ["speech", "bubble", "ui", "communication"],
        parameters: [
            {
                id: "width",
                name: "Width",
                type: "number",
                value: 120,
                min: 60,
                max: 300,
                step: 1,
                description: "Bubble width",
                category: "Size",
            },
            {
                id: "height",
                name: "Height",
                type: "number",
                value: 80,
                min: 40,
                max: 200,
                step: 1,
                description: "Bubble height",
                category: "Size",
            },
            {
                id: "cornerRadius",
                name: "Corner Radius",
                type: "number",
                value: 15,
                min: 0,
                max: 30,
                step: 1,
                description: "Corner radius for rounded bubble",
                category: "Shape",
            },
            {
                id: "tailWidth",
                name: "Tail Width",
                type: "number",
                value: 20,
                min: 10,
                max: 40,
                step: 1,
                description: "Width of speech tail",
                category: "Shape",
            },
            {
                id: "tailHeight",
                name: "Tail Height",
                type: "number",
                value: 15,
                min: 5,
                max: 30,
                step: 1,
                description: "Height of speech tail",
                category: "Shape",
            },
            {
                id: "tailPosition",
                name: "Tail Position",
                type: "range",
                value: 0.3,
                min: 0.1,
                max: 0.9,
                step: 0.1,
                description: "Tail position along bottom (0-1)",
                category: "Shape",
            },
        ],
        presets: [
            {
                id: "left-bubble",
                name: "Left Bubble",
                parameters: {
                    width: 120,
                    height: 80,
                    cornerRadius: 15,
                    tailWidth: 20,
                    tailHeight: 15,
                    tailPosition: 0.3,
                },
            },
            {
                id: "center-bubble",
                name: "Center Bubble",
                parameters: {
                    width: 120,
                    height: 80,
                    cornerRadius: 15,
                    tailWidth: 20,
                    tailHeight: 15,
                    tailPosition: 0.5,
                },
            },
            {
                id: "right-bubble",
                name: "Right Bubble",
                parameters: {
                    width: 120,
                    height: 80,
                    cornerRadius: 15,
                    tailWidth: 20,
                    tailHeight: 15,
                    tailPosition: 0.7,
                },
            },
        ],
    },

    generate: (parameters: Record<string, any>): ShapeGeneratorResult => {
        const errors = ShapeGeneratorUtils.validateParameters(parameters, SpeechBubbleGenerator.config.parameters);
        if (errors.length > 0) {
            return { success: false, error: errors.join(", ") };
        }

        const { width, height, cornerRadius, tailWidth, tailHeight, tailPosition } = parameters;
        const pathData = ShapeGeneratorUtils.generateSpeechBubble(
            width,
            height,
            cornerRadius,
            tailWidth,
            tailHeight,
            tailPosition,
            0,
            0
        );

        return {
            success: true,
            shape: {
                pathData,
                style: {
                    fill: "#ffffff",
                    stroke: "#d1d5db",
                    strokeWidth: 2,
                },
            },
        };
    },

    validateParameters: (parameters: Record<string, any>) => {
        return ShapeGeneratorUtils.validateParameters(parameters, SpeechBubbleGenerator.config.parameters);
    },
};

/**
 * Collection of all built-in shape generators
 */
export const BuiltInShapeGenerators: Record<string, ShapeGenerator> = {
    polygon: PolygonGenerator,
    star: StarGenerator,
    gear: GearGenerator,
    arrow: ArrowGenerator,
    "speech-bubble": SpeechBubbleGenerator,
};

/**
 * Default shape library state with built-in generators
 */
export const createDefaultShapeLibraryState = () => ({
    generators: BuiltInShapeGenerators,
    activeGenerator: undefined,
    parameterValues: {},
    previewMode: false,
    lastUsed: [],
    favorites: [],
    categories: ["Basic Shapes", "Mechanical", "UI Elements"],
});
