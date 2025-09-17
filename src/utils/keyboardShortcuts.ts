// Simple storage interface for keyboard shortcuts
const storage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
        }
    },
};

export interface KeyboardShortcut {
    id: string;
    name: string;
    description: string;
    category: string;
    defaultKeys: string[];
    customKeys?: string[];
    action: string;
    enabled: boolean;
}

export interface ShortcutPreset {
    id: string;
    name: string;
    description: string;
    shortcuts: Record<string, string[]>;
}

export interface KeyboardShortcutConfig {
    shortcuts: Record<string, KeyboardShortcut>;
    activePreset: string;
    customPresets: Record<string, ShortcutPreset>;
}

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS: Record<string, KeyboardShortcut> = {
    // Tools
    "tool-select": {
        id: "tool-select",
        name: "Select Tool",
        description: "Switch to selection tool",
        category: "Tools",
        defaultKeys: ["v"],
        action: "selectTool",
        enabled: true,
    },
    "tool-rectangle": {
        id: "tool-rectangle",
        name: "Rectangle Tool",
        description: "Switch to rectangle tool",
        category: "Tools",
        defaultKeys: ["r"],
        action: "rectangleTool",
        enabled: true,
    },
    "tool-circle": {
        id: "tool-circle",
        name: "Circle Tool",
        description: "Switch to circle tool",
        category: "Tools",
        defaultKeys: ["c"],
        action: "circleTool",
        enabled: true,
    },
    "tool-path": {
        id: "tool-path",
        name: "Path Tool",
        description: "Switch to path tool",
        category: "Tools",
        defaultKeys: ["p"],
        action: "pathTool",
        enabled: true,
    },
    "tool-text": {
        id: "tool-text",
        name: "Text Tool",
        description: "Switch to text tool",
        category: "Tools",
        defaultKeys: ["t"],
        action: "textTool",
        enabled: true,
    },

    // Edit
    "edit-undo": {
        id: "edit-undo",
        name: "Undo",
        description: "Undo last action",
        category: "Edit",
        defaultKeys: ["Ctrl+z", "Cmd+z"],
        action: "undo",
        enabled: true,
    },
    "edit-redo": {
        id: "edit-redo",
        name: "Redo",
        description: "Redo last undone action",
        category: "Edit",
        defaultKeys: ["Ctrl+y", "Cmd+Shift+z"],
        action: "redo",
        enabled: true,
    },
    "edit-copy": {
        id: "edit-copy",
        name: "Copy",
        description: "Copy selected objects",
        category: "Edit",
        defaultKeys: ["Ctrl+c", "Cmd+c"],
        action: "copy",
        enabled: true,
    },
    "edit-paste": {
        id: "edit-paste",
        name: "Paste",
        description: "Paste copied objects",
        category: "Edit",
        defaultKeys: ["Ctrl+v", "Cmd+v"],
        action: "paste",
        enabled: true,
    },
    "edit-cut": {
        id: "edit-cut",
        name: "Cut",
        description: "Cut selected objects",
        category: "Edit",
        defaultKeys: ["Ctrl+x", "Cmd+x"],
        action: "cut",
        enabled: true,
    },
    "edit-duplicate": {
        id: "edit-duplicate",
        name: "Duplicate",
        description: "Duplicate selected objects",
        category: "Edit",
        defaultKeys: ["Ctrl+d", "Cmd+d"],
        action: "duplicate",
        enabled: true,
    },
    "edit-select-all": {
        id: "edit-select-all",
        name: "Select All",
        description: "Select all objects",
        category: "Edit",
        defaultKeys: ["Ctrl+a", "Cmd+a"],
        action: "selectAll",
        enabled: true,
    },
    "edit-delete": {
        id: "edit-delete",
        name: "Delete",
        description: "Delete selected objects",
        category: "Edit",
        defaultKeys: ["Delete", "Backspace"],
        action: "delete",
        enabled: true,
    },

    // View
    "view-zoom-in": {
        id: "view-zoom-in",
        name: "Zoom In",
        description: "Zoom in on canvas",
        category: "View",
        defaultKeys: ["Ctrl+=", "Cmd+="],
        action: "zoomIn",
        enabled: true,
    },
    "view-zoom-out": {
        id: "view-zoom-out",
        name: "Zoom Out",
        description: "Zoom out of canvas",
        category: "View",
        defaultKeys: ["Ctrl+-", "Cmd+-"],
        action: "zoomOut",
        enabled: true,
    },
    "view-zoom-fit": {
        id: "view-zoom-fit",
        name: "Zoom to Fit",
        description: "Fit all objects in view",
        category: "View",
        defaultKeys: ["Ctrl+0", "Cmd+0"],
        action: "zoomToFit",
        enabled: true,
    },
    "view-zoom-100": {
        id: "view-zoom-100",
        name: "Zoom to 100%",
        description: "Reset zoom to 100%",
        category: "View",
        defaultKeys: ["Ctrl+1", "Cmd+1"],
        action: "zoom100",
        enabled: true,
    },
    "view-toggle-grid": {
        id: "view-toggle-grid",
        name: "Toggle Grid",
        description: "Show/hide grid",
        category: "View",
        defaultKeys: ["Ctrl+g", "Cmd+g"],
        action: "toggleGrid",
        enabled: true,
    },
    "view-toggle-rulers": {
        id: "view-toggle-rulers",
        name: "Toggle Rulers",
        description: "Show/hide rulers",
        category: "View",
        defaultKeys: ["Ctrl+r", "Cmd+r"],
        action: "toggleRulers",
        enabled: true,
    },

    // File
    "file-new": {
        id: "file-new",
        name: "New",
        description: "Create new document",
        category: "File",
        defaultKeys: ["Ctrl+n", "Cmd+n"],
        action: "newDocument",
        enabled: true,
    },
    "file-open": {
        id: "file-open",
        name: "Open",
        description: "Open document",
        category: "File",
        defaultKeys: ["Ctrl+o", "Cmd+o"],
        action: "openDocument",
        enabled: true,
    },
    "file-save": {
        id: "file-save",
        name: "Save",
        description: "Save document",
        category: "File",
        defaultKeys: ["Ctrl+s", "Cmd+s"],
        action: "saveDocument",
        enabled: true,
    },
    "file-export": {
        id: "file-export",
        name: "Export",
        description: "Export document",
        category: "File",
        defaultKeys: ["Ctrl+e", "Cmd+e"],
        action: "exportDocument",
        enabled: true,
    },

    // Align
    "align-left": {
        id: "align-left",
        name: "Align Left",
        description: "Align selected objects to the left",
        category: "Align",
        defaultKeys: ["Ctrl+Shift+l"],
        action: "alignLeft",
        enabled: true,
    },
    "align-center-h": {
        id: "align-center-h",
        name: "Align Center Horizontal",
        description: "Align selected objects to center horizontally",
        category: "Align",
        defaultKeys: ["Ctrl+Shift+h"],
        action: "alignCenterHorizontal",
        enabled: true,
    },
    "align-right": {
        id: "align-right",
        name: "Align Right",
        description: "Align selected objects to the right",
        category: "Align",
        defaultKeys: ["Ctrl+Shift+r"],
        action: "alignRight",
        enabled: true,
    },
    "align-top": {
        id: "align-top",
        name: "Align Top",
        description: "Align selected objects to the top",
        category: "Align",
        defaultKeys: ["Ctrl+Shift+t"],
        action: "alignTop",
        enabled: true,
    },
    "align-center-v": {
        id: "align-center-v",
        name: "Align Center Vertical",
        description: "Align selected objects to center vertically",
        category: "Align",
        defaultKeys: ["Ctrl+Shift+v"],
        action: "alignCenterVertical",
        enabled: true,
    },
    "align-bottom": {
        id: "align-bottom",
        name: "Align Bottom",
        description: "Align selected objects to the bottom",
        category: "Align",
        defaultKeys: ["Ctrl+Shift+b"],
        action: "alignBottom",
        enabled: true,
    },
};

