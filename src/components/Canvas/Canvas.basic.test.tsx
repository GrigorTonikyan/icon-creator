import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import { Canvas } from "./Canvas";

describe("Canvas Component", () => {
    test("should render canvas SVG element", () => {
        render(
            <EditorProvider>
                <Canvas />
            </EditorProvider>
        );

        const canvas = screen.getByTestId("canvas-svg");
        expect(canvas).toBeInTheDocument();
        expect(canvas.tagName).toBe("svg");
    });

    test("should render with grid", () => {
        render(
            <EditorProvider>
                <Canvas />
            </EditorProvider>
        );

        const canvas = screen.getByTestId("canvas-svg");
        expect(canvas).toBeInTheDocument();

        // Check for grid patterns in SVG
        const defs = canvas.querySelector("defs");
        expect(defs).toBeInTheDocument();
    });
});
