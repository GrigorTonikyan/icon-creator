import type {
    Effect,
    EffectType,
    DropShadow,
    InnerShadow,
    Glow,
    Blur,
    Brightness,
    Contrast,
    Saturation,
    HueRotate,
} from "../types/editor";

/**
 * Utility functions for working with visual effects
 */
export class EffectUtils {
    /**
     * Generate a unique effect ID
     */
    static generateEffectId(): string {
        return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create default drop shadow effect
     */
    static createDefaultDropShadow(): DropShadow {
        return {
            type: "drop-shadow",
            offsetX: 0,
            offsetY: 4,
            blur: 8,
            color: "#000000",
            opacity: 0.25,
        };
    }

    /**
     * Create default inner shadow effect
     */
    static createDefaultInnerShadow(): InnerShadow {
        return {
            type: "inner-shadow",
            offsetX: 0,
            offsetY: 2,
            blur: 4,
            color: "#000000",
            opacity: 0.25,
        };
    }

    /**
     * Create default glow effect
     */
    static createDefaultGlow(): Glow {
        return {
            type: "glow",
            blur: 8,
            color: "#007ACC",
            opacity: 0.6,
            spread: 0,
        };
    }

    /**
     * Create default blur effect
     */
    static createDefaultBlur(): Blur {
        return {
            type: "blur",
            radius: 4,
        };
    }

    /**
     * Create default brightness effect
     */
    static createDefaultBrightness(): Brightness {
        return {
            type: "brightness",
            value: 1.2,
        };
    }

    /**
     * Create default contrast effect
     */
    static createDefaultContrast(): Contrast {
        return {
            type: "contrast",
            value: 1.2,
        };
    }

    /**
     * Create default saturation effect
     */
    static createDefaultSaturation(): Saturation {
        return {
            type: "saturation",
            value: 1.3,
        };
    }

    /**
     * Create default hue rotate effect
     */
    static createDefaultHueRotate(): HueRotate {
        return {
            type: "hue-rotate",
            degrees: 90,
        };
    }

    /**
     * Create a new effect with default values based on type
     */
    static createEffect(type: EffectType["type"]): Effect {
        let effect: EffectType;

        switch (type) {
            case "drop-shadow":
                effect = this.createDefaultDropShadow();
                break;
            case "inner-shadow":
                effect = this.createDefaultInnerShadow();
                break;
            case "glow":
                effect = this.createDefaultGlow();
                break;
            case "blur":
                effect = this.createDefaultBlur();
                break;
            case "brightness":
                effect = this.createDefaultBrightness();
                break;
            case "contrast":
                effect = this.createDefaultContrast();
                break;
            case "saturation":
                effect = this.createDefaultSaturation();
                break;
            case "hue-rotate":
                effect = this.createDefaultHueRotate();
                break;
            default:
                throw new Error(`Unknown effect type: ${type}`);
        }

        return {
            id: this.generateEffectId(),
            enabled: true,
            effect,
        };
    }

    /**
     * Create a default effect based on effect type string
     */
    static createDefaultEffect(type: string): Effect {
        return this.createEffect(type as EffectType["type"]);
    }

    /**
     * Convert effect to CSS filter string
     */
    static effectToCSSFilter(effect: EffectType): string {
        switch (effect.type) {
            case "drop-shadow":
                return `drop-shadow(${effect.offsetX}px ${effect.offsetY}px ${effect.blur}px ${this.colorWithOpacity(
                    effect.color,
                    effect.opacity
                )})`;
            case "inner-shadow":
                // CSS doesn't have inner-shadow, we'll simulate with inset box-shadow
                return `inset ${effect.offsetX}px ${effect.offsetY}px ${effect.blur}px ${this.colorWithOpacity(
                    effect.color,
                    effect.opacity
                )}`;
            case "glow":
                // Glow as outer shadow with no offset
                return `drop-shadow(0px 0px ${effect.blur}px ${this.colorWithOpacity(effect.color, effect.opacity)})`;
            case "blur":
                return `blur(${effect.radius}px)`;
            case "brightness":
                return `brightness(${effect.value})`;
            case "contrast":
                return `contrast(${effect.value})`;
            case "saturation":
                return `saturate(${effect.value})`;
            case "hue-rotate":
                return `hue-rotate(${effect.degrees}deg)`;
            default:
                return "";
        }
    }

    /**
     * Convert multiple effects to combined CSS filter string
     */
    static effectsToCSSFilter(effects: Effect[]): string {
        const enabledEffects = effects.filter((e) => e.enabled);
        const filterStrings = enabledEffects.map((e) => this.effectToCSSFilter(e.effect));
        return filterStrings.join(" ");
    }

    /**
     * Convert effect to SVG filter element
     */
    static createSVGFilter(effects: Effect[]): SVGFilterElement | null {
        if (effects.length === 0) return null;

        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.id = `filter_${this.generateEffectId()}`;
        filter.setAttribute("x", "-50%");
        filter.setAttribute("y", "-50%");
        filter.setAttribute("width", "200%");
        filter.setAttribute("height", "200%");

        let lastResult = "SourceGraphic";

        effects.forEach((effect, index) => {
            if (!effect.enabled) return;

            const resultId = `effect${index}`;

            switch (effect.effect.type) {
                case "drop-shadow": {
                    const e = effect.effect;

                    // Create flood for shadow color
                    const flood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
                    flood.setAttribute("flood-color", e.color);
                    flood.setAttribute("flood-opacity", (e.opacity ?? 1).toString());
                    flood.setAttribute("result", `flood${index}`);
                    filter.appendChild(flood);

                    // Create composite for shadow shape
                    const composite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
                    composite.setAttribute("operator", "in");
                    composite.setAttribute("in", `flood${index}`);
                    composite.setAttribute("in2", "SourceGraphic");
                    composite.setAttribute("result", `shadow${index}`);
                    filter.appendChild(composite);

                    // Create gaussian blur
                    const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
                    blur.setAttribute("in", `shadow${index}`);
                    blur.setAttribute("stdDeviation", (e.blur / 2).toString());
                    blur.setAttribute("result", `shadowBlur${index}`);
                    filter.appendChild(blur);

                    // Create offset
                    const offset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
                    offset.setAttribute("in", `shadowBlur${index}`);
                    offset.setAttribute("dx", e.offsetX.toString());
                    offset.setAttribute("dy", e.offsetY.toString());
                    offset.setAttribute("result", `shadowOffset${index}`);
                    filter.appendChild(offset);

                    // Merge with previous result
                    const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
                    merge.setAttribute("result", resultId);

                    const mergeNode1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
                    mergeNode1.setAttribute("in", `shadowOffset${index}`);
                    merge.appendChild(mergeNode1);

                    const mergeNode2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
                    mergeNode2.setAttribute("in", lastResult);
                    merge.appendChild(mergeNode2);

                    filter.appendChild(merge);
                    break;
                }
                case "blur": {
                    const e = effect.effect;
                    const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
                    blur.setAttribute("in", lastResult);
                    blur.setAttribute("stdDeviation", (e.radius / 2).toString());
                    blur.setAttribute("result", resultId);
                    filter.appendChild(blur);
                    break;
                }
                case "brightness": {
                    const e = effect.effect;
                    const colorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
                    colorMatrix.setAttribute("in", lastResult);
                    colorMatrix.setAttribute("type", "matrix");
                    const v = e.value;
                    colorMatrix.setAttribute("values", `${v} 0 0 0 0  0 ${v} 0 0 0  0 0 ${v} 0 0  0 0 0 1 0`);
                    colorMatrix.setAttribute("result", resultId);
                    filter.appendChild(colorMatrix);
                    break;
                }
                case "contrast": {
                    const e = effect.effect;
                    const colorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
                    colorMatrix.setAttribute("in", lastResult);
                    colorMatrix.setAttribute("type", "matrix");
                    const v = e.value;
                    const offset = (1 - v) / 2;
                    colorMatrix.setAttribute(
                        "values",
                        `${v} 0 0 0 ${offset}  0 ${v} 0 0 ${offset}  0 0 ${v} 0 ${offset}  0 0 0 1 0`
                    );
                    colorMatrix.setAttribute("result", resultId);
                    filter.appendChild(colorMatrix);
                    break;
                }
                case "saturation": {
                    const e = effect.effect;
                    const colorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
                    colorMatrix.setAttribute("in", lastResult);
                    colorMatrix.setAttribute("type", "saturate");
                    colorMatrix.setAttribute("values", e.value.toString());
                    colorMatrix.setAttribute("result", resultId);
                    filter.appendChild(colorMatrix);
                    break;
                }
                case "hue-rotate": {
                    const e = effect.effect;
                    const colorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
                    colorMatrix.setAttribute("in", lastResult);
                    colorMatrix.setAttribute("type", "hueRotate");
                    colorMatrix.setAttribute("values", e.degrees.toString());
                    colorMatrix.setAttribute("result", resultId);
                    filter.appendChild(colorMatrix);
                    break;
                }
            }

            lastResult = resultId;
        });

        return filter;
    }

    /**
     * Helper function to add opacity to color
     */
    private static colorWithOpacity(color: string, opacity?: number): string {
        if (opacity === undefined) return color;

        // Convert hex to rgba if needed
        if (color.startsWith("#")) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        // If already rgba, update opacity
        if (color.startsWith("rgba")) {
            return color.replace(/,\s*[\d.]+\)/, `, ${opacity})`);
        }

        // If rgb, convert to rgba
        if (color.startsWith("rgb")) {
            return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
        }

        return color;
    }

