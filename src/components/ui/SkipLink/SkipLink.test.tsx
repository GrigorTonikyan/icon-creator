import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { SkipLink } from "./SkipLink";

describe("SkipLink", () => {
    test("should render skip link with correct href and text", () => {
        render(<SkipLink href="#main-content">Skip to main content</SkipLink>);

        const link = screen.getByRole("link", { name: /skip to main content/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "#main-content");
    });

    test("should apply custom className", () => {
        render(
            <SkipLink href="#navigation" className="custom-skip">
                Skip to navigation
            </SkipLink>
        );

        const link = screen.getByRole("link");
        expect(link).toHaveClass("SkipLink", "custom-skip");
    });

    test("should be focusable for keyboard navigation", async () => {
        const user = userEvent.setup();
        render(<SkipLink href="#main-content">Skip to main content</SkipLink>);

        const link = screen.getByRole("link");

        // Tab to focus the link
        await user.tab();
        expect(link).toHaveFocus();
    });

    test("should support different target hrefs", () => {
        const { rerender } = render(<SkipLink href="#main-content">Skip to main</SkipLink>);

        let link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "#main-content");

        rerender(<SkipLink href="#navigation">Skip to nav</SkipLink>);
        link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "#navigation");
    });
});
