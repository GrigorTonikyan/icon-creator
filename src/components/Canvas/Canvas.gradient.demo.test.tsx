import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import React from "react";
import { EditorProvider, useEditor } from "../../contexts/EditorContext";
import type { RectangleObject, LinearGradient } from "../../types/editor";
import { Canvas } from "./Canvas";

describe("Canvas Gradient Integration", () => {
    test("should render canvas with gradient definitions", () => {
        render(
            <EditorProvider>
                <Canvas />
            </EditorProvider>
        );

        const canvas = screen.getByTestId("canvas-svg");
        expect(canvas).toBeInTheDocument();

        // Check that defs section exists
        const defs = canvas.querySelector("defs");
        expect(defs).toBeInTheDocument();
        expect(defs).toHaveAttribute("id", "canvas-definitions");
    });

    test("should render rectangle with linear gradient fill", () => {
        // Create a linear gradient
        const gradient: LinearGradient = {
            type: "linear",
            id: "test-gradient",
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            stops: [
                { offset: 0, color: "#ff0000" },
                { offset: 1, color: "#0000ff" },
            ],
        };

        // Create a rectangle with gradient fill
        const rectangle: RectangleObject = {
            id: "rect1",
            type: "rectangle",
            name: "Gradient Rectangle",
            transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            layerId: "default",
            width: 100,
            height: 50,
            style: {
                fill: gradient,
                stroke: "#000000",
                strokeWidth: 2,
            },
        };

        // Create test component that adds object and renders canvas
        const TestComponent = () => {
            const { addObject } = useEditor();

            React.useEffect(() => {
                addObject(rectangle);
            }, [addObject]);

            return <Canvas />;
        };

        render(
            <EditorProvider>
                <TestComponent />
            </EditorProvider>
        );

        const canvas = screen.getByTestId("canvas-svg");

        // Check that gradient definition exists
        const gradientDef = canvas.querySelector('linearGradient[id="test-gradient"]');
        expect(gradientDef).toBeInTheDocument();

        // Check that rectangle uses gradient fill
        const rect = canvas.querySelector('rect[data-object-id="rect1"]');
        expect(rect).toBeInTheDocument();
        expect(rect).toHaveAttribute("fill", "url(#test-gradient)");
    });

    test("should render rectangle with solid color fill", () => {
        // Create a rectangle with solid color fill
        const rectangle: RectangleObject = {
            id: "rect2",
            type: "rectangle",
            name: "Solid Rectangle",
            transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            layerId: "default",
            width: 100,
            height: 50,
            style: {
                fill: "#ff0000",
                stroke: "#000000",
                strokeWidth: 2,
            },
        };

        // Create test component that adds object and renders canvas
        const TestComponent = () => {
            const { addObject } = useEditor();

            React.useEffect(() => {
                addObject(rectangle);
            }, [addObject]);

            return <Canvas />;
        };

        render(
            <EditorProvider>
                <TestComponent />
            </EditorProvider>
        );

        const canvas = screen.getByTestId("canvas-svg");

        // Check that rectangle uses solid color fill
        const rect = canvas.querySelector('rect[data-object-id="rect2"]');
        expect(rect).toBeInTheDocument();
        expect(rect).toHaveAttribute("fill", "#ff0000");
    });
});
