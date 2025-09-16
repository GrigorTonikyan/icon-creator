/**
 * Import utilities for the icon creator application
 * Supports SVG file import and conversion to editor objects
 */

import type {
    BaseCanvasObject,
    CircleObject,
    PathObject,
    RectangleObject,
    ShapeStyle,
    TextObject,
    Transform,
} from "../../types/editor";

export interface ImportOptions {
    preserveLayers?: boolean;
    convertTextToPaths?: boolean;
    groupElements?: boolean;
    validateSvg?: boolean;
    scaleFactor?: number;
    centerContent?: boolean;
}

export interface ImportResult {
    objects: BaseCanvasObject[];
    layers: ImportLayer[];
    errors: string[];
    warnings: string[];
    metadata?: ImportMetadata;
}

export interface ImportLayer {
    id: string;
    name: string;
    objects: string[];
    visible: boolean;
    locked: boolean;
    opacity: number;
    order: number;
}

export interface ImportMetadata {
    originalWidth?: number;
    originalHeight?: number;
    viewBox?: string;
    title?: string;
    description?: string;
    source: "svg" | "legacy-config";
    importedAt: string;
}

export interface ImportPreview {
    svgContent: string;
    objectCount: number;
    layerCount: number;
    dimensions: { width: number; height: number };
    errors: string[];
    warnings: string[];
}

/**
 * Import SVG file and convert to editor objects
 */
