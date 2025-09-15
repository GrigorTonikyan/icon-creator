import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import { Toolbar } from "./Toolbar";

// Test wrapper component that provides the EditorContext
const ToolbarWithProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <EditorProvider>
        <Toolbar />
        {children}
    </EditorProvider>
);

describe("Toolbar", () => {
    test("should render without crashing", () => {
        render(<ToolbarWithProvider />);
        expect(screen.getByRole("toolbar", { name: /drawing tools/i })).toBeInTheDocument();
    });

    test("should render all tool buttons", () => {
        render(<ToolbarWithProvider />);

        expect(screen.getByRole("button", { name: /select tool/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /rectangle tool/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /circle tool/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /hand tool/i })).toBeInTheDocument();
    });

    test("should have select tool active by default", () => {
        render(<ToolbarWithProvider />);

        const selectButton = screen.getByRole("button", { name: /select tool/i });
        expect(selectButton).toHaveAttribute("aria-pressed", "true");
    });

    test("should change active tool when button is clicked", async () => {
        const user = userEvent.setup();
        render(<ToolbarWithProvider />);

        const rectangleButton = screen.getByRole("button", { name: /rectangle tool/i });
        const selectButton = screen.getByRole("button", { name: /select tool/i });

        // Initially select tool should be active
        expect(selectButton).toHaveAttribute("aria-pressed", "true");
        expect(rectangleButton).toHaveAttribute("aria-pressed", "false");

        // Click rectangle tool
        await user.click(rectangleButton);

        // Rectangle tool should now be active
        expect(rectangleButton).toHaveAttribute("aria-pressed", "true");
        expect(selectButton).toHaveAttribute("aria-pressed", "false");
    });

    test("should show tool shortcuts in titles", () => {
        render(<ToolbarWithProvider />);

        expect(screen.getByRole("button", { name: /select tool/i })).toHaveAttribute("title", "Select (V)");
        expect(screen.getByRole("button", { name: /rectangle tool/i })).toHaveAttribute("title", "Rectangle (R)");
        expect(screen.getByRole("button", { name: /circle tool/i })).toHaveAttribute("title", "Circle (C)");
        expect(screen.getByRole("button", { name: /hand tool/i })).toHaveAttribute("title", "Hand (H)");
    });

    test("should be accessible via keyboard navigation", async () => {
        const user = userEvent.setup();
        render(<ToolbarWithProvider />);

        const selectButton = screen.getByRole("button", { name: /select tool/i });
        const rectangleButton = screen.getByRole("button", { name: /rectangle tool/i });

        // Tab to first button
        await user.tab();
        expect(selectButton).toHaveFocus();

        // Tab to next button
        await user.tab();
        expect(rectangleButton).toHaveFocus();

        // Press Enter to activate tool
        await user.keyboard("{Enter}");
        expect(rectangleButton).toHaveAttribute("aria-pressed", "true");
    });

    test("should have proper ARIA attributes", () => {
        render(<ToolbarWithProvider />);

        const toolbar = screen.getByRole("toolbar");
        expect(toolbar).toHaveAttribute("aria-label", "Drawing tools");

        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
            expect(button).toHaveAttribute("aria-label");
            expect(button).toHaveAttribute("aria-pressed");
        });
    });

    test("should display tool icons", () => {
        render(<ToolbarWithProvider />);

        // Check that icons are present (they have aria-hidden="true")
        const icons = document.querySelectorAll(".toolbar-tool-icon");
        expect(icons).toHaveLength(4); // One for each tool

        icons.forEach((icon) => {
            expect(icon).toHaveAttribute("aria-hidden", "true");
        });
    });
});
