import { useCallback, useMemo, useState } from "react";
import { useEditor } from "../../contexts/EditorContext";
import type {
    CanvasObject,
    PropertyDefinition,
    PropertySchema,
    PropertySection,
    PropertyUpdate,
    PropertyValidationResult,
    PropertyValue,
} from "../../types/editor";
import { FormField, Icon, Input } from "../ui";

import cn from "classnames";
import "./propertyPanel.css";

export interface PropertyPanelProps {
    className?: string;
}

// Common property definitions
const COMMON_PROPERTIES = {
    position: {
        x: {
            key: "transform.x",
            label: "X",
            type: "number" as const,
            unit: "px",
        },
        y: {
            key: "transform.y",
            label: "Y",
            type: "number" as const,
            unit: "px",
        },
    },
    dimensions: {
        width: {
            key: "width",
            label: "Width",
            type: "number" as const,
            min: 1,
            unit: "px",
        },
        height: {
            key: "height",
            label: "Height",
            type: "number" as const,
            min: 1,
            unit: "px",
        },
        radius: {
            key: "radius",
            label: "Radius",
            type: "number" as const,
            min: 0,
            unit: "px",
        },
    },
    appearance: {
        opacity: {
            key: "opacity",
            label: "Opacity",
            type: "slider" as const,
            min: 0,
            max: 1,
            step: 0.01,
        },
        visible: {
            key: "visible",
            label: "Visible",
            type: "checkbox" as const,
        },
        locked: {
            key: "locked",
            label: "Locked",
            type: "checkbox" as const,
        },
    },
    style: {
        fill: {
            key: "style.fill",
            label: "Fill",
            type: "color" as const,
        },
        stroke: {
            key: "style.stroke",
            label: "Stroke",
            type: "color" as const,
        },
        strokeWidth: {
            key: "style.strokeWidth",
            label: "Stroke Width",
            type: "number" as const,
            min: 0,
            unit: "px",
        },
    },
};

// Helper function to get schema for object type
function getSchemaForObjectType(objectType: string): PropertySchema {
    const { position, dimensions, appearance, style } = COMMON_PROPERTIES;

    switch (objectType) {
        case "rectangle":
            return {
                objectType: "rectangle",
                sections: [
                    {
                        id: "transform",
                        title: "Transform",
                        properties: [position.x, position.y, dimensions.width, dimensions.height],
                    },
                    {
                        id: "appearance",
                        title: "Appearance",
                        properties: [appearance.opacity, appearance.visible, appearance.locked],
                    },
                    {
                        id: "style",
                        title: "Style",
                        properties: [style.fill, style.stroke, style.strokeWidth],
                    },
                ],
            };

        case "circle":
            return {
                objectType: "circle",
                sections: [
                    {
                        id: "transform",
                        title: "Transform",
                        properties: [position.x, position.y, dimensions.radius],
                    },
                    {
                        id: "appearance",
                        title: "Appearance",
                        properties: [appearance.opacity, appearance.visible, appearance.locked],
                    },
                    {
                        id: "style",
                        title: "Style",
                        properties: [style.fill, style.stroke, style.strokeWidth],
                    },
                ],
            };

        default:
            return {
                objectType: "none",
                sections: [
                    {
                        id: "basic",
                        title: "Basic",
                        properties: [appearance.opacity, appearance.visible, appearance.locked],
                    },
                ],
            };
    }
}

// Helper function to get multi-selection schema
function getMultiSelectionSchema(objects: CanvasObject[]): PropertySchema {
    const { appearance } = COMMON_PROPERTIES;

    return {
        objectType: "multi",
        sections: [
            {
                id: "common",
                title: "Common Properties",
                properties: [appearance.opacity, appearance.visible, appearance.locked],
            },
        ],
    };
}

// Helper function to get current property value
function getCurrentPropertyValue(objects: CanvasObject[], propertyKey: string): PropertyValue {
    if (objects.length === 0) return "";

    const firstObject = objects[0];
    if (!firstObject) return "";

    if (propertyKey.includes(".")) {
        const [parentKey, childKey] = propertyKey.split(".");
        if (parentKey && childKey) {
            const parentValue = (firstObject as any)[parentKey];
            return parentValue?.[childKey] ?? "";
        }
    }

    return (firstObject as any)[propertyKey] ?? "";
}

// Helper function to validate property values
function validateProperty(object: CanvasObject, property: string, value: PropertyValue): PropertyValidationResult {
    // Basic validation - can be extended with more sophisticated rules
    if (property === "width" || property === "height") {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue <= 0) {
            return { valid: false, error: "Must be a positive number" };
        }
        return { valid: true, value: numValue };
    }

    if (property === "radius" && object.type === "circle") {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
            return { valid: false, error: "Must be a non-negative number" };
        }
        return { valid: true, value: numValue };
    }

    if (property === "opacity") {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 1) {
            return { valid: false, error: "Must be between 0 and 1" };
        }
        return { valid: true, value: numValue };
    }

    // For colors, basic hex validation
    if (property.includes("fill") || property.includes("stroke") || property.includes("color")) {
        const strValue = String(value);
        if (strValue && !strValue.startsWith("#") && !strValue.startsWith("rgb")) {
            return { valid: false, error: "Invalid color format" };
        }
        return { valid: true, value: strValue };
    }

    // Default: accept the value as-is
    return { valid: true, value };
}

