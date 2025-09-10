import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { IconCreator } from "./iconCreator";

// Mock for download functionality
const mockLink = {
    href: "",
    download: "",
    click: vi.fn(),
};

beforeEach(() => {
    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => "mock-url");
    global.URL.revokeObjectURL = vi.fn();

    // Mock document methods
    global.document.createElement = vi.fn((tagName) => {
        if (tagName === "a") {
            return mockLink as any;
        }
        // Return a basic mock element for other tags
        return {
            tagName: tagName.toUpperCase(),
            style: {},
            setAttribute: vi.fn(),
            getAttribute: vi.fn(),
        } as any;
    });

    global.document.body.appendChild = vi.fn();
    global.document.body.removeChild = vi.fn();

    // Reset mock calls
    vi.clearAllMocks();
});

describe("IconCreator", () => {
    test("should render without crashing", () => {
        render(<IconCreator />);

        expect(screen.getByText("Icon Creator")).toBeInTheDocument();
        expect(screen.getByText("Create and customize beautiful glowing UI icons")).toBeInTheDocument();
    });

    test("should render preview and config components", () => {
        render(<IconCreator />);

        // Check for preview section
        expect(screen.getByRole("img")).toBeInTheDocument();

        // Check for config panel sections
        expect(screen.getByText("Background Colors")).toBeInTheDocument();
        expect(screen.getByText("Dimensions")).toBeInTheDocument();
    });

    test("should have export and reset buttons", () => {
        render(<IconCreator />);

        expect(screen.getByText("Export HTML")).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    test("should update preview when config changes", async () => {
        render(<IconCreator />);

        const colorInput = screen.getByLabelText("Gradient Start");
        await userEvent.clear(colorInput);
        await userEvent.type(colorInput, "#ff0000");

        const icon = screen.getByRole("img");
        expect(icon).toHaveStyle("--bg-grad-start: #ff0000");
    });

    test("should reset configuration when reset button is clicked", async () => {
        render(<IconCreator />);

        // Change a value first
        const textInput = screen.getByLabelText("Input Text");
        await userEvent.clear(textInput);
        await userEvent.type(textInput, "changed");

        // Click reset
        const resetBtn = screen.getByText("Reset");
        await userEvent.click(resetBtn);

        // Check if value is back to default
        expect(textInput).toHaveValue("text");
    });

    test("should trigger download when export button is clicked", async () => {
        render(<IconCreator />);

        const exportBtn = screen.getByText("Export HTML");
        await userEvent.click(exportBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toBe("icon.html");
    });

    test("should apply className prop", () => {
        const { container } = render(<IconCreator className="test-class" />);

        expect(container.firstChild).toHaveClass("IconCreator", "test-class");
    });

    test("should have proper responsive layout structure", () => {
        render(<IconCreator />);

        const main = screen.getByRole("main");
        expect(main).toHaveClass("creator-main");

        const previewSection = main.querySelector(".preview-section");
        const configSection = main.querySelector(".config-section");

        expect(previewSection).toBeInTheDocument();
        expect(configSection).toBeInTheDocument();
    });
});
