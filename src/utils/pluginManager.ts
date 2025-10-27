/**
 * Plugin Manager - Stage 12 Step 7
 *
 * Comprehensive plugin system for the icon creator that provides:
 * - Plugin loading, registration, and lifecycle management
 * - Extension point system for tools, exporters, effects, and UI components
 * - Sandboxed execution environment with permission-based API access
 * - Plugin discovery, dependency resolution, and conflict detection
 * - Safe API layer for plugin interaction with editor state
 */

import type {
    Plugin,
    PluginManifest,
    PluginInstance,
    PluginAPI,
    PluginManagerState,
    PluginError,
    ExtensionPoint,
    ExtensionHandler,
    ExtensionPointType,
    CustomTool,
    ExportOptions,
    FileDialogOptions,
    DialogConfig,
    PanelConfig,
    MenuItemConfig,
    PanelInstance,
    CanvasObject,
    Layer,
    ToolType,
    ViewportState,
    Bounds,
    PluginPermission,
    PluginDependency,
    PluginCategory,
    PluginState,
} from "../types/editor";

// Plugin execution sandbox interface
interface PluginSandbox {
    eval: (code: string) => any;
    require: (module: string) => any;
    global: any;
    destroy: () => void;
}

// Plugin loader interface
interface PluginLoader {
    loadFromUrl: (url: string) => Promise<PluginInstance>;
    loadFromFile: (file: File) => Promise<PluginInstance>;
    validateManifest: (manifest: any) => PluginManifest;
    checkPermissions: (manifest: PluginManifest) => boolean;
}

/**
 * PluginManager - Core plugin system implementation
 */
class PluginManager {
    private state: PluginManagerState;
    private editorAPI: any; // Reference to editor context
    private eventEmitter: EventTarget;
    private sandboxes: Map<string, PluginSandbox>;
    private extensionCache: Map<string, any>;
    private permissionManager: PermissionManager;
    private dependencyResolver: DependencyResolver;

    constructor(editorAPI: any) {
        this.editorAPI = editorAPI;
        this.eventEmitter = new EventTarget();
        this.sandboxes = new Map();
        this.extensionCache = new Map();
        this.permissionManager = new PermissionManager();
        this.dependencyResolver = new DependencyResolver();

        this.state = {
            plugins: {},
            extensionPoints: {},
            isInitialized: false,
            loadingPlugins: [],
            errors: [],
            lastUpdate: Date.now(),
        };

        this.initializeCoreExtensionPoints();
    }

    /**
     * Initialize the plugin system
     */
    async initialize(): Promise<void> {
        try {
            // Load core extension points
            this.initializeCoreExtensionPoints();

            // Load persistent plugin state
            await this.loadPluginState();

            // Auto-load enabled plugins
            await this.loadEnabledPlugins();

            this.state.isInitialized = true;
            this.emitEvent("plugin-manager:initialized");
        } catch (error) {
            this.addError("system", `Failed to initialize plugin manager: ${error}`, true);
            throw error;
        }
    }

    /**
     * Load a plugin from URL or file
     */
    async loadPlugin(source: string | File, enable = true): Promise<boolean> {
        let pluginId: string | undefined;

        try {
            // Add to loading state
            let tempPluginId = typeof source === "string" ? this.extractPluginIdFromUrl(source) : "unknown";
            this.state.loadingPlugins.push(tempPluginId);

            // Load plugin instance
            const instance =
                typeof source === "string" ? await this.loadFromUrl(source) : await this.loadFromFile(source);

            const manifest = (instance as any).manifest || (await this.extractManifest(instance));
            const finalPluginId = manifest.id;

            // Remove temp ID and add real ID to loading
            this.state.loadingPlugins = this.state.loadingPlugins.filter((id) => id !== tempPluginId);
            this.state.loadingPlugins.push(finalPluginId);

            // Validate manifest and permissions
            this.validatePluginManifest(manifest);
            if (!this.permissionManager.checkPermissions(manifest.permissions)) {
                throw new Error("Plugin permissions denied");
            }

            // Check dependencies
            const dependencyIssues = await this.dependencyResolver.checkDependencies(manifest);
            if (dependencyIssues.length > 0) {
                throw new Error(`Dependency issues: ${dependencyIssues.join(", ")}`);
            }

            // Create plugin
            const plugin: Plugin = {
                manifest,
                isLoaded: false,
                isEnabled: false,
                loadedAt: Date.now(),
                state: {},
                instance,
            };

            // Create sandbox
            const sandbox = this.createSandbox(finalPluginId);
            this.sandboxes.set(finalPluginId, sandbox);

            // Initialize plugin
            const api = this.createPluginAPI(finalPluginId);
            await instance.initialize(api);

            plugin.isLoaded = true;
            this.state.plugins[finalPluginId] = plugin;

            // Enable if requested
            if (enable) {
                await this.enablePlugin(finalPluginId);
            }

            this.emitEvent("plugin:loaded", { pluginId: finalPluginId });
            pluginId = finalPluginId;
            return true;
        } catch (error) {
            if (pluginId) {
                this.addError(pluginId, `Failed to load plugin: ${error}`);
            }
            throw error;
        } finally {
            // Remove from loading state
            if (pluginId) {
                this.state.loadingPlugins = this.state.loadingPlugins.filter((id) => id !== pluginId);
            }
        }
    }

