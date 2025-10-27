import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vitest";
import type { ShapeGenerator, ShapeParameter } from "../../types/editor";
import { CustomShapePanel } from "./CustomShapePanel";

// Mock the shape library
vi.mock("../../utils/ShapeLibrary", () => ({
    shapeLibrary: {
        getState: vi.fn(() => ({
            generators: {
                polygon: mockPolygonGenerator,
                star: mockStarGenerator,
                gear: mockGearGenerator,
            },
            activeGenerator: "polygon",
            parameterValues: {
                polygon: { sides: 6, radius: 50 },
                star: { points: 5, innerRadius: 25, outerRadius: 50 },
                gear: { teeth: 8, toothDepth: 10, holeRadius: 15 },
            },
            previewMode: false,
            lastUsed: ["polygon", "star"],
            favorites: ["star"],
            categories: ["basic-shapes", "mechanical"],
        })),
        searchGenerators: vi.fn((query: string) => {
            if (query.toLowerCase().includes("star")) {
                return [mockStarGenerator];
            }
            return [mockPolygonGenerator, mockStarGenerator, mockGearGenerator];
        }),
        setActiveGenerator: vi.fn(),
        updateParameter: vi.fn(),
        generateShape: vi.fn(() => ({
            success: true,
            pathData: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
            metadata: { type: "polygon", sides: 6 },
        })),
        addToFavorites: vi.fn(),
        removeFromFavorites: vi.fn(),
        savePreset: vi.fn(),
        loadPreset: vi.fn(),
        deletePreset: vi.fn(),
    },
}));

// Mock generators
const mockPolygonGenerator: ShapeGenerator = {
    config: {
        id: "polygon",
        name: "Polygon",
        description: "Regular polygon with customizable sides",
        category: "basic-shapes",
        version: "1.0.0",
        parameters: [
            {
                id: "sides",
                name: "Sides",
                type: "number",
                value: 6,
                min: 3,
                max: 20,
                step: 1,
                description: "Number of sides",
            },
            {
                id: "radius",
                name: "Radius",
                type: "range",
                value: 50,
                min: 10,
                max: 100,
                step: 1,
                description: "Radius of the polygon",
            },
        ],
    },
    generate: vi.fn(() => ({
        success: true,
        shape: {
            pathData: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
            metadata: { bounds: { x: 0, y: 0, width: 100, height: 100 } },
        },
    })),
};

const mockStarGenerator: ShapeGenerator = {
    config: {
        id: "star",
        name: "Star",
        description: "Star shape with customizable points",
        category: "basic-shapes",
        version: "1.0.0",
        parameters: [
            {
                id: "points",
                name: "Points",
                type: "number",
                value: 5,
                min: 3,
                max: 12,
                step: 1,
                description: "Number of star points",
            },
            {
                id: "innerRadius",
                name: "Inner Radius",
                type: "range",
                value: 25,
                min: 5,
                max: 80,
                step: 1,
                description: "Inner radius of the star",
            },
            {
                id: "outerRadius",
                name: "Outer Radius",
                type: "range",
                value: 50,
                min: 10,
                max: 100,
                step: 1,
                description: "Outer radius of the star",
            },
        ],
    },
    generate: vi.fn(() => ({
        success: true,
        shape: {
            pathData: "M 50 10 L 60 40 L 90 40 L 70 60 L 80 90 L 50 75 L 20 90 L 30 60 L 10 40 L 40 40 Z",
            metadata: { bounds: { x: 10, y: 10, width: 80, height: 80 } },
        },
    })),
};

