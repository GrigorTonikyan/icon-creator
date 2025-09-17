import { useEffect, useCallback, useRef } from "react";
import { keyboardShortcutManager, type KeyboardShortcut } from "../utils/keyboardShortcuts";
import { useEditor } from "../contexts/EditorContext";

export interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
    const { enabled = true } = options;
    const {
        setTool,
        undo,
        redo,
        selectObjects,
        deleteObject,
        clearSelection,
        setViewport,
        toggleGrid,
        toggleRulers,
        alignObjects,
        createNewProject,
        saveProjectToStorage,
        downloadProjectFile,
        uploadProjectFile,
        state,
    } = useEditor();

    const actionsRef = useRef<Record<string, () => void>>({});

    // Define action handlers
    const actions = useCallback(
        () => ({
            // Tools
            selectTool: () => setTool("select"),
            rectangleTool: () => setTool("rectangle"),
            circleTool: () => setTool("circle"),
            pathTool: () => setTool("pen"),
            textTool: () => setTool("text"),

            // Edit
            undo: () => undo(),
            redo: () => redo(),
            copy: () => {
                // Copy selected objects to clipboard
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 0) {
                    const selectedObjects = selectedIds.map((id) => state.objects[id]).filter(Boolean);
                    localStorage.setItem("clipboard-objects", JSON.stringify(selectedObjects));
                }
            },
            paste: () => {
                // Paste objects from clipboard
                try {
                    const clipboardData = localStorage.getItem("clipboard-objects");
                    if (clipboardData) {
                        const objects = JSON.parse(clipboardData);
                        // Implementation would add objects with new IDs
                        console.log("Paste objects:", objects);
                    }
                } catch (error) {
                    console.error("Failed to paste:", error);
                }
            },
            cut: () => {
                // Cut selected objects
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 0) {
                    const selectedObjects = selectedIds.map((id) => state.objects[id]).filter(Boolean);
                    localStorage.setItem("clipboard-objects", JSON.stringify(selectedObjects));
                    selectedIds.forEach((id) => deleteObject(id));
                }
            },
            duplicate: () => {
                // Duplicate selected objects
                const selectedIds = state.selection.objectIds;
                console.log("Duplicate objects:", selectedIds);
                // Implementation would create duplicates
            },
            selectAll: () => {
                // Select all objects
                const allObjectIds = Object.keys(state.objects);
                selectObjects(allObjectIds);
            },
            delete: () => {
                // Delete selected objects
                const selectedIds = state.selection.objectIds;
                selectedIds.forEach((id) => deleteObject(id));
                clearSelection();
            },

            // View
            zoomIn: () => {
                const newZoom = Math.min(state.viewport.zoom * 1.2, 10);
                setViewport({ zoom: newZoom });
            },
            zoomOut: () => {
                const newZoom = Math.max(state.viewport.zoom / 1.2, 0.1);
                setViewport({ zoom: newZoom });
            },
            zoomToFit: () => {
                // Fit all objects in view
                setViewport({ zoom: 1, panX: 0, panY: 0 });
            },
            zoom100: () => {
                setViewport({ zoom: 1 });
            },
            toggleGrid: () => toggleGrid(),
            toggleRulers: () => toggleRulers(),

            // File
            newDocument: () => createNewProject(),
            openDocument: () => {
                // Trigger file input
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        uploadProjectFile(file);
                    }
                };
                input.click();
            },
            saveDocument: () => saveProjectToStorage(),
            exportDocument: () => downloadProjectFile(),

            // Align
            alignLeft: () => {
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 1) {
                    alignObjects("left", selectedIds);
                }
            },
            alignCenterHorizontal: () => {
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 1) {
                    alignObjects("center-horizontal", selectedIds);
                }
            },
            alignRight: () => {
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 1) {
                    alignObjects("right", selectedIds);
                }
            },
            alignTop: () => {
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 1) {
                    alignObjects("top", selectedIds);
                }
            },
            alignCenterVertical: () => {
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 1) {
                    alignObjects("center-vertical", selectedIds);
                }
            },
            alignBottom: () => {
                const selectedIds = state.selection.objectIds;
                if (selectedIds.length > 1) {
                    alignObjects("bottom", selectedIds);
                }
            },
        }),
        [
            setTool,
            undo,
            redo,
            selectObjects,
            deleteObject,
            clearSelection,
            setViewport,
            toggleGrid,
            toggleRulers,
            alignObjects,
            createNewProject,
            saveProjectToStorage,
            downloadProjectFile,
            uploadProjectFile,
            state,
        ]
    );

    actionsRef.current = actions();

    // Register keyboard event listener
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const handled = keyboardShortcutManager.handleKeyDown(event);
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => document.removeEventListener("keydown", handleKeyDown, true);
    }, [enabled]);

    // Register action handlers with the manager
    useEffect(() => {
        if (!actionsRef.current) return;

        Object.entries(actionsRef.current).forEach(([action, handler]) => {
            keyboardShortcutManager.registerAction(action, handler);
        });

        return () => {
            Object.keys(actionsRef.current || {}).forEach((action) => {
                keyboardShortcutManager.unregisterAction(action);
            });
        };
    }, []);

    // Keyboard shortcut management functions
    const getShortcuts = useCallback(() => {
        return keyboardShortcutManager.getAllShortcuts();
    }, []);

    const getShortcutsByCategory = useCallback((category: string) => {
        return keyboardShortcutManager.getShortcutsByCategory(category);
    }, []);

    const getCategories = useCallback(() => {
        return keyboardShortcutManager.getCategories();
    }, []);

    const updateShortcut = useCallback((id: string, keys: string[]) => {
        try {
            return keyboardShortcutManager.updateShortcut(id, keys);
        } catch (error) {
            console.error("Failed to update shortcut:", error);
            throw error;
        }
    }, []);

    const resetShortcut = useCallback((id: string) => {
        return keyboardShortcutManager.resetShortcut(id);
    }, []);

    const enableShortcut = useCallback((id: string, enabled: boolean) => {
        return keyboardShortcutManager.enableShortcut(id, enabled);
    }, []);

    const findConflicts = useCallback((excludeId: string, keys: string[]) => {
        return keyboardShortcutManager.findConflicts(excludeId, keys);
    }, []);

    const applyPreset = useCallback((presetId: string) => {
        return keyboardShortcutManager.applyPreset(presetId);
    }, []);

    const createCustomPreset = useCallback((name: string, description: string) => {
        return keyboardShortcutManager.createCustomPreset(name, description);
    }, []);

    const deleteCustomPreset = useCallback((id: string) => {
        return keyboardShortcutManager.deleteCustomPreset(id);
    }, []);

    const getPresets = useCallback(() => {
        return keyboardShortcutManager.getPresets();
    }, []);

    const getKeyDisplayString = useCallback((keys: string[]) => {
        return keyboardShortcutManager.getKeyDisplayString(keys);
    }, []);

    return {
        // Shortcut queries
        getShortcuts,
        getShortcutsByCategory,
        getCategories,
        getKeyDisplayString,

        // Shortcut management
        updateShortcut,
        resetShortcut,
        enableShortcut,
        findConflicts,

        // Preset management
        applyPreset,
        createCustomPreset,
        deleteCustomPreset,
        getPresets,

        // Manager instance (for advanced use)
        manager: keyboardShortcutManager,
    };
}