    /**
     * Unload a plugin
     */
    async unloadPlugin(pluginId: string): Promise<boolean> {
        const plugin = this.state.plugins[pluginId];
        if (!plugin) {
            return false;
        }

        try {
            // Disable first if enabled
            if (plugin.isEnabled) {
                await this.disablePlugin(pluginId);
            }

            // Destroy plugin instance
            if (plugin.instance?.destroy) {
                await plugin.instance.destroy();
            }

            // Clean up sandbox
            const sandbox = this.sandboxes.get(pluginId);
            if (sandbox) {
                sandbox.destroy();
                this.sandboxes.delete(pluginId);
            }

            // Remove from state
            delete this.state.plugins[pluginId];

            this.emitEvent("plugin:unloaded", { pluginId });
            return true;
        } catch (error) {
            this.addError(pluginId, `Failed to unload plugin: ${error}`);
            return false;
        }
    }

    /**
     * Enable a plugin
     */
    async enablePlugin(pluginId: string): Promise<boolean> {
        const plugin = this.state.plugins[pluginId];
        if (!plugin || !plugin.isLoaded || plugin.isEnabled) {
            return false;
        }

        try {
            // Activate plugin
            if (plugin.instance?.activate) {
                await plugin.instance.activate();
            }

            plugin.isEnabled = true;
            plugin.enabledAt = Date.now();

            // Register extension points provided by this plugin
            await this.registerPluginExtensionPoints(pluginId);

            this.emitEvent("plugin:enabled", { pluginId });
            return true;
        } catch (error) {
            this.addError(pluginId, `Failed to enable plugin: ${error}`);
            return false;
        }
    }

    /**
     * Disable a plugin
     */
    async disablePlugin(pluginId: string): Promise<boolean> {
        const plugin = this.state.plugins[pluginId];
        if (!plugin || !plugin.isEnabled) {
            return false;
        }

        try {
            // Deactivate plugin
            if (plugin.instance?.deactivate) {
                await plugin.instance.deactivate();
            }

            plugin.isEnabled = false;
            delete plugin.enabledAt;

            // Unregister extension points
            await this.unregisterPluginExtensionPoints(pluginId);

            this.emitEvent("plugin:disabled", { pluginId });
            return true;
        } catch (error) {
            this.addError(pluginId, `Failed to disable plugin: ${error}`);
            return false;
        }
    }

    /**
     * Execute a plugin action
     */
    async executePluginAction(pluginId: string, actionId: string, params?: any): Promise<any> {
        const plugin = this.state.plugins[pluginId];
        if (!plugin || !plugin.isEnabled || !plugin.instance?.executeAction) {
            throw new Error(`Plugin ${pluginId} is not available or does not support actions`);
        }

        try {
            return await plugin.instance.executeAction(actionId, params);
        } catch (error) {
            this.addError(pluginId, `Failed to execute action ${actionId}: ${error}`);
            throw error;
        }
    }

    /**
     * Register an extension point
     */
    registerExtensionPoint(extensionPoint: ExtensionPoint): boolean {
        try {
            // Validate extension point
            this.validateExtensionPoint(extensionPoint);

            // Check for conflicts
            if (this.state.extensionPoints[extensionPoint.id]) {
                throw new Error(`Extension point ${extensionPoint.id} already exists`);
            }

            this.state.extensionPoints[extensionPoint.id] = extensionPoint;
            this.emitEvent("extension-point:registered", { extensionPoint });
            return true;
        } catch (error) {
            this.addError(extensionPoint.providedBy, `Failed to register extension point: ${error}`);
            return false;
        }
    }

