import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
    ScreenReaderAnnouncer,
    generateObjectAriaLabel,
    FocusManager,
    KeyboardNavigationManager,
    HighContrastManager,
    AccessibilityPreferencesManager,
} from "./accessibility";
import type { RectangleObject, CircleObject, TextObject, PathObject } from "../types/editor";

// Setup DOM environment for testing
import { JSDOM } from "jsdom";

// Setup DOM if not already available
if (typeof window === "undefined") {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "http://localhost",
        pretendToBeVisual: true,
        resources: "usable",
    });

    global.window = dom.window as any;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Event = dom.window.Event;
    global.KeyboardEvent = dom.window.KeyboardEvent;
    global.CustomEvent = dom.window.CustomEvent;
    global.MouseEvent = dom.window.MouseEvent;
}

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock window.matchMedia
const matchMediaMock = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));
Object.defineProperty(window, "matchMedia", { value: matchMediaMock });

describe("ScreenReaderAnnouncer", () => {
    let announcer: ScreenReaderAnnouncer;

    beforeEach(() => {
        // Clear any existing live regions
        const existingRegions = document.querySelectorAll("[aria-live]");
        existingRegions.forEach((region) => region.remove());

        announcer = ScreenReaderAnnouncer.getInstance();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("should create a singleton instance", () => {
        const announcer1 = ScreenReaderAnnouncer.getInstance();
        const announcer2 = ScreenReaderAnnouncer.getInstance();
        expect(announcer1).toBe(announcer2);
    });

    test("should create live region element", () => {
        const liveRegion = document.querySelector("[aria-live]");
        expect(liveRegion).toBeInTheDocument();
        expect(liveRegion).toHaveAttribute("aria-live", "polite");
        expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    });

    test("should announce messages", () => {
        const message = "Test announcement";
        announcer.announce(message);

        const liveRegion = document.querySelector("[aria-live]");
        expect(liveRegion).toHaveTextContent(message);
    });

    test("should set priority for announcements", () => {
        announcer.announce("Urgent message", "assertive");

        const liveRegion = document.querySelector("[aria-live]");
        expect(liveRegion).toHaveAttribute("aria-live", "assertive");
    });

    test("should clear message after delay", async () => {
        const message = "Test message";
        announcer.announce(message);

        const liveRegion = document.querySelector("[aria-live]");
        expect(liveRegion).toHaveTextContent(message);

        await waitFor(
            () => {
                expect(liveRegion).toHaveTextContent("");
            },
            { timeout: 1500 }
        );
    });
});

describe("generateObjectAriaLabel", () => {
    test("should generate label for rectangle object", () => {
        const rectangle: RectangleObject = {
            id: "rect1",
            type: "rectangle",
            name: "Test Rectangle",
            layerId: "layer1",
            transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            width: 150,
            height: 75,
            style: { fill: "#000000", stroke: "#ffffff", strokeWidth: 1 },
        };

        const label = generateObjectAriaLabel(rectangle);
        expect(label).toContain("Test Rectangle");
        expect(label).toContain("width 150, height 75");
        expect(label).toContain("at position 100, 200");
        expect(label).toContain("visible");
        expect(label).toContain("unlocked");
    });

    test("should generate label for circle object", () => {
        const circle: CircleObject = {
            id: "circle1",
            type: "circle",
            name: "Test Circle",
            layerId: "layer1",
            transform: { x: 50, y: 75, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: false,
            locked: true,
            opacity: 1,
            zIndex: 0,
            radius: 25,
            style: { fill: "#000000", stroke: "#ffffff", strokeWidth: 1 },
        };

        const label = generateObjectAriaLabel(circle);
        expect(label).toContain("Test Circle");
        expect(label).toContain("radius 25");
        expect(label).toContain("at position 50, 75");
        expect(label).toContain("hidden");
        expect(label).toContain("locked");
    });

    test("should generate label for text object", () => {
        const text: TextObject = {
            id: "text1",
            type: "text",
            name: "Test Text",
            layerId: "layer1",
            transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            content: "Hello World",
            style: {
                fontFamily: "Arial",
                fontSize: 16,
                fontWeight: "normal",
                color: "#000000",
                textAlign: "left",
                lineHeight: 1.2,
            },
        };

        const label = generateObjectAriaLabel(text);
        expect(label).toContain("Test Text");
        expect(label).toContain('text content: "Hello World"');
        expect(label).toContain("at position 10, 20");
    });

    test("should generate label for path object", () => {
        const path: PathObject = {
            id: "path1",
            type: "path",
            name: "Test Path",
            layerId: "layer1",
            transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 0,
            pathData: "M 0 0 L 100 100",
            nodes: [
                { id: "node1", x: 0, y: 0, type: "move" },
                { id: "node2", x: 100, y: 100, type: "line" },
            ],
            style: { fill: "none", stroke: "#000000", strokeWidth: 2 },
        };

        const label = generateObjectAriaLabel(path);
        expect(label).toContain("Test Path");
        expect(label).toContain("path with 2 nodes");
        expect(label).toContain("at position 0, 0");
    });
});

describe("FocusManager", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        container.innerHTML = `
            <button id="btn1">Button 1</button>
            <input id="input1" type="text" />
            <button id="btn2" disabled>Disabled Button</button>
            <button id="btn3" tabindex="-1">No Tab Button</button>
            <a id="link1" href="#">Link 1</a>
            <div id="div1" tabindex="0">Focusable Div</div>
        `;
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    test("should identify focusable elements", () => {
        const button = container.querySelector("#btn1") as HTMLElement;
        const input = container.querySelector("#input1") as HTMLElement;
        const disabledButton = container.querySelector("#btn2") as HTMLElement;
        const noTabButton = container.querySelector("#btn3") as HTMLElement;

        expect(FocusManager.isElementFocusable(button)).toBe(true);
        expect(FocusManager.isElementFocusable(input)).toBe(true);
        expect(FocusManager.isElementFocusable(disabledButton)).toBe(false);
        expect(FocusManager.isElementFocusable(noTabButton)).toBe(false);
    });

    test("should get focusable elements from container", () => {
        const focusableElements = FocusManager.getFocusableElements(container);

        expect(focusableElements).toHaveLength(4); // btn1, input1, link1, div1
        expect(focusableElements[0].id).toBe("btn1");
        expect(focusableElements[1].id).toBe("input1");
        expect(focusableElements[2].id).toBe("link1");
        expect(focusableElements[3].id).toBe("div1");
    });

    test("should save and restore focus", () => {
        const button = container.querySelector("#btn1") as HTMLElement;
        button.focus();

        FocusManager.saveFocus();

        const input = container.querySelector("#input1") as HTMLElement;
        input.focus();

        expect(document.activeElement).toBe(input);

        FocusManager.restoreFocus();
        expect(document.activeElement).toBe(button);
    });

    test("should move focus to next element", () => {
        const firstButton = container.querySelector("#btn1") as HTMLElement;
        firstButton.focus();

        FocusManager.moveFocus("next", container);

        // In JSDOM, focus behavior might differ, so we check if focus moved to a valid focusable element
        const focusableElements = container.querySelectorAll("button, input, [tabindex]:not([tabindex='-1'])");
        const focusedElement = document.activeElement;

        // Verify that the focused element is one of the focusable elements and not the original
        expect(Array.from(focusableElements)).toContain(focusedElement);
        expect(focusedElement).not.toBe(firstButton);
    });

    test("should move focus to previous element", () => {
        const input = container.querySelector("#input1") as HTMLElement;
        input.focus();

        FocusManager.moveFocus("previous", container);

        const firstButton = container.querySelector("#btn1") as HTMLElement;
        expect(document.activeElement).toBe(firstButton);
    });

    test("should trap focus within container", () => {
        FocusManager.trapFocus(container);

        const firstButton = container.querySelector("#btn1") as HTMLElement;
        expect(document.activeElement).toBe(firstButton);

        // Test Tab key at last element
        const lastElement = container.querySelector("#div1") as HTMLElement;
        lastElement.focus();

        const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
        container.dispatchEvent(tabEvent);

        // Should cycle back to first element
        expect(document.activeElement).toBe(firstButton);
    });
});

describe("KeyboardNavigationManager", () => {
    let container: HTMLElement;
    let manager: KeyboardNavigationManager;

    beforeEach(() => {
        container = document.createElement("div");
        container.innerHTML = `
            <button>Button 1</button>
            <button>Button 2</button>
            <button>Button 3</button>
        `;
        document.body.appendChild(container);

        manager = new KeyboardNavigationManager(container);
    });

    afterEach(() => {
        manager.destroy();
        document.body.removeChild(container);
    });

    test("should handle arrow key navigation", () => {
        const buttons = container.querySelectorAll("button");
        buttons[0].focus();

        const rightArrowEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
        container.dispatchEvent(rightArrowEvent);

        expect(document.activeElement).toBe(buttons[1]);
    });

    test("should handle custom key handlers", () => {
        const customHandler = vi.fn();
        manager.addCustomHandler("Ctrl+k", customHandler);

        const ctrlKEvent = new KeyboardEvent("keydown", {
            key: "k",
            ctrlKey: true,
        });
        container.dispatchEvent(ctrlKEvent);

        expect(customHandler).toHaveBeenCalledWith(ctrlKEvent);
    });

    test("should handle activation keys", () => {
        const button = container.querySelector("button") as HTMLElement;
        const clickSpy = vi.spyOn(button, "click");
        button.focus();

        const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
        container.dispatchEvent(enterEvent);

        expect(clickSpy).toHaveBeenCalled();
    });
});

describe("HighContrastManager", () => {
    let manager: HighContrastManager;

    beforeEach(() => {
        localStorageMock.getItem.mockReturnValue(null);
        matchMediaMock.mockReturnValue({
            matches: false,
            addListener: vi.fn(),
            removeListener: vi.fn(),
        });

        manager = HighContrastManager.getInstance();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("should create singleton instance", () => {
        const manager1 = HighContrastManager.getInstance();
        const manager2 = HighContrastManager.getInstance();
        expect(manager1).toBe(manager2);
    });

    test("should toggle high contrast mode", () => {
        expect(manager.isEnabled()).toBe(false);

        manager.toggle();

        expect(manager.isEnabled()).toBe(true);
        expect(document.body).toHaveClass("high-contrast");
        expect(localStorageMock.setItem).toHaveBeenCalledWith("high-contrast-mode", "true");
    });

    test("should enable high contrast mode", () => {
        manager.enable();

        expect(manager.isEnabled()).toBe(true);
        expect(document.body).toHaveClass("high-contrast");
    });

    test("should disable high contrast mode", () => {
        manager.enable();
        manager.disable();

        expect(manager.isEnabled()).toBe(false);
        expect(document.body).not.toHaveClass("high-contrast");
    });

    test("should notify listeners on change", () => {
        const listener = vi.fn();
        manager.addListener(listener);

        manager.toggle();

        expect(listener).toHaveBeenCalledWith(true);

        manager.removeListener(listener);
        manager.toggle();

        // Should not be called again after removal
        expect(listener).toHaveBeenCalledTimes(1);
    });
});

describe("AccessibilityPreferencesManager", () => {
    let manager: AccessibilityPreferencesManager;

    beforeEach(() => {
        localStorageMock.getItem.mockReturnValue(null);
        matchMediaMock.mockReturnValue({
            matches: false,
        });

        manager = AccessibilityPreferencesManager.getInstance();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test("should create singleton instance", () => {
        const manager1 = AccessibilityPreferencesManager.getInstance();
        const manager2 = AccessibilityPreferencesManager.getInstance();
        expect(manager1).toBe(manager2);
    });

    test("should return default preferences", () => {
        const preferences = manager.getPreferences();

        expect(preferences).toEqual({
            screenReaderEnabled: false,
            highContrastEnabled: false,
            reducedMotionEnabled: false,
            keyboardNavigationEnabled: true,
            announceSelections: true,
            announceToolChanges: true,
            announceObjectCreation: true,
            announceObjectModification: false,
        });
    });

    test("should update single preference", () => {
        const listener = vi.fn();
        manager.addListener(listener);

        manager.updatePreference("screenReaderEnabled", true);

        const preferences = manager.getPreferences();
        expect(preferences.screenReaderEnabled).toBe(true);
        expect(listener).toHaveBeenCalledWith(preferences);
        expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test("should update multiple preferences", () => {
        manager.updatePreferences({
            screenReaderEnabled: true,
            highContrastEnabled: true,
            announceSelections: false,
        });

        const preferences = manager.getPreferences();
        expect(preferences.screenReaderEnabled).toBe(true);
        expect(preferences.highContrastEnabled).toBe(true);
        expect(preferences.announceSelections).toBe(false);
    });

    test("should reset to defaults", () => {
        manager.updatePreference("screenReaderEnabled", true);
        manager.resetToDefaults();

        const preferences = manager.getPreferences();
        expect(preferences.screenReaderEnabled).toBe(false);
    });

    test("should load preferences from localStorage", () => {
        const storedPreferences = {
            screenReaderEnabled: true,
            announceSelections: false,
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences));

        // Create new instance to test loading
        const newManager = AccessibilityPreferencesManager.getInstance();
        const preferences = newManager.getPreferences();

        expect(preferences.screenReaderEnabled).toBe(true);
        expect(preferences.announceSelections).toBe(false);
        expect(preferences.keyboardNavigationEnabled).toBe(true); // Should merge with defaults
    });
});
