import type {
    ShapeGenerator,
    ShapeGeneratorConfig,
    ShapeParameter,
    ShapePreset,
    ShapeGeneratorResult,
    ShapeLibraryState,
    CustomShapeObject,
    Point,
    CanvasObject,
} from "../types/editor";
import { BuiltInShapeGenerators, createDefaultShapeLibraryState } from "./shapeGenerators";

/**
 * ShapeLibrary - Manages custom shape generators and generation
 * Provides comprehensive shape generation, parameter management, and library operations
 */
export class ShapeLibrary {
    private static instance: ShapeLibrary;
    private state: ShapeLibraryState;

    private constructor() {
        this.state = createDefaultShapeLibraryState();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): ShapeLibrary {
        if (!ShapeLibrary.instance) {
            ShapeLibrary.instance = new ShapeLibrary();
        }
        return ShapeLibrary.instance;
    }

    /**
     * Get current state
     */
    public getState(): ShapeLibraryState {
        return { ...this.state };
    }

    /**
     * Set state (for integration with Redux/Context)
     */
    public setState(newState: Partial<ShapeLibraryState>): void {
        this.state = { ...this.state, ...newState };
    }

    /**
     * Register a new shape generator
     */
    public registerGenerator(generator: ShapeGenerator): void {
        this.state.generators[generator.config.id] = generator;

        // Add category if new
        if (!this.state.categories.includes(generator.config.category)) {
            this.state.categories.push(generator.config.category);
        }

        // Initialize parameter values with defaults
        const defaultParams: Record<string, any> = {};
        generator.config.parameters.forEach((param) => {
            defaultParams[param.id] = param.value;
        });
        this.state.parameterValues[generator.config.id] = defaultParams;
    }

    /**
     * Unregister a shape generator
     */
    public unregisterGenerator(generatorId: string): boolean {
        if (this.state.generators[generatorId]) {
            delete this.state.generators[generatorId];
            delete this.state.parameterValues[generatorId];

            // Remove from favorites and last used
            this.state.favorites = this.state.favorites.filter((id) => id !== generatorId);
            this.state.lastUsed = this.state.lastUsed.filter((id) => id !== generatorId);

            // Reset active generator if it was removed
            if (this.state.activeGenerator === generatorId) {
                this.state.activeGenerator = undefined;
            }

            return true;
        }
        return false;
    }

    /**
     * Get a specific generator
     */
    public getGenerator(generatorId: string): ShapeGenerator | undefined {
        return this.state.generators[generatorId];
    }

    /**
     * Get all generators
     */
    public getAllGenerators(): Record<string, ShapeGenerator> {
        return { ...this.state.generators };
    }

    /**
     * Get generators by category
     */
    public getGeneratorsByCategory(category: string): ShapeGenerator[] {
        return Object.values(this.state.generators).filter((generator) => generator.config.category === category);
    }