    /**
     * Check if effect is a shadow type
     */
    static isShadowEffect(effect: EffectType): effect is DropShadow | InnerShadow | Glow {
        return effect.type === "drop-shadow" || effect.type === "inner-shadow" || effect.type === "glow";
    }

    /**
     * Check if effect is a filter type
     */
    static isFilterEffect(effect: EffectType): effect is Blur | Brightness | Contrast | Saturation | HueRotate {
        return ["blur", "brightness", "contrast", "saturation", "hue-rotate"].includes(effect.type);
    }

    /**
     * Get effect category
     */
    static getEffectCategory(effect: EffectType): "shadow" | "filter" {
        return this.isShadowEffect(effect) ? "shadow" : "filter";
    }

    /**
     * Get human-readable effect name
     */
    static getEffectDisplayName(effectType: EffectType["type"]): string {
        const names: Record<EffectType["type"], string> = {
            "drop-shadow": "Drop Shadow",
            "inner-shadow": "Inner Shadow",
            glow: "Glow",
            blur: "Blur",
            brightness: "Brightness",
            contrast: "Contrast",
            saturation: "Saturation",
            "hue-rotate": "Hue Rotate",
        };
        return names[effectType] || effectType;
    }

    /**
     * Get available effect types
     */
    static getAvailableEffectTypes(): EffectType["type"][] {
        return ["drop-shadow", "inner-shadow", "glow", "blur", "brightness", "contrast", "saturation", "hue-rotate"];
    }
}
