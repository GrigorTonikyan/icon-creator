import type {
    Symbol,
    SymbolInstance,
    SymbolLibrary,
    SymbolProperty,
    SymbolSaveOptions,
    CanvasObject,
    Point,
    Bounds,
    ComponentCategory,
} from "../types/editor";

/**
 * Utility class for managing symbol libraries and symbol instances
 */
export class SymbolLibraryUtils {
    /**
     * Creates a default symbol library with basic categories
     */
    static createDefaultLibrary(): SymbolLibrary {
        const now = new Date();

        const defaultCategories: ComponentCategory[] = [
            {
                id: "icons",
                name: "Icons",
                description: "Basic icon symbols",
                icon: "circle",
                order: 0,
            },
            {
                id: "logos",
                name: "Logos",
                description: "Logo and brand symbols",
                icon: "layer",
                order: 1,
            },
            {
                id: "decorative",
                name: "Decorative",
                description: "Decorative elements and ornaments",
                icon: "activity",
                order: 2,
            },
            {
                id: "custom",
                name: "Custom",
                description: "User-created symbols",
                icon: "edit",
                order: 3,
            },
        ];

        return {
            id: this.generateId(),
            name: "Default Symbol Library",
            description: "Default symbol library with basic symbols",
            version: "1.0.0",
            categories: defaultCategories,
            symbols: [],
            metadata: {
                createdAt: now,
                updatedAt: now,
                author: "System",
            },
        };
    }

    /**
     * Creates a symbol from a canvas object
     */
    static createSymbol(
        masterObject: CanvasObject,
        options: SymbolSaveOptions,
        customProperties?: SymbolProperty[]
    ): Symbol {
        const now = new Date();
        const bounds = this.calculateObjectBounds(masterObject);

        // Generate thumbnail if requested
        let thumbnail: string | undefined;
        if (options.generateThumbnail) {
            thumbnail = this.generateThumbnail(masterObject, bounds);
        }

        const symbol: Symbol = {
            id: this.generateId(),
            name: options.name,
            description: options.description,
            category: options.category,
            tags: options.tags,
            thumbnail,
            masterObject: { ...masterObject }, // Deep copy to avoid mutations
            metadata: {
                createdAt: now,
                updatedAt: now,
                version: "1.0.0",
                bounds,
                isLocked: options.lockMaster || false,
            },
            properties: customProperties || [],
        };

        return symbol;
    }

    /**
     * Creates a symbol instance from a symbol
     */
    static createSymbolInstance(
        symbol: Symbol,
        position: Point = { x: 0, y: 0 },
        layerId: string,
        propertyOverrides: Record<string, any> = {}
    ): SymbolInstance {
        const instance: SymbolInstance = {
            id: this.generateId(),
            type: "symbol",
            name: `${symbol.name} Instance`,
            symbolId: symbol.id,
            transform: {
                x: position.x,
                y: position.y,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                originX: 0.5,
                originY: 0.5,
            },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            layerId,
            propertyOverrides,
            isDetached: false,
            lastSyncedVersion: symbol.metadata.version,
        };

        return instance;
    }

    /**
     * Resolves a symbol instance to get the actual rendered object
     */
    static resolveSymbolInstance(instance: SymbolInstance, symbol: Symbol): CanvasObject {
        if (!symbol) {
            throw new Error(`Symbol with id ${instance.symbolId} not found`);
        }

        // Start with the master object
        let resolvedObject = { ...symbol.masterObject };

        // Apply property overrides
        resolvedObject = this.applyPropertyOverrides(
            resolvedObject,
            instance.propertyOverrides,
            symbol.properties || []
        );

        // Apply instance transform
        resolvedObject = {
            ...resolvedObject,
            id: instance.id,
            name: instance.name,
            transform: instance.transform,
            visible: instance.visible,
            locked: instance.locked,
            opacity: instance.opacity,
            zIndex: instance.zIndex,
            layerId: instance.layerId,
        };

        return resolvedObject;
    }

    /**
     * Updates a symbol instance with new property overrides
     */
    static updateSymbolInstance(instance: SymbolInstance, propertyOverrides: Record<string, any>): SymbolInstance {
        return {
            ...instance,
            propertyOverrides: {
                ...instance.propertyOverrides,
                ...propertyOverrides,
            },
        };
    }

    /**
     * Syncs a symbol instance with its master symbol
     */
    static syncSymbolInstance(instance: SymbolInstance, symbol: Symbol, forceSync: boolean = false): SymbolInstance {
        if (instance.isDetached && !forceSync) {
            return instance; // Don't sync detached instances unless forced
        }

        return {
            ...instance,
            lastSyncedVersion: symbol.metadata.version,
            // Preserve property overrides but sync everything else
        };
    }

    /**
     * Detaches a symbol instance from its master symbol
     */
    static detachSymbolInstance(instance: SymbolInstance): SymbolInstance {
        return {
            ...instance,
            isDetached: true,
        };
    }

    /**
     * Checks if a symbol instance needs to be synced
     */
    static isInstanceOutOfSync(instance: SymbolInstance, symbol: Symbol): boolean {
        return instance.lastSyncedVersion !== symbol.metadata.version;
    }