// Built-in presets
export const BUILT_IN_PRESETS: Record<string, ShortcutPreset> = {
    default: {
        id: "default",
        name: "Default",
        description: "Standard keyboard shortcuts",
        shortcuts: Object.fromEntries(
            Object.entries(DEFAULT_SHORTCUTS).map(([id, shortcut]) => [id, shortcut.defaultKeys])
        ),
    },
    photoshop: {
        id: "photoshop",
        name: "Photoshop-like",
        description: "Photoshop-inspired keyboard shortcuts",
        shortcuts: {
            "tool-select": ["v"],
            "tool-rectangle": ["u"],
            "tool-circle": ["u"],
            "tool-path": ["p"],
            "tool-text": ["t"],
            "edit-undo": ["Ctrl+z", "Cmd+z"],
            "edit-redo": ["Ctrl+Alt+z", "Cmd+Option+z"],
            "edit-copy": ["Ctrl+c", "Cmd+c"],
            "edit-paste": ["Ctrl+v", "Cmd+v"],
            "edit-cut": ["Ctrl+x", "Cmd+x"],
            "edit-duplicate": ["Ctrl+j", "Cmd+j"],
            "edit-select-all": ["Ctrl+a", "Cmd+a"],
            "edit-delete": ["Delete", "Backspace"],
            "view-zoom-in": ["Ctrl+=", "Cmd+="],
            "view-zoom-out": ["Ctrl+-", "Cmd+-"],
            "view-zoom-fit": ["Ctrl+0", "Cmd+0"],
            "view-zoom-100": ["Ctrl+Alt+0", "Cmd+Option+0"],
            "view-toggle-grid": ["Ctrl+;", "Cmd+;"],
            "view-toggle-rulers": ["Ctrl+r", "Cmd+r"],
            "file-new": ["Ctrl+n", "Cmd+n"],
            "file-open": ["Ctrl+o", "Cmd+o"],
            "file-save": ["Ctrl+s", "Cmd+s"],
            "file-export": ["Ctrl+Shift+s", "Cmd+Shift+s"],
        },
    },
    figma: {
        id: "figma",
        name: "Figma-like",
        description: "Figma-inspired keyboard shortcuts",
        shortcuts: {
            "tool-select": ["v"],
            "tool-rectangle": ["r"],
            "tool-circle": ["o"],
            "tool-path": ["p"],
            "tool-text": ["t"],
            "edit-undo": ["Ctrl+z", "Cmd+z"],
            "edit-redo": ["Ctrl+Shift+z", "Cmd+Shift+z"],
            "edit-copy": ["Ctrl+c", "Cmd+c"],
            "edit-paste": ["Ctrl+v", "Cmd+v"],
            "edit-cut": ["Ctrl+x", "Cmd+x"],
            "edit-duplicate": ["Ctrl+d", "Cmd+d"],
            "edit-select-all": ["Ctrl+a", "Cmd+a"],
            "edit-delete": ["Delete", "Backspace"],
            "view-zoom-in": ["Ctrl+=", "Cmd+="],
            "view-zoom-out": ["Ctrl+-", "Cmd+-"],
            "view-zoom-fit": ["Shift+1"],
            "view-zoom-100": ["Shift+0"],
            "view-toggle-grid": ["Ctrl+;", "Cmd+;"],
            "view-toggle-rulers": ["Shift+r"],
            "file-new": ["Ctrl+n", "Cmd+n"],
            "file-open": ["Ctrl+o", "Cmd+o"],
            "file-save": ["Ctrl+s", "Cmd+s"],
            "file-export": ["Ctrl+Shift+e", "Cmd+Shift+e"],
            "align-left": ["Alt+a"],
            "align-center-h": ["Alt+h"],
            "align-right": ["Alt+d"],
            "align-top": ["Alt+w"],
            "align-center-v": ["Alt+v"],
            "align-bottom": ["Alt+s"],
        },
    },
};

