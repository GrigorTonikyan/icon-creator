/**
 * Performance optimization hook for Canvas rendering
 * Provides viewport culling, object virtualization, and progressive rendering
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CanvasObject, ViewportState } from "../types/editor";
import {
    calculateViewportBounds,
    cullObjects,
    getRenderLevel,
    applyProgressiveRendering,
    createSimplifiedObject,
    LODRenderer,
    PerformanceMonitor,
    RenderBatch,
    debounce,
    type PerformanceMetrics,
    type RenderLevel,
    type ProgressiveRenderOptions,
    type SimplifiedObject,
} from "../utils/performance";

export interface UsePerformanceOptions {
    enableCulling: boolean;
    enableSimplification: boolean;
    enableBatching: boolean;
    enableMonitoring: boolean;
    enableProgressiveRendering: boolean;
    cullMargin?: number;
    maxVisibleObjects?: number;
    renderDebounceMs?: number;
    progressiveOptions?: ProgressiveRenderOptions;
}

export interface PerformanceHookResult {
    visibleObjects: Record<string, CanvasObject | SimplifiedObject>;
    renderLevel: RenderLevel;
    metrics: PerformanceMetrics;
    isPerformanceMode: boolean;
    startFrame: () => void;
    endFrame: () => void;
    batchRender: (operation: () => void) => void;
    logMetrics: () => void;
    lodRenderer: LODRenderer | null;
}

const DEFAULT_PROGRESSIVE_OPTIONS: ProgressiveRenderOptions = {
    enableLOD: true,
    lodThresholds: {
        full: 1.0, // Full detail above 100% zoom
        simplified: 0.5, // Simplified above 50% zoom
        placeholder: 0.1, // Placeholder above 10% zoom
    },
    simplificationLevel: 0.7,
    enablePathProgressive: true,
    pathSegmentThreshold: 20,
};

const DEFAULT_OPTIONS: UsePerformanceOptions = {
    enableCulling: true,
    enableSimplification: true,
    enableBatching: true,
    enableMonitoring: process.env.NODE_ENV === "development",
    enableProgressiveRendering: true,
    cullMargin: 100,
    maxVisibleObjects: 200,
    renderDebounceMs: 16, // ~60fps
    progressiveOptions: DEFAULT_PROGRESSIVE_OPTIONS,
};

/**
 * Performance optimization hook for Canvas rendering
 */
