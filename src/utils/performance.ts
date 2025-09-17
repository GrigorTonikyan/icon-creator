/**
 * Performance optimization utilities for Canvas rendering
 * Implements viewport culling, object virtualization, and rendering optimizations
 */

import type { CanvasObject, ViewportState, RectangleObject, CircleObject, TextObject } from "../types/editor";

export interface ViewportBounds {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface ObjectBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RenderLevel {
    minZoom: number;
    maxZoom: number;
    simplified: boolean;
    skipDetails: boolean;
}

export interface ProgressiveRenderOptions {
    enableLOD: boolean;
    lodThresholds: {
        full: number; // Full detail rendering above this zoom
        simplified: number; // Simplified rendering above this zoom
        placeholder: number; // Placeholder rendering above this zoom
    };
    simplificationLevel: number; // 0-1, how much to simplify
    enablePathProgressive: boolean;
    pathSegmentThreshold: number; // Simplify paths with more segments than this
}

export interface SimplifiedObject {
    id: string;
    type: string;
    originalObject: CanvasObject;
    simplificationLevel: number;
    renderAsPlaceholder: boolean;
    transform: CanvasObject["transform"];
}

export interface PerformanceMetrics {
    visibleObjects: number;
    culledObjects: number;
    renderTime: number;
    frameRate: number;
    memoryUsage: number;
}

/**
 * Calculate viewport bounds for culling
 */
export function calculateViewportBounds(viewport: ViewportState): ViewportBounds {
    const margin = 100; // Add margin to reduce culling artifacts during panning

    const left = -viewport.panX / viewport.zoom - margin;
    const top = -viewport.panY / viewport.zoom - margin;
    const right = left + viewport.canvasWidth / viewport.zoom + margin * 2;
    const bottom = top + viewport.canvasHeight / viewport.zoom + margin * 2;

    return { left, top, right, bottom };
}

/**
 * Calculate object bounds for culling
 */
export function calculateObjectBounds(object: CanvasObject): ObjectBounds {
    const { transform } = object;

    switch (object.type) {
        case "rectangle": {
            const rect = object as RectangleObject;
            return {
                x: transform.x,
                y: transform.y,
                width: rect.width * transform.scaleX,
                height: rect.height * transform.scaleY,
            };
        }

        case "circle": {
            const circle = object as CircleObject;
            const radius = circle.radius * Math.max(transform.scaleX, transform.scaleY);
            return {
                x: transform.x - radius,
                y: transform.y - radius,
                width: radius * 2,
                height: radius * 2,
            };
        }

        case "text": {
            const text = object as TextObject;
            // Estimate text bounds
            const fontSize = text.style.fontSize * Math.max(transform.scaleX, transform.scaleY);
            const estimatedWidth = text.content.length * fontSize * 0.6;
            const estimatedHeight = fontSize * text.style.lineHeight;
            return {
                x: transform.x,
                y: transform.y,
                width: estimatedWidth,
                height: estimatedHeight,
            };
        }

        case "path":
            // For paths, calculate bounds from path data
            // This is a simplified approach - in production, use actual path bounds
            return {
                x: transform.x - 50,
                y: transform.y - 50,
                width: 100,
                height: 100,
            };

        default:
            return { x: transform.x, y: transform.y, width: 50, height: 50 };
    }
}

/**
 * Check if object bounds intersect with viewport bounds
 */
export function isObjectInViewport(objectBounds: ObjectBounds, viewportBounds: ViewportBounds): boolean {
    return !(
        objectBounds.x + objectBounds.width < viewportBounds.left ||
        objectBounds.x > viewportBounds.right ||
        objectBounds.y + objectBounds.height < viewportBounds.top ||
        objectBounds.y > viewportBounds.bottom
    );
}

/**
 * Determine render level based on zoom and object complexity
 */
export function getRenderLevel(viewport: ViewportState, object: CanvasObject): RenderLevel {
    const zoom = viewport.zoom;

    // Define zoom-based render levels
    if (zoom < 0.25) {
        return {
            minZoom: 0,
            maxZoom: 0.25,
            simplified: true,
            skipDetails: true,
        };
    } else if (zoom < 0.5) {
        return {
            minZoom: 0.25,
            maxZoom: 0.5,
            simplified: true,
            skipDetails: false,
        };
    } else if (zoom < 1.0) {
        return {
            minZoom: 0.5,
            maxZoom: 1.0,
            simplified: false,
            skipDetails: false,
        };
    } else {
        return {
            minZoom: 1.0,
            maxZoom: Infinity,
            simplified: false,
            skipDetails: false,
        };
    }
}

/**
 * Cull objects based on viewport visibility
 */
export function cullObjects(
    objects: Record<string, CanvasObject>,
    viewport: ViewportState
): {
    visibleObjects: Record<string, CanvasObject>;
    culledCount: number;
} {
    const viewportBounds = calculateViewportBounds(viewport);
    const visibleObjects: Record<string, CanvasObject> = {};
    let culledCount = 0;

    Object.entries(objects).forEach(([id, object]) => {
        if (!object.visible) {
            culledCount++;
            return;
        }

        const objectBounds = calculateObjectBounds(object);

        if (isObjectInViewport(objectBounds, viewportBounds)) {
            visibleObjects[id] = object;
        } else {
            culledCount++;
        }
    });

    return { visibleObjects, culledCount };
}

/**
 * Batch render operations for better performance
 */
export class RenderBatch {
    private operations: Array<() => void> = [];
    private isScheduled = false;

