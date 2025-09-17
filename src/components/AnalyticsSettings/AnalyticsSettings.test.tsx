import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { AnalyticsSettings } from "./AnalyticsSettings";
import { analytics } from "../../utils/analytics";

// Mock the analytics module
vi.mock("../../utils/analytics", () => {
    const mockAnalytics = {
        getConfig: vi.fn(() => ({
            enabled: true,
            collectPerformance: true,
            collectErrors: true,
            collectUsage: true,
            privacyMode: false,
            sessionTimeout: 30,
            batchSize: 50,
            flushInterval: 10000,
        })),
        getSession: vi.fn(() => ({
            id: "session_123",
            startTime: Date.now() - 300000, // 5 minutes ago
            lastActivity: Date.now() - 60000, // 1 minute ago
            events: 25,
            performance: 15,
            errors: 2,
        })),
        getAnalyticsSummary: vi.fn(() => ({
            session: {
                id: "session_123",
                startTime: Date.now() - 300000,
                lastActivity: Date.now() - 60000,
                events: 25,
                performance: 15,
                errors: 2,
            },
            events: 10,
            metrics: 8,
            errors: 1,
            config: {
                enabled: true,
                collectPerformance: true,
                collectErrors: true,
                collectUsage: true,
                privacyMode: false,
                sessionTimeout: 30,
                batchSize: 50,
                flushInterval: 10000,
            },
        })),
        updateConfig: vi.fn(),
        clearData: vi.fn(),
        exportData: vi.fn(() => ({
            session: { id: "session_123" },
            events: [],
            metrics: [],
            errors: [],
        })),
    };

    return {
        analytics: mockAnalytics,
    };
});

// Mock URL.createObjectURL and related APIs
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global.URL, "createObjectURL", {
    value: mockCreateObjectURL,
    writable: true,
});

Object.defineProperty(global.URL, "revokeObjectURL", {
    value: mockRevokeObjectURL,
    writable: true,
});

