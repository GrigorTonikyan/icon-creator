import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { defaultIconConfig } from "../../types/iconConfig";
import { IconPreview } from "./iconPreview";

describe("IconPreview", () => {
    test("should render without crashing", () => {
        render(<IconPreview config={defaultIconConfig} />);

        const icon = screen.getByRole("img");
        expect(icon).toBeInTheDocument();
    });

    test("should display title when showTitle is true", () => {
        render(<IconPreview config={defaultIconConfig} />);

        expect(screen.getByText(defaultIconConfig.title)).toBeInTheDocument();
    });

    test("should not display title when showTitle is false", () => {
        const config = { ...defaultIconConfig, showTitle: false };
        render(<IconPreview config={config} />);

        expect(screen.queryByText(defaultIconConfig.title)).not.toBeInTheDocument();
    });

    test("should apply custom CSS variables from config", () => {
        const customConfig = {
            ...defaultIconConfig,
            bgGradStart: "#ff0000",
            accent: "#00ff00",
            iconSize: 256,
        };

        render(<IconPreview config={customConfig} />);

        const icon = screen.getByRole("img");
        expect(icon).toHaveStyle("--bg-grad-start: #ff0000");
        expect(icon).toHaveStyle("--accent: #00ff00");
        expect(icon).toHaveAttribute("data-size", "256");
    });

    test("should display custom input text", () => {
        const config = { ...defaultIconConfig, inputText: "custom" };
        render(<IconPreview config={config} />);

        const inputBar = screen.getByRole("img").querySelector(".input-bar");
        expect(inputBar).toHaveAttribute("data-text", "custom");
    });

    test("should apply className prop", () => {
        const { container } = render(<IconPreview config={defaultIconConfig} className="test-class" />);

        expect(container.firstChild).toHaveClass("IconPreview", "test-class");
    });

    test("should have proper accessibility attributes", () => {
        render(<IconPreview config={defaultIconConfig} />);

        const icon = screen.getByRole("img");
        expect(icon).toHaveAttribute("aria-label", defaultIconConfig.title);
    });
});
