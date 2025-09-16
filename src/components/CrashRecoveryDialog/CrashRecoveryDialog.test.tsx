import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import { CrashRecoveryDialog } from "./CrashRecoveryDialog";

// Mock the date utilities
vi.mock("../../utils/dateUtils", () => ({
    formatDistanceToNow: vi.fn((date, options) => {
        if (options?.addSuffix) {
            return "2 hours ago";
        }
        return "2 hours";
    }),
}));

// Mock project data
const mockProjectData = {
    version: "1.0.0",
    editorState: {
        objects: {
            obj1: {
                id: "obj1",
                type: "rectangle",
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                fill: "#ff0000",
            },
        },
        layers: {},
        layerOrder: [],
        selection: [],
        layerSelection: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedTool: "select",
        gridVisible: true,
        snapToGrid: true,
        gridSize: 10,
        history: {
            undoStack: [],
            redoStack: [],
            maxHistorySize: 100,
        },
        autoSave: {
            settings: {
                enabled: true,
                interval: 300000,
                maxAutoSaves: 5,
                showRecoveryPrompt: true,
            },
            intervalId: null,
            lastSaveTime: null,
            isAutoSaving: false,
        },
    },
    metadata: {
        name: "Test Project",
        description: "A test project",
        tags: [],
        lastModified: new Date().toISOString(),
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        author: "Test User",
        thumbnail: null,
    },
};

// Mock EditorContext methods
const mockEditorContext = {
    checkAutoSavedProject: vi.fn(() => true),
    loadAutoSavedProjectData: vi.fn(() => Promise.resolve(mockProjectData)),
    clearAutoSave: vi.fn(),
    getAutoSaveSettings: vi.fn(() => ({
        enabled: true,
        interval: 300000,
        maxAutoSaves: 5,
        showRecoveryPrompt: true,
    })),
    loadProject: vi.fn(),
};

// Mock the useEditor hook
vi.mock("../../contexts/EditorContext", async () => {
    const actual = await vi.importActual("../../contexts/EditorContext");
    return {
        ...actual,
        useEditor: () => mockEditorContext,
        EditorProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    };
});

describe("CrashRecoveryDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset localStorage
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        });
    });

    it("renders when auto-saved project exists and recovery is enabled", async () => {
        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        expect(
            screen.getByText("We found an auto-saved version of your project that wasn't properly saved.")
        ).toBeInTheDocument();
        expect(screen.getByText("Test Project")).toBeInTheDocument();
        expect(screen.getByText("2 hours ago")).toBeInTheDocument();
        expect(screen.getByText("1 objects")).toBeInTheDocument();
    });

    it("does not render when no auto-saved project exists", () => {
        mockEditorContext.checkAutoSavedProject.mockReturnValue(false);

        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        expect(screen.queryByText("Unsaved Work Found")).not.toBeInTheDocument();
    });

    it("does not render when recovery prompts are disabled", () => {
        mockEditorContext.getAutoSaveSettings.mockReturnValue({
            enabled: true,
            interval: 300000,
            maxAutoSaves: 5,
            showRecoveryPrompt: false,
        });

        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        expect(screen.queryByText("Unsaved Work Found")).not.toBeInTheDocument();
    });

    it("does not render when auto-save is disabled", () => {
        mockEditorContext.getAutoSaveSettings.mockReturnValue({
            enabled: false,
            interval: 300000,
            maxAutoSaves: 5,
            showRecoveryPrompt: true,
        });

        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        expect(screen.queryByText("Unsaved Work Found")).not.toBeInTheDocument();
    });

    it("restores project when restore button is clicked", async () => {
        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        const restoreButton = screen.getByText("Restore Project");
        fireEvent.click(restoreButton);

        await waitFor(() => {
            expect(mockEditorContext.loadProject).toHaveBeenCalledWith(mockProjectData);
            expect(mockEditorContext.clearAutoSave).toHaveBeenCalled();
        });
    });

    it("dismisses dialog when start fresh button is clicked", async () => {
        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        const dismissButton = screen.getByText("Start Fresh");
        fireEvent.click(dismissButton);

        await waitFor(() => {
            expect(mockEditorContext.clearAutoSave).toHaveBeenCalled();
            expect(screen.queryByText("Unsaved Work Found")).not.toBeInTheDocument();
        });
    });

    it("calls onRestore callback when project is restored", async () => {
        const onRestore = vi.fn();

        render(
            <EditorProvider>
                <CrashRecoveryDialog onRestore={onRestore} />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        const restoreButton = screen.getByText("Restore Project");
        fireEvent.click(restoreButton);

        await waitFor(() => {
            expect(onRestore).toHaveBeenCalled();
        });
    });

    it("calls onDismiss callback when dialog is dismissed", async () => {
        const onDismiss = vi.fn();

        render(
            <EditorProvider>
                <CrashRecoveryDialog onDismiss={onDismiss} />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        const dismissButton = screen.getByText("Start Fresh");
        fireEvent.click(dismissButton);

        await waitFor(() => {
            expect(onDismiss).toHaveBeenCalled();
        });
    });

    it("handles loading state correctly", async () => {
        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        const restoreButton = screen.getByText("Restore Project");
        fireEvent.click(restoreButton);

        // Check loading state
        expect(screen.getByText("Restoring...")).toBeInTheDocument();
        expect(restoreButton).toBeDisabled();
        expect(screen.getByText("Start Fresh")).toBeDisabled();
    });

    it("displays project metadata correctly", async () => {
        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        // Check project name
        expect(screen.getByText("Test Project")).toBeInTheDocument();

        // Check object count
        expect(screen.getByText("1 objects")).toBeInTheDocument();

        // Check last modified time
        expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    });

    it("handles missing project metadata gracefully", async () => {
        const projectDataWithoutMetadata = {
            ...mockProjectData,
            metadata: {
                ...mockProjectData.metadata,
                name: "",
                lastModified: "",
            },
        } as any;

        mockEditorContext.loadAutoSavedProjectData.mockResolvedValue(projectDataWithoutMetadata);

        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        await waitFor(() => {
            expect(screen.getByText("Unsaved Work Found")).toBeInTheDocument();
        });

        // Should show fallback values
        expect(screen.getByText("Untitled Project")).toBeInTheDocument();
        expect(screen.getByText("Unknown time")).toBeInTheDocument();
    });

    it("handles project loading errors gracefully", async () => {
        mockEditorContext.loadAutoSavedProjectData.mockRejectedValue(new Error("Load failed"));

        render(
            <EditorProvider>
                <CrashRecoveryDialog />
            </EditorProvider>
        );

        // Should not render dialog when loading fails
        await waitFor(() => {
            expect(screen.queryByText("Unsaved Work Found")).not.toBeInTheDocument();
        });
    });
});