export class KeyboardShortcutManager {
    private config: KeyboardShortcutConfig;
    private listeners: Map<string, () => void> = new Map();
    private keyBindings: Map<string, string> = new Map();

    constructor() {
        this.config = this.loadConfig();
        this.updateKeyBindings();
    }

    private loadConfig(): KeyboardShortcutConfig {
        const saved = storage.getItem("keyboard-shortcuts");
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as KeyboardShortcutConfig;
                return {
                    shortcuts: { ...DEFAULT_SHORTCUTS, ...parsed.shortcuts },
                    activePreset: parsed.activePreset || "default",
                    customPresets: parsed.customPresets || {},
                };
            } catch (error) {
                console.error("Failed to parse saved keyboard shortcuts:", error);
            }
        }

        return {
            shortcuts: { ...DEFAULT_SHORTCUTS },
            activePreset: "default",
            customPresets: {},
        };
    }

    private saveConfig(): void {
        storage.setItem("keyboard-shortcuts", JSON.stringify(this.config));
    }

    private updateKeyBindings(): void {
        this.keyBindings.clear();

        Object.values(this.config.shortcuts).forEach((shortcut) => {
            if (!shortcut.enabled) return;

            const keys = shortcut.customKeys || shortcut.defaultKeys;
            keys.forEach((key) => {
                this.keyBindings.set(this.normalizeKey(key), shortcut.action);
            });
        });
    }

    private normalizeKey(key: string): string {
        return key
            .toLowerCase()
            .replace(/cmd/g, "meta")
            .replace(/ctrl/g, "control")
            .replace(/alt/g, "alt")
            .replace(/shift/g, "shift")
            .replace(/\+/g, "+");
    }

    getConfig(): KeyboardShortcutConfig {
        return { ...this.config };
    }

    getShortcut(id: string): KeyboardShortcut | undefined {
        return this.config.shortcuts[id];
    }

    getAllShortcuts(): KeyboardShortcut[] {
        return Object.values(this.config.shortcuts);
    }

    getShortcutsByCategory(category: string): KeyboardShortcut[] {
        return Object.values(this.config.shortcuts).filter((s) => s.category === category);
    }

    getCategories(): string[] {
        const categories = new Set(Object.values(this.config.shortcuts).map((s) => s.category));
        return Array.from(categories).sort();
    }

    updateShortcut(id: string, customKeys: string[]): boolean {
        const shortcut = this.config.shortcuts[id];
        if (!shortcut) return false;

        // Check for conflicts
        const conflicts = this.findConflicts(id, customKeys);
        if (conflicts.length > 0) {
            throw new Error(`Keyboard shortcut conflicts with: ${conflicts.join(", ")}`);
        }

        shortcut.customKeys = customKeys;
        this.updateKeyBindings();
        this.saveConfig();
        return true;
    }

    resetShortcut(id: string): boolean {
        const shortcut = this.config.shortcuts[id];
        if (!shortcut) return false;

        delete shortcut.customKeys;
        this.updateKeyBindings();
        this.saveConfig();
        return true;
    }

    enableShortcut(id: string, enabled: boolean): boolean {
        const shortcut = this.config.shortcuts[id];
        if (!shortcut) return false;

        shortcut.enabled = enabled;
        this.updateKeyBindings();
        this.saveConfig();
        return true;
    }

    findConflicts(excludeId: string, keys: string[]): string[] {
        const conflicts: string[] = [];
        const normalizedKeys = keys.map((k) => this.normalizeKey(k));

        Object.entries(this.config.shortcuts).forEach(([id, shortcut]) => {
            if (id === excludeId || !shortcut.enabled) return;

            const shortcutKeys = (shortcut.customKeys || shortcut.defaultKeys).map((k) => this.normalizeKey(k));

            const hasConflict = normalizedKeys.some((key) => shortcutKeys.includes(key));
            if (hasConflict) {
                conflicts.push(shortcut.name);
            }
        });

        return conflicts;
    }

    applyPreset(presetId: string): boolean {
        const preset = BUILT_IN_PRESETS[presetId] || this.config.customPresets[presetId];
        if (!preset) return false;

        // Apply preset shortcuts
        Object.entries(preset.shortcuts).forEach(([shortcutId, keys]) => {
            const shortcut = this.config.shortcuts[shortcutId];
            if (shortcut) {
                shortcut.customKeys = keys;
            }
        });

        this.config.activePreset = presetId;
        this.updateKeyBindings();
        this.saveConfig();
        return true;
    }

    createCustomPreset(name: string, description: string): string {
        const id = `custom-${Date.now()}`;

        const shortcuts: Record<string, string[]> = {};
        Object.entries(this.config.shortcuts).forEach(([shortcutId, shortcut]) => {
            shortcuts[shortcutId] = shortcut.customKeys || shortcut.defaultKeys;
        });

        this.config.customPresets[id] = {
            id,
            name,
            description,
            shortcuts,
        };

        this.saveConfig();
        return id;
    }

    deleteCustomPreset(id: string): boolean {
        if (!this.config.customPresets[id]) return false;

        delete this.config.customPresets[id];

        if (this.config.activePreset === id) {
            this.config.activePreset = "default";
        }

        this.saveConfig();
        return true;
    }

    getPresets(): ShortcutPreset[] {
        return [...Object.values(BUILT_IN_PRESETS), ...Object.values(this.config.customPresets)];
    }

    handleKeyDown(event: KeyboardEvent): boolean {
        // Don't handle shortcuts when typing in inputs
        if (this.isTypingContext(event.target as Element)) {
            return false;
        }

        const key = this.buildKeyString(event);
        const action = this.keyBindings.get(key);

        if (action) {
            const listener = this.listeners.get(action);
            if (listener) {
                event.preventDefault();
                event.stopPropagation();
                listener();
                return true;
            }
        }

        return false;
    }

    private isTypingContext(target: Element): boolean {
        if (!target) return false;

        const tagName = target.tagName.toLowerCase();
        if (["input", "textarea", "select"].includes(tagName)) {
            return true;
        }

        if (target.getAttribute("contenteditable") === "true") {
            return true;
        }

        return false;
    }

    private buildKeyString(event: KeyboardEvent): string {
        const parts: string[] = [];

        if (event.ctrlKey || event.metaKey) {
            parts.push(event.ctrlKey ? "control" : "meta");
        }
        if (event.altKey) parts.push("alt");
        if (event.shiftKey) parts.push("shift");

        let key = event.key.toLowerCase();

        // Normalize special keys
        if (key === " ") key = "space";
        if (key === "arrowup") key = "up";
        if (key === "arrowdown") key = "down";
        if (key === "arrowleft") key = "left";
        if (key === "arrowright") key = "right";

        parts.push(key);

        return parts.join("+");
    }

    registerAction(action: string, callback: () => void): void {
        this.listeners.set(action, callback);
    }

    unregisterAction(action: string): void {
        this.listeners.delete(action);
    }

    getKeyDisplayString(keys: string[]): string {
        return keys
            .map((key) => {
                return key
                    .replace(/ctrl/gi, "⌃")
                    .replace(/cmd|meta/gi, "⌘")
                    .replace(/alt/gi, "⌥")
                    .replace(/shift/gi, "⇧")
                    .replace(/\+/g, " ");
            })
            .join(" or ");
    }
}

// Global instance
export const keyboardShortcutManager = new KeyboardShortcutManager();
