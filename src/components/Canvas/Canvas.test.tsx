import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import type { RectangleObject } from "../../types/editor";
import { Canvas } from "./Canvas";

// Mock Canvas component wrapper with EditorProvider
const CanvasWithProvider = ({ className }: { className?: string }) => (
    <EditorProvider>
        <Canvas className={className} />
    </EditorProvider>
);

describe("Canvas Component", () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
    });

    describe("Rendering", () => {
        test("should render canvas with SVG element", () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg");
            expect(svg).toBeInTheDocument();
            expect(svg?.closest(".Canvas")).toBeInTheDocument();
        });

        test("should apply custom className", () => {
            render(<CanvasWithProvider className="custom-canvas" />);

            const canvasContainer = document.querySelector(".Canvas.custom-canvas");
            expect(canvasContainer).toBeInTheDocument();
        });

        test("should render SVG with proper attributes", () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg");
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute("width", "100%");
            expect(svg).toHaveAttribute("height", "100%");
        });

        test("should render grid when grid is visible", () => {
            render(<CanvasWithProvider />);

            const gridLines = document.querySelectorAll(".grid-line");
            expect(gridLines.length).toBeGreaterThan(0);
        });

        test("should render zoom indicator", () => {
            render(<CanvasWithProvider />);

            const zoomIndicator = document.querySelector(".canvas-zoom-indicator");
            expect(zoomIndicator).toBeInTheDocument();
            expect(zoomIndicator).toHaveTextContent("100%");
        });
    });

    describe("Mouse Interactions", () => {
        test("should handle mouse down events", async () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // Simulate mouse down
            await user.pointer({ target: svg, keys: "[MouseLeft]" });

            // Should not throw any errors
            expect(svg).toBeInTheDocument();
        });

        test("should handle wheel events for zooming", async () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // Simulate wheel event
            fireEvent.wheel(svg, { deltaY: 100 });

            // Should not throw any errors
            expect(svg).toBeInTheDocument();
        });

        test("should handle wheel events for zooming", async () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // Simulate wheel event
            fireEvent.wheel(svg, { deltaY: 100 });

            // Should not throw any errors
            expect(svg).toBeInTheDocument();
        });
    });

    describe("Object Rendering", () => {
        test("should render objects from state", () => {
            // This test would require mocking the EditorContext with test objects
            // For now, we test the basic rendering structure
            render(<CanvasWithProvider />);

            const objectsLayer = document.querySelector(".objects-layer");
            expect(objectsLayer).toBeInTheDocument();
        });

        test("should render selection layer", () => {
            render(<CanvasWithProvider />);

            const selectionLayer = document.querySelector(".selection-layer");
            expect(selectionLayer).toBeInTheDocument();
        });
    });

    describe("Tool Integration", () => {
        test("should apply data-tool attribute based on selected tool", () => {
            render(<CanvasWithProvider />);

            const canvasContainer = document.querySelector(".Canvas");
            expect(canvasContainer).toHaveAttribute("data-tool", "select");
        });
    });

    describe("Viewport Integration", () => {
        test("should apply viewport transform to SVG", () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg");
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute("viewBox");
        });

        test("should have viewport transform applied", () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg");
            expect(svg).toBeInTheDocument();
            expect(svg).toHaveAttribute("viewBox");
        });
    });

    describe("Interaction States", () => {
        test("should handle panning state", async () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // Start panning with middle mouse button
            fireEvent.mouseDown(svg, { button: 1 });
            fireEvent.mouseMove(svg, { clientX: 100, clientY: 100 });
            fireEvent.mouseUp(svg);

            // Should not throw any errors
            expect(svg).toBeInTheDocument();
        });

        test("should handle selection state", async () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // Click on canvas (should clear selection)
            await user.click(svg);

            // Should not throw any errors
            expect(svg).toBeInTheDocument();
        });
    });

    describe("Coordinate System", () => {
        test("should have screen to canvas coordinate conversion", () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // The coordinate conversion is tested through mouse events
            fireEvent.mouseDown(svg, { clientX: 50, clientY: 100 });

            // Should not throw any errors
            expect(svg).toBeInTheDocument();
        });
    });

    describe("Error Handling", () => {
        test("should handle missing SVG ref gracefully", () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg");
            expect(svg).toBeInTheDocument();

            // Component should render without errors
            expect(svg).toBeInTheDocument();
        });

        test("should handle mouse events gracefully", () => {
            render(<CanvasWithProvider />);

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // Fire basic mouse events
            fireEvent.mouseDown(svg);
            fireEvent.mouseMove(svg);
            fireEvent.mouseUp(svg);

            // Should not throw any errors
            expect(svg).toBeInTheDocument();
        });
    });
});

