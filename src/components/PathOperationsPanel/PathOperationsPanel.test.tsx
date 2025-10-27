import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PathOperationsPanel } from "./PathOperationsPanel";
import type { PathObject } from "../../types/editor";

// Mock the PathOperations utility
vi.mock("../../utils/PathOperations", () => ({
    pathOperations: {
        performBooleanOperation: vi.fn(),
        simplifyPath: vi.fn(),
        smoothPath: vi.fn(),
        offsetPath: vi.fn(),
        reversePath: vi.fn(),
        convertToAbsolute: vi.fn(),
        analyzePath: vi.fn(),
    },
}));

describe("PathOperationsPanel", () => {
    let mockPath1: PathObject;
    let mockPath2: PathObject;
    let mockOnPathCreated: ReturnType<typeof vi.fn>;
    let mockOnError: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockPath1 = {
            id: "path1",
            type: "path",
            name: "Test Path 1",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            layerId: "default",
            pathData: "M0,0 L100,0 L100,100 L0,100 Z",
            style: {
                fill: "#ff0000",
                stroke: "#000000",
                strokeWidth: 2,
            },
        };

        mockPath2 = {
            id: "path2",
            type: "path",
            name: "Test Path 2",
            transform: { x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 1,
            layerId: "default",
            pathData: "M50,50 L150,50 L150,150 L50,150 Z",
            style: {
                fill: "#00ff00",
                stroke: "#000000",
                strokeWidth: 2,
            },
        };

        mockOnPathCreated = vi.fn();
        mockOnError = vi.fn();

        vi.clearAllMocks();
    });

    describe("Rendering", () => {
        test("should render with no selection message when no paths selected", () => {
            render(<PathOperationsPanel selectedPaths={[]} onPathCreated={mockOnPathCreated} onError={mockOnError} />);

            expect(screen.getByText("Path Operations")).toBeInTheDocument();
            expect(screen.getByText("0 paths selected")).toBeInTheDocument();
            expect(screen.getByText("Select one or more paths to enable operations")).toBeInTheDocument();
        });

        test("should render boolean operations when multiple paths selected", () => {
            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1, mockPath2]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            expect(screen.getByText("2 paths selected")).toBeInTheDocument();
            expect(screen.getByText("Boolean Operations")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /unite/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /subtract/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /intersect/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /exclude/i })).toBeInTheDocument();
        });

        test("should render single path operations when one path selected", () => {
            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            expect(screen.getByText("1 path selected")).toBeInTheDocument();
            expect(screen.getByText("Path Modifications")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /simplify/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /smooth/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /reverse/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /to absolute/i })).toBeInTheDocument();
        });

        test("should render path analysis when one path selected", () => {
            const { pathOperations } = require("../../utils/PathOperations");
            pathOperations.analyzePath.mockReturnValue({
                success: true,
                analysis: {
                    length: 400,
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    nodeCount: 5,
                    isClosed: true,
                    complexity: "simple",
                    validation: { isValid: true, errors: [] },
                },
            });

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            expect(screen.getByText("Path Analysis")).toBeInTheDocument();
            expect(screen.getByText("400.00px")).toBeInTheDocument();
            expect(screen.getByText("5")).toBeInTheDocument();
            expect(screen.getByText("Yes")).toBeInTheDocument();
            expect(screen.getByText("simple")).toBeInTheDocument();
        });
    });

    describe("Boolean Operations", () => {
        test("should perform unite operation", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockResult = {
                success: true,
                result: { ...mockPath1, id: "united-path", name: "unite-result" },
            };
            pathOperations.performBooleanOperation.mockResolvedValue(mockResult);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1, mockPath2]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            const uniteButton = screen.getByRole("button", { name: /unite/i });
            fireEvent.click(uniteButton);

            await waitFor(() => {
                expect(pathOperations.performBooleanOperation).toHaveBeenCalledWith("unite", [mockPath1, mockPath2]);
                expect(mockOnPathCreated).toHaveBeenCalledWith(mockResult.result);
            });
        });

        test("should handle boolean operation failure", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockError = { success: false, error: "Operation failed" };
            pathOperations.performBooleanOperation.mockResolvedValue(mockError);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1, mockPath2]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            const subtractButton = screen.getByRole("button", { name: /subtract/i });
            fireEvent.click(subtractButton);

            await waitFor(() => {
                expect(mockOnError).toHaveBeenCalledWith("Operation failed");
            });
        });
    });

    describe("Single Path Operations", () => {
        test("should perform simplify operation", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockResult = {
                success: true,
                result: { ...mockPath1, id: "simplified-path", name: "simplified-result" },
            };
            pathOperations.simplifyPath.mockResolvedValue(mockResult);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            const simplifyButton = screen.getByRole("button", { name: /simplify/i });
            fireEvent.click(simplifyButton);

            await waitFor(() => {
                expect(pathOperations.simplifyPath).toHaveBeenCalledWith(mockPath1, expect.any(Object));
                expect(mockOnPathCreated).toHaveBeenCalledWith(mockResult.result);
            });
        });

        test("should perform smooth operation", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockResult = {
                success: true,
                result: { ...mockPath1, id: "smoothed-path", name: "smoothed-result" },
            };
            pathOperations.smoothPath.mockResolvedValue(mockResult);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            const smoothButton = screen.getByRole("button", { name: /smooth/i });
            fireEvent.click(smoothButton);

            await waitFor(() => {
                expect(pathOperations.smoothPath).toHaveBeenCalledWith(mockPath1, expect.any(Object));
                expect(mockOnPathCreated).toHaveBeenCalledWith(mockResult.result);
            });
        });

        test("should perform reverse operation", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockResult = {
                success: true,
                result: { ...mockPath1, id: "reversed-path", name: "reversed-result" },
            };
            pathOperations.reversePath.mockResolvedValue(mockResult);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            const reverseButton = screen.getByRole("button", { name: /reverse/i });
            fireEvent.click(reverseButton);

            await waitFor(() => {
                expect(pathOperations.reversePath).toHaveBeenCalledWith(mockPath1);
                expect(mockOnPathCreated).toHaveBeenCalledWith(mockResult.result);
            });
        });
    });

    describe("Advanced Options", () => {
        test("should toggle advanced options visibility", () => {
            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            // Advanced options should be hidden initially
            expect(screen.queryByText("Simplify Options")).not.toBeInTheDocument();

            // Click toggle button
            const toggleButton = screen.getByRole("button", { name: /show advanced options/i });
            fireEvent.click(toggleButton);

            // Advanced options should now be visible
            expect(screen.getByText("Simplify Options")).toBeInTheDocument();
            expect(screen.getByText("Smooth Options")).toBeInTheDocument();
            expect(screen.getByText("Offset Options")).toBeInTheDocument();

            // Button text should change
            expect(screen.getByRole("button", { name: /hide advanced options/i })).toBeInTheDocument();
        });

        test("should update simplify options", () => {
            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            // Show advanced options
            const toggleButton = screen.getByRole("button", { name: /show advanced options/i });
            fireEvent.click(toggleButton);

            // Update tolerance
            const toleranceInput = screen.getByLabelText(/tolerance/i);
            fireEvent.change(toleranceInput, { target: { value: "2.5" } });

            expect(toleranceInput).toHaveValue(2.5);

            // Update preserve corners checkbox
            const preserveCornersCheckbox = screen.getByLabelText(/preserve corners/i);
            fireEvent.click(preserveCornersCheckbox);

            expect(preserveCornersCheckbox).toBeChecked();
        });

        test("should perform offset operation with custom options", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockResult = {
                success: true,
                result: { ...mockPath1, id: "offset-path", name: "offset-result" },
            };
            pathOperations.offsetPath.mockResolvedValue(mockResult);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            // Show advanced options
            const toggleButton = screen.getByRole("button", { name: /show advanced options/i });
            fireEvent.click(toggleButton);

            // Update offset distance
            const offsetInput = screen.getByLabelText(/offset distance/i);
            fireEvent.change(offsetInput, { target: { value: "15" } });

            // Update join type
            const joinSelect = screen.getByLabelText(/join type/i);
            fireEvent.change(joinSelect, { target: { value: "miter" } });

            // Apply offset
            const offsetButton = screen.getByRole("button", { name: /apply offset/i });
            fireEvent.click(offsetButton);

            await waitFor(() => {
                expect(pathOperations.offsetPath).toHaveBeenCalledWith(
                    mockPath1,
                    15,
                    expect.objectContaining({ joinType: "miter" })
                );
                expect(mockOnPathCreated).toHaveBeenCalledWith(mockResult.result);
            });
        });
    });

    describe("Operation History", () => {
        test("should display operation history after operations", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockResult = {
                success: true,
                result: { ...mockPath1, id: "simplified-path", name: "simplified-result" },
            };
            pathOperations.simplifyPath.mockResolvedValue(mockResult);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            // Perform operation
            const simplifyButton = screen.getByRole("button", { name: /simplify/i });
            fireEvent.click(simplifyButton);

            await waitFor(() => {
                expect(screen.getByText("Recent Operations")).toBeInTheDocument();
                expect(screen.getByText("Simplify")).toBeInTheDocument();
                expect(screen.getByText("✓")).toBeInTheDocument();
            });
        });

        test("should display error operations in history", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            const mockError = { success: false, error: "Simplification failed" };
            pathOperations.simplifyPath.mockResolvedValue(mockError);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            // Perform operation that fails
            const simplifyButton = screen.getByRole("button", { name: /simplify/i });
            fireEvent.click(simplifyButton);

            await waitFor(() => {
                expect(screen.getByText("Recent Operations")).toBeInTheDocument();
                expect(screen.getByText("Simplify")).toBeInTheDocument();
                expect(screen.getByText("✗")).toBeInTheDocument();
                expect(screen.getByTitle("Simplification failed")).toBeInTheDocument();
            });
        });
    });

    describe("Loading States", () => {
        test("should show processing state during operations", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            let resolvePromise: (value: any) => void;
            const mockPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            pathOperations.simplifyPath.mockReturnValue(mockPromise);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            const simplifyButton = screen.getByRole("button", { name: /simplify/i });
            fireEvent.click(simplifyButton);

            // Should show processing state
            expect(screen.getByText("Processing...")).toBeInTheDocument();

            // Resolve the promise
            resolvePromise!({ success: true, result: mockPath1 });

            await waitFor(() => {
                expect(screen.queryByText("Processing...")).not.toBeInTheDocument();
            });
        });

        test("should disable buttons during processing", async () => {
            const { pathOperations } = require("../../utils/PathOperations");
            let resolvePromise: (value: any) => void;
            const mockPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            pathOperations.simplifyPath.mockReturnValue(mockPromise);

            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            const simplifyButton = screen.getByRole("button", { name: /simplify/i });
            const smoothButton = screen.getByRole("button", { name: /smooth/i });

            fireEvent.click(simplifyButton);

            // All buttons should be disabled during processing
            expect(simplifyButton).toBeDisabled();
            expect(smoothButton).toBeDisabled();

            // Resolve the promise
            resolvePromise!({ success: true, result: mockPath1 });

            await waitFor(() => {
                expect(simplifyButton).not.toBeDisabled();
                expect(smoothButton).not.toBeDisabled();
            });
        });
    });

    describe("Accessibility", () => {
        test("should have proper ARIA labels and roles", () => {
            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1, mockPath2]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            // Check button roles and accessibility
            const buttons = screen.getAllByRole("button");
            expect(buttons.length).toBeGreaterThan(0);

            buttons.forEach((button) => {
                expect(button).toBeVisible();
                expect(button).not.toHaveAttribute("aria-hidden", "true");
            });
        });

        test("should have proper form labels", () => {
            render(
                <PathOperationsPanel
                    selectedPaths={[mockPath1]}
                    onPathCreated={mockOnPathCreated}
                    onError={mockOnError}
                />
            );

            // Show advanced options to access form inputs
            const toggleButton = screen.getByRole("button", { name: /show advanced options/i });
            fireEvent.click(toggleButton);

            // Check that inputs have proper labels
            const toleranceInput = screen.getByLabelText(/tolerance/i);
            const smoothingInput = screen.getByLabelText(/smoothing factor/i);
            const offsetInput = screen.getByLabelText(/offset distance/i);

            expect(toleranceInput).toBeInTheDocument();
            expect(smoothingInput).toBeInTheDocument();
            expect(offsetInput).toBeInTheDocument();
        });
    });
});
