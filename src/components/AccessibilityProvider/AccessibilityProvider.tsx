import React, { useEffect, useRef } from "react";
import {
    ScreenReaderAnnouncer,
    FocusManager,
    KeyboardNavigationManager,
    AccessibilityPreferencesManager,
    generateObjectAriaLabel,
} from "../../utils/accessibility";
import { useEditor } from "../../contexts/EditorContext";
import { type CanvasObject } from "../../types/editor";
import cn from "classnames";
import "./accessibilityProvider.css";

interface AccessibilityProviderProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * AccessibilityProvider enhances the editor with screen reader support,
 * keyboard navigation, focus management, and accessibility announcements.
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children, className }) => {
    const { state, selectObjects, setTool } = useEditor();
    const containerRef = useRef<HTMLDivElement>(null);
    const keyboardManagerRef = useRef<KeyboardNavigationManager | null>(null);
    const previousSelectionRef = useRef<string[]>([]);
    const previousToolRef = useRef<string>(state.selectedTool);

    const accessibilityProviderCn = cn("AccessibilityProvider", className);

    // Initialize accessibility services
    useEffect(() => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const preferencesManager = AccessibilityPreferencesManager.getInstance();

        // Setup keyboard navigation for the container
        if (containerRef.current) {
            keyboardManagerRef.current = new KeyboardNavigationManager(containerRef.current, {
                enableArrowKeys: true,
                enableTabNavigation: true,
                enableEscapeHandling: true,
                enableEnterHandling: true,
                customHandlers: {
                    "Alt+F4": () => {
                        // Close any open dialogs or panels
                        const event = new CustomEvent("accessibility-close-dialogs");
                        document.dispatchEvent(event);
                    },
                },
            });
        }

        // Announce initial state
        const preferences = preferencesManager.getPreferences();
        if (preferences.screenReaderEnabled) {
            announcer.announce("Visual editor loaded. Use Tab to navigate between tools and canvas elements.");
        }

        return () => {
            if (keyboardManagerRef.current) {
                keyboardManagerRef.current.destroy();
            }
        };
    }, []);

    // Announce selection changes
    useEffect(() => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const preferencesManager = AccessibilityPreferencesManager.getInstance();
        const preferences = preferencesManager.getPreferences();

        if (!preferences.announceSelections) return;

        const currentSelection = state.selection.objectIds;
        const previousSelection = previousSelectionRef.current;

        // Check if selection has changed
        if (
            currentSelection.length !== previousSelection.length ||
            !currentSelection.every((id) => previousSelection.includes(id))
        ) {
            if (currentSelection.length === 0) {
                announcer.announce("Selection cleared");
            } else if (currentSelection.length === 1) {
                const object = state.objects[currentSelection[0]];
                if (object) {
                    const label = generateObjectAriaLabel(object);
                    announcer.announce(`Selected: ${label}`);
                }
            } else {
                announcer.announce(`Selected ${currentSelection.length} objects`);
            }
        }

        previousSelectionRef.current = [...currentSelection];
    }, [state.selection.objectIds, state.objects]);

    // Announce tool changes
    useEffect(() => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const preferencesManager = AccessibilityPreferencesManager.getInstance();
        const preferences = preferencesManager.getPreferences();

        if (!preferences.announceToolChanges) return;

        const currentTool = state.selectedTool;
        const previousTool = previousToolRef.current;

        if (currentTool !== previousTool) {
            const toolNames: Record<string, string> = {
                select: "Selection tool",
                hand: "Hand tool for panning",
                rectangle: "Rectangle creation tool",
                circle: "Circle creation tool",
                text: "Text creation tool",
                pen: "Pen tool for path drawing",
            };

            const toolName = toolNames[currentTool] || currentTool;
            announcer.announce(`Tool changed to ${toolName}`);
        }

        previousToolRef.current = currentTool;
    }, [state.selectedTool]);

    // Announce object creation
    useEffect(() => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const preferencesManager = AccessibilityPreferencesManager.getInstance();
        const preferences = preferencesManager.getPreferences();

        if (!preferences.announceObjectCreation) return;

        // Listen for object creation events
        const handleObjectCreated = (event: CustomEvent) => {
            const { object } = event.detail;
            if (object) {
                const label = generateObjectAriaLabel(object);
                announcer.announce(`Created: ${label}`);
            }
        };

        document.addEventListener("object-created", handleObjectCreated as EventListener);

        return () => {
            document.removeEventListener("object-created", handleObjectCreated as EventListener);
        };
    }, []);

    // Announce object modifications
    useEffect(() => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const preferencesManager = AccessibilityPreferencesManager.getInstance();
        const preferences = preferencesManager.getPreferences();

        if (!preferences.announceObjectModification) return;

        // Listen for object modification events
        const handleObjectModified = (event: CustomEvent) => {
            const { object, property } = event.detail;
            if (object && property) {
                announcer.announce(`Modified ${object.name || object.type}: ${property}`);
            }
        };

        document.addEventListener("object-modified", handleObjectModified as EventListener);

        return () => {
            document.removeEventListener("object-modified", handleObjectModified as EventListener);
        };
    }, []);

    // Handle keyboard shortcuts for accessibility features
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Skip if an input is focused
            const activeElement = document.activeElement;
            const isInputFocused =
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    (activeElement as HTMLElement).contentEditable === "true");

            if (isInputFocused) return;

            // Alt+A: Announce current selection
            if (event.altKey && event.key.toLowerCase() === "a" && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                announceCurrentState();
            }

            // Alt+S: Announce canvas statistics
            if (event.altKey && event.key.toLowerCase() === "s" && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                announceCanvasStats();
            }

            // Alt+T: Announce current tool
            if (event.altKey && event.key.toLowerCase() === "t" && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                announceCurrentTool();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [state]);

    const announceCurrentState = () => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const { selection, objects } = state;

        if (selection.objectIds.length === 0) {
            announcer.announce("No objects selected");
        } else if (selection.objectIds.length === 1) {
            const object = objects[selection.objectIds[0]];
            if (object) {
                const label = generateObjectAriaLabel(object);
                announcer.announce(`Currently selected: ${label}`);
            }
        } else {
            announcer.announce(`${selection.objectIds.length} objects selected`);
        }
    };

    const announceCanvasStats = () => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const { objects, layers } = state;

        const totalObjects = Object.keys(objects).length;
        const totalLayers = Object.keys(layers).length;
        const visibleObjects = Object.values(objects).filter((obj) => obj.visible).length;

        announcer.announce(
            `Canvas contains ${totalObjects} objects across ${totalLayers} layers. ${visibleObjects} objects are visible.`
        );
    };

    const announceCurrentTool = () => {
        const announcer = ScreenReaderAnnouncer.getInstance();
        const toolNames: Record<string, string> = {
            select: "Selection tool active",
            hand: "Hand tool active for panning",
            rectangle: "Rectangle creation tool active",
            circle: "Circle creation tool active",
            text: "Text creation tool active",
            pen: "Pen tool active for path drawing",
        };

        const toolName = toolNames[state.selectedTool] || `${state.selectedTool} tool active`;
        announcer.announce(toolName);
    };

    return (
        <div
            ref={containerRef}
            className={accessibilityProviderCn}
            role="application"
            aria-label="Visual Icon Editor"
            aria-description="Use keyboard shortcuts to navigate and create icons. Press Alt+A to announce current selection, Alt+S for canvas statistics, Alt+T for current tool.">
            {children}

            {/* Hidden element for screen reader instructions */}
            <div className="sr-only" aria-live="polite" id="accessibility-instructions">
                <h2>Accessibility Instructions</h2>
                <p>This visual editor supports keyboard navigation and screen reader announcements.</p>
                <ul>
                    <li>Use Tab to navigate between interface elements</li>
                    <li>Use arrow keys to navigate within component groups</li>
                    <li>Press Alt+A to announce current selection</li>
                    <li>Press Alt+S to announce canvas statistics</li>
                    <li>Press Alt+T to announce current tool</li>
                    <li>Press Escape to clear selection or exit current mode</li>
                </ul>
            </div>
        </div>
    );
};

/**
 * Hook for accessing accessibility features
 */
export const useAccessibility = () => {
    const announcer = ScreenReaderAnnouncer.getInstance();
    const preferencesManager = AccessibilityPreferencesManager.getInstance();

    const announce = (message: string, priority?: "polite" | "assertive") => {
        announcer.announce(message, priority);
    };

    const getPreferences = () => preferencesManager.getPreferences();

    const updatePreference = <K extends keyof import("../../utils/accessibility").AccessibilityPreferences>(
        key: K,
        value: import("../../utils/accessibility").AccessibilityPreferences[K]
    ) => {
        preferencesManager.updatePreference(key, value);
    };

    const saveFocus = () => FocusManager.saveFocus();
    const restoreFocus = () => FocusManager.restoreFocus();
    const trapFocus = (element: HTMLElement) => FocusManager.trapFocus(element);
    const releaseFocusTrap = () => FocusManager.releaseFocusTrap();

    return {
        announce,
        getPreferences,
        updatePreference,
        saveFocus,
        restoreFocus,
        trapFocus,
        releaseFocusTrap,
        generateObjectAriaLabel,
    };
};