export async function importSVG(file: File, options: ImportOptions = {}): Promise<ImportResult> {
    const {
        preserveLayers = true,
        convertTextToPaths = false,
        groupElements = true,
        validateSvg = true,
        scaleFactor = 1,
        centerContent = true,
    } = options;

    try {
        // Read file content
        const svgContent = await readFileAsText(file);

        // Validate SVG if requested
        if (validateSvg) {
            const validationErrors = validateSVGContent(svgContent);
            if (validationErrors.length > 0) {
                return {
                    objects: [],
                    layers: [],
                    errors: validationErrors,
                    warnings: [],
                };
            }
        }

        // Parse SVG content
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
        const svgElement = svgDoc.documentElement as unknown as SVGElement;

        // Check for parser errors
        const parserError = svgDoc.querySelector("parsererror");
        if (parserError) {
            return {
                objects: [],
                layers: [],
                errors: ["Invalid SVG format: " + parserError.textContent],
                warnings: [],
            };
        }

        // Extract metadata
        const metadata: ImportMetadata = {
            originalWidth: parseFloat(svgElement.getAttribute("width") || "100"),
            originalHeight: parseFloat(svgElement.getAttribute("height") || "100"),
            viewBox: svgElement.getAttribute("viewBox") || undefined,
            title: svgElement.querySelector("title")?.textContent || undefined,
            description: svgElement.querySelector("desc")?.textContent || undefined,
            source: "svg",
            importedAt: new Date().toISOString(),
        };

        // Convert SVG to editor objects
        const result = await parseSVGToObjects(svgElement, {
            preserveLayers,
            convertTextToPaths,
            groupElements,
            scaleFactor,
            centerContent,
        });

        return {
            objects: result.objects,
            layers: result.layers,
            errors: result.errors,
            warnings: result.warnings,
            metadata,
        };
    } catch (error) {
        return {
            objects: [],
            layers: [],
            errors: [`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
            warnings: [],
        };
    }
}

/**
 * Generate preview of SVG import
 */
export async function generateImportPreview(file: File): Promise<ImportPreview> {
    try {
        const svgContent = await readFileAsText(file);

        // Parse SVG for analysis
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
        const svgElement = svgDoc.documentElement as unknown as SVGElement;

        // Check for parser errors
        const parserError = svgDoc.querySelector("parsererror");
        if (parserError) {
            return {
                svgContent: "",
                objectCount: 0,
                layerCount: 0,
                dimensions: { width: 0, height: 0 },
                errors: ["Invalid SVG format: " + parserError.textContent],
                warnings: [],
            };
        }

        // Count elements
        const elements = svgElement.querySelectorAll("rect, circle, ellipse, path, text, g");
        const groups = svgElement.querySelectorAll("g");

        // Get dimensions
        const width = parseFloat(svgElement.getAttribute("width") || "100");
        const height = parseFloat(svgElement.getAttribute("height") || "100");

        // Validate content
        const validationErrors = validateSVGContent(svgContent);
        const warnings = generateImportWarnings(svgElement);

        return {
            svgContent,
            objectCount: elements.length - groups.length, // Exclude groups from object count
            layerCount: Math.max(1, groups.length),
            dimensions: { width, height },
            errors: validationErrors,
            warnings,
        };
    } catch (error) {
        return {
            svgContent: "",
            objectCount: 0,
            layerCount: 0,
            dimensions: { width: 0, height: 0 },
            errors: [`Preview generation failed: ${error instanceof Error ? error.message : "Unknown error"}`],
            warnings: [],
        };
    }
}

/**
 * Parse SVG element and convert to editor objects
 */
async function parseSVGToObjects(
    svgElement: SVGElement,
    options: {
        preserveLayers: boolean;
        convertTextToPaths: boolean;
        groupElements: boolean;
        scaleFactor: number;
        centerContent: boolean;
    }
): Promise<Omit<ImportResult, "metadata">> {
    const objects: BaseCanvasObject[] = [];
    const layers: ImportLayer[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    let objectIdCounter = 1;
    let layerIdCounter = 1;

    // Get SVG dimensions for centering
    const svgWidth = parseFloat(svgElement.getAttribute("width") || "100");
    const svgHeight = parseFloat(svgElement.getAttribute("height") || "100");
    const centerOffsetX = options.centerContent ? -svgWidth / 2 : 0;
    const centerOffsetY = options.centerContent ? -svgHeight / 2 : 0;

    // Create default layer
    const defaultLayer: ImportLayer = {
        id: `layer-${layerIdCounter++}`,
        name: "Imported Layer",
        objects: [],
        visible: true,
        locked: false,
        opacity: 1,
        order: 0,
    };
    layers.push(defaultLayer);

    // Parse elements recursively
    function parseElement(element: Element, currentLayer: ImportLayer, parentTransform?: Transform): void {
        try {
            const transform = extractTransform(
                element,
                parentTransform,
                options.scaleFactor,
                centerOffsetX,
                centerOffsetY
            );

            switch (element.tagName.toLowerCase()) {
                case "rect": {
                    const rect = parseRectangle(
                        element as SVGRectElement,
                        objectIdCounter++,
                        currentLayer.id,
                        transform
                    );
                    if (rect) {
                        objects.push(rect);
                        currentLayer.objects.push(rect.id);
                    }
                    break;
                }

                case "circle": {
                    const circle = parseCircle(
                        element as SVGCircleElement,
                        objectIdCounter++,
                        currentLayer.id,
                        transform
                    );
                    if (circle) {
                        objects.push(circle);
                        currentLayer.objects.push(circle.id);
                    }
                    break;
                }

                case "ellipse": {
                    // Convert ellipse to circle if rx === ry, otherwise convert to path
                    const ellipse = parseEllipse(
                        element as SVGEllipseElement,
                        objectIdCounter++,
                        currentLayer.id,
                        transform
                    );
                    if (ellipse) {
                        objects.push(ellipse);
                        currentLayer.objects.push(ellipse.id);
                    }
                    break;
                }

                case "path": {
                    const path = parsePath(element as SVGPathElement, objectIdCounter++, currentLayer.id, transform);
                    if (path) {
                        objects.push(path);
                        currentLayer.objects.push(path.id);
                    }
                    break;
                }

                case "text": {
                    if (options.convertTextToPaths) {
                        // TODO: Implement text to path conversion
                        warnings.push("Text to path conversion not yet implemented");
                    } else {
                        const text = parseText(
                            element as SVGTextElement,
                            objectIdCounter++,
                            currentLayer.id,
                            transform
                        );
                        if (text) {
                            objects.push(text);
                            currentLayer.objects.push(text.id);
                        }
                    }
                    break;
                }

                case "g": {
                    // Handle groups
                    let groupLayer = currentLayer;

                    if (options.preserveLayers) {
                        const groupName =
                            element.getAttribute("id") ||
                            element.getAttribute("data-name") ||
                            `Group ${layerIdCounter}`;

                        groupLayer = {
                            id: `layer-${layerIdCounter++}`,
                            name: groupName,
                            objects: [],
                            visible: true,
                            locked: false,
                            opacity: parseFloat(element.getAttribute("opacity") || "1"),
                            order: layers.length,
                        };
                        layers.push(groupLayer);
                    }

                    // Parse children
                    Array.from(element.children).forEach((child) => {
                        parseElement(child, groupLayer, transform);
                    });
                    break;
                }

                default:
                    warnings.push(`Unsupported element type: ${element.tagName}`);
                    break;
            }
        } catch (elementError) {
            errors.push(
                `Failed to parse ${element.tagName}: ${
                    elementError instanceof Error ? elementError.message : "Unknown error"
                }`
            );
        }
    }

    // Parse all top-level elements
    Array.from(svgElement.children).forEach((child) => {
        // Skip metadata elements
        if (!["title", "desc", "metadata", "defs"].includes(child.tagName.toLowerCase())) {
            parseElement(child, defaultLayer);
        }
    });

    return { objects, layers, errors, warnings };
}

/**
 * Extract transform from SVG element
 */
function extractTransform(
    element: Element,
    parentTransform?: Transform,
    scaleFactor = 1,
    centerOffsetX = 0,
    centerOffsetY = 0
): Transform {
    const transform: Transform = {
        x: centerOffsetX * scaleFactor,
        y: centerOffsetY * scaleFactor,
        rotation: 0,
        scaleX: scaleFactor,
        scaleY: scaleFactor,
        originX: 0.5,
        originY: 0.5,
    };

    // Apply parent transform if exists
    if (parentTransform) {
        transform.x += parentTransform.x;
        transform.y += parentTransform.y;
        transform.rotation += parentTransform.rotation;
        transform.scaleX *= parentTransform.scaleX;
        transform.scaleY *= parentTransform.scaleY;
    }

    // Parse SVG transform attribute if present
    const transformAttr = element.getAttribute("transform");
    if (transformAttr) {
        // TODO: Implement full SVG transform parsing
        // For now, handle basic translate operations
        const translateMatch = transformAttr.match(/translate\(([^)]+)\)/);
        if (translateMatch && translateMatch[1]) {
            const values = translateMatch[1].split(/[\s,]+/).map(Number);
            transform.x += (values[0] || 0) * scaleFactor;
            transform.y += (values[1] || 0) * scaleFactor;
        }
    }

    return transform;
}

/**
 * Parse rectangle element
 */
function parseRectangle(
    element: SVGRectElement,
    id: number,
    layerId: string,
    transform: Transform
): RectangleObject | null {
    try {
        const x = parseFloat(element.getAttribute("x") || "0");
        const y = parseFloat(element.getAttribute("y") || "0");
        const width = parseFloat(element.getAttribute("width") || "0");
        const height = parseFloat(element.getAttribute("height") || "0");
        const borderRadius = parseFloat(element.getAttribute("rx") || "0");

        if (width <= 0 || height <= 0) return null;

        return {
            id: `imported-rect-${id}`,
            type: "rectangle",
            name: element.getAttribute("id") || `Rectangle ${id}`,
            transform: {
                ...transform,
                x: transform.x + x * transform.scaleX,
                y: transform.y + y * transform.scaleY,
            },
            visible: true,
            locked: false,
            opacity: parseFloat(element.getAttribute("opacity") || "1"),
            zIndex: 0,
            layerId,
            width: width * transform.scaleX,
            height: height * transform.scaleY,
            borderRadius: borderRadius * Math.min(transform.scaleX, transform.scaleY),
            style: extractShapeStyle(element),
        };
    } catch (error) {
        console.error("Failed to parse rectangle:", error);
        return null;
    }
}

/**
 * Parse circle element
 */
function parseCircle(
    element: SVGCircleElement,
    id: number,
    layerId: string,
    transform: Transform
): CircleObject | null {
    try {
        const cx = parseFloat(element.getAttribute("cx") || "0");
        const cy = parseFloat(element.getAttribute("cy") || "0");
        const r = parseFloat(element.getAttribute("r") || "0");

        if (r <= 0) return null;

        return {
            id: `imported-circle-${id}`,
            type: "circle",
            name: element.getAttribute("id") || `Circle ${id}`,
            transform: {
                ...transform,
                x: transform.x + cx * transform.scaleX,
                y: transform.y + cy * transform.scaleY,
            },
            visible: true,
            locked: false,
            opacity: parseFloat(element.getAttribute("opacity") || "1"),
            zIndex: 0,
            layerId,
            radius: r * Math.min(transform.scaleX, transform.scaleY),
            style: extractShapeStyle(element),
        };
    } catch (error) {
        console.error("Failed to parse circle:", error);
        return null;
    }
}

/**
 * Parse ellipse element (convert to circle if possible, otherwise to path)
 */
function parseEllipse(
    element: SVGEllipseElement,
    id: number,
    layerId: string,
    transform: Transform
): CircleObject | PathObject | null {
    try {
        const cx = parseFloat(element.getAttribute("cx") || "0");
        const cy = parseFloat(element.getAttribute("cy") || "0");
        const rx = parseFloat(element.getAttribute("rx") || "0");
        const ry = parseFloat(element.getAttribute("ry") || "0");

        if (rx <= 0 || ry <= 0) return null;

        // If rx === ry, convert to circle
        if (Math.abs(rx - ry) < 0.001) {
            return {
                id: `imported-circle-${id}`,
                type: "circle",
                name: element.getAttribute("id") || `Circle ${id}`,
                transform: {
                    ...transform,
                    x: transform.x + cx * transform.scaleX,
                    y: transform.y + cy * transform.scaleY,
                },
                visible: true,
                locked: false,
                opacity: parseFloat(element.getAttribute("opacity") || "1"),
                zIndex: 0,
                layerId,
                radius: rx * Math.min(transform.scaleX, transform.scaleY),
                style: extractShapeStyle(element),
            };
        }

        // Convert ellipse to path
        const pathData = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${
            cx - rx
        } ${cy} Z`;

        return {
            id: `imported-path-${id}`,
            type: "path",
            name: element.getAttribute("id") || `Ellipse ${id}`,
            transform,
            visible: true,
            locked: false,
            opacity: parseFloat(element.getAttribute("opacity") || "1"),
            zIndex: 0,
            layerId,
            pathData,
            style: extractShapeStyle(element),
        };
    } catch (error) {
        console.error("Failed to parse ellipse:", error);
        return null;
    }
}

/**
 * Parse path element
 */
function parsePath(element: SVGPathElement, id: number, layerId: string, transform: Transform): PathObject | null {
    try {
        const pathData = element.getAttribute("d");
        if (!pathData) return null;

        return {
            id: `imported-path-${id}`,
            type: "path",
            name: element.getAttribute("id") || `Path ${id}`,
            transform,
            visible: true,
            locked: false,
            opacity: parseFloat(element.getAttribute("opacity") || "1"),
            zIndex: 0,
            layerId,
            pathData,
            style: extractShapeStyle(element),
        };
    } catch (error) {
        console.error("Failed to parse path:", error);
        return null;
    }
}

/**
 * Parse text element
 */
function parseText(element: SVGTextElement, id: number, layerId: string, transform: Transform): TextObject | null {
    try {
        const x = parseFloat(element.getAttribute("x") || "0");
        const y = parseFloat(element.getAttribute("y") || "0");
        const content = element.textContent || "";

        if (!content.trim()) return null;

        const fontSize = parseFloat(element.getAttribute("font-size") || "16");
        const fontFamily = element.getAttribute("font-family") || "Arial";
        const fontWeight = element.getAttribute("font-weight") || "normal";
        const textAnchor = element.getAttribute("text-anchor") || "start";

        let textAlign: "left" | "center" | "right" = "left";
        if (textAnchor === "middle") textAlign = "center";
        else if (textAnchor === "end") textAlign = "right";

        return {
            id: `imported-text-${id}`,
            type: "text",
            name: element.getAttribute("id") || `Text ${id}`,
            transform: {
                ...transform,
                x: transform.x + x * transform.scaleX,
                y: transform.y + y * transform.scaleY,
            },
            visible: true,
            locked: false,
            opacity: parseFloat(element.getAttribute("opacity") || "1"),
            zIndex: 0,
            layerId,
            content,
            style: {
                fontFamily,
                fontSize: fontSize * Math.min(transform.scaleX, transform.scaleY),
                fontWeight: fontWeight as any,
                color: element.getAttribute("fill") || "#000000",
                textAlign,
                lineHeight: 1.2,
            },
        };
    } catch (error) {
        console.error("Failed to parse text:", error);
        return null;
    }
}

/**
 * Extract shape style from SVG element
 */
function extractShapeStyle(element: Element): ShapeStyle {
    const style: ShapeStyle = {};

    // Fill
    const fill = element.getAttribute("fill");
    if (fill && fill !== "none") {
        style.fill = fill;
    }

    // Stroke
    const stroke = element.getAttribute("stroke");
    if (stroke && stroke !== "none") {
        style.stroke = stroke;
    }

    // Stroke width
    const strokeWidth = element.getAttribute("stroke-width");
    if (strokeWidth) {
        style.strokeWidth = parseFloat(strokeWidth);
    }

    // Stroke dash array
    const strokeDasharray = element.getAttribute("stroke-dasharray");
    if (strokeDasharray && strokeDasharray !== "none") {
        style.strokeDasharray = strokeDasharray.split(/[\s,]+/).map(Number);
    }

    return style;
}

/**
 * Read file as text
 */
function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
}

/**
 * Validate SVG content
 */
function validateSVGContent(svgContent: string): string[] {
    const errors: string[] = [];

    // Basic validation
    if (!svgContent.trim()) {
        errors.push("SVG content is empty");
        return errors;
    }

    if (!svgContent.includes("<svg")) {
        errors.push("Not a valid SVG file");
        return errors;
    }

    // Check for common issues
    if (svgContent.includes("<?xml") && !svgContent.startsWith("<?xml")) {
        errors.push("XML declaration must be at the beginning of the file");
    }

    return errors;
}

/**
 * Generate import warnings
 */
function generateImportWarnings(svgElement: SVGElement): string[] {
    const warnings: string[] = [];

    // Check for unsupported elements
    const unsupportedElements = svgElement.querySelectorAll("image, use, symbol, marker, clipPath, mask, filter");
    if (unsupportedElements.length > 0) {
        warnings.push(`${unsupportedElements.length} unsupported elements will be ignored`);
    }

    // Check for complex gradients
    const gradients = svgElement.querySelectorAll("linearGradient, radialGradient");
    if (gradients.length > 0) {
        warnings.push("Gradients will be converted to solid colors");
    }

    // Check for animations
    const animations = svgElement.querySelectorAll("animate, animateTransform, animateMotion");
    if (animations.length > 0) {
        warnings.push("Animations will be ignored");
    }

    return warnings;
}

/**
 * Detect file format and determine import strategy
 */
export async function detectImportFormat(file: File): Promise<{
    format: "svg" | "legacy-config" | "unknown";
    isValid: boolean;
    error?: string;
}> {
    try {
        const content = await readFileAsText(file);

        // Check if it's an SVG file
        if (file.name.toLowerCase().endsWith(".svg") || content.trim().startsWith("<svg")) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(content, "image/svg+xml");
            const parserError = svgDoc.querySelector("parsererror");

            return {
                format: "svg",
                isValid: !parserError,
                error: parserError ? "Invalid SVG format" : undefined,
            };
        }

        // Check if it's a JSON file (potential legacy config)
        if (file.name.toLowerCase().endsWith(".json")) {
            try {
                const jsonData = JSON.parse(content);

                // Check for legacy config structure
                if (isLegacyConfig(jsonData)) {
                    return {
                        format: "legacy-config",
                        isValid: true,
                    };
                }

                return {
                    format: "unknown",
                    isValid: false,
                    error: "JSON file does not contain a valid legacy configuration",
                };
            } catch (parseError) {
                return {
                    format: "unknown",
                    isValid: false,
                    error: "Invalid JSON format",
                };
            }
        }

        return {
            format: "unknown",
            isValid: false,
            error: "Unsupported file format - only SVG and legacy JSON configs are supported",
        };
    } catch (error) {
        return {
            format: "unknown",
            isValid: false,
            error: `Format detection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Check if data structure matches legacy IconConfig format
 */
function isLegacyConfig(data: any): boolean {
    if (!data || typeof data !== "object") return false;

    // Check for legacy config structure - either direct config or wrapped
    const config = data.config || data;

    // Look for key IconConfig properties
    const hasBackgroundColors = config.bgGradStart && config.bgGradMid && config.bgGradEnd;
    const hasPanelColors = config.panelTop && config.panelMid && config.panelBot;
    const hasSize = typeof config.iconSize === "number";
    const hasTitle = typeof config.title === "string";

    return hasBackgroundColors && hasPanelColors && (hasSize || hasTitle);
}

/**
 * Universal import function that auto-detects format
 */
export async function importFile(file: File, options: ImportOptions = {}): Promise<ImportResult> {
    try {
        const formatDetection = await detectImportFormat(file);

        if (!formatDetection.isValid) {
            return {
                objects: [],
                layers: [],
                errors: [formatDetection.error || "Invalid file format"],
                warnings: [],
            };
        }

        switch (formatDetection.format) {
            case "svg":
                return await importSVG(file, options);

            case "legacy-config":
                const content = await readFileAsText(file);
                const configData = JSON.parse(content);
                return await importLegacyConfig(configData);

            default:
                return {
                    objects: [],
                    layers: [],
                    errors: ["Unsupported file format"],
                    warnings: [],
                };
        }
    } catch (error) {
        return {
            objects: [],
            layers: [],
            errors: [`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
            warnings: [],
        };
    }
}

