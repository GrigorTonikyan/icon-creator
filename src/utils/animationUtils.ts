import type {
    AnimationTimeline,
    AnimationTrack,
    AnimationKeyframe,
    AnimationEasing,
    MotionPath,
    AnimationPreview,
    AnimationExportOptions,
    CanvasObject,
    Point,
} from "../types/editor";

/**
 * Utility class for managing animations, timelines, and motion paths
 */
export class AnimationUtils {
    /**
     * Creates a new animation timeline
     */
    static createTimeline(
        options: {
            name?: string;
            duration?: number;
            loop?: boolean;
            autoPlay?: boolean;
        } = {}
    ): AnimationTimeline {
        return {
            id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: options.name || "New Timeline",
            duration: options.duration || 5.0, // 5 seconds default
            tracks: [],
            loop: options.loop ?? false,
            autoPlay: options.autoPlay ?? false,
            currentTime: 0,
            isPlaying: false,
        };
    }

    /**
     * Creates a new animation track for an object property
     */
    static createTrack(objectId: string, property: string, initialValue?: unknown): AnimationTrack {
        const track: AnimationTrack = {
            id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            objectId,
            property,
            keyframes: [],
            enabled: true,
        };

        // Add initial keyframe if value provided
        if (initialValue !== undefined) {
            track.keyframes.push(this.createKeyframe(0, { [property]: initialValue }));
        }

        return track;
    }

    /**
     * Creates a new keyframe
     */
    static createKeyframe(
        time: number,
        properties: Record<string, unknown>,
        easing?: AnimationEasing
    ): AnimationKeyframe {
        return {
            id: `keyframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            time,
            properties,
            easing: easing || { type: "ease" },
        };
    }

    /**
     * Creates a motion path for an object
     */
    static createMotionPath(objectId: string, path: string, duration: number = 3.0): MotionPath {
        return {
            id: `motionpath_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            objectId,
            path,
            duration,
            offset: 0,
            rotate: true,
            easing: { type: "ease" },
        };
    }

    /**
     * Creates an animation preview
     */
    static createPreview(timeline: AnimationTimeline, motionPaths: MotionPath[] = []): AnimationPreview {
        return {
            timeline,
            motionPaths,
            showKeyframes: true,
            showPaths: true,
            playbackSpeed: 1.0,
        };
    }

    /**
     * Adds a track to a timeline
     */
    static addTrackToTimeline(timeline: AnimationTimeline, track: AnimationTrack): AnimationTimeline {
        return {
            ...timeline,
            tracks: [...timeline.tracks, track],
        };
    }

    /**
     * Removes a track from a timeline
     */
    static removeTrackFromTimeline(timeline: AnimationTimeline, trackId: string): AnimationTimeline {
        return {
            ...timeline,
            tracks: timeline.tracks.filter((track) => track.id !== trackId),
        };
    }

    /**
     * Updates a track in a timeline
     */
    static updateTrackInTimeline(
        timeline: AnimationTimeline,
        trackId: string,
        updates: Partial<AnimationTrack>
    ): AnimationTimeline {
        return {
            ...timeline,
            tracks: timeline.tracks.map((track) => (track.id === trackId ? { ...track, ...updates } : track)),
        };
    }

    /**
     * Adds a keyframe to a track
     */
    static addKeyframeToTrack(track: AnimationTrack, keyframe: AnimationKeyframe): AnimationTrack {
        const keyframes = [...track.keyframes, keyframe].sort((a, b) => a.time - b.time);
        return { ...track, keyframes };
    }

    /**
     * Removes a keyframe from a track
     */
    static removeKeyframeFromTrack(track: AnimationTrack, keyframeId: string): AnimationTrack {
        return {
            ...track,
            keyframes: track.keyframes.filter((kf) => kf.id !== keyframeId),
        };
    }

    /**
     * Updates a keyframe in a track
     */
    static updateKeyframeInTrack(
        track: AnimationTrack,
        keyframeId: string,
        updates: Partial<AnimationKeyframe>
    ): AnimationTrack {
        return {
            ...track,
            keyframes: track.keyframes.map((kf) => (kf.id === keyframeId ? { ...kf, ...updates } : kf)),
        };
    }