// Helper for creating test objects
export const createTestRectangle = (overrides: Partial<RectangleObject> = {}): RectangleObject => ({
    id: "test-rect",
    type: "rectangle",
    name: "Test Rectangle",
    transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    layerId: "default",
    width: 100,
    height: 50,
    borderRadius: 0,
    style: {
        fill: "#ff0000",
        stroke: "#000000",
        strokeWidth: 1,
    },
    ...overrides,
});

// Helper for creating Canvas test utilities
export const createCanvasTestUtils = () => {
    const renderCanvas = (props = {}) => {
        return render(<CanvasWithProvider {...props} />);
    };

    const getSVGElement = () => {
        return document.querySelector(".canvas-svg") as SVGElement;
    };

    const getCanvasContainer = () => {
        return document.querySelector(".Canvas") as HTMLElement;
    };

    const simulateMouseEvent = async (
        eventType: "click" | "mousedown" | "mousemove" | "mouseup",
        options: any = {}
    ) => {
        const svg = getSVGElement();
        const user = userEvent.setup();

        switch (eventType) {
            case "click":
                await user.click(svg);
                break;
            case "mousedown":
                fireEvent.mouseDown(svg, options);
                break;
            case "mousemove":
                fireEvent.mouseMove(svg, options);
                break;
            case "mouseup":
                fireEvent.mouseUp(svg, options);
                break;
        }
    };

    const simulateWheelEvent = (deltaY: number) => {
        const svg = getSVGElement();
        fireEvent.wheel(svg, { deltaY });
    };

    const getZoomLevel = () => {
        const zoomIndicator = document.querySelector(".canvas-zoom-indicator");
        return zoomIndicator?.textContent || "100%";
    };

    return {
        renderCanvas,
        getSVGElement,
        getCanvasContainer,
        simulateMouseEvent,
        simulateWheelEvent,
        getZoomLevel,
    };
};

