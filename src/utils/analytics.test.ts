/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Set up mocks before importing analytics
const mockConsole = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

global.console = { ...console, ...mockConsole };

// Import after setting up mocks
import { analytics, trackFeatureUsage, trackUserInteraction, trackTiming, measurePerformance } from "./analytics";

describe("Analytics System", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset analytics state
        analytics.clearData();
        analytics.updateConfig({
            enabled: true,
            collectPerformance: true,
            collectErrors: true,
            collectUsage: true,
            privacyMode: false,
            sessionTimeout: 30,
            batchSize: 50,
            flushInterval: 10000,
        });
    });

    afterEach(() => {
        analytics.cleanup();
    });

    describe("Configuration", () => {
        test("should load default configuration", () => {
            const config = analytics.getConfig();

            expect(config.enabled).toBe(true);
            expect(config.collectPerformance).toBe(true);
            expect(config.collectErrors).toBe(true);
            expect(config.collectUsage).toBe(true);
            expect(config.privacyMode).toBe(false);
            expect(config.sessionTimeout).toBe(30);
            expect(config.batchSize).toBe(50);
            expect(config.flushInterval).toBe(10000);
        });

        test("should update configuration", () => {
            analytics.updateConfig({
                enabled: false,
                privacyMode: true,
                sessionTimeout: 60,
            });

            const config = analytics.getConfig();
            expect(config.enabled).toBe(false);
            expect(config.privacyMode).toBe(true);
            expect(config.sessionTimeout).toBe(60);
            expect(config.collectPerformance).toBe(true); // Should remain unchanged
        });
    });

    describe("Event Tracking", () => {
        test("should track events when enabled", () => {
            analytics.trackEvent("test_event", "test_category", { key: "value" });

            const summary = analytics.getAnalyticsSummary();
            expect(summary.events).toBe(1);
        });

        test("should not track events when disabled", () => {
            analytics.updateConfig({ enabled: false });
            analytics.trackEvent("test_event", "test_category");

            const summary = analytics.getAnalyticsSummary();
            expect(summary.events).toBe(0);
        });

        test("should not track events when usage collection is disabled", () => {
            analytics.updateConfig({ collectUsage: false });
            analytics.trackEvent("test_event", "test_category");

            const summary = analytics.getAnalyticsSummary();
            expect(summary.events).toBe(0);
        });

        test("should sanitize properties in privacy mode", () => {
            analytics.updateConfig({ privacyMode: true });
            analytics.trackEvent("test_event", "test_category", {
                password: "secret",
                normal: "value",
            });

            const data = analytics.exportData();
            const event = data.events[0];
            expect(event.properties).toBe("[PRIVACY_MODE]");
        });
    });

    describe("Performance Tracking", () => {
        test("should track performance metrics when enabled", () => {
            analytics.trackPerformance("test_metric", 100, "ms");

            const summary = analytics.getAnalyticsSummary();
            expect(summary.metrics).toBe(1);
        });

        test("should not track performance when disabled", () => {
            analytics.updateConfig({ collectPerformance: false });
            analytics.trackPerformance("test_metric", 100);

            const summary = analytics.getAnalyticsSummary();
            expect(summary.metrics).toBe(0);
        });

        test("should round performance values", () => {
            analytics.trackPerformance("test_metric", 123.456789);

            const data = analytics.exportData();
            const metric = data.metrics[0];
            expect(metric.value).toBe(123.46);
        });
    });

    describe("Error Tracking", () => {
        test("should track errors when enabled", () => {
            const error = new Error("Test error");
            analytics.trackError(error, { context: "test" });

            const summary = analytics.getAnalyticsSummary();
            expect(summary.errors).toBe(1);
        });

        test("should track string errors", () => {
            analytics.trackError("String error", { context: "test" });

            const data = analytics.exportData();
            const error = data.errors[0];
            expect(error.error).toBe("String error");
            expect(error.stack).toBeUndefined();
        });

        test("should not track errors when disabled", () => {
            analytics.updateConfig({ collectErrors: false });
            analytics.trackError(new Error("Test error"));

            const summary = analytics.getAnalyticsSummary();
            expect(summary.errors).toBe(0);
        });
    });

    describe("Session Management", () => {
        test("should create session with valid ID", () => {
            const session = analytics.getSession();

            expect(session.id).toMatch(/^session_\d+_[a-z0-9]{9}$/);
            expect(session.startTime).toBeGreaterThan(0);
            expect(session.lastActivity).toBeGreaterThan(0);
            expect(session.events).toBe(0);
            expect(session.performance).toBe(0);
            expect(session.errors).toBe(0);
        });

        test("should update last activity on events", () => {
            const initialSession = analytics.getSession();
            const initialActivity = initialSession.lastActivity;

            // Wait a bit to ensure timestamp difference
            setTimeout(() => {
                analytics.trackEvent("test", "test");

                const updatedSession = analytics.getSession();
                expect(updatedSession.lastActivity).toBeGreaterThan(initialActivity);
            }, 100);
        });
    });

    describe("Data Management", () => {
        test("should export data correctly", () => {
            analytics.trackEvent("test_event", "test");
            analytics.trackPerformance("test_metric", 100);
            analytics.trackError("test_error");

            const data = analytics.exportData();

            expect(data.events).toHaveLength(1);
            expect(data.metrics).toHaveLength(1);
            expect(data.errors).toHaveLength(1);
            expect(data.session).toBeDefined();
        });

        test("should clear data correctly", () => {
            analytics.trackEvent("test_event", "test");
            analytics.trackPerformance("test_metric", 100);
            analytics.trackError("test_error");

            analytics.clearData();

            const summary = analytics.getAnalyticsSummary();
            expect(summary.events).toBe(0);
            expect(summary.metrics).toBe(0);
            expect(summary.errors).toBe(0);
        });

        test("should sanitize sensitive data", () => {
            const sensitiveData = {
                password: "secret123",
                email: "user@example.com",
                apiKey: "key_123",
                normalData: "safe",
            };

            analytics.trackEvent("test", "test", sensitiveData);

            const data = analytics.exportData();
            const event = data.events[0];

            expect(event.properties).toEqual({ normalData: "safe" });
        });
    });

    describe("Helper Functions", () => {
        test("trackFeatureUsage should track with correct category", () => {
            trackFeatureUsage("editor", "save", { fileType: "svg" });

            const data = analytics.exportData();
            const event = data.events[0];

            expect(event.event).toBe("editor_save");
            expect(event.category).toBe("feature_usage");
            expect(event.properties).toEqual({ fileType: "svg" });
        });

        test("trackUserInteraction should track with correct category", () => {
            trackUserInteraction("button", "click", { id: "save-btn" });

            const data = analytics.exportData();
            const event = data.events[0];

            expect(event.event).toBe("button_click");
            expect(event.category).toBe("user_interaction");
            expect(event.properties).toEqual({ id: "save-btn" });
        });

        test("trackTiming should calculate duration correctly", () => {
            const startTime = Date.now() - 1000; // 1 second ago
            trackTiming("operation", startTime);

            const data = analytics.exportData();
            const metric = data.metrics[0];

            expect(metric.name).toBe("operation");
            expect(metric.value).toBeGreaterThan(900); // Should be around 1000ms
            expect(metric.unit).toBe("ms");
        });

        test("measurePerformance should track timing and return result", () => {
            const testFunction = vi.fn(() => "result");

            const result = measurePerformance("test_operation", testFunction);

            expect(result).toBe("result");
            expect(testFunction).toHaveBeenCalled();

            const data = analytics.exportData();
            const metric = data.metrics[0];
            expect(metric.name).toBe("test_operation");
        });

        test("measurePerformance should track errors and re-throw", () => {
            const errorFunction = () => {
                throw new Error("Test error");
            };

            expect(() => measurePerformance("error_operation", errorFunction)).toThrow("Test error");

            const data = analytics.exportData();
            expect(data.metrics).toHaveLength(1); // Performance metric
            expect(data.errors).toHaveLength(1); // Error tracked
        });
    });

    describe("Privacy Protection", () => {
        test("should block sensitive property names", () => {
            const sensitiveProps = {
                password: "secret",
                userPassword: "secret",
                apiKey: "key123",
                authToken: "token123",
                email: "test@example.com",
                phoneNumber: "1234567890",
                secretValue: "secret",
            };

            analytics.trackEvent("test", "test", sensitiveProps);

            const data = analytics.exportData();
            const event = data.events[0];

            expect(event.properties).toEqual({});
        });

        test("should block email-like strings", () => {
            analytics.trackEvent("test", "test", {
                userInput: "user@example.com",
                safeValue: "not_email",
            });

            const data = analytics.exportData();
            const event = data.events[0];

            expect(event.properties).toEqual({ safeValue: "not_email" });
        });

        test("should block very long strings", () => {
            const longString = "a".repeat(2000);

            analytics.trackEvent("test", "test", {
                longData: longString,
                shortData: "short",
            });

            const data = analytics.exportData();
            const event = data.events[0];

            expect(event.properties).toEqual({ shortData: "short" });
        });
    });
});
