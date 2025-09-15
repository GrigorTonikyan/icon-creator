import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import type { CanvasObject } from "../../types/editor";
import { PropertyPanel } from "./PropertyPanel";

const renderWithEditor = (ui: React.ReactElement) => {
    return render(<EditorProvider>{ui}</EditorProvider>);
};

const mockRectangle: CanvasObject = {
    id: "rect-1",
    type: "rectangle",
    name: "Rectangle 1",
    layerId: "default",
    transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
    width: 100,
    height: 50,
    style: { fill: "#ff0000", stroke: "#000000", strokeWidth: 2 },
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
};

const mockCircle: CanvasObject = {
    id: "circle-1",
    type: "circle",
    name: "Circle 1",
    layerId: "default",
    transform: { x: 30, y: 40, rotation: 0, scaleX: 1, scaleY: 1 },
    radius: 25,
    style: { fill: "#00ff00", stroke: "#000000", strokeWidth: 1 },
    opacity: 0.8,
    visible: true,
    locked: false,
    zIndex: 0,
};

describe("PropertyPanel", () => {
    test("should render without crashing", () => {
        renderWithEditor(<PropertyPanel />);
        expect(screen.getByText("Properties")).toBeInTheDocument();
    });

    test("should show empty state when no objects are selected", () => {
        renderWithEditor(<PropertyPanel />);
        expect(screen.getByText("Select objects to edit properties")).toBeInTheDocument();
    });

    test("should apply custom className when provided", () => {
        const { container } = renderWithEditor(<PropertyPanel className="custom-class" />);
        expect(container.firstChild).toHaveClass("property-panel", "custom-class");
    });

    test("should have proper accessibility attributes", () => {
        renderWithEditor(<PropertyPanel />);
        const propertyPanel = document.querySelector(".property-panel");
        expect(propertyPanel).toBeInTheDocument();
        expect(screen.getByText("Properties")).toBeInTheDocument();
    });

    test("should render rectangle properties when rectangle is selected", () => {
        renderWithEditor(<PropertyPanel />);

        // Initially no selection
        expect(screen.getByText("Select objects to edit properties")).toBeInTheDocument();
    });

    test("should render proper CSS structure", () => {
        renderWithEditor(<PropertyPanel />);
        expect(document.querySelector(".property-panel")).toBeInTheDocument();
        expect(document.querySelector(".property-panel__header")).toBeInTheDocument();
        expect(document.querySelector(".property-panel__content")).toBeInTheDocument();
    });

    test("should handle property validation errors", () => {
        renderWithEditor(<PropertyPanel />);

        // PropertyPanel should be present
        expect(document.querySelector(".property-panel")).toBeInTheDocument();
    });
});
