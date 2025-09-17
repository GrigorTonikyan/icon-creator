/**
 * Accessibility utilities for screen reader support, keyboard navigation,
 * focus management, and ARIA label generation
 */

import { CanvasObject, RectangleObject, CircleObject, TextObject, PathObject } from "../types/editor";

// Screen reader announcements
export class ScreenReaderAnnouncer {
    private static instance: ScreenReaderAnnouncer;
    private liveRegion: HTMLElement | null = null;

    private constructor() {
        this.createLiveRegion();
    }

    public static getInstance(): ScreenReaderAnnouncer {
        if (!ScreenReaderAnnouncer.instance) {
            ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
        }
        return ScreenReaderAnnouncer.instance;
    }

    private createLiveRegion(): void {
        if (typeof document === "undefined") return;

        this.liveRegion = document.createElement("div");
        this.liveRegion.setAttribute("aria-live", "polite");
        this.liveRegion.setAttribute("aria-atomic", "true");
        this.liveRegion.className = "sr-only";
        this.liveRegion.style.position = "absolute";
        this.liveRegion.style.left = "-10000px";
        this.liveRegion.style.width = "1px";
        this.liveRegion.style.height = "1px";
        this.liveRegion.style.overflow = "hidden";
        document.body.appendChild(this.liveRegion);
    }

    public announce(message: string, priority: "polite" | "assertive" = "polite"): void {
        if (!this.liveRegion) return;

        this.liveRegion.setAttribute("aria-live", priority);
        this.liveRegion.textContent = message;

        // Clear the message after a delay to ensure it can be announced again
        setTimeout(() => {
            if (this.liveRegion) {
                this.liveRegion.textContent = "";
            }
        }, 1000);
    }

    public destroy(): void {
        if (this.liveRegion && this.liveRegion.parentNode) {
            this.liveRegion.parentNode.removeChild(this.liveRegion);
            this.liveRegion = null;
        }
    }
}

// ARIA label generation for canvas objects
export function generateObjectAriaLabel(object: CanvasObject): string {
    const baseLabel = `${object.name || object.type}`;
    const position = `at position ${Math.round(object.transform.x)}, ${Math.round(object.transform.y)}`;

    let dimensions = "";
    switch (object.type) {
        case "rectangle": {
            const rect = object as RectangleObject;
            dimensions = `width ${Math.round(rect.width)}, height ${Math.round(rect.height)}`;
            break;
        }
        case "circle": {
            const circle = object as CircleObject;
            dimensions = `radius ${Math.round(circle.radius)}`;
            break;
        }
        case "text": {
            const text = object as TextObject;
            dimensions = `text content: "${text.content}"`;
            break;
        }
        case "path": {
            const path = object as PathObject;
            const nodeCount = path.nodes?.length || 0;
            dimensions = `path with ${nodeCount} nodes`;
            break;
        }
    }

    const visibility = object.visible ? "visible" : "hidden";
    const locked = object.locked ? "locked" : "unlocked";

    return `${baseLabel}, ${dimensions}, ${position}, ${visibility}, ${locked}`;
}

// Focus management utilities
export class FocusManager {
    private static focusHistory: HTMLElement[] = [];
    private static trapStack: HTMLElement[] = [];

    /**
     * Save current focus to history
     */
    public static saveFocus(): void {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
            this.focusHistory.push(activeElement);
        }
    }

    /**
     * Restore previously saved focus
     */
    public static restoreFocus(): void {
        const lastFocus = this.focusHistory.pop();
        if (lastFocus && this.isElementFocusable(lastFocus)) {
            lastFocus.focus();
        }
    }

    /**
     * Check if element is focusable
     */
    public static isElementFocusable(element: HTMLElement): boolean {
        if (!element || element.offsetParent === null) return false;

        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.visibility === "hidden" || computedStyle.display === "none") {
            return false;
        }

        // Check if element is naturally focusable or has tabindex
        const focusableElements = ["input", "button", "select", "textarea", "a", "iframe", "object", "embed"];

        const tagName = element.tagName.toLowerCase();
        const tabIndex = parseInt(element.getAttribute("tabindex") || "-1");

        return focusableElements.includes(tagName) || tabIndex >= 0 || element.contentEditable === "true";
    }

    /**
     * Get all focusable elements within a container
     */
    public static getFocusableElements(container: HTMLElement): HTMLElement[] {
        const focusableSelector = [
            'input:not([disabled]):not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            'a[href]:not([tabindex="-1"])',
            'iframe:not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]:not([tabindex="-1"])',
        ].join(", ");

        return Array.from(container.querySelectorAll(focusableSelector)).filter((el) =>
            this.isElementFocusable(el as HTMLElement)
        ) as HTMLElement[];
    }

    /**
     * Trap focus within a container
     */
    public static trapFocus(container: HTMLElement): void {
        this.trapStack.push(container);

        const focusableElements = this.getFocusableElements(container);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Tab") return;

            if (event.shiftKey) {
                // Shift + Tab (backward)
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab (forward)
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener("keydown", handleKeyDown);

        // Store the handler for cleanup
        (container as any).__focusTrapHandler = handleKeyDown;

        // Focus the first element
        firstElement.focus();
    }

    /**
     * Release focus trap
     */
    public static releaseFocusTrap(): void {
        const container = this.trapStack.pop();
        if (!container) return;

        const handler = (container as any).__focusTrapHandler;
        if (handler) {
            container.removeEventListener("keydown", handler);
            delete (container as any).__focusTrapHandler;
        }
    }

    /**
     * Move focus to next/previous focusable element
     */
    public static moveFocus(direction: "next" | "previous", container?: HTMLElement): void {
        const root = container || document.body;
        const focusableElements = this.getFocusableElements(root);

        if (focusableElements.length === 0) return;

        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        let nextIndex;

        if (direction === "next") {
            nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % focusableElements.length;
        } else {
            nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        }

        focusableElements[nextIndex].focus();
    }
}

