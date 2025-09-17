import cn from "classnames";
import { useState, useCallback } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Button } from "../ui/Button/Button";
import { FormField } from "../ui/FormField/FormField";
import { Input } from "../ui/Input/Input";
import { Select } from "../ui/Select/Select";
import type { Theme } from "../../types/navBar";
import "./themeSettings.css";

export interface ThemeSettingsProps {
    className?: string;
}

interface CustomThemeSettings {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    borderRadius: number;
    spacing: number;
    fontSize: number;
}

const defaultCustomSettings: CustomThemeSettings = {
    primaryColor: "#007acc",
    secondaryColor: "#6c757d",
    backgroundColor: "#ffffff",
    textColor: "#212529",
    accentColor: "#fbf0df",
    borderRadius: 8,
    spacing: 16,
    fontSize: 14,
};

const themeOptions = [
    { value: "light", label: "Light Theme" },
    { value: "dark", label: "Dark Theme" },
    { value: "auto", label: "Auto (System)" },
    { value: "custom", label: "Custom Theme" },
];

export function ThemeSettings({ className }: ThemeSettingsProps) {
    const { theme, setTheme } = useTheme();
    const [customSettings, setCustomSettings] = useState<CustomThemeSettings>(() => {
        const saved = localStorage.getItem("icon-creator-custom-theme");
        return saved ? JSON.parse(saved) : defaultCustomSettings;
    });
    const [previewMode, setPreviewMode] = useState(false);

    const themeSettingsCn = cn("ThemeSettings", className);

    const handleThemeChange = useCallback(
        (selectedTheme: Theme) => {
            setTheme(selectedTheme);

            // Apply custom theme if selected
            if (selectedTheme === "custom") {
                applyCustomTheme(customSettings);
            }
        },
        [setTheme, customSettings]
    );

    const handleCustomSettingChange = useCallback(
        (key: keyof CustomThemeSettings, value: string | number) => {
            const newSettings = {
                ...customSettings,
                [key]: value,
            };
            setCustomSettings(newSettings);

            // Save to localStorage
            localStorage.setItem("icon-creator-custom-theme", JSON.stringify(newSettings));

            // Apply if custom theme is active
            if (theme === "custom") {
                applyCustomTheme(newSettings);
            }
        },
        [customSettings, theme]
    );

    const applyCustomTheme = useCallback((settings: CustomThemeSettings) => {
        const root = document.documentElement;

        // Apply custom CSS variables
        root.style.setProperty("--bg-primary", settings.backgroundColor);
        root.style.setProperty("--text-primary", settings.textColor);
        root.style.setProperty("--accent-primary", settings.primaryColor);
        root.style.setProperty("--text-secondary", settings.secondaryColor);
        root.style.setProperty("--color-bun", settings.accentColor);
        root.style.setProperty("--border-radius-md", `${settings.borderRadius}px`);
        root.style.setProperty("--spacing-md", `${settings.spacing}px`);
        root.style.setProperty("--font-size-base", `${settings.fontSize}px`);

        // Set custom theme attribute
        root.setAttribute("data-theme", "custom");
    }, []);

    const resetCustomTheme = useCallback(() => {
        setCustomSettings(defaultCustomSettings);
        localStorage.removeItem("icon-creator-custom-theme");

        if (theme === "custom") {
            applyCustomTheme(defaultCustomSettings);
        }
    }, [theme, applyCustomTheme]);

    const togglePreview = useCallback(() => {
        if (!previewMode && theme !== "custom") {
            // Entering preview mode
            applyCustomTheme(customSettings);
            setPreviewMode(true);
        } else if (previewMode) {
            // Exiting preview mode
            setPreviewMode(false);
            // Restore original theme
            handleThemeChange(theme);
        }
    }, [previewMode, theme, customSettings, applyCustomTheme, handleThemeChange]);

    const exportTheme = useCallback(() => {
        const themeExport = {
            theme,
            customSettings,
            version: "1.0.0",
            exported: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(themeExport, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `icon-creator-theme-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [theme, customSettings]);

    const importTheme = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target?.result as string);

                    if (imported.theme && imported.customSettings) {
                        setCustomSettings(imported.customSettings);
                        localStorage.setItem("icon-creator-custom-theme", JSON.stringify(imported.customSettings));
                        handleThemeChange(imported.theme);
                    }
                } catch (error) {
                    console.error("Failed to import theme:", error);
                }
            };
            reader.readAsText(file);

            // Reset input
            event.target.value = "";
        },
        [handleThemeChange]
    );

    return (
        <div className={themeSettingsCn}>
            <div className="ThemeSettings__header">
                <h3 className="ThemeSettings__title">Theme Customization</h3>
                <p className="ThemeSettings__description">Customize the appearance of the icon creator interface</p>
            </div>

            <div className="ThemeSettings__section">
                <FormField label="Theme Mode" htmlFor="theme-mode-select">
                    <Select
                        id="theme-mode-select"
                        value={theme}
                        onChange={(e) => handleThemeChange(e.target.value as Theme)}
                        options={themeOptions}
                        aria-describedby="theme-mode-description"
                    />
                </FormField>
                <div id="theme-mode-description" className="ThemeSettings__help">
                    Choose between light, dark, auto (follows system), or custom theme
                </div>
            </div>

            {theme === "custom" && (
                <div className="ThemeSettings__custom">
                    <div className="ThemeSettings__section">
                        <h4 className="ThemeSettings__section-title">Colors</h4>

                        <div className="ThemeSettings__color-grid">
                            <FormField label="Primary Color" htmlFor="primary-color">
                                <Input
                                    id="primary-color"
                                    variant="color"
                                    value={customSettings.primaryColor}
                                    onChange={(e) => handleCustomSettingChange("primaryColor", e.target.value)}
                                />
                            </FormField>

                            <FormField label="Secondary Color" htmlFor="secondary-color">
                                <Input
                                    id="secondary-color"
                                    variant="color"
                                    value={customSettings.secondaryColor}
                                    onChange={(e) => handleCustomSettingChange("secondaryColor", e.target.value)}
                                />
                            </FormField>

                            <FormField label="Background Color" htmlFor="background-color">
                                <Input
                                    id="background-color"
                                    variant="color"
                                    value={customSettings.backgroundColor}
                                    onChange={(e) => handleCustomSettingChange("backgroundColor", e.target.value)}
                                />
                            </FormField>

                            <FormField label="Text Color" htmlFor="text-color">
                                <Input
                                    id="text-color"
                                    variant="color"
                                    value={customSettings.textColor}
                                    onChange={(e) => handleCustomSettingChange("textColor", e.target.value)}
                                />
                            </FormField>

                            <FormField label="Accent Color" htmlFor="accent-color">
                                <Input
                                    id="accent-color"
                                    variant="color"
                                    value={customSettings.accentColor}
                                    onChange={(e) => handleCustomSettingChange("accentColor", e.target.value)}
                                />
                            </FormField>
                        </div>
                    </div>

                    <div className="ThemeSettings__section">
                        <h4 className="ThemeSettings__section-title">Spacing & Typography</h4>

                        <div className="ThemeSettings__controls-grid">
                            <FormField label="Border Radius" htmlFor="border-radius">
                                <Input
                                    id="border-radius"
                                    variant="range"
                                    min={0}
                                    max={20}
                                    step={1}
                                    value={customSettings.borderRadius}
                                    onChange={(e) => handleCustomSettingChange("borderRadius", Number(e.target.value))}
                                    showValue
                                    suffix="px"
                                />
                            </FormField>

                            <FormField label="Base Spacing" htmlFor="spacing">
                                <Input
                                    id="spacing"
                                    variant="range"
                                    min={8}
                                    max={32}
                                    step={4}
                                    value={customSettings.spacing}
                                    onChange={(e) => handleCustomSettingChange("spacing", Number(e.target.value))}
                                    showValue
                                    suffix="px"
                                />
                            </FormField>

                            <FormField label="Font Size" htmlFor="font-size">
                                <Input
                                    id="font-size"
                                    variant="range"
                                    min={12}
                                    max={18}
                                    step={1}
                                    value={customSettings.fontSize}
                                    onChange={(e) => handleCustomSettingChange("fontSize", Number(e.target.value))}
                                    showValue
                                    suffix="px"
                                />
                            </FormField>
                        </div>
                    </div>

                    <div className="ThemeSettings__actions">
                        <Button
                            variant="secondary"
                            onClick={resetCustomTheme}
                            title="Reset to default custom theme settings">
                            Reset to Defaults
                        </Button>
                    </div>
                </div>
            )}

            {theme !== "custom" && (
                <div className="ThemeSettings__preview">
                    <Button
                        variant={previewMode ? "primary" : "secondary"}
                        onClick={togglePreview}
                        title={previewMode ? "Exit preview mode" : "Preview custom theme"}>
                        {previewMode ? "Exit Preview" : "Preview Custom Theme"}
                    </Button>
                </div>
            )}

            <div className="ThemeSettings__import-export">
                <div className="ThemeSettings__section">
                    <h4 className="ThemeSettings__section-title">Import/Export</h4>

                    <div className="ThemeSettings__actions">
                        <Button variant="secondary" onClick={exportTheme} title="Export current theme settings">
                            Export Theme
                        </Button>

                        <div className="ThemeSettings__import">
                            <Input
                                variant="file"
                                accept=".json"
                                onChange={importTheme}
                                className="ThemeSettings__import-input"
                                aria-label="Import theme file"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const input = document.querySelector(
                                        ".ThemeSettings__import-input"
                                    ) as HTMLInputElement;
                                    input?.click();
                                }}
                                title="Import theme settings from file">
                                Import Theme
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
