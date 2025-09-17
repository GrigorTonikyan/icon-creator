import { GradientUtils, PatternUtils, EffectUtils, FillUtils } from "../utils/gradientUtils";
import type { CanvasObject, Effect, FillType } from "../types/editor";

/**
 * Enhanced Canvas renderer that supports gradients, patterns, and effects
 */
export class CanvasRenderer {
    private svgElement: SVGSVGElement;
    private defsElement: SVGDefsElement;
    private gradientDefinitions = new Map<string, SVGElement>();
    private patternDefinitions = new Map<string, SVGElement>();
    private filterDefinitions = new Map<string, SVGElement>();

    constructor(svgElement: SVGSVGElement) {
        this.svgElement = svgElement;
        this.setupDefs();
    }

    /**
     * Set up the defs element for gradients, patterns, and filters
     */
    private setupDefs() {
        let defs = this.svgElement.querySelector("defs") as SVGDefsElement;
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            this.svgElement.insertBefore(defs, this.svgElement.firstChild);
        }
        this.defsElement = defs;
    }

    /**
     * Add or update gradient definition
     */
    addGradientDefinition(gradient: any) {
        if (!FillUtils.isGradient(gradient)) return;

        // Remove existing definition if present
        const existing = this.gradientDefinitions.get(gradient.id);
        if (existing) {
            this.defsElement.removeChild(existing);
        }

        // Create new gradient definition
        const gradientElement = GradientUtils.createGradientDef(gradient);
        this.defsElement.appendChild(gradientElement);
        this.gradientDefinitions.set(gradient.id, gradientElement);
    }

    /**
     * Add or update pattern definition
     */
    addPatternDefinition(pattern: any) {
        if (!FillUtils.isPattern(pattern)) return;

        // Remove existing definition if present
        const existing = this.patternDefinitions.get(pattern.id);
        if (existing) {
            this.defsElement.removeChild(existing);
        }

        // Create new pattern definition
        const patternElement = PatternUtils.createPatternDef(pattern);
        this.defsElement.appendChild(patternElement);
        this.patternDefinitions.set(pattern.id, patternElement);
    }

    /**
     * Add or update filter definition for effects
     */
    addFilterDefinition(effects: Effect[], filterId: string) {
        // Remove existing definition if present
        const existing = this.filterDefinitions.get(filterId);
        if (existing) {
            this.defsElement.removeChild(existing);
        }

        // Create new filter definition
        const filterElement = EffectUtils.createFilterDef(effects);
        if (filterElement) {
            filterElement.id = filterId;
            this.defsElement.appendChild(filterElement);
            this.filterDefinitions.set(filterId, filterElement);
        }
    }

    /**
     * Process fills for a canvas object and ensure definitions are available
     */
    processFills(object: CanvasObject) {
        if ("style" in object && object.style) {
            // Process fill
            if (object.style.fill && FillUtils.isGradient(object.style.fill)) {
                this.addGradientDefinition(object.style.fill);
            } else if (object.style.fill && FillUtils.isPattern(object.style.fill)) {
                this.addPatternDefinition(object.style.fill);
            }

            // Process stroke
            if (object.style.stroke && FillUtils.isGradient(object.style.stroke)) {
                this.addGradientDefinition(object.style.stroke);
            } else if (object.style.stroke && FillUtils.isPattern(object.style.stroke)) {
                this.addPatternDefinition(object.style.stroke);
            }

            // Process effects
            if (object.style.effects && object.style.effects.length > 0) {
                const filterId = `filter-${object.id}`;
                this.addFilterDefinition(object.style.effects, filterId);
            }
        }
    }

    /**
     * Get SVG attributes for fill
     */
    getFillAttributes(fill: FillType): { fill: string; [key: string]: string } {
        return {
            fill: FillUtils.toSVGValue(fill),
        };
    }

    /**
     * Get SVG attributes for stroke
     */
    getStrokeAttributes(stroke: FillType): { stroke: string; [key: string]: string } {
        return {
            stroke: FillUtils.toSVGValue(stroke),
        };
    }

    /**
     * Get SVG filter attribute for effects
     */
    getFilterAttribute(objectId: string, effects?: Effect[]): { filter?: string } {
        if (!effects || effects.length === 0) {
            return {};
        }

        const enabledEffects = effects.filter((effect) => effect.enabled);
        if (enabledEffects.length === 0) {
            return {};
        }

        return {
            filter: `url(#filter-${objectId})`,
        };
    }

    /**
     * Clean up unused definitions
     */
    cleanup() {
        // This could be called periodically to remove unused gradients, patterns, and filters
        // For now, we'll keep all definitions to avoid issues with undo/redo
    }
}

/**
 * Hook for using canvas renderer in components
 */
export function useCanvasRenderer(svgRef: React.RefObject<SVGSVGElement | null>) {
    const renderer = React.useRef<CanvasRenderer | null>(null);

    React.useEffect(() => {
        if (svgRef.current && !renderer.current) {
            renderer.current = new CanvasRenderer(svgRef.current);
        }
    }, [svgRef]);

    return renderer.current;
}

// Import React for the hook
import React from "react";
