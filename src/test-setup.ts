import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Setup DOM for each test
beforeEach(() => {
    // Ensure document.body exists and is clean
    if (!document.body) {
        document.body = document.createElement("body");
    }
    document.body.innerHTML = "";
});

// Mock window and localStorage for tests
Object.defineProperty(global, "window", {
    value: {
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
        },
        matchMedia: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {},
        }),
        navigator: {
            clipboard: {
                writeText: vi.fn(() => Promise.resolve()),
                readText: vi.fn(() => Promise.resolve("")),
            },
        },
    },
    writable: true,
});

// Make localStorage available globally
Object.defineProperty(global, "localStorage", {
    value: global.window.localStorage,
    writable: true,
});

// Make matchMedia available globally
Object.defineProperty(global, "matchMedia", {
    value: global.window.matchMedia,
    writable: true,
});

// Mock URL global
Object.defineProperty(global, "URL", {
    value: {
        createObjectURL: vi.fn(() => "mock-url"),
        revokeObjectURL: vi.fn(),
    },
    writable: true,
});
