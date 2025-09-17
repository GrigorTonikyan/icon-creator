import type { Gradient, Pattern, Effect, FillType, ConicGradient } from "../types/editor";

/**
 * Utility functions for working with gradients
 */
export class GradientUtils {
    /**
     * Generate SVG gradient definition element
     */
    static createGradientDef(gradient: Gradient): SVGElement {
        if (gradient.type === "linear") {
            const linearGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
            linearGrad.id = gradient.id;
            linearGrad.setAttribute("x1", gradient.x1.toString());
            linearGrad.setAttribute("y1", gradient.y1.toString());
            linearGrad.setAttribute("x2", gradient.x2.toString());
            linearGrad.setAttribute("y2", gradient.y2.toString());

            gradient.stops.forEach((stop) => {
                const stopElement = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stopElement.setAttribute("offset", `${stop.offset * 100}%`);
                stopElement.setAttribute("stop-color", stop.color);
                if (stop.opacity !== undefined) {
                    stopElement.setAttribute("stop-opacity", stop.opacity.toString());
                }
                linearGrad.appendChild(stopElement);
            });

            return linearGrad;
        } else if (gradient.type === "radial") {
            const radialGrad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
            radialGrad.id = gradient.id;
            radialGrad.setAttribute("cx", gradient.cx.toString());
            radialGrad.setAttribute("cy", gradient.cy.toString());
            radialGrad.setAttribute("r", gradient.r.toString());

            if (gradient.fx !== undefined) {
                radialGrad.setAttribute("fx", gradient.fx.toString());
            }
            if (gradient.fy !== undefined) {
                radialGrad.setAttribute("fy", gradient.fy.toString());
            }

            gradient.stops.forEach((stop) => {
                const stopElement = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stopElement.setAttribute("offset", `${stop.offset * 100}%`);
                stopElement.setAttribute("stop-color", stop.color);
                if (stop.opacity !== undefined) {
                    stopElement.setAttribute("stop-opacity", stop.opacity.toString());
                }
                radialGrad.appendChild(stopElement);
            });

            return radialGrad;
        } else if (gradient.type === "conic") {
            // For conic gradients, we'll create a simulated version using radial gradient
            // as SVG doesn't natively support conic gradients yet
            const conicGrad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
            conicGrad.id = gradient.id;
            conicGrad.setAttribute("cx", gradient.cx.toString());
            conicGrad.setAttribute("cy", gradient.cy.toString());
            conicGrad.setAttribute("r", "0.7"); // Fixed radius for conic simulation

            // For true conic support, we would need to use a custom filter or pattern
            // For now, simulate with radial gradient arranged as conic stops
            gradient.stops.forEach((stop) => {
                const stopElement = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                stopElement.setAttribute("offset", `${stop.offset * 100}%`);
                stopElement.setAttribute("stop-color", stop.color);
                if (stop.opacity !== undefined) {
                    stopElement.setAttribute("stop-opacity", stop.opacity.toString());
                }
                conicGrad.appendChild(stopElement);
            });

            return conicGrad;
        }

        throw new Error(`Unsupported gradient type: ${(gradient as any).type}`);
    }

    /**
     * Create a default linear gradient
     */
    static createDefaultLinearGradient(id: string): Gradient {
        return {
            type: "linear",
            id,
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 0,
            stops: [
                { offset: 0, color: "#007ACC" },
                { offset: 1, color: "#00C3FF" },
            ],
        };
    }

    /**
     * Create a default radial gradient
     */
    static createDefaultRadialGradient(id: string): Gradient {
        return {
            type: "radial",
            id,
            cx: 0.5,
            cy: 0.5,
            r: 0.5,
            stops: [
                { offset: 0, color: "#ffffff" },
                { offset: 1, color: "#007ACC" },
            ],
        };
    }

    /**
     * Create a default conic gradient
     */
    static createDefaultConicGradient(id: string): ConicGradient {
        return {
            type: "conic",
            id,
            cx: 0.5,
            cy: 0.5,
            startAngle: 0,
            stops: [
                { offset: 0, color: "#ff0000" },
                { offset: 0.25, color: "#ffff00" },
                { offset: 0.5, color: "#00ff00" },
                { offset: 0.75, color: "#00ffff" },
                { offset: 1, color: "#ff0000" },
            ],
        };
    }

