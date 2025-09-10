import type { CSSProperties } from "react";
import type { IconConfig } from "../../types/iconConfig";

import cn from "classnames";
import "./iconPreview.css";

interface IconPreviewProps {
    config: IconConfig;
    className?: string;
}
export function IconPreview({ config, className }: IconPreviewProps) {
    const iconPreviewCn = cn("IconPreview", className);

    const iconStyle = {
        "--bg-grad-start": config.bgGradStart,
        "--bg-grad-mid": config.bgGradMid,
        "--bg-grad-end": config.bgGradEnd,
        "--panel-top": config.panelTop,
        "--panel-mid": config.panelMid,
        "--panel-bot": config.panelBot,
        "--bar-start": config.barStart,
        "--bar-end": config.barEnd,
        "--inactive-start": config.inactiveStart,
        "--inactive-end": config.inactiveEnd,
        "--border-glow": config.borderGlow,
        "--accent": config.accent,
    } as CSSProperties;

    return (
        <div className={iconPreviewCn}>
            {config.showTitle && <span className="icon-title">{config.title}</span>}
            <div
                className="icon"
                style={iconStyle}
                role="img"
                aria-label={config.title}
                data-size={config.iconSize}
                data-border-radius={config.borderRadius}>
                <div className="icon__bg"></div>
                <div className="panel" data-width={config.panelWidth} data-height={config.panelHeight}>
                    <div className="input-wrap" data-height={config.inputHeight}>
                        <div className="input-bar" data-text={config.inputText}></div>
                        <div className="check"></div>
                        <div className="list-box">
                            <div className="box">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                    <div className="dropdown-list">
                        <div className="inactive one" data-width={config.inactiveBarWidth}></div>
                        <div className="inactive two" data-width={config.inactiveBarWidth}></div>
                        <div className="pill" data-width={config.pillWidth}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