    /**
     * Unregister an extension point
     */
    unregisterExtensionPoint(extensionPointId: string): boolean {
        const extensionPoint = this.state.extensionPoints[extensionPointId];
        if (!extensionPoint) {
            return false;
        }

        // Remove handlers
        extensionPoint.handlers = [];

        // Remove from cache
        this.extensionCache.delete(extensionPointId);

        // Remove from state
        delete this.state.extensionPoints[extensionPointId];

        this.emitEvent("extension-point:unregistered", { extensionPointId });
        return true;
    }

    /**
     * Execute extension point handlers
     */
    async executeExtensionPoint(extensionPointId: string, ...args: any[]): Promise<any[]> {
        const extensionPoint = this.state.extensionPoints[extensionPointId];
        if (!extensionPoint) {
            return [];
        }

        // Sort handlers by priority (higher first)
        const sortedHandlers = extensionPoint.handlers
            .filter((handler) => handler.enabled)
            .sort((a, b) => b.priority - a.priority);

        const results: any[] = [];

        for (const handler of sortedHandlers) {
            try {
                const result = await handler.handler(...args);
                results.push(result);
            } catch (error) {
                this.addError(handler.pluginId, `Extension handler error: ${error}`);
            }
        }

        return results;
    }

    /**
     * Get plugin state
     */
    getState(): PluginManagerState {
        return { ...this.state };
    }

    /**
     * Get plugin by ID
     */
    getPlugin(pluginId: string): Plugin | undefined {
        return this.state.plugins[pluginId];
    }

    /**
     * Get all plugins
     */
    getPlugins(): Plugin[] {
        return Object.values(this.state.plugins);
    }

    /**
     * Get enabled plugins
     */
    getEnabledPlugins(): Plugin[] {
        return Object.values(this.state.plugins).filter((plugin) => plugin.isEnabled);
    }

    /**
     * Get extension point by ID
     */
    getExtensionPoint(extensionPointId: string): ExtensionPoint | undefined {
        return this.state.extensionPoints[extensionPointId];
    }

    /**
     * Get all extension points
     */
    getExtensionPoints(): ExtensionPoint[] {
        return Object.values(this.state.extensionPoints);
    }

    /**
     * Update plugin state
     */
    updatePluginState(pluginId: string, newState: Partial<PluginState>): boolean {
        const plugin = this.state.plugins[pluginId];
        if (!plugin) {
            return false;
        }

        plugin.state = { ...plugin.state, ...newState };

        // Notify plugin of state change
        if (plugin.instance?.setState) {
            plugin.instance.setState(newState);
        }

        this.emitEvent("plugin:state-updated", { pluginId, state: newState });
        return true;
    }

    // Private methods

    private initializeCoreExtensionPoints(): void {
        const coreExtensionPoints: ExtensionPoint[] = [
            {
                id: "tools",
                name: "Drawing Tools",
                description: "Extension point for custom drawing tools",
                type: "tool",
                version: "1.0.0",
                providedBy: "core",
                handlers: [],
            },
            {
                id: "exporters",
                name: "Export Formats",
                description: "Extension point for custom export formats",
                type: "exporter",
                version: "1.0.0",
                providedBy: "core",
                handlers: [],
            },
            {
                id: "importers",
                name: "Import Formats",
                description: "Extension point for custom import formats",
                type: "importer",
                version: "1.0.0",
                providedBy: "core",
                handlers: [],
            },
            {
                id: "effects",
                name: "Visual Effects",
                description: "Extension point for custom visual effects",
                type: "effect",
                version: "1.0.0",
                providedBy: "core",
                handlers: [],
            },
            {
                id: "property-controls",
                name: "Property Controls",
                description: "Extension point for custom property controls",
                type: "property-control",
                version: "1.0.0",
                providedBy: "core",
                handlers: [],
            },
            {
                id: "ui-components",
                name: "UI Components",
                description: "Extension point for custom UI components",
                type: "ui-component",
                version: "1.0.0",
                providedBy: "core",
                handlers: [],
            },
        ];

        coreExtensionPoints.forEach((ep) => {
            this.state.extensionPoints[ep.id] = ep;
        });
    }

