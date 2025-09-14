import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
    test("should render with children", () => {
        render(<Button>Click me</Button>);

        const button = screen.getByRole("button", { name: /click me/i });
        expect(button).toBeInTheDocument();
    });

    test("should apply variant classes", () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByRole("button")).toHaveClass("Button--primary");

        rerender(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole("button")).toHaveClass("Button--secondary");

        rerender(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole("button")).toHaveClass("Button--ghost");

        rerender(<Button variant="icon">Icon</Button>);
        expect(screen.getByRole("button")).toHaveClass("Button--icon");
    });

    test("should apply size classes", () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole("button")).toHaveClass("Button--sm");

        rerender(<Button size="md">Medium</Button>);
        expect(screen.getByRole("button")).toHaveClass("Button--md");

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole("button")).toHaveClass("Button--lg");
    });

    test("should handle click events", async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        const button = screen.getByRole("button");
        await userEvent.click(button);

        expect(handleClick).toHaveBeenCalledOnce();
    });

    test("should be disabled when disabled prop is true", () => {
        render(<Button disabled>Disabled</Button>);

        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
        expect(button).toHaveClass("Button--disabled");
    });

    test("should show loading state", () => {
        render(<Button isLoading>Loading</Button>);

        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
        expect(button).toHaveClass("Button--loading");
        expect(screen.queryByText("Loading")).not.toBeInTheDocument();
        expect(button.querySelector(".Button__spinner")).toBeInTheDocument();
    });

    test("should apply custom className", () => {
        render(<Button className="custom-class">Button</Button>);

        const button = screen.getByRole("button");
        expect(button).toHaveClass("Button", "custom-class");
    });

    test("should forward HTML button attributes", () => {
        render(
            <Button type="submit" id="test-button">
                Submit
            </Button>
        );

        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("type", "submit");
        expect(button).toHaveAttribute("id", "test-button");
    });
});
