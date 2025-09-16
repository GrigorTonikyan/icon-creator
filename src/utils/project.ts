import type { EditorState, ProjectData, ProjectMetadata, SerializableEditorState } from "../types/editor";

export const PROJECT_VERSION = "1.0.0";
export const PROJECT_FILE_EXTENSION = ".iconproject";

/**
 * Serializes the current editor state into a saveable project format
 */
export function serializeProject(editorState: EditorState, metadata: Partial<ProjectMetadata> = {}): ProjectData {
    const now = Date.now();

    // Create project metadata with defaults
    const projectMetadata: ProjectMetadata = {
        id: metadata.id || `project_${now}`,
        name: metadata.name || "Untitled Project",
        version: PROJECT_VERSION,
        createdAt: metadata.createdAt || now,
        lastModified: now,
        description: metadata.description,
        tags: metadata.tags,
        thumbnailData: metadata.thumbnailData,
    };

    // Extract serializable editor state (excluding non-serializable parts)
    const serializableState: SerializableEditorState = {
        objects: editorState.objects,
        layers: editorState.layers,
        layerOrder: editorState.layerOrder,
        selection: editorState.selection,
        layerSelection: editorState.layerSelection,
        viewport: editorState.viewport,
        selectedTool: editorState.selectedTool,
        gridVisible: editorState.gridVisible,
        snapToGrid: editorState.snapToGrid,
        gridSize: editorState.gridSize,
    };

    return {
        metadata: projectMetadata,
        editorState: serializableState,
        historySnapshot: editorState.history.undoStack.slice(-10), // Keep last 10 history entries
    };
}

/**
 * Deserializes project data back into editor state format
 */
export function deserializeProject(projectData: ProjectData): {
    editorState: SerializableEditorState;
    metadata: ProjectMetadata;
} {
    // Validate project version compatibility
    if (!isProjectVersionCompatible(projectData.metadata.version)) {
        throw new Error(
            `Project version ${projectData.metadata.version} is not compatible with current version ${PROJECT_VERSION}`
        );
    }

    return {
        editorState: projectData.editorState,
        metadata: projectData.metadata,
    };
}

/**
 * Checks if a project version is compatible with the current version
 */
function isProjectVersionCompatible(projectVersion: string): boolean {
    const [currentMajor] = PROJECT_VERSION.split(".").map(Number);
    const [projectMajor] = projectVersion.split(".").map(Number);

    // For now, only support same major version
    return currentMajor === projectMajor;
}

/**
 * Generates a thumbnail for the project from the current canvas state
 */
export function generateProjectThumbnail(canvasElement: SVGElement | null): string | undefined {
    if (!canvasElement) return undefined;

    try {
        // Create a canvas to render the SVG
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;

        // Set thumbnail size
        const thumbnailSize = 256;
        canvas.width = thumbnailSize;
        canvas.height = thumbnailSize;

        // Convert SVG to image
        const svgData = new XMLSerializer().serializeToString(canvasElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, thumbnailSize, thumbnailSize);
            URL.revokeObjectURL(url);
        };
        img.src = url;

        return canvas.toDataURL("image/png");
    } catch (error) {
        console.error("Failed to generate project thumbnail:", error);
        return undefined;
    }
}

/**
 * Validates project data structure
 */
export function validateProjectData(data: unknown): data is ProjectData {
    if (!data || typeof data !== "object") return false;

    const project = data as any;

    // Check required top-level properties
    if (!project.metadata || !project.editorState) return false;

    // Validate metadata
    const metadata = project.metadata;
    if (
        typeof metadata.id !== "string" ||
        typeof metadata.name !== "string" ||
        typeof metadata.version !== "string" ||
        typeof metadata.createdAt !== "number" ||
        typeof metadata.lastModified !== "number"
    ) {
        return false;
    }

    // Validate editor state structure
    const editorState = project.editorState;
    if (
        !editorState.objects ||
        typeof editorState.objects !== "object" ||
        !editorState.layers ||
        typeof editorState.layers !== "object" ||
        !Array.isArray(editorState.layerOrder) ||
        !editorState.selection ||
        typeof editorState.selection !== "object" ||
        !editorState.viewport ||
        typeof editorState.viewport !== "object"
    ) {
        return false;
    }

    return true;
}

/**
 * Creates a default project data structure
 */
export function createEmptyProject(name: string = "New Project"): ProjectData {
    const now = Date.now();

    return {
        metadata: {
            id: `project_${now}`,
            name,
            version: PROJECT_VERSION,
            createdAt: now,
            lastModified: now,
        },
        editorState: {
            objects: {},
            layers: {},
            layerOrder: [],
            selection: { objectIds: [] },
            layerSelection: { selectedLayerIds: [] },
            viewport: {
                zoom: 1,
                panX: 0,
                panY: 0,
                canvasWidth: 800,
                canvasHeight: 600,
            },
            selectedTool: "select",
            gridVisible: true,
            snapToGrid: false,
            gridSize: 20,
        },
    };
}