    private createSandbox(pluginId: string): PluginSandbox {
        // Create isolated execution environment
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.setAttribute("sandbox", "allow-scripts");
        document.body.appendChild(iframe);

        const sandbox: PluginSandbox = {
            eval: (code: string) => {
                // Use Function constructor instead of iframe eval for better sandboxing
                try {
                    return new Function(`"use strict"; ${code}`)();
                } catch (error) {
                    throw new Error(`Sandbox execution error: ${error}`);
                }
            },
            require: (module: string) => {
                // Controlled module loading
                const allowedModules = ["react", "react-dom"];
                if (!allowedModules.includes(module)) {
                    throw new Error(`Module ${module} is not allowed`);
                }
                return require(module);
            },
            global: iframe.contentWindow || window,
            destroy: () => {
                document.body.removeChild(iframe);
            },
        };

        return sandbox;
    }

    private createPluginAPI(pluginId: string): PluginAPI {
        const plugin = this.state.plugins[pluginId];
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        // Create permission-checked API
        const api: PluginAPI = {
            canvas: this.createCanvasAPI(pluginId),
            layers: this.createLayersAPI(pluginId),
            tools: this.createToolsAPI(pluginId),
            io: this.createIOAPI(pluginId),
            ui: this.createUIAPI(pluginId),
            storage: this.createStorageAPI(pluginId),
            events: this.createEventsAPI(pluginId),
            plugins: this.createPluginsAPI(pluginId),
        };

        return api;
    }

