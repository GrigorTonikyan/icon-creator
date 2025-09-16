import type { ProjectData } from "../types/editor";

/**
 * JSON Schema validator interface
 */
interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

interface ValidationError {
    path: string;
    message: string;
    value?: unknown;
}

/**
 * Basic project data validation
 * Focuses on essential structure validation rather than comprehensive schema validation
 */
export function validateProjectSchema(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    try {
        // Basic type check
        if (!data || typeof data !== "object") {
            errors.push({
                path: "",
                message: "Project data must be an object",
                value: data,
            });
            return { valid: false, errors };
        }

        const project = data as any;

        // Check required top-level properties
        if (!project.metadata) {
            errors.push({
                path: "metadata",
                message: "Missing required property: metadata",
            });
        }

        if (!project.editorState) {
            errors.push({
                path: "editorState",
                message: "Missing required property: editorState",
            });
        }

        // Validate metadata structure
        if (project.metadata) {
            const metadata = project.metadata;

            if (typeof metadata.id !== "string") {
                errors.push({
                    path: "metadata.id",
                    message: "metadata.id must be a string",
                    value: metadata.id,
                });
            }

            if (typeof metadata.name !== "string") {
                errors.push({
                    path: "metadata.name",
                    message: "metadata.name must be a string",
                    value: metadata.name,
                });
            }

            if (typeof metadata.version !== "string") {
                errors.push({
                    path: "metadata.version",
                    message: "metadata.version must be a string",
                    value: metadata.version,
                });
            }

            if (typeof metadata.createdAt !== "number") {
                errors.push({
                    path: "metadata.createdAt",
                    message: "metadata.createdAt must be a number",
                    value: metadata.createdAt,
                });
            }

            if (typeof metadata.lastModified !== "number") {
                errors.push({
                    path: "metadata.lastModified",
                    message: "metadata.lastModified must be a number",
                    value: metadata.lastModified,
                });
            }
        }

        // Validate editor state structure
        if (project.editorState) {
            const editorState = project.editorState;

            if (!editorState.objects || typeof editorState.objects !== "object") {
                errors.push({
                    path: "editorState.objects",
                    message: "editorState.objects must be an object",
                    value: editorState.objects,
                });
            }

            if (!editorState.layers || typeof editorState.layers !== "object") {
                errors.push({
                    path: "editorState.layers",
                    message: "editorState.layers must be an object",
                    value: editorState.layers,
                });
            }

            if (!Array.isArray(editorState.layerOrder)) {
                errors.push({
                    path: "editorState.layerOrder",
                    message: "editorState.layerOrder must be an array",
                    value: editorState.layerOrder,
                });
            }

            if (!editorState.selection || typeof editorState.selection !== "object") {
                errors.push({
                    path: "editorState.selection",
                    message: "editorState.selection must be an object",
                    value: editorState.selection,
                });
            }

            if (!editorState.viewport || typeof editorState.viewport !== "object") {
                errors.push({
                    path: "editorState.viewport",
                    message: "editorState.viewport must be an object",
                    value: editorState.viewport,
                });
            }
        }
    } catch (error) {
        errors.push({
            path: "",
            message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
            value: data,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Enhanced validation that includes additional business logic checks
 */
export function validateProjectDataEnhanced(data: unknown): ValidationResult {
    // First run basic validation
    const basicResult = validateProjectSchema(data);

    if (!basicResult.valid) {
        return basicResult;
    }

    // Additional business logic validation
    const errors: ValidationError[] = [...basicResult.errors];
    const project = data as ProjectData;

    try {
        // Check version compatibility
        const currentVersion = "1.0.0";
        const [projectMajor] = project.metadata.version.split(".").map(Number);
        const [currentMajor] = currentVersion.split(".").map(Number);

        if (projectMajor !== currentMajor) {
            errors.push({
                path: "metadata.version",
                message: `Project version ${project.metadata.version} is not compatible with current version ${currentVersion}`,
                value: project.metadata.version,
            });
        }

        // Check timestamp consistency
        if (project.metadata.createdAt > project.metadata.lastModified) {
            errors.push({
                path: "metadata",
                message: "createdAt timestamp cannot be greater than lastModified",
                value: {
                    createdAt: project.metadata.createdAt,
                    lastModified: project.metadata.lastModified,
                },
            });
        }

        // Check object-layer references
        for (const [objectId, object] of Object.entries(project.editorState.objects)) {
            if (object.layerId) {
                const layer = project.editorState.layers[object.layerId];
                if (!layer) {
                    errors.push({
                        path: `editorState.objects.${objectId}.layerId`,
                        message: `Object references non-existent layer: ${object.layerId}`,
                        value: object.layerId,
                    });
                } else if (layer.objects && !layer.objects.includes(objectId)) {
                    errors.push({
                        path: `editorState.layers.${object.layerId}.objects`,
                        message: `Layer does not include object ${objectId} in its objects array`,
                        value: layer.objects,
                    });
                }
            }
        }

        // Check layer-object references
        for (const [layerId, layer] of Object.entries(project.editorState.layers)) {
            if (layer.objects) {
                for (const objectId of layer.objects) {
                    if (!project.editorState.objects[objectId]) {
                        errors.push({
                            path: `editorState.layers.${layerId}.objects`,
                            message: `Layer references non-existent object: ${objectId}`,
                            value: objectId,
                        });
                    }
                }
            }

            // Check child layer references
            if (layer.children) {
                for (const childId of layer.children) {
                    if (!project.editorState.layers[childId]) {
                        errors.push({
                            path: `editorState.layers.${layerId}.children`,
                            message: `Layer references non-existent child layer: ${childId}`,
                            value: childId,
                        });
                    }
                }
            }
        }

        // Check layer order references
        for (const layerId of project.editorState.layerOrder) {
            if (!project.editorState.layers[layerId]) {
                errors.push({
                    path: "editorState.layerOrder",
                    message: `Layer order references non-existent layer: ${layerId}`,
                    value: layerId,
                });
            }
        }

        // Check selection references
        if (project.editorState.selection && project.editorState.selection.objectIds) {
            for (const objectId of project.editorState.selection.objectIds) {
                if (!project.editorState.objects[objectId]) {
                    errors.push({
                        path: "editorState.selection.objectIds",
                        message: `Selection references non-existent object: ${objectId}`,
                        value: objectId,
                    });
                }
            }
        }

        if (project.editorState.layerSelection && project.editorState.layerSelection.selectedLayerIds) {
            for (const layerId of project.editorState.layerSelection.selectedLayerIds) {
                if (!project.editorState.layers[layerId]) {
                    errors.push({
                        path: "editorState.layerSelection.selectedLayerIds",
                        message: `Layer selection references non-existent layer: ${layerId}`,
                        value: layerId,
                    });
                }
            }
        }

        if (project.editorState.layerSelection && project.editorState.layerSelection.activeLayerId) {
            const activeLayerId = project.editorState.layerSelection.activeLayerId;
            if (!project.editorState.layers[activeLayerId]) {
                errors.push({
                    path: "editorState.layerSelection.activeLayerId",
                    message: `Active layer selection references non-existent layer: ${activeLayerId}`,
                    value: activeLayerId,
                });
            }
        }
    } catch (error) {
        errors.push({
            path: "",
            message: `Enhanced validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validates and provides detailed error information for debugging
 */
export function validateProjectWithDetails(data: unknown): {
    isValid: boolean;
    errors: ValidationError[];
    warnings: string[];
    summary: string;
} {
    const result = validateProjectDataEnhanced(data);
    const warnings: string[] = [];

    // Generate warnings for non-critical issues
    if (result.valid && data && typeof data === "object") {
        const project = data as ProjectData;

        // Warn about large file size
        const jsonSize = JSON.stringify(project).length;
        if (jsonSize > 1024 * 1024) {
            // 1MB
            warnings.push(`Project file is large (${Math.round(jsonSize / 1024)} KB). Consider optimizing.`);
        }

        // Warn about many objects
        const objectCount = Object.keys(project.editorState.objects).length;
        if (objectCount > 1000) {
            warnings.push(`Project has many objects (${objectCount}). Performance may be affected.`);
        }

        // Warn about deep layer nesting
        const maxDepth = calculateLayerDepth(project.editorState.layers);
        if (maxDepth > 10) {
            warnings.push(`Layer nesting is deep (${maxDepth} levels). Consider flattening layer structure.`);
        }
    }

    let summary = "";
    if (result.valid) {
        summary = "Project file is valid and ready to load.";
        if (warnings.length > 0) {
            summary += ` ${warnings.length} warning(s) found.`;
        }
    } else {
        summary = `Project file has ${result.errors.length} error(s) and cannot be loaded.`;
    }

    return {
        isValid: result.valid,
        errors: result.errors,
        warnings,
        summary,
    };
}

function calculateLayerDepth(layers: Record<string, any>): number {
    const visited = new Set<string>();
    let maxDepth = 0;

    function getDepth(layerId: string, currentDepth: number): number {
        if (visited.has(layerId)) return currentDepth;
        visited.add(layerId);

        const layer = layers[layerId];
        if (!layer || !layer.children || layer.children.length === 0) {
            return currentDepth;
        }

        let deepest = currentDepth;
        for (const childId of layer.children) {
            const childDepth = getDepth(childId, currentDepth + 1);
            deepest = Math.max(deepest, childDepth);
        }

        return deepest;
    }

    for (const layerId of Object.keys(layers)) {
        const depth = getDepth(layerId, 1);
        maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
}
