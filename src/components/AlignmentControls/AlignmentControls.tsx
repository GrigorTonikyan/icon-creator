import React from "react";
import { useEditor } from "../../contexts/EditorContext";
import { Button } from "../ui/Button/Button";
import cn from "classnames";
import "./alignmentControls.css";

export interface AlignmentControlsProps {
    className?: string;
}

export function AlignmentControls({ className }: AlignmentControlsProps) {
    const { state, alignObjects, distributeObjects } = useEditor();
    const { selection } = state;

    const selectedObjectIds = selection.objectIds;
    const hasSelection = selectedObjectIds.length > 0;
    const hasMultipleSelection = selectedObjectIds.length > 1;
    const canDistribute = selectedObjectIds.length >= 3;

    const alignmentControlsCn = cn("AlignmentControls", className);

    const handleAlign = (type: "left" | "right" | "center-horizontal" | "top" | "bottom" | "center-vertical") => {
        if (!hasSelection) return;
        alignObjects(type, selectedObjectIds);
    };

    const handleDistribute = (type: "horizontal" | "vertical") => {
        if (!canDistribute) return;
        distributeObjects(type, selectedObjectIds);
    };

    return (
        <div className={alignmentControlsCn}>
            <div className="alignment-controls-header">
                <h3>Alignment</h3>
            </div>

            <div className="alignment-controls-section">
                <h4>Align Objects</h4>
                <div className="alignment-buttons-grid">
                    {/* Horizontal Alignment */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAlign("left")}
                        disabled={!hasSelection}
                        title="Align Left"
                        className="alignment-button">
                        ⫸
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAlign("center-horizontal")}
                        disabled={!hasSelection}
                        title="Align Center Horizontal"
                        className="alignment-button">
                        ⫿
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAlign("right")}
                        disabled={!hasSelection}
                        title="Align Right"
                        className="alignment-button">
                        ⫷
                    </Button>

                    {/* Vertical Alignment */}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAlign("top")}
                        disabled={!hasSelection}
                        title="Align Top"
                        className="alignment-button">
                        ⫽
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAlign("center-vertical")}
                        disabled={!hasSelection}
                        title="Align Center Vertical"
                        className="alignment-button">
                        ⫾
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAlign("bottom")}
                        disabled={!hasSelection}
                        title="Align Bottom"
                        className="alignment-button">
                        ⫼
                    </Button>
                </div>
            </div>

            <div className="alignment-controls-section">
                <h4>Distribute Objects</h4>
                <div className="distribution-buttons">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDistribute("horizontal")}
                        disabled={!canDistribute}
                        title="Distribute Horizontally"
                        className="distribution-button">
                        ⟷ Horizontal
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDistribute("vertical")}
                        disabled={!canDistribute}
                        title="Distribute Vertically"
                        className="distribution-button">
                        ↕ Vertical
                    </Button>
                </div>
            </div>

            <div className="alignment-controls-info">
                <small>
                    {!hasSelection && "Select objects to enable alignment"}
                    {hasSelection && !hasMultipleSelection && "Select multiple objects for more options"}
                    {hasMultipleSelection && !canDistribute && "Select 3+ objects to distribute"}
                    {canDistribute && `${selectedObjectIds.length} objects selected`}
                </small>
            </div>
        </div>
    );
}
