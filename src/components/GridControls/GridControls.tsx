import React from "react";
import { useEditor } from "../../contexts/EditorContext";
import { Button } from "../ui/Button/Button";
import { Input } from "../ui/Input/Input";
import { Checkbox } from "../ui/Checkbox/Checkbox";
import cn from "classnames";
import "./gridControls.css";

export interface GridControlsProps {
    className?: string;
}

export function GridControls({ className }: GridControlsProps) {
    const { state, toggleGrid, toggleSnapToGrid, setGridSize, toggleSmartGuides, setSmartGuidesOptions } = useEditor();

    const { gridVisible, snapToGrid, gridSize, smartGuides } = state;

    const gridControlsCn = cn("GridControls", className);

    const handleGridSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const size = parseInt(e.target.value);
        if (!isNaN(size) && size >= 5 && size <= 100) {
            setGridSize(size);
        }
    };

    const presetSizes = [10, 15, 20, 25, 30, 40, 50];

    return (
        <div className={gridControlsCn}>
            <div className="grid-controls-header">
                <h3>Grid Controls</h3>
            </div>

            <div className="grid-controls-section">
                <Checkbox label="Show Grid (G)" checked={gridVisible} onChange={toggleGrid} />

                <Checkbox
                    label="Snap to Grid (Shift+G)"
                    checked={snapToGrid}
                    onChange={toggleSnapToGrid}
                    disabled={!gridVisible}
                />
            </div>

            <div className="grid-controls-section">
                <Input
                    label="Grid Size"
                    type="number"
                    value={gridSize.toString()}
                    onChange={handleGridSizeChange}
                    min="5"
                    max="100"
                    disabled={!gridVisible}
                />

                <div className="grid-size-presets">
                    <span className="presets-label">Presets:</span>
                    {presetSizes.map((size) => (
                        <Button
                            key={size}
                            variant="secondary"
                            size="sm"
                            onClick={() => setGridSize(size)}
                            disabled={!gridVisible}
                            className={cn("preset-button", { active: gridSize === size })}>
                            {size}px
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid-controls-section">
                <h4>Smart Guides</h4>
                <Checkbox label="Enable Smart Guides" checked={smartGuides.enabled} onChange={toggleSmartGuides} />

                {smartGuides.enabled && (
                    <>
                        <Checkbox
                            label="Show Guide Lines"
                            checked={smartGuides.showGuides}
                            onChange={(e) => setSmartGuidesOptions({ showGuides: e.target.checked })}
                        />

                        <Checkbox
                            label="Snap to Objects"
                            checked={smartGuides.snapToObjects}
                            onChange={(e) => setSmartGuidesOptions({ snapToObjects: e.target.checked })}
                        />

                        <div className="threshold-control">
                            <label>Snap Threshold:</label>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                value={smartGuides.threshold}
                                onChange={(e) => setSmartGuidesOptions({ threshold: Number(e.target.value) })}
                                className="threshold-slider"
                            />
                            <span>{smartGuides.threshold}px</span>
                        </div>
                    </>
                )}
            </div>

            <div className="grid-controls-info">
                <small>
                    Current grid: {gridSize}px spacing
                    {snapToGrid && gridVisible && " • Snap enabled"}
                    {smartGuides.enabled && " • Smart guides active"}
                </small>
            </div>
        </div>
    );
}
