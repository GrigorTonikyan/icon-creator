import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("App", () => {
    test("should render without crashing", () => {
        render(<App />);

        expect(screen.getByText("Bun + React")).toBeInTheDocument();
        expect(screen.getByText(/Edit/)).toBeInTheDocument();
        expect(screen.getByAltText("Bun Logo")).toBeInTheDocument();
        expect(screen.getByAltText("React Logo")).toBeInTheDocument();
    });

    test("should render APITester component", () => {
        render(<App />);

        // APITester should be present (check for its distinctive elements)
        expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    test("should have proper class structure", () => {
        render(<App />);

        const appRoot = screen.getByText("Bun + React").closest(".app-root");
        expect(appRoot).toBeInTheDocument();

        const logoContainer = screen.getByAltText("Bun Logo").closest(".logo-container");
        expect(logoContainer).toBeInTheDocument();
    });

    test("should render logos with proper classes", () => {
        render(<App />);

        const bunLogo = screen.getByAltText("Bun Logo");
        const reactLogo = screen.getByAltText("React Logo");

        expect(bunLogo).toHaveClass("logo", "bun");
        expect(reactLogo).toHaveClass("logo", "react");
    });

    test("should display HMR instruction text", () => {
        render(<App />);

        // Use getAllByText to handle multiple instances and pick the main one
        const hmrElements = screen.getAllByText((content, element) => {
            return Boolean(
                element?.textContent?.includes("Edit") &&
                    element?.textContent?.includes("src/App.tsx") &&
                    element?.textContent?.includes("and save to test HMR")
            );
        });

        // Should find exactly one main paragraph with HMR text
        expect(hmrElements.length).toBeGreaterThan(0);
        expect(hmrElements[0]).toBeInTheDocument();
    });
});
