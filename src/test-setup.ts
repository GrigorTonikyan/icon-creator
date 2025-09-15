// DOM setup for tests
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Setup and cleanup for each test
beforeEach(() => {
    // Reset any global mocks
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
    writable: true,
});

// Mock URL global
Object.defineProperty(global, "URL", {
    value: class URL {
        href: string;
        protocol: string;
        hostname: string;
        pathname: string;

        constructor(url: string, base?: string | URL) {
            if (typeof url !== "string" || !url.includes("://")) {
                throw new TypeError("Invalid URL");
            }
            this.href = url;
            this.protocol = url.split("://")[0] + ":";
            this.hostname = url.split("://")[1]?.split("/")[0] || "";
            this.pathname = "/" + (url.split("://")[1]?.split("/").slice(1).join("/") || "");
        }

        static createObjectURL = vi.fn(() => "mock-url");
        static revokeObjectURL = vi.fn();
    },
    writable: true,
});
Object.defineProperty(global, "URL", {
    value: {
        createObjectURL: vi.fn(() => "mock-url"),
        revokeObjectURL: vi.fn(),
    },
    writable: true,
});
