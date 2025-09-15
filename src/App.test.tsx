import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("App", () => {
    test("should render without crashing", async () => {
        render(<App />);

        // Wait for layout to settle and check for navigation
        await waitFor(() => {
            expect(screen.getByRole("navigation")).toBeInTheDocument();
        });

        // Check that main layout regions are present
        await waitFor(() => {
            expect(screen.getByRole("main")).toBeInTheDocument();
        });
    });

    test("should render VisualEditor by default", async () => {
        render(<App />);

        // VisualEditor should be present (check for Canvas area)
        await waitFor(() => {
            expect(screen.getByRole("main")).toBeInTheDocument();
        });

        // Check for left sidebar (LayerPanel region)
        await waitFor(() => {
            expect(document.querySelector(".visual-editor__left-panel")).toBeInTheDocument();
        });

        // Check for right sidebar (PropertyPanel region)
        await waitFor(() => {
            expect(document.querySelector(".visual-editor__right-panel")).toBeInTheDocument();
        });
    });

    test("should have proper class structure", () => {
        render(<App />);

        const appRootElement = document.querySelector(".app-root");
        expect(appRootElement).toBeInTheDocument();
        expect(appRootElement).toHaveClass("app-root");
    });

    test("should render navigation with sections", async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByRole("navigation")).toBeInTheDocument();
        });

        // Check for navigation items
        await waitFor(() => {
            expect(screen.getByText("Visual Editor")).toBeInTheDocument();
        });
    });

    test("should render visual editor layout", async () => {
        render(<App />);

        // Check that the layout container is present
        await waitFor(() => {
            expect(document.querySelector(".layout")).toBeInTheDocument();
        });

        // Check for main content area
        await waitFor(() => {
            expect(screen.getByRole("main")).toBeInTheDocument();
        });
    });
});
