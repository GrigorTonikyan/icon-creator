/**
 * PluginPanel Component - Stage 12 Step 7
 *
 * Comprehensive plugin management interface providing:
 * - Plugin discovery and installation from URLs/files
 * - Plugin enable/disable controls with status indicators
 * - Plugin configuration and permissions management
 * - Plugin details, information, and error reporting
 * - Search, filtering, and categorization of plugins
 * - Integration with PluginManager for all operations
 */

import React, { useState, useMemo, useEffect } from "react";
import { useEditor } from "../../contexts/EditorContext";
import type {
    Plugin,
    PluginManifest,
    PluginInstance,
    PluginPermission,
    PluginCategory,
    PluginError,
} from "../../types/editor";
import cn from "classnames";
import "./pluginPanel.css";
import "./pluginPanel.css";

interface PluginPanelProps {
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
    pluginManager?: any; // PluginManager instance
}

interface PluginInstallData {
    source: string;
    type: "url" | "file";
    file?: File;
}

interface PluginFilters {
    category?: PluginCategory;
    enabled?: boolean;
    search: string;
    permissions?: PluginPermission[];
}

export function PluginPanel({ className, isOpen = false, onClose, pluginManager }: PluginPanelProps) {
    // State management
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [errors, setErrors] = useState<PluginError[]>([]);
    const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
    const [showInstallDialog, setShowInstallDialog] = useState(false);
    const [installData, setInstallData] = useState<PluginInstallData>({ source: "", type: "url" });
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<PluginFilters>({
        search: "",
        enabled: undefined,
        category: undefined,
        permissions: undefined,
    });

    // Plugin categories for filtering
    const categories: PluginCategory[] = ["tool", "effect", "exporter", "importer", "ui", "utility", "integration"];

    // Permission labels for display
    const permissionLabels: Record<PluginPermission, string> = {
        "canvas:read": "Read Canvas",
        "canvas:write": "Modify Canvas",
        "objects:read": "Read Objects",
        "objects:write": "Modify Objects",
        "files:read": "Read Files",
        "files:write": "Write Files",
        "ui:create": "Create UI",
        "ui:modify": "Modify UI",
        "storage:read": "Read Storage",
        "storage:write": "Write Storage",
        "network:request": "Network Access",
        "system:notifications": "System Notifications",
    };

    // Load plugins from PluginManager
    useEffect(() => {
        if (pluginManager && isOpen) {
            loadPluginsData();
        }
    }, [pluginManager, isOpen]);

    const loadPluginsData = async () => {
        if (!pluginManager) return;

        try {
            const pluginList = pluginManager.getPlugins();
            setPlugins(pluginList);

            const state = pluginManager.getState();
            setErrors(state.errors || []);
        } catch (error) {
            console.error("Failed to load plugins:", error);
        }
    };

    // Filter plugins based on current filters
    const filteredPlugins = useMemo(() => {
        return plugins.filter((plugin) => {
            // Search filter
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matchesName = plugin.manifest.name.toLowerCase().includes(search);
                const matchesDescription = plugin.manifest.description?.toLowerCase().includes(search);
                const matchesAuthor = plugin.manifest.author.toLowerCase().includes(search);
                const matchesKeywords = plugin.manifest.keywords?.some((keyword) =>
                    keyword.toLowerCase().includes(search)
                );

                if (!(matchesName || matchesDescription || matchesAuthor || matchesKeywords)) {
                    return false;
                }
            }

            // Category filter
            if (filters.category && plugin.manifest.category !== filters.category) {
                return false;
            }

            // Enabled filter
            if (filters.enabled !== undefined && plugin.isEnabled !== filters.enabled) {
                return false;
            }

            // Permission filter
            if (filters.permissions && filters.permissions.length > 0) {
                const hasPermissions = filters.permissions.every((permission) =>
                    plugin.manifest.permissions.includes(permission)
                );
                if (!hasPermissions) {
                    return false;
                }
            }

            return true;
        });
    }, [plugins, filters]);

    // Plugin installation
    const handleInstallPlugin = async () => {
        if (!pluginManager || !installData.source.trim()) return;

        setIsLoading(true);
        try {
            const source = installData.type === "file" && installData.file ? installData.file : installData.source;

            await pluginManager.loadPlugin(source, true);
            setShowInstallDialog(false);
            setInstallData({ source: "", type: "url" });
            await loadPluginsData();
        } catch (error) {
            console.error("Plugin installation failed:", error);
            // Error will be added to the errors list automatically
            await loadPluginsData();
        } finally {
            setIsLoading(false);
        }
    };

    // Plugin enable/disable
    const handleTogglePlugin = async (pluginId: string, enable: boolean) => {
        if (!pluginManager) return;

        try {
            if (enable) {
                await pluginManager.enablePlugin(pluginId);
            } else {
                await pluginManager.disablePlugin(pluginId);
            }
            await loadPluginsData();
        } catch (error) {
            console.error(`Failed to ${enable ? "enable" : "disable"} plugin:`, error);
        }
    };

    // Plugin uninstall
    const handleUninstallPlugin = async (pluginId: string) => {
        if (!pluginManager) return;

        if (!confirm("Are you sure you want to uninstall this plugin?")) {
            return;
        }

        try {
            await pluginManager.unloadPlugin(pluginId);
            setSelectedPlugin(null);
            await loadPluginsData();
        } catch (error) {
            console.error("Failed to uninstall plugin:", error);
        }
    };

    // Clear plugin errors
    const handleClearErrors = (pluginId?: string) => {
        if (!pluginManager) return;

        // This would require a method in PluginManager
        // For now, just reload data
        loadPluginsData();
    };

    // File upload handler
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setInstallData({
                source: file.name,
                type: "file",
                file: file,
            });
        }
    };

    const pluginPanelCn = cn("PluginPanel", className, {
        open: isOpen,
    });

    const pluginErrors = errors.filter((error) => !selectedPlugin || error.pluginId === selectedPlugin.manifest.id);

    if (!isOpen) {
        return null;
    }

    return (
        <div className={pluginPanelCn}>
            <div className="PluginPanel-header">
                <h2>Plugin Manager</h2>
                <div className="PluginPanel-actions">
                    <button
                        className="PluginPanel-installBtn"
                        onClick={() => setShowInstallDialog(true)}
                        title="Install new plugin">
                        + Install Plugin
                    </button>
                    <button className="PluginPanel-closeBtn" onClick={onClose} title="Close panel">
                        ×
                    </button>
                </div>
            </div>

            <div className="PluginPanel-content">
                {/* Search and Filters */}
                <div className="PluginPanel-filters">
                    <input
                        type="text"
                        placeholder="Search plugins..."
                        value={filters.search}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                        className="PluginPanel-searchInput"
                    />

                    <div className="PluginPanel-filterRow">
                        <select
                            value={filters.category || ""}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    category: (e.target.value as PluginCategory) || undefined,
                                }))
                            }
                            className="PluginPanel-categoryFilter">
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.enabled === undefined ? "" : String(filters.enabled)}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    enabled: e.target.value === "" ? undefined : e.target.value === "true",
                                }))
                            }
                            className="PluginPanel-statusFilter">
                            <option value="">All Status</option>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
                </div>

                {/* Plugin List and Details */}
                <div className="PluginPanel-body">
                    <div className="PluginPanel-list">
                        <div className="PluginPanel-listHeader">
                            <h3>Installed Plugins ({filteredPlugins.length})</h3>
                        </div>

                        {filteredPlugins.length === 0 ? (
                            <div className="PluginPanel-empty">
                                {plugins.length === 0
                                    ? "No plugins installed. Install your first plugin to get started."
                                    : "No plugins match your filters."}
                            </div>
                        ) : (
                            <div className="PluginPanel-pluginList">
                                {filteredPlugins.map((plugin) => (
                                    <PluginCard
                                        key={plugin.manifest.id}
                                        plugin={plugin}
                                        isSelected={selectedPlugin?.manifest.id === plugin.manifest.id}
                                        onSelect={() => setSelectedPlugin(plugin)}
                                        onToggle={(enable) => handleTogglePlugin(plugin.manifest.id, enable)}
                                        errors={errors.filter((e) => e.pluginId === plugin.manifest.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Plugin Details Panel */}
                    {selectedPlugin && (
                        <div className="PluginPanel-details">
                            <PluginDetails
                                plugin={selectedPlugin}
                                errors={pluginErrors}
                                onUninstall={() => handleUninstallPlugin(selectedPlugin.manifest.id)}
                                onClearErrors={() => handleClearErrors(selectedPlugin.manifest.id)}
                                permissionLabels={permissionLabels}
                            />
                        </div>
                    )}
                </div>

                {/* Errors Summary */}
                {errors.length > 0 && !selectedPlugin && (
                    <div className="PluginPanel-errors">
                        <div className="PluginPanel-errorsHeader">
                            <h3>Plugin Errors ({errors.length})</h3>
                            <button onClick={() => handleClearErrors()}>Clear All</button>
                        </div>
                        <div className="PluginPanel-errorsList">
                            {errors.slice(0, 5).map((error, index) => (
                                <div key={index} className="PluginPanel-error">
                                    <span className="PluginPanel-errorPlugin">{error.pluginId}</span>
                                    <span className="PluginPanel-errorMessage">{error.error}</span>
                                    <span className="PluginPanel-errorTime">
                                        {new Date(error.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                            {errors.length > 5 && (
                                <div className="PluginPanel-errorMore">+{errors.length - 5} more errors</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Install Plugin Dialog */}
            {showInstallDialog && (
                <div className="PluginPanel-overlay">
                    <div className="PluginPanel-dialog">
                        <div className="PluginPanel-dialogHeader">
                            <h3>Install Plugin</h3>
                            <button onClick={() => setShowInstallDialog(false)}>×</button>
                        </div>

                        <div className="PluginPanel-dialogBody">
                            <div className="PluginPanel-installOptions">
                                <label className="PluginPanel-radioOption">
                                    <input
                                        type="radio"
                                        name="installType"
                                        checked={installData.type === "url"}
                                        onChange={() => setInstallData((prev) => ({ ...prev, type: "url" }))}
                                    />
                                    <span>Install from URL</span>
                                </label>

                                <label className="PluginPanel-radioOption">
                                    <input
                                        type="radio"
                                        name="installType"
                                        checked={installData.type === "file"}
                                        onChange={() => setInstallData((prev) => ({ ...prev, type: "file" }))}
                                    />
                                    <span>Upload plugin file</span>
                                </label>
                            </div>

                            {installData.type === "url" ? (
                                <input
                                    type="url"
                                    placeholder="https://example.com/plugin.js"
                                    value={installData.source}
                                    onChange={(e) =>
                                        setInstallData((prev) => ({
                                            ...prev,
                                            source: e.target.value,
                                        }))
                                    }
                                    className="PluginPanel-urlInput"
                                />
                            ) : (
                                <input
                                    type="file"
                                    accept=".js,.ts"
                                    onChange={handleFileUpload}
                                    className="PluginPanel-fileInput"
                                />
                            )}
                        </div>

                        <div className="PluginPanel-dialogActions">
                            <button onClick={() => setShowInstallDialog(false)} disabled={isLoading}>
                                Cancel
                            </button>
                            <button
                                onClick={handleInstallPlugin}
                                disabled={isLoading || !installData.source.trim()}
                                className="PluginPanel-primaryBtn">
                                {isLoading ? "Installing..." : "Install Plugin"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Plugin Card Component
interface PluginCardProps {
    plugin: Plugin;
    isSelected: boolean;
    onSelect: () => void;
    onToggle: (enable: boolean) => void;
    errors: PluginError[];
}

function PluginCard({ plugin, isSelected, onSelect, onToggle, errors }: PluginCardProps) {
    const { manifest, isEnabled, isLoaded } = plugin;
    const hasErrors = errors.length > 0;

    const cardCn = cn("PluginCard", {
        selected: isSelected,
        enabled: isEnabled,
        disabled: !isEnabled,
        loading: !isLoaded,
        error: hasErrors,
    });

    return (
        <div className={cardCn} onClick={onSelect}>
            <div className="PluginCard-header">
                <h4 className="PluginCard-name">{manifest.name}</h4>
                <div className="PluginCard-version">v{manifest.version}</div>
            </div>

            <div className="PluginCard-info">
                <p className="PluginCard-description">{manifest.description}</p>
                <div className="PluginCard-meta">
                    <span className="PluginCard-author">by {manifest.author}</span>
                    <span className="PluginCard-category">{manifest.category}</span>
                </div>
            </div>

            <div className="PluginCard-status">
                <div className="PluginCard-indicators">
                    {hasErrors && (
                        <span className="PluginCard-errorBadge" title={`${errors.length} error(s)`}>
                            ⚠ {errors.length}
                        </span>
                    )}
                    <span
                        className={cn("PluginCard-statusBadge", {
                            enabled: isEnabled,
                            disabled: !isEnabled,
                        })}>
                        {isEnabled ? "Enabled" : "Disabled"}
                    </span>
                </div>

                <label className="PluginCard-toggle" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => onToggle(e.target.checked)}
                        disabled={!isLoaded}
                    />
                    <span className="PluginCard-toggleSlider"></span>
                </label>
            </div>
        </div>
    );
}

// Plugin Details Component
interface PluginDetailsProps {
    plugin: Plugin;
    errors: PluginError[];
    onUninstall: () => void;
    onClearErrors: () => void;
    permissionLabels: Record<PluginPermission, string>;
}

function PluginDetails({ plugin, errors, onUninstall, onClearErrors, permissionLabels }: PluginDetailsProps) {
    const { manifest } = plugin;

    return (
        <div className="PluginDetails">
            <div className="PluginDetails-header">
                <h3>{manifest.name}</h3>
                <button className="PluginDetails-uninstallBtn" onClick={onUninstall} title="Uninstall plugin">
                    Uninstall
                </button>
            </div>

            <div className="PluginDetails-content">
                {/* Basic Information */}
                <section className="PluginDetails-section">
                    <h4>Information</h4>
                    <dl className="PluginDetails-infoList">
                        <dt>Version</dt>
                        <dd>{manifest.version}</dd>
                        <dt>Author</dt>
                        <dd>{manifest.author}</dd>
                        <dt>Category</dt>
                        <dd>{manifest.category}</dd>
                        <dt>Description</dt>
                        <dd>{manifest.description}</dd>
                        {manifest.homepage && (
                            <>
                                <dt>Homepage</dt>
                                <dd>
                                    <a href={manifest.homepage} target="_blank" rel="noopener noreferrer">
                                        {manifest.homepage}
                                    </a>
                                </dd>
                            </>
                        )}
                    </dl>
                </section>

                {/* Keywords */}
                {manifest.keywords && manifest.keywords.length > 0 && (
                    <section className="PluginDetails-section">
                        <h4>Keywords</h4>
                        <div className="PluginDetails-tags">
                            {manifest.keywords.map((keyword) => (
                                <span key={keyword} className="PluginDetails-tag">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Permissions */}
                <section className="PluginDetails-section">
                    <h4>Permissions</h4>
                    <div className="PluginDetails-permissions">
                        {manifest.permissions.map((permission) => (
                            <div key={permission} className="PluginDetails-permission">
                                <span className="PluginDetails-permissionName">
                                    {permissionLabels[permission] || permission}
                                </span>
                                <span className="PluginDetails-permissionCode">{permission}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Dependencies */}
                {manifest.dependencies && manifest.dependencies.length > 0 && (
                    <section className="PluginDetails-section">
                        <h4>Dependencies</h4>
                        <div className="PluginDetails-dependencies">
                            {manifest.dependencies.map((dep) => (
                                <div key={dep.id} className="PluginDetails-dependency">
                                    <span className="PluginDetails-dependencyName">{dep.id}</span>
                                    <span className="PluginDetails-dependencyVersion">{dep.version}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Extension Points */}
                {manifest.extensionPoints && manifest.extensionPoints.length > 0 && (
                    <section className="PluginDetails-section">
                        <h4>Extension Points</h4>
                        <div className="PluginDetails-extensionPoints">
                            {manifest.extensionPoints.map((epId) => (
                                <span key={epId} className="PluginDetails-extensionPoint">
                                    {epId}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Status */}
                <section className="PluginDetails-section">
                    <h4>Status</h4>
                    <dl className="PluginDetails-statusList">
                        <dt>Loaded</dt>
                        <dd>{plugin.isLoaded ? "Yes" : "No"}</dd>
                        <dt>Enabled</dt>
                        <dd>{plugin.isEnabled ? "Yes" : "No"}</dd>
                        <dt>Loaded At</dt>
                        <dd>{plugin.loadedAt ? new Date(plugin.loadedAt).toLocaleString() : "Unknown"}</dd>
                        {plugin.enabledAt && (
                            <>
                                <dt>Enabled At</dt>
                                <dd>{new Date(plugin.enabledAt).toLocaleString()}</dd>
                            </>
                        )}
                    </dl>
                </section>

                {/* Errors */}
                {errors.length > 0 && (
                    <section className="PluginDetails-section">
                        <div className="PluginDetails-sectionHeader">
                            <h4>Errors ({errors.length})</h4>
                            <button onClick={onClearErrors}>Clear</button>
                        </div>
                        <div className="PluginDetails-errors">
                            {errors.map((error, index) => (
                                <div key={index} className="PluginDetails-error">
                                    <div className="PluginDetails-errorMessage">{error.error}</div>
                                    <div className="PluginDetails-errorTime">
                                        {new Date(error.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
