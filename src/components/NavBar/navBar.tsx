import { useEffect, useRef, useState } from "react";
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
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const [settings, setSettings] = useState<AppSettings>({
        autoSave: true,
        showNotifications: true,
        debugMode: false,
    });

    const navBarCn = cn("ica-navbar", className);

    // Handle escape key to close settings menu and focus trapping
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && showSettings) {
                setShowSettings(false);
                settingsButtonRef.current?.focus();
            }
        };

        // Handle click outside to close settings menu
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showSettings &&
                settingsMenuRef.current &&
                !settingsMenuRef.current.contains(event.target as Node) &&
                !settingsButtonRef.current?.contains(event.target as Node)
            ) {
                setShowSettings(false);
            }
        };

        // Focus trapping within the settings menu
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!showSettings) return;

            const focusableElements = settingsMenuRef.current?.querySelectorAll(
                'input[type="checkbox"], button, [tabindex]:not([tabindex="-1"])'
            );

            if (!focusableElements || focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.key === "Tab") {
                if (event.shiftKey && document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        if (showSettings) {
            document.addEventListener("keydown", handleEscapeKey);
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("click", handleClickOutside);

            // Focus the first focusable element when menu opens
            setTimeout(() => {
                const firstCheckbox = settingsMenuRef.current?.querySelector('input[type="checkbox"]') as HTMLElement;
                firstCheckbox?.focus();
            }, 0);
        }

        return () => {
            document.removeEventListener("keydown", handleEscapeKey);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("click", handleClickOutside);
        };
    }, [showSettings]);

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

            <nav className="navbar-navigation" role="navigation" aria-label="Main navigation">
                {navigationItems.map((item) => (
                    <Button
                        key={item.id}
                        variant={currentSection === item.id ? "primary" : "ghost"}
                        onClick={() => handleNavigationClick(item.id)}
                        disabled={item.disabled}
                        className="navbar-nav-item"
                        aria-current={currentSection === item.id ? "page" : undefined}>
                        {item.label}
                    </Button>
                ))}
            </nav>

            <div className="navbar-actions" role="toolbar" aria-label="Theme and settings">
                <Button
                    variant="icon"
                    onClick={toggleTheme}
                    title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                    className="navbar-theme-toggle"
                    aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
                    <Icon name={theme === "light" ? "moon" : "sun"} aria-hidden="true" />
                </Button>

                <div className="navbar-settings">
                    <Button
                        ref={settingsButtonRef}
                        variant="icon"
                        onClick={handleSettingsToggle}
                        title="Settings"
                        className="navbar-settings-toggle"
                        aria-label="Settings menu"
                        aria-expanded={showSettings}
                        aria-haspopup="menu">
                        <Icon name="settings" aria-hidden="true" />
                    </Button>

                    {showSettings && (
                        <div
                            ref={settingsMenuRef}
                            className="navbar-settings-menu"
                            role="menu"
                            aria-label="Application settings">
                            <div className="navbar-settings-item" role="none">
                                <Checkbox
                                    id="autoSave"
                                    label="Auto Save"
                                    checked={settings.autoSave}
                                    onChange={(e) => handleSettingChange("autoSave", e.target.checked)}
                                    role="menuitemcheckbox"
                                    aria-checked={settings.autoSave}
                                />
                            </div>

                            <div className="navbar-settings-item" role="none">
                                <Checkbox
                                    id="showNotifications"
                                    label="Show Notifications"
                                    checked={settings.showNotifications}
                                    onChange={(e) => handleSettingChange("showNotifications", e.target.checked)}
                                    role="menuitemcheckbox"
                                    aria-checked={settings.showNotifications}
                                />
                            </div>

                            <div className="navbar-settings-item" role="none">
                                <Checkbox
                                    id="debugMode"
                                    label="Debug Mode"
                                    checked={settings.debugMode}
                                    onChange={(e) => handleSettingChange("debugMode", e.target.checked)}
                                    role="menuitemcheckbox"
                                    aria-checked={settings.debugMode}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
