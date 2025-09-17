import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EditorProvider, useEditor } from "../../contexts/EditorContext";
import type { RectangleObject, LinearGradient } from "../../types/editor";
import { Canvas } from "./Canvas";

// Test wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

describe("Canvas Gradient Integration", () => {
    test("should render canvas with gradient definitions", () => {
        render(<GradientTestWrapper />);

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

        render(<GradientTestWrapper objects={[rectangle]} />);

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

        render(<GradientTestWrapper objects={[rectangle]} />);

        const canvas = screen.getByTestId("canvas-svg");

        // Check that rectangle uses solid color fill
        const rect = canvas.querySelector('rect[data-object-id="rect2"]');
        expect(rect).toBeInTheDocument();
        expect(rect).toHaveAttribute("fill", "#ff0000");
    });

    test("should handle multiple objects with different fill types", () => {
        // Create gradient
        const gradient: LinearGradient = {
            type: "linear",
            id: "multi-gradient",
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            stops: [
                { offset: 0, color: "#00ff00" },
                { offset: 1, color: "#ff00ff" },
            ],
        };

        // Create multiple rectangles
        const objects = [
            {
                id: "rect-solid",
                type: "rectangle",
                name: "Solid Rectangle",
                transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 0,
                layerId: "default",
                width: 50,
                height: 50,
                style: { fill: "#ffff00" },
            },
            {
                id: "rect-gradient",
                type: "rectangle",
                name: "Gradient Rectangle",
                transform: { x: 60, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
                visible: true,
                locked: false,
                opacity: 1,
                zIndex: 1,
                layerId: "default",
                width: 50,
                height: 50,
                style: { fill: gradient },
            },
        ];

        render(<GradientTestWrapper objects={objects} />);

        const canvas = screen.getByTestId("canvas-svg");

        // Check solid fill rectangle
        const solidRect = canvas.querySelector('rect[data-object-id="rect-solid"]');
        expect(solidRect).toHaveAttribute("fill", "#ffff00");

        // Check gradient fill rectangle and definition
        const gradientRect = canvas.querySelector('rect[data-object-id="rect-gradient"]');
        expect(gradientRect).toHaveAttribute("fill", "url(#multi-gradient)");

        const gradientDef = canvas.querySelector('linearGradient[id="multi-gradient"]');
        expect(gradientDef).toBeInTheDocument();
    });
});
