import { useEditor } from "../../contexts/EditorContext";
import { Button } from "../ui/Button/Button";
import { Checkbox } from "../ui/Checkbox/Checkbox";
import { FormField } from "../ui/FormField/FormField";
import { Input } from "../ui/Input/Input";

import cn from "classnames";
import "./snapSettings.css";

export interface SnapSettingsProps {
    className?: string;
    onClose?: () => void;
}

/**
 * SnapSettings Component
 *
 * Provides comprehensive snap tolerance and behavior configuration:
 * - Grid snapping controls
 * - Smart guide snapping controls
 * - Manual guide snapping controls
 * - Tolerance and threshold settings
 * - Snap behavior preferences
 * - Visual feedback settings
 */
export function SnapSettings({ className, onClose }: SnapSettingsProps) {
    const {
        state,
        toggleSnapToGrid,
        toggleSmartGuides,
        setSmartGuidesOptions,
        toggleManualGuides,
        setManualGuidesOptions,
    } = useEditor();

    const { gridVisible, snapToGrid, gridSize, smartGuides, manualGuides } = state;

    const snapSettingsCn = cn("SnapSettings", className);

    const handleSmartGuideThresholdChange = (value: string) => {
        const threshold = parseInt(value);
        if (!isNaN(threshold) && threshold >= 1 && threshold <= 50) {
            setSmartGuidesOptions({ threshold });
        }
    };

    const handleManualGuideThresholdChange = (value: string) => {
        const threshold = parseInt(value);
        if (!isNaN(threshold) && threshold >= 1 && threshold <= 50) {
            setManualGuidesOptions({ snapThreshold: threshold });
        }
    };

    const handleResetToDefaults = () => {
        // Reset all snap settings to default values
        setSmartGuidesOptions({
            enabled: true,
            showGuides: true,
            snapToObjects: true,
            snapToEdges: true,
            snapToCenter: true,
            threshold: 5,
        });

        setManualGuidesOptions({
            enabled: true,
            snapToGuides: true,
            showGuides: true,
            snapThreshold: 5,
        });
    };

    return (
        <div className={snapSettingsCn}>
            <div className="snap-settings-header">
                <h3 className="snap-settings-title">Snap Settings</h3>
                <div className="snap-settings-header-actions">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleResetToDefaults}
                        className="snap-settings-reset">
                        Reset Defaults
                    </Button>
                    {onClose && (
                        <Button
                            variant="icon"
                            size="sm"
                            onClick={onClose}
                            className="snap-settings-close"
                            title="Close snap settings">
                            ×
                        </Button>
                    )}
                </div>
            </div>

            <div className="snap-settings-content">
                {/* Grid Snap Settings */}
                <div className="snap-settings-section">
                    <h4 className="snap-settings-section-title">Grid Snapping</h4>

                    <FormField inline>
                        <Checkbox
                            label="Snap to Grid"
                            checked={snapToGrid}
                            onChange={toggleSnapToGrid}
                            disabled={!gridVisible}
                        />
                    </FormField>

                    {snapToGrid && gridVisible && (
                        <div className="snap-settings-details">
                            <FormField label="Grid Size" inline>
                                <span className="snap-settings-value">{gridSize}px</span>
                            </FormField>
                            <p className="snap-settings-note">
                                Grid snap tolerance is automatically set to grid size. Adjust grid size in Grid Controls
                                to change snap precision.
                            </p>
                        </div>
                    )}
                </div>

                {/* Smart Guide Snap Settings */}
                <div className="snap-settings-section">
                    <h4 className="snap-settings-section-title">Smart Guide Snapping</h4>

                    <FormField inline>
                        <Checkbox
                            label="Enable Smart Guides"
                            checked={smartGuides.enabled}
                            onChange={toggleSmartGuides}
                        />
                    </FormField>

                    {smartGuides.enabled && (
                        <div className="snap-settings-details">
                            <FormField inline>
                                <Checkbox
                                    label="Show Guide Lines"
                                    checked={smartGuides.showGuides}
                                    onChange={(e) => setSmartGuidesOptions({ showGuides: e.target.checked })}
                                />
                            </FormField>

                            <FormField inline>
                                <Checkbox
                                    label="Snap to Object Edges"
                                    checked={smartGuides.snapToEdges}
                                    onChange={(e) => setSmartGuidesOptions({ snapToEdges: e.target.checked })}
                                />
                            </FormField>

                            <FormField inline>
                                <Checkbox
                                    label="Snap to Object Centers"
                                    checked={smartGuides.snapToCenter}
                                    onChange={(e) => setSmartGuidesOptions({ snapToCenter: e.target.checked })}
                                />
                            </FormField>

                            <FormField inline>
                                <Checkbox
                                    label="Snap to Other Objects"
                                    checked={smartGuides.snapToObjects}
                                    onChange={(e) => setSmartGuidesOptions({ snapToObjects: e.target.checked })}
                                />
                            </FormField>

                            <FormField label="Snap Threshold" inline>
                                <div className="snap-settings-threshold-control">
                                    <Input
                                        type="number"
                                        value={smartGuides.threshold.toString()}
                                        onChange={(e) => handleSmartGuideThresholdChange(e.target.value)}
                                        min="1"
                                        max="50"
                                        className="snap-settings-threshold-input"
                                    />
                                    <span className="snap-settings-unit">px</span>
                                </div>
                            </FormField>

                            <div className="snap-settings-threshold-slider">
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={smartGuides.threshold}
                                    onChange={(e) => setSmartGuidesOptions({ threshold: Number(e.target.value) })}
                                    className="threshold-slider"
                                />
                                <div className="slider-labels">
                                    <span>Precise (1px)</span>
                                    <span>Relaxed (50px)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual Guide Snap Settings */}
                <div className="snap-settings-section">
                    <h4 className="snap-settings-section-title">Manual Guide Snapping</h4>

                    <FormField inline>
                        <Checkbox
                            label="Enable Manual Guides"
                            checked={manualGuides.enabled}
                            onChange={toggleManualGuides}
                        />
                    </FormField>

                    {manualGuides.enabled && (
                        <div className="snap-settings-details">
                            <FormField inline>
                                <Checkbox
                                    label="Show Guides"
                                    checked={manualGuides.showGuides}
                                    onChange={(e) => setManualGuidesOptions({ showGuides: e.target.checked })}
                                />
                            </FormField>

                            <FormField inline>
                                <Checkbox
                                    label="Snap to Guides"
                                    checked={manualGuides.snapToGuides}
                                    onChange={(e) => setManualGuidesOptions({ snapToGuides: e.target.checked })}
                                />
                            </FormField>

                            <FormField label="Snap Threshold" inline>
                                <div className="snap-settings-threshold-control">
                                    <Input
                                        type="number"
                                        value={manualGuides.snapThreshold.toString()}
                                        onChange={(e) => handleManualGuideThresholdChange(e.target.value)}
                                        min="1"
                                        max="50"
                                        className="snap-settings-threshold-input"
                                    />
                                    <span className="snap-settings-unit">px</span>
                                </div>
                            </FormField>

                            <div className="snap-settings-threshold-slider">
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={manualGuides.snapThreshold}
                                    onChange={(e) => setManualGuidesOptions({ snapThreshold: Number(e.target.value) })}
                                    className="threshold-slider"
                                />
                                <div className="slider-labels">
                                    <span>Precise (1px)</span>
                                    <span>Relaxed (50px)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Snap Behavior Settings */}
                <div className="snap-settings-section">
                    <h4 className="snap-settings-section-title">Snap Behavior</h4>

                    <div className="snap-settings-behavior">
                        <div className="snap-settings-priority">
                            <h5>Snap Priority Order:</h5>
                            <ol className="snap-priority-list">
                                <li>Grid snapping (if enabled and visible)</li>
                                <li>Smart guide snapping (if enabled)</li>
                                <li>Manual guide snapping (if enabled)</li>
                            </ol>
                        </div>

                        <div className="snap-settings-shortcuts">
                            <h5>Keyboard Shortcuts:</h5>
                            <ul className="snap-shortcuts-list">
                                <li>
                                    <kbd>Ctrl</kbd> or <kbd>Cmd</kbd> - Temporarily disable all snapping
                                </li>
                                <li>
                                    <kbd>G</kbd> - Toggle grid visibility
                                </li>
                                <li>
                                    <kbd>Shift</kbd> + <kbd>G</kbd> - Toggle grid snapping
                                </li>
                            </ul>
                        </div>

                        <div className="snap-settings-feedback">
                            <h5>Visual Feedback:</h5>
                            <p className="snap-settings-description">
                                When snapping is active, guide lines and indicators will appear to show alignment
                                points. Guide opacity and color can be customized in the appearance settings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Current Status Summary */}
                <div className="snap-settings-section snap-settings-summary">
                    <h4 className="snap-settings-section-title">Current Status</h4>

                    <div className="snap-status-grid">
                        <div className="snap-status-item">
                            <span className="snap-status-label">Grid Snap:</span>
                            <span
                                className={cn("snap-status-value", {
                                    active: snapToGrid && gridVisible,
                                    inactive: !snapToGrid || !gridVisible,
                                })}>
                                {snapToGrid && gridVisible ? "Active" : "Inactive"}
                            </span>
                        </div>

                        <div className="snap-status-item">
                            <span className="snap-status-label">Smart Guides:</span>
                            <span
                                className={cn("snap-status-value", {
                                    active: smartGuides.enabled && smartGuides.snapToObjects,
                                    inactive: !smartGuides.enabled || !smartGuides.snapToObjects,
                                })}>
                                {smartGuides.enabled && smartGuides.snapToObjects ? "Active" : "Inactive"}
                            </span>
                        </div>

                        <div className="snap-status-item">
                            <span className="snap-status-label">Manual Guides:</span>
                            <span
                                className={cn("snap-status-value", {
                                    active: manualGuides.enabled && manualGuides.snapToGuides,
                                    inactive: !manualGuides.enabled || !manualGuides.snapToGuides,
                                })}>
                                {manualGuides.enabled && manualGuides.snapToGuides ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
