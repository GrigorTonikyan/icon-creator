import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ImportControls } from "./ImportControls";

describe("ImportControls", () => {
    const defaultProps = {
        onImport: vi.fn(),
        className: "test-class",
    };

    test("should render without crashing", () => {
        render(<ImportControls {...defaultProps} />);

        expect(screen.getByText(/import svg/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /choose svg file/i })).toBeInTheDocument();
    });

    test("should apply correct CSS classes", () => {
        render(<ImportControls {...defaultProps} />);

        const container = screen.getByText(/import svg/i).closest(".ImportControls");
        expect(container).toHaveClass("ImportControls", "test-class");
    });
});