/**
 * Import legacy IconCreator configuration
 */
export async function importLegacyConfig(configData: any): Promise<ImportResult> {
    try {
        // Validate config data structure
        if (!configData || typeof configData !== "object") {
            return {
                objects: [],
                layers: [],
                errors: ["Invalid config data format"],
                warnings: [],
                metadata: {
                    source: "legacy-config",
                    importedAt: new Date().toISOString(),
                },
            };
        }

        const config = configData.config || configData;
        const objects: BaseCanvasObject[] = [];
        const warnings: string[] = [];
        let objectIdCounter = 1;

        // Create default layer for legacy objects
        const defaultLayer: ImportLayer = {
            id: "layer-1",
            name: "Legacy Icon Elements",
            objects: [],
            visible: true,
            locked: false,
            opacity: 1,
            order: 0,
        };

        const layers: ImportLayer[] = [defaultLayer];

        // Get canvas dimensions from config
        const canvasSize = config.iconSize || 512;
        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;

        // Convert IconConfig elements to editor objects
        // Background gradient (as a large rectangle)
        if (config.bgGradStart && config.bgGradMid && config.bgGradEnd) {
            const gradientId = `gradient-bg-${objectIdCounter}`;
            const bgRect: RectangleObject = {
                id: `object-${objectIdCounter++}`,
                type: "rectangle",
                name: "Background",
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
                layerId: defaultLayer.id,
                width: canvasSize,
                height: canvasSize,
                borderRadius: config.borderRadius || 0,
                style: {
                    fill: `linear-gradient(135deg, ${config.bgGradStart}, ${config.bgGradMid}, ${config.bgGradEnd})`,
                    stroke: undefined,
                    strokeWidth: 0,
                },
            };
            objects.push(bgRect);
            defaultLayer.objects.push(bgRect.id);

            warnings.push("Background gradient converted to solid fill - gradients require manual adjustment");
        }

        // Main panel (central UI panel)
        if (config.panelTop && config.panelMid && config.panelBot) {
            const panelWidth = (config.panelWidth / 100) * canvasSize;
            const panelHeight = (config.panelHeight / 100) * canvasSize;

            const mainPanel: RectangleObject = {
                id: `object-${objectIdCounter++}`,
                type: "rectangle",
                name: "Main Panel",
                transform: {
                    x: centerX - panelWidth / 2,
                    y: centerY - panelHeight / 2,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 1,
                layerId: defaultLayer.id,
                width: panelWidth,
                height: panelHeight,
                borderRadius: config.borderRadius || 0,
                style: {
                    fill: config.panelMid,
                    stroke: config.borderGlow,
                    strokeWidth: 2,
                },
            };
            objects.push(mainPanel);
            defaultLayer.objects.push(mainPanel.id);
        }

        // Input bar (text input area)
        if (config.barStart && config.barEnd && config.inputHeight) {
            const inputHeight = (config.inputHeight / 100) * canvasSize * 0.1; // Scale down
            const inputWidth = canvasSize * 0.3; // 30% of canvas width

            const inputBar: RectangleObject = {
                id: `object-${objectIdCounter++}`,
                type: "rectangle",
                name: "Input Bar",
                transform: {
                    x: centerX - inputWidth / 2,
                    y: centerY - inputHeight / 2,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 2,
                layerId: defaultLayer.id,
                width: inputWidth,
                height: inputHeight,
                borderRadius: (config.borderRadius || 0) * 0.2,
                style: {
                    fill: config.barStart,
                    stroke: config.accent,
                    strokeWidth: 1,
                },
            };
            objects.push(inputBar);
            defaultLayer.objects.push(inputBar.id);
        }

        // Input text
        if (config.inputText && config.inputText !== "text") {
            const textObj: TextObject = {
                id: `object-${objectIdCounter++}`,
                type: "text",
                name: "Input Text",
                transform: {
                    x: centerX,
                    y: centerY,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 3,
                layerId: defaultLayer.id,
                content: config.inputText,
                style: {
                    fontFamily: "system-ui, Arial, sans-serif",
                    fontSize: Math.max(12, canvasSize * 0.03),
                    fontWeight: "normal",
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: 1.2,
                },
            };
            objects.push(textObj);
            defaultLayer.objects.push(textObj.id);
        }

        // Inactive bars
        if (config.inactiveStart && config.inactiveEnd && config.inactiveBarWidth) {
            const barWidth = (config.inactiveBarWidth / 100) * canvasSize * 0.3;
            const barHeight = canvasSize * 0.02;

            // Create multiple inactive bars
            for (let i = 0; i < 3; i++) {
                const inactiveBar: RectangleObject = {
                    id: `object-${objectIdCounter++}`,
                    type: "rectangle",
                    name: `Inactive Bar ${i + 1}`,
                    transform: {
                        x: centerX - barWidth / 2,
                        y: centerY + i * barHeight * 2 - barHeight * 3,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                    },
                    visible: true,
                    locked: false,
                    opacity: 0.6,
                    zIndex: 1,
                    layerId: defaultLayer.id,
                    width: barWidth,
                    height: barHeight,
                    borderRadius: barHeight / 2,
                    style: {
                        fill: config.inactiveStart,
                        stroke: undefined,
                        strokeWidth: 0,
                    },
                };
                objects.push(inactiveBar);
                defaultLayer.objects.push(inactiveBar.id);
            }
        }

        // Pills/buttons
        if (config.accent && config.pillWidth) {
            const pillWidth = (config.pillWidth / 100) * canvasSize * 0.1;
            const pillHeight = pillWidth * 0.6;

            // Create a couple of pill-shaped elements
            for (let i = 0; i < 2; i++) {
                const pill: RectangleObject = {
                    id: `object-${objectIdCounter++}`,
                    type: "rectangle",
                    name: `Pill ${i + 1}`,
                    transform: {
                        x: centerX + i * pillWidth * 1.5 - pillWidth * 0.75,
                        y: centerY + canvasSize * 0.15,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                    },
                    visible: true,
                    locked: false,
                    opacity: 1,
                    zIndex: 2,
                    layerId: defaultLayer.id,
                    width: pillWidth,
                    height: pillHeight,
                    borderRadius: pillHeight / 2,
                    style: {
                        fill: config.accent,
                        stroke: config.borderGlow,
                        strokeWidth: 1,
                    },
                };
                objects.push(pill);
                defaultLayer.objects.push(pill.id);
            }
        }

        // Add title as text if present
        if (config.title && config.showTitle) {
            const titleText: TextObject = {
                id: `object-${objectIdCounter++}`,
                type: "text",
                name: "Title",
                transform: {
                    x: centerX,
                    y: canvasSize * 0.9,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                },
                visible: true,
                locked: false,
                opacity: 0.8,
                zIndex: 4,
                layerId: defaultLayer.id,
                content: config.title,
                style: {
                    fontFamily: "system-ui, Arial, sans-serif",
                    fontSize: Math.max(10, canvasSize * 0.02),
                    fontWeight: "normal",
                    color: "#94a3b8",
                    textAlign: "center",
                    lineHeight: 1.4,
                },
            };
            objects.push(titleText);
            defaultLayer.objects.push(titleText.id);
        }

        // Add metadata
        const metadata: ImportMetadata = {
            originalWidth: canvasSize,
            originalHeight: canvasSize,
            title: config.title || "Legacy Icon",
            description: "Imported from legacy IconCreator configuration",
            source: "legacy-config",
            importedAt: new Date().toISOString(),
        };

        warnings.push("Legacy import is a best-effort conversion - manual adjustments may be needed");
        warnings.push("Gradients and complex effects may not render exactly as in the original");

        return {
            objects,
            layers,
            errors: [],
            warnings,
            metadata,
        };
    } catch (error) {
        return {
            objects: [],
            layers: [],
            errors: [`Legacy import failed: ${error instanceof Error ? error.message : "Unknown error"}`],
            warnings: [],
            metadata: {
                source: "legacy-config",
                importedAt: new Date().toISOString(),
            },
        };
    }
}