// Keyboard navigation utilities
export interface KeyboardNavigationConfig {
    enableArrowKeys: boolean;
    enableTabNavigation: boolean;
    enableEscapeHandling: boolean;
    enableEnterHandling: boolean;
    customHandlers?: {
        [key: string]: (event: KeyboardEvent) => void;
    };
}

export class KeyboardNavigationManager {
    private config: KeyboardNavigationConfig;
    private element: HTMLElement;
    private handlers: Map<string, (event: KeyboardEvent) => void> = new Map();

    constructor(element: HTMLElement, config: Partial<KeyboardNavigationConfig> = {}) {
        this.element = element;
        this.config = {
            enableArrowKeys: true,
            enableTabNavigation: true,
            enableEscapeHandling: true,
            enableEnterHandling: true,
            ...config,
        };

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.element.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

        // Check for custom handlers first
        const keyCombo = `${ctrlKey ? "Ctrl+" : ""}${metaKey ? "Cmd+" : ""}${shiftKey ? "Shift+" : ""}${
            altKey ? "Alt+" : ""
        }${key}`;

        const customHandler = this.config.customHandlers?.[keyCombo] || this.handlers.get(keyCombo);
        if (customHandler) {
            customHandler(event);
            return;
        }

        // Built-in navigation handlers
        switch (key) {
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
                if (this.config.enableArrowKeys) {
                    this.handleArrowKey(key, event);
                }
                break;

            case "Tab":
                if (this.config.enableTabNavigation) {
                    this.handleTabKey(shiftKey, event);
                }
                break;

            case "Escape":
                if (this.config.enableEscapeHandling) {
                    this.handleEscapeKey(event);
                }
                break;

            case "Enter":
            case " ":
                if (this.config.enableEnterHandling) {
                    this.handleActivationKey(event);
                }
                break;
        }
    }

    private handleArrowKey(key: string, event: KeyboardEvent): void {
        // Find current focused element within container
        const focusableElements = FocusManager.getFocusableElements(this.element);
        const currentElement = document.activeElement as HTMLElement;
        const currentIndex = focusableElements.indexOf(currentElement);

        if (currentIndex === -1) return;

        let nextIndex: number;
        switch (key) {
            case "ArrowUp":
            case "ArrowLeft":
                nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                break;
            case "ArrowDown":
            case "ArrowRight":
                nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
                break;
            default:
                return;
        }

        event.preventDefault();
        focusableElements[nextIndex].focus();
    }

    private handleTabKey(shiftKey: boolean, event: KeyboardEvent): void {
        // Default tab behavior within the container
        FocusManager.moveFocus(shiftKey ? "previous" : "next", this.element);
    }

    private handleEscapeKey(event: KeyboardEvent): void {
        // Default escape behavior - blur current element or close container
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
            activeElement.blur();
        }
    }

    private handleActivationKey(event: KeyboardEvent): void {
        // Default activation behavior - trigger click on current element
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && typeof activeElement.click === "function") {
            event.preventDefault();
            activeElement.click();
        }
    }

    public addCustomHandler(keyCombo: string, handler: (event: KeyboardEvent) => void): void {
        this.handlers.set(keyCombo, handler);
    }

    public removeCustomHandler(keyCombo: string): void {
        this.handlers.delete(keyCombo);
    }

    public destroy(): void {
        this.element.removeEventListener("keydown", this.handleKeyDown.bind(this));
        this.handlers.clear();
    }
}

// High contrast mode utilities
export class HighContrastManager {
    private static instance: HighContrastManager;
    private isHighContrast: boolean = false;
    private mediaQuery: MediaQueryList | null = null;
    private listeners: Set<(enabled: boolean) => void> = new Set();

    private constructor() {
        this.detectSystemPreference();
        this.setupEventListeners();
    }

    public static getInstance(): HighContrastManager {
        if (!HighContrastManager.instance) {
            HighContrastManager.instance = new HighContrastManager();
        }
        return HighContrastManager.instance;
    }

