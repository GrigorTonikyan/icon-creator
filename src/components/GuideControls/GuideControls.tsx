/**
 * GuideControls component
 * Provides controls for managing manual guides (create, delete, toggle)
 */

import React, { useState } from "react";
import cn from "classnames";
import { useEditor } from "../../contexts/EditorContext";
import { createManualGuide } from "../../utils/manualGuides";
import { Button, Checkbox, Input } from "../ui";
import "./guideControls.css";

interface GuideControlsProps {
    className?: string;
}

export function GuideControls({ className }: GuideControlsProps) {
    const { state, addManualGuide, clearManualGuides, toggleManualGuides, setManualGuidesOptions } = useEditor();
    const { manualGuides } = state;

    const [newGuidePosition, setNewGuidePosition] = useState("");
    const [newGuideType, setNewGuideType] = useState<"horizontal" | "vertical">("vertical");

    const guideControlsCn = cn("GuideControls", className);

    const handleAddGuide = () => {
        const position = parseFloat(newGuidePosition);
        if (!isNaN(position)) {
            const guide = createManualGuide(newGuideType, position, {
                color: manualGuides.defaultColor,
            });
            addManualGuide(guide);
            setNewGuidePosition("");
        }
    };

    const handleSnapThresholdChange = (value: string) => {
        const threshold = parseInt(value);
        if (!isNaN(threshold) && threshold >= 1 && threshold <= 20) {
            setManualGuidesOptions({ snapThreshold: threshold });
        }
    };

    return (
        <div className={guideControlsCn}>
            <div className="guide-controls-header">
                <h3>Guide Controls</h3>
            </div>

            <div className="guide-controls-section">
                <Checkbox label="Enable Guides" checked={manualGuides.enabled} onChange={toggleManualGuides} />

                <Checkbox
                    label="Show Guides"
                    checked={manualGuides.showGuides}
                    onChange={(e) => setManualGuidesOptions({ showGuides: e.target.checked })}
                    disabled={!manualGuides.enabled}
                />

                <Checkbox
                    label="Snap to Guides"
                    checked={manualGuides.snapToGuides}
                    onChange={(e) => setManualGuidesOptions({ snapToGuides: e.target.checked })}
                    disabled={!manualGuides.enabled}
                />
            </div>

            {manualGuides.enabled && (
                <>
                    <div className="guide-controls-section">
                        <label className="guide-controls-label">Snap Threshold:</label>
                        <Input
                            type="number"
                            value={manualGuides.snapThreshold.toString()}
                            onChange={(e) => handleSnapThresholdChange(e.target.value)}
                            min="1"
                            max="20"
                            placeholder="5"
                            className="snap-threshold-input"
                        />
                        <span className="guide-controls-unit">px</span>
                    </div>

                    <div className="guide-controls-section">
                        <label className="guide-controls-label">Add Guide:</label>
                        <div className="add-guide-controls">
                            <select
                                value={newGuideType}
                                onChange={(e) => setNewGuideType(e.target.value as "horizontal" | "vertical")}
                                className="guide-type-select">
                                <option value="vertical">Vertical</option>
                                <option value="horizontal">Horizontal</option>
                            </select>
                            <Input
                                type="number"
                                value={newGuidePosition}
                                onChange={(e) => setNewGuidePosition(e.target.value)}
                                placeholder={newGuideType === "vertical" ? "X position" : "Y position"}
                                className="guide-position-input"
                            />
                            <Button
                                onClick={handleAddGuide}
                                disabled={!newGuidePosition.trim()}
                                size="sm"
                                className="add-guide-button">
                                Add
                            </Button>
                        </div>
                    </div>

                    {manualGuides.guides.length > 0 && (
                        <div className="guide-controls-section">
                            <div className="guide-list-header">
                                <span className="guide-count">
                                    {manualGuides.guides.length} guide{manualGuides.guides.length !== 1 ? "s" : ""}
                                </span>
                                <Button
                                    onClick={clearManualGuides}
                                    variant="secondary"
                                    size="sm"
                                    className="clear-guides-button">
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="guide-controls-section">
                        <div className="guide-controls-hint">
                            <p>💡 Tip: Drag from rulers to create guides quickly</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