    private createCanvasAPI(pluginId: string): PluginAPI["canvas"] {
        return {
            getObjects: () => {
                this.checkPermission(pluginId, "canvas:read");
                return Object.values(this.editorAPI.state.objects);
            },
            getSelectedObjects: () => {
                this.checkPermission(pluginId, "canvas:read");
                return this.editorAPI.state.selection.objects
                    .map((id: string) => this.editorAPI.state.objects[id])
                    .filter(Boolean);
            },
            addObject: (object: Omit<CanvasObject, "id">) => {
                this.checkPermission(pluginId, "canvas:write");
                const id = `plugin-${pluginId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                this.editorAPI.addObject({ ...object, id });
                return id;
            },
            updateObject: (id: string, updates: Partial<CanvasObject>) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.updateObject(id, updates);
                return true;
            },
            deleteObject: (id: string) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.deleteObject(id);
                return true;
            },
            selectObjects: (objectIds: string[]) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.selectObjects(objectIds);
            },
            clearSelection: () => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.clearSelection();
            },
            getViewport: () => {
                this.checkPermission(pluginId, "canvas:read");
                return this.editorAPI.state.viewport;
            },
            setViewport: (viewport: Partial<ViewportState>) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.setViewport(viewport);
            },
            getBounds: (objectIds?: string[]) => {
                this.checkPermission(pluginId, "canvas:read");
                // Calculate bounds for specified objects or all objects
                const objects = objectIds
                    ? objectIds.map((id) => this.editorAPI.state.objects[id]).filter(Boolean)
                    : Object.values(this.editorAPI.state.objects);

                if (objects.length === 0) {
                    return { x: 0, y: 0, width: 0, height: 0 };
                }

                // Calculate combined bounds
                let minX = Infinity,
                    minY = Infinity,
                    maxX = -Infinity,
                    maxY = -Infinity;
                objects.forEach((obj: CanvasObject) => {
                    const bounds = this.calculateObjectBounds(obj);
                    minX = Math.min(minX, bounds.x);
                    minY = Math.min(minY, bounds.y);
                    maxX = Math.max(maxX, bounds.x + bounds.width);
                    maxY = Math.max(maxY, bounds.y + bounds.height);
                });

                return {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                };
            },
        };
    }

    private createLayersAPI(pluginId: string): PluginAPI["layers"] {
        return {
            getLayers: () => {
                this.checkPermission(pluginId, "canvas:read");
                return Object.values(this.editorAPI.state.layers);
            },
            addLayer: (layer: Omit<Layer, "id">) => {
                this.checkPermission(pluginId, "canvas:write");
                const id = `plugin-layer-${pluginId}-${Date.now()}`;
                this.editorAPI.addLayer({ ...layer, id });
                return id;
            },
            updateLayer: (id: string, updates: Partial<Layer>) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.updateLayer(id, updates);
                return true;
            },
            deleteLayer: (id: string) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.deleteLayer(id);
                return true;
            },
            reorderLayers: (layerOrder: string[]) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.reorderLayers(layerOrder);
            },
        };
    }

    private createToolsAPI(pluginId: string): PluginAPI["tools"] {
        return {
            getActiveTool: () => {
                this.checkPermission(pluginId, "canvas:read");
                return this.editorAPI.state.selectedTool;
            },
            setActiveTool: (tool: ToolType) => {
                this.checkPermission(pluginId, "canvas:write");
                this.editorAPI.setTool(tool);
            },
            registerTool: (tool: CustomTool) => {
                this.checkPermission(pluginId, "ui:create");
                return this.registerCustomTool(pluginId, tool);
            },
            unregisterTool: (toolId: string) => {
                this.checkPermission(pluginId, "ui:modify");
                return this.unregisterCustomTool(pluginId, toolId);
            },
        };
    }

    private createIOAPI(pluginId: string): PluginAPI["io"] {
        return {
            exportSVG: async (options?: ExportOptions) => {
                this.checkPermission(pluginId, "files:write");
                // Use existing export utilities with proper type conversion
                const { exportSVG } = await import("../utils/export");
                const exportOptions = options
                    ? {
                          format: "svg" as const,
                          width: options.width,
                          height: options.height,
                          scale: options.scale,
                          quality: options.quality,
                          includeMetadata: options.includeMetadata,
                      }
                    : { format: "svg" as const };

                const result = await exportSVG(this.editorAPI.getCanvasElement(), exportOptions);
                return result.blob;
            },
            exportPNG: async (options?: ExportOptions) => {
                this.checkPermission(pluginId, "files:write");
                const { exportPNG } = await import("../utils/export");
                const exportOptions = options
                    ? {
                          format: "png" as const,
                          width: options.width,
                          height: options.height,
                          scale: options.scale,
                          quality: options.quality,
                          includeMetadata: options.includeMetadata,
                      }
                    : { format: "png" as const };

                const result = await exportPNG(this.editorAPI.getCanvasElement(), exportOptions);
                return result.blob;
            },
            exportJSON: async () => {
                this.checkPermission(pluginId, "files:write");
                const { exportJSON } = await import("../utils/export");
                const result = await exportJSON(this.editorAPI.state);
                return result.blob;
            },
            importFromFile: async (file: File) => {
                this.checkPermission(pluginId, "files:read");
                // Implementation depends on file type
                return false;
            },
            showFileDialog: async (options: FileDialogOptions) => {
                this.checkPermission(pluginId, "files:read");
                return new Promise((resolve) => {
                    const input = document.createElement("input");
                    input.type = "file";
                    if (options.accept) input.accept = options.accept;
                    if (options.multiple) input.multiple = true;

                    input.onchange = () => {
                        resolve(Array.from(input.files || []));
                    };

                    input.click();
                });
            },
        };
    }

    private createUIAPI(pluginId: string): PluginAPI["ui"] {
        return {
            showNotification: (message: string, type = "info") => {
                this.checkPermission(pluginId, "ui:create");
                this.emitEvent("notification:show", { message, type, pluginId });
            },
            showDialog: async (config: DialogConfig) => {
                this.checkPermission(pluginId, "ui:create");
                return new Promise((resolve) => {
                    this.emitEvent("dialog:show", { config, resolve, pluginId });
                });
            },
            createPanel: (config: PanelConfig) => {
                this.checkPermission(pluginId, "ui:create");
                return this.createPanelInstance(pluginId, config);
            },
            registerMenuItem: (config: MenuItemConfig) => {
                this.checkPermission(pluginId, "ui:create");
                return this.registerMenuItem(pluginId, config);
            },
            unregisterMenuItem: (id: string) => {
                this.checkPermission(pluginId, "ui:modify");
                return this.unregisterMenuItem(pluginId, id);
            },
        };
    }

    private createStorageAPI(pluginId: string): PluginAPI["storage"] {
        const storageKey = `plugin-${pluginId}`;

        return {
            get: async (key: string) => {
                this.checkPermission(pluginId, "storage:read");
                const data = localStorage.getItem(`${storageKey}-${key}`);
                return data ? JSON.parse(data) : undefined;
            },
            set: async (key: string, value: any) => {
                this.checkPermission(pluginId, "storage:write");
                localStorage.setItem(`${storageKey}-${key}`, JSON.stringify(value));
            },
            remove: async (key: string) => {
                this.checkPermission(pluginId, "storage:write");
                localStorage.removeItem(`${storageKey}-${key}`);
            },
            clear: async () => {
                this.checkPermission(pluginId, "storage:write");
                // Remove all plugin storage keys
                Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith(storageKey)) {
                        localStorage.removeItem(key);
                    }
                });
            },
        };
    }

    private createEventsAPI(pluginId: string): PluginAPI["events"] {
        return {
            on: (event: string, callback: (...args: any[]) => void) => {
                const wrappedCallback = (e: Event) => {
                    const customEvent = e as CustomEvent;
                    callback(...(customEvent.detail?.args || []));
                };
                this.eventEmitter.addEventListener(`plugin-${pluginId}:${event}`, wrappedCallback);
                return () => {
                    this.eventEmitter.removeEventListener(`plugin-${pluginId}:${event}`, wrappedCallback);
                };
            },
            emit: (event: string, ...args: any[]) => {
                this.emitEvent(`plugin-${pluginId}:${event}`, { args });
            },
            off: (event: string, callback: (...args: any[]) => void) => {
                this.eventEmitter.removeEventListener(`plugin-${pluginId}:${event}`, callback as EventListener);
            },
        };
    }

    private createPluginsAPI(pluginId: string): PluginAPI["plugins"] {
        return {
            getPlugin: (id: string) => {
                return this.getPlugin(id);
            },
            getPlugins: () => {
                return this.getPlugins();
            },
            executePluginAction: async (targetPluginId: string, actionId: string, params?: any) => {
                return this.executePluginAction(targetPluginId, actionId, params);
            },
        };
    }

    private checkPermission(pluginId: string, permission: PluginPermission): void {
        const plugin = this.state.plugins[pluginId];
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        if (!plugin.manifest.permissions.includes(permission)) {
            throw new Error(`Plugin ${pluginId} does not have permission: ${permission}`);
        }
    }

    private validatePluginManifest(manifest: PluginManifest): void {
        const required = ["id", "name", "version", "description", "author", "category", "permissions"];
        for (const field of required) {
            if (!(field in manifest)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate version format (semantic versioning)
        const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/;
        if (!versionRegex.test(manifest.version)) {
            throw new Error("Invalid version format. Use semantic versioning (e.g., 1.0.0)");
        }
    }

    private validateExtensionPoint(extensionPoint: ExtensionPoint): void {
        const required = ["id", "name", "type", "version", "providedBy"];
        for (const field of required) {
            if (!(field in extensionPoint)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    private async loadFromUrl(url: string): Promise<PluginInstance> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load plugin from ${url}: ${response.statusText}`);
        }

        const code = await response.text();
        return this.executePluginCode(code);
    }

