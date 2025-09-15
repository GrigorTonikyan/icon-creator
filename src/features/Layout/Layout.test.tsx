import { render, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Layout, LayoutRegion } from "./";

describe("Layout", () => {
    test("renders only populated regions", async () => {
        const { container, getByText } = render(
            <Layout>
                <LayoutRegion name="main">
                    <div>MAIN-CONTENT</div>
                </LayoutRegion>
            </Layout>
        );

        // Wait for the layout system to settle
        await waitFor(() => {
            expect(getByText("MAIN-CONTENT")).toBeInTheDocument();
        });

        // Should render the populated regions
        const regionWrappers = container.querySelectorAll('[style*="grid-area"]');
        expect(regionWrappers.length).toBeGreaterThan(0);

        // Find the main region specifically
        const mainRegion = Array.from(regionWrappers).find((el) =>
            el.getAttribute("style")?.includes("grid-area: main")
        );
        expect(mainRegion).toBeTruthy();
        expect(mainRegion!.textContent).toContain("MAIN-CONTENT");
    });

    test("cleans region on unmount", async () => {
        const { container, unmount, getByText } = render(
            <Layout>
                <LayoutRegion name="main">
                    <div>MAIN-CONTENT</div>
                </LayoutRegion>
            </Layout>
        );

        // Wait for initial render
        await waitFor(() => {
            expect(getByText("MAIN-CONTENT")).toBeInTheDocument();
        });

        // Pre-check: regions exist
        expect(container.querySelectorAll('[style*="grid-area"]').length).toBeGreaterThan(0);

        // Unmount and ensure content is gone
        unmount();
        expect(container.querySelectorAll('[style*="grid-area"]').length).toBe(0);
    });
});
