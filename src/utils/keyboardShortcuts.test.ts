import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    KeyboardShortcutManager,
    DEFAULT_SHORTCUTS,
    BUILT_IN_PRESETS,
    keyboardShortcutManager,
} from "./keyboardShortcuts";

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

// Mock global window and localStorage
Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
});

// Mock KeyboardEvent for Node.js environment
globalThis.KeyboardEvent = class MockKeyboardEvent extends Event {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    target: any;

    constructor(type: string, options: any = {}) {
        super(type);
        this.key = options.key || "";
        this.ctrlKey = options.ctrlKey || false;
        this.metaKey = options.metaKey || false;
        this.altKey = options.altKey || false;
        this.shiftKey = options.shiftKey || false;
    }
} as any;

// Mock document methods for DOM interaction tests
const mockElement = {
    tagName: "div",
    getAttribute: vi.fn(() => null),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createElement: vi.fn(() => ({
        type: "",
        accept: "",
        click: vi.fn(),
        onchange: null,
    })),
};

Object.defineProperty(globalThis, "document", {
    value: {
        createElement: vi.fn(() => mockElement),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    },
    writable: true,
});

describe("KeyboardShortcutManager", () => {
    let manager: KeyboardShortcutManager;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        manager = new KeyboardShortcutManager();

        // Ensure all shortcuts are enabled by default for consistent testing
        const allShortcuts = manager.getAllShortcuts();
        allShortcuts.forEach((shortcut) => {
            if (!shortcut.enabled) {
                manager.enableShortcut(shortcut.id, true);
            }
        });
    });

    describe("initialization", () => {
        it("should initialize with default shortcuts", () => {
            const shortcuts = manager.getAllShortcuts();
            expect(shortcuts.length).toBeGreaterThan(0);
            expect(shortcuts).toEqual(Object.values(DEFAULT_SHORTCUTS));
        });

        it("should load saved config from localStorage", () => {
            const savedConfig = {
                shortcuts: {
                    "tool-select": {
                        ...DEFAULT_SHORTCUTS["tool-select"],
                        customKeys: ["s"],
                    },
                },
                activePreset: "custom",
                customPresets: {},
            };
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig));

            const newManager = new KeyboardShortcutManager();
            const shortcut = newManager.getShortcut("tool-select");
            expect(shortcut?.customKeys).toEqual(["s"]);
        });

        it("should handle corrupted localStorage data gracefully", () => {
            localStorageMock.getItem.mockReturnValue("invalid json");

            expect(() => new KeyboardShortcutManager()).not.toThrow();
            const newManager = new KeyboardShortcutManager();
            expect(newManager.getAllShortcuts()).toEqual(Object.values(DEFAULT_SHORTCUTS));
        });
    });

    describe("shortcut management", () => {
        it("should get shortcut by id", () => {
            const shortcut = manager.getShortcut("tool-select");
            expect(shortcut).toBeDefined();
            expect(shortcut?.id).toBe("tool-select");
            expect(shortcut?.name).toBe("Select Tool");
        });

        it("should return undefined for non-existent shortcut", () => {
            const shortcut = manager.getShortcut("non-existent");
            expect(shortcut).toBeUndefined();
        });

        it("should get shortcuts by category", () => {
            const toolShortcuts = manager.getShortcutsByCategory("Tools");
            expect(toolShortcuts.length).toBeGreaterThan(0);
            toolShortcuts.forEach((shortcut) => {
                expect(shortcut.category).toBe("Tools");
            });
        });

        it("should get all categories", () => {
            const categories = manager.getCategories();
            expect(categories).toContain("Tools");
            expect(categories).toContain("Edit");
            expect(categories).toContain("View");
            expect(categories).toContain("File");
            expect(categories).toContain("Align");
        });

        it("should update shortcut keys", () => {
            const success = manager.updateShortcut("tool-select", ["s"]);
            expect(success).toBe(true);

            const shortcut = manager.getShortcut("tool-select");
            expect(shortcut?.customKeys).toEqual(["s"]);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it("should reject update for non-existent shortcut", () => {
            const success = manager.updateShortcut("non-existent", ["s"]);
            expect(success).toBe(false);
        });

        it("should reset shortcut to default", () => {
            manager.updateShortcut("tool-select", ["s"]);
            const success = manager.resetShortcut("tool-select");
            expect(success).toBe(true);

            const shortcut = manager.getShortcut("tool-select");
            expect(shortcut?.customKeys).toBeUndefined();
        });

        it("should enable/disable shortcuts", () => {
            const success = manager.enableShortcut("tool-select", false);
            expect(success).toBe(true);

            const shortcut = manager.getShortcut("tool-select");
            expect(shortcut?.enabled).toBe(false);
        });
    });

    describe("conflict detection", () => {
        it("should find conflicts with existing shortcuts", () => {
            // Simple test: tool-select uses 'v', so if we try to assign 'v' to tool-rectangle, it should conflict
            const conflicts = manager.findConflicts("tool-rectangle", ["v"]);
            expect(conflicts).toContain("Select Tool");
        });

        it("should not find conflicts with self", () => {
            const conflicts = manager.findConflicts("tool-select", ["v"]);
            expect(conflicts).toHaveLength(0);
        });

        it("should not find conflicts with disabled shortcuts", () => {
            manager.enableShortcut("tool-select", false);
            const conflicts = manager.findConflicts("tool-rectangle", ["v"]);
            expect(conflicts).toHaveLength(0);
        });

        it("should throw error when updating with conflicts", () => {
            // First enable the shortcut to ensure it's active
            manager.enableShortcut("tool-select", true);

            expect(() => {
                manager.updateShortcut("tool-rectangle", ["v"]);
            }).toThrow("Keyboard shortcut conflicts with: Select Tool");
        });
    });

    describe("presets", () => {
        it("should apply built-in preset", () => {
            const success = manager.applyPreset("photoshop");
            expect(success).toBe(true);

            const shortcut = manager.getShortcut("edit-duplicate");
            expect(shortcut?.customKeys).toEqual(["Ctrl+j", "Cmd+j"]);
        });

        it("should reject invalid preset", () => {
            const success = manager.applyPreset("invalid-preset");
            expect(success).toBe(false);
        });

        it("should create custom preset", () => {
            const presetId = manager.createCustomPreset("My Preset", "Custom shortcuts");
            expect(presetId).toMatch(/^custom-\d+$/);

            const presets = manager.getPresets();
            const customPreset = presets.find((p) => p.id === presetId);
            expect(customPreset).toBeDefined();
            expect(customPreset?.name).toBe("My Preset");
        });

        it("should delete custom preset", () => {
            const presetId = manager.createCustomPreset("Test Preset", "Test");
            const success = manager.deleteCustomPreset(presetId);
            expect(success).toBe(true);

            const presets = manager.getPresets();
            expect(presets.find((p) => p.id === presetId)).toBeUndefined();
        });

        it("should not delete built-in preset", () => {
            const success = manager.deleteCustomPreset("default");
            expect(success).toBe(false);
        });

        it("should get all presets", () => {
            const presets = manager.getPresets();
            expect(presets.length).toBeGreaterThanOrEqual(Object.keys(BUILT_IN_PRESETS).length);

            const builtInIds = Object.keys(BUILT_IN_PRESETS);
            builtInIds.forEach((id) => {
                expect(presets.find((p) => p.id === id)).toBeDefined();
            });
        });
    });

    describe("key handling", () => {
        it("should handle simple key events", () => {
            const mockCallback = vi.fn();
            manager.registerAction("selectTool", mockCallback);

            const event = new KeyboardEvent("keydown", { key: "v" });
            const handled = manager.handleKeyDown(event);

            expect(handled).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
        });

        it("should handle modifier key combinations", () => {
            const mockCallback = vi.fn();
            manager.registerAction("undo", mockCallback);

            const event = new KeyboardEvent("keydown", {
                key: "z",
                ctrlKey: true,
            });
            const handled = manager.handleKeyDown(event);

            expect(handled).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
        });

        it("should ignore events in input contexts", () => {
            const mockCallback = vi.fn();
            manager.registerAction("selectTool", mockCallback);

            // Mock input element
            const inputElement = { tagName: "INPUT" };
            const event = new KeyboardEvent("keydown", { key: "v" });
            Object.defineProperty(event, "target", { value: inputElement });

            const handled = manager.handleKeyDown(event);

            expect(handled).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it("should ignore events in contenteditable elements", () => {
            const mockCallback = vi.fn();
            manager.registerAction("selectTool", mockCallback);

            const editableElement = {
                tagName: "DIV",
                getAttribute: vi.fn((attr) => (attr === "contenteditable" ? "true" : null)),
            };
            const event = new KeyboardEvent("keydown", { key: "v" });
            Object.defineProperty(event, "target", { value: editableElement });

            const handled = manager.handleKeyDown(event);

            expect(handled).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it("should not handle unregistered shortcuts", () => {
            const event = new KeyboardEvent("keydown", { key: "x" });
            const handled = manager.handleKeyDown(event);

            expect(handled).toBe(false);
        });

        it("should handle disabled shortcuts as unregistered", () => {
            manager.enableShortcut("tool-select", false);
            const mockCallback = vi.fn();
            manager.registerAction("selectTool", mockCallback);

            const event = new KeyboardEvent("keydown", { key: "v" });
            const handled = manager.handleKeyDown(event);

            expect(handled).toBe(false);
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe("action registration", () => {
        it("should register and unregister actions", () => {
            const mockCallback = vi.fn();

            manager.registerAction("testAction", mockCallback);
            expect(manager["listeners"].has("testAction")).toBe(true);

            manager.unregisterAction("testAction");
            expect(manager["listeners"].has("testAction")).toBe(false);
        });
    });

    describe("key display formatting", () => {
        it("should format key combinations for display", () => {
            const display = manager.getKeyDisplayString(["Ctrl+c", "Cmd+c"]);
            expect(display).toContain("⌃");
            expect(display).toContain("⌘");
            expect(display).toContain("or");
        });

        it("should handle single keys", () => {
            const display = manager.getKeyDisplayString(["v"]);
            expect(display).toBe("v");
        });

        it("should handle complex modifier combinations", () => {
            const display = manager.getKeyDisplayString(["Ctrl+Shift+Alt+z"]);
            expect(display).toContain("⌃");
            expect(display).toContain("⇧");
            expect(display).toContain("⌥");
        });
    });

    describe("key normalization", () => {
        it("should normalize key strings consistently", () => {
            const manager = new KeyboardShortcutManager();

            // Test various key formats
            expect(manager["normalizeKey"]("Ctrl+c")).toBe("control+c");
            expect(manager["normalizeKey"]("Cmd+c")).toBe("meta+c");
            expect(manager["normalizeKey"]("Alt+c")).toBe("alt+c");
            expect(manager["normalizeKey"]("Shift+c")).toBe("shift+c");
        });
    });

    describe("default shortcuts validation", () => {
        it("should have all required default shortcuts", () => {
            const requiredCategories = ["Tools", "Edit", "View", "File", "Align"];
            const shortcuts = manager.getAllShortcuts();

            requiredCategories.forEach((category) => {
                const categoryShortcuts = shortcuts.filter((s) => s.category === category);
                expect(categoryShortcuts.length).toBeGreaterThan(0);
            });
        });

        it("should have no conflicts in default shortcuts", () => {
            const shortcuts = manager.getAllShortcuts();
            const keyMap = new Map<string, string>();

            shortcuts.forEach((shortcut) => {
                shortcut.defaultKeys.forEach((key) => {
                    const normalizedKey = manager["normalizeKey"](key);
                    if (keyMap.has(normalizedKey)) {
                        throw new Error(
                            `Conflict detected: ${key} used by both ${keyMap.get(normalizedKey)} and ${shortcut.name}`
                        );
                    }
                    keyMap.set(normalizedKey, shortcut.name);
                });
            });
        });
    });

    describe("global instance", () => {
        it("should provide a global keyboardShortcutManager instance", () => {
            expect(keyboardShortcutManager).toBeInstanceOf(KeyboardShortcutManager);
        });
    });
});

describe("Built-in Presets", () => {
    it("should have valid preset structure", () => {
        Object.values(BUILT_IN_PRESETS).forEach((preset) => {
            expect(preset.id).toBeDefined();
            expect(preset.name).toBeDefined();
            expect(preset.description).toBeDefined();
            expect(preset.shortcuts).toBeDefined();
            expect(typeof preset.shortcuts).toBe("object");
        });
    });

    it("should reference valid shortcut IDs", () => {
        const validShortcutIds = Object.keys(DEFAULT_SHORTCUTS);

        Object.values(BUILT_IN_PRESETS).forEach((preset) => {
            Object.keys(preset.shortcuts).forEach((shortcutId) => {
                expect(validShortcutIds).toContain(shortcutId);
            });
        });
    });
});
