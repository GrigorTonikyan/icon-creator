import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ExportControls } from "./ExportControls";

describe("ExportControls", () => {
    test("should render export controls with default values", () => {
        const mockOnExport = vi.fn();
        render(<ExportControls onExport={mockOnExport} />);

        expect(screen.getByText("Export Settings")).toBeInTheDocument();
        expect(screen.getByDisplayValue("svg")).toBeInTheDocument();
        expect(screen.getByDisplayValue("512")).toBeInTheDocument();
        expect(screen.getByText("Export SVG")).toBeInTheDocument();
    });

    test("should change format and update export button text", () => {
        const mockOnExport = vi.fn();
        render(<ExportControls onExport={mockOnExport} />);

        const formatSelect = screen.getByDisplayValue("svg");
        fireEvent.change(formatSelect, { target: { value: "png" } });

        expect(screen.getByText("Export PNG")).toBeInTheDocument();
    });

    test("should show PNG quality control when PNG format is selected", () => {
        const mockOnExport = vi.fn();
        render(<ExportControls onExport={mockOnExport} />);

        const formatSelect = screen.getByDisplayValue("svg");
        fireEvent.change(formatSelect, { target: { value: "png" } });

        expect(screen.getByText("PNG Quality")).toBeInTheDocument();
    });

    test("should update dimensions when preset button is clicked", () => {
        const mockOnExport = vi.fn();
        render(<ExportControls onExport={mockOnExport} />);

        const preset64Button = screen.getByText("64×64");
        fireEvent.click(preset64Button);

        const widthInputs = screen.getAllByDisplayValue("64");
        expect(widthInputs).toHaveLength(2); // width and height inputs
    });

    test("should call onExport with correct options when export button is clicked", () => {
        const mockOnExport = vi.fn();
        render(<ExportControls onExport={mockOnExport} />);

        const exportButton = screen.getByText("Export SVG");
        fireEvent.click(exportButton);

        expect(mockOnExport).toHaveBeenCalledWith({
            format: "svg",
            width: 512,
            height: 512,
            scale: 1,
            quality: 0.9,
            includeMetadata: true,
            optimizeSvg: true,
        });
    });

    test("should update final size calculation when scale changes", () => {
        const mockOnExport = vi.fn();
        render(<ExportControls onExport={mockOnExport} />);

        const scaleInput = screen.getByDisplayValue("1");
        fireEvent.change(scaleInput, { target: { value: "2" } });

        expect(screen.getByText("Final size: 1024 × 1024 px")).toBeInTheDocument();
    });
});
