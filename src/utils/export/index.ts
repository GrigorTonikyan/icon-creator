/**
 * Export utilities for the icon creator application
 * Supports SVG, PNG, and JSON export formats with quality options
 */

export interface ExportOptions {
    format: "svg" | "png" | "json";
    width?: number;
    height?: number;
    scale?: number;
    quality?: number; // For PNG (0-1)
    includeMetadata?: boolean;
    optimizeSvg?: boolean;
    area?: ExportArea;
}

export interface ExportArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ExportTemplate {
    id: string;
    name: string;
    options: ExportOptions;
    sizes?: ExportSize[];
}

export interface ExportSize {
    name: string;
    width: number;
    height: number;
    scale?: number;
}

export interface ExportResult {
    blob: Blob;
    filename: string;
    format: string;
    size: number;
}

/**
 * Export SVG content from canvas
 */
export async function exportSVG(
    canvasElement: SVGElement,
    options: ExportOptions = { format: "svg" }
): Promise<ExportResult> {
    const svgContent = getSVGContent(canvasElement, options);
    const optimizedContent = options.optimizeSvg ? optimizeSVGContent(svgContent) : svgContent;

    const blob = new Blob([optimizedContent], { type: "image/svg+xml" });
    const filename = generateFilename("icon", "svg");

    return {
        blob,
        filename,
        format: "svg",
        size: blob.size,
    };
}

/**
 * Export PNG raster image from SVG
 */
/**
 * Export project as PNG image
 */
export async function exportPNG(
    svgElement: SVGElement,
    options: ExportOptions = { format: "png" }
): Promise<ExportResult> {
    const { width = 512, height = 512, scale = 1, quality = 0.9 } = options;

    // Validate options
    const validationErrors = validateExportOptions({
        ...options,
        format: "png",
        width,
        height,
    });
    if (validationErrors.length > 0) {
        throw new Error(`PNG export validation failed: ${validationErrors.join(", ")}`);
    }

    const finalWidth = Math.round(width * scale);
    const finalHeight = Math.round(height * scale);

    // Convert SVG to data URL for PNG conversion
    const svgData = new XMLSerializer().serializeToString(svgElement);

    // Ensure SVG has proper dimensions
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, "image/svg+xml");
    const svg = svgDoc.documentElement;
    svg.setAttribute("width", finalWidth.toString());
    svg.setAttribute("height", finalHeight.toString());

    const modifiedSvgData = new XMLSerializer().serializeToString(svg);
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(modifiedSvgData)))}`;

    // Create canvas for rasterization
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Canvas context not available");
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    try {
        // Create image and draw to canvas
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                // Set white background for PNG
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, finalWidth, finalHeight);

                // Draw the SVG image
                ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
                resolve();
            };
            img.onerror = (error) => reject(new Error(`Failed to load SVG image: ${error}`));
            img.src = svgDataUrl;
        });

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to create PNG blob"));
                    }
                },
                "image/png",
                quality
            );
        });

        const filename = generateFilename("icon", "png");

        return {
            blob,
            filename,
            format: "png" as const,
            size: blob.size,
        };
    } catch (error) {
        throw new Error(`PNG export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Export project data as JSON
 */
export async function exportJSON(projectData: any, options: ExportOptions = { format: "json" }): Promise<ExportResult> {
    const jsonContent = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const filename = generateFilename("project", "json");

    return {
        blob,
        filename,
        format: "json",
        size: blob.size,
    };
}

/**
 * Batch export multiple formats/sizes
 */
export async function batchExport(
    canvasElement: SVGElement,
    projectData: any,
    exports: ExportOptions[]
): Promise<ExportResult[]> {
    const results = await Promise.all(
        exports.map(async (options) => {
            switch (options.format) {
                case "svg":
                    return exportSVG(canvasElement, options);
                case "png":
                    return exportPNG(canvasElement, options);
                case "json":
                    return exportJSON(projectData, options);
                default:
                    throw new Error(`Unsupported export format: ${options.format}`);
            }
        })
    );

    return results;
}

/**
 * Download export result
 */
export function downloadExport(result: ExportResult): void {
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Download multiple export results as ZIP
 */
export async function downloadBatchExports(results: ExportResult[]): Promise<void> {
    // For now, download individually
    // TODO: Implement ZIP creation
    results.forEach((result) => downloadExport(result));
}

/**
 * Get SVG content with optional area cropping
 */
function getSVGContent(canvasElement: SVGElement, options: ExportOptions): string {
    let svgContent = new XMLSerializer().serializeToString(canvasElement);

    if (options.area) {
        // TODO: Implement area cropping
        // For now, return full SVG
    }

    if (options.includeMetadata) {
        svgContent = addSVGMetadata(svgContent);
    }

    return svgContent;
}

/**
 * Optimize SVG content by removing unnecessary attributes
 */
function optimizeSVGContent(svgContent: string): string {
    // Basic optimization - remove data attributes and unnecessary whitespace
    return svgContent
        .replace(/\s+data-[a-z-]+="[^"]*"/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Add metadata to SVG content
 */
function addSVGMetadata(svgContent: string): string {
    const metadata = `
    <metadata>
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
               xmlns:dc="http://purl.org/dc/elements/1.1/">
        <rdf:Description>
          <dc:creator>Icon Creator App</dc:creator>
          <dc:date>${new Date().toISOString()}</dc:date>
        </rdf:Description>
      </rdf:RDF>
    </metadata>
  `;

    return svgContent.replace("<svg", `<svg${metadata}<svg`);
}

/**
 * Create image from SVG content
 */
function createImageFromSVG(svgContent: string, width: number, height: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG image"));
        };

        img.src = url;
    });
}

/**
 * Generate filename with timestamp
 */
function generateFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): string[] {
    const errors: string[] = [];

    if (!["svg", "png", "json"].includes(options.format)) {
        errors.push(`Invalid format: ${options.format}`);
    }

    if (options.width !== undefined && options.width <= 0) {
        errors.push("Width must be positive");
    }

    if (options.height !== undefined && options.height <= 0) {
        errors.push("Height must be positive");
    }

    if (options.scale && options.scale <= 0) {
        errors.push("Scale must be positive");
    }

    if (options.quality && (options.quality < 0 || options.quality > 1)) {
        errors.push("Quality must be between 0 and 1");
    }

    return errors;
}

/**
 * Predefined export templates
 */
export const EXPORT_TEMPLATES: ExportTemplate[] = [
    {
        id: "web-icon",
        name: "Web Icon",
        options: { format: "png", includeMetadata: false },
        sizes: [
            { name: "Small", width: 16, height: 16 },
            { name: "Medium", width: 32, height: 32 },
            { name: "Large", width: 64, height: 64 },
        ],
    },
    {
        id: "app-icon",
        name: "App Icon",
        options: { format: "png", quality: 1, includeMetadata: true },
        sizes: [
            { name: "iOS Small", width: 120, height: 120 },
            { name: "iOS Large", width: 180, height: 180 },
            { name: "Android", width: 192, height: 192 },
        ],
    },
    {
        id: "print-ready",
        name: "Print Ready",
        options: { format: "svg", includeMetadata: true, optimizeSvg: false },
    },
];