    /**
     * Updates a symbol master and increments its version
     */
    static updateSymbolMaster(symbol: Symbol, newMasterObject: CanvasObject): Symbol {
        const now = new Date();
        const currentVersion = parseFloat(symbol.metadata.version);
        const newVersion = (currentVersion + 0.1).toFixed(1);

        return {
            ...symbol,
            masterObject: { ...newMasterObject },
            metadata: {
                ...symbol.metadata,
                updatedAt: now,
                version: newVersion,
                bounds: this.calculateObjectBounds(newMasterObject),
            },
        };
    }

    /**
     * Applies property overrides to a canvas object
     */
    private static applyPropertyOverrides(
        object: CanvasObject,
        overrides: Record<string, any>,
        properties: SymbolProperty[]
    ): CanvasObject {
        let result = { ...object };

        // Apply each override based on the property definition
        properties.forEach((property) => {
            const overrideValue = overrides[property.id];
            if (overrideValue !== undefined) {
                result = this.setObjectProperty(result, property.target.path, overrideValue);
            }
        });

        return result;
    }

    /**
     * Sets a property on an object using a dot-notation path
     */
    private static setObjectProperty(object: any, path: string, value: any): any {
        const result = { ...object };
        const pathParts = path.split(".");
        let current = result;

        // Navigate to the parent of the target property
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (current[part] === undefined) {
                current[part] = {};
            } else {
                current[part] = { ...current[part] };
            }
            current = current[part];
        }

        // Set the final property
        const finalProp = pathParts[pathParts.length - 1];
        current[finalProp] = value;

        return result;
    }

    /**
     * Calculates the bounding box of a canvas object
     */
    static calculateObjectBounds(object: CanvasObject): Bounds {
        // This is a simplified implementation
        // In a real application, this would calculate the actual visual bounds
        const transform = object.transform;

        switch (object.type) {
            case "rectangle":
                const rectObj = object as any;
                return {
                    x: transform.x,
                    y: transform.y,
                    width: rectObj.width || 100,
                    height: rectObj.height || 100,
                };

            case "circle":
                const circleObj = object as any;
                const radius = circleObj.radius || 50;
                return {
                    x: transform.x - radius,
                    y: transform.y - radius,
                    width: radius * 2,
                    height: radius * 2,
                };

            case "text":
                // Text bounds would be calculated based on font metrics
                return {
                    x: transform.x,
                    y: transform.y,
                    width: 100,
                    height: 20,
                };

            case "path":
                // Path bounds would be calculated from the path data
                return {
                    x: transform.x,
                    y: transform.y,
                    width: 100,
                    height: 100,
                };

            default:
                return {
                    x: transform.x,
                    y: transform.y,
                    width: 100,
                    height: 100,
                };
        }
    }

    /**
     * Generates a simple thumbnail for a symbol (placeholder implementation)
     */
    private static generateThumbnail(object: CanvasObject, bounds: Bounds): string {
        // In a real implementation, this would render the object to a canvas
        // and return a base64 data URL
        // For now, return a placeholder
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjBGMEYwIi8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPgo=";
    }

    /**
     * Generates a unique ID for symbols and instances
     */
    static generateId(): string {
        return `symbol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Searches symbols by name, description, or tags
     */
    static searchSymbols(symbols: Symbol[], query: string): Symbol[] {
        if (!query.trim()) {
            return symbols;
        }

        const searchTerm = query.toLowerCase();
        return symbols.filter(
            (symbol) =>
                symbol.name.toLowerCase().includes(searchTerm) ||
                symbol.description?.toLowerCase().includes(searchTerm) ||
                symbol.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * Filters symbols by category
     */
    static filterSymbolsByCategory(symbols: Symbol[], categoryId?: string): Symbol[] {
        if (!categoryId) {
            return symbols;
        }

        return symbols.filter((symbol) => symbol.category === categoryId);
    }

    /**
     * Gets all unique tags from a list of symbols
     */
    static getAllTags(symbols: Symbol[]): string[] {
        const tags = new Set<string>();
        symbols.forEach((symbol) => {
            symbol.tags.forEach((tag) => tags.add(tag));
        });
        return Array.from(tags).sort();
    }

    /**
     * Exports a symbol library to JSON
     */
    static exportLibrary(library: SymbolLibrary): string {
        return JSON.stringify(library, null, 2);
    }

    /**
     * Imports a symbol library from JSON
     */
    static importLibrary(jsonData: string): SymbolLibrary {
        try {
            const library = JSON.parse(jsonData) as SymbolLibrary;

            // Validate the library structure
            if (!library.id || !library.name || !library.symbols || !library.categories) {
                throw new Error("Invalid symbol library format");
            }

            // Ensure dates are properly parsed
            library.metadata.createdAt = new Date(library.metadata.createdAt);
            library.metadata.updatedAt = new Date(library.metadata.updatedAt);

            library.symbols.forEach((symbol) => {
                symbol.metadata.createdAt = new Date(symbol.metadata.createdAt);
                symbol.metadata.updatedAt = new Date(symbol.metadata.updatedAt);
            });

            return library;
        } catch (error) {
            throw new Error(
                `Failed to import symbol library: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }
}
