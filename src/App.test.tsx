import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("App", () => {
    test("should render without crashing", async () => {
        render(<App />);

        // Wait for layout to settle since it uses a complex render system
        await waitFor(() => {
            expect(screen.getAllByRole("heading", { level: 1, name: "Icon Creator" })).toHaveLength(2);
        });

        await waitFor(() => {
            expect(screen.getByRole("img", { name: /stylized glowing ui input panel/i })).toBeInTheDocument();
        });
    });
    test("should render IconCreator component", async () => {
        render(<App />);

        // IconCreator should be present (check for its distinctive elements)
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /export html/i })).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
        });
    });

    test("should have proper class structure", () => {
        render(<App />);

        const appRootElement = document.querySelector(".app-root");
        expect(appRootElement).toBeInTheDocument();
        expect(appRootElement).toHaveClass("app-root");
    });

    test("should render configuration panel", async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText("Background Colors")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText("Panel Colors")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText("Dimensions")).toBeInTheDocument();
        });
    });

    test("should display icon preview", async () => {
        render(<App />);

        await waitFor(() => {
            const iconPreview = screen.getByRole("img", { name: /stylized glowing ui input panel/i });
            expect(iconPreview).toBeInTheDocument();
            expect(iconPreview).toHaveAttribute("aria-label");
        });
    });
});