    /**
     * Search generators by name, description, or tags
     */
    public searchGenerators(query: string): ShapeGenerator[] {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.state.generators).filter((generator) => {
            const { name, description, tags = [] } = generator.config;
            return (
                name.toLowerCase().includes(lowerQuery) ||
                description.toLowerCase().includes(lowerQuery) ||
                tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
            );
        });
    }

    /**
     * Set active generator
     */
    public setActiveGenerator(generatorId: string): boolean {
        if (this.state.generators[generatorId]) {
            this.state.activeGenerator = generatorId;
            this.addToLastUsed(generatorId);
            return true;
        }
        return false;
    }

    /**
     * Get active generator
     */
    public getActiveGenerator(): ShapeGenerator | undefined {
        return this.state.activeGenerator ? this.state.generators[this.state.activeGenerator] : undefined;
    }

    /**
     * Update parameters for a generator
     */
    public updateParameters(generatorId: string, parameters: Record<string, any>): boolean {
        if (this.state.generators[generatorId]) {
            this.state.parameterValues[generatorId] = {
                ...this.state.parameterValues[generatorId],
                ...parameters,
            };
            return true;
        }
        return false;
    }

    /**
     * Get current parameters for a generator
     */
    public getParameters(generatorId: string): Record<string, any> {
        return this.state.parameterValues[generatorId] || {};
    }

    /**
     * Reset parameters to defaults for a generator
     */
    public resetParameters(generatorId: string): boolean {
        const generator = this.state.generators[generatorId];
        if (generator) {
            const defaultParams: Record<string, any> = {};
            generator.config.parameters.forEach((param) => {
                defaultParams[param.id] = param.value;
            });
            this.state.parameterValues[generatorId] = defaultParams;
            return true;
        }
        return false;
    }

    /**
     * Apply a preset to a generator
     */
    public applyPreset(generatorId: string, presetId: string): boolean {
        const generator = this.state.generators[generatorId];
        if (generator) {
            const preset = generator.config.presets?.find((p) => p.id === presetId);
            if (preset) {
                this.state.parameterValues[generatorId] = {
                    ...this.state.parameterValues[generatorId],
                    ...preset.parameters,
                };
                return true;
            }
        }
        return false;
    }

    /**
     * Save a custom preset for a generator
     */
    public savePreset(generatorId: string, preset: ShapePreset): boolean {
        const generator = this.state.generators[generatorId];
        if (generator) {
            if (!generator.config.presets) {
                generator.config.presets = [];
            }

            // Remove existing preset with same ID
            generator.config.presets = generator.config.presets.filter((p) => p.id !== preset.id);
            generator.config.presets.push(preset);
            return true;
        }
        return false;
    }

    /**
     * Delete a preset from a generator
     */
    public deletePreset(generatorId: string, presetId: string): boolean {
        const generator = this.state.generators[generatorId];
        if (generator && generator.config.presets) {
            const initialLength = generator.config.presets.length;
            generator.config.presets = generator.config.presets.filter((p) => p.id !== presetId);
            return generator.config.presets.length < initialLength;
        }
        return false;
    }

    /**
     * Generate a shape using a specific generator and parameters
     */
    public generateShape(
        generatorId: string,
        parameters?: Record<string, any>,
        position?: Point
    ): ShapeGeneratorResult {
        const generator = this.state.generators[generatorId];
        if (!generator) {
            return {
                success: false,
                error: `Generator '${generatorId}' not found`,
            };
        }

        // Use provided parameters or current stored parameters
        const useParams = parameters || this.state.parameterValues[generatorId] || {};

        // Validate parameters
        if (generator.validateParameters) {
            const errors = generator.validateParameters(useParams);
            if (errors.length > 0) {
                return {
                    success: false,
                    error: `Parameter validation failed: ${errors.join(", ")}`,
                };
            }
        }

        try {
            const result = generator.generate(useParams);

            if (result.success && position) {
                // Adjust path data for position (basic translation)
                // Note: This is a simple implementation - more complex positioning
                // would require proper SVG path parsing and transformation
                result.shape!.metadata = {
                    ...result.shape!.metadata,
                    position: position,
                };
            }

            // Track usage
            this.addToLastUsed(generatorId);

            return result;
        } catch (error) {
            return {
                success: false,
                error: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Create a custom shape object from a generated shape
     */
    public createCustomShapeObject(
        generatorId: string,
        parameters: Record<string, any>,
        id: string,
        name: string,
        position: Point = { x: 0, y: 0 },
        layerId: string = "default"
    ): CustomShapeObject | null {
        const result = this.generateShape(generatorId, parameters, position);

        if (!result.success || !result.shape) {
            return null;
        }

        const generator = this.state.generators[generatorId];

        return {
            id,
            type: "custom-shape",
            name,
            transform: {
                x: position.x,
                y: position.y,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            layerId,
            generatorId,
            parameters: { ...parameters },
            pathData: result.shape.pathData,
            style: result.shape.style || {
                fill: "#3b82f6",
                stroke: "#1d4ed8",
                strokeWidth: 2,
            },
            lastGenerated: Date.now(),
            version: generator.config.version,
        };
    }

    /**
     * Regenerate a custom shape object with new parameters
     */
    public regenerateCustomShape(
        shapeObject: CustomShapeObject,
        newParameters?: Record<string, any>
    ): CustomShapeObject | null {
        const parameters = newParameters || shapeObject.parameters;
        const result = this.generateShape(shapeObject.generatorId, parameters);

        if (!result.success || !result.shape) {
            return null;
        }

        return {
            ...shapeObject,
            parameters: { ...parameters },
            pathData: result.shape.pathData,
            style: {
                ...shapeObject.style,
                ...result.shape.style,
            },
            lastGenerated: Date.now(),
            version: this.state.generators[shapeObject.generatorId]?.config.version || shapeObject.version,
        };
    }

    /**
     * Add to favorites
     */
    public addToFavorites(generatorId: string): void {
        if (this.state.generators[generatorId] && !this.state.favorites.includes(generatorId)) {
            this.state.favorites.push(generatorId);
        }
    }

    /**
     * Remove from favorites
     */
    public removeFromFavorites(generatorId: string): void {
        this.state.favorites = this.state.favorites.filter((id) => id !== generatorId);
    }

    /**
     * Get favorite generators
     */
    public getFavoriteGenerators(): ShapeGenerator[] {
        return this.state.favorites.map((id) => this.state.generators[id]).filter(Boolean);
    }

    /**
     * Add to last used (with limit)
     */
    private addToLastUsed(generatorId: string): void {
        // Remove if already exists
        this.state.lastUsed = this.state.lastUsed.filter((id) => id !== generatorId);

        // Add to beginning
        this.state.lastUsed.unshift(generatorId);

        // Limit to 10 items
        if (this.state.lastUsed.length > 10) {
            this.state.lastUsed = this.state.lastUsed.slice(0, 10);
        }
    }

    /**
     * Get recently used generators
     */
    public getRecentlyUsedGenerators(): ShapeGenerator[] {
        return this.state.lastUsed.map((id) => this.state.generators[id]).filter(Boolean);
    }

    /**
     * Set preview mode
     */
    public setPreviewMode(enabled: boolean): void {
        this.state.previewMode = enabled;
    }

    /**
     * Get preview mode state
     */
    public isPreviewMode(): boolean {
        return this.state.previewMode;
    }

    /**
     * Get all categories
     */
    public getCategories(): string[] {
        return [...this.state.categories];
    }

    /**
     * Export shape library to JSON
     */
    public exportLibrary(): string {
        const exportData = {
            version: "1.0.0",
            timestamp: Date.now(),
            generators: Object.values(this.state.generators).map((generator) => ({
                config: generator.config,
                // Note: Functions cannot be serialized, would need plugin system for custom generators
            })),
            favorites: this.state.favorites,
            categories: this.state.categories,
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import shape library from JSON
     * Note: This only imports built-in generators - custom generators would need plugin system
     */
    public importLibrary(jsonData: string): boolean {
        try {
            const importData = JSON.parse(jsonData);

            // Validate import data structure
            if (!importData.generators || !Array.isArray(importData.generators)) {
                return false;
            }

            // Import built-in generators only
            const importedGenerators: Record<string, ShapeGenerator> = {};

            for (const generatorData of importData.generators) {
                const builtInGenerator = BuiltInShapeGenerators[generatorData.config.id];
                if (builtInGenerator) {
                    importedGenerators[generatorData.config.id] = builtInGenerator;
                }
            }

            // Update state
            this.state.generators = { ...this.state.generators, ...importedGenerators };

            if (importData.favorites && Array.isArray(importData.favorites)) {
                this.state.favorites = importData.favorites.filter((id) => this.state.generators[id]);
            }

            if (importData.categories && Array.isArray(importData.categories)) {
                this.state.categories = [...new Set([...this.state.categories, ...importData.categories])];
            }

            return true;
        } catch (error) {
            console.error("Failed to import shape library:", error);
            return false;
        }
    }

    /**
     * Reset library to defaults
     */
    public resetToDefaults(): void {
        this.state = createDefaultShapeLibraryState();
    }

    /**
     * Get generator statistics
     */
    public getStatistics(): {
        totalGenerators: number;
        categoryCounts: Record<string, number>;
        favoriteCount: number;
        recentlyUsedCount: number;
    } {
        const generators = Object.values(this.state.generators);
        const categoryCounts: Record<string, number> = {};

        generators.forEach((generator) => {
            const category = generator.config.category;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        return {
            totalGenerators: generators.length,
            categoryCounts,
            favoriteCount: this.state.favorites.length,
            recentlyUsedCount: this.state.lastUsed.length,
        };
    }
}

// Export singleton instance
export const shapeLibrary = ShapeLibrary.getInstance();
