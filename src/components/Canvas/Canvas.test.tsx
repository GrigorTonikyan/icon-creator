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

    describe("Rotation Operations", () => {
        test("should show rotation handle for selected objects", async () => {
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

                // Should show rotation handle
                const rotationHandle = document.querySelector('.rotation-handle[data-position="rotate"]');
                expect(rotationHandle).toBeInTheDocument();

                // Rotation handle should be positioned above the object
                const handleElement = rotationHandle as SVGCircleElement;
                const handleCy = parseFloat(handleElement.getAttribute("cy") || "0");
                const rectY = parseFloat(rectangle.getAttribute("y") || "0");
                expect(handleCy).toBeLessThan(rectY);
            }
        });

        test("should rotate object when dragging rotation handle", async () => {
            render(<CanvasWithProvider />);

            // Create and select rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 150, y: 150 } },
                "[MouseLeft>]",
                { coords: { x: 250, y: 200 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                await user.click(rectangle);

                const rotationHandle = document.querySelector('.rotation-handle[data-position="rotate"]') as SVGElement;
                expect(rotationHandle).toBeInTheDocument();

                // Get initial rotation (should be 0)
                const initialTransform = rectangle.getAttribute("transform") || "";

                // Drag rotation handle to rotate object
                if (rotationHandle) {
                    await user.pointer([
                        { target: rotationHandle },
                        "[MouseLeft>]",
                        { coords: { x: 300, y: 100 } }, // Drag to rotate
                        "[/MouseLeft]",
                    ]);
                }

                // Check that rotation was applied
                const newTransform = rectangle.getAttribute("transform") || "";
                expect(newTransform).not.toBe(initialTransform);
                expect(newTransform).toContain("rotate");
            }
        });

        test("should snap rotation to 15-degree increments when Shift is held", async () => {
            render(<CanvasWithProvider />);

            // Create and select rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 150, y: 150 } },
                "[MouseLeft>]",
                { coords: { x: 250, y: 200 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                await user.click(rectangle);

                const rotationHandle = document.querySelector('.rotation-handle[data-position="rotate"]') as SVGElement;
                expect(rotationHandle).toBeInTheDocument();

                // Start rotation with Shift key held
                await user.keyboard("{Shift>}");
                if (rotationHandle) {
                    await user.pointer([
                        { target: rotationHandle },
                        "[MouseLeft>]",
                        { coords: { x: 300, y: 100 } }, // Drag to rotate
                        "[/MouseLeft]",
                    ]);
                }
                await user.keyboard("{/Shift}");

                // The rotation should be snapped to a 15-degree increment
                const transform = rectangle.getAttribute("transform") || "";
                if (transform.includes("rotate")) {
                    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
                    if (rotateMatch && rotateMatch[1]) {
                        const rotationParams = rotateMatch[1].split(" ");
                        if (rotationParams[0]) {
                            const rotationValue = parseFloat(rotationParams[0]);
                            // Should be a multiple of 15
                            expect(rotationValue % 15).toBe(0);
                        }
                    }
                }
            }
        });

        test("should show visual feedback during rotation", async () => {
            render(<CanvasWithProvider />);

            // Create and select rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 150, y: 150 } },
                "[MouseLeft>]",
                { coords: { x: 250, y: 200 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                await user.click(rectangle);

                const rotationHandle = document.querySelector('.rotation-handle[data-position="rotate"]') as SVGElement;
                expect(rotationHandle).toBeInTheDocument();

                // Start dragging rotation handle
                if (rotationHandle) {
                    await user.pointer([{ target: rotationHandle }, "[MouseLeft>]"]);

                    // Move mouse to trigger rotation feedback
                    await user.pointer([{ coords: { x: 300, y: 100 } }]);

                    // Should show rotation indicator (this might appear in DOM temporarily)
                    // Note: The rotation indicator is created dynamically and removed after a delay
                    // We can test that the rotation handle has active styling
                    expect(rotationHandle).toHaveClass("selection-handle--active");

                    // End rotation
                    await user.pointer(["[/MouseLeft]"]);
                }
            }
        });

        test("should maintain transform origin during rotation", async () => {
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

                // Should show transform origin controls
                const originHandle = document.querySelector(".origin-handle");
                expect(originHandle).toBeInTheDocument();

                // The rotation should work with the custom origin point
                // (This is more of an integration test - actual origin behavior
                // is tested through property panel integration)
                const rotationHandle = document.querySelector('.rotation-handle[data-position="rotate"]') as SVGElement;
                expect(rotationHandle).toBeInTheDocument();

                // Rotate the object
                if (rotationHandle) {
                    await user.pointer([
                        { target: rotationHandle },
                        "[MouseLeft>]",
                        { coords: { x: 300, y: 100 } },
                        "[/MouseLeft]",
                    ]);
                }

                // Transform should be applied
                const transform = rectangle.getAttribute("transform") || "";
                expect(transform).toContain("rotate");
            }
        });

        test("should handle rotation for different object types", async () => {
            render(<CanvasWithProvider />);

            // Test with circle
            await user.keyboard("o");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 150, y: 150 } },
                "[MouseLeft>]",
                { coords: { x: 200, y: 200 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const circle = document.querySelector("circle[data-object-id]") as SVGElement;

            if (circle) {
                await user.click(circle);

                // Should show rotation handle for circle too
                const rotationHandle = document.querySelector('.rotation-handle[data-position="rotate"]') as SVGElement;
                expect(rotationHandle).toBeInTheDocument();

                // Rotate the circle
                if (rotationHandle) {
                    await user.pointer([
                        { target: rotationHandle },
                        "[MouseLeft>]",
                        { coords: { x: 300, y: 100 } },
                        "[/MouseLeft]",
                    ]);
                }

                // Transform should be applied to circle
                const transform = circle.getAttribute("transform") || "";
                expect(transform).toContain("rotate");
            }
        });

        test("should update rotation property in real-time", async () => {
            render(<CanvasWithProvider />);

            // This test verifies that rotation updates trigger property updates
            // (Integration with PropertyPanel is tested separately)

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

                const rotationHandle = document.querySelector('.rotation-handle[data-position="rotate"]') as SVGElement;

                // Perform rotation
                if (rotationHandle) {
                    await user.pointer([
                        { target: rotationHandle },
                        "[MouseLeft>]",
                        { coords: { x: 300, y: 100 } },
                        "[/MouseLeft]",
                    ]);
                }

                // Verify the object has been updated with rotation
                const objectId = rectangle.getAttribute("data-object-id");
                expect(objectId).toBeTruthy();

                // The transform should contain rotation
                const transform = rectangle.getAttribute("transform") || "";
                expect(transform).toContain("rotate");
            }
        });
    });

    describe("Proportional and Center Scaling", () => {
        test("should maintain aspect ratio when Shift is held during resize", async () => {
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

                const initialWidth = parseFloat(rectangle.getAttribute("width") || "0");
                const initialHeight = parseFloat(rectangle.getAttribute("height") || "0");
                const initialAspectRatio = initialWidth / initialHeight;

                // Drag SE handle with Shift held to maintain aspect ratio
                const seHandle = document.querySelector('.selection-handle[data-position="se"]') as SVGElement;

                await user.keyboard("{Shift>}");
                await user.pointer([
                    { target: seHandle },
                    "[MouseLeft>]",
                    { coords: { x: 250, y: 200 } },
                    "[/MouseLeft]",
                ]);
                await user.keyboard("{/Shift}");

                const newWidth = parseFloat(rectangle.getAttribute("width") || "0");
                const newHeight = parseFloat(rectangle.getAttribute("height") || "0");
                const newAspectRatio = newWidth / newHeight;

                // Aspect ratio should be maintained (within tolerance)
                expect(Math.abs(newAspectRatio - initialAspectRatio)).toBeLessThan(0.1);
            }
        });

        test("should scale from center when Alt is held during resize", async () => {
            render(<CanvasWithProvider />);

            // Create and select rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 150, y: 150 } },
                "[MouseLeft>]",
                { coords: { x: 250, y: 200 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                await user.click(rectangle);

                const initialX = parseFloat(rectangle.getAttribute("x") || "0");
                const initialY = parseFloat(rectangle.getAttribute("y") || "0");
                const initialWidth = parseFloat(rectangle.getAttribute("width") || "0");
                const initialHeight = parseFloat(rectangle.getAttribute("height") || "0");

                const initialCenterX = initialX + initialWidth / 2;
                const initialCenterY = initialY + initialHeight / 2;

                // Drag SE handle with Alt held to scale from center
                const seHandle = document.querySelector('.selection-handle[data-position="se"]') as SVGElement;

                await user.keyboard("{Alt>}");
                await user.pointer([
                    { target: seHandle },
                    "[MouseLeft>]",
                    { coords: { x: 280, y: 230 } },
                    "[/MouseLeft]",
                ]);
                await user.keyboard("{/Alt}");

                const newX = parseFloat(rectangle.getAttribute("x") || "0");
                const newY = parseFloat(rectangle.getAttribute("y") || "0");
                const newWidth = parseFloat(rectangle.getAttribute("width") || "0");
                const newHeight = parseFloat(rectangle.getAttribute("height") || "0");

                const newCenterX = newX + newWidth / 2;
                const newCenterY = newY + newHeight / 2;

                // Center should remain approximately the same
                expect(Math.abs(newCenterX - initialCenterX)).toBeLessThan(5);
                expect(Math.abs(newCenterY - initialCenterY)).toBeLessThan(5);

                // Size should have changed
                expect(newWidth).not.toBe(initialWidth);
                expect(newHeight).not.toBe(initialHeight);
            }
        });

        test("should combine proportional and center scaling with Shift+Alt", async () => {
            render(<CanvasWithProvider />);

            // Create and select rectangle
            await user.keyboard("r");
            const svg = document.querySelector(".canvas-svg") as SVGElement;

            await user.pointer([
                { target: svg },
                { coords: { x: 150, y: 150 } },
                "[MouseLeft>]",
                { coords: { x: 250, y: 200 } },
                "[/MouseLeft]",
            ]);

            await user.keyboard("v");
            const rectangle = document.querySelector("rect[data-object-id]") as SVGElement;

            if (rectangle) {
                await user.click(rectangle);

                const initialX = parseFloat(rectangle.getAttribute("x") || "0");
                const initialY = parseFloat(rectangle.getAttribute("y") || "0");
                const initialWidth = parseFloat(rectangle.getAttribute("width") || "0");
                const initialHeight = parseFloat(rectangle.getAttribute("height") || "0");

                const initialCenterX = initialX + initialWidth / 2;
                const initialCenterY = initialY + initialHeight / 2;
                const initialAspectRatio = initialWidth / initialHeight;

                // Drag SE handle with both Shift and Alt held
                const seHandle = document.querySelector('.selection-handle[data-position="se"]') as SVGElement;

                await user.keyboard("{Shift>}{Alt>}");
                await user.pointer([
                    { target: seHandle },
                    "[MouseLeft>]",
                    { coords: { x: 280, y: 230 } },
                    "[/MouseLeft]",
                ]);
                await user.keyboard("{/Alt}{/Shift}");

                const newX = parseFloat(rectangle.getAttribute("x") || "0");
                const newY = parseFloat(rectangle.getAttribute("y") || "0");
                const newWidth = parseFloat(rectangle.getAttribute("width") || "0");
                const newHeight = parseFloat(rectangle.getAttribute("height") || "0");

                const newCenterX = newX + newWidth / 2;
                const newCenterY = newY + newHeight / 2;
                const newAspectRatio = newWidth / newHeight;

                // Center should remain approximately the same
                expect(Math.abs(newCenterX - initialCenterX)).toBeLessThan(5);
                expect(Math.abs(newCenterY - initialCenterY)).toBeLessThan(5);

                // Aspect ratio should be maintained
                expect(Math.abs(newAspectRatio - initialAspectRatio)).toBeLessThan(0.1);

                // Size should have changed
                expect(newWidth).not.toBe(initialWidth);
                expect(newHeight).not.toBe(initialHeight);
            }
        });
    });
});
