import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { defaultIconConfig } from "../../types/iconConfig";
import { ConfigPanel } from "./configPanel";

describe("ConfigPanel", () => {
    test("should render without crashing", () => {
        const mockOnChange = vi.fn();
        render(<ConfigPanel config={defaultIconConfig} onChange={mockOnChange} />);

        expect(screen.getByText("Background Colors")).toBeInTheDocument();
        expect(screen.getByText("Panel Colors")).toBeInTheDocument();
        expect(screen.getByText("Input Bar")).toBeInTheDocument();
    });

    test("should call onChange when color input changes", async () => {
        const mockOnChange = vi.fn();
        render(<ConfigPanel config={defaultIconConfig} onChange={mockOnChange} />);

        const colorInput = screen.getByLabelText("Gradient Start");
        fireEvent.change(colorInput, { target: { value: "#ff0000" } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultIconConfig,
            bgGradStart: "#ff0000",
        });
    });

    test("should call onChange when text input changes", async () => {
        const mockOnChange = vi.fn();
        render(<ConfigPanel config={defaultIconConfig} onChange={mockOnChange} />);

        const textInput = screen.getByLabelText("Input Text");
        fireEvent.change(textInput, { target: { value: "custom" } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultIconConfig,
            inputText: "custom",
        });
    });

    test("should call onChange when range input changes", () => {
        const mockOnChange = vi.fn();
        render(<ConfigPanel config={defaultIconConfig} onChange={mockOnChange} />);

        const rangeInput = screen.getByLabelText("Icon Size");
        fireEvent.change(rangeInput, { target: { value: "256" } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultIconConfig,
            iconSize: 256,
        });
    });

    test("should call onChange when checkbox changes", async () => {
        const mockOnChange = vi.fn();
        render(<ConfigPanel config={defaultIconConfig} onChange={mockOnChange} />);

        const checkbox = screen.getByLabelText("Show Title");
        await userEvent.click(checkbox);

        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultIconConfig,
            showTitle: false,
        });
    });

    test("should display current range values", () => {
        const mockOnChange = vi.fn();
        render(<ConfigPanel config={defaultIconConfig} onChange={mockOnChange} />);

        expect(screen.getByText("512px")).toBeInTheDocument(); // Icon size
        expect(screen.getByText("90px")).toBeInTheDocument(); // Border radius
        expect(screen.getAllByText("50%")).toHaveLength(2); // Panel width and height
    });

    test("should apply className prop", () => {
        const mockOnChange = vi.fn();
        const { container } = render(
            <ConfigPanel config={defaultIconConfig} onChange={mockOnChange} className="test-class" />
        );

        expect(container.firstChild).toHaveClass("ConfigPanel", "test-class");
    });

    test("should handle textarea input for title", async () => {
        const mockOnChange = vi.fn();
        render(<ConfigPanel config={defaultIconConfig} onChange={mockOnChange} />);

        const textarea = screen.getByLabelText("Title Text");
        fireEvent.change(textarea, { target: { value: "New title" } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...defaultIconConfig,
            title: "New title",
        });
    });
});
