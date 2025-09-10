import "@testing-library/jest-dom";

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
