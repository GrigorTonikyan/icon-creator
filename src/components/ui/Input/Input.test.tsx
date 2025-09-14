import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
    test("should render text input by default", () => {
        render(<Input placeholder="Enter text" />);

        const input = screen.getByPlaceholderText(/enter text/i);
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("type", "text");
    });

    test("should render with label", () => {
        render(<Input label="Username" />);

        const label = screen.getByText(/username/i);
        const input = screen.getByLabelText(/username/i);

        expect(label).toBeInTheDocument();
        expect(input).toBeInTheDocument();
    });

    test("should render color input variant", () => {
        render(<Input variant="color" value="#ff0000" />);

        const input = screen.getByDisplayValue("#ff0000");
        expect(input).toHaveAttribute("type", "color");
        expect(input).toHaveClass("Input--color");
    });

    test("should render range input variant with value display", () => {
        render(<Input variant="range" min={0} max={100} value={50} showValue />);

        const input = screen.getByDisplayValue("50");
        expect(input).toHaveAttribute("type", "range");
        expect(input).toHaveClass("Input--range");
        expect(screen.getByText("50")).toBeInTheDocument();
    });

    test("should handle change events", async () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "test");

        expect(handleChange).toHaveBeenCalled();
    });

    test("should display error message", () => {
        render(<Input error="This field is required" />);

        const errorMessage = screen.getByText(/this field is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(screen.getByRole("textbox")).toHaveClass("Input--error");
    });

    test("should apply custom className", () => {
        render(<Input className="custom-input" />);

        const input = screen.getByRole("textbox");
        expect(input).toHaveClass("custom-input");
    });

    test("should support different input types", () => {
        const { rerender } = render(<Input type="email" />);
        expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

        rerender(<Input type="password" />);
        expect(screen.getByDisplayValue("")).toHaveAttribute("type", "password");

        rerender(<Input type="number" />);
        expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");
    });

    test("should forward HTML input attributes", () => {
        render(<Input id="test-input" placeholder="Test" disabled />);

        const input = screen.getByRole("textbox");
        expect(input).toHaveAttribute("id", "test-input");
        expect(input).toHaveAttribute("placeholder", "Test");
        expect(input).toBeDisabled();
    });
});