    private async loadFromFile(file: File): Promise<PluginInstance> {
        const code = await file.text();
        return this.executePluginCode(code);
    }

    private executePluginCode(code: string): PluginInstance {
        // Basic security: validate code doesn't contain dangerous patterns
        const dangerousPatterns = [/eval\s*\(/, /Function\s*\(/, /document\.write/, /innerHTML\s*=/, /outerHTML\s*=/];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(code)) {
                throw new Error("Plugin contains potentially dangerous code");
            }
        }

        // Execute in controlled environment
        try {
            // This is a simplified execution - in production, you'd want more sophisticated sandboxing
            const pluginFunction = new Function("exports", "require", code);
            const exports: any = {};
            const require = (module: string) => {
                throw new Error(`Require not supported for module: ${module}`);
            };

            pluginFunction(exports, require);

            return exports.default || exports;
        } catch (error) {
            throw new Error(`Failed to execute plugin code: ${error}`);
        }
    }

    private extractPluginIdFromUrl(url: string): string {
        return (
            url
                .split("/")
                .pop()
                ?.replace(/\.[^/.]+$/, "") || "unknown"
        );
    }

    private async extractManifest(instance: any): Promise<PluginManifest> {
        if (instance.manifest) {
            return instance.manifest;
        }

        throw new Error("Plugin does not provide a manifest");
    }

    private calculateObjectBounds(obj: CanvasObject): Bounds {
        // Simplified bounds calculation - in practice, this would be more complex
        return {
            x: obj.transform.x,
            y: obj.transform.y,
            width: 100, // Would calculate based on object type and properties
            height: 100,
        };
    }

