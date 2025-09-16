import { useEffect, useRef, useState } from "react";
import { type ExportOptions } from "../../utils";

import cn from "classnames";
import "./exportPreview.css";

interface ExportPreviewProps {
    svgElement: SVGElement | null;
    exportOptions: ExportOptions;
    className?: string;
}

export function ExportPreview({ svgElement, exportOptions, className }: ExportPreviewProps) {
    const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!svgElement) return;

        const generatePreview = async () => {
            try {
                const { width = 512, height = 512, scale = 1 } = exportOptions;
                const finalWidth = Math.round(width * scale);
                const finalHeight = Math.round(height * scale);

                // Clone and modify SVG for preview
                const svgClone = svgElement.cloneNode(true) as SVGElement;
                svgClone.setAttribute("width", finalWidth.toString());
                svgClone.setAttribute("height", finalHeight.toString());

                const svgData = new XMLSerializer().serializeToString(svgClone);
                const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;

                if (exportOptions.format === "svg") {
                    // For SVG, just use the data URL directly
                    setPreviewDataUrl(svgDataUrl);
                } else if (exportOptions.format === "png") {
                    // For PNG, render to canvas to show raster result
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    // Set canvas size for preview (max 200px)
                    const previewScale = Math.min(200 / finalWidth, 200 / finalHeight);
                    const previewWidth = Math.round(finalWidth * previewScale);
                    const previewHeight = Math.round(finalHeight * previewScale);

                    canvas.width = previewWidth;
                    canvas.height = previewHeight;

                    const img = new Image();
                    img.onload = () => {
                        // Clear canvas and set background
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, previewWidth, previewHeight);

                        // Draw the SVG
                        ctx.drawImage(img, 0, 0, previewWidth, previewHeight);

                        // Convert to data URL
                        const pngDataUrl = canvas.toDataURL("image/png", exportOptions.quality || 0.9);
                        setPreviewDataUrl(pngDataUrl);
                    };
                    img.src = svgDataUrl;
                }
            } catch (error) {
                console.error("Failed to generate preview:", error);
                setPreviewDataUrl("");
            }
        };

        generatePreview();
    }, [svgElement, exportOptions]);

    const { width = 512, height = 512, scale = 1 } = exportOptions;
    const finalWidth = Math.round(width * scale);
    const finalHeight = Math.round(height * scale);
    const aspectRatio = finalWidth / finalHeight;

    const exportPreviewCn = cn("ExportPreview", className, {
        "ExportPreview--square": aspectRatio === 1,
        "ExportPreview--landscape": aspectRatio > 1,
        "ExportPreview--portrait": aspectRatio < 1,
    });

    const formatInfo = {
        svg: "Vector (scalable)",
        png: `Raster (${Math.round((exportOptions.quality || 0.9) * 100)}% quality)`,
        json: "Project data",
    };

    return (
        <div className={exportPreviewCn}>
            <div className="ExportPreview__header">
                <h4 className="ExportPreview__title">Export Preview</h4>
                <div className="ExportPreview__info">
                    <span className="ExportPreview__format">{exportOptions.format.toUpperCase()}</span>
                    <span className="ExportPreview__size">
                        {finalWidth} × {finalHeight}px
                    </span>
                </div>
            </div>

            <div className="ExportPreview__content">
                {exportOptions.format === "json" ? (
                    <div className="ExportPreview__json-placeholder">
                        <div className="ExportPreview__json-icon">📄</div>
                        <div className="ExportPreview__json-text">
                            Project JSON
                            <br />
                            Configuration Data
                        </div>
                    </div>
                ) : (
                    <div className="ExportPreview__image-container">
                        {previewDataUrl ? (
                            <img
                                src={previewDataUrl}
                                alt="Export preview"
                                className="ExportPreview__image"
                                style={{ aspectRatio: aspectRatio }}
                            />
                        ) : (
                            <div className="ExportPreview__loading">Generating preview...</div>
                        )}
                        <canvas ref={canvasRef} className="ExportPreview__canvas" style={{ display: "none" }} />
                    </div>
                )}
            </div>

            <div className="ExportPreview__details">
                <div className="ExportPreview__detail">
                    <span className="ExportPreview__detail-label">Format:</span>
                    <span className="ExportPreview__detail-value">{formatInfo[exportOptions.format]}</span>
                </div>
                <div className="ExportPreview__detail">
                    <span className="ExportPreview__detail-label">Dimensions:</span>
                    <span className="ExportPreview__detail-value">
                        {width} × {height}px
                        {scale !== 1 && ` (×${scale})`}
                    </span>
                </div>
                {exportOptions.format === "png" && exportOptions.quality && (
                    <div className="ExportPreview__detail">
                        <span className="ExportPreview__detail-label">Quality:</span>
                        <span className="ExportPreview__detail-value">{Math.round(exportOptions.quality * 100)}%</span>
                    </div>
                )}
                <div className="ExportPreview__detail">
                    <span className="ExportPreview__detail-label">Estimated size:</span>
                    <span className="ExportPreview__detail-value">
                        {estimateFileSize(exportOptions, finalWidth, finalHeight)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function estimateFileSize(options: ExportOptions, width: number, height: number): string {
    const pixels = width * height;

    switch (options.format) {
        case "svg":
            // SVG size is roughly proportional to complexity, estimate based on basic icon
            const baseSize = 1000; // Base SVG size in bytes
            const complexityFactor = Math.log10(pixels) / 4; // Rough complexity scaling
            const estimatedBytes = baseSize * (1 + complexityFactor);
            return formatBytes(estimatedBytes);

        case "png":
            // PNG size varies with compression, but we can estimate
            const bytesPerPixel = (options.quality || 0.9) * 3; // RGB with compression
            const estimatedPngBytes = pixels * bytesPerPixel * 0.7; // Compression factor
            return formatBytes(estimatedPngBytes);

        case "json":
            // JSON size is fairly predictable for our config
            return "< 1 KB";

        default:
            return "Unknown";
    }
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
}