    /**
     * Generate unique gradient ID
     */
    static generateGradientId(): string {
        return `grad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Utility functions for working with patterns
 */
export class PatternUtils {
    /**
     * Generate SVG pattern definition element
     */
    static createPatternDef(pattern: Pattern): SVGElement {
        const patternElement = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        patternElement.id = pattern.id;
        patternElement.setAttribute("x", pattern.x.toString());
        patternElement.setAttribute("y", pattern.y.toString());
        patternElement.setAttribute("width", pattern.width.toString());
        patternElement.setAttribute("height", pattern.height.toString());
        patternElement.setAttribute("patternUnits", pattern.patternUnits);
        patternElement.setAttribute("patternContentUnits", pattern.patternContentUnits);

        if (pattern.patternTransform) {
            patternElement.setAttribute("patternTransform", pattern.patternTransform);
        }

        if (pattern.href) {
            // Image pattern
            const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
            image.setAttribute("href", pattern.href);
            image.setAttribute("width", pattern.width.toString());
            image.setAttribute("height", pattern.height.toString());
            patternElement.appendChild(image);
        } else if (pattern.patternType) {
            // Preset pattern types
            this.addPresetPatternElements(patternElement, pattern);
        }

        return patternElement;
    }

    /**
     * Add preset pattern elements based on pattern type
     */
    private static addPresetPatternElements(patternElement: SVGElement, pattern: Pattern): void {
        const { width, height, patternType } = pattern;

        switch (patternType) {
            case "dots":
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", (width / 2).toString());
                circle.setAttribute("cy", (height / 2).toString());
                circle.setAttribute("r", (Math.min(width, height) / 4).toString());
                circle.setAttribute("fill", "#007ACC");
                patternElement.appendChild(circle);
                break;

            case "lines":
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", "0");
                line.setAttribute("y1", (height / 2).toString());
                line.setAttribute("x2", width.toString());
                line.setAttribute("y2", (height / 2).toString());
                line.setAttribute("stroke", "#007ACC");
                line.setAttribute("stroke-width", "2");
                patternElement.appendChild(line);
                break;

            case "grid":
                const horizontalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                horizontalLine.setAttribute("x1", "0");
                horizontalLine.setAttribute("y1", "0");
                horizontalLine.setAttribute("x2", width.toString());
                horizontalLine.setAttribute("y2", "0");
                horizontalLine.setAttribute("stroke", "#007ACC");
                horizontalLine.setAttribute("stroke-width", "1");
                patternElement.appendChild(horizontalLine);

                const verticalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                verticalLine.setAttribute("x1", "0");
                verticalLine.setAttribute("y1", "0");
                verticalLine.setAttribute("x2", "0");
                verticalLine.setAttribute("y2", height.toString());
                verticalLine.setAttribute("stroke", "#007ACC");
                verticalLine.setAttribute("stroke-width", "1");
                patternElement.appendChild(verticalLine);
                break;

            case "diagonal":
                const diagonalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                diagonalLine.setAttribute("x1", "0");
                diagonalLine.setAttribute("y1", "0");
                diagonalLine.setAttribute("x2", width.toString());
                diagonalLine.setAttribute("y2", height.toString());
                diagonalLine.setAttribute("stroke", "#007ACC");
                diagonalLine.setAttribute("stroke-width", "2");
                patternElement.appendChild(diagonalLine);
                break;

            case "checkerboard":
                const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect1.setAttribute("x", "0");
                rect1.setAttribute("y", "0");
                rect1.setAttribute("width", (width / 2).toString());
                rect1.setAttribute("height", (height / 2).toString());
                rect1.setAttribute("fill", "#007ACC");
                patternElement.appendChild(rect1);

                const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect2.setAttribute("x", (width / 2).toString());
                rect2.setAttribute("y", (height / 2).toString());
                rect2.setAttribute("width", (width / 2).toString());
                rect2.setAttribute("height", (height / 2).toString());
                rect2.setAttribute("fill", "#007ACC");
                patternElement.appendChild(rect2);
                break;
        }
    }

    /**
     * Create a default dots pattern
     */
    static createDefaultDotsPattern(id: string): Pattern {
        return {
            type: "pattern",
            id,
            x: 0,
            y: 0,
            width: 20,
            height: 20,
            patternUnits: "userSpaceOnUse",
            patternContentUnits: "userSpaceOnUse",
            patternType: "dots",
        };
    }

    /**
     * Create a default lines pattern
     */
    static createDefaultLinesPattern(id: string): Pattern {
        return {
            type: "pattern",
            id,
            x: 0,
            y: 0,
            width: 20,
            height: 10,
            patternUnits: "userSpaceOnUse",
            patternContentUnits: "userSpaceOnUse",
            patternType: "lines",
        };
    }

    /**
     * Create a default grid pattern
     */
    static createDefaultGridPattern(id: string): Pattern {
        return {
            type: "pattern",
            id,
            x: 0,
            y: 0,
            width: 20,
            height: 20,
            patternUnits: "userSpaceOnUse",
            patternContentUnits: "userSpaceOnUse",
            patternType: "grid",
        };
    }

    /**
     * Generate unique pattern ID
     */
    static generatePatternId(): string {
        return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Utility functions for working with effects
 */
export class EffectUtils {
    /**
     * Generate SVG filter definition for effects
     */
    static createFilterDef(effects: Effect[]): SVGElement | null {
        if (effects.length === 0) return null;

        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        const filterId = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        filter.id = filterId;

        // Calculate filter region based on effects
        let x = "-50%",
            y = "-50%",
            width = "200%",
            height = "200%";

        effects.forEach((effect, index) => {
            if (!effect.enabled) return;

            if (effect.effect.type === "drop-shadow") {
                const shadow = effect.effect;

                // Create flood for shadow color
                const flood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
                flood.setAttribute("flood-color", shadow.color);
                if (shadow.opacity !== undefined) {
                    flood.setAttribute("flood-opacity", shadow.opacity.toString());
                }
                flood.setAttribute("result", `flood${index}`);
                filter.appendChild(flood);

                // Create composite for shadow shape
                const composite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
                composite.setAttribute("in", `flood${index}`);
                composite.setAttribute("in2", "SourceGraphic");
                composite.setAttribute("operator", "in");
                composite.setAttribute("result", `composite${index}`);
                filter.appendChild(composite);

                // Apply blur if needed
                if (shadow.blur > 0) {
                    const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
                    blur.setAttribute("in", `composite${index}`);
                    blur.setAttribute("stdDeviation", shadow.blur.toString());
                    blur.setAttribute("result", `blur${index}`);
                    filter.appendChild(blur);
                }

                // Apply offset
                const offset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
                offset.setAttribute("in", shadow.blur > 0 ? `blur${index}` : `composite${index}`);
                offset.setAttribute("dx", shadow.offsetX.toString());
                offset.setAttribute("dy", shadow.offsetY.toString());
                offset.setAttribute("result", `offset${index}`);
                filter.appendChild(offset);

                // Merge with original
                const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
                const mergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
                mergeNode1.setAttribute("in", `offset${index}`);
                const mergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
                mergeNode2.setAttribute("in", "SourceGraphic");
                merge.appendChild(mergeNode1);
                merge.appendChild(mergeNode2);
                filter.appendChild(merge);
            } else if (effect.effect.type === "blur") {
                const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
                blur.setAttribute("in", index === 0 ? "SourceGraphic" : `result${index - 1}`);
                blur.setAttribute("stdDeviation", effect.effect.radius.toString());
                blur.setAttribute("result", `result${index}`);
                filter.appendChild(blur);
            }
        });

        filter.setAttribute("x", x);
        filter.setAttribute("y", y);
        filter.setAttribute("width", width);
        filter.setAttribute("height", height);

        return filter;
    }

    /**
     * Generate unique filter ID
     */
    static generateFilterId(): string {
        return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Utility functions for resolving fill types
 */
export class FillUtils {
    /**
     * Convert FillType to SVG attribute value
     */
    static toSVGValue(fill: FillType): string {
        if (typeof fill === "string") {
            return fill;
        } else if ("type" in fill && (fill.type === "linear" || fill.type === "radial" || fill.type === "conic")) {
            return `url(#${fill.id})`;
        } else if ("type" in fill && fill.type === "pattern") {
            return `url(#${fill.id})`;
        }
        return "none";
    }

