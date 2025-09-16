import { useEffect, useState } from "react";
import { EXPORT_TEMPLATES, type ExportOptions, type ExportTemplate } from "../../utils";
import { ExportPreview } from "../ExportPreview";
import { Button } from "../ui";

import cn from "classnames";
import "./exportControls.css";

const EXPORT_SETTINGS_KEY = "icon-creator-export-settings";

// Helper functions for localStorage
function loadExportSettings(): ExportOptions {
    try {
        const stored = localStorage.getItem(EXPORT_SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle missing keys in stored settings
            return {
                format: "svg",
                width: 512,
                height: 512,
                scale: 1,
                quality: 0.9,
                includeMetadata: true,
                optimizeSvg: true,
                ...parsed,
            };
        }
    } catch (error) {
        console.warn("Failed to load export settings from localStorage:", error);
    }

    // Return defaults if no settings or parsing failed
    return {
        format: "svg",
        width: 512,
        height: 512,
        scale: 1,
        quality: 0.9,
        includeMetadata: true,
        optimizeSvg: true,
    };
}

function saveExportSettings(settings: ExportOptions): void {
    try {
        localStorage.setItem(EXPORT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn("Failed to save export settings to localStorage:", error);
    }
}

interface ExportControlsProps {
    svgElement?: SVGElement | null;
    onExport: (options: ExportOptions) => void;
    onBatchExport?: (templates: ExportTemplate[]) => void;
    className?: string;
}

export function ExportControls({ svgElement, onExport, onBatchExport, className }: ExportControlsProps) {
    const [exportOptions, setExportOptions] = useState<ExportOptions>(() => loadExportSettings());
    const [settingsSaved, setSettingsSaved] = useState(false);

    // Save settings whenever they change
    useEffect(() => {
        saveExportSettings(exportOptions);
        setSettingsSaved(true);

        // Clear the saved indicator after a short delay
        const timer = setTimeout(() => setSettingsSaved(false), 1000);
        return () => clearTimeout(timer);
    }, [exportOptions]);

    const handleOptionChange = (key: keyof ExportOptions, value: any) => {
        setExportOptions((prev: ExportOptions) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleExport = () => {
        onExport(exportOptions);
    };

    const handleTemplateApply = (template: ExportTemplate) => {
        // Apply template options to current settings
        setExportOptions((prev) => ({
            ...prev,
            ...template.options,
        }));
    };

    const handleTemplateExport = (template: ExportTemplate) => {
        // If template has multiple sizes, trigger batch export
        if (template.sizes && template.sizes.length > 0 && onBatchExport) {
            onBatchExport([template]);
        } else {
            // Single export with template options
            onExport(template.options);
        }
    };

    const handleResetSettings = () => {
        const defaultSettings: ExportOptions = {
            format: "svg",
            width: 512,
            height: 512,
            scale: 1,
            quality: 0.9,
            includeMetadata: true,
            optimizeSvg: true,
        };
        setExportOptions(defaultSettings);
    };

    const exportControlsCn = cn("ExportControls", className);

    return (
        <div className={exportControlsCn}>
            <div className="ExportControls__header">
                <h3 className="ExportControls__title">Export Settings</h3>
                <div className="ExportControls__header-actions">
                    {settingsSaved && <span className="ExportControls__saved-indicator">✓ Saved</span>}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleResetSettings}
                        className="ExportControls__reset-btn">
                        Reset to Defaults
                    </Button>
                </div>
            </div>

            <div className="ExportControls__section">
                <label className="ExportControls__label">
                    Format
                    <select
                        className="ExportControls__select"
                        value={exportOptions.format}
                        onChange={(e) => handleOptionChange("format", e.target.value as "svg" | "png" | "json")}>
                        <option value="svg">SVG (Vector)</option>
                        <option value="png">PNG (Raster)</option>
                        <option value="json">JSON (Project)</option>
                    </select>
                </label>
            </div>

            <div className="ExportControls__section">
                <div className="ExportControls__row">
                    <label className="ExportControls__label">
                        Width (px)
                        <input
                            type="number"
                            className="ExportControls__input"
                            value={exportOptions.width || 512}
                            min="16"
                            max="4096"
                            step="1"
                            onChange={(e) => handleOptionChange("width", parseInt(e.target.value))}
                        />
                    </label>
                    <label className="ExportControls__label">
                        Height (px)
                        <input
                            type="number"
                            className="ExportControls__input"
                            value={exportOptions.height || 512}
                            min="16"
                            max="4096"
                            step="1"
                            onChange={(e) => handleOptionChange("height", parseInt(e.target.value))}
                        />
                    </label>
                </div>
            </div>

            <div className="ExportControls__section">
                <label className="ExportControls__label">
                    Scale Factor
                    <input
                        type="number"
                        className="ExportControls__input"
                        value={exportOptions.scale || 1}
                        min="0.1"
                        max="5"
                        step="0.1"
                        onChange={(e) => handleOptionChange("scale", parseFloat(e.target.value))}
                    />
                </label>
                <div className="ExportControls__info">
                    Final size: {Math.round((exportOptions.width || 512) * (exportOptions.scale || 1))} ×{" "}
                    {Math.round((exportOptions.height || 512) * (exportOptions.scale || 1))} px
                </div>
            </div>

            {exportOptions.format === "png" && (
                <div className="ExportControls__section">
                    <label className="ExportControls__label">
                        PNG Quality
                        <input
                            type="range"
                            className="ExportControls__range"
                            value={exportOptions.quality || 0.9}
                            min="0.1"
                            max="1"
                            step="0.1"
                            onChange={(e) => handleOptionChange("quality", parseFloat(e.target.value))}
                        />
                        <span className="ExportControls__value">
                            {Math.round((exportOptions.quality || 0.9) * 100)}%
                        </span>
                    </label>
                </div>
            )}

            <div className="ExportControls__section">
                <div className="ExportControls__checkboxes">
                    <label className="ExportControls__checkbox">
                        <input
                            type="checkbox"
                            checked={exportOptions.includeMetadata || false}
                            onChange={(e) => handleOptionChange("includeMetadata", e.target.checked)}
                        />
                        Include metadata
                    </label>

                    {exportOptions.format === "svg" && (
                        <label className="ExportControls__checkbox">
                            <input
                                type="checkbox"
                                checked={exportOptions.optimizeSvg || false}
                                onChange={(e) => handleOptionChange("optimizeSvg", e.target.checked)}
                            />
                            Optimize SVG
                        </label>
                    )}
                </div>
            </div>

            <div className="ExportControls__actions">
                <Button onClick={handleExport} className="ExportControls__export-btn">
                    Export {exportOptions.format.toUpperCase()}
                </Button>
            </div>

            <div className="ExportControls__preview-section">
                <ExportPreview svgElement={svgElement || null} exportOptions={exportOptions} />
            </div>

            <div className="ExportControls__presets">
                <h4 className="ExportControls__presets-title">Quick Sizes</h4>
                <div className="ExportControls__preset-buttons">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            handleOptionChange("width", 16);
                            handleOptionChange("height", 16);
                            handleOptionChange("scale", 1);
                        }}>
                        16×16
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            handleOptionChange("width", 32);
                            handleOptionChange("height", 32);
                            handleOptionChange("scale", 1);
                        }}>
                        32×32
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            handleOptionChange("width", 64);
                            handleOptionChange("height", 64);
                            handleOptionChange("scale", 1);
                        }}>
                        64×64
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            handleOptionChange("width", 128);
                            handleOptionChange("height", 128);
                            handleOptionChange("scale", 1);
                        }}>
                        128×128
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            handleOptionChange("width", 256);
                            handleOptionChange("height", 256);
                            handleOptionChange("scale", 1);
                        }}>
                        256×256
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            handleOptionChange("width", 512);
                            handleOptionChange("height", 512);
                            handleOptionChange("scale", 1);
                        }}>
                        512×512
                    </Button>
                </div>
            </div>

            <div className="ExportControls__templates">
                <h4 className="ExportControls__templates-title">Export Templates</h4>
                {EXPORT_TEMPLATES.map((template) => (
                    <div key={template.id} className="ExportControls__template">
                        <div className="ExportControls__template-info">
                            <h5 className="ExportControls__template-name">{template.name}</h5>
                            <div className="ExportControls__template-details">
                                <span className="ExportControls__template-format">
                                    {template.options.format.toUpperCase()}
                                </span>
                                {template.sizes && (
                                    <span className="ExportControls__template-sizes">
                                        {template.sizes.length} sizes
                                    </span>
                                )}
                            </div>
                            {template.sizes && (
                                <div className="ExportControls__template-size-list">
                                    {template.sizes.map((size, index) => (
                                        <span key={index} className="ExportControls__template-size">
                                            {size.width}×{size.height}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="ExportControls__template-actions">
                            <Button variant="secondary" size="sm" onClick={() => handleTemplateApply(template)}>
                                Apply
                            </Button>
                            <Button size="sm" onClick={() => handleTemplateExport(template)}>
                                Export
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
