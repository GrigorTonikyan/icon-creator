import React, { useState, useEffect, useMemo } from "react";
import cn from "classnames";
import type { ShapeGenerator, ShapeParameter, ShapePreset, Point } from "../../types/editor";
import { shapeLibrary } from "../../utils/ShapeLibrary";
import "./customShapePanel.css";

interface CustomShapePanelProps {
    onShapeGenerated: (pathData: string, style: any, metadata?: any) => void;
    onError: (error: string) => void;
    className?: string;
}

interface ParameterControlProps {
    parameter: ShapeParameter;
    value: any;
    onChange: (value: any) => void;
}

const ParameterControl: React.FC<ParameterControlProps> = ({ parameter, value, onChange }) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { type } = parameter;
        let newValue: any = event.target.value;

        if (type === "number" || type === "range") {
            newValue = parseFloat(newValue);
            if (isNaN(newValue)) newValue = parameter.value;
        } else if (type === "boolean") {
            newValue = (event.target as HTMLInputElement).checked;
        }

        onChange(newValue);
    };

    const inputId = `param-${parameter.id}`;

    switch (parameter.type) {
        case "number":
            return (
                <div className="parameter-control">
                    <label htmlFor={inputId} className="parameter-label">
                        {parameter.name}
                        {parameter.description && (
                            <span className="parameter-description" title={parameter.description}>
                                ℹ️
                            </span>
                        )}
                    </label>
                    <input
                        id={inputId}
                        type="number"
                        value={value || parameter.value}
                        min={parameter.min}
                        max={parameter.max}
                        step={parameter.step || 1}
                        onChange={handleChange}
                        className="parameter-input"
                    />
                </div>
            );

        case "range":
            return (
                <div className="parameter-control">
                    <label htmlFor={inputId} className="parameter-label">
                        {parameter.name}: {value || parameter.value}
                        {parameter.description && (
                            <span className="parameter-description" title={parameter.description}>
                                ℹ️
                            </span>
                        )}
                    </label>
                    <input
                        id={inputId}
                        type="range"
                        value={value || parameter.value}
                        min={parameter.min}
                        max={parameter.max}
                        step={parameter.step || 1}
                        onChange={handleChange}
                        className="parameter-range"
                    />
                </div>
            );

        case "boolean":
            return (
                <div className="parameter-control parameter-control--checkbox">
                    <label htmlFor={inputId} className="parameter-label parameter-label--checkbox">
                        <input
                            id={inputId}
                            type="checkbox"
                            checked={value !== undefined ? value : parameter.value}
                            onChange={handleChange}
                            className="parameter-checkbox"
                        />
                        {parameter.name}
                        {parameter.description && (
                            <span className="parameter-description" title={parameter.description}>
                                ℹ️
                            </span>
                        )}
                    </label>
                </div>
            );

        case "color":
            return (
                <div className="parameter-control">
                    <label htmlFor={inputId} className="parameter-label">
                        {parameter.name}
                        {parameter.description && (
                            <span className="parameter-description" title={parameter.description}>
                                ℹ️
                            </span>
                        )}
                    </label>
                    <input
                        id={inputId}
                        type="color"
                        value={value || parameter.value}
                        onChange={handleChange}
                        className="parameter-color"
                    />
                </div>
            );

        case "select":
            return (
                <div className="parameter-control">
                    <label htmlFor={inputId} className="parameter-label">
                        {parameter.name}
                        {parameter.description && (
                            <span className="parameter-description" title={parameter.description}>
                                ℹ️
                            </span>
                        )}
                    </label>
                    <select
                        id={inputId}
                        value={value || parameter.value}
                        onChange={handleChange}
                        className="parameter-select">
                        {parameter.options?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            );

        default:
            return null;
    }
};

