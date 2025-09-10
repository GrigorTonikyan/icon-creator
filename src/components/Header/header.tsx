import cn from "classnames";
import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppSettings, HeaderProps, NavigationItem, Section } from "../../types/header";
import "./header.css";

const navigationItems: NavigationItem[] = [
    { id: "icon-creator", label: "Icon Creator" },
    { id: "api-tester", label: "API Tester" },
];

export function Header({ className, currentSection, onSectionChange }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        autoSave: true,
        showNotifications: true,
        debugMode: false,
    });

    const headerCn = cn("Header", className);

    const handleNavigationClick = (section: Section) => {
        onSectionChange(section);
    };

    const handleSettingsToggle = () => {
        setShowSettings(!showSettings);
    };

    const handleSettingChange = (key: keyof AppSettings, value: boolean) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        // Persist settings to localStorage
        localStorage.setItem("icon-creator-settings", JSON.stringify({ ...settings, [key]: value }));
    };

    return (
        <header className={headerCn}>
            <div className="Header__brand">
                <h1 className="Header__title">Icon Creator</h1>
            </div>

            <nav className="Header__navigation">
                {navigationItems.map((item) => (
                    <button
                        key={item.id}
                        className={cn("Header__nav-item", {
                            "Header__nav-item--active": currentSection === item.id,
                            "Header__nav-item--disabled": item.disabled,
                        })}
                        onClick={() => handleNavigationClick(item.id)}
                        disabled={item.disabled}
                        type="button">
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="Header__actions">
                <button
                    className="Header__theme-toggle"
                    onClick={toggleTheme}
                    type="button"
                    title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
                    <span className="Header__theme-icon">{theme === "light" ? "🌙" : "☀️"}</span>
                </button>

                <div className="Header__settings">
                    <button
                        className="Header__settings-toggle"
                        onClick={handleSettingsToggle}
                        type="button"
                        title="Settings">
                        <span className="Header__settings-icon">⚙️</span>
                    </button>

                    {showSettings && (
                        <div className="Header__settings-menu">
                            <div className="Header__settings-item">
                                <label className="Header__setting-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoSave}
                                        onChange={(e) => handleSettingChange("autoSave", e.target.checked)}
                                        className="Header__setting-checkbox"
                                    />
                                    Auto Save
                                </label>
                            </div>

                            <div className="Header__settings-item">
                                <label className="Header__setting-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.showNotifications}
                                        onChange={(e) => handleSettingChange("showNotifications", e.target.checked)}
                                        className="Header__setting-checkbox"
                                    />
                                    Show Notifications
                                </label>
                            </div>

                            <div className="Header__settings-item">
                                <label className="Header__setting-label">
                                    <input
                                        type="checkbox"
                                        checked={settings.debugMode}
                                        onChange={(e) => handleSettingChange("debugMode", e.target.checked)}
                                        className="Header__setting-checkbox"
                                    />
                                    Debug Mode
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
