import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Layout } from "../Layout/Layout";
import { IconCreator } from "./iconCreator";

// Mock for download functionality
const mockLink = {
    href: "",
    download: "",
    click: vi.fn(),
    style: {},
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
};

beforeEach(() => {
    // Reset mock calls
    vi.clearAllMocks();

    // Mock document.createElement only for anchor elements
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "a") {
            return mockLink as any;
        }
        return originalCreateElement(tagName);
    });

    // No need to mock body operations; we don't trigger downloads in these tests
});

describe("IconCreator", () => {
    test("should render without crashing", () => {
        render(
            <Layout>
                <IconCreator />
            </Layout>
        );
        expect(screen.getByText("Icon Creator")).toBeInTheDocument();
    });

    test("should have export and reset buttons", () => {
        render(
            <Layout>
                <IconCreator />
            </Layout>
        );
        expect(screen.getByText("Export HTML")).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
    });
});
