import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Layout, LayoutRegion } from "./";

describe("Layout", () => {
    test("renders only populated regions", () => {
        const { container, getByText } = render(
            <Layout>
                <LayoutRegion name="main">
                    <div>MAIN-CONTENT</div>
                </LayoutRegion>
            </Layout>
        );

        // Assert content is present
        expect(getByText("MAIN-CONTENT")).toBeInTheDocument();

        // Should render exactly one region wrapper (for 'main')
        const regionWrappers = container.querySelectorAll('[style*="grid-area"]');
        expect(regionWrappers.length).toBe(1);
        const first = regionWrappers.item(0);
        expect(first).not.toBeNull();
        expect(first!.textContent).toContain("MAIN-CONTENT");
    });

    test("cleans region on unmount", () => {
        const { container, unmount } = render(
            <Layout>
                <LayoutRegion name="main">
                    <div>MAIN-CONTENT</div>
                </LayoutRegion>
            </Layout>
        );

        // Pre-check: one wrapper exists
        expect(container.querySelectorAll('[style*="grid-area"]').length).toBe(1);

        // Unmount and ensure wrappers are gone
        unmount();
        expect(container.querySelectorAll('[style*="grid-area"]').length).toBe(0);
    });
});
