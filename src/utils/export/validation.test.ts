import { describe, expect, test } from "vitest";
import { EXPORT_TEMPLATES, validateExportOptions, type ExportOptions } from "./index";

describe("Export Utilities", () => {
    describe("validateExportOptions", () => {
        test("should validate correct options", () => {
            const options: ExportOptions = {
                format: "svg",
                width: 100,
                height: 100,
                quality: 0.8,
            };

            const errors = validateExportOptions(options);
            expect(errors).toHaveLength(0);
        });

        test("should catch invalid format", () => {
            const options = { format: "invalid" as any };
            const errors = validateExportOptions(options);
            expect(errors).toContain("Invalid format: invalid");
        });

        test("should catch invalid width", () => {
            const options: ExportOptions = {
                format: "png",
                width: -10,
            };

            const errors = validateExportOptions(options);
            expect(errors).toContain("Width must be positive");
        });

        test("should catch invalid height", () => {
            const options: ExportOptions = {
                format: "png",
                height: 0,
            };

            const errors = validateExportOptions(options);
            expect(errors).toContain("Height must be positive");
        });

        test("should catch invalid quality", () => {
            const options: ExportOptions = {
                format: "png",
                quality: 1.5,
            };

            const errors = validateExportOptions(options);
            expect(errors).toContain("Quality must be between 0 and 1");
        });

        test("should catch invalid scale", () => {
            const options: ExportOptions = {
                format: "png",
                scale: -1,
            };

            const errors = validateExportOptions(options);
            expect(errors).toContain("Scale must be positive");
        });

        test("should catch multiple errors", () => {
            const options: ExportOptions = {
                format: "png",
                width: -10,
                height: 0,
                quality: 1.5,
                scale: -1,
            };

            const errors = validateExportOptions(options);
            expect(errors).toHaveLength(4);
            expect(errors).toContain("Width must be positive");
            expect(errors).toContain("Height must be positive");
            expect(errors).toContain("Quality must be between 0 and 1");
            expect(errors).toContain("Scale must be positive");
        });
    });

    describe("export templates", () => {
        test("should have predefined templates", () => {
            expect(EXPORT_TEMPLATES).toHaveLength(3);

            const webIcon = EXPORT_TEMPLATES.find((t) => t.id === "web-icon");
            expect(webIcon).toBeDefined();
            expect(webIcon?.sizes).toHaveLength(3);

            const appIcon = EXPORT_TEMPLATES.find((t) => t.id === "app-icon");
            expect(appIcon).toBeDefined();
            expect(appIcon?.options.quality).toBe(1);

            const printReady = EXPORT_TEMPLATES.find((t) => t.id === "print-ready");
            expect(printReady).toBeDefined();
            expect(printReady?.options.format).toBe("svg");
        });

        test("should have valid template options", () => {
            EXPORT_TEMPLATES.forEach((template) => {
                const errors = validateExportOptions(template.options);
                expect(errors).toHaveLength(0);
            });
        });

        test("web icon template should have correct sizes", () => {
            const webIcon = EXPORT_TEMPLATES.find((t) => t.id === "web-icon");
            expect(webIcon?.sizes).toBeDefined();

            const sizes = webIcon?.sizes!;
            expect(sizes[0]?.name).toBe("Small");
            expect(sizes[0]?.width).toBe(16);
            expect(sizes[0]?.height).toBe(16);

            expect(sizes[1]?.name).toBe("Medium");
            expect(sizes[1]?.width).toBe(32);
            expect(sizes[1]?.height).toBe(32);

            expect(sizes[2]?.name).toBe("Large");
            expect(sizes[2]?.width).toBe(64);
            expect(sizes[2]?.height).toBe(64);
        });
    });
});
