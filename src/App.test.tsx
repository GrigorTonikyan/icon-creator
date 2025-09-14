import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("App", () => {
    test("should render without crashing", () => {
        render(<App />);

        expect(screen.getAllByRole("heading", { level: 1, name: "Icon Creator" })).toHaveLength(2);
        expect(screen.getByText("Create and customize beautiful glowing UI icons")).toBeInTheDocument();
    });

    test("should render IconCreator component", () => {
        render(<App />);

        // IconCreator should be present (check for its distinctive elements)
        expect(screen.getByRole("button", { name: /export html/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });

    test("should have proper class structure", () => {
        render(<App />);

        const appElement = screen.getAllByRole("heading", { name: /icon creator/i })[1]?.closest(".App");
        if (appElement) {
            expect(appElement).toHaveClass("App");
        } else {
            expect(screen.getByTestId("app-root")).toHaveClass("App");
        }
    });

    test("should render configuration panel", () => {
        render(<App />);

        expect(screen.getByText("Background Colors")).toBeInTheDocument();
        expect(screen.getByText("Panel Colors")).toBeInTheDocument();
        expect(screen.getByText("Dimensions")).toBeInTheDocument();
    });

    test("should display icon preview", () => {
        render(<App />);

        const iconPreview = screen.getByRole("img", { name: /stylized glowing ui input panel/i });
        expect(iconPreview).toBeInTheDocument();
        expect(iconPreview).toHaveAttribute("aria-label");
    });
});
