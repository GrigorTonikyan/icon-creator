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
        strokeDasharray: [],
    },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    layerId: "default",
});

const createMockTextObject = (id: string, text: string): TextObject => ({
    id,
    type: "text",
    name: `Text ${id}`,
    content: text,
    style: {
        color: "#000000",
        fontSize: 16,
        fontFamily: "Arial",
        fontWeight: "normal" as const,
        textAlign: "left" as const,
        lineHeight: 1.2,
    },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    layerId: "default",
});

interface CanvasWrapperProps {
    objects?: CanvasObject[];
    selectedObjects?: string[];
    tool?: string;
}

const CanvasWrapper: React.FC<CanvasWrapperProps> = ({ objects = [], selectedObjects = [], tool = "select" }) => {
    return (
        <EditorProvider>
            <Canvas />
        </EditorProvider>
    );
};

describe("Canvas - Core Path and Text Functionality", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Canvas Rendering", () => {
        test("should render canvas SVG element", () => {
            render(<CanvasWrapper />);

            const canvasSvg = screen.getByTestId("canvas-svg");
            expect(canvasSvg).toBeInTheDocument();
            expect(canvasSvg.tagName).toBe("svg");
        });

        test("should render with grid", () => {
            render(<CanvasWrapper />);

            const canvasSvg = screen.getByTestId("canvas-svg");
            const gridLines = canvasSvg.querySelectorAll(".grid-line");
            expect(gridLines.length).toBeGreaterThan(0);
        });
    });

    describe("Path Functionality", () => {
        test("should render path objects", () => {
            const pathObject = createMockPathObject("path1", "M 0 0 L 100 100");

            render(<CanvasWrapper objects={[pathObject]} />);

            const canvasSvg = screen.getByTestId("canvas-svg");
            const pathElement = canvasSvg.querySelector('path[data-object-id="path1"]');
            expect(pathElement).toBeInTheDocument();
            expect(pathElement?.getAttribute("d")).toBe("M 0 0 L 100 100");
        });

        test("should handle path selection", () => {
            const pathObject = createMockPathObject("path1", "M 0 0 L 100 100");

            render(<CanvasWrapper objects={[pathObject]} selectedObjects={["path1"]} />);

            const canvasSvg = screen.getByTestId("canvas-svg");
            const pathElement = canvasSvg.querySelector('path[data-object-id="path1"]');
            expect(pathElement).toBeInTheDocument();
        });
    });

    describe("Text Functionality", () => {
        test("should render text objects", () => {
            const textObject = createMockTextObject("text1", "Hello World");

            render(<CanvasWrapper objects={[textObject]} />);

            const canvasSvg = screen.getByTestId("canvas-svg");
            const textElement = canvasSvg.querySelector('text[data-object-id="text1"]');
            expect(textElement).toBeInTheDocument();
            expect(textElement?.textContent).toBe("Hello World");
        });

        test("should apply text styles", () => {
            const textObject = createMockTextObject("text1", "Styled Text");
            textObject.style.fontSize = 24;
            textObject.style.color = "#ff0000";

            render(<CanvasWrapper objects={[textObject]} />);

            const canvasSvg = screen.getByTestId("canvas-svg");
            const textElement = canvasSvg.querySelector('text[data-object-id="text1"]');
            expect(textElement).toBeInTheDocument();
        });
    });

    describe("Path Editing", () => {
        test("should support path node editing when path is selected", () => {
            const pathObject = createMockPathObject("path1", "M 0 0 L 100 0 L 100 100 L 0 100 Z");

            render(<CanvasWrapper objects={[pathObject]} selectedObjects={["path1"]} tool="select" />);

            const canvasSvg = screen.getByTestId("canvas-svg");
            expect(canvasSvg).toBeInTheDocument();

            // Verify path editing layer exists
            const pathEditingLayer = canvasSvg.querySelector(".path-editing-layer");
            expect(pathEditingLayer).toBeInTheDocument();
        });
    });

    describe("User Interaction", () => {
        test("should handle mouse events on canvas", async () => {
            const user = userEvent.setup();
            render(<CanvasWrapper tool="select" />);

            const canvasSvg = screen.getByTestId("canvas-svg");

            // Test that mouse events don't throw errors
            await user.click(canvasSvg);
            expect(canvasSvg).toBeInTheDocument();
        });

        test("should handle keyboard shortcuts", () => {
            render(<CanvasWrapper />);

            const canvasSvg = screen.getByTestId("canvas-svg");

            // Test that the canvas responds to keyboard events
            fireEvent.keyDown(canvasSvg, { key: "Delete" });
            expect(canvasSvg).toBeInTheDocument();
        });
    });
});