export function usePerformance(
    objects: Record<string, CanvasObject>,
    viewport: ViewportState,
    options: Partial<UsePerformanceOptions> = {}
): PerformanceHookResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Performance monitoring
    const monitorRef = useRef<PerformanceMonitor | null>(null);
    const batchRef = useRef<RenderBatch | null>(null);

    if (!monitorRef.current && opts.enableMonitoring) {
        monitorRef.current = new PerformanceMonitor();
    }

    if (!batchRef.current && opts.enableBatching) {
        batchRef.current = new RenderBatch();
    }

    // Calculate render level based on viewport
    const renderLevel = useMemo(() => {
        // Use a simple reference object for render level calculation
        const referenceObject = Object.values(objects)[0];
        return referenceObject
            ? getRenderLevel(viewport, referenceObject)
            : {
                  minZoom: 0,
                  maxZoom: Infinity,
                  simplified: false,
                  skipDetails: false,
              };
    }, [viewport.zoom, objects]);

    // Determine if we're in performance mode (many objects, low zoom, etc.)
    const isPerformanceMode = useMemo(() => {
        const objectCount = Object.keys(objects).length;
        const isLowZoom = viewport.zoom < 0.5;
        const hasMany = objectCount > opts.maxVisibleObjects!;

        return hasMany || isLowZoom;
    }, [objects, viewport.zoom, opts.maxVisibleObjects]);

    // LOD Renderer for progressive rendering
    const lodRenderer = useMemo(() => {
        if (opts.enableProgressiveRendering && opts.progressiveOptions) {
            return new LODRenderer(opts.progressiveOptions);
        }
        return null;
    }, [opts.enableProgressiveRendering, opts.progressiveOptions]);

    // Cull and simplify objects
    const processedObjects = useMemo(() => {
        let result: Record<string, CanvasObject | SimplifiedObject> = { ...objects };

        // Step 1: Viewport culling
        if (opts.enableCulling) {
            const { visibleObjects } = cullObjects(objects, viewport);
            result = visibleObjects;
        }

        // Step 2: Progressive rendering with LOD
        if (opts.enableProgressiveRendering && lodRenderer && opts.progressiveOptions) {
            const progressiveResult: Record<string, CanvasObject | SimplifiedObject> = {};
            Object.entries(result).forEach(([id, obj]) => {
                progressiveResult[id] = lodRenderer.getRenderRepresentation(obj as CanvasObject, viewport.zoom);
            });
            result = progressiveResult;
        }

        // Step 3: Object simplification for low zoom levels (fallback)
        else if (opts.enableSimplification && renderLevel.simplified) {
            const simplified: Record<string, CanvasObject | SimplifiedObject> = {};
            Object.entries(result).forEach(([id, obj]) => {
                simplified[id] = createSimplifiedObject(obj as CanvasObject, 0.5, false);
            });
            result = simplified;
        }

        // Step 4: Limit visible objects if necessary
        if (opts.maxVisibleObjects && Object.keys(result).length > opts.maxVisibleObjects) {
            const entries = Object.entries(result);
            // Sort by z-index and visibility priority
            entries.sort(([, a], [, b]) => {
                const aObj = "originalObject" in a ? a.originalObject : a;
                const bObj = "originalObject" in b ? b.originalObject : b;
                return (bObj.zIndex || 0) - (aObj.zIndex || 0);
            });

            const limited: Record<string, CanvasObject | SimplifiedObject> = {};
            entries.slice(0, opts.maxVisibleObjects).forEach(([id, obj]) => {
                limited[id] = obj;
            });
            result = limited;
        }

        return result;
    }, [
        objects,
        viewport,
        renderLevel,
        opts.enableCulling,
        opts.enableSimplification,
        opts.enableProgressiveRendering,
        opts.maxVisibleObjects,
        lodRenderer,
        opts.progressiveOptions,
    ]);

    // Debounced expensive operations
    const debouncedExpensiveOp = useCallback(
        debounce(() => {
            // Clear LOD cache to prevent memory leaks
            if (lodRenderer) {
                lodRenderer.clearCache();
            }
        }, opts.renderDebounceMs || 16),
        [opts.renderDebounceMs, lodRenderer]
    );

    // Effect to handle viewport changes
    useEffect(() => {
        debouncedExpensiveOp();
    }, [viewport, debouncedExpensiveOp]);

    // Performance monitoring methods
    const startFrame = useCallback(() => {
        if (opts.enableMonitoring && monitorRef.current) {
            monitorRef.current.startFrame();
        }
    }, [opts.enableMonitoring]);

    const endFrame = useCallback(() => {
        if (opts.enableMonitoring && monitorRef.current) {
            const visibleCount = Object.keys(processedObjects).length;
            const totalCount = Object.keys(objects).length;
            const culledCount = totalCount - visibleCount;

            monitorRef.current.endFrame(visibleCount, culledCount);
        }
    }, [opts.enableMonitoring, processedObjects, objects]);

    // Batch rendering method
    const batchRender = useCallback(
        (operation: () => void) => {
            if (opts.enableBatching && batchRef.current) {
                batchRef.current.add(operation);
            } else {
                operation();
            }
        },
        [opts.enableBatching]
    );

    // Log performance metrics
    const logMetrics = useCallback(() => {
        if (opts.enableMonitoring && monitorRef.current) {
            monitorRef.current.logMetrics();
        }
    }, [opts.enableMonitoring]);

    // Get current metrics
    const metrics = useMemo(() => {
        if (opts.enableMonitoring && monitorRef.current) {
            return monitorRef.current.getMetrics();
        }

        return {
            visibleObjects: Object.keys(processedObjects).length,
            culledObjects: Object.keys(objects).length - Object.keys(processedObjects).length,
            renderTime: 0,
            frameRate: 60,
            memoryUsage: 0,
        };
    }, [opts.enableMonitoring, processedObjects, objects]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (batchRef.current) {
                batchRef.current.clear();
            }

            // Cancel any pending debounced operations
            debouncedExpensiveOp.cancel();
        };
    }, [debouncedExpensiveOp]);

    return {
        visibleObjects: processedObjects,
        renderLevel,
        metrics,
        isPerformanceMode,
        startFrame,
        endFrame,
        batchRender,
        logMetrics,
        lodRenderer,
    };
}

/**
 * Hook for monitoring render performance
 */
export function useRenderPerformance() {
    const startTimeRef = useRef<number>(0);
    const frameCountRef = useRef<number>(0);
    const lastLogTimeRef = useRef<number>(Date.now());

    const startRender = useCallback(() => {
        startTimeRef.current = performance.now();
    }, []);

    const endRender = useCallback(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTimeRef.current;

        frameCountRef.current++;

        // Log every second in development
        if (process.env.NODE_ENV === "development") {
            const now = Date.now();
            if (now - lastLogTimeRef.current >= 1000) {
                const fps = frameCountRef.current;
                console.log(`Render Performance: ${renderTime.toFixed(2)}ms, ${fps} FPS`);

                frameCountRef.current = 0;
                lastLogTimeRef.current = now;
            }
        }

        return renderTime;
    }, []);

    return { startRender, endRender };
}

/**
 * Hook for object pooling
 */
export function useObjectPool<T>(createFn: () => T, resetFn: (item: T) => void, dependencies: any[] = []) {
    const poolRef = useRef<T[]>([]);

    const acquire = useCallback(() => {
        const item = poolRef.current.pop();
        if (item) {
            resetFn(item);
            return item;
        }
        return createFn();
    }, [createFn, resetFn]);

    const release = useCallback((item: T) => {
        poolRef.current.push(item);
    }, []);

    // Clear pool when dependencies change
    useEffect(() => {
        poolRef.current.length = 0;
    }, dependencies);

    return { acquire, release };
}
