import React, { useState } from "react";
import {
    AccessibilityPreferencesManager,
    HighContrastManager,
    type AccessibilityPreferences,
} from "../../utils/accessibility";
import { useAccessibility } from "../AccessibilityProvider";
import cn from "classnames";
import "./accessibilitySettings.css";

interface AccessibilitySettingsProps {
    className?: string;
    onClose?: () => void;
}

/**
 * AccessibilitySettings provides a comprehensive interface for configuring
 * accessibility features including screen reader support, high contrast mode,
 * keyboard navigation, and announcement preferences.
 */
export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ className, onClose }) => {
    const { getPreferences, updatePreference, announce } = useAccessibility();
    const [preferences, setPreferences] = React.useState<AccessibilityPreferences>(getPreferences());
    const [highContrastEnabled, setHighContrastEnabled] = useState(HighContrastManager.getInstance().isEnabled());

    const accessibilitySettingsCn = cn("AccessibilitySettings", className);

    // Update local state when preferences change
    React.useEffect(() => {
        const preferencesManager = AccessibilityPreferencesManager.getInstance();
        const highContrastManager = HighContrastManager.getInstance();

        const handlePreferencesChange = (newPreferences: AccessibilityPreferences) => {
            setPreferences(newPreferences);
        };

        const handleHighContrastChange = (enabled: boolean) => {
            setHighContrastEnabled(enabled);
        };

        preferencesManager.addListener(handlePreferencesChange);
        highContrastManager.addListener(handleHighContrastChange);

        return () => {
            preferencesManager.removeListener(handlePreferencesChange);
            highContrastManager.removeListener(handleHighContrastChange);
        };
    }, []);

    const handlePreferenceChange = <K extends keyof AccessibilityPreferences>(
        key: K,
        value: AccessibilityPreferences[K]
    ) => {
        updatePreference(key, value);

        // Announce the change
        const preferenceNames: Record<keyof AccessibilityPreferences, string> = {
            screenReaderEnabled: "Screen reader support",
            highContrastEnabled: "High contrast mode",
            reducedMotionEnabled: "Reduced motion",
            keyboardNavigationEnabled: "Keyboard navigation",
            announceSelections: "Selection announcements",
            announceToolChanges: "Tool change announcements",
            announceObjectCreation: "Object creation announcements",
            announceObjectModification: "Object modification announcements",
        };

        const preferenceName = preferenceNames[key];
        const status = value ? "enabled" : "disabled";
        announce(`${preferenceName} ${status}`);
    };

    const handleHighContrastToggle = () => {
        const highContrastManager = HighContrastManager.getInstance();
        highContrastManager.toggle();

        const newState = highContrastManager.isEnabled();
        announce(`High contrast mode ${newState ? "enabled" : "disabled"}`);
    };

    const handleResetToDefaults = () => {
        const preferencesManager = AccessibilityPreferencesManager.getInstance();
        preferencesManager.resetToDefaults();
        announce("Accessibility preferences reset to defaults");
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape" && onClose) {
            onClose();
        }
    };

    return (
        <div
            className={accessibilitySettingsCn}
            role="dialog"
            aria-labelledby="accessibility-settings-title"
            aria-describedby="accessibility-settings-description"
            onKeyDown={handleKeyDown}
            tabIndex={-1}>
            <div className="accessibility-settings__header">
                <h2 id="accessibility-settings-title">Accessibility Settings</h2>
                <p id="accessibility-settings-description">
                    Configure accessibility features to enhance your editing experience with screen readers, keyboard
                    navigation, and visual adaptations.
                </p>
                {onClose && (
                    <button
                        className="accessibility-settings__close"
                        onClick={onClose}
                        aria-label="Close accessibility settings"
                        type="button">
                        ×
                    </button>
                )}
            </div>

            <div className="accessibility-settings__content">
                {/* Visual Accessibility */}
                <section className="accessibility-settings__section" aria-labelledby="visual-section">
                    <h3 id="visual-section">Visual Accessibility</h3>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={highContrastEnabled}
                                onChange={handleHighContrastToggle}
                                aria-describedby="high-contrast-description"
                            />
                            <span>High Contrast Mode</span>
                        </label>
                        <p id="high-contrast-description" className="accessibility-settings__description">
                            Enhances visual contrast for better visibility. Uses high contrast colors for all interface
                            elements.
                        </p>
                    </div>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={preferences.reducedMotionEnabled}
                                onChange={(e) => handlePreferenceChange("reducedMotionEnabled", e.target.checked)}
                                aria-describedby="reduced-motion-description"
                            />
                            <span>Reduced Motion</span>
                        </label>
                        <p id="reduced-motion-description" className="accessibility-settings__description">
                            Reduces or disables animations and transitions for users sensitive to motion.
                        </p>
                    </div>
                </section>

                {/* Screen Reader Support */}
                <section className="accessibility-settings__section" aria-labelledby="screenreader-section">
                    <h3 id="screenreader-section">Screen Reader Support</h3>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={preferences.screenReaderEnabled}
                                onChange={(e) => handlePreferenceChange("screenReaderEnabled", e.target.checked)}
                                aria-describedby="screenreader-description"
                            />
                            <span>Enable Screen Reader Support</span>
                        </label>
                        <p id="screenreader-description" className="accessibility-settings__description">
                            Enables enhanced screen reader compatibility with live announcements and detailed element
                            descriptions.
                        </p>
                    </div>
                </section>

                {/* Navigation */}
                <section className="accessibility-settings__section" aria-labelledby="navigation-section">
                    <h3 id="navigation-section">Navigation</h3>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={preferences.keyboardNavigationEnabled}
                                onChange={(e) => handlePreferenceChange("keyboardNavigationEnabled", e.target.checked)}
                                aria-describedby="keyboard-navigation-description"
                            />
                            <span>Keyboard Navigation</span>
                        </label>
                        <p id="keyboard-navigation-description" className="accessibility-settings__description">
                            Enables enhanced keyboard navigation with arrow keys, tab navigation, and keyboard
                            shortcuts.
                        </p>
                    </div>
                </section>

                {/* Announcements */}
                <section className="accessibility-settings__section" aria-labelledby="announcements-section">
                    <h3 id="announcements-section">Screen Reader Announcements</h3>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={preferences.announceSelections}
                                onChange={(e) => handlePreferenceChange("announceSelections", e.target.checked)}
                                aria-describedby="announce-selections-description"
                            />
                            <span>Selection Changes</span>
                        </label>
                        <p id="announce-selections-description" className="accessibility-settings__description">
                            Announces when objects are selected or deselected, including object details.
                        </p>
                    </div>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={preferences.announceToolChanges}
                                onChange={(e) => handlePreferenceChange("announceToolChanges", e.target.checked)}
                                aria-describedby="announce-tools-description"
                            />
                            <span>Tool Changes</span>
                        </label>
                        <p id="announce-tools-description" className="accessibility-settings__description">
                            Announces when the active tool is changed (selection, rectangle, circle, etc.).
                        </p>
                    </div>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={preferences.announceObjectCreation}
                                onChange={(e) => handlePreferenceChange("announceObjectCreation", e.target.checked)}
                                aria-describedby="announce-creation-description"
                            />
                            <span>Object Creation</span>
                        </label>
                        <p id="announce-creation-description" className="accessibility-settings__description">
                            Announces when new objects are created, including object type and properties.
                        </p>
                    </div>

                    <div className="accessibility-settings__option">
                        <label className="accessibility-settings__label">
                            <input
                                type="checkbox"
                                checked={preferences.announceObjectModification}
                                onChange={(e) => handlePreferenceChange("announceObjectModification", e.target.checked)}
                                aria-describedby="announce-modification-description"
                            />
                            <span>Object Modifications</span>
                        </label>
                        <p id="announce-modification-description" className="accessibility-settings__description">
                            Announces when objects are modified (moved, resized, styled). Note: This can be verbose
                            during frequent editing.
                        </p>
                    </div>
                </section>

                {/* Keyboard Shortcuts Reference */}
                <section className="accessibility-settings__section" aria-labelledby="shortcuts-section">
                    <h3 id="shortcuts-section">Accessibility Shortcuts</h3>
                    <div className="accessibility-settings__shortcuts">
                        <div className="accessibility-settings__shortcut">
                            <kbd>Alt</kbd> + <kbd>A</kbd>
                            <span>Announce current selection</span>
                        </div>
                        <div className="accessibility-settings__shortcut">
                            <kbd>Alt</kbd> + <kbd>S</kbd>
                            <span>Announce canvas statistics</span>
                        </div>
                        <div className="accessibility-settings__shortcut">
                            <kbd>Alt</kbd> + <kbd>T</kbd>
                            <span>Announce current tool</span>
                        </div>
                        <div className="accessibility-settings__shortcut">
                            <kbd>Tab</kbd>
                            <span>Navigate between interface elements</span>
                        </div>
                        <div className="accessibility-settings__shortcut">
                            <kbd>Escape</kbd>
                            <span>Clear selection or exit current mode</span>
                        </div>
                    </div>
                </section>
            </div>

            <div className="accessibility-settings__footer">
                <button className="accessibility-settings__reset" onClick={handleResetToDefaults} type="button">
                    Reset to Defaults
                </button>
                {onClose && (
                    <button className="accessibility-settings__apply" onClick={onClose} type="button">
                        Apply Settings
                    </button>
                )}
            </div>
        </div>
    );
};