    /**
     * Check if fill type is a gradient
     */
    static isGradient(fill: FillType): fill is Gradient {
        return (
            typeof fill === "object" &&
            "type" in fill &&
            (fill.type === "linear" || fill.type === "radial" || fill.type === "conic")
        );
    }

    /**
     * Check if fill type is a pattern
     */
    static isPattern(fill: FillType): fill is Pattern {
        return typeof fill === "object" && "type" in fill && fill.type === "pattern";
    }

    /**
     * Check if fill type is a solid color
     */
    static isColor(fill: FillType): fill is string {
        return typeof fill === "string";
    }

    /**
     * Convert gradient to CSS representation for preview
     */
    static toCSSGradient(gradient: Gradient): string {
        if (gradient.type === "linear") {
            const stops = gradient.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ");
            const angle = Math.atan2(gradient.y2 - gradient.y1, gradient.x2 - gradient.x1) * (180 / Math.PI);
            return `linear-gradient(${angle}deg, ${stops})`;
        } else if (gradient.type === "radial") {
            const stops = gradient.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ");
            return `radial-gradient(circle at ${gradient.cx * 100}% ${gradient.cy * 100}%, ${stops})`;
        } else if (gradient.type === "conic") {
            const conicGrad = gradient as ConicGradient;
            const stops = conicGrad.stops.map((stop) => `${stop.color} ${stop.offset * 360}deg`).join(", ");
            return `conic-gradient(from ${conicGrad.startAngle}deg at ${conicGrad.cx * 100}% ${
                conicGrad.cy * 100
            }%, ${stops})`;
        }
        return "none";
    }
}
