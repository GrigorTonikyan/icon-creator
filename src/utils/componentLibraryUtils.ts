import type {
    ComponentTemplate,
    ComponentCategory,
    ComponentLibrary,
    ComponentInstance,
    ComponentProperty,
    ComponentSaveOptions,
    CanvasObject,
    Bounds,
    Transform,
} from "../types/editor";

/**
 * Utility class for managing component libraries, templates, and instances
 */
export class ComponentLibraryUtils {
    private static readonly STORAGE_KEY = "icon-creator-component-libraries";
    private static readonly DEFAULT_LIBRARY_ID = "default";

    /**
     * Generate a unique ID for components and libraries
     */
    static generateId(): string {
        return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create a default component library
     */
    static createDefaultLibrary(): ComponentLibrary {
        return {
            id: this.DEFAULT_LIBRARY_ID,
            name: "Default Library",
            description: "Default component library for common shapes and elements",
            version: "1.0.0",
            categories: this.createDefaultCategories(),
            templates: [],
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                author: "System",
            },
        };
    }

    /**
     * Create default component categories
     */
    static createDefaultCategories(): ComponentCategory[] {
        return [
            {
                id: "basic-shapes",
                name: "Basic Shapes",
                description: "Fundamental geometric shapes",
                icon: "shapes",
                order: 1,
            },
            {
                id: "ui-elements",
                name: "UI Elements",
                description: "Common user interface components",
                icon: "ui",
                order: 2,
            },
            {
                id: "icons",
                name: "Icons",
                description: "Icon templates and symbols",
                icon: "icon",
                order: 3,
            },
            {
                id: "decorative",
                name: "Decorative",
                description: "Ornamental and decorative elements",
                icon: "star",
                order: 4,
            },
            {
                id: "custom",
                name: "Custom",
                description: "User-created components",
                icon: "folder",
                order: 5,
            },
        ];
    }

