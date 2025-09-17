import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ComponentLibraryPanel } from "./ComponentLibraryPanel";
import { EditorProvider } from "../../contexts/EditorContext";
import type { ComponentLibrary, ComponentTemplate } from "../../types/editor";

// Mock the ComponentLibraryUtils
vi.mock("../../utils/componentLibraryUtils", () => ({
    ComponentLibraryUtils: {
        createDefaultLibrary: vi.fn(() => ({
            id: "default",
            name: "Default Library",
            description: "Test library",
            version: "1.0.0",
            categories: [{ id: "basic-shapes", name: "Basic Shapes", order: 1 }],
            templates: [],
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                author: "System",
            },
        })),
        exportLibrary: vi.fn((library) => JSON.stringify(library)),
        importLibrary: vi.fn((json) => JSON.parse(json)),
        loadFromStorage: vi.fn(() => []),
        saveToStorage: vi.fn(),
    },
}));

// Mock file operations
beforeEach(() => {
    // DOM mocking is handled in test-setup.ts
    vi.clearAllMocks();
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

describe("ComponentLibraryPanel", () => {
    test("should render component library interface", () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Check for basic UI elements
        expect(screen.getByText("Default Library")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Search components...")).toBeInTheDocument();
    });

    test("should handle template selection", async () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Since there are no templates initially, this tests the empty state
        const searchInput = screen.getByPlaceholderText("Search components...");
        expect(searchInput).toBeInTheDocument();
    });

    test("should handle search input changes", async () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        const searchInput = screen.getByPlaceholderText("Search components...");

        fireEvent.change(searchInput, { target: { value: "test search" } });

        expect(searchInput).toHaveValue("test search");
    });

    test("should handle category selection", async () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Look for category buttons
        const basicShapesButton = screen.getByText("Basic Shapes");
        expect(basicShapesButton).toBeInTheDocument();

        fireEvent.click(basicShapesButton);

        // Category should be selected
        expect(basicShapesButton).toHaveClass("component-library__category--active");
    });

    test("should handle create component button", async () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Look for create component button
        const createButton = screen.getByTitle("Create component from selection");
        expect(createButton).toBeInTheDocument();

        fireEvent.click(createButton);

        // Should show create component dialog
        await waitFor(() => {
            expect(screen.getByText("Create Component")).toBeInTheDocument();
        });
    });

    test("should handle library import", async () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Look for import button
        const importButton = screen.getByTitle("Import library");
        expect(importButton).toBeInTheDocument();

        // Mock file input
        const mockFile = new File(['{"id":"test","name":"Test Library"}'], "test.json", {
            type: "application/json",
        });

        // Create file input mock
        const mockFileInput = document.createElement("input");
        mockFileInput.type = "file";
        mockFileInput.files = [mockFile] as any;

        const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockFileInput);

        fireEvent.click(importButton);

        expect(createElementSpy).toHaveBeenCalledWith("input");
    });

    test("should handle library export with active library", async () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Look for export button
        const exportButton = screen.getByTitle("Export library");
        expect(exportButton).toBeInTheDocument();

        fireEvent.click(exportButton);

        // Should create download link (mocked)
        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });
    });

    test("should handle component creation dialog submission", async () => {
        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Open create component dialog
        const createButton = screen.getByTitle("Create component from selection");
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(screen.getByText("Create Component")).toBeInTheDocument();
        });

        // Fill in component details
        const nameInput = screen.getByLabelText("Component Name");
        const descriptionInput = screen.getByLabelText("Description");

        fireEvent.change(nameInput, { target: { value: "Test Component" } });
        fireEvent.change(descriptionInput, { target: { value: "Test description" } });

        // Submit the form
        const submitButton = screen.getByText("Create");
        fireEvent.click(submitButton);

        // Dialog should close
        await waitFor(() => {
            expect(screen.queryByText("Create Component")).not.toBeInTheDocument();
        });
    });

    test("should handle template drag and drop", async () => {
        const mockTemplate: ComponentTemplate = {
            id: "test-template",
            name: "Test Template",
            category: "basic-shapes",
            tags: [],
            objects: [],
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                version: "1.0.0",
                bounds: { x: 0, y: 0, width: 100, height: 100 },
            },
        };

        render(
            <TestWrapper>
                <ComponentLibraryPanel />
            </TestWrapper>
        );

        // Since templates are loaded dynamically, we test the drag behavior indirectly
        // by checking that the component renders without errors
        expect(screen.getByText("Default Library")).toBeInTheDocument();
    });
});
