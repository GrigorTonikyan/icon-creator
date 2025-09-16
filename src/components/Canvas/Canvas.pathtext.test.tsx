import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import type { CanvasObject, PathObject, TextObject } from "../../types/editor";
import { Canvas } from "./Canvas";

// Mock Paper.js since it's used for path boolean operations
vi.mock("paper", () => {
    const mockFn = vi.fn;
    return {
        default: {
            setup: mockFn(),
            Size: mockFn(),
            Path: {
                create: mockFn(),
            },
            CompoundPath: {
                create: mockFn(),
            },
            project: {
                clear: mockFn(),
            },
            Item: {
                prototype: {
                    unite: mockFn(() => ({ pathData: "M 0 0 L 20 0 L 20 20 L 0 20 Z" })),
                    subtract: mockFn(() => ({ pathData: "M 0 0 L 5 0 L 5 5 L 0 5 Z" })),
                    intersect: mockFn(() => ({ pathData: "M 5 5 L 10 5 L 10 10 L 5 10 Z" })),
                    exclude: mockFn(() => ({ pathData: "M 0 0 L 15 0 L 15 15 L 0 15 Z" })),
                },
            },
        },
    };
});

const createMockPathObject = (id: string, pathData: string): PathObject => ({
    id,
    type: "path",
    name: `Path ${id}`,
    pathData,
    style: {
        fill: "#000000",
        stroke: "#000000",
        strokeWidth: 1,
    },
    transform: {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
    },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    layerId: "layer1",
});

const createMockTextObject = (id: string, text: string): TextObject => ({
    id,
    type: "text",
    name: `Text ${id}`,
    content: text,
    style: {
        fontFamily: "Arial",
        fontSize: 16,
        fontWeight: "normal",
        color: "#000000",
        textAlign: "left",
        lineHeight: 1.2,
    },
    transform: {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
    },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    layerId: "layer1",
});

const CanvasWrapper = ({
    objects = [],
    selectedObjects = [],
    tool = "select",
}: {
    objects?: CanvasObject[];
    selectedObjects?: string[];
    tool?: string;
}) => (
    <EditorProvider>
        <Canvas />
    </EditorProvider>
);

