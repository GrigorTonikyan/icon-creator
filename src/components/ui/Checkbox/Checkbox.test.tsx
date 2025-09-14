import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
    test("should render with label", () => {
        render(<Checkbox label="Accept terms" />);

        const checkbox = screen.getByRole("checkbox");
        const label = screen.getByText(/accept terms/i);

        expect(checkbox).toBeInTheDocument();
        expect(label).toBeInTheDocument();
    });

    test("should handle check/uncheck", async () => {
        const handleChange = vi.fn();
        render(<Checkbox label="Test checkbox" onChange={handleChange} />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).not.toBeChecked();

        await userEvent.click(checkbox);
        expect(handleChange).toHaveBeenCalledWith(
            expect.objectContaining({
                target: expect.objectContaining({ checked: true }),
            })
        );
    });

    test("should be controlled", () => {
        const { rerender } = render(<Checkbox checked={false} />);
        expect(screen.getByRole("checkbox")).not.toBeChecked();

        rerender(<Checkbox checked={true} />);
        expect(screen.getByRole("checkbox")).toBeChecked();
    });

    test("should display error message", () => {
        render(<Checkbox error="This field is required" />);

        const errorMessage = screen.getByText(/this field is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(screen.getByRole("checkbox").closest(".Checkbox")).toHaveClass("Checkbox--error");
    });

    test("should be disabled", () => {
        render(<Checkbox disabled label="Disabled checkbox" />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeDisabled();
        expect(checkbox.closest(".Checkbox")).toHaveClass("Checkbox--disabled");
    });

    test("should apply custom className", () => {
        render(<Checkbox className="custom-checkbox" />);

        const wrapper = screen.getByRole("checkbox").closest(".Checkbox");
        expect(wrapper).toHaveClass("Checkbox", "custom-checkbox");
    });

    test("should forward HTML input attributes", () => {
        render(<Checkbox id="test-checkbox" name="test" value="test-value" />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toHaveAttribute("id", "test-checkbox");
        expect(checkbox).toHaveAttribute("name", "test");
        expect(checkbox).toHaveAttribute("value", "test-value");
    });

    test("should work without label", () => {
        render(<Checkbox />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeInTheDocument();
        expect(screen.queryByText(/.+/)).toBeNull();
    });
});