/**
 * PropertyPanel Component
 *
 * Provides dynamic property editing interface based on selected objects:
 * - Position and dimension controls
 * - Color and style properties
 * - Object-specific properties
 * - Real-time validation and updates
 */
export function PropertyPanel({ className }: PropertyPanelProps) {
    const { state, updateObject } = useEditor();
    const { selection, objects } = state;

    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Get selected objects (filter out undefined)
    const selectedObjects = useMemo(() => {
        return selection.objectIds.map((id) => objects[id]).filter((obj): obj is CanvasObject => obj !== undefined);
    }, [selection.objectIds, objects]);

    // Determine active property schema based on selection
    const activeSchema = useMemo((): PropertySchema => {
        if (selectedObjects.length === 0) {
            return { objectType: "none", sections: [] };
        }

        if (selectedObjects.length === 1) {
            const obj = selectedObjects[0];
            if (obj) {
                return getSchemaForObjectType(obj.type);
            }
        }

        // Multi-selection: show common properties only
        return getMultiSelectionSchema(selectedObjects);
    }, [selectedObjects]);

    // Handle property updates
    const handlePropertyUpdate = useCallback(
        (update: PropertyUpdate) => {
            const { objectId, property, value, nested = false } = update;
            const obj = objects[objectId];
            if (!obj) return;

            // Validate the new value
            const validation = validateProperty(obj, property, value);
            if (!validation.valid) {
                setValidationErrors((prev) => ({
                    ...prev,
                    [`${objectId}.${property}`]: validation.error || "Invalid value",
                }));
                return;
            }

            // Clear validation error if valid
            setValidationErrors((prev) => {
                const { [`${objectId}.${property}`]: removed, ...rest } = prev;
                return rest;
            });

            // Prepare update object
            let updates: Partial<CanvasObject> = {};

            if (nested && property.includes(".")) {
                // Handle nested properties like "style.fill"
                const [parentKey, childKey] = property.split(".");
                if (parentKey && childKey) {
                    const parentValue = (obj as any)[parentKey] || {};
                    updates = {
                        [parentKey]: {
                            ...parentValue,
                            [childKey]: validation.value ?? value,
                        },
                    };
                }
            } else {
                // Handle direct properties
                updates = {
                    [property]: validation.value ?? value,
                };
            }

            // Apply update
            updateObject(objectId, updates);
        },
        [objects, updateObject]
    );

    // Handle batch updates for multi-selection
    const handleBatchUpdate = useCallback(
        (property: string, value: PropertyValue, nested = false) => {
            selectedObjects.forEach((obj) => {
                if (obj) {
                    handlePropertyUpdate({
                        objectId: obj.id,
                        property,
                        value,
                        nested,
                    });
                }
            });
        },
        [selectedObjects, handlePropertyUpdate]
    );

    // Toggle section collapse
    const toggleSection = useCallback((sectionId: string) => {
        setCollapsedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    }, []);

    // Render property control based on definition
    const renderPropertyControl = useCallback(
        (prop: PropertyDefinition, currentValue: PropertyValue, isMultiSelect: boolean) => {
            const fieldId = `prop-${prop.key}`;
            const hasError = Object.keys(validationErrors).some((key) => key.endsWith(prop.key));
            const firstObject = selectedObjects[0];

            switch (prop.type) {
                case "number":
                    return (
                        <Input
                            id={fieldId}
                            type="number"
                            value={currentValue as number}
                            min={prop.min}
                            max={prop.max}
                            step={prop.step || 1}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                    if (isMultiSelect) {
                                        handleBatchUpdate(prop.key, value, prop.key.includes("."));
                                    } else if (firstObject) {
                                        handlePropertyUpdate({
                                            objectId: firstObject.id,
                                            property: prop.key,
                                            value,
                                            nested: prop.key.includes("."),
                                        });
                                    }
                                }
                            }}
                            className={cn({ "Input--error": hasError })}
                        />
                    );

                case "text":
                    return (
                        <Input
                            id={fieldId}
                            type="text"
                            value={currentValue as string}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (isMultiSelect) {
                                    handleBatchUpdate(prop.key, value, prop.key.includes("."));
                                } else if (firstObject) {
                                    handlePropertyUpdate({
                                        objectId: firstObject.id,
                                        property: prop.key,
                                        value,
                                        nested: prop.key.includes("."),
                                    });
                                }
                            }}
                            className={cn({ "Input--error": hasError })}
                        />
                    );

                case "color":
                    return (
                        <Input
                            id={fieldId}
                            variant="color"
                            value={currentValue as string}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (isMultiSelect) {
                                    handleBatchUpdate(prop.key, value, prop.key.includes("."));
                                } else if (firstObject) {
                                    handlePropertyUpdate({
                                        objectId: firstObject.id,
                                        property: prop.key,
                                        value,
                                        nested: prop.key.includes("."),
                                    });
                                }
                            }}
                            className={cn({ "Input--error": hasError })}
                        />
                    );

                case "slider":
                    return (
                        <Input
                            id={fieldId}
                            variant="range"
                            value={currentValue as number}
                            min={prop.min}
                            max={prop.max}
                            step={prop.step || 0.01}
                            showValue
                            onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                    if (isMultiSelect) {
                                        handleBatchUpdate(prop.key, value, prop.key.includes("."));
                                    } else if (firstObject) {
                                        handlePropertyUpdate({
                                            objectId: firstObject.id,
                                            property: prop.key,
                                            value,
                                            nested: prop.key.includes("."),
                                        });
                                    }
                                }
                            }}
                            className={cn({ "Input--error": hasError })}
                        />
                    );

                case "checkbox":
                    return (
                        <label className="property-checkbox">
                            <input
                                type="checkbox"
                                checked={currentValue as boolean}
                                onChange={(e) => {
                                    const value = e.target.checked;
                                    if (isMultiSelect) {
                                        handleBatchUpdate(prop.key, value, prop.key.includes("."));
                                    } else if (firstObject) {
                                        handlePropertyUpdate({
                                            objectId: firstObject.id,
                                            property: prop.key,
                                            value,
                                            nested: prop.key.includes("."),
                                        });
                                    }
                                }}
                            />
                            <span className="property-checkbox__checkmark"></span>
                        </label>
                    );

                case "select":
                    return (
                        <select
                            id={fieldId}
                            value={currentValue as string}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (isMultiSelect) {
                                    handleBatchUpdate(prop.key, value, prop.key.includes("."));
                                } else if (firstObject) {
                                    handlePropertyUpdate({
                                        objectId: firstObject.id,
                                        property: prop.key,
                                        value,
                                        nested: prop.key.includes("."),
                                    });
                                }
                            }}
                            className={cn("property-select", { "property-select--error": hasError })}>
                            {prop.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    );

                default:
                    return <span>Unsupported control type: {prop.type}</span>;
            }
        },
        [selectedObjects, validationErrors, handlePropertyUpdate, handleBatchUpdate]
    );

    // Render property section
    const renderSection = useCallback(
        (section: PropertySection) => {
            const isCollapsed = collapsedSections.has(section.id);
            const isMultiSelect = selectedObjects.length > 1;

            return (
                <div key={section.id} className="property-section">
                    <div
                        className={cn("property-section__header", {
                            "property-section__header--collapsible": section.collapsible,
                        })}
                        onClick={section.collapsible ? () => toggleSection(section.id) : undefined}>
                        <h4 className="property-section__title">{section.title}</h4>
                        {section.collapsible && (
                            <Icon
                                name={isCollapsed ? "chevron-right" : "chevron-down"}
                                className="property-section__chevron"
                            />
                        )}
                    </div>

                    {!isCollapsed && (
                        <div className="property-section__content">
                            {section.properties.map((prop) => {
                                // Get current value for the property
                                const currentValue = getCurrentPropertyValue(selectedObjects, prop.key);
                                const errorKey = `${selectedObjects[0]?.id}.${prop.key}`;
                                const error = validationErrors[errorKey];

                                return (
                                    <div key={prop.key} className="property-field">
                                        <FormField label={prop.label} htmlFor={`prop-${prop.key}`} inline error={error}>
                                            {renderPropertyControl(prop, currentValue, isMultiSelect)}
                                        </FormField>
                                        {prop.unit && <span className="property-field__unit">{prop.unit}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        },
        [selectedObjects, collapsedSections, validationErrors, toggleSection, renderPropertyControl]
    );

    const propertyPanelClass = cn("property-panel", className);

    // Render main component
    return (
        <div className={propertyPanelClass}>
            <div className="property-panel__header">
                <h3 className="property-panel__title">Properties</h3>
                {selectedObjects.length > 1 && (
                    <span className="property-panel__selection-count">{selectedObjects.length} objects selected</span>
                )}
            </div>

            <div className="property-panel__content">
                {selectedObjects.length === 0 ? (
                    <div className="property-panel__empty">
                        <Icon name="layer" className="property-panel__empty-icon" />
                        <p>Select objects to edit properties</p>
                    </div>
                ) : (
                    <div className="property-panel__sections">{activeSchema.sections.map(renderSection)}</div>
                )}
            </div>
        </div>
    );
}