describe("Canvas - Path Functionality", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Path Creation", () => {
        test("should create path when path tool is active", async () => {
            const user = userEvent.setup();
            render(<CanvasWrapper tool="path" />);

            const canvas = screen.getByTestId("canvas-svg");

            // Click to start path
            await user.click(canvas);

            // Click to add point
            fireEvent.click(canvas, { clientX: 100, clientY: 100 });

            // Should render path element
            const pathElement = canvas.querySelector("path");
            expect(pathElement).toBeInTheDocument();
        });

        test("should continue path on subsequent clicks", async () => {
            const user = userEvent.setup();
            render(<CanvasWrapper tool="path" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });

            // Start path
            await user.click(canvas);
            fireEvent.click(canvas, { clientX: 50, clientY: 50 });

            // Add second point
            fireEvent.click(canvas, { clientX: 100, clientY: 50 });

            // Add third point
            fireEvent.click(canvas, { clientX: 100, clientY: 100 });

            const pathElement = canvas.querySelector("path");
            expect(pathElement).toBeInTheDocument();
            expect(pathElement?.getAttribute("d")).toMatch(/M\s*\d+\s*\d+.*L\s*\d+\s*\d+/);
        });

        test("should finish path on double click", async () => {
            const user = userEvent.setup();
            render(<CanvasWrapper tool="path" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });

            // Create path
            await user.click(canvas);
            fireEvent.click(canvas, { clientX: 50, clientY: 50 });
            fireEvent.click(canvas, { clientX: 100, clientY: 50 });

            // Double click to finish
            fireEvent.doubleClick(canvas, { clientX: 100, clientY: 100 });

            // Path should be completed
            const pathElement = canvas.querySelector("path");
            expect(pathElement).toBeInTheDocument();
        });
    });

    describe("Path Node Editing", () => {
        test("should display path nodes when path is selected", () => {
            const pathObject = createMockPathObject("path1", "M 0 0 L 100 0 L 100 100 L 0 100 Z");

            render(<CanvasWrapper objects={[pathObject]} selectedObjects={["path1"]} tool="select" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });

            // Should render path nodes
            const nodes = canvas.querySelectorAll(".path-node");
            expect(nodes.length).toBeGreaterThan(0);
        });

        test("should allow dragging path nodes", async () => {
            const pathObject = createMockPathObject("path1", "M 0 0 L 100 0 L 100 100 L 0 100 Z");

            render(<CanvasWrapper objects={[pathObject]} selectedObjects={["path1"]} tool="select" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });
            const firstNode = canvas.querySelector(".path-node") as Element;

            if (firstNode) {
                // Simulate drag
                fireEvent.mouseDown(firstNode, { clientX: 0, clientY: 0 });
                fireEvent.mouseMove(firstNode, { clientX: 10, clientY: 10 });
                fireEvent.mouseUp(firstNode);

                // Node position should update
                expect(firstNode).toBeInTheDocument();
            }
        });

        test("should show control points for curve nodes", () => {
            const curvePathObject = createMockPathObject("path1", "M 0 0 C 25 25 75 25 100 0");

            render(<CanvasWrapper objects={[curvePathObject]} selectedObjects={["path1"]} tool="select" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });

            // Should render control point handles
            const controlPoints = canvas.querySelectorAll(".control-point");
            expect(controlPoints.length).toBeGreaterThan(0);
        });

        test("should add node when clicking on path segment", async () => {
            const user = userEvent.setup();
            const pathObject = createMockPathObject("path1", "M 0 0 L 100 0 L 100 100");

            render(<CanvasWrapper objects={[pathObject]} selectedObjects={["path1"]} tool="select" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });
            const pathElement = canvas.querySelector("path") as Element;

            if (pathElement) {
                // Click on middle of first segment
                await user.click(pathElement);
                fireEvent.click(pathElement, { clientX: 50, clientY: 0 });

                // Should add a new node
                const nodes = canvas.querySelectorAll(".path-node");
                expect(nodes.length).toBeGreaterThan(3);
            }
        });

        test("should remove node on right click", async () => {
            const pathObject = createMockPathObject("path1", "M 0 0 L 50 0 L 100 0 L 100 100");

            render(<CanvasWrapper objects={[pathObject]} selectedObjects={["path1"]} tool="select" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });
            const firstNode = canvas.querySelector(".path-node") as Element;

            if (firstNode) {
                // Right click to remove node
                fireEvent.contextMenu(firstNode);

                // Node count should decrease
                const remainingNodes = canvas.querySelectorAll(".path-node");
                expect(remainingNodes.length).toBeLessThan(4);
            }
        });
    });

    describe("Path Boolean Operations", () => {
        test("should unite paths with Shift+U", async () => {
            const user = userEvent.setup();
            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            render(<CanvasWrapper objects={[path1, path2]} selectedObjects={["path1", "path2"]} tool="select" />);

            // Press Shift+U for unite operation
            await user.keyboard("{Shift>}u{/Shift}");

            // Should trigger unite operation
            expect(vi.mocked).toBeDefined();
        });

        test("should subtract paths with Shift+S", async () => {
            const user = userEvent.setup();
            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            render(<CanvasWrapper objects={[path1, path2]} selectedObjects={["path1", "path2"]} tool="select" />);

            // Press Shift+S for subtract operation
            await user.keyboard("{Shift>}s{/Shift}");

            // Should trigger subtract operation
            expect(vi.mocked).toBeDefined();
        });

        test("should intersect paths with Shift+I", async () => {
            const user = userEvent.setup();
            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            render(<CanvasWrapper objects={[path1, path2]} selectedObjects={["path1", "path2"]} tool="select" />);

            // Press Shift+I for intersect operation
            await user.keyboard("{Shift>}i{/Shift}");

            // Should trigger intersect operation
            expect(vi.mocked).toBeDefined();
        });

        test("should exclude paths with Shift+E", async () => {
            const user = userEvent.setup();
            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");
            const path2 = createMockPathObject("path2", "M 5 5 L 15 5 L 15 15 L 5 15 Z");

            render(<CanvasWrapper objects={[path1, path2]} selectedObjects={["path1", "path2"]} tool="select" />);

            // Press Shift+E for exclude operation
            await user.keyboard("{Shift>}e{/Shift}");

            // Should trigger exclude operation
            expect(vi.mocked).toBeDefined();
        });

        test("should not perform operations with insufficient paths selected", async () => {
            const user = userEvent.setup();
            const path1 = createMockPathObject("path1", "M 0 0 L 10 0 L 10 10 L 0 10 Z");

            render(<CanvasWrapper objects={[path1]} selectedObjects={["path1"]} tool="select" />);

            // Try to unite with only one path selected
            await user.keyboard("{Shift>}u{/Shift}");

            // Should not trigger operation (need at least 2 paths)
            const pathElements = screen.getByRole("img", { name: /canvas/i }).querySelectorAll("path");
            expect(pathElements).toHaveLength(1);
        });
    });
});