    add(operation: () => void): void {
        this.operations.push(operation);
        this.schedule();
    }

    private schedule(): void {
        if (this.isScheduled) return;

        this.isScheduled = true;
        requestAnimationFrame(() => {
            this.flush();
        });
    }

    private flush(): void {
        const operations = [...this.operations];
        this.operations.length = 0;
        this.isScheduled = false;

        operations.forEach((operation) => {
            try {
                operation();
            } catch (error) {
                console.error("Render operation failed:", error);
            }
        });
    }

    clear(): void {
        this.operations.length = 0;
        this.isScheduled = false;
    }
}

/**
 * Performance monitor for tracking render metrics
 */
export class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        visibleObjects: 0,
        culledObjects: 0,
        renderTime: 0,
        frameRate: 60,
        memoryUsage: 0,
    };

    private frameCount = 0;
    private lastFrameTime = performance.now();
    private frameStartTime = 0;

    startFrame(): void {
        this.frameStartTime = performance.now();
    }

    endFrame(visibleCount: number, culledCount: number): void {
        const now = performance.now();
        this.metrics.renderTime = now - this.frameStartTime;
        this.metrics.visibleObjects = visibleCount;
        this.metrics.culledObjects = culledCount;

        // Calculate frame rate
        this.frameCount++;
        if (now - this.lastFrameTime >= 1000) {
            this.metrics.frameRate = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }

        // Estimate memory usage (simplified)
        if ((performance as any).memory) {
            this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        }
    }

    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    logMetrics(): void {
        if (process.env.NODE_ENV === "development") {
            console.log("Render Performance:", {
                visible: this.metrics.visibleObjects,
                culled: this.metrics.culledObjects,
                renderTime: `${this.metrics.renderTime.toFixed(2)}ms`,
                fps: this.metrics.frameRate,
                memory: `${this.metrics.memoryUsage.toFixed(2)}MB`,
            });
        }
    }
}

/**
 * Object pool for reusing DOM elements
 */
export class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;
    private resetFn: (item: T) => void;

    constructor(createFn: () => T, resetFn: (item: T) => void, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }

    acquire(): T {
        const item = this.pool.pop();
        if (item) {
            this.resetFn(item);
            return item;
        }
        return this.createFn();
    }

    release(item: T): void {
        this.pool.push(item);
    }

    clear(): void {
        this.pool.length = 0;
    }

    size(): number {
        return this.pool.length;
    }
}

/**
 * Debounced function for expensive operations
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T & { cancel: () => void } {
    let timeout: NodeJS.Timeout | null = null;

    const debounced = ((...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), wait);
    }) as T & { cancel: () => void };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced;
}

/**
 * Progressive rendering utilities for complex objects
 */

/**
 * Determine render level based on zoom and object complexity
 */
export function determineRenderLevel(
    zoom: number,
    object: CanvasObject,
    options: ProgressiveRenderOptions
): "full" | "simplified" | "placeholder" {
    if (!options.enableLOD) {
        return "full";
    }

    if (zoom >= options.lodThresholds.full) {
        return "full";
    } else if (zoom >= options.lodThresholds.simplified) {
        return "simplified";
    } else {
        return "placeholder";
    }
}

/**
 * Create simplified version of an object for performance
 */
