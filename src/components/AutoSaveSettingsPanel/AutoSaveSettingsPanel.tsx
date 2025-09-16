import { useEditor } from "../../contexts/EditorContext";
import { type AutoSaveSettings } from "../../types/editor";
import { Button } from "../ui/Button/Button";
import { Checkbox } from "../ui/Checkbox/Checkbox";
import { FormField } from "../ui/FormField/FormField";
import { Input } from "../ui/Input/Input";
import "./autoSaveSettingsPanel.css";

interface AutoSaveSettingsPanelProps {
    className?: string;
    onClose?: () => void;
}

export function AutoSaveSettingsPanel({ className, onClose }: AutoSaveSettingsPanelProps) {
    const { getAutoSaveSettings, updateAutoSaveSettings, isAutoSaveEnabled, getLastSaveTime } = useEditor();
    const settings = getAutoSaveSettings();
    const lastSaveTime = getLastSaveTime();

    const handleSettingChange = (setting: keyof AutoSaveSettings, value: any) => {
        updateAutoSaveSettings({ [setting]: value });
    };

    const formatLastSaveTime = () => {
        if (!lastSaveTime) return "Never";
        const now = Date.now();
        const diff = now - lastSaveTime;

        if (diff < 60000) {
            // Less than 1 minute
            return "Just now";
        } else if (diff < 3600000) {
            // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
        } else if (diff < 86400000) {
            // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours === 1 ? "" : "s"} ago`;
        } else {
            return new Date(lastSaveTime).toLocaleDateString();
        }
    };

    const intervalOptions = [
        { value: 10000, label: "10 seconds" },
        { value: 30000, label: "30 seconds" },
        { value: 60000, label: "1 minute" },
        { value: 120000, label: "2 minutes" },
        { value: 300000, label: "5 minutes" },
        { value: 600000, label: "10 minutes" },
    ];

    return (
        <div className={`AutoSaveSettingsPanel ${className || ""}`}>
            <div className="autosave-header">
                <h3>Auto-Save Settings</h3>
                {onClose && (
                    <Button variant="ghost" onClick={onClose} aria-label="Close auto-save settings">
                        ×
                    </Button>
                )}
            </div>

            <div className="autosave-content">
                <FormField label="Enable Auto-Save">
                    <Checkbox
                        checked={settings.enabled}
                        onChange={(e) => handleSettingChange("enabled", e.target.checked)}
                        label="Automatically save your work"
                    />
                </FormField>

                <FormField label="Save Interval" className={settings.enabled ? "" : "disabled"}>
                    <select
                        value={settings.interval}
                        onChange={(e) => handleSettingChange("interval", parseInt(e.target.value))}
                        disabled={!settings.enabled}
                        className="interval-select">
                        {intervalOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField
                    label="Maximum Auto-Saves"
                    helpText="Number of auto-saves to keep (older ones will be deleted)"
                    className={settings.enabled ? "" : "disabled"}>
                    <Input
                        type="number"
                        value={settings.maxAutoSaves}
                        onChange={(e) => handleSettingChange("maxAutoSaves", parseInt(e.target.value) || 1)}
                        min={1}
                        max={50}
                        disabled={!settings.enabled}
                    />
                </FormField>

                <FormField label="Recovery Options">
                    <Checkbox
                        checked={settings.showRecoveryPrompt}
                        onChange={(e) => handleSettingChange("showRecoveryPrompt", e.target.checked)}
                        label="Show recovery prompt on app load"
                    />
                </FormField>

                <div className="autosave-status">
                    <div className="status-row">
                        <span className="status-label">Status:</span>
                        <span className={`status-value ${isAutoSaveEnabled() ? "enabled" : "disabled"}`}>
                            {isAutoSaveEnabled() ? "Enabled" : "Disabled"}
                        </span>
                    </div>
                    <div className="status-row">
                        <span className="status-label">Last Save:</span>
                        <span className="status-value">{formatLastSaveTime()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