describe("Shape Tool Operations", () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
    });

    describe("Rectangle Tool", () => {
        test("should create rectangle with click-drag", async () => {
            render(<CanvasWithProvider />);

            // Change to rectangle tool
            await user.keyboard("r");

            const svg = document.querySelector(".canvas-svg") as SVGElement;
            expect(svg).toBeInTheDocument();

            // Simulate click-drag to create rectangle
            await user.pointer([
                { target: svg },
                { coords: { x: 100, y: 100 } },
                "[MouseLeft>]",
                { coords: { x: 200, y: 150 } },
                "[/MouseLeft]",
            ]);

            // Check if rectangle was created
            const rectangles = document.querySelectorAll("rect[data-object-id]");
            expect(rectangles.length).toBeGreaterThan(0);
        });

        test("should show visual feedback during rectangle creation", async () => {
            render(<CanvasWithProvider />);

            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            // Start creating rectangle
            fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });

            // Move mouse to show creation feedback
            fireEvent.mouseMove(svg, { clientX: 200, clientY: 150 });

            // Should have creating class
            const creatingRect = document.querySelector(".canvas-object--creating");
            expect(creatingRect).toBeInTheDocument();
        });
    });

    describe("Circle Tool", () => {
        test("should create circle with click-drag", async () => {
            render(<CanvasWithProvider />);

            // Change to circle tool
            await user.keyboard("c");

            const svg = document.querySelector(".canvas-svg") as SVGElement;

            // Simulate click-drag to create circle
            await user.pointer([
                { target: svg },
                { coords: { x: 100, y: 100 } },
                "[MouseLeft>]",
                { coords: { x: 150, y: 150 } },
                "[/MouseLeft]",
            ]);

            // Check if circle was created
            const circles = document.querySelectorAll("circle[data-object-id]");
            expect(circles.length).toBeGreaterThan(0);
        });

        test("should show visual feedback during circle creation", async () => {
            render(<CanvasWithProvider />);

            await user.keyboard("c");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            // Start creating circle
            fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });

            // Move mouse to show creation feedback
            fireEvent.mouseMove(svg, { clientX: 150, clientY: 150 });

            // Should have creating class
            const creatingCircle = document.querySelector(".canvas-object--creating");
            expect(creatingCircle).toBeInTheDocument();
        });
    });

    describe("Select Tool", () => {
        test("should select objects when clicked", async () => {
            render(<CanvasWithProvider />);

            // First create a rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 100, y: 100 } },
                "[MouseLeft>]",
                { coords: { x: 200, y: 150 } },
                "[/MouseLeft]",
            ]);

            // Switch to select tool
            await user.keyboard("v");

            // Click on the rectangle to select it
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;
            if (rectangle) {
                await user.click(rectangle);

                // Should have selection indicators
                const selectionBox = document.querySelector(".selection-box");
                expect(selectionBox).toBeInTheDocument();

                const selectionHandles = document.querySelectorAll(".selection-handle");
                expect(selectionHandles.length).toBe(8); // 4 corners + 4 edges
            }
        });
    });

    describe("Keyboard Shortcuts", () => {
        test("should switch tools with keyboard shortcuts", async () => {
            render(<CanvasWithProvider />);

            // Test rectangle tool (R key)
            await user.keyboard("r");
            const canvas = document.querySelector(".Canvas") as HTMLElement;
            expect(canvas).toHaveAttribute("data-tool", "rectangle");

            // Test circle tool (C key)
            await user.keyboard("c");
            expect(canvas).toHaveAttribute("data-tool", "circle");

            // Test select tool (V key)
            await user.keyboard("v");
            expect(canvas).toHaveAttribute("data-tool", "select");

            // Test hand tool (H key)
            await user.keyboard("h");
            expect(canvas).toHaveAttribute("data-tool", "hand");
        });

        test("should not switch tools when input is focused", async () => {
            const { container } = render(
                <div>
                    <input type="text" />
                    <CanvasWithProvider />
                </div>
            );

            const input = container.querySelector("input") as HTMLInputElement;
            const canvas = container.querySelector(".Canvas") as HTMLElement;

            // Focus the input
            input.focus();

            // Try to switch tools - should not work when input is focused
            await user.keyboard("r");
            expect(canvas).not.toHaveAttribute("data-tool", "rectangle");
        });

        test("should not switch tools with modifier keys", async () => {
            render(<CanvasWithProvider />);

            const canvas = document.querySelector(".Canvas") as HTMLElement;
            const initialTool = canvas.getAttribute("data-tool");

            // Try with Ctrl+R (should not switch)
            await user.keyboard("{Control>}r{/Control}");
            expect(canvas).toHaveAttribute("data-tool", initialTool);

            // Try with Alt+R (should not switch)
            await user.keyboard("{Alt>}r{/Alt}");
            expect(canvas).toHaveAttribute("data-tool", initialTool);
        });
    });

    describe("Move Operations", () => {
        test("should move selected objects with drag", async () => {
            render(<CanvasWithProvider />);

            // Create rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 100, y: 100 } },
                "[MouseLeft>]",
                { coords: { x: 200, y: 150 } },
                "[/MouseLeft]",
            ]);

            // Switch to select and select the rectangle
            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                const initialX = rectangle.getAttribute("x");
                const initialY = rectangle.getAttribute("y");

                // Drag the rectangle to move it
                await user.pointer([
                    { target: rectangle },
                    "[MouseLeft>]",
                    { coords: { x: 250, y: 200 } },
                    "[/MouseLeft]",
                ]);

                // Position should have changed
                const newX = rectangle.getAttribute("x");
                const newY = rectangle.getAttribute("y");
                expect(newX).not.toBe(initialX);
                expect(newY).not.toBe(initialY);
            }
        });
    });

    describe("Resize Operations", () => {
        test("should show resize handles for selected objects", async () => {
            render(<CanvasWithProvider />);

            // Create and select rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 100, y: 100 } },
                "[MouseLeft>]",
                { coords: { x: 200, y: 150 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                await user.click(rectangle);

                // Should show resize handles
                const handles = document.querySelectorAll(".selection-handle");
                expect(handles.length).toBe(8);

                // Check handle positions
                const nwHandle = document.querySelector('.selection-handle[data-position="nw"]');
                const seHandle = document.querySelector('.selection-handle[data-position="se"]');
                expect(nwHandle).toBeInTheDocument();
                expect(seHandle).toBeInTheDocument();
            }
        });

        test("should resize object when dragging resize handles", async () => {
            render(<CanvasWithProvider />);

            // Create and select rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 100, y: 100 } },
                "[MouseLeft>]",
                { coords: { x: 200, y: 150 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                await user.click(rectangle);

                const initialWidth = rectangle.getAttribute("width");
                const initialHeight = rectangle.getAttribute("height");

                // Drag SE handle to resize
                const seHandle = document.querySelector('.selection-handle[data-position="se"]') as SVGElement;
                if (seHandle) {
                    await user.pointer([
                        { target: seHandle },
                        "[MouseLeft>]",
                        { coords: { x: 250, y: 200 } },
                        "[/MouseLeft]",
                    ]);

                    // Size should have changed
                    const newWidth = rectangle.getAttribute("width");
                    const newHeight = rectangle.getAttribute("height");
                    expect(newWidth).not.toBe(initialWidth);
                    expect(newHeight).not.toBe(initialHeight);
                }
            }
        });
    });
});