export function createSimplifiedObject(
    object: CanvasObject,
    simplificationLevel: number,
    renderAsPlaceholder: boolean
): SimplifiedObject {
    return {
        id: object.id,
        type: renderAsPlaceholder ? "placeholder" : object.type,
        originalObject: object,
        simplificationLevel,
        renderAsPlaceholder,
        transform: object.transform,
    };
}

/**
 * Apply progressive rendering to a list of objects
 */
export function applyProgressiveRendering(
    objects: CanvasObject[],
    zoom: number,
    options: ProgressiveRenderOptions
): Array<CanvasObject | SimplifiedObject> {
    return objects.map((object) => {
        const renderLevel = determineRenderLevel(zoom, object, options);

        switch (renderLevel) {
            case "full":
                return object;

            case "simplified":
                return createSimplifiedObject(object, options.simplificationLevel, false);

            case "placeholder":
                return createSimplifiedObject(object, 1, true);

            default:
                return object;
        }
    });
}

/**
 * Simplify path data for performance
 */
export function simplifyPathData(pathData: string, simplificationLevel: number): string {
    if (simplificationLevel === 0) return pathData;

    // Simple path simplification - reduce precision and remove redundant points
    const commands = pathData.split(/(?=[MLHVCSQTAZ])/i);
    const simplified = commands.map((command) => {
        if (command.trim() === "") return command;

        const coords = command.match(/-?\d+\.?\d*/g);
        if (!coords) return command;

        // Reduce coordinate precision based on simplification level
        const precision = Math.max(0, 2 - Math.floor(simplificationLevel * 2));
        const simplifiedCoords = coords.map((coord) => parseFloat(parseFloat(coord).toFixed(precision)).toString());

        return command.replace(/-?\d+\.?\d*/g, () => simplifiedCoords.shift() || "0");
    });

    return simplified.join("");
}

/**
 * Check if path is complex and should be simplified
 */
export function isPathComplex(pathData: string, threshold: number): boolean {
    const commands = pathData.split(/(?=[MLHVCSQTAZ])/i);
    return commands.length > threshold;
}

/**
 * Progressive path rendering utility
 */
export function createProgressivePath(
    pathData: string,
    simplificationLevel: number,
    options: ProgressiveRenderOptions
): string {
    if (!options.enablePathProgressive) return pathData;

    if (isPathComplex(pathData, options.pathSegmentThreshold)) {
        return simplifyPathData(pathData, simplificationLevel);
    }

    return pathData;
}

/**
 * Level-of-detail rendering manager
 */
export class LODRenderer {
    private options: ProgressiveRenderOptions;
    private renderCache = new Map<string, any>();

    constructor(options: ProgressiveRenderOptions) {
        this.options = options;
    }

    /**
     * Update LOD options
     */
    updateOptions(options: Partial<ProgressiveRenderOptions>): void {
        this.options = { ...this.options, ...options };
        this.clearCache();
    }

    /**
     * Get render representation for object at current zoom
     */
    getRenderRepresentation(object: CanvasObject, zoom: number): CanvasObject | SimplifiedObject {
        const cacheKey = `${object.id}-${zoom}-${this.options.simplificationLevel}`;

        if (this.renderCache.has(cacheKey)) {
            return this.renderCache.get(cacheKey);
        }

        const renderLevel = determineRenderLevel(zoom, object, this.options);
        let result: CanvasObject | SimplifiedObject;

        switch (renderLevel) {
            case "full":
                result = object;
                break;

            case "simplified":
                result = this.createSimplifiedRepresentation(object);
                break;

            case "placeholder":
                result = this.createPlaceholderRepresentation(object);
                break;

            default:
                result = object;
        }

        this.renderCache.set(cacheKey, result);
        return result;
    }

    /**
     * Create simplified representation of object
     */
    private createSimplifiedRepresentation(object: CanvasObject): SimplifiedObject {
        return createSimplifiedObject(object, this.options.simplificationLevel, false);
    }

    /**
     * Create placeholder representation of object
     */
    private createPlaceholderRepresentation(object: CanvasObject): SimplifiedObject {
        return createSimplifiedObject(object, 1, true);
    }

    /**
     * Clear render cache
     */
    clearCache(): void {
        this.renderCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; memoryUsage: number } {
        return {
            size: this.renderCache.size,
            memoryUsage: this.renderCache.size * 1024, // Rough estimate
        };
    }
}
