import type { IconConfig } from "../../types/iconConfig";
import { Checkbox, FormField, Input } from "../ui";

import cn from "classnames";
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
                    <FormField label="Gradient Start" inline htmlFor="config-grad-start">
                        <Input
                            id="config-grad-start"
                            variant="color"
                            value={config.bgGradStart}
                            onChange={(e) => updateConfig({ bgGradStart: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Gradient Middle" inline>
                        <Input
                            variant="color"
                            value={config.bgGradMid}
                            onChange={(e) => updateConfig({ bgGradMid: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Gradient End" inline>
                        <Input
                            variant="color"
                            value={config.bgGradEnd}
                            onChange={(e) => updateConfig({ bgGradEnd: e.target.value })}
                        />
                    </FormField>
                </div>
            </div>

            <div className="config-section">
                <h3>Panel Colors</h3>
                <div className="config-group">
                    <FormField label="Panel Top" inline>
                        <Input
                            variant="color"
                            value={config.panelTop}
                            onChange={(e) => updateConfig({ panelTop: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Panel Middle" inline>
                        <Input
                            variant="color"
                            value={config.panelMid}
                            onChange={(e) => updateConfig({ panelMid: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Panel Bottom" inline>
                        <Input
                            variant="color"
                            value={config.panelBot}
                            onChange={(e) => updateConfig({ panelBot: e.target.value })}
                        />
                    </FormField>
                </div>
            </div>

            <div className="config-section">
                <h3>Input Bar</h3>
                <div className="config-group">
                    <FormField label="Bar Start" inline>
                        <Input
                            variant="color"
                            value={config.barStart}
                            onChange={(e) => updateConfig({ barStart: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Bar End" inline>
                        <Input
                            variant="color"
                            value={config.barEnd}
                            onChange={(e) => updateConfig({ barEnd: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Input Text" htmlFor="config-input-text">
                        <Input
                            id="config-input-text"
                            value={config.inputText}
                            onChange={(e) => updateConfig({ inputText: e.target.value })}
                            placeholder="Enter text"
                        />
                    </FormField>
                </div>
            </div>

            <div className="config-section">
                <h3>Inactive Elements</h3>
                <div className="config-group">
                    <FormField label="Inactive Start" inline>
                        <Input
                            variant="color"
                            value={config.inactiveStart}
                            onChange={(e) => updateConfig({ inactiveStart: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Inactive End" inline>
                        <Input
                            variant="color"
                            value={config.inactiveEnd}
                            onChange={(e) => updateConfig({ inactiveEnd: e.target.value })}
                        />
                    </FormField>
                </div>
            </div>

            <div className="config-section">
                <h3>Accent & Glow</h3>
                <div className="config-group">
                    <FormField label="Border Glow" inline>
                        <Input
                            variant="color"
                            value={config.borderGlow}
                            onChange={(e) => updateConfig({ borderGlow: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Accent Color" inline>
                        <Input
                            variant="color"
                            value={config.accent}
                            onChange={(e) => updateConfig({ accent: e.target.value })}
                        />
                    </FormField>
                </div>
            </div>

            <div className="config-section">
                <h3>Dimensions</h3>
                <div className="config-group">
                    <FormField label="Icon Size" htmlFor="config-icon-size">
                        <Input
                            id="config-icon-size"
                            variant="range"
                            min={128}
                            max={512}
                            step={64}
                            value={config.iconSize}
                            onChange={(e) => updateConfig({ iconSize: Number(e.target.value) })}
                            showValue
                        />
                    </FormField>
                    <FormField label="Border Radius">
                        <Input
                            variant="range"
                            min={15}
                            max={90}
                            step={15}
                            value={config.borderRadius}
                            onChange={(e) => updateConfig({ borderRadius: Number(e.target.value) })}
                            showValue
                        />
                    </FormField>
                    <FormField label="Panel Width">
                        <Input
                            variant="range"
                            min={40}
                            max={60}
                            step={5}
                            value={config.panelWidth}
                            onChange={(e) => updateConfig({ panelWidth: Number(e.target.value) })}
                            showValue
                        />
                    </FormField>
                    <FormField label="Panel Height">
                        <Input
                            variant="range"
                            min={40}
                            max={60}
                            step={5}
                            value={config.panelHeight}
                            onChange={(e) => updateConfig({ panelHeight: Number(e.target.value) })}
                            showValue
                        />
                    </FormField>
                    <FormField label="Input Height">
                        <Input
                            variant="range"
                            min={60}
                            max={88}
                            step={14}
                            value={config.inputHeight}
                            onChange={(e) => updateConfig({ inputHeight: Number(e.target.value) })}
                            showValue
                        />
                    </FormField>
                    <FormField label="Inactive Bar Width">
                        <Input
                            variant="range"
                            min={150}
                            max={250}
                            step={25}
                            value={config.inactiveBarWidth}
                            onChange={(e) => updateConfig({ inactiveBarWidth: Number(e.target.value) })}
                            showValue
                        />
                    </FormField>
                    <FormField label="Pill Width">
                        <Input
                            variant="range"
                            min={80}
                            max={112}
                            step={16}
                            value={config.pillWidth}
                            onChange={(e) => updateConfig({ pillWidth: Number(e.target.value) })}
                            showValue
                        />
                    </FormField>
                </div>
            </div>

            <div className="config-section">
                <h3>Title</h3>
                <div className="config-group">
                    <Checkbox
                        id="showTitle"
                        label="Show Title"
                        checked={config.showTitle}
                        onChange={(e) => updateConfig({ showTitle: e.target.checked })}
                    />
                    <FormField label="Title Text" htmlFor="config-title-text">
                        <textarea
                            id="config-title-text"
                            value={config.title}
                            onChange={(e) => updateConfig({ title: e.target.value })}
                            placeholder="Enter title"
                            rows={3}
                            className="Input Input--text"
                        />
                    </FormField>
                </div>
            </div>
        </div>
    );
}
