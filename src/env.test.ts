import { describe, expect, test } from "vitest";

describe("Basic Environment", () => {
    test("should have DOM environment", () => {
        expect(typeof document).toBe("object");
        expect(document.createElement).toBeDefined();
        expect(document.body).toBeDefined();
    });

    test("should have window object", () => {
        expect(typeof window).toBe("object");
        expect(window.document).toBe(document);
    });
});