const mockGearGenerator: ShapeGenerator = {
    config: {
        id: "gear",
        name: "Gear",
        description: "Mechanical gear with teeth",
        category: "mechanical",
        version: "1.0.0",
        parameters: [
            {
                id: "teeth",
                name: "Teeth",
                type: "number",
                value: 8,
                min: 6,
                max: 24,
                step: 1,
                description: "Number of gear teeth",
            },
            {
                id: "toothDepth",
                name: "Tooth Depth",
                type: "range",
                value: 10,
                min: 5,
                max: 20,
                step: 1,
                description: "Depth of the gear teeth",
            },
            {
                id: "fillColor",
                name: "Fill Color",
                type: "color",
                value: "#666666",
                description: "Fill color of the gear",
            },
            {
                id: "showCenter",
                name: "Show Center Hole",
                type: "boolean",
                value: true,
                description: "Show center hole in gear",
            },
            {
                id: "style",
                name: "Style",
                type: "select",
                value: "modern",
                options: ["classic", "modern", "industrial"],
                description: "Gear style",
            },
        ],
    },
    generate: vi.fn(() => ({
        success: true,
        shape: {
            pathData: "M 30 10 L 70 10 L 80 30 L 70 50 L 30 50 L 20 30 Z",
            metadata: { bounds: { x: 20, y: 10, width: 60, height: 40 } },
        },
    })),
};

