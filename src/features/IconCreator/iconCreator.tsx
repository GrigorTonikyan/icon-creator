import { useEffect, useRef, useState } from "react";
import { ConfigPanel } from "../../components/ConfigPanel/configPanel";
import { ExportControls } from "../../components/ExportControls";
import { IconPreview } from "../../components/IconPreview/iconPreview";
import { Button } from "../../components/ui";
import { defaultIconConfig, type IconConfig } from "../../types/iconConfig";
import {
    batchExport,
    downloadBatchExports,
    downloadExport,
    exportJSON,
    exportPNG,
    exportSVG,
    type ExportOptions,
    type ExportTemplate,
} from "../../utils";
import { LayoutRegion } from "../Layout";

import cn from "classnames";
import "./iconCreator.css";

interface IconCreatorProps {
    className?: string;
}

export function IconCreator({ className }: IconCreatorProps) {
    const [config, setConfig] = useState<IconConfig>(defaultIconConfig);
    const iconPreviewRef = useRef<HTMLDivElement>(null);
    const [currentSVGElement, setCurrentSVGElement] = useState<SVGElement | null>(null);

    const handleConfigChange = (newConfig: IconConfig) => {
        setConfig(newConfig);
    };

    // Update SVG element reference whenever the icon changes
    useEffect(() => {
        const iconNode = iconPreviewRef.current;
        if (iconNode) {
            const svgElement = iconNode.querySelector("svg");
            setCurrentSVGElement(svgElement);
        }
    }, [config]); // Update when config changes

    const handleExport = async (options: ExportOptions) => {
        try {
            let result;

            if (options.format === "json") {
                // Export project data as JSON
                const projectData = {
                    version: "1.0.0",
                    config,
                    timestamp: new Date().toISOString(),
                    appVersion: "1.0.0",
                };
                result = await exportJSON(projectData, options);
            } else {
                // Export SVG or PNG - need SVG element
                const iconNode = iconPreviewRef.current;
                if (!iconNode) {
                    console.error("No icon preview found");
                    return;
                }

                const svgElement = iconNode.querySelector("svg");
                if (!svgElement) {
                    console.error("No SVG element found in icon preview");
                    return;
                }

                result =
                    options.format === "svg"
                        ? await exportSVG(svgElement, options)
                        : await exportPNG(svgElement, options);
            }

            downloadExport(result);
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    const handleBatchExport = async (templates: ExportTemplate[]) => {
        try {
            const iconNode = iconPreviewRef.current;
            if (!iconNode) {
                console.error("No icon preview found");
                return;
            }

            const svgElement = iconNode.querySelector("svg");
            if (!svgElement) {
                console.error("No SVG element found in icon preview");
                return;
            }

            // Prepare all export options for batch export
            const allExportOptions: ExportOptions[] = [];

            for (const template of templates) {
                if (template.sizes && template.sizes.length > 0) {
                    // Export each size in the template
                    for (const size of template.sizes) {
                        allExportOptions.push({
                            ...template.options,
                            width: size.width,
                            height: size.height,
                            scale: size.scale || 1,
                        });
                    }
                } else {
                    // Single export
                    allExportOptions.push(template.options);
                }
            }

            const projectData = {
                version: "1.0.0",
                config,
                timestamp: new Date().toISOString(),
                appVersion: "1.0.0",
            };

            const results = await batchExport(svgElement, projectData, allExportOptions);
            await downloadBatchExports(results);
        } catch (error) {
            console.error("Batch export failed:", error);
        }
    };

    const handleQuickExport = async (format: "svg" | "png" = "svg") => {
        // Legacy quick export functionality for backward compatibility
        await handleExport({
            format,
            includeMetadata: true,
            optimizeSvg: format === "svg",
            width: 512,
            height: 512,
            quality: 0.9,
        });
    };
    const handleReset = () => {
        setConfig(defaultIconConfig);
    };

    const iconCreatorCn = cn("icon-creator", className);

    return (
        <>
            <div className={iconCreatorCn}>
                <h1>Icon Creator</h1>
                <header className="preview-controls">
                    <Button onClick={() => handleQuickExport("svg")} className="export-btn">
                        Export SVG
                    </Button>
                    <Button onClick={() => handleQuickExport("png")} className="export-btn">
                        Export PNG
                    </Button>
                    <Button variant="secondary" onClick={handleReset} className="reset-btn">
                        Reset
                    </Button>
                </header>

                <div className="preview-section">
                    <div ref={iconPreviewRef}>
                        <IconPreview config={config} />
                    </div>
                </div>
            </div>
            <LayoutRegion name="aside-l">
                <aside className="config-section">
                    <ConfigPanel config={config} onChange={handleConfigChange} />
                </aside>
            </LayoutRegion>
            <LayoutRegion name="aside-r">
                <aside className="export-section">
                    <ExportControls
                        svgElement={currentSVGElement}
                        onExport={handleExport}
                        onBatchExport={handleBatchExport}
                    />
                </aside>
            </LayoutRegion>
        </>
    );
}
