import type { ProjectData } from "../types/editor";
import { PROJECT_FILE_EXTENSION } from "./project";
import { validateProjectDataEnhanced } from "./projectValidation";

// Browser storage keys
const STORAGE_PREFIX = "icon-creator";
const PROJECTS_KEY = `${STORAGE_PREFIX}-projects`;
const AUTO_SAVE_KEY = `${STORAGE_PREFIX}-autosave`;
const RECENT_PROJECTS_KEY = `${STORAGE_PREFIX}-recent`;

export interface StoredProjectMetadata {
    id: string;
    name: string;
    lastModified: number;
    size: number; // Storage size in bytes
    autoSave?: boolean;
}

/**
 * Save project to browser localStorage
 */
export async function saveProjectToLocalStorage(projectData: ProjectData): Promise<void> {
    try {
        const projectJson = JSON.stringify(projectData);
        const storageKey = `${STORAGE_PREFIX}-project-${projectData.metadata.id}`;

        // Store the project data
        localStorage.setItem(storageKey, projectJson);

        // Update projects index
        const projectsIndex = getProjectsIndex();
        const projectMetadata: StoredProjectMetadata = {
            id: projectData.metadata.id,
            name: projectData.metadata.name,
            lastModified: projectData.metadata.lastModified,
            size: new Blob([projectJson]).size,
        };

        projectsIndex[projectData.metadata.id] = projectMetadata;
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsIndex));

        // Update recent projects list
        updateRecentProjects(projectData.metadata.id);
    } catch (error) {
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
            throw new Error("Storage quota exceeded. Please delete some projects or clear browser storage.");
        }
        throw new Error(`Failed to save project: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Load project from browser localStorage
 */
export async function loadProjectFromLocalStorage(projectId: string): Promise<ProjectData> {
    try {
        const storageKey = `${STORAGE_PREFIX}-project-${projectId}`;
        const projectJson = localStorage.getItem(storageKey);

        if (!projectJson) {
            throw new Error(`Project with ID "${projectId}" not found in local storage`);
        }

        const projectData = JSON.parse(projectJson);

        const validation = validateProjectDataEnhanced(projectData);
        if (!validation.valid) {
            throw new Error("Invalid project data format");
        }

        // Update recent projects list
        updateRecentProjects(projectId);

        return projectData;
    } catch (error) {
        throw new Error(`Failed to load project: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Delete project from browser localStorage
 */
export async function deleteProjectFromLocalStorage(projectId: string): Promise<void> {
    try {
        const storageKey = `${STORAGE_PREFIX}-project-${projectId}`;
        localStorage.removeItem(storageKey);

        // Update projects index
        const projectsIndex = getProjectsIndex();
        delete projectsIndex[projectId];
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsIndex));

        // Remove from recent projects
        const recentProjects = getRecentProjects().filter((id) => id !== projectId);
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recentProjects));
    } catch (error) {
        throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Download project as a file
 */
export async function downloadProject(projectData: ProjectData): Promise<void> {
    try {
        const projectJson = JSON.stringify(projectData, null, 2);
        const blob = new Blob([projectJson], { type: "application/json" });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${projectData.metadata.name}${PROJECT_FILE_EXTENSION}`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);
    } catch (error) {
        throw new Error(`Failed to download project: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Upload project from a file
 */
export async function uploadProject(file: File): Promise<ProjectData> {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    if (!event.target?.result || typeof event.target.result !== "string") {
                        throw new Error("Failed to read file content");
                    }

                    const projectData = JSON.parse(event.target.result);

                    const validation = validateProjectDataEnhanced(projectData);
                    if (!validation.valid) {
                        throw new Error("Invalid project file format");
                    }

                    resolve(projectData);
                } catch (error) {
                    reject(
                        new Error(
                            `Failed to parse project file: ${error instanceof Error ? error.message : "Unknown error"}`
                        )
                    );
                }
            };

            reader.onerror = () => {
                reject(new Error("Failed to read file"));
            };

            reader.readAsText(file);
        } catch (error) {
            reject(new Error(`Failed to upload project: ${error instanceof Error ? error.message : "Unknown error"}`));
        }
    });
}

/**
 * Get list of all stored projects
 */
export function getStoredProjects(): StoredProjectMetadata[] {
    const projectsIndex = getProjectsIndex();
    return Object.values(projectsIndex).sort((a, b) => b.lastModified - a.lastModified);
}

/**
 * Get recent projects list
 */
export function getRecentProjects(): string[] {
    try {
        const recentJson = localStorage.getItem(RECENT_PROJECTS_KEY);
        return recentJson ? JSON.parse(recentJson) : [];
    } catch {
        return [];
    }
}

/**
 * Auto-save project to temporary storage
 */
export async function autoSaveProject(projectData: ProjectData): Promise<void> {
    try {
        const autoSaveData = {
            ...projectData,
            metadata: {
                ...projectData.metadata,
                lastModified: Date.now(),
            },
        };

        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveData));
    } catch (error) {
        console.warn("Auto-save failed:", error);
        // Don't throw - auto-save failures shouldn't interrupt the user
    }
}

/**
 * Load auto-saved project
 */
export async function loadAutoSavedProject(): Promise<ProjectData | null> {
    try {
        const autoSaveJson = localStorage.getItem(AUTO_SAVE_KEY);
        if (!autoSaveJson) return null;

        const projectData = JSON.parse(autoSaveJson);

        const validation = validateProjectDataEnhanced(projectData);
        if (!validation.valid) {
            // Clear invalid auto-save data
            localStorage.removeItem(AUTO_SAVE_KEY);
            return null;
        }

        return projectData;
    } catch {
        // Clear corrupted auto-save data
        localStorage.removeItem(AUTO_SAVE_KEY);
        return null;
    }
}

/**
 * Clear auto-saved data
 */
export function clearAutoSavedProject(): void {
    localStorage.removeItem(AUTO_SAVE_KEY);
}

/**
 * Check if auto-saved data exists
 */
export function hasAutoSavedProject(): boolean {
    return localStorage.getItem(AUTO_SAVE_KEY) !== null;
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
    used: number;
    total: number;
    projects: number;
} {
    let used = 0;
    let projects = 0;

    // Calculate used storage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
            const value = localStorage.getItem(key);
            if (value) {
                used += new Blob([value]).size;
                if (key.includes("-project-")) {
                    projects++;
                }
            }
        }
    }

    // Estimate total available (browsers typically allow 5-10MB for localStorage)
    const total = 5 * 1024 * 1024; // 5MB conservative estimate

    return { used, total, projects };
}

// Helper functions

function getProjectsIndex(): Record<string, StoredProjectMetadata> {
    try {
        const indexJson = localStorage.getItem(PROJECTS_KEY);
        return indexJson ? JSON.parse(indexJson) : {};
    } catch {
        return {};
    }
}

function updateRecentProjects(projectId: string): void {
    try {
        const recentProjects = getRecentProjects();
        const filtered = recentProjects.filter((id) => id !== projectId);
        const updated = [projectId, ...filtered].slice(0, 10); // Keep last 10
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated));
    } catch {
        // Ignore errors for recent projects tracking
    }
}
