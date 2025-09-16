import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { IconCreator } from "./iconCreator";

// Mock LayoutRegion to avoid DOM issues in test
vi.mock("../Layout", () => ({
    LayoutRegion: ({ children }: { children: React.ReactNode }) => <div data-testid="layout-region">{children}</div>,
}));

// Mock ExportControls component
vi.mock("../../components/ExportControls", () => ({
    ExportControls: ({ onExport }: { onExport: (options: any) => void }) => (
        <div data-testid="export-controls">
            <button onClick={() => onExport({ format: "svg" })}>Export Controls SVG</button>
            <button onClick={() => onExport({ format: "png" })}>Export Controls PNG</button>
            <button onClick={() => onExport({ format: "json" })}>Export Controls JSON</button>
        </div>
    ),
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
        expect(screen.getByText("Export SVG")).toBeInTheDocument();
        expect(screen.getByText("Export PNG")).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    test("should have export controls component", () => {
        render(<IconCreator />);
        expect(screen.getByTestId("export-controls")).toBeInTheDocument();
        expect(screen.getByText("Export Controls SVG")).toBeInTheDocument();
        expect(screen.getByText("Export Controls PNG")).toBeInTheDocument();
        expect(screen.getByText("Export Controls JSON")).toBeInTheDocument();
    });
});