    private detectSystemPreference(): void {
        if (typeof window === "undefined") return;

        // Check for high contrast media query
        this.mediaQuery =
            window.matchMedia("(prefers-contrast: high)") || window.matchMedia("(-ms-high-contrast: active)");

        this.isHighContrast = this.mediaQuery.matches;

        // Check for stored preference
        const stored = localStorage.getItem("high-contrast-mode");
        if (stored !== null) {
            this.isHighContrast = stored === "true";
        }

        this.applyHighContrastMode();
    }

    private setupEventListeners(): void {
        if (this.mediaQuery) {
            this.mediaQuery.addListener((e) => {
                this.isHighContrast = e.matches;
                this.applyHighContrastMode();
                this.notifyListeners();
            });
        }
    }

    private applyHighContrastMode(): void {
        if (typeof document === "undefined") return;

        const body = document.body;
        if (this.isHighContrast) {
            body.classList.add("high-contrast");
            body.setAttribute("data-theme", "high-contrast");
        } else {
            body.classList.remove("high-contrast");
            body.removeAttribute("data-theme");
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener(this.isHighContrast));
    }

    public isEnabled(): boolean {
        return this.isHighContrast;
    }

    public toggle(): void {
        this.isHighContrast = !this.isHighContrast;
        localStorage.setItem("high-contrast-mode", this.isHighContrast.toString());
        this.applyHighContrastMode();
        this.notifyListeners();
    }

    public enable(): void {
        if (!this.isHighContrast) {
            this.toggle();
        }
    }

    public disable(): void {
        if (this.isHighContrast) {
            this.toggle();
        }
    }

    public addListener(listener: (enabled: boolean) => void): void {
        this.listeners.add(listener);
    }

    public removeListener(listener: (enabled: boolean) => void): void {
        this.listeners.delete(listener);
    }

    public destroy(): void {
        if (this.mediaQuery) {
            this.mediaQuery.removeListener(this.detectSystemPreference);
        }
        this.listeners.clear();
    }
}

// Accessibility preferences
export interface AccessibilityPreferences {
    screenReaderEnabled: boolean;
    highContrastEnabled: boolean;
    reducedMotionEnabled: boolean;
    keyboardNavigationEnabled: boolean;
    announceSelections: boolean;
    announceToolChanges: boolean;
    announceObjectCreation: boolean;
    announceObjectModification: boolean;
}

export class AccessibilityPreferencesManager {
    private static instance: AccessibilityPreferencesManager;
    private preferences: AccessibilityPreferences;
    private listeners: Set<(preferences: AccessibilityPreferences) => void> = new Set();

    private constructor() {
        this.preferences = this.loadPreferences();
        this.detectSystemPreferences();
    }

    public static getInstance(): AccessibilityPreferencesManager {
        if (!AccessibilityPreferencesManager.instance) {
            AccessibilityPreferencesManager.instance = new AccessibilityPreferencesManager();
        }
        return AccessibilityPreferencesManager.instance;
    }

    private loadPreferences(): AccessibilityPreferences {
        const stored = localStorage.getItem("accessibility-preferences");
        if (stored) {
            try {
                return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
            } catch (error) {
                console.warn("Failed to parse accessibility preferences:", error);
            }
        }
        return this.getDefaultPreferences();
    }

    private getDefaultPreferences(): AccessibilityPreferences {
        return {
            screenReaderEnabled: false,
            highContrastEnabled: false,
            reducedMotionEnabled: false,
            keyboardNavigationEnabled: true,
            announceSelections: true,
            announceToolChanges: true,
            announceObjectCreation: true,
            announceObjectModification: false, // Can be verbose
        };
    }

    private detectSystemPreferences(): void {
        if (typeof window === "undefined") return;

        // Detect high contrast preference
        const highContrastQuery =
            window.matchMedia("(prefers-contrast: high)") || window.matchMedia("(-ms-high-contrast: active)");
        if (highContrastQuery.matches) {
            this.preferences.highContrastEnabled = true;
        }

        // Detect reduced motion preference
        const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (reducedMotionQuery.matches) {
            this.preferences.reducedMotionEnabled = true;
        }

        this.savePreferences();
    }

    private savePreferences(): void {
        try {
            localStorage.setItem("accessibility-preferences", JSON.stringify(this.preferences));
        } catch (error) {
            console.warn("Failed to save accessibility preferences:", error);
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener({ ...this.preferences }));
    }

    public getPreferences(): AccessibilityPreferences {
        return { ...this.preferences };
    }

    public updatePreference<K extends keyof AccessibilityPreferences>(
        key: K,
        value: AccessibilityPreferences[K]
    ): void {
        this.preferences[key] = value;
        this.savePreferences();
        this.notifyListeners();
    }

    public updatePreferences(updates: Partial<AccessibilityPreferences>): void {
        this.preferences = { ...this.preferences, ...updates };
        this.savePreferences();
        this.notifyListeners();
    }

    public resetToDefaults(): void {
        this.preferences = this.getDefaultPreferences();
        this.savePreferences();
        this.notifyListeners();
    }

    public addListener(listener: (preferences: AccessibilityPreferences) => void): void {
        this.listeners.add(listener);
    }

    public removeListener(listener: (preferences: AccessibilityPreferences) => void): void {
        this.listeners.delete(listener);
    }
}
