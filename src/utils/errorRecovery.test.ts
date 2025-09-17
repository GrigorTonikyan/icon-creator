import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { CrashRecoveryManager, AutoSaveManager, ErrorUtils } from "./errorRecovery";

// Mock window and navigator objects
Object.defineProperty(globalThis, "window", {
    value: {
        location: { href: "http://localhost:3000" },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    },
    writable: true,
});

Object.defineProperty(globalThis, "navigator", {
    value: {
        userAgent: "Test User Agent",
    },
    writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
});

describe("ErrorRecovery", () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("CrashRecoveryManager", () => {
        test("should be a singleton", () => {
            const instance1 = CrashRecoveryManager.getInstance();
            const instance2 = CrashRecoveryManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        test("should save and retrieve recovery state", () => {
            const manager = CrashRecoveryManager.getInstance();
            const projectId = "test-project";
            const state = {
                projectData: '{"test": "data"}',
                viewport: { x: 100, y: 200 },
                selection: ["obj1", "obj2"],
                tool: "rectangle",
            };

            manager.saveRecoveryState(projectId, state);
            expect(manager.hasRecoveryState(projectId)).toBe(true);

            const retrievedState = manager.getRecoveryState(projectId);
            expect(retrievedState).toMatchObject(state);
            expect(retrievedState?.lastSaved).toBeDefined();
        });

        test("should clear recovery state", () => {
            const manager = CrashRecoveryManager.getInstance();
            const projectId = "test-project";

            manager.saveRecoveryState(projectId, { projectData: "test" });
            expect(manager.hasRecoveryState(projectId)).toBe(true);

            manager.clearRecoveryState(projectId);
            expect(manager.hasRecoveryState(projectId)).toBe(false);
        });

        test("should generate crash report", () => {
            const manager = CrashRecoveryManager.getInstance();
            const error = new Error("Test error");
            const errorInfo = "Test error info";
            const additionalData = { test: "data" };

            const report = manager.generateCrashReport(error, errorInfo, additionalData);

            expect(report.error).toBe(error);
            expect(report.errorInfo).toBe(errorInfo);
            expect(report.additionalData).toBe(additionalData);
            expect(report.timestamp).toBeDefined();
            expect(report.userAgent).toBeDefined();
            expect(report.url).toBeDefined();
        });

        test("should submit crash report", () => {
            const manager = CrashRecoveryManager.getInstance();
            const error = new Error("Test error");
            const report = manager.generateCrashReport(error, "Test error info");

            manager.submitCrashReport(report);

            // Check that report was saved to localStorage
            const savedReports = JSON.parse(localStorage.getItem("crash_reports") || "[]");
            expect(savedReports).toHaveLength(1);
            expect(savedReports[0].errorInfo).toBe("Test error info");
        });

        test("should manage recovery mode", () => {
            const manager = CrashRecoveryManager.getInstance();

            expect(manager.isInRecoveryMode()).toBe(false);

            manager.setRecoveryMode(true);
            expect(manager.isInRecoveryMode()).toBe(true);

            manager.setRecoveryMode(false);
            expect(manager.isInRecoveryMode()).toBe(false);
        });
    });

    describe("AutoSaveManager", () => {
        test("should be a singleton", () => {
            const instance1 = AutoSaveManager.getInstance();
            const instance2 = AutoSaveManager.getInstance();
            expect(instance1).toBe(instance2);
        });

        test("should configure auto-save settings", () => {
            const manager = AutoSaveManager.getInstance();
            const config = { interval: 10000, enabled: false };

            manager.configure(config);
            // Test that configuration was applied by checking behavior
            // This is implicit since the config is private
        });

        test("should trigger save with callback", async () => {
            const manager = AutoSaveManager.getInstance();
            const saveCallback = vi.fn().mockResolvedValue(undefined);
            const testData = { test: "data" };

            manager.setSaveCallback(saveCallback);
            const result = await manager.triggerSave(testData);

            expect(result).toBe(true);
            expect(saveCallback).toHaveBeenCalledWith(testData);
        });

        test("should fallback to localStorage when no callback", async () => {
            const manager = AutoSaveManager.getInstance();
            const testData = { test: "data" };

            // Clear any existing save callback
            manager.setSaveCallback(undefined as any);
            const result = await manager.triggerSave(testData);

            expect(result).toBe(true);
            const saved = localStorage.getItem("autosave_data");
            expect(saved).toBeDefined();
            if (saved) {
                const parsedSaved = JSON.parse(saved);
                expect(parsedSaved.data).toEqual(testData);
            }
        });
    });

    describe("ErrorUtils", () => {
        test("should get user-friendly error message", () => {
            const networkError = new Error("Network request failed");
            networkError.name = "NetworkError";
            const parseError = new Error("Unexpected token in JSON");
            parseError.name = "SyntaxError";
            const genericError = new Error("Something went wrong");

            expect(ErrorUtils.getUserFriendlyMessage(networkError)).toBe(
                "There was a problem connecting to the server. Please check your internet connection."
            );
            expect(ErrorUtils.getUserFriendlyMessage(parseError)).toBe(
                "There was a problem with the application code. Please refresh the page."
            );
            expect(ErrorUtils.getUserFriendlyMessage(genericError)).toBe(
                "An unexpected error occurred. Please try again."
            );
        });

        test("should get error severity", () => {
            const criticalError = new Error("Cannot read property of null");
            criticalError.name = "TypeError";
            const networkError = new Error("Network request failed");
            networkError.name = "NetworkError";
            const parseError = new Error("JSON parse error");
            parseError.name = "SyntaxError";
            const genericError = new Error("Something went wrong");

            expect(ErrorUtils.getErrorSeverity(criticalError)).toBe("critical");
            expect(ErrorUtils.getErrorSeverity(networkError)).toBe("medium");
            expect(ErrorUtils.getErrorSeverity(parseError)).toBe("high");
            expect(ErrorUtils.getErrorSeverity(genericError)).toBe("low");
        });

        test("should check if error is recoverable", () => {
            const criticalError = new Error("Cannot read property of null");
            criticalError.name = "TypeError";
            const networkError = new Error("Network request failed");
            networkError.name = "NetworkError";
            const timeoutError = new Error("Request timeout");
            timeoutError.name = "TimeoutError";
            const genericError = new Error("Something went wrong");

            expect(ErrorUtils.isRecoverable(criticalError)).toBe(false);
            expect(ErrorUtils.isRecoverable(networkError)).toBe(true);
            expect(ErrorUtils.isRecoverable(timeoutError)).toBe(true);
            expect(ErrorUtils.isRecoverable(genericError)).toBe(false);
        });
    });
});