describe("CustomShapePanel", () => {
    const defaultProps = {
        onShapeGenerated: vi.fn(),
        onError: vi.fn(),
        className: "test-class",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Basic Rendering", () => {
        test("should render component library interface", () => {
            render(<CustomShapePanel {...defaultProps} />);

            expect(screen.getByText("Custom Shapes")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("Search shapes...")).toBeInTheDocument();
            expect(screen.getByText("All")).toBeInTheDocument();
            expect(screen.getByText("Favorites")).toBeInTheDocument();
            expect(screen.getByText("Recent")).toBeInTheDocument();
        });

        test("should render generator grid", () => {
            render(<CustomShapePanel {...defaultProps} />);

            expect(screen.getByText("Polygon")).toBeInTheDocument();
            expect(screen.getByText("Star")).toBeInTheDocument();
            expect(screen.getByText("Gear")).toBeInTheDocument();
        });

        test("should apply custom className", () => {
            const { container } = render(<CustomShapePanel {...defaultProps} />);

            const component = container.querySelector(".CustomShapePanel");
            expect(component).toHaveClass("CustomShapePanel", "test-class");
        });
    });

    describe("Parameter Controls", () => {
        test("should render parameter controls for active generator", () => {
            render(<CustomShapePanel {...defaultProps} />);

            // Should show polygon parameters (active generator)
            expect(screen.getByLabelText("Sides")).toBeInTheDocument();
            expect(screen.getByLabelText(/Radius/)).toBeInTheDocument();
        });

        test("should render number parameter control", () => {
            render(<CustomShapePanel {...defaultProps} />);

            const sidesInput = screen.getByLabelText("Sides");
            expect(sidesInput).toHaveAttribute("type", "number");
            expect(sidesInput).toHaveAttribute("min", "3");
            expect(sidesInput).toHaveAttribute("max", "20");
            expect(sidesInput).toHaveAttribute("step", "1");
            expect(sidesInput).toHaveValue(6);
        });

        test("should render range parameter control", () => {
            render(<CustomShapePanel {...defaultProps} />);

            const radiusInput = screen.getByLabelText(/Radius/);
            expect(radiusInput).toHaveAttribute("type", "range");
            expect(radiusInput).toHaveAttribute("min", "10");
            expect(radiusInput).toHaveAttribute("max", "100");
            expect(radiusInput).toHaveValue("50");
        });

        test("should render color parameter control", async () => {
            // Mock gear as active generator to test color parameter
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            vi.mocked(shapeLibrary.getState).mockReturnValue({
                generators: { gear: mockGearGenerator },
                activeGenerator: "gear",
                parameterValues: { gear: { fillColor: "#666666" } },
                previewMode: false,
                lastUsed: ["gear"],
                favorites: [],
                categories: ["mechanical"],
            });

            render(<CustomShapePanel {...defaultProps} />);

            const colorInput = screen.getByLabelText("Fill Color");
            expect(colorInput).toHaveAttribute("type", "color");
            expect(colorInput).toHaveValue("#666666");
        });

        test("should render boolean parameter control", async () => {
            // Mock gear as active generator to test boolean parameter
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            vi.mocked(shapeLibrary.getState).mockReturnValue({
                generators: { gear: mockGearGenerator },
                activeGenerator: "gear",
                parameterValues: { gear: { showCenter: true } },
                previewMode: false,
                lastUsed: ["gear"],
                favorites: [],
                categories: ["mechanical"],
            });

            render(<CustomShapePanel {...defaultProps} />);

            const checkbox = screen.getByLabelText("Show Center Hole");
            expect(checkbox).toHaveAttribute("type", "checkbox");
            expect(checkbox).toBeChecked();
        });

        test("should render select parameter control", async () => {
            // Mock gear as active generator to test select parameter
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            vi.mocked(shapeLibrary.getState).mockReturnValue({
                generators: { gear: mockGearGenerator },
                activeGenerator: "gear",
                parameterValues: { gear: { style: "modern" } },
                previewMode: false,
                lastUsed: ["gear"],
                favorites: [],
                categories: ["mechanical"],
            });

            render(<CustomShapePanel {...defaultProps} />);

            const select = screen.getByLabelText("Style");
            expect(select.tagName).toBe("SELECT");
            expect(select).toHaveValue("modern");
            expect(screen.getByText("classic")).toBeInTheDocument();
            expect(screen.getByText("modern")).toBeInTheDocument();
            expect(screen.getByText("industrial")).toBeInTheDocument();
        });
    });

    describe("User Interactions", () => {
        test("should handle search input", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search shapes...");
            await user.type(searchInput, "star");

            expect(searchInput).toHaveValue("star");
        });

        test("should handle generator selection", async () => {
            const user = userEvent.setup();
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            render(<CustomShapePanel {...defaultProps} />);

            const starButton = screen.getByText("Star");
            await user.click(starButton);

            expect(shapeLibrary.setActiveGenerator).toHaveBeenCalledWith("star");
        });

        test("should handle parameter changes", async () => {
            const user = userEvent.setup();
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            render(<CustomShapePanel {...defaultProps} />);

            const sidesInput = screen.getByLabelText("Sides");
            await user.clear(sidesInput);
            await user.type(sidesInput, "8");

            expect(shapeLibrary.updateParameters).toHaveBeenCalledWith("polygon", "sides", 8);
        });

        test("should handle range parameter changes", async () => {
            const user = userEvent.setup();
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            render(<CustomShapePanel {...defaultProps} />);

            const radiusInput = screen.getByLabelText(/Radius/);
            fireEvent.change(radiusInput, { target: { value: "75" } });

            expect(shapeLibrary.updateParameters).toHaveBeenCalledWith("polygon", "radius", 75);
        });

        test("should handle generate button click", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const generateButton = screen.getByText("Generate Shape");
            await user.click(generateButton);

            expect(defaultProps.onShapeGenerated).toHaveBeenCalledWith(
                "M 0 0 L 100 0 L 100 100 L 0 100 Z",
                expect.any(Object),
                { type: "polygon", sides: 6 }
            );
        });

        test("should handle favorites toggle", async () => {
            const user = userEvent.setup();
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            render(<CustomShapePanel {...defaultProps} />);

            // Click on polygon generator to test favorite toggle
            const polygonFavoriteButton = screen
                .getByText("Polygon")
                .closest(".generator-item")
                ?.querySelector("[title='Add to favorites']");
            expect(polygonFavoriteButton).toBeInTheDocument();

            await user.click(polygonFavoriteButton!);
            expect(shapeLibrary.addToFavorites).toHaveBeenCalledWith("polygon");
        });
    });

    describe("Filter Options", () => {
        test("should show favorites filter", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const favoritesFilter = screen.getByText("Favorites");
            await user.click(favoritesFilter);

            expect(favoritesFilter.closest("button")).toHaveClass("filter-option", "filter-option--active");
        });

        test("should show recent filter", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const recentFilter = screen.getByText("Recent");
            await user.click(recentFilter);

            expect(recentFilter.closest("button")).toHaveClass("filter-option", "filter-option--active");
        });

        test("should filter by category", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const categoryDropdown = screen.getByRole("combobox");
            await user.selectOptions(categoryDropdown, "basic-shapes");

            expect(categoryDropdown).toHaveValue("basic-shapes");
        });
    });

    describe("Preset Management", () => {
        test("should show preset controls", () => {
            render(<CustomShapePanel {...defaultProps} />);

            const presetButton = screen.getByText("Presets");
            expect(presetButton).toBeInTheDocument();
        });

        test("should handle preset save", async () => {
            const user = userEvent.setup();
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            render(<CustomShapePanel {...defaultProps} />);

            // Open presets panel
            const presetButton = screen.getByText("Presets");
            await user.click(presetButton);

            // Mock save preset dialog
            const saveButton = screen.getByText("Save Current");
            await user.click(saveButton);

            expect(shapeLibrary.savePreset).toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        test("should handle generation errors", async () => {
            const user = userEvent.setup();
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");

            // Mock error response
            vi.mocked(shapeLibrary.generateShape).mockReturnValue({
                success: false,
                error: "Invalid parameters",
            });

            render(<CustomShapePanel {...defaultProps} />);

            const generateButton = screen.getByText("Generate Shape");
            await user.click(generateButton);

            expect(defaultProps.onError).toHaveBeenCalledWith("Invalid parameters");
        });

        test("should handle invalid parameter values", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const sidesInput = screen.getByLabelText("Sides");
            await user.clear(sidesInput);
            await user.type(sidesInput, "abc");

            // Should maintain previous value when invalid
            expect(sidesInput).toHaveValue(6);
        });
    });

    describe("Loading States", () => {
        test("should show generating state", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const generateButton = screen.getByText("Generate Shape");
            await user.click(generateButton);

            // Should briefly show generating state
            await waitFor(
                () => {
                    expect(generateButton).toBeDisabled();
                },
                { timeout: 100 }
            );
        });
    });

    describe("Accessibility", () => {
        test("should have proper form labels", () => {
            render(<CustomShapePanel {...defaultProps} />);

            const sidesInput = screen.getByLabelText("Sides");
            const radiusInput = screen.getByLabelText(/Radius/);

            expect(sidesInput).toBeInTheDocument();
            expect(radiusInput).toBeInTheDocument();
        });

        test("should have proper button roles", () => {
            render(<CustomShapePanel {...defaultProps} />);

            const generateButton = screen.getByRole("button", { name: "Generate Shape" });
            const allFilter = screen.getByRole("button", { name: "All" });
            const favoritesFilter = screen.getByRole("button", { name: "Favorites" });

            expect(generateButton).toBeInTheDocument();
            expect(allFilter).toBeInTheDocument();
            expect(favoritesFilter).toBeInTheDocument();
        });

        test("should have description tooltips", () => {
            render(<CustomShapePanel {...defaultProps} />);

            const tooltips = screen.getAllByText("ℹ️");
            expect(tooltips.length).toBeGreaterThan(0);

            // Check that tooltips have title attributes
            tooltips.forEach((tooltip) => {
                expect(tooltip).toHaveAttribute("title");
            });
        });
    });

    describe("Preview Functionality", () => {
        test("should show live preview", () => {
            render(<CustomShapePanel {...defaultProps} />);

            const previewArea = screen.getByText("Preview");
            expect(previewArea).toBeInTheDocument();
        });

        test("should update preview on parameter change", async () => {
            const user = userEvent.setup();
            render(<CustomShapePanel {...defaultProps} />);

            const sidesInput = screen.getByLabelText("Sides");
            await user.clear(sidesInput);
            await user.type(sidesInput, "8");

            // Preview should update (tested by checking if generateShape was called for preview)
            const { shapeLibrary } = await import("../../utils/ShapeLibrary");
            expect(shapeLibrary.generateShape).toHaveBeenCalled();
        });
    });
});