    /**
     * Interpolates between two values based on time and easing
     */
    static interpolateValue(
        startValue: unknown,
        endValue: unknown,
        progress: number,
        easing: AnimationEasing = { type: "linear" }
    ): unknown {
        // Apply easing to progress
        const easedProgress = this.applyEasing(progress, easing);

        // Handle different value types
        if (typeof startValue === "number" && typeof endValue === "number") {
            return startValue + (endValue - startValue) * easedProgress;
        }

        if (typeof startValue === "string" && typeof endValue === "string") {
            // Handle color interpolation
            if (this.isColor(startValue) && this.isColor(endValue)) {
                return this.interpolateColor(startValue, endValue, easedProgress);
            }
            // For other strings, snap to end value at 50% progress
            return easedProgress < 0.5 ? startValue : endValue;
        }

        // For objects (like transforms), interpolate each numeric property
        if (
            typeof startValue === "object" &&
            typeof endValue === "object" &&
            startValue !== null &&
            endValue !== null
        ) {
            const result: Record<string, unknown> = { ...(startValue as Record<string, unknown>) };
            const endObj = endValue as Record<string, unknown>;

            for (const key in endObj) {
                if (typeof result[key] === "number" && typeof endObj[key] === "number") {
                    result[key] =
                        (result[key] as number) + ((endObj[key] as number) - (result[key] as number)) * easedProgress;
                }
            }
            return result;
        }

        // Default: snap to end value at 50% progress
        return easedProgress < 0.5 ? startValue : endValue;
    }

    /**
     * Applies easing function to progress value
     */
    static applyEasing(progress: number, easing: AnimationEasing): number {
        progress = Math.max(0, Math.min(1, progress));

        switch (easing.type) {
            case "linear":
                return progress;
            case "ease":
                return this.cubicBezier(progress, 0.25, 0.1, 0.25, 1);
            case "ease-in":
                return this.cubicBezier(progress, 0.42, 0, 1, 1);
            case "ease-out":
                return this.cubicBezier(progress, 0, 0, 0.58, 1);
            case "ease-in-out":
                return this.cubicBezier(progress, 0.42, 0, 0.58, 1);
            case "cubic-bezier":
                if (easing.values) {
                    return this.cubicBezier(progress, ...easing.values);
                }
                return progress;
            default:
                return progress;
        }
    }

    /**
     * Cubic bezier easing function
     */
    private static cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
        // Simplified cubic bezier implementation
        // For production, consider using a more precise algorithm
        const cx = 3 * x1;
        const bx = 3 * (x2 - x1) - cx;
        const ax = 1 - cx - bx;

        const cy = 3 * y1;
        const by = 3 * (y2 - y1) - cy;
        const ay = 1 - cy - by;

        const cubeRoot = (x: number) => Math.pow(x, 1 / 3);

