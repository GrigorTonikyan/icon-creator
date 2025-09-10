import cn from "classnames";
import { useState } from "react";
import { ConfigPanel } from "../../components/ConfigPanel/configPanel";
import { IconPreview } from "../../components/IconPreview/iconPreview";
import type { IconConfig } from "../../types/iconConfig";
import { defaultIconConfig } from "../../types/iconConfig";
import "./iconCreator.css";

interface IconCreatorProps {
    className?: string;
}

export function IconCreator({ className }: IconCreatorProps) {
    const [config, setConfig] = useState<IconConfig>(defaultIconConfig);
    const iconCreatorCn = cn("IconCreator", className);

    const handleConfigChange = (newConfig: IconConfig) => {
        setConfig(newConfig);
    };

    const handleExport = () => {
        const htmlContent = generateHTML(config);
        downloadHTML(htmlContent, "icon.html");
    };

    const handleReset = () => {
        setConfig(defaultIconConfig);
    };

    return (
        <div className={iconCreatorCn}>
            <header className="creator-header">
                <h1>Icon Creator</h1>
                <p>Create and customize beautiful glowing UI icons</p>
            </header>

            <main className="creator-main">
                <div className="preview-section">
                    <div className="preview-controls">
                        <button type="button" className="export-btn" onClick={handleExport}>
                            Export HTML
                        </button>
                        <button type="button" className="reset-btn" onClick={handleReset}>
                            Reset
                        </button>
                    </div>
                    <IconPreview config={config} />
                </div>

                <div className="config-section">
                    <ConfigPanel config={config} onChange={handleConfigChange} />
                </div>
            </main>
        </div>
    );
}

function generateHTML(config: IconConfig): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Generated Icon</title>
    <meta name="viewport" content="width=512,initial-scale=1" />
    <style>
        :root {
            --bg-grad-start: ${config.bgGradStart};
            --bg-grad-mid: ${config.bgGradMid};
            --bg-grad-end: ${config.bgGradEnd};
            --panel-top: ${config.panelTop};
            --panel-mid: ${config.panelMid};
            --panel-bot: ${config.panelBot};
            --bar-start: ${config.barStart};
            --bar-end: ${config.barEnd};
            --inactive-start: ${config.inactiveStart};
            --inactive-end: ${config.inactiveEnd};
            --border-glow: ${config.borderGlow};
            --accent: ${config.accent};
        }

        * {
            box-sizing: border-box;
            padding: 0;
            margin: 0;
        }

        body {
            background: #111;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: system-ui, Arial, sans-serif;
        }

        .icon-container {
            display: flex;
            flex-direction: column;
            min-width: 0px;
            align-items: center;
            justify-content: center;
            gap: 10%;
        }

        .icon {
            position: relative;
            width: ${config.iconSize}px;
            height: ${config.iconSize}px;
            border-radius: ${config.borderRadius}px;
            overflow: hidden;
            font-size: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .icon__bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 40%, var(--bg-grad-start) 0%, var(--bg-grad-mid) 60%, var(--bg-grad-end) 100%);
        }

        .panel {
            width: ${config.panelWidth}%;
            height: ${config.panelHeight}%;
            border-radius: 50%;
            background: linear-gradient(var(--panel-top), var(--panel-mid) 60%, var(--panel-bot));
            gap: 10%;
            display: flex;
            flex-direction: column;
        }

        .input-wrap {
            width: 100%;
            height: ${config.inputHeight}px;
            border-radius: 20px;
            background: rgba(14, 33, 54, .55);
            border: 2px solid var(--border-glow);
            filter: drop-shadow(0 0 10px rgba(111, 214, 255, .35)) drop-shadow(0 0 22px rgba(10, 160, 255, .25));
            display: flex;
            align-items: center;
        }

        .input-bar {
            width: 170px;
            height: 42px;
            border-radius: 6px;
            background: linear-gradient(90deg, var(--bar-start), var(--bar-end));
            border: 1px solid #d9e8f2;
            display: flex;
            align-items: center;
            padding: 0 10px;
            font: 500 34px/1 system-ui, Arial, sans-serif;
            color: #354556;
            text-transform: lowercase;
        }

        .input-bar::after {
            content: "${config.inputText}";
        }

        .check {
            width: 48px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .check::before {
            content: "";
            width: 38px;
            height: 38px;
            background: #0c2439;
            border: 2px solid var(--accent);
            border-radius: 50%;
        }

        .check::after {
            content: "";
            position: absolute;
            width: 26px;
            height: 14px;
            border: 4px solid var(--accent);
            border-top: none;
            border-right: none;
            transform: translateY(-2px) rotate(-45deg);
            border-radius: 3px;
        }

        .list-box {
            width: 48px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .list-box .box {
            position: relative;
            width: 34px;
            height: 34px;
            background: #0c2439;
            border: 2px solid var(--accent);
            border-radius: 8px;
        }

        .list-box .box span {
            position: absolute;
            left: 8px;
            right: 8px;
            height: 3px;
            background: var(--accent);
            border-radius: 3px;
        }

        .list-box .box span:nth-child(1) {
            top: 11px;
        }

        .list-box .box span:nth-child(2) {
            top: 17px;
        }

        .list-box .box span:nth-child(3) {
            top: 23px;
            width: 55%;
        }

        .list-box .box::after {
            content: "";
            position: absolute;
            right: 4px;
            bottom: 4px;
            width: 14px;
            height: 14px;
            border-left: 3px solid var(--accent);
            border-bottom: 3px solid var(--accent);
            transform: rotate(-45deg);
            border-radius: 2px;
        }

        .inactive {
            width: ${config.inactiveBarWidth}px;
            height: 32px;
            border-radius: 6px;
            background: linear-gradient(90deg, var(--inactive-start), var(--inactive-end));
            opacity: .55;
        }

        .pill {
            width: ${config.pillWidth}px;
            height: 30px;
            border-radius: 8px;
            background: linear-gradient(90deg, var(--inactive-start), var(--inactive-end));
            opacity: .55;
            filter: drop-shadow(0 4px 22px rgba(10, 160, 255, .2)) drop-shadow(0 0 40px rgba(109, 214, 255, .1));
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0 0 0 0);
            white-space: nowrap;
            border: 0;
        }
    </style>
</head>
<body>
    <div class="icon-container">
        ${config.showTitle ? `<span class="title">${config.title}</span>` : ""}
        <div class="icon" role="img" aria-label="${config.title}">
            <span class="sr-only">${config.title}</span>
            <div class="icon__bg"></div>
            <div class="panel">
                <div class="input-wrap">
                    <div class="input-bar"></div>
                    <div class="check"></div>
                    <div class="list-box">
                        <div class="box"><span></span><span></span><span></span></div>
                    </div>
                </div>
                <div class="dropdown-list">
                    <div class="inactive one"></div>
                    <div class="inactive two"></div>
                    <div class="pill"></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
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
