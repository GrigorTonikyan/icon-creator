import { useRef, useState } from "react";
import { ConfigPanel } from "../../components/ConfigPanel/configPanel";
import { IconPreview } from "../../components/IconPreview/iconPreview";
import { Button } from "../../components/ui";
import { defaultIconConfig, type IconConfig } from "../../types/iconConfig";
import { LayoutRegion } from "../Layout";

import cn from "classnames";
import "./iconCreator.css";

interface IconCreatorProps {
    className?: string;
}

export function IconCreator({ className }: IconCreatorProps) {
    const [config, setConfig] = useState<IconConfig>(defaultIconConfig);
    const iconPreviewRef = useRef<HTMLDivElement>(null);

    const handleConfigChange = (newConfig: IconConfig) => {
        setConfig(newConfig);
    };

    const handleExport = () => {
        // Grab the actual DOM of IconPreview
        const iconNode = iconPreviewRef.current;
        if (!iconNode) return;
        // Get the HTML for the IconPreview (including title if present)
        const htmlContent = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\" />\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n<title>Icon</title>\n</head>\n<body>\n${iconNode.outerHTML}\n</body>\n</html>`;
        downloadHTML(htmlContent, "icon.html");
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
                    <Button onClick={handleExport} className="export-btn">
                        Export HTML
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
        </>
    );
}

function downloadHTML(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
