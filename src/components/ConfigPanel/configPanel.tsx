import cn from "classnames";
import type { IconConfig } from "../../types/iconConfig";
import "./configPanel.css";

interface ConfigPanelProps {
    config: IconConfig;
    onChange: (config: IconConfig) => void;
    className?: string;
}

export function ConfigPanel({ config, onChange, className }: ConfigPanelProps) {
    const configPanelCn = cn("ConfigPanel", className);

    const updateConfig = (updates: Partial<IconConfig>) => {
        onChange({ ...config, ...updates });
    };

    return (
        <div className={configPanelCn}>
            <div className="config-section">
                <h3>Background Colors</h3>
                <div className="config-group">
                    <div className="color-input">
                        <label htmlFor="bgGradStart">Gradient Start</label>
                        <input
                            id="bgGradStart"
                            type="color"
                            value={config.bgGradStart}
                            onChange={(e) => updateConfig({ bgGradStart: e.target.value })}
                        />
                    </div>
                    <div className="color-input">
                        <label htmlFor="bgGradMid">Gradient Middle</label>
                        <input
                            id="bgGradMid"
                            type="color"
                            value={config.bgGradMid}
                            onChange={(e) => updateConfig({ bgGradMid: e.target.value })}
                        />
                    </div>
                    <div className="color-input">
                        <label htmlFor="bgGradEnd">Gradient End</label>
                        <input
                            id="bgGradEnd"
                            type="color"
                            value={config.bgGradEnd}
                            onChange={(e) => updateConfig({ bgGradEnd: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="config-section">
                <h3>Panel Colors</h3>
                <div className="config-group">
                    <div className="color-input">
                        <label htmlFor="panelTop">Panel Top</label>
                        <input
                            id="panelTop"
                            type="color"
                            value={config.panelTop}
                            onChange={(e) => updateConfig({ panelTop: e.target.value })}
                        />
                    </div>
                    <div className="color-input">
                        <label htmlFor="panelMid">Panel Middle</label>
                        <input
                            id="panelMid"
                            type="color"
                            value={config.panelMid}
                            onChange={(e) => updateConfig({ panelMid: e.target.value })}
                        />
                    </div>
                    <div className="color-input">
                        <label htmlFor="panelBot">Panel Bottom</label>
                        <input
                            id="panelBot"
                            type="color"
                            value={config.panelBot}
                            onChange={(e) => updateConfig({ panelBot: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="config-section">
                <h3>Input Bar</h3>
                <div className="config-group">
                    <div className="color-input">
                        <label htmlFor="barStart">Bar Start</label>
                        <input
                            id="barStart"
                            type="color"
                            value={config.barStart}
                            onChange={(e) => updateConfig({ barStart: e.target.value })}
                        />
                    </div>
                    <div className="color-input">
                        <label htmlFor="barEnd">Bar End</label>
                        <input
                            id="barEnd"
                            type="color"
                            value={config.barEnd}
                            onChange={(e) => updateConfig({ barEnd: e.target.value })}
                        />
                    </div>
                    <div className="text-input">
                        <label htmlFor="inputText">Input Text</label>
                        <input
                            id="inputText"
                            type="text"
                            value={config.inputText}
                            onChange={(e) => updateConfig({ inputText: e.target.value })}
                            placeholder="Enter text"
                        />
                    </div>
                </div>
            </div>

            <div className="config-section">
                <h3>Inactive Elements</h3>
                <div className="config-group">
                    <div className="color-input">
                        <label htmlFor="inactiveStart">Inactive Start</label>
                        <input
                            id="inactiveStart"
                            type="color"
                            value={config.inactiveStart}
                            onChange={(e) => updateConfig({ inactiveStart: e.target.value })}
                        />
                    </div>
                    <div className="color-input">
                        <label htmlFor="inactiveEnd">Inactive End</label>
                        <input
                            id="inactiveEnd"
                            type="color"
                            value={config.inactiveEnd}
                            onChange={(e) => updateConfig({ inactiveEnd: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="config-section">
                <h3>Accent & Glow</h3>
                <div className="config-group">
                    <div className="color-input">
                        <label htmlFor="borderGlow">Border Glow</label>
                        <input
                            id="borderGlow"
                            type="color"
                            value={config.borderGlow}
                            onChange={(e) => updateConfig({ borderGlow: e.target.value })}
                        />
                    </div>
                    <div className="color-input">
                        <label htmlFor="accent">Accent Color</label>
                        <input
                            id="accent"
                            type="color"
                            value={config.accent}
                            onChange={(e) => updateConfig({ accent: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="config-section">
                <h3>Dimensions</h3>
                <div className="config-group">
                    <div className="range-input">
                        <label htmlFor="iconSize">Icon Size</label>
                        <input
                            id="iconSize"
                            type="range"
                            min="128"
                            max="512"
                            step="64"
                            value={config.iconSize}
                            onChange={(e) => updateConfig({ iconSize: Number(e.target.value) })}
                        />
                        <span className="range-value">{config.iconSize}px</span>
                    </div>
                    <div className="range-input">
                        <label htmlFor="borderRadius">Border Radius</label>
                        <input
                            id="borderRadius"
                            type="range"
                            min="15"
                            max="90"
                            step="15"
                            value={config.borderRadius}
                            onChange={(e) => updateConfig({ borderRadius: Number(e.target.value) })}
                        />
                        <span className="range-value">{config.borderRadius}px</span>
                    </div>
                    <div className="range-input">
                        <label htmlFor="panelWidth">Panel Width</label>
                        <input
                            id="panelWidth"
                            type="range"
                            min="40"
                            max="60"
                            step="5"
                            value={config.panelWidth}
                            onChange={(e) => updateConfig({ panelWidth: Number(e.target.value) })}
                        />
                        <span className="range-value">{config.panelWidth}%</span>
                    </div>
                    <div className="range-input">
                        <label htmlFor="panelHeight">Panel Height</label>
                        <input
                            id="panelHeight"
                            type="range"
                            min="40"
                            max="60"
                            step="5"
                            value={config.panelHeight}
                            onChange={(e) => updateConfig({ panelHeight: Number(e.target.value) })}
                        />
                        <span className="range-value">{config.panelHeight}%</span>
                    </div>
                    <div className="range-input">
                        <label htmlFor="inputHeight">Input Height</label>
                        <input
                            id="inputHeight"
                            type="range"
                            min="60"
                            max="88"
                            step="14"
                            value={config.inputHeight}
                            onChange={(e) => updateConfig({ inputHeight: Number(e.target.value) })}
                        />
                        <span className="range-value">{config.inputHeight}px</span>
                    </div>
                    <div className="range-input">
                        <label htmlFor="inactiveBarWidth">Inactive Bar Width</label>
                        <input
                            id="inactiveBarWidth"
                            type="range"
                            min="150"
                            max="250"
                            step="25"
                            value={config.inactiveBarWidth}
                            onChange={(e) => updateConfig({ inactiveBarWidth: Number(e.target.value) })}
                        />
                        <span className="range-value">{config.inactiveBarWidth}px</span>
                    </div>
                    <div className="range-input">
                        <label htmlFor="pillWidth">Pill Width</label>
                        <input
                            id="pillWidth"
                            type="range"
                            min="80"
                            max="112"
                            step="16"
                            value={config.pillWidth}
                            onChange={(e) => updateConfig({ pillWidth: Number(e.target.value) })}
                        />
                        <span className="range-value">{config.pillWidth}px</span>
                    </div>
                </div>
            </div>

            <div className="config-section">
                <h3>Title</h3>
                <div className="config-group">
                    <div className="checkbox-input">
                        <input
                            id="showTitle"
                            type="checkbox"
                            checked={config.showTitle}
                            onChange={(e) => updateConfig({ showTitle: e.target.checked })}
                        />
                        <label htmlFor="showTitle">Show Title</label>
                    </div>
                    <div className="text-input">
                        <label htmlFor="title">Title Text</label>
                        <textarea
                            id="title"
                            value={config.title}
                            onChange={(e) => updateConfig({ title: e.target.value })}
                            placeholder="Enter title"
                            rows={3}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
