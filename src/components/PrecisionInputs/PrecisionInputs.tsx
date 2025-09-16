import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditor } from "../../contexts/EditorContext";
import type { CanvasObject, CoordinateDisplay, UnitType } from "../../types/editor";
import {
    calculateSelectionBounds,
    calculateSelectionCenter,
    convertUnit,
    formatPrecisionValue,
    getDimensionConstraints,
    getTransformConstraints,
    parsePrecisionInput,
} from "../../utils/precisionInputs";
import { Button } from "../ui/Button/Button";
import { FormField } from "../ui/FormField/FormField";
import { Input } from "../ui/Input/Input";

import cn from "classnames";
import "./precisionInputs.css";

export interface PrecisionInputsProps {
    className?: string;
}

interface PrecisionFieldProps {
    label: string;
    value: number;
    unit: UnitType | "°" | "";
    precision?: number;
    constraints?: {
        min?: number;
        max?: number;
        step?: number;
    };
    onChange: (value: number) => void;
    disabled?: boolean;
}

function PrecisionField({
    label,
    value,
    unit,
    precision = 2,
    constraints = {},
    onChange,
    disabled = false,
}: PrecisionFieldProps) {
    const [inputValue, setInputValue] = useState(() => formatPrecisionValue(value, precision).toString());
    const [hasError, setHasError] = useState(false);

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(formatPrecisionValue(value, precision).toString());
        setHasError(false);
    }, [value, precision]);

    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            setInputValue(newValue);

            const parsed = parsePrecisionInput(newValue, { ...constraints, precision });
            if (parsed.isValid) {
                setHasError(false);
                onChange(parsed.value);
            } else {
                setHasError(true);
            }
        },
        [constraints, precision, onChange]
    );

    const handleBlur = useCallback(() => {
        // On blur, format the value properly
        const parsed = parsePrecisionInput(inputValue, { ...constraints, precision });
        const finalValue = parsed.isValid ? parsed.value : value;
        setInputValue(formatPrecisionValue(finalValue, precision).toString());
        setHasError(false);
        if (parsed.isValid && parsed.value !== value) {
            onChange(finalValue);
        }
    }, [inputValue, constraints, precision, value, onChange]);

    return (
        <FormField label={label} className="precision-field">
            <div className="precision-field__input-group">
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    className={cn("precision-field__input", {
                        "precision-field__input--error": hasError,
                    })}
                />
                <span className="precision-field__unit">{unit}</span>
            </div>
        </FormField>
    );
}

