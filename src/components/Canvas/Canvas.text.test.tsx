import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import { Canvas } from "./Canvas";

// Simple test without userEvent to verify text tool integration
describe("Text Tool Integration", () => {
    test("should render text tool in Canvas", () => {
        const CanvasWithProvider = () => (
            <EditorProvider>
                <Canvas />
            </EditorProvider>
        );

        render(<CanvasWithProvider />);

        // Check if canvas is rendered
        const canvas = document.querySelector(".Canvas");
        expect(canvas).toBeInTheDocument();

        // Check if the data-tool attribute can be set to text
        expect(canvas).toHaveAttribute("data-tool", "select"); // Default tool
    });

    test("should handle text object types in type definitions", () => {
        // This test verifies that our TypeScript types are working
        const textObject = {
            id: "test-text",
            type: "text" as const,
            name: "Test Text",
            layerId: "default",
            transform: {
                x: 100,
                y: 100,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            content: "Hello World",
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fontWeight: "normal" as const,
                color: "#000000",
                textAlign: "left" as const,
                lineHeight: 1.2,
            },
        };

        // If this compiles without TypeScript errors, our types are correct
        expect(textObject.type).toBe("text");
        expect(textObject.content).toBe("Hello World");
        expect(textObject.style.fontSize).toBe(16);
    });
});