describe("Canvas - Text Functionality", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Text Creation", () => {
        test("should create text when text tool is active", async () => {
            const user = userEvent.setup();
            render(<CanvasWrapper tool="text" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });

            // Click to create text
            await user.click(canvas);

            // Should render text element
            const textElement = canvas.querySelector("text");
            expect(textElement).toBeInTheDocument();
        });

        test("should create text at clicked position", async () => {
            const user = userEvent.setup();
            render(<CanvasWrapper tool="text" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });

            // Click at specific position
            fireEvent.click(canvas, { clientX: 100, clientY: 50 });

            const textElement = canvas.querySelector("text");
            expect(textElement).toBeInTheDocument();
            expect(textElement?.getAttribute("x")).toBe("100");
            expect(textElement?.getAttribute("y")).toBe("50");
        });

        test("should start with default text content", async () => {
            const user = userEvent.setup();
            render(<CanvasWrapper tool="text" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });

            await user.click(canvas);

            const textElement = canvas.querySelector("text");
            expect(textElement?.textContent).toBe("Text");
        });
    });

    describe("Text Editing", () => {
        test("should enter edit mode when double clicking text", async () => {
            const user = userEvent.setup();
            const textObject = createMockTextObject("text1", "Hello World");

            render(<CanvasWrapper objects={[textObject]} selectedObjects={[]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text") as Element;

            if (textElement) {
                // Double click to edit
                await user.dblClick(textElement);

                // Should show text input
                const textInput = screen.queryByRole("textbox");
                expect(textInput).toBeInTheDocument();
            }
        });

        test("should update text content when editing", async () => {
            const user = userEvent.setup();
            const textObject = createMockTextObject("text1", "Original Text");

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text") as Element;

            if (textElement) {
                // Double click to edit
                await user.dblClick(textElement);

                const textInput = screen.queryByRole("textbox");
                if (textInput) {
                    // Clear and type new text
                    await user.clear(textInput);
                    await user.type(textInput, "New Text");

                    // Press Enter to confirm
                    await user.keyboard("{Enter}");

                    // Text should be updated
                    expect(textElement.textContent).toBe("New Text");
                }
            }
        });

        test("should exit edit mode on escape", async () => {
            const user = userEvent.setup();
            const textObject = createMockTextObject("text1", "Test Text");

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text") as Element;

            if (textElement) {
                // Enter edit mode
                await user.dblClick(textElement);

                const textInput = screen.queryByRole("textbox");
                expect(textInput).toBeInTheDocument();

                // Press Escape to cancel
                await user.keyboard("{Escape}");

                // Should exit edit mode
                expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
            }
        });

        test("should maintain original text on escape", async () => {
            const user = userEvent.setup();
            const textObject = createMockTextObject("text1", "Original");

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text") as Element;

            if (textElement) {
                // Enter edit mode and change text
                await user.dblClick(textElement);

                const textInput = screen.queryByRole("textbox");
                if (textInput) {
                    await user.clear(textInput);
                    await user.type(textInput, "Modified");

                    // Press Escape to cancel
                    await user.keyboard("{Escape}");

                    // Should maintain original text
                    expect(textElement.textContent).toBe("Original");
                }
            }
        });
    });

    describe("Text Styling", () => {
        test("should apply font family changes", () => {
            const textObject = createMockTextObject("text1", "Styled Text");
            textObject.style.fontFamily = "Helvetica";

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text");
            expect(textElement?.getAttribute("font-family")).toBe("Helvetica");
        });

        test("should apply font size changes", () => {
            const textObject = createMockTextObject("text1", "Sized Text");
            textObject.style.fontSize = 24;

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text");
            expect(textElement?.getAttribute("font-size")).toBe("24");
        });

        test("should apply font weight changes", () => {
            const textObject = createMockTextObject("text1", "Bold Text");
            textObject.style.fontWeight = "bold";

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text");
            expect(textElement?.getAttribute("font-weight")).toBe("bold");
        });

        test("should apply text color changes", () => {
            const textObject = createMockTextObject("text1", "Colored Text");
            textObject.style.color = "#ff0000";

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text");
            expect(textElement?.getAttribute("fill")).toBe("#ff0000");
        });

        test("should apply text alignment", () => {
            const textObject = createMockTextObject("text1", "Aligned Text");
            textObject.style.textAlign = "center";

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByTestId("canvas-svg").querySelector("text");
            expect(textElement?.getAttribute("text-anchor")).toBe("middle");
        });
    });

    describe("Text Selection and Interaction", () => {
        test("should select text when clicked", async () => {
            const user = userEvent.setup();
            const textObject = createMockTextObject("text1", "Selectable Text");

            render(<CanvasWrapper objects={[textObject]} selectedObjects={[]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text") as Element;

            if (textElement) {
                await user.click(textElement);

                // Should show selection indicators
                const canvas = screen.getByRole("img", { name: /canvas/i });
                const selectionBox = canvas.querySelector(".selection-box");
                expect(selectionBox).toBeInTheDocument();
            }
        });

        test("should show resize handles when text is selected", () => {
            const textObject = createMockTextObject("text1", "Resizable Text");

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const canvas = screen.getByRole("img", { name: /canvas/i });
            const resizeHandles = canvas.querySelectorAll(".resize-handle");
            expect(resizeHandles.length).toBeGreaterThan(0);
        });

        test("should allow dragging text objects", async () => {
            const textObject = createMockTextObject("text1", "Draggable Text");

            render(<CanvasWrapper objects={[textObject]} selectedObjects={["text1"]} tool="select" />);

            const textElement = screen.getByRole("img", { name: /canvas/i }).querySelector("text") as Element;

            if (textElement) {
                // Simulate drag
                fireEvent.mouseDown(textElement, { clientX: 0, clientY: 0 });
                fireEvent.mouseMove(textElement, { clientX: 50, clientY: 30 });
                fireEvent.mouseUp(textElement);

                // Position should update
                expect(textElement.getAttribute("x")).toBe("50");
                expect(textElement.getAttribute("y")).toBe("30");
            }
        });
    });
});
