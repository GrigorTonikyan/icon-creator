import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Icon } from "./Icon";

describe("Icon", () => {
    test("should render with correct icon symbol", () => {
        const { rerender } = render(<Icon name="sun" />);
        expect(screen.getByText("☀️")).toBeInTheDocument();

        rerender(<Icon name="moon" />);
        expect(screen.getByText("🌙")).toBeInTheDocument();

        rerender(<Icon name="settings" />);
        expect(screen.getByText("⚙️")).toBeInTheDocument();

        rerender(<Icon name="check" />);
        expect(screen.getByText("✓")).toBeInTheDocument();

        rerender(<Icon name="x" />);
        expect(screen.getByText("✕")).toBeInTheDocument();
    });

    test("should apply size classes", () => {
        const { rerender } = render(<Icon name="sun" size="sm" />);
        expect(screen.getByText("☀️")).toHaveClass("Icon--sm");

        rerender(<Icon name="sun" size="md" />);
        expect(screen.getByText("☀️")).toHaveClass("Icon--md");

        rerender(<Icon name="sun" size="lg" />);
        expect(screen.getByText("☀️")).toHaveClass("Icon--lg");
    });

    test("should apply medium size by default", () => {
        render(<Icon name="sun" />);
        expect(screen.getByText("☀️")).toHaveClass("Icon--md");
    });

    test("should apply custom className", () => {
        render(<Icon name="sun" className="custom-icon" />);

        const icon = screen.getByText("☀️");
        expect(icon).toHaveClass("Icon", "custom-icon");
    });

    test("should support aria-label", () => {
        render(<Icon name="sun" aria-label="Bright sun icon" />);

        const icon = screen.getByLabelText(/bright sun icon/i);
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute("role", "img");
    });

    test("should not have role when no aria-label is provided", () => {
        render(<Icon name="sun" />);

        const icon = screen.getByText("☀️");
        expect(icon).not.toHaveAttribute("role");
    });

    test("should render all available icons", () => {
        const icons = ["sun", "moon", "settings", "check", "x", "chevron-down", "chevron-up"] as const;
        const expectedSymbols = ["☀️", "🌙", "⚙️", "✓", "✕", "▼", "▲"];

        icons.forEach((iconName, index) => {
            const { unmount } = render(<Icon name={iconName} />);
            expect(screen.getByText(expectedSymbols[index]!)).toBeInTheDocument();
            unmount();
        });
    });
});