        return ((ay * t + by) * t + cy) * t;
    }

    /**
     * Checks if a string is a color value
     */
    private static isColor(value: string): boolean {
        return (
            /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) ||
            /^rgb\(/.test(value) ||
            /^rgba\(/.test(value) ||
            /^hsl\(/.test(value) ||
            /^hsla\(/.test(value)
        );
    }

    /**
     * Interpolates between two color values
     */
    private static interpolateColor(startColor: string, endColor: string, progress: number): string {
        // Parse colors to RGB
        const start = this.parseColor(startColor);
        const end = this.parseColor(endColor);

        if (!start || !end) return progress < 0.5 ? startColor : endColor;

        // Interpolate RGB values
        const r = Math.round(start.r + (end.r - start.r) * progress);
        const g = Math.round(start.g + (end.g - start.g) * progress);
        const b = Math.round(start.b + (end.b - start.b) * progress);
        const a = start.a + (end.a - start.a) * progress;

        return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Parses a color string to RGBA values
     */
    private static parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
        // Handle hex colors
        if (color.startsWith("#")) {
            const hex = color.slice(1);
            if (hex.length === 3) {
                return {
                    r: parseInt(hex[0] + hex[0], 16),
                    g: parseInt(hex[1] + hex[1], 16),
                    b: parseInt(hex[2] + hex[2], 16),
                    a: 1,
                };
            }
            if (hex.length === 6) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a: 1,
                };
            }
        }

        // Handle rgb/rgba colors
        const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
        if (rgbMatch) {
            const values = rgbMatch[1].split(",").map((v) => parseFloat(v.trim()));
            return {
                r: values[0] || 0,
                g: values[1] || 0,
                b: values[2] || 0,
                a: values[3] !== undefined ? values[3] : 1,
            };
        }

        return null;
    }

    /**
     * Gets the animated value for an object property at a specific time
     */
    static getAnimatedValue(track: AnimationTrack, time: number, defaultValue?: unknown): unknown {
        const { keyframes } = track;

        if (keyframes.length === 0) return defaultValue;
        if (keyframes.length === 1) return keyframes[0].properties[track.property];

        // Sort keyframes by time
        const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

        // Find surrounding keyframes
        let startFrame = sortedKeyframes[0];
        let endFrame = sortedKeyframes[0];

        for (let i = 0; i < sortedKeyframes.length; i++) {
            if (sortedKeyframes[i].time <= time) {
                startFrame = sortedKeyframes[i];
            }
            if (sortedKeyframes[i].time >= time) {
                endFrame = sortedKeyframes[i];
                break;
            }
        }

        // If we're exactly on a keyframe, return its value
        if (startFrame.time === time) {
            return startFrame.properties[track.property];
        }

        if (endFrame.time === time) {
            return endFrame.properties[track.property];
        }

        // Interpolate between keyframes
        if (startFrame.id !== endFrame.id) {
            const duration = endFrame.time - startFrame.time;
            const progress = duration > 0 ? (time - startFrame.time) / duration : 0;

            return this.interpolateValue(
                startFrame.properties[track.property],
                endFrame.properties[track.property],
                progress,
                endFrame.easing
            );
        }

        return startFrame.properties[track.property];
    }

    /**
     * Generates SVG path for motion along a path
     */
    static generateMotionPathSVG(motionPath: MotionPath): string {
        return `<path d="${motionPath.path}" stroke="#ff6b6b" stroke-width="2" stroke-dasharray="5,5" fill="none" opacity="0.7" />`;
    }

    /**
     * Gets position along a motion path at a specific time
     */
    static getPositionOnPath(motionPath: MotionPath, time: number): { x: number; y: number; rotation?: number } | null {
        const progress = Math.max(0, Math.min(1, time / motionPath.duration));
        const easedProgress = this.applyEasing(progress, motionPath.easing || { type: "linear" });
        const pathProgress = motionPath.offset + easedProgress * (1 - motionPath.offset);

        // This is a simplified implementation
        // For production, use a proper SVG path parsing library
        const pathData = this.parsePathData(motionPath.path);
        if (!pathData || pathData.length === 0) return null;

        const targetDistance = pathProgress * this.getPathLength(pathData);
        return this.getPointAtDistance(pathData, targetDistance, motionPath.rotate);
    }

    /**
     * Parses SVG path data into commands (simplified)
     */
    private static parsePathData(pathData: string): Array<{ command: string; x: number; y: number }> {
        // Simplified path parsing - in production, use a proper SVG path parser
        const commands: Array<{ command: string; x: number; y: number }> = [];
        const regex = /([MLC])\s*([^MLC]*)/g;
        let match;

        while ((match = regex.exec(pathData)) !== null) {
            const [, command, coords] = match;
            const values = coords
                .trim()
                .split(/[\s,]+/)
                .map(Number)
                .filter((n) => !isNaN(n));

            for (let i = 0; i < values.length; i += 2) {
                if (values[i + 1] !== undefined) {
                    commands.push({
                        command,
                        x: values[i],
                        y: values[i + 1],
                    });
                }
            }
        }

        return commands;
    }

    /**
     * Gets approximate path length (simplified)
     */
    private static getPathLength(pathData: Array<{ command: string; x: number; y: number }>): number {
        let length = 0;
        let lastPoint = { x: 0, y: 0 };

        for (const cmd of pathData) {
            if (cmd.command === "M") {
                lastPoint = { x: cmd.x, y: cmd.y };
            } else {
                const distance = Math.sqrt(Math.pow(cmd.x - lastPoint.x, 2) + Math.pow(cmd.y - lastPoint.y, 2));
                length += distance;
                lastPoint = { x: cmd.x, y: cmd.y };
            }
        }

        return length;
    }

    /**
     * Gets point at distance along path (simplified)
     */
    private static getPointAtDistance(
        pathData: Array<{ command: string; x: number; y: number }>,
        distance: number,
        rotate: boolean = false
    ): { x: number; y: number; rotation?: number } {
        let currentDistance = 0;
        let lastPoint = { x: 0, y: 0 };

        for (let i = 0; i < pathData.length; i++) {
            const cmd = pathData[i];

            if (cmd.command === "M") {
                lastPoint = { x: cmd.x, y: cmd.y };
                continue;
            }

            const segmentLength = Math.sqrt(Math.pow(cmd.x - lastPoint.x, 2) + Math.pow(cmd.y - lastPoint.y, 2));

            if (currentDistance + segmentLength >= distance) {
                const segmentProgress = (distance - currentDistance) / segmentLength;
                const x = lastPoint.x + (cmd.x - lastPoint.x) * segmentProgress;
                const y = lastPoint.y + (cmd.y - lastPoint.y) * segmentProgress;

                let rotation;
                if (rotate) {
                    rotation = Math.atan2(cmd.y - lastPoint.y, cmd.x - lastPoint.x) * (180 / Math.PI);
                }

                return { x, y, rotation };
            }

            currentDistance += segmentLength;
            lastPoint = { x: cmd.x, y: cmd.y };
        }

        // Return last point if distance exceeds path length
        const last = pathData[pathData.length - 1];
        return { x: last.x, y: last.y };
    }

    /**
     * Exports animation to CSS keyframes
     */
    static exportToCSS(timeline: AnimationTimeline, motionPaths: MotionPath[] = []): string {
        let css = "";

        // Generate keyframes for each track
        for (const track of timeline.tracks) {
            if (!track.enabled || track.keyframes.length === 0) continue;

            const keyframeName = `animation_${track.objectId}_${track.property.replace(/\./g, "_")}`;
            css += `@keyframes ${keyframeName} {\n`;

            for (const keyframe of track.keyframes) {
                const percentage = (keyframe.time / timeline.duration) * 100;
                const value = keyframe.properties[track.property];
                css += `  ${percentage.toFixed(2)}% { ${this.cssPropertyName(track.property)}: ${this.cssPropertyValue(
                    value
                )}; }\n`;
            }

            css += "}\n\n";
        }

        // Generate motion path animations
        for (const motionPath of motionPaths) {
            const keyframeName = `motion_${motionPath.objectId}`;
            css += `@keyframes ${keyframeName} {\n`;
            css += `  0% { offset-path: path('${motionPath.path}'); offset-distance: ${motionPath.offset * 100}%; }\n`;
            css += `  100% { offset-distance: 100%; }\n`;
            css += "}\n\n";
        }

        return css;
    }

    /**
     * Converts property path to CSS property name
     */
    private static cssPropertyName(propertyPath: string): string {
        const pathParts = propertyPath.split(".");
        const property = pathParts[pathParts.length - 1];

        switch (property) {
            case "x":
            case "y":
                return "transform";
            case "rotation":
                return "transform";
            case "scaleX":
            case "scaleY":
                return "transform";
            case "fill":
                return "fill";
            case "stroke":
                return "stroke";
            case "opacity":
                return "opacity";
            default:
                return property;
        }
    }

    /**
     * Converts property value to CSS value
     */
    private static cssPropertyValue(value: unknown): string {
        if (typeof value === "number") {
            return value.toString();
        }
        if (typeof value === "string") {
            return value;
        }
        if (typeof value === "object" && value !== null) {
            // Handle transform objects
            const obj = value as Record<string, number>;
            if ("x" in obj || "y" in obj || "rotation" in obj || "scaleX" in obj || "scaleY" in obj) {
                const parts: string[] = [];
                if ("x" in obj || "y" in obj) {
                    parts.push(`translate(${obj.x || 0}px, ${obj.y || 0}px)`);
                }
                if ("rotation" in obj) {
                    parts.push(`rotate(${obj.rotation || 0}deg)`);
                }
                if ("scaleX" in obj || "scaleY" in obj) {
                    parts.push(`scale(${obj.scaleX || 1}, ${obj.scaleY || 1})`);
                }
                return parts.join(" ");
            }
        }
        return String(value);
    }
}