export const CustomShapePanel: React.FC<CustomShapePanelProps> = ({ onShapeGenerated, onError, className }) => {
    const [state, setState] = useState(shapeLibrary.getState());
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [showFavorites, setShowFavorites] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewSvg, setPreviewSvg] = useState<string>("");
    const [showPresets, setShowPresets] = useState(false);

    // Update state when shape library changes
    useEffect(() => {
        const updateState = () => setState(shapeLibrary.getState());

        // In a real implementation, this would be connected to a state management system
        // For now, we'll manually sync on mount and use a simple interval
        updateState();

        const interval = setInterval(updateState, 1000);
        return () => clearInterval(interval);
    }, []);

    // Filter generators based on search, category, and other filters
    const filteredGenerators = useMemo(() => {
        let generators = Object.values(state.generators);

        if (showFavorites) {
            generators = generators.filter((gen) => state.favorites.includes(gen.config.id));
        } else if (showRecent) {
            generators = state.lastUsed.map((id) => state.generators[id]).filter(Boolean);
        } else {
            if (searchQuery) {
                generators = shapeLibrary.searchGenerators(searchQuery);
            }
            if (selectedCategory) {
                generators = generators.filter((gen) => gen.config.category === selectedCategory);
            }
        }

        return generators;
    }, [state, searchQuery, selectedCategory, showFavorites, showRecent]);

    const activeGenerator = state.activeGenerator ? state.generators[state.activeGenerator] : null;
    const currentParameters = state.activeGenerator ? state.parameterValues[state.activeGenerator] || {} : {};

    // Generate preview when parameters change
    useEffect(() => {
        if (activeGenerator && state.previewMode) {
            generatePreview();
        }
    }, [activeGenerator, currentParameters, state.previewMode]);

    const generatePreview = async () => {
        if (!activeGenerator) return;

        try {
            const result = shapeLibrary.generateShape(activeGenerator.config.id, currentParameters);
            if (result.success && result.shape) {
                setPreviewSvg(result.shape.pathData);
            } else {
                setPreviewSvg("");
                if (result.error) {
                    onError(result.error);
                }
            }
        } catch (error) {
            setPreviewSvg("");
            onError(error instanceof Error ? error.message : "Preview generation failed");
        }
    };

    const handleGeneratorSelect = (generator: ShapeGenerator) => {
        shapeLibrary.setActiveGenerator(generator.config.id);
        setState(shapeLibrary.getState());
    };

    const handleParameterChange = (parameterId: string, value: any) => {
        if (!state.activeGenerator) return;

        shapeLibrary.updateParameters(state.activeGenerator, { [parameterId]: value });
        setState(shapeLibrary.getState());
    };

    const handleGenerateShape = async () => {
        if (!activeGenerator) return;

        setIsGenerating(true);
        try {
            const result = shapeLibrary.generateShape(activeGenerator.config.id, currentParameters);
            if (result.success && result.shape) {
                onShapeGenerated(result.shape.pathData, result.shape.style, result.shape.metadata);
            } else {
                onError(result.error || "Shape generation failed");
            }
        } catch (error) {
            onError(error instanceof Error ? error.message : "Shape generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePresetApply = (preset: ShapePreset) => {
        if (!state.activeGenerator) return;

        shapeLibrary.applyPreset(state.activeGenerator, preset.id);
        setState(shapeLibrary.getState());
        setShowPresets(false);
    };

    const handleResetParameters = () => {
        if (!state.activeGenerator) return;

        shapeLibrary.resetParameters(state.activeGenerator);
        setState(shapeLibrary.getState());
    };

    const handleToggleFavorite = (generatorId: string) => {
        if (state.favorites.includes(generatorId)) {
            shapeLibrary.removeFromFavorites(generatorId);
        } else {
            shapeLibrary.addToFavorites(generatorId);
        }
        setState(shapeLibrary.getState());
    };

    const handleTogglePreview = () => {
        shapeLibrary.setPreviewMode(!state.previewMode);
        setState(shapeLibrary.getState());
    };

    // Group parameters by category
    const groupedParameters = useMemo(() => {
        if (!activeGenerator) return {};

        const grouped: Record<string, ShapeParameter[]> = {};
        activeGenerator.config.parameters.forEach((param) => {
            const category = param.category || "General";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(param);
        });

        return grouped;
    }, [activeGenerator]);

    return (
        <div className={cn("custom-shape-panel", className)}>
            <div className="custom-shape-panel__header">
                <h3 className="custom-shape-panel__title">Custom Shapes</h3>
                <div className="custom-shape-panel__controls">
                    <button
                        className={cn("custom-shape-panel__toggle-btn", {
                            "custom-shape-panel__toggle-btn--active": state.previewMode,
                        })}
                        onClick={handleTogglePreview}
                        title="Toggle live preview">
                        👁️
                    </button>
                </div>
            </div>

            <div className="custom-shape-panel__content">
                {/* Generator Library */}
                <div className="custom-shape-panel__library">
                    {/* Search and Filters */}
                    <div className="custom-shape-panel__filters">
                        <input
                            type="text"
                            placeholder="Search shapes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="custom-shape-panel__search"
                        />

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="custom-shape-panel__category-select">
                            <option value="">All Categories</option>
                            {state.categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Toggles */}
                    <div className="custom-shape-panel__filter-toggles">
                        <button
                            className={cn("custom-shape-panel__filter-btn", {
                                "custom-shape-panel__filter-btn--active": showFavorites,
                            })}
                            onClick={() => {
                                setShowFavorites(!showFavorites);
                                setShowRecent(false);
                            }}>
                            ⭐ Favorites ({state.favorites.length})
                        </button>
                        <button
                            className={cn("custom-shape-panel__filter-btn", {
                                "custom-shape-panel__filter-btn--active": showRecent,
                            })}
                            onClick={() => {
                                setShowRecent(!showRecent);
                                setShowFavorites(false);
                            }}>
                            🕒 Recent ({state.lastUsed.length})
                        </button>
                    </div>

                    {/* Generator Grid */}
                    <div className="custom-shape-panel__generator-grid">
                        {filteredGenerators.map((generator) => (
                            <div
                                key={generator.config.id}
                                className={cn("custom-shape-panel__generator-card", {
                                    "custom-shape-panel__generator-card--active":
                                        state.activeGenerator === generator.config.id,
                                })}
                                onClick={() => handleGeneratorSelect(generator)}>
                                <div className="custom-shape-panel__generator-header">
                                    <span className="custom-shape-panel__generator-icon">
                                        {generator.config.icon || "🔶"}
                                    </span>
                                    <button
                                        className={cn("custom-shape-panel__favorite-btn", {
                                            "custom-shape-panel__favorite-btn--active": state.favorites.includes(
                                                generator.config.id
                                            ),
                                        })}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFavorite(generator.config.id);
                                        }}
                                        title="Toggle favorite">
                                        ⭐
                                    </button>
                                </div>
                                <h4 className="custom-shape-panel__generator-name">{generator.config.name}</h4>
                                <p className="custom-shape-panel__generator-description">
                                    {generator.config.description}
                                </p>
                                <div className="custom-shape-panel__generator-category">
                                    {generator.config.category}
                                </div>
                                {generator.config.tags && generator.config.tags.length > 0 && (
                                    <div className="custom-shape-panel__generator-tags">
                                        {generator.config.tags.map((tag) => (
                                            <span key={tag} className="custom-shape-panel__tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filteredGenerators.length === 0 && (
                        <div className="custom-shape-panel__empty">
                            <p>No shapes found matching your filters.</p>
                            {(searchQuery || selectedCategory || showFavorites || showRecent) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("");
                                        setShowFavorites(false);
                                        setShowRecent(false);
                                    }}
                                    className="custom-shape-panel__clear-filters">
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Shape Configuration */}
                {activeGenerator && (
                    <div className="custom-shape-panel__configuration">
                        <div className="custom-shape-panel__config-header">
                            <h4 className="custom-shape-panel__config-title">
                                {activeGenerator.config.icon} {activeGenerator.config.name}
                            </h4>
                            <div className="custom-shape-panel__config-actions">
                                {activeGenerator.config.presets && activeGenerator.config.presets.length > 0 && (
                                    <button
                                        className="custom-shape-panel__preset-btn"
                                        onClick={() => setShowPresets(!showPresets)}
                                        title="Show presets">
                                        📋 Presets
                                    </button>
                                )}
                                <button
                                    className="custom-shape-panel__reset-btn"
                                    onClick={handleResetParameters}
                                    title="Reset to defaults">
                                    🔄 Reset
                                </button>
                            </div>
                        </div>

                        {/* Presets */}
                        {showPresets && activeGenerator.config.presets && (
                            <div className="custom-shape-panel__presets">
                                <h5>Presets</h5>
                                <div className="custom-shape-panel__preset-grid">
                                    {activeGenerator.config.presets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            className="custom-shape-panel__preset-card"
                                            onClick={() => handlePresetApply(preset)}
                                            title={preset.description}>
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Parameters */}
                        <div className="custom-shape-panel__parameters">
                            {Object.entries(groupedParameters).map(([category, parameters]) => (
                                <div key={category} className="custom-shape-panel__parameter-group">
                                    <h5 className="custom-shape-panel__parameter-group-title">{category}</h5>
                                    <div className="custom-shape-panel__parameter-list">
                                        {parameters.map((parameter) => (
                                            <ParameterControl
                                                key={parameter.id}
                                                parameter={parameter}
                                                value={currentParameters[parameter.id]}
                                                onChange={(value) => handleParameterChange(parameter.id, value)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Preview */}
                        {state.previewMode && previewSvg && (
                            <div className="custom-shape-panel__preview">
                                <h5>Preview</h5>
                                <div className="custom-shape-panel__preview-container">
                                    <svg
                                        width="200"
                                        height="200"
                                        viewBox="-100 -100 200 200"
                                        className="custom-shape-panel__preview-svg">
                                        <path d={previewSvg} fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <div className="custom-shape-panel__generate">
                            <button
                                className="custom-shape-panel__generate-btn"
                                onClick={handleGenerateShape}
                                disabled={isGenerating}>
                                {isGenerating ? "Generating..." : "Generate Shape"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
