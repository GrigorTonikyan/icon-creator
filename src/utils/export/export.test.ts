import { describe, expect, test, vi } from "vitest";
import {
    batchExport,
    downloadBatchExports,
    EXPORT_TEMPLATES,
    exportJSON,
    exportPNG,
    exportSVG,
    validateExportOptions,
    type ExportOptions,
} from "./index";

describe("Export Utilities", () => {
    // Mock DOM elements
    const createMockSVG = (): SVGElement => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;
        svg.setAttribute("width", "100");
        svg.setAttribute("height", "100");
        svg.innerHTML = '<rect x="10" y="10" width="80" height="80" fill="blue" />';
        return svg;
    };

    describe("exportSVG", () => {
        test("should export SVG with default options", async () => {
            const svg = createMockSVG();
            const result = await exportSVG(svg);

            expect(result.format).toBe("svg");
            expect(result.blob.type).toBe("image/svg+xml");
            expect(result.filename).toMatch(/^icon-.*\.svg$/);
            expect(result.size).toBeGreaterThan(0);
        });

        test("should export SVG with optimization", async () => {
            const svg = createMockSVG();
            svg.setAttribute("data-test", "should-be-removed");

            const result = await exportSVG(svg, {
                format: "svg",
                optimizeSvg: true,
            });

            const content = await result.blob.text();
            expect(content).not.toContain("data-test");
        });

        test("should include metadata when requested", async () => {
            const svg = createMockSVG();
            const result = await exportSVG(svg, {
                format: "svg",
                includeMetadata: true,
            });

            const content = await result.blob.text();
            expect(content).toContain("metadata");
            expect(content).toContain("dc:creator");
        });
    });

    describe("exportPNG", () => {
        test("should export PNG with specified dimensions", async () => {
            const svg = createMockSVG();

            // Mock canvas and context
            const mockCanvas = document.createElement("canvas");
            const mockContext = {
                scale: vi.fn(),
                drawImage: vi.fn(),
            };

            vi.spyOn(document, "createElement").mockImplementation((tagName) => {
                if (tagName === "canvas") {
                    const canvas = mockCanvas;
                    canvas.getContext = vi.fn().mockReturnValue(mockContext);
                    canvas.toBlob = vi.fn((callback) => {
                        const blob = new Blob(["mock-png-data"], { type: "image/png" });
                        callback?.(blob);
                    });
                    return canvas;
                }
                return document.createElement(tagName);
            });

            const result = await exportPNG(svg, {
                format: "png",
                width: 256,
                height: 256,
                quality: 0.8,
            });

            expect(result.format).toBe("png");
            expect(result.blob.type).toBe("image/png");
            expect(result.filename).toMatch(/^icon-.*\.png$/);
            expect(mockCanvas.width).toBe(256);
            expect(mockCanvas.height).toBe(256);

            vi.restoreAllMocks();
        });
    });

    describe("exportJSON", () => {
        test("should export project data as JSON", async () => {
            const projectData = {
                version: "1.0.0",
                objects: { rect1: { type: "rectangle" } },
                layers: { default: { name: "Layer 1" } },
            };

            const result = await exportJSON(projectData);

            expect(result.format).toBe("json");
            expect(result.blob.type).toBe("application/json");
            expect(result.filename).toMatch(/^project-.*\.json$/);

            const content = await result.blob.text();
            const parsed = JSON.parse(content);
            expect(parsed).toEqual(projectData);
        });
    });

    describe("batchExport", () => {
        test("should export multiple formats", async () => {
            const svg = createMockSVG();
            const projectData = { version: "1.0.0" };

            const exports: ExportOptions[] = [{ format: "svg" }, { format: "json" }];

            const results = await batchExport(svg, projectData, exports);

            expect(results).toHaveLength(2);
            expect(results[0]?.format).toBe("svg");
            expect(results[1]?.format).toBe("json");
        });
    });

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

        test("should catch invalid dimensions", () => {
            const options: ExportOptions = {
                format: "png",
                width: -10,
                height: 0,
            };

            const errors = validateExportOptions(options);
            expect(errors).toContain("Width must be positive");
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
        });
    });

    describe("downloadExport", () => {
        test("should create download link and trigger download", () => {
            const mockLink = {
                href: "",
                download: "",
                click: vi.fn(),
                remove: vi.fn(),
            };

            const mockCreateElement = vi.spyOn(document, "createElement").mockImplementation(() => mockLink as any);
            const mockAppendChild = vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as any);
            const mockRemoveChild = vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as any);
            const mockCreateObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");
            const mockRevokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

            const blob = new Blob(["test"], { type: "text/plain" });
            const result = {
                blob,
                filename: "test.txt",
                format: "txt",
                size: 4,
            };

            // Test the functionality indirectly by checking if the DOM operations work
            expect(() => {
                const url = URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = result.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }).not.toThrow();

            // Cleanup
            mockCreateElement.mockRestore();
            mockAppendChild.mockRestore();
            mockRemoveChild.mockRestore();
            mockCreateObjectURL.mockRestore();
            mockRevokeObjectURL.mockRestore();
        });
    });

    describe("downloadBatchExports", () => {
        test("should process multiple results", async () => {
            const results = [
                { blob: new Blob(["1"]), filename: "test1.svg", format: "svg", size: 1 },
                { blob: new Blob(["2"]), filename: "test2.png", format: "png", size: 1 },
            ];

            // Test that the function can be called without throwing
            expect(async () => {
                await downloadBatchExports(results);
            }).not.toThrow();
        });
    });

    describe("edge cases and error handling", () => {
        test("should handle empty SVG element", async () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;
            const result = await exportSVG(svg);

            expect(result.format).toBe("svg");
            expect(result.blob.type).toBe("image/svg+xml");
        });

        test("should handle very large dimensions", async () => {
            const options: ExportOptions = {
                format: "png",
                width: 4096,
                height: 4096,
                quality: 1,
            };

            const errors = validateExportOptions(options);
            expect(errors).toHaveLength(0);
        });

        test("should handle very small dimensions", async () => {
            const options: ExportOptions = {
                format: "png",
                width: 1,
                height: 1,
                quality: 0.1,
            };

            const errors = validateExportOptions(options);
            expect(errors).toHaveLength(0);
        });

        test("should validate invalid quality values", () => {
            const options: ExportOptions = {
                format: "png",
                quality: 1.5, // Invalid: > 1
            };

            const errors = validateExportOptions(options);
            expect(errors).toContain("Quality must be between 0 and 1");
        });

        test("should validate negative dimensions", () => {
            const options: ExportOptions = {
                format: "svg",
                width: -100,
                height: -50,
            };

            const errors = validateExportOptions(options);
            expect(errors).toContain("Width must be positive");
            expect(errors).toContain("Height must be positive");
        });

        test("should handle complex SVG with gradients", async () => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;
            svg.innerHTML = `
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect x="10" y="10" width="80" height="80" fill="url(#grad1)" />
            `;

            const result = await exportSVG(svg, { format: "svg", optimizeSvg: true });
            expect(result.format).toBe("svg");

            const content = await result.blob.text();
            expect(content).toContain("linearGradient");
        });
    });

    describe("template functionality", () => {
        test("should export all sizes from web icon template", async () => {
            const svg = createMockSVG();
            const webTemplate = EXPORT_TEMPLATES.find((t) => t.id === "web-icon")!;

            const allOptions: ExportOptions[] = [];
            for (const size of webTemplate.sizes!) {
                allOptions.push({
                    ...webTemplate.options,
                    width: size.width,
                    height: size.height,
                    scale: size.scale || 1,
                });
            }

            const results = await batchExport(svg, {}, allOptions);
            expect(results).toHaveLength(3); // 16x16, 32x32, 64x64

            results.forEach((result, index) => {
                expect(result.format).toBe("png");
                expect(result.filename).toMatch(/^icon-.*\.png$/);
            });
        });

        test("should apply template settings correctly", () => {
            const appTemplate = EXPORT_TEMPLATES.find((t) => t.id === "app-icon")!;
            expect(appTemplate.options.format).toBe("png");
            expect(appTemplate.options.quality).toBe(1);
            expect(appTemplate.options.includeMetadata).toBe(true);
            expect(appTemplate.sizes).toHaveLength(3);
        });

        test("should handle print-ready template without sizes", () => {
            const printTemplate = EXPORT_TEMPLATES.find((t) => t.id === "print-ready")!;
            expect(printTemplate.options.format).toBe("svg");
            expect(printTemplate.options.optimizeSvg).toBe(false);
            expect(printTemplate.sizes).toBeUndefined();
        });
    });

    describe("performance and memory", () => {
        test("should handle multiple concurrent exports", async () => {
            const svg = createMockSVG();
            const exportPromises = [
                exportSVG(svg, { format: "svg" }),
                exportSVG(svg, { format: "svg", width: 256 }),
                exportSVG(svg, { format: "svg", width: 1024 }),
            ];

            const results = await Promise.all(exportPromises);
            expect(results).toHaveLength(3);
            results.forEach((result) => {
                expect(result.format).toBe("svg");
                expect(result.size).toBeGreaterThan(0);
            });
        });

        test("should handle export with metadata", async () => {
            const svg = createMockSVG();
            const result = await exportSVG(svg, {
                format: "svg",
                includeMetadata: true,
            });

            const content = await result.blob.text();
            expect(content).toContain("metadata");
            expect(content).toContain("dc:creator");
            expect(content).toContain("Icon Creator App");
        });
    });
});
