import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { IconCreator } from "./iconCreator";

// Mock LayoutRegion to avoid DOM issues in test
vi.mock("../Layout", () => ({
    LayoutRegion: ({ children }: { children: React.ReactNode }) => <div data-testid="layout-region">{children}</div>,
}));

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

    // Only mock document.createElement for anchor elements when export is actually called
    // Don't interfere with normal DOM operations
});

describe("IconCreator", () => {
    test("should render without crashing", () => {
        render(<IconCreator />);
        expect(screen.getByText("Icon Creator")).toBeInTheDocument();
    });

    test("should have export and reset buttons", () => {
        render(<IconCreator />);
        expect(screen.getByText("Export HTML")).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
    });
});