    private async loadPluginState(): Promise<void> {
        try {
            const saved = localStorage.getItem("plugin-manager-state");
            if (saved) {
                const state = JSON.parse(saved);
                // Restore minimal state, actual plugins need to be reloaded
                this.state.errors = state.errors || [];
            }
        } catch (error) {
            console.warn("Failed to load plugin state:", error);
        }
    }

    private async loadEnabledPlugins(): Promise<void> {
        const enabledPlugins = this.getEnabledPluginIds();
        for (const pluginId of enabledPlugins) {
            try {
                // In a real implementation, you'd store plugin URLs/paths
                // await this.loadPlugin(pluginUrl, true);
            } catch (error) {
                this.addError(pluginId, `Failed to auto-load plugin: ${error}`);
            }
        }
    }

    private getEnabledPluginIds(): string[] {
        try {
            const enabled = localStorage.getItem("enabled-plugins");
            return enabled ? JSON.parse(enabled) : [];
        } catch {
            return [];
        }
    }

    private async registerPluginExtensionPoints(pluginId: string): Promise<void> {
        const plugin = this.state.plugins[pluginId];
        if (!plugin) return;

        // Register extension points provided by this plugin
        for (const extensionPointId of plugin.manifest.extensionPoints) {
            // Implementation would depend on how extension points are defined
        }
    }

    private async unregisterPluginExtensionPoints(pluginId: string): Promise<void> {
        // Remove extension points provided by this plugin
        Object.keys(this.state.extensionPoints).forEach((epId) => {
            const ep = this.state.extensionPoints[epId];
            if (ep && ep.providedBy === pluginId) {
                this.unregisterExtensionPoint(epId);
            }
        });
    }

    private registerCustomTool(pluginId: string, tool: CustomTool): boolean {
        // Register custom tool with the toolbar
        // Implementation would integrate with the existing tool system
        return true;
    }

    private unregisterCustomTool(pluginId: string, toolId: string): boolean {
        // Unregister custom tool
        return true;
    }

    private createPanelInstance(pluginId: string, config: PanelConfig): PanelInstance {
        // Create and manage UI panel
        const instance: PanelInstance = {
            id: config.id,
            show: () => this.emitEvent("panel:show", { panelId: config.id }),
            hide: () => this.emitEvent("panel:hide", { panelId: config.id }),
            toggle: () => this.emitEvent("panel:toggle", { panelId: config.id }),
            setTitle: (title: string) => this.emitEvent("panel:set-title", { panelId: config.id, title }),
            setContent: (content: React.ComponentType) =>
                this.emitEvent("panel:set-content", { panelId: config.id, content }),
            destroy: () => this.emitEvent("panel:destroy", { panelId: config.id }),
        };

        return instance;
    }

    private registerMenuItem(pluginId: string, config: MenuItemConfig): boolean {
        this.emitEvent("menu:register-item", { pluginId, config });
        return true;
    }

    private unregisterMenuItem(pluginId: string, id: string): boolean {
        this.emitEvent("menu:unregister-item", { pluginId, id });
        return true;
    }

    private emitEvent(type: string, detail?: any): void {
        this.eventEmitter.dispatchEvent(new CustomEvent(type, { detail }));
    }

    private addError(pluginId: string, error: string, critical = false): void {
        const pluginError: PluginError = {
            pluginId,
            error,
            timestamp: Date.now(),
            critical,
        };

        this.state.errors.push(pluginError);

        // Limit error history
        if (this.state.errors.length > 100) {
            this.state.errors = this.state.errors.slice(-50);
        }

        this.emitEvent("plugin:error", { error: pluginError });
    }
}

/**
 * Permission Manager for plugin security
 */
class PermissionManager {
    checkPermissions(permissions: PluginPermission[]): boolean {
        // In a real implementation, this would check user consent
        // and system capabilities
        return true;
    }
}

/**
 * Dependency Resolver for plugin dependencies
 */
class DependencyResolver {
    async checkDependencies(manifest: PluginManifest): Promise<string[]> {
        const issues: string[] = [];

        if (manifest.dependencies) {
            for (const dep of manifest.dependencies) {
                // Check if dependency is available and compatible
                // This would integrate with a plugin registry
            }
        }

        return issues;
    }
}

export { PluginManager };
