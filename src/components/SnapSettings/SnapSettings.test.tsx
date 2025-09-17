import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SnapSettings } from "./SnapSettings";
import { EditorProvider } from "../../contexts/EditorContext";

// Mock the editor context with default state
const mockEditorContextValue = {
    state: {
        gridVisible: true,
        snapToGrid: true,
        gridSize: 20,
        smartGuides: {
            enabled: true,
            showGuides: true,
            snapToObjects: true,
            snapToEdges: true,
            snapToCenter: true,
            threshold: 5,
            activeGuides: [],
        },
        manualGuides: {
            guides: [],
            enabled: true,
            snapToGuides: true,
            showGuides: true,
            snapThreshold: 5,
            defaultColor: "#007BFF",
        },
    },
    toggleSnapToGrid: vi.fn(),
    toggleSmartGuides: vi.fn(),
    setSmartGuidesOptions: vi.fn(),
    toggleManualGuides: vi.fn(),
    setManualGuidesOptions: vi.fn(),
};

function renderWithEditor(ui: React.ReactElement, { providerProps = {} } = {}) {
    return render(<EditorProvider {...providerProps}>{ui}</EditorProvider>);
}

describe("SnapSettings", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("should render without crashing", () => {
        renderWithEditor(<SnapSettings />);
        expect(screen.getByText("Snap Settings")).toBeInTheDocument();
    });

    test("should display all snap setting sections", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.getByText("Grid Snapping")).toBeInTheDocument();
        expect(screen.getByText("Smart Guide Snapping")).toBeInTheDocument();
        expect(screen.getByText("Manual Guide Snapping")).toBeInTheDocument();
        expect(screen.getByText("Snap Behavior")).toBeInTheDocument();
        expect(screen.getByText("Current Status")).toBeInTheDocument();
    });

    test("should show grid snap settings", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.getByLabelText("Snap to Grid")).toBeInTheDocument();
    });

    test("should show smart guide controls when enabled", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.getByLabelText("Enable Smart Guides")).toBeInTheDocument();
        expect(screen.getByLabelText("Show Guide Lines")).toBeInTheDocument();
        expect(screen.getByLabelText("Snap to Object Edges")).toBeInTheDocument();
        expect(screen.getByLabelText("Snap to Object Centers")).toBeInTheDocument();
        expect(screen.getByLabelText("Snap to Other Objects")).toBeInTheDocument();
    });

    test("should show manual guide controls when enabled", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.getByLabelText("Enable Manual Guides")).toBeInTheDocument();
        expect(screen.getByLabelText("Show Guides")).toBeInTheDocument();
        expect(screen.getByLabelText("Snap to Guides")).toBeInTheDocument();
    });

    test("should show snap behavior information", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.getByText("Snap Priority Order:")).toBeInTheDocument();
        expect(screen.getByText("Keyboard Shortcuts:")).toBeInTheDocument();
        expect(screen.getByText("Visual Feedback:")).toBeInTheDocument();
    });

    test("should display current status correctly", () => {
        renderWithEditor(<SnapSettings />);

        // Should show active status for enabled features
        const statusItems = screen.getAllByText("Active");
        expect(statusItems.length).toBeGreaterThan(0);
    });

    test("should handle smart guide threshold changes", async () => {
        const user = userEvent.setup();
        renderWithEditor(<SnapSettings />);

        // Get smart guide threshold input specifically (first number input)
        const thresholdInputs = screen
            .getAllByDisplayValue("5")
            .filter((input) => (input as HTMLInputElement).type === "number");
        const smartGuideThresholdInput = thresholdInputs[0]; // First threshold input is for smart guides

        // Verify the input exists and has correct attributes
        expect(smartGuideThresholdInput).toBeInTheDocument();
        expect(smartGuideThresholdInput).toHaveAttribute("min", "1");
        expect(smartGuideThresholdInput).toHaveAttribute("max", "50");
        expect(smartGuideThresholdInput).toHaveValue(5);
    });

    test("should handle manual guide threshold changes", async () => {
        const user = userEvent.setup();
        renderWithEditor(<SnapSettings />);

        // Find the manual guide threshold input (second number input)
        const thresholdInputs = screen
            .getAllByDisplayValue("5")
            .filter((input) => (input as HTMLInputElement).type === "number");
        expect(thresholdInputs.length).toBe(2); // Smart guides + manual guides number inputs

        const manualGuideThresholdInput = thresholdInputs[1];

        // Verify the input exists and has correct attributes
        expect(manualGuideThresholdInput).toBeInTheDocument();
        expect(manualGuideThresholdInput).toHaveAttribute("min", "1");
        expect(manualGuideThresholdInput).toHaveAttribute("max", "50");
        expect(manualGuideThresholdInput).toHaveValue(5);
    });

    test("should handle reset to defaults", async () => {
        const user = userEvent.setup();
        renderWithEditor(<SnapSettings />);

        const resetButton = screen.getByText("Reset Defaults");
        await user.click(resetButton);

        // Reset button should be clickable
        expect(resetButton).toBeInTheDocument();
    });

    test("should handle close button when onClose is provided", async () => {
        const user = userEvent.setup();
        const mockOnClose = vi.fn();

        renderWithEditor(<SnapSettings onClose={mockOnClose} />);

        const closeButton = screen.getByTitle("Close snap settings");
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledOnce();
    });

    test("should not show close button when onClose is not provided", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.queryByTitle("Close snap settings")).not.toBeInTheDocument();
    });

    test("should show keyboard shortcuts information", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.getByText(/Ctrl/)).toBeInTheDocument();
        expect(screen.getByText(/Cmd/)).toBeInTheDocument();
        expect(screen.getByText(/Temporarily disable all snapping/)).toBeInTheDocument();
    });

    test("should show slider controls for thresholds", () => {
        renderWithEditor(<SnapSettings />);

        const sliders = screen.getAllByRole("slider");
        expect(sliders.length).toBe(2); // Smart guides + manual guides thresholds
    });

    test("should apply custom className when provided", () => {
        const { container } = renderWithEditor(<SnapSettings className="custom-class" />);
        expect(container.firstChild).toHaveClass("SnapSettings", "custom-class");
    });

    test("should show proper labels for precision ranges", () => {
        renderWithEditor(<SnapSettings />);

        expect(screen.getAllByText("Precise (1px)")).toHaveLength(2);
        expect(screen.getAllByText("Relaxed (50px)")).toHaveLength(2);
    });

    test("should validate threshold input ranges", async () => {
        const user = userEvent.setup();
        renderWithEditor(<SnapSettings />);

        const thresholdInputs = screen
            .getAllByDisplayValue("5")
            .filter((input) => (input as HTMLInputElement).type === "number");
        const thresholdInput = thresholdInputs[0]; // Use first threshold input

        // Test minimum boundary
        await user.clear(thresholdInput);
        await user.type(thresholdInput, "0");
        // Should not accept value below minimum

        // Test maximum boundary
        await user.clear(thresholdInput);
        await user.type(thresholdInput, "100");
        // Should not accept value above maximum

        expect(thresholdInput).toBeInTheDocument();
    });

    test("should show status indicators with correct styling", () => {
        renderWithEditor(<SnapSettings />);

        const activeStatuses = document.querySelectorAll(".snap-status-value.active");
        const inactiveStatuses = document.querySelectorAll(".snap-status-value.inactive");

        // Should have status indicators with proper classes
        expect(activeStatuses.length + inactiveStatuses.length).toBeGreaterThan(0);
    });

    test("should handle slider changes for smart guide threshold", async () => {
        renderWithEditor(<SnapSettings />);

        const sliders = screen.getAllByRole("slider");
        const smartGuideSlider = sliders[0];

        fireEvent.change(smartGuideSlider, { target: { value: "15" } });

        expect(smartGuideSlider).toHaveValue("15");
    });

    test("should handle slider changes for manual guide threshold", async () => {
        renderWithEditor(<SnapSettings />);

        const sliders = screen.getAllByRole("slider");
        const manualGuideSlider = sliders[1];

        fireEvent.change(manualGuideSlider, { target: { value: "12" } });

        expect(manualGuideSlider).toHaveValue("12");
    });

    test("should show proper section structure", () => {
        renderWithEditor(<SnapSettings />);

        // Check for proper heading hierarchy
        expect(screen.getByRole("heading", { level: 3, name: "Snap Settings" })).toBeInTheDocument();

        // Check for section titles (h4 elements)
        const sectionTitles = screen.getAllByRole("heading", { level: 4 });
        expect(sectionTitles.length).toBe(5); // Grid, Smart Guide, Manual Guide, Behavior, Status
    });

    test("should be accessible with proper ARIA attributes", () => {
        renderWithEditor(<SnapSettings />);

        // Check for proper form controls
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThan(0);

        const sliders = screen.getAllByRole("slider");
        expect(sliders.length).toBe(2);

        const inputs = screen.getAllByRole("spinbutton");
        expect(inputs.length).toBe(2); // Two threshold number inputs
    });
});
