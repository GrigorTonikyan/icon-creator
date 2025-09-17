import { useState, useCallback, useEffect } from "react";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import type { KeyboardShortcut, ShortcutPreset } from "../../utils/keyboardShortcuts";
import cn from "classnames";
import "./keyboardShortcutSettings.css";

export interface KeyboardShortcutSettingsProps {
    className?: string;
    onClose?: () => void;
}

interface ConflictInfo {
    shortcutId: string;
    conflicts: string[];
}

export function KeyboardShortcutSettings({ className, onClose }: KeyboardShortcutSettingsProps) {
    const {
        getShortcuts,
        getShortcutsByCategory,
        getCategories,
        updateShortcut,
        resetShortcut,
        enableShortcut,
        findConflicts,
        applyPreset,
        createCustomPreset,
        deleteCustomPreset,
        getPresets,
        getKeyDisplayString,
    } = useKeyboardShortcuts();

    const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [presets, setPresets] = useState<ShortcutPreset[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<string>("default");
    const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
    const [editingKeys, setEditingKeys] = useState<string[]>([]);
    const [keyInput, setKeyInput] = useState<string>("");
    const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showCreatePreset, setShowCreatePreset] = useState<boolean>(false);
    const [newPresetName, setNewPresetName] = useState<string>("");
    const [newPresetDescription, setNewPresetDescription] = useState<string>("");

    // Load data
    useEffect(() => {
        const allShortcuts = getShortcuts();
        const allCategories = getCategories();
        const allPresets = getPresets();

        setShortcuts(allShortcuts);
        setCategories(allCategories);
        setPresets(allPresets);

        if (allCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(allCategories[0]);
        }
    }, [getShortcuts, getCategories, getPresets, selectedCategory]);

    // Filter shortcuts
    const filteredShortcuts = shortcuts.filter((shortcut) => {
        const matchesCategory = !selectedCategory || shortcut.category === selectedCategory;
        const matchesSearch =
            !searchTerm ||
            shortcut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shortcut.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleEditShortcut = useCallback(
        (shortcutId: string) => {
            const shortcut = shortcuts.find((s) => s.id === shortcutId);
            if (shortcut) {
                setEditingShortcut(shortcutId);
                setEditingKeys([...(shortcut.customKeys || shortcut.defaultKeys)]);
                setKeyInput("");
                setConflictInfo(null);
            }
        },
        [shortcuts]
    );

    const handleCancelEdit = useCallback(() => {
        setEditingShortcut(null);
        setEditingKeys([]);
        setKeyInput("");
        setConflictInfo(null);
    }, []);

    const handleSaveShortcut = useCallback(() => {
        if (!editingShortcut) return;

        try {
            updateShortcut(editingShortcut, editingKeys);
            setEditingShortcut(null);
            setEditingKeys([]);
            setKeyInput("");
            setConflictInfo(null);

            // Refresh shortcuts
            setShortcuts(getShortcuts());
        } catch (error) {
            console.error("Failed to update shortcut:", error);
        }
    }, [editingShortcut, editingKeys, updateShortcut, getShortcuts]);

    const handleResetShortcut = useCallback(
        (shortcutId: string) => {
            resetShortcut(shortcutId);
            setShortcuts(getShortcuts());
        },
        [resetShortcut, getShortcuts]
    );

    const handleToggleShortcut = useCallback(
        (shortcutId: string, enabled: boolean) => {
            enableShortcut(shortcutId, enabled);
            setShortcuts(getShortcuts());
        },
        [enableShortcut, getShortcuts]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (!editingShortcut) return;

            event.preventDefault();
            event.stopPropagation();

            const parts: string[] = [];
            if (event.ctrlKey || event.metaKey) {
                parts.push(event.ctrlKey ? "Ctrl" : "Cmd");
            }
            if (event.altKey) parts.push("Alt");
            if (event.shiftKey) parts.push("Shift");

            let key = event.key;
            if (key === " ") key = "Space";
            if (key.startsWith("Arrow")) key = key.replace("Arrow", "");
            if (key.length === 1) key = key.toUpperCase();

            parts.push(key);
            const keyString = parts.join("+");

            setKeyInput(keyString);

            // Check for conflicts
            const conflicts = findConflicts(editingShortcut, [keyString]);
            if (conflicts.length > 0) {
                setConflictInfo({
                    shortcutId: editingShortcut,
                    conflicts,
                });
            } else {
                setConflictInfo(null);
            }
        },
        [editingShortcut, findConflicts]
    );

    const handleAddKey = useCallback(() => {
        if (keyInput && !editingKeys.includes(keyInput)) {
            setEditingKeys([...editingKeys, keyInput]);
            setKeyInput("");
        }
    }, [keyInput, editingKeys]);

    const handleRemoveKey = useCallback(
        (keyToRemove: string) => {
            setEditingKeys(editingKeys.filter((key) => key !== keyToRemove));
        },
        [editingKeys]
    );

    const handleApplyPreset = useCallback(
        (presetId: string) => {
            applyPreset(presetId);
            setSelectedPreset(presetId);
            setShortcuts(getShortcuts());
        },
        [applyPreset, getShortcuts]
    );

    const handleCreatePreset = useCallback(() => {
        if (newPresetName.trim()) {
            const presetId = createCustomPreset(newPresetName.trim(), newPresetDescription.trim());
            setPresets(getPresets());
            setSelectedPreset(presetId);
            setShowCreatePreset(false);
            setNewPresetName("");
            setNewPresetDescription("");
        }
    }, [newPresetName, newPresetDescription, createCustomPreset, getPresets]);

    const handleDeletePreset = useCallback(
        (presetId: string) => {
            if (presetId.startsWith("custom-")) {
                deleteCustomPreset(presetId);
                setPresets(getPresets());
                if (selectedPreset === presetId) {
                    setSelectedPreset("default");
                }
            }
        },
        [deleteCustomPreset, getPresets, selectedPreset]
    );

    const keyboardShortcutSettingsCn = cn("KeyboardShortcutSettings", className);

    return (
        <div className={keyboardShortcutSettingsCn}>
            <div className="header">
                <h2>Keyboard Shortcuts</h2>
                {onClose && (
                    <button className="close-button" onClick={onClose}>
                        ×
                    </button>
                )}
            </div>

            {/* Presets Section */}
            <div className="presets-section">
                <h3>Presets</h3>
                <div className="preset-controls">
                    <select
                        value={selectedPreset}
                        onChange={(e) => handleApplyPreset(e.target.value)}
                        className="preset-select">
                        {presets.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                                {preset.name} {preset.description && `- ${preset.description}`}
                            </option>
                        ))}
                    </select>
                    <button onClick={() => setShowCreatePreset(true)} className="create-preset-button">
                        Create Custom
                    </button>
                </div>

                {showCreatePreset && (
                    <div className="create-preset-form">
                        <input
                            type="text"
                            placeholder="Preset name"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="preset-name-input"
                        />
                        <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newPresetDescription}
                            onChange={(e) => setNewPresetDescription(e.target.value)}
                            className="preset-description-input"
                        />
                        <div className="create-preset-buttons">
                            <button onClick={handleCreatePreset} className="create-button">
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreatePreset(false);
                                    setNewPresetName("");
                                    setNewPresetDescription("");
                                }}
                                className="cancel-button">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Search and Filter */}
            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search shortcuts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-select">
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            {/* Shortcuts List */}
            <div className="shortcuts-list">
                <div className="shortcuts-header">
                    <div className="shortcut-name">Command</div>
                    <div className="shortcut-keys">Keys</div>
                    <div className="shortcut-actions">Actions</div>
                </div>

                {filteredShortcuts.map((shortcut) => (
                    <div
                        key={shortcut.id}
                        className={cn("shortcut-item", {
                            editing: editingShortcut === shortcut.id,
                            disabled: !shortcut.enabled,
                        })}>
                        <div className="shortcut-info">
                            <div className="shortcut-name">
                                <span className="name">{shortcut.name}</span>
                                <span className="description">{shortcut.description}</span>
                            </div>

                            {editingShortcut === shortcut.id ? (
                                <div className="shortcut-editor">
                                    <div className="current-keys">
                                        {editingKeys.map((key, index) => (
                                            <span key={index} className="key-tag">
                                                {getKeyDisplayString([key])}
                                                <button onClick={() => handleRemoveKey(key)} className="remove-key">
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <div className="key-input-section">
                                        <input
                                            type="text"
                                            placeholder="Press keys to add..."
                                            value={keyInput}
                                            onKeyDown={handleKeyDown}
                                            className="key-input"
                                            readOnly
                                        />
                                        {keyInput && (
                                            <button onClick={handleAddKey} className="add-key-button">
                                                Add
                                            </button>
                                        )}
                                    </div>

                                    {conflictInfo && (
                                        <div className="conflict-warning">
                                            Conflicts with: {conflictInfo.conflicts.join(", ")}
                                        </div>
                                    )}

                                    <div className="editor-actions">
                                        <button onClick={handleSaveShortcut} className="save-button">
                                            Save
                                        </button>
                                        <button onClick={handleCancelEdit} className="cancel-button">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="shortcut-keys">
                                    {getKeyDisplayString(shortcut.customKeys || shortcut.defaultKeys)}
                                </div>
                            )}
                        </div>

                        <div className="shortcut-actions">
                            <label className="enable-toggle">
                                <input
                                    type="checkbox"
                                    checked={shortcut.enabled}
                                    onChange={(e) => handleToggleShortcut(shortcut.id, e.target.checked)}
                                />
                                Enabled
                            </label>

                            {editingShortcut !== shortcut.id && (
                                <>
                                    <button onClick={() => handleEditShortcut(shortcut.id)} className="edit-button">
                                        Edit
                                    </button>
                                    {shortcut.customKeys && (
                                        <button
                                            onClick={() => handleResetShortcut(shortcut.id)}
                                            className="reset-button">
                                            Reset
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredShortcuts.length === 0 && (
                <div className="no-shortcuts">No shortcuts found matching your criteria.</div>
            )}
        </div>
    );
}
