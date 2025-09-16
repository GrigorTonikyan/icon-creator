import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ProjectData } from "../types/editor";
import { createEmptyProject } from "./project";
import {
    autoSaveProject,
    clearAutoSavedProject,
    deleteProjectFromLocalStorage,
    downloadProject,
    getStoredProjects,
    hasAutoSavedProject,
    loadAutoSavedProject,
    loadProjectFromLocalStorage,
    saveProjectToLocalStorage,
    uploadProject,
} from "./storage";

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
            return Object.keys(store).length;
        },
    };
})();

// Mock DOM APIs
Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});

Object.defineProperty(global, "Blob", {
    value: class MockBlob {
        size: number;
        type: string;

        constructor(chunks: any[] = [], options: { type?: string } = {}) {
            this.size = JSON.stringify(chunks).length;
            this.type = options.type || "";
        }
    },
});

Object.defineProperty(global, "URL", {
    value: {
        createObjectURL: vi.fn(() => "mock-url"),
        revokeObjectURL: vi.fn(),
    },
});

Object.defineProperty(global, "FileReader", {
    value: class MockFileReader {
        result: string | null = null;
        onload: ((event: any) => void) | null = null;
        onerror: (() => void) | null = null;

        readAsText(file: File) {
            setTimeout(() => {
                if (file.name.endsWith(".iconproject")) {
                    const project = createEmptyProject("Test Project");
                    this.result = JSON.stringify(project);
                } else {
                    this.result = '{"invalid": "data"}';
                }
                this.onload?.({ target: { result: this.result } });
            }, 0);
        }
    },
});

// Mock document
Object.defineProperty(global, "document", {
    value: {
        createElement: vi.fn((tag: string) => ({
            href: "",
            download: "",
            click: vi.fn(),
        })),
        body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
        },
    },
});

describe("storage utilities", () => {
    let testProject: ProjectData;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        testProject = createEmptyProject("Test Project");
        testProject.metadata.id = "test-project-id";
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    describe("saveProjectToLocalStorage", () => {
        test("should save project to localStorage", async () => {
            await saveProjectToLocalStorage(testProject);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                "icon-creator-project-test-project-id",
                JSON.stringify(testProject)
            );

            // Should update projects index
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                "icon-creator-projects",
                expect.stringContaining("test-project-id")
            );
        });

        test("should throw error when storage quota exceeded", async () => {
            const error = new DOMException("", "QuotaExceededError");
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw error;
            });

            await expect(saveProjectToLocalStorage(testProject)).rejects.toThrow("Storage quota exceeded");
        });
    });

    describe("loadProjectFromLocalStorage", () => {
        test("should load project from localStorage", async () => {
            // First save the project
            await saveProjectToLocalStorage(testProject);

            const loadedProject = await loadProjectFromLocalStorage("test-project-id");

            expect(loadedProject).toEqual(testProject);
        });

        test("should throw error for non-existent project", async () => {
            await expect(loadProjectFromLocalStorage("non-existent-id")).rejects.toThrow(
                'Project with ID "non-existent-id" not found'
            );
        });

        test("should throw error for invalid project data", async () => {
            localStorageMock.setItem("icon-creator-project-invalid", '{"invalid": "data"}');

            await expect(loadProjectFromLocalStorage("invalid")).rejects.toThrow("Invalid project data format");
        });
    });

    describe("deleteProjectFromLocalStorage", () => {
        test("should delete project from localStorage", async () => {
            // First save the project
            await saveProjectToLocalStorage(testProject);

            await deleteProjectFromLocalStorage("test-project-id");

            expect(localStorageMock.removeItem).toHaveBeenCalledWith("icon-creator-project-test-project-id");

            // Should update projects index
            const indexJson = localStorageMock.getItem("icon-creator-projects");
            if (indexJson) {
                const index = JSON.parse(indexJson);
                expect(index).not.toHaveProperty("test-project-id");
            }
        });
    });

    describe("downloadProject", () => {
        test("should trigger download", async () => {
            const mockLink = {
                href: "",
                download: "",
                click: vi.fn(),
            };

            vi.mocked(document.createElement).mockReturnValue(mockLink as any);

            await downloadProject(testProject);

            expect(document.createElement).toHaveBeenCalledWith("a");
            expect(mockLink.download).toBe("Test Project.iconproject");
            expect(mockLink.click).toHaveBeenCalled();
        });
    });

    describe("uploadProject", () => {
        test("should upload and parse valid project file", async () => {
            const file = new File([""], "test.iconproject", { type: "application/json" });

            const result = await uploadProject(file);

            expect(result.metadata.name).toBe("Test Project");
        });

        test("should reject invalid project file", async () => {
            const file = new File([""], "invalid.txt", { type: "text/plain" });

            await expect(uploadProject(file)).rejects.toThrow("Failed to parse project file");
        });
    });

    describe("getStoredProjects", () => {
        test("should return list of stored projects", async () => {
            // Save multiple projects
            const project1 = createEmptyProject("Project 1");
            project1.metadata.id = "project-1";
            const project2 = createEmptyProject("Project 2");
            project2.metadata.id = "project-2";

            await saveProjectToLocalStorage(project1);
            await saveProjectToLocalStorage(project2);

            const projects = getStoredProjects();

            expect(projects).toHaveLength(2);
            expect(projects.map((p) => p.id)).toContain("project-1");
            expect(projects.map((p) => p.id)).toContain("project-2");
        });

        test("should return empty array when no projects stored", () => {
            const projects = getStoredProjects();
            expect(projects).toEqual([]);
        });
    });

    describe("auto-save functionality", () => {
        test("should save project to auto-save slot", async () => {
            await autoSaveProject(testProject);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                "icon-creator-autosave",
                expect.stringContaining("test-project-id")
            );
        });

        test("should load auto-saved project", async () => {
            await autoSaveProject(testProject);

            const loadedProject = await loadAutoSavedProject();

            expect(loadedProject).not.toBeNull();
            expect(loadedProject?.metadata.id).toBe("test-project-id");
        });

        test("should return null when no auto-save exists", async () => {
            const result = await loadAutoSavedProject();
            expect(result).toBeNull();
        });

        test("should clear auto-save data", () => {
            autoSaveProject(testProject);
            expect(hasAutoSavedProject()).toBe(true);

            clearAutoSavedProject();
            expect(hasAutoSavedProject()).toBe(false);
        });

        test("should handle corrupted auto-save data", async () => {
            localStorageMock.setItem("icon-creator-autosave", '{"invalid": "data"}');

            const result = await loadAutoSavedProject();
            expect(result).toBeNull();

            // Should clear the corrupted data
            expect(localStorageMock.removeItem).toHaveBeenCalledWith("icon-creator-autosave");
        });
    });
});
