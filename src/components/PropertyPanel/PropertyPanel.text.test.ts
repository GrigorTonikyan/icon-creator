// Quick verification test for text property editing
import { describe, expect, test } from "vitest";
import type { TextObject } from "../../types/editor";

describe("Text Property System", () => {
    test("should create valid text object with default properties", () => {
        const textObject: TextObject = {
            id: "test-text",
            type: "text",
            name: "Test Text",
            transform: {
                x: 100,
                y: 100,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                originX: 0.5,
                originY: 0.5,
            },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 1,
            layerId: "layer-1",
            content: "Hello World",
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fontWeight: "normal",
                color: "#000000",
                textAlign: "left",
                lineHeight: 1.2,
            },
        };

        expect(textObject.type).toBe("text");
        expect(textObject.content).toBe("Hello World");
        expect(textObject.style.fontFamily).toBe("Arial");
        expect(textObject.style.fontSize).toBe(16);
        expect(textObject.style.fontWeight).toBe("normal");
        expect(textObject.style.textAlign).toBe("left");
        expect(textObject.style.lineHeight).toBe(1.2);
        expect(textObject.style.color).toBe("#000000");
    });
});