    /**
     * Calculate bounding box for a group of objects
     */
    static calculateComponentBounds(objects: CanvasObject[]): Bounds {
        if (objects.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        objects.forEach((obj) => {
            let objBounds: Bounds;

            switch (obj.type) {
                case "rectangle":
                    objBounds = {
                        x: obj.transform.x,
                        y: obj.transform.y,
                        width: obj.width,
                        height: obj.height,
                    };
                    break;
                case "circle":
                    objBounds = {
                        x: obj.transform.x - obj.radius,
                        y: obj.transform.y - obj.radius,
                        width: obj.radius * 2,
                        height: obj.radius * 2,
                    };
                    break;
                case "text":
                    // Approximate text bounds based on font size
                    const fontSize = obj.style.fontSize || 16;
                    const textWidth = obj.content.length * fontSize * 0.6;
                    objBounds = {
                        x: obj.transform.x,
                        y: obj.transform.y - fontSize,
                        width: textWidth,
                        height: fontSize * 1.2,
                    };
                    break;
                case "path":
                    // Simple approximation for path bounds
                    objBounds = {
                        x: obj.transform.x,
                        y: obj.transform.y,
                        width: 100, // Default width
                        height: 100, // Default height
                    };
                    break;
                default:
                    objBounds = { x: 0, y: 0, width: 0, height: 0 };
            }

            minX = Math.min(minX, objBounds.x);
            minY = Math.min(minY, objBounds.y);
            maxX = Math.max(maxX, objBounds.x + objBounds.width);
            maxY = Math.max(maxY, objBounds.y + objBounds.height);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }

    /**
     * Create a component template from canvas objects
     */
    static createComponentTemplate(objects: CanvasObject[], options: ComponentSaveOptions): ComponentTemplate {
        const bounds = this.calculateComponentBounds(objects);

        // Normalize object positions relative to component bounds
        const normalizedObjects = objects.map((obj) => ({
            ...obj,
            transform: {
                ...obj.transform,
                x: obj.transform.x - bounds.x,
                y: obj.transform.y - bounds.y,
            },
        }));

        return {
            id: this.generateId(),
            name: options.name,
            description: options.description,
            category: options.category,
            tags: options.tags,
            objects: normalizedObjects,
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                version: "1.0.0",
                bounds: { x: 0, y: 0, width: bounds.width, height: bounds.height },
            },
            properties: [], // Can be enhanced later with custom properties
        };
    }

    /**
     * Generate SVG thumbnail for a component template
     */
    static generateThumbnail(template: ComponentTemplate, size: number = 128): string {
        const { bounds } = template.metadata;
        const scale = Math.min(size / bounds.width, size / bounds.height);

        const svgElements = template.objects
            .map((obj) => {
                const x = obj.transform.x * scale;
                const y = obj.transform.y * scale;

                switch (obj.type) {
                    case "rectangle":
                        return `<rect x="${x}" y="${y}" width="${obj.width * scale}" height="${
                            obj.height * scale
                        }" fill="${obj.style?.fill || "#007ACC"}" stroke="${
                            obj.style?.stroke || "none"
                        }" stroke-width="${(obj.style?.strokeWidth || 0) * scale}" />`;
                    case "circle":
                        return `<circle cx="${x}" cy="${y}" r="${obj.radius * scale}" fill="${
                            obj.style?.fill || "#007ACC"
                        }" stroke="${obj.style?.stroke || "none"}" stroke-width="${
                            (obj.style?.strokeWidth || 0) * scale
                        }" />`;
                    case "text":
                        return `<text x="${x}" y="${y}" font-size="${(obj.style.fontSize || 16) * scale}" fill="${
                            obj.style.color || "#000000"
                        }">${obj.content}</text>`;
                    case "path":
                        return `<path d="${obj.pathData}" fill="${obj.style?.fill || "none"}" stroke="${
                            obj.style?.stroke || "#007ACC"
                        }" stroke-width="${(obj.style?.strokeWidth || 2) * scale}" />`;
                    default:
                        return "";
                }
            })
            .join("");

        const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * Create a component instance from a template
     */
    static createComponentInstance(
        template: ComponentTemplate,
        position: { x: number; y: number },
        layerId: string
    ): ComponentInstance {
        return {
            id: this.generateId(),
            type: "component",
            name: `${template.name} Instance`,
            templateId: template.id,
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
            propertyOverrides: {},
        };
    }

    /**
     * Resolve component instance to actual canvas objects
     */
    static resolveComponentInstance(instance: ComponentInstance, template: ComponentTemplate): CanvasObject[] {
        return template.objects.map((templateObj) => {
            const resolvedObj = {
                ...templateObj,
                id: this.generateId(), // Generate new IDs for resolved objects
                transform: {
                    ...templateObj.transform,
                    x: templateObj.transform.x + instance.transform.x,
                    y: templateObj.transform.y + instance.transform.y,
                    rotation: templateObj.transform.rotation + instance.transform.rotation,
                    scaleX: templateObj.transform.scaleX * instance.transform.scaleX,
                    scaleY: templateObj.transform.scaleY * instance.transform.scaleY,
                },
                layerId: instance.layerId,
                opacity: templateObj.opacity * instance.opacity,
                visible: templateObj.visible && instance.visible,
                locked: templateObj.locked || instance.locked,
            };

            // Apply property overrides
            Object.entries(instance.propertyOverrides).forEach(([path, value]) => {
                this.applyPropertyOverride(resolvedObj, path, value);
            });

            return resolvedObj;
        });
    }

    /**
     * Apply a property override to an object
     */
    private static applyPropertyOverride(obj: any, path: string, value: string | number | boolean): void {
        const pathParts = path.split(".");
        let current = obj;

        for (let i = 0; i < pathParts.length - 1; i++) {
            if (!current[pathParts[i]]) {
                current[pathParts[i]] = {};
            }
            current = current[pathParts[i]];
        }

        current[pathParts[pathParts.length - 1]] = value;
    }

    /**
     * Search component templates by name, description, or tags
     */
    static searchTemplates(templates: ComponentTemplate[], query: string, categoryId?: string): ComponentTemplate[] {
        const normalizedQuery = query.toLowerCase().trim();

        return templates.filter((template) => {
            // Filter by category if specified
            if (categoryId && template.category !== categoryId) {
                return false;
            }

            // If no query, return all templates in category
            if (!normalizedQuery) {
                return true;
            }

            // Search in name, description, and tags
            const searchableText = [template.name, template.description || "", ...template.tags]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }

    /**
     * Save component libraries to local storage
     */
    static saveToStorage(libraries: ComponentLibrary[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(libraries));
        } catch (error) {
            console.error("Failed to save component libraries to storage:", error);
        }
    }

    /**
     * Load component libraries from local storage
     */
    static loadFromStorage(): ComponentLibrary[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const libraries = JSON.parse(stored);
                // Ensure dates are properly parsed
                return libraries.map((lib: any) => ({
                    ...lib,
                    metadata: {
                        ...lib.metadata,
                        createdAt: new Date(lib.metadata.createdAt),
                        updatedAt: new Date(lib.metadata.updatedAt),
                    },
                    templates: lib.templates.map((template: any) => ({
                        ...template,
                        metadata: {
                            ...template.metadata,
                            createdAt: new Date(template.metadata.createdAt),
                            updatedAt: new Date(template.metadata.updatedAt),
                        },
                    })),
                }));
            }
        } catch (error) {
            console.error("Failed to load component libraries from storage:", error);
        }

        // Return default library if loading fails
        return [this.createDefaultLibrary()];
    }

    /**
     * Export component library to JSON
     */
    static exportLibrary(library: ComponentLibrary): string {
        return JSON.stringify(library, null, 2);
    }

    /**
     * Import component library from JSON
     */
    static importLibrary(jsonData: string): ComponentLibrary {
        try {
            const library = JSON.parse(jsonData);

            // Validate required fields
            if (!library.id || !library.name || !library.templates) {
                throw new Error("Invalid library format");
            }

            // Ensure proper date parsing
            library.metadata.createdAt = new Date(library.metadata.createdAt);
            library.metadata.updatedAt = new Date(library.metadata.updatedAt);

            library.templates.forEach((template: any) => {
                template.metadata.createdAt = new Date(template.metadata.createdAt);
                template.metadata.updatedAt = new Date(template.metadata.updatedAt);
            });

            return library;
        } catch (error) {
            throw new Error(`Failed to import library: ${error}`);
        }
    }

    /**
     * Sort templates by different criteria
     */
    static sortTemplates(
        templates: ComponentTemplate[],
        sortBy: "name" | "date" | "category" = "name",
        order: "asc" | "desc" = "asc"
    ): ComponentTemplate[] {
        return [...templates].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "date":
                    comparison = a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime();
                    break;
                case "category":
                    comparison = a.category.localeCompare(b.category);
                    break;
            }

            return order === "desc" ? -comparison : comparison;
        });
    }
}