export function PrecisionInputs({ className }: PrecisionInputsProps) {
    const { state, updateObject } = useEditor();
    const { selection, objects, precisionInputs, rulers } = state;

    // Get selected objects
    const selectedObjects = useMemo(() => {
        return selection.objectIds.map((id) => objects[id]).filter((obj): obj is CanvasObject => obj !== undefined);
    }, [selection.objectIds, objects]);

    // Calculate selection data
    const selectionData = useMemo(() => {
        if (selectedObjects.length === 0) {
            return null;
        }

        const center = calculateSelectionCenter(selectedObjects);
        const bounds = calculateSelectionBounds(selectedObjects);

        // For single selection, use object properties directly
        if (selectedObjects.length === 1) {
            const obj = selectedObjects[0];
            if (!obj) return null;

            return {
                x: obj.transform.x,
                y: obj.transform.y,
                rotation: obj.transform.rotation,
                scaleX: obj.transform.scaleX,
                scaleY: obj.transform.scaleY,
                width: "width" in obj ? obj.width : bounds.width,
                height: "height" in obj ? obj.height : bounds.height,
                canEditDimensions: obj.type === "rectangle" || obj.type === "circle",
                isMultiSelection: false,
            };
        }

        // For multi-selection, use averaged/calculated values
        return {
            x: center.x,
            y: center.y,
            rotation: 0, // Multi-selection rotation is complex
            scaleX: 1, // Multi-selection scale is complex
            scaleY: 1,
            width: bounds.width,
            height: bounds.height,
            canEditDimensions: false,
            isMultiSelection: true,
        };
    }, [selectedObjects]);

    // Handle coordinate updates
    const handleCoordinateUpdate = useCallback(
        (property: "x" | "y", value: number) => {
            if (selectedObjects.length === 0) return;

            if (selectedObjects.length === 1) {
                // Single object update
                const obj = selectedObjects[0];
                if (!obj) return;

                updateObject(obj.id, {
                    transform: {
                        ...obj.transform,
                        [property]: value,
                    },
                });
            } else {
                // Multi-object update with relative positioning
                const center = calculateSelectionCenter(selectedObjects);
                const offset = property === "x" ? value - center.x : value - center.y;

                selectedObjects.forEach((obj) => {
                    updateObject(obj.id, {
                        transform: {
                            ...obj.transform,
                            [property]: obj.transform[property] + offset,
                        },
                    });
                });
            }
        },
        [selectedObjects, updateObject]
    );

    // Handle transform updates
    const handleTransformUpdate = useCallback(
        (property: "rotation" | "scaleX" | "scaleY", value: number) => {
            if (selectedObjects.length !== 1) return; // Only support single selection for transforms

            const obj = selectedObjects[0];
            if (!obj) return;

            updateObject(obj.id, {
                transform: {
                    ...obj.transform,
                    [property]: value,
                },
            });
        },
        [selectedObjects, updateObject]
    );

    // Handle dimension updates
    const handleDimensionUpdate = useCallback(
        (property: "width" | "height", value: number) => {
            if (selectedObjects.length !== 1) return; // Only support single selection for dimensions

            const obj = selectedObjects[0];
            if (!("width" in obj) && !("height" in obj)) return;

            updateObject(obj.id, {
                [property]: value,
            } as Partial<CanvasObject>);
        },
        [selectedObjects, updateObject]
    );

    const precisionInputsCn = cn("PrecisionInputs", className);

    if (!precisionInputs.visible) {
        return null;
    }

    return (
        <div className={precisionInputsCn}>
            <div className="precision-inputs__header">
                <h3 className="precision-inputs__title">Precision</h3>
                {precisionInputs.showMousePosition && (
                    <div className="precision-inputs__mouse-position">
                        {precisionInputs.currentMousePosition && (
                            <span className="precision-inputs__coordinates">
                                X:{" "}
                                {formatPrecisionValue(
                                    precisionInputs.currentMousePosition.x,
                                    precisionInputs.precision
                                )}
                                {precisionInputs.currentMousePosition.unit}
                                Y:{" "}
                                {formatPrecisionValue(
                                    precisionInputs.currentMousePosition.y,
                                    precisionInputs.precision
                                )}
                                {precisionInputs.currentMousePosition.unit}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {selectionData ? (
                <div className="precision-inputs__content">
                    {/* Position Controls */}
                    <div className="precision-inputs__section">
                        <h4 className="precision-inputs__section-title">Position</h4>
                        <div className="precision-inputs__row">
                            <PrecisionField
                                label="X"
                                value={convertUnit(selectionData.x, "px", precisionInputs.unit)}
                                unit={precisionInputs.unit}
                                precision={precisionInputs.precision}
                                constraints={getTransformConstraints("x")}
                                onChange={(value) =>
                                    handleCoordinateUpdate("x", convertUnit(value, precisionInputs.unit, "px"))
                                }
                            />
                            <PrecisionField
                                label="Y"
                                value={convertUnit(selectionData.y, "px", precisionInputs.unit)}
                                unit={precisionInputs.unit}
                                precision={precisionInputs.precision}
                                constraints={getTransformConstraints("y")}
                                onChange={(value) =>
                                    handleCoordinateUpdate("y", convertUnit(value, precisionInputs.unit, "px"))
                                }
                            />
                        </div>
                    </div>

                    {/* Dimensions Controls */}
                    {selectionData.canEditDimensions && (
                        <div className="precision-inputs__section">
                            <h4 className="precision-inputs__section-title">Dimensions</h4>
                            <div className="precision-inputs__row">
                                <PrecisionField
                                    label="W"
                                    value={convertUnit(selectionData.width, "px", precisionInputs.unit)}
                                    unit={precisionInputs.unit}
                                    precision={precisionInputs.precision}
                                    constraints={getDimensionConstraints("width")}
                                    onChange={(value) =>
                                        handleDimensionUpdate("width", convertUnit(value, precisionInputs.unit, "px"))
                                    }
                                />
                                <PrecisionField
                                    label="H"
                                    value={convertUnit(selectionData.height, "px", precisionInputs.unit)}
                                    unit={precisionInputs.unit}
                                    precision={precisionInputs.precision}
                                    constraints={getDimensionConstraints("height")}
                                    onChange={(value) =>
                                        handleDimensionUpdate("height", convertUnit(value, precisionInputs.unit, "px"))
                                    }
                                />
                            </div>
                            {precisionInputs.lockAspectRatio && (
                                <div className="precision-inputs__aspect-ratio">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="precision-inputs__aspect-button"
                                        aria-label="Aspect ratio locked">
                                        🔗
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transform Controls (single selection only) */}
                    {!selectionData.isMultiSelection && (
                        <div className="precision-inputs__section">
                            <h4 className="precision-inputs__section-title">Transform</h4>
                            <div className="precision-inputs__row">
                                <PrecisionField
                                    label="Rotation"
                                    value={selectionData.rotation}
                                    unit="°"
                                    precision={1}
                                    constraints={getTransformConstraints("rotation")}
                                    onChange={(value) => handleTransformUpdate("rotation", value)}
                                />
                            </div>
                            <div className="precision-inputs__row">
                                <PrecisionField
                                    label="Scale X"
                                    value={selectionData.scaleX}
                                    unit=""
                                    precision={2}
                                    constraints={getTransformConstraints("scaleX")}
                                    onChange={(value) => handleTransformUpdate("scaleX", value)}
                                />
                                <PrecisionField
                                    label="Scale Y"
                                    value={selectionData.scaleY}
                                    unit=""
                                    precision={2}
                                    constraints={getTransformConstraints("scaleY")}
                                    onChange={(value) => handleTransformUpdate("scaleY", value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Multi-selection indicator */}
                    {selectionData.isMultiSelection && (
                        <div className="precision-inputs__multi-selection">
                            <p className="precision-inputs__multi-text">{selectedObjects.length} objects selected</p>
                            <p className="precision-inputs__multi-note">Position values represent selection center</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="precision-inputs__empty">
                    <p className="precision-inputs__empty-text">Select objects to edit precise values</p>
                </div>
            )}
        </div>
    );
}
