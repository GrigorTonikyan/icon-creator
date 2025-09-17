import cn from "classnames";
import { useState } from "react";
import { type FillType, type Gradient, type Pattern, type ConicGradient } from "../../../types/editor";
import { GradientUtils, PatternUtils, FillUtils } from "../../../utils/gradientUtils";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import "./fillControl.css";

export interface FillControlProps {
    className?: string;
    label: string;
    value: FillType;
    onChange: (value: FillType) => void;
}

type FillMode = "color" | "gradient" | "pattern" | "none";

export function FillControl({ className, label, value, onChange }: FillControlProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine current fill mode
    const getCurrentMode = (): FillMode => {
        if (!value || value === "none") return "none";
        if (FillUtils.isColor(value)) return "color";
        if (FillUtils.isGradient(value)) return "gradient";
        if (FillUtils.isPattern(value)) return "pattern";
        return "none";
    };

    const [currentMode, setCurrentMode] = useState<FillMode>(getCurrentMode());

    const fillControlCn = cn("FillControl", className, {
        "FillControl--expanded": isExpanded,
    });

    const handleModeChange = (mode: FillMode) => {
        setCurrentMode(mode);

        switch (mode) {
            case "none":
                onChange("none");
                break;
            case "color":
                onChange("#007ACC");
                break;
            case "gradient":
                onChange(GradientUtils.createDefaultLinearGradient(GradientUtils.generateGradientId()));
                break;
            case "pattern":
                onChange(PatternUtils.createDefaultDotsPattern(PatternUtils.generatePatternId()));
                break;
        }
    };

    const handleColorChange = (color: string) => {
        if (currentMode === "color") {
            onChange(color);
        }
    };

    const handleGradientChange = (gradient: Gradient) => {
        if (currentMode === "gradient") {
            onChange(gradient);
        }
    };

    const renderFillPreview = () => {
        const previewStyle: React.CSSProperties = {};

        if (currentMode === "color" && FillUtils.isColor(value)) {
            previewStyle.backgroundColor = value;
        } else if (currentMode === "gradient" && FillUtils.isGradient(value)) {
            if (value.type === "linear") {
                const stops = value.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ");
                const angle = Math.atan2(value.y2 - value.y1, value.x2 - value.x1) * (180 / Math.PI);
                previewStyle.background = `linear-gradient(${angle}deg, ${stops})`;
            } else if (value.type === "radial") {
                const stops = value.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ");
                previewStyle.background = `radial-gradient(circle at ${value.cx * 100}% ${value.cy * 100}%, ${stops})`;
            } else if (value.type === "conic") {
                const stops = value.stops.map((stop) => `${stop.color} ${stop.offset * 360}deg`).join(", ");
                previewStyle.background = `conic-gradient(from ${value.startAngle}deg at ${value.cx * 100}% ${
                    value.cy * 100
                }%, ${stops})`;
            }
        } else if (currentMode === "pattern") {
            // Preview pattern - simplified representation
            if (FillUtils.isPattern(value) && value.patternType) {
                switch (value.patternType) {
                    case "dots":
                        previewStyle.background = "radial-gradient(circle at 50% 50%, #007ACC 30%, transparent 30%)";
                        previewStyle.backgroundSize = "20px 20px";
                        break;
                    case "lines":
                        previewStyle.background =
                            "repeating-linear-gradient(0deg, #007ACC, #007ACC 2px, transparent 2px, transparent 10px)";
                        break;
                    case "grid":
                        previewStyle.background =
                            "linear-gradient(#007ACC 1px, transparent 1px), linear-gradient(90deg, #007ACC 1px, transparent 1px)";
                        previewStyle.backgroundSize = "20px 20px";
                        break;
                    case "diagonal":
                        previewStyle.background =
                            "repeating-linear-gradient(45deg, #007ACC, #007ACC 2px, transparent 2px, transparent 10px)";
                        break;
                    case "checkerboard":
                        previewStyle.background = "repeating-conic-gradient(#007ACC 0% 25%, transparent 25% 50%)";
                        previewStyle.backgroundSize = "20px 20px";
                        break;
                    default:
                        previewStyle.background = "repeating-conic-gradient(#808080 0% 25%, transparent 25% 50%)";
                        previewStyle.backgroundSize = "20px 20px";
                }
            } else {
                previewStyle.background = "repeating-conic-gradient(#808080 0% 25%, transparent 25% 50%)";
                previewStyle.backgroundSize = "20px 20px";
            }
        } else {
            previewStyle.background = "transparent";
            previewStyle.border = "1px solid #ccc";
        }

        return <div className="FillControl__preview" style={previewStyle} />;
    };

    const renderColorControls = () => {
        if (currentMode !== "color" || !FillUtils.isColor(value)) return null;

        return (
            <div className="FillControl__color-controls">
                <div className="FillControl__color-input">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="FillControl__color-picker"
                    />
                </div>
            </div>
        );
    };

    const renderGradientControls = () => {
        if (currentMode !== "gradient" || !FillUtils.isGradient(value)) return null;

        const gradient = value;

        const handleGradientTypeChange = (type: "linear" | "radial" | "conic") => {
            if (type === "linear") {
                handleGradientChange({
                    ...gradient,
                    type: "linear",
                    x1: 0,
                    y1: 0,
                    x2: 1,
                    y2: 0,
                } as any);
            } else if (type === "radial") {
                handleGradientChange({
                    ...gradient,
                    type: "radial",
                    cx: 0.5,
                    cy: 0.5,
                    r: 0.5,
                } as any);
            } else if (type === "conic") {
                handleGradientChange({
                    ...gradient,
                    type: "conic",
                    cx: 0.5,
                    cy: 0.5,
                    startAngle: 0,
                } as any);
            }
        };

        const handleStopChange = (index: number, field: "color" | "offset", value: string | number) => {
            const newStops = [...gradient.stops];
            const currentStop = newStops[index];
            if (currentStop) {
                newStops[index] = { ...currentStop, [field]: value };
                handleGradientChange({ ...gradient, stops: newStops });
            }
        };

        const handleGradientPropertyChange = (property: string, propValue: number) => {
            handleGradientChange({ ...gradient, [property]: propValue });
        };

        const addStop = () => {
            const newStops = [...gradient.stops];
            const lastStop = newStops[newStops.length - 1];
            const newOffset = lastStop ? Math.min(lastStop.offset + 0.1, 1) : 0.5;
            newStops.push({ offset: newOffset, color: "#007ACC" });
            handleGradientChange({ ...gradient, stops: newStops });
        };

        const removeStop = (index: number) => {
            if (gradient.stops.length <= 2) return; // Keep at least 2 stops
            const newStops = gradient.stops.filter((_, i) => i !== index);
            handleGradientChange({ ...gradient, stops: newStops });
        };

        return (
            <div className="FillControl__gradient-controls">
                <div className="FillControl__gradient-type">
                    <Button
                        variant={gradient.type === "linear" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleGradientTypeChange("linear")}>
                        Linear
                    </Button>
                    <Button
                        variant={gradient.type === "radial" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleGradientTypeChange("radial")}>
                        Radial
                    </Button>
                    <Button
                        variant={gradient.type === "conic" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleGradientTypeChange("conic")}>
                        Conic
                    </Button>
                </div>

                {/* Gradient-specific controls */}
                {gradient.type === "linear" && (
                    <div className="FillControl__linear-controls">
                        <div className="FillControl__control-row">
                            <label>Start X:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).x1}
                                onChange={(e) => handleGradientPropertyChange("x1", parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="FillControl__control-row">
                            <label>Start Y:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).y1}
                                onChange={(e) => handleGradientPropertyChange("y1", parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="FillControl__control-row">
                            <label>End X:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).x2}
                                onChange={(e) => handleGradientPropertyChange("x2", parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="FillControl__control-row">
                            <label>End Y:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).y2}
                                onChange={(e) => handleGradientPropertyChange("y2", parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                )}

                {gradient.type === "radial" && (
                    <div className="FillControl__radial-controls">
                        <div className="FillControl__control-row">
                            <label>Center X:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).cx}
                                onChange={(e) => handleGradientPropertyChange("cx", parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="FillControl__control-row">
                            <label>Center Y:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).cy}
                                onChange={(e) => handleGradientPropertyChange("cy", parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="FillControl__control-row">
                            <label>Radius:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).r}
                                onChange={(e) => handleGradientPropertyChange("r", parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                )}

                {gradient.type === "conic" && (
                    <div className="FillControl__conic-controls">
                        <div className="FillControl__control-row">
                            <label>Center X:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).cx}
                                onChange={(e) => handleGradientPropertyChange("cx", parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="FillControl__control-row">
                            <label>Center Y:</label>
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={(gradient as any).cy}
                                onChange={(e) => handleGradientPropertyChange("cy", parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="FillControl__control-row">
                            <label>Start Angle:</label>
                            <Input
                                type="number"
                                min={0}
                                max={360}
                                step={1}
                                value={(gradient as any).startAngle}
                                onChange={(e) => handleGradientPropertyChange("startAngle", parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                )}

                <div className="FillControl__gradient-stops">
                    <label>Gradient Stops:</label>
                    {gradient.stops.map((stop, index) => (
                        <div key={index} className="FillControl__gradient-stop">
                            <input
                                type="color"
                                value={stop.color}
                                onChange={(e) => handleStopChange(index, "color", e.target.value)}
                                className="FillControl__color-picker"
                            />
                            <Input
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                                value={stop.offset}
                                onChange={(e) => handleStopChange(index, "offset", parseFloat(e.target.value))}
                            />
                            {gradient.stops.length > 2 && (
                                <Button variant="secondary" size="sm" onClick={() => removeStop(index)}>
                                    ×
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button variant="secondary" size="sm" onClick={addStop}>
                        Add Stop
                    </Button>
                </div>
            </div>
        );
    };

    const renderPatternControls = () => {
        if (currentMode !== "pattern" || !FillUtils.isPattern(value)) return null;

        const pattern = value;

        const handlePatternTypeChange = (
            patternType: "dots" | "lines" | "grid" | "diagonal" | "checkerboard" | "custom"
        ) => {
            const updatedPattern = { ...pattern, patternType };
            onChange(updatedPattern);
        };

        const handlePatternPropertyChange = (property: string, propValue: number) => {
            const updatedPattern = { ...pattern, [property]: propValue };
            onChange(updatedPattern);
        };

        return (
            <div className="FillControl__pattern-controls">
                <div className="FillControl__pattern-type">
                    <label>Pattern Type:</label>
                    <div className="FillControl__pattern-presets">
                        {[
                            { type: "dots", label: "Dots" },
                            { type: "lines", label: "Lines" },
                            { type: "grid", label: "Grid" },
                            { type: "diagonal", label: "Diagonal" },
                            { type: "checkerboard", label: "Checkerboard" },
                            { type: "custom", label: "Custom" },
                        ].map(({ type, label }) => (
                            <Button
                                key={type}
                                variant={pattern.patternType === type ? "primary" : "secondary"}
                                size="sm"
                                onClick={() => handlePatternTypeChange(type as any)}>
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="FillControl__pattern-properties">
                    <div className="FillControl__control-row">
                        <label>Width:</label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            step={1}
                            value={pattern.width}
                            onChange={(e) => handlePatternPropertyChange("width", parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="FillControl__control-row">
                        <label>Height:</label>
                        <Input
                            type="number"
                            min={1}
                            max={100}
                            step={1}
                            value={pattern.height}
                            onChange={(e) => handlePatternPropertyChange("height", parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="FillControl__control-row">
                        <label>X Offset:</label>
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={pattern.x}
                            onChange={(e) => handlePatternPropertyChange("x", parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="FillControl__control-row">
                        <label>Y Offset:</label>
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={pattern.y}
                            onChange={(e) => handlePatternPropertyChange("y", parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                {pattern.patternType === "custom" && (
                    <div className="FillControl__custom-pattern">
                        <p>Custom patterns support coming soon...</p>
                        <small>Use image upload or define custom SVG elements</small>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={fillControlCn}>
            <div className="FillControl__header" onClick={() => setIsExpanded(!isExpanded)}>
                <label className="FillControl__label">{label}</label>
                {renderFillPreview()}
                <button className="FillControl__toggle" type="button">
                    {isExpanded ? "−" : "+"}
                </button>
            </div>

            {isExpanded && (
                <div className="FillControl__content">
                    <div className="FillControl__mode-selector">
                        <Button
                            variant={currentMode === "none" ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => handleModeChange("none")}>
                            None
                        </Button>
                        <Button
                            variant={currentMode === "color" ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => handleModeChange("color")}>
                            Color
                        </Button>
                        <Button
                            variant={currentMode === "gradient" ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => handleModeChange("gradient")}>
                            Gradient
                        </Button>
                        <Button
                            variant={currentMode === "pattern" ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => handleModeChange("pattern")}>
                            Pattern
                        </Button>
                    </div>

                    {renderColorControls()}
                    {renderGradientControls()}
                    {renderPatternControls()}
                </div>
            )}
        </div>
    );
}
