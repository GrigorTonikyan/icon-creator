import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import type { AppSettings, HeaderProps, NavigationItem, Section } from "../../types/navBar";
import { Button, Checkbox, Icon } from "../ui";

import cn from "classnames";
import "./navBar.css";

const navigationItems: NavigationItem[] = [
    { id: "icon-creator", label: "Icon Creator" },
    { id: "api-tester", label: "API Tester" },
];

export function NavBar({ className, currentSection, onSectionChange }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        autoSave: true,
        showNotifications: true,
        debugMode: false,
    });

    const navBarCn = cn("ica-navbar", className);

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
        <header className={navBarCn}>
            <div className="navbar-brand">
                <h1 className="navbar-title">Icon Creator</h1>
            </div>

            <nav className="navbar-navigation">
                {navigationItems.map((item) => (
                    <Button
                        key={item.id}
                        variant={currentSection === item.id ? "primary" : "ghost"}
                        onClick={() => handleNavigationClick(item.id)}
                        disabled={item.disabled}
                        className="navbar-nav-item">
                        {item.label}
                    </Button>
                ))}
            </nav>

            <div className="navbar-actions">
                <Button
                    variant="icon"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                    className="navbar-theme-toggle">
                    <Icon name={theme === "light" ? "moon" : "sun"} aria-label={`${theme} theme`} />
                </Button>

                <div className="navbar-settings">
                    <Button
                        variant="icon"
                        onClick={handleSettingsToggle}
                        title="Settings"
                        className="navbar-settings-toggle">
                        <Icon name="settings" aria-label="Settings" />
                    </Button>

                    {showSettings && (
                        <div className="navbar-settings-menu">
                            <div className="navbar-settings-item">
                                <Checkbox
                                    id="autoSave"
                                    label="Auto Save"
                                    checked={settings.autoSave}
                                    onChange={(e) => handleSettingChange("autoSave", e.target.checked)}
                                />
                            </div>

                            <div className="navbar-settings-item">
                                <Checkbox
                                    id="showNotifications"
                                    label="Show Notifications"
                                    checked={settings.showNotifications}
                                    onChange={(e) => handleSettingChange("showNotifications", e.target.checked)}
                                />
                            </div>

                            <div className="navbar-settings-item">
                                <Checkbox
                                    id="debugMode"
                                    label="Debug Mode"
                                    checked={settings.debugMode}
                                    onChange={(e) => handleSettingChange("debugMode", e.target.checked)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