// Mock confirm dialog
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe("AnalyticsSettings", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfirm.mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Rendering", () => {
        test("should render the analytics settings component", () => {
            render(<AnalyticsSettings />);

            expect(screen.getByText("Analytics & Telemetry")).toBeInTheDocument();
            expect(screen.getByText("Expand")).toBeInTheDocument();
        });

        test("should apply custom className", () => {
            render(<AnalyticsSettings className="custom-class" />);

            const component = screen.getByText("Analytics & Telemetry").closest(".AnalyticsSettings");
            expect(component).toHaveClass("custom-class");
        });

        test("should expand and show content when expand button is clicked", async () => {
            render(<AnalyticsSettings />);

            const expandButton = screen.getByText("Expand");
            fireEvent.click(expandButton);

            await waitFor(() => {
                expect(screen.getByText("General Settings")).toBeInTheDocument();
                expect(screen.getByText("Data Collection")).toBeInTheDocument();
                expect(screen.getByText("Advanced Settings")).toBeInTheDocument();
                expect(screen.getByText("Current Session")).toBeInTheDocument();
                expect(screen.getByText("Data Management")).toBeInTheDocument();
                expect(screen.getByText("Privacy Information")).toBeInTheDocument();
            });

            expect(expandButton).toHaveTextContent("Collapse");
        });
    });

    describe("Configuration Controls", () => {
        beforeEach(async () => {
            render(<AnalyticsSettings />);
            fireEvent.click(screen.getByText("Expand"));
            await waitFor(() => {
                expect(screen.getByText("General Settings")).toBeInTheDocument();
            });
        });

        test("should toggle analytics enabled state", () => {
            const enabledCheckbox = screen.getByLabelText("Enable Analytics & Telemetry");

            expect(enabledCheckbox).toBeChecked();

            fireEvent.click(enabledCheckbox);

            expect(analytics.updateConfig).toHaveBeenCalledWith({ enabled: false });
        });

        test("should toggle privacy mode", () => {
            const privacyCheckbox = screen.getByLabelText("Privacy Mode");

            expect(privacyCheckbox).not.toBeChecked();

            fireEvent.click(privacyCheckbox);

            expect(analytics.updateConfig).toHaveBeenCalledWith({ privacyMode: true });
        });

        test("should toggle feature usage tracking", () => {
            const usageCheckbox = screen.getByLabelText("Feature Usage Tracking");

            expect(usageCheckbox).toBeChecked();

            fireEvent.click(usageCheckbox);

            expect(analytics.updateConfig).toHaveBeenCalledWith({ collectUsage: false });
        });

        test("should toggle performance monitoring", () => {
            const performanceCheckbox = screen.getByLabelText("Performance Monitoring");

            expect(performanceCheckbox).toBeChecked();

            fireEvent.click(performanceCheckbox);

            expect(analytics.updateConfig).toHaveBeenCalledWith({ collectPerformance: false });
        });

        test("should toggle error reporting", () => {
            const errorCheckbox = screen.getByLabelText("Error Reporting");

            expect(errorCheckbox).toBeChecked();

            fireEvent.click(errorCheckbox);

            expect(analytics.updateConfig).toHaveBeenCalledWith({ collectErrors: false });
        });
    });

    describe("Advanced Settings", () => {
        beforeEach(async () => {
            render(<AnalyticsSettings />);
            fireEvent.click(screen.getByText("Expand"));
            await waitFor(() => {
                expect(screen.getByText("Advanced Settings")).toBeInTheDocument();
            });
        });

        test("should update session timeout", () => {
            const timeoutInput = screen.getByDisplayValue("30");

            fireEvent.change(timeoutInput, { target: { value: "60" } });

            expect(analytics.updateConfig).toHaveBeenCalledWith({ sessionTimeout: 60 });
        });

        test("should update batch size", () => {
            const batchSizeInput = screen.getByDisplayValue("50");

            fireEvent.change(batchSizeInput, { target: { value: "100" } });

            expect(analytics.updateConfig).toHaveBeenCalledWith({ batchSize: 100 });
        });

        test("should update flush interval", () => {
            const flushIntervalInput = screen.getByDisplayValue("10");

            fireEvent.change(flushIntervalInput, { target: { value: "15" } });

            expect(analytics.updateConfig).toHaveBeenCalledWith({ flushInterval: 15000 });
        });
    });

    describe("Session Information", () => {
        beforeEach(async () => {
            render(<AnalyticsSettings />);
            fireEvent.click(screen.getByText("Expand"));
            await waitFor(() => {
                expect(screen.getByText("Current Session")).toBeInTheDocument();
            });
        });

        test("should display session information", () => {
            expect(screen.getByText("session_123")).toBeInTheDocument();
            expect(screen.getByText(/\d+m \d+s/)).toBeInTheDocument(); // Duration format
            expect(screen.getByText("10")).toBeInTheDocument(); // Events count
            expect(screen.getByText("8")).toBeInTheDocument(); // Metrics count
            expect(screen.getByText("1")).toBeInTheDocument(); // Errors count
        });
    });

    describe("Data Management", () => {
        beforeEach(async () => {
            render(<AnalyticsSettings />);
            fireEvent.click(screen.getByText("Expand"));
            await waitFor(() => {
                expect(screen.getByText("Data Management")).toBeInTheDocument();
            });
        });

        test("should export analytics data", () => {
            const exportButton = screen.getByText("Export Data");

            // Mock DOM methods for download
            const mockLink = {
                href: "",
                download: "",
                click: vi.fn(),
            };

            const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
            const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
            const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

            fireEvent.click(exportButton);

            expect(analytics.exportData).toHaveBeenCalled();
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(createElementSpy).toHaveBeenCalledWith("a");
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockRevokeObjectURL).toHaveBeenCalled();

            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });

        test("should clear analytics data with confirmation", () => {
            const clearButton = screen.getByText("Clear All Data");

            fireEvent.click(clearButton);

            expect(global.confirm).toHaveBeenCalledWith(
                "Are you sure you want to clear all analytics data? This action cannot be undone."
            );
            expect(analytics.clearData).toHaveBeenCalled();
        });

        test("should not clear analytics data when confirmation is declined", () => {
            mockConfirm.mockReturnValue(false);

            const clearButton = screen.getByText("Clear All Data");

            fireEvent.click(clearButton);

            expect(global.confirm).toHaveBeenCalled();
            expect(analytics.clearData).not.toHaveBeenCalled();
        });
    });

    describe("Disabled State", () => {
        test("should disable controls when analytics is disabled", async () => {
            // Mock analytics as disabled
            vi.mocked(analytics.getConfig).mockReturnValue({
                enabled: false,
                collectPerformance: true,
                collectErrors: true,
                collectUsage: true,
                privacyMode: false,
                sessionTimeout: 30,
                batchSize: 50,
                flushInterval: 10000,
            });

            render(<AnalyticsSettings />);
            fireEvent.click(screen.getByText("Expand"));

            await waitFor(() => {
                expect(screen.getByText("General Settings")).toBeInTheDocument();
            });

            // Check that dependent controls are disabled
            expect(screen.getByLabelText("Privacy Mode")).toBeDisabled();
            expect(screen.getByLabelText("Feature Usage Tracking")).toBeDisabled();
            expect(screen.getByLabelText("Performance Monitoring")).toBeDisabled();
            expect(screen.getByLabelText("Error Reporting")).toBeDisabled();
            expect(screen.getByDisplayValue("30")).toBeDisabled(); // Session timeout
            expect(screen.getByDisplayValue("50")).toBeDisabled(); // Batch size
            expect(screen.getByDisplayValue("10")).toBeDisabled(); // Flush interval
            expect(screen.getByText("Export Data")).toBeDisabled();
            expect(screen.getByText("Clear All Data")).toBeDisabled();
        });
    });

    describe("Accessibility", () => {
        test("should have proper ARIA attributes", () => {
            render(<AnalyticsSettings />);

            const expandButton = screen.getByText("Expand");
            expect(expandButton).toHaveAttribute("aria-expanded", "false");
            expect(expandButton).toHaveAttribute("aria-controls", "analytics-settings-content");

            fireEvent.click(expandButton);

            expect(expandButton).toHaveAttribute("aria-expanded", "true");

            const content = screen.getByRole("generic", { hidden: true });
            expect(content).toHaveAttribute("id", "analytics-settings-content");
        });

        test("should have proper labels for form controls", async () => {
            render(<AnalyticsSettings />);
            fireEvent.click(screen.getByText("Expand"));

            await waitFor(() => {
                expect(screen.getByLabelText("Enable Analytics & Telemetry")).toBeInTheDocument();
                expect(screen.getByLabelText("Privacy Mode")).toBeInTheDocument();
                expect(screen.getByLabelText("Feature Usage Tracking")).toBeInTheDocument();
                expect(screen.getByLabelText("Performance Monitoring")).toBeInTheDocument();
                expect(screen.getByLabelText("Error Reporting")).toBeInTheDocument();
            });
        });
    });
});
