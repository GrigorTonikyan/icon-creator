/**
 * Analytics and Telemetry System
 * Privacy-compliant analytics with performance monitoring and feature usage tracking
 */

export interface AnalyticsEvent {
    event: string;
    category: string;
    properties?: Record<string, any>;
    timestamp?: number;
    sessionId: string;
}

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: number;
    sessionId: string;
}

export interface ErrorReport {
    error: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: number;
    sessionId: string;
    userAgent: string;
}

export interface AnalyticsConfig {
    enabled: boolean;
    collectPerformance: boolean;
    collectErrors: boolean;
    collectUsage: boolean;
    privacyMode: boolean;
    sessionTimeout: number; // in minutes
    batchSize: number;
    flushInterval: number; // in milliseconds
}

export interface SessionInfo {
    id: string;
    startTime: number;
    lastActivity: number;
    events: number;
    performance: number;
    errors: number;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
    enabled: true,
    collectPerformance: true,
    collectErrors: true,
    collectUsage: true,
    privacyMode: false,
    sessionTimeout: 30,
    batchSize: 50,
    flushInterval: 10000,
};

/**
 * Analytics Manager - Central hub for all analytics operations
 * Handles event collection, performance monitoring, and error tracking
 */
class AnalyticsManager {
    private config: AnalyticsConfig;
    private session: SessionInfo;
    private events: AnalyticsEvent[] = [];
    private metrics: PerformanceMetric[] = [];
    private errors: ErrorReport[] = [];
    private flushTimer: NodeJS.Timeout | null = null;
    private observers: Map<string, PerformanceObserver> = new Map();

    constructor() {
        this.config = this.loadConfig();
        this.session = this.initializeSession();
        this.setupPerformanceObservers();
        this.setupErrorHandling();
        this.startFlushTimer();
    }

    /**
     * Initialize analytics system
     */
    initialize(): void {
        if (!this.config.enabled || typeof window === "undefined") {
            console.log("[Analytics] Analytics disabled or not in browser environment");
            return;
        }

        this.trackEvent("session_start", "system", {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
            viewport:
                typeof window !== "undefined"
                    ? {
                          width: window.innerWidth,
                          height: window.innerHeight,
                      }
                    : { width: 0, height: 0 },
            screen:
                typeof screen !== "undefined"
                    ? {
                          width: screen.width,
                          height: screen.height,
                      }
                    : { width: 0, height: 0 },
            timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "unknown",
            language: typeof navigator !== "undefined" ? navigator.language : "unknown",
        });

        console.log("[Analytics] Analytics system initialized");
    }

    /**
     * Track user events
     */
    trackEvent(event: string, category: string, properties?: Record<string, any>): void {
        if (!this.config.enabled || !this.config.collectUsage) return;

        const analyticsEvent: AnalyticsEvent = {
            event,
            category,
            properties: this.sanitizeProperties(properties),
            timestamp: Date.now(),
            sessionId: this.session.id,
        };

        this.events.push(analyticsEvent);
        this.session.events++;
        this.updateLastActivity();

        console.log("[Analytics] Event tracked:", event, category);
    }

    /**
     * Track performance metrics
     */
    trackPerformance(name: string, value: number, unit: string = "ms"): void {
        if (!this.config.enabled || !this.config.collectPerformance) return;

        const metric: PerformanceMetric = {
            name,
            value: Math.round(value * 100) / 100, // Round to 2 decimal places
            unit,
            timestamp: Date.now(),
            sessionId: this.session.id,
        };

        this.metrics.push(metric);
        this.session.performance++;
        this.updateLastActivity();

        console.log("[Analytics] Performance metric tracked:", name, value, unit);
    }

    /**
     * Track errors
     */
    trackError(error: Error | string, context?: Record<string, any>): void {
        if (!this.config.enabled || !this.config.collectErrors) return;

        const errorReport: ErrorReport = {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            context: this.sanitizeProperties(context),
            timestamp: Date.now(),
            sessionId: this.session.id,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        };

        this.errors.push(errorReport);
        this.session.errors++;
        this.updateLastActivity();

        console.log("[Analytics] Error tracked:", errorReport.error);
    }

    /**
     * Update analytics configuration
     */
    updateConfig(newConfig: Partial<AnalyticsConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();

        // Restart systems if needed
        if (newConfig.enabled !== undefined) {
            if (newConfig.enabled) {
                this.setupPerformanceObservers();
                this.startFlushTimer();
            } else {
                this.cleanup();
            }
        }

        console.log("[Analytics] Configuration updated");
    }

    /**
     * Get current analytics configuration
     */
    getConfig(): AnalyticsConfig {
        return { ...this.config };
    }

    /**
     * Get session information
     */
    getSession(): SessionInfo {
        return { ...this.session };
    }

    /**
     * Get analytics data summary
     */
    getAnalyticsSummary() {
        return {
            session: this.getSession(),
            events: this.events.length,
            metrics: this.metrics.length,
            errors: this.errors.length,
            config: this.getConfig(),
        };
    }

    /**
     * Export analytics data (for debugging/analysis)
     */
    exportData() {
        if (this.config.privacyMode) {
            return {
                session: this.session,
                events: this.events.map((e) => ({ ...e, properties: "[PRIVACY_MODE]" })),
                metrics: this.metrics,
                errors: this.errors.map((e) => ({ ...e, context: "[PRIVACY_MODE]", stack: "[PRIVACY_MODE]" })),
            };
        }

        return {
            session: this.session,
            events: this.events,
            metrics: this.metrics,
            errors: this.errors,
        };
    }

    /**
     * Clear all analytics data
     */
    clearData(): void {
        this.events = [];
        this.metrics = [];
        this.errors = [];
        this.session.events = 0;
        this.session.performance = 0;
        this.session.errors = 0;

        console.log("[Analytics] All analytics data cleared");
    }

    /**
     * Force flush data (for testing or immediate export)
     */
    flush(): void {
        this.processQueue();
    }

    /**
     * Cleanup analytics system
     */
    cleanup(): void {
        // Clean up performance observers
        this.observers.forEach((observer) => observer.disconnect());
        this.observers.clear();

        // Clear timers
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Track session end
        if (this.config.enabled) {
            this.trackEvent("session_end", "system", {
                duration: Date.now() - this.session.startTime,
                events: this.session.events,
                performance: this.session.performance,
                errors: this.session.errors,
            });
        }

        console.log("[Analytics] Cleanup completed");
    }

    // Private methods

    private loadConfig(): AnalyticsConfig {
        try {
            if (typeof localStorage !== "undefined") {
                const stored = localStorage.getItem("analytics_config");
                if (stored) {
                    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
                }
            }
        } catch (error) {
            console.warn("[Analytics] Failed to load config from localStorage:", error);
        }
        return { ...DEFAULT_CONFIG };
    }

    private saveConfig(): void {
        try {
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("analytics_config", JSON.stringify(this.config));
            }
        } catch (error) {
            console.warn("[Analytics] Failed to save config to localStorage:", error);
        }
    }
    private initializeSession(): SessionInfo {
        const sessionId = this.generateSessionId();
        const now = Date.now();

        return {
            id: sessionId,
            startTime: now,
            lastActivity: now,
            events: 0,
            performance: 0,
            errors: 0,
        };
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private updateLastActivity(): void {
        this.session.lastActivity = Date.now();
    }

    private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
        if (!properties) return undefined;
        if (this.config.privacyMode) return { "[PRIVACY_MODE]": true };

        // Remove potentially sensitive data
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(properties)) {
            if (this.isSafeProperty(key, value)) {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    private isSafeProperty(key: string, value: any): boolean {
        // Block sensitive keys
        const sensitiveKeys = ["password", "token", "secret", "key", "auth", "email", "phone"];
        if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
            return false;
        }

        // Block sensitive values (basic detection)
        if (typeof value === "string") {
            // Block email patterns
            if (value.includes("@") && value.includes(".")) {
                return false;
            }
            // Block long strings that might contain sensitive data
            if (value.length > 1000) {
                return false;
            }
        }

        return true;
    }

    private setupPerformanceObservers(): void {
        if (!this.config.enabled || !this.config.collectPerformance || typeof window === "undefined") return;

        try {
            // Navigation timing
            if ("performance" in window && "getEntriesByType" in performance) {
                const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
                if (navEntries.length > 0) {
                    const nav = navEntries[0];
                    if (nav) {
                        this.trackPerformance("page_load", nav.loadEventEnd - nav.loadEventStart);
                        this.trackPerformance(
                            "dom_content_loaded",
                            nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart
                        );
                        this.trackPerformance("first_paint", nav.loadEventEnd - nav.fetchStart);
                    }
                }
            }

            // Resource timing observer
            if ("PerformanceObserver" in window) {
                const resourceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === "resource") {
                            const resource = entry as PerformanceResourceTiming;
                            this.trackPerformance(`resource_${resource.initiatorType}`, resource.duration);
                        }
                    }
                });
                resourceObserver.observe({ entryTypes: ["resource"] });
                this.observers.set("resource", resourceObserver);

                // Measure observer for custom measurements
                const measureObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === "measure") {
                            this.trackPerformance(entry.name, entry.duration);
                        }
                    }
                });
                measureObserver.observe({ entryTypes: ["measure"] });
                this.observers.set("measure", measureObserver);
            }
        } catch (error) {
            console.warn("[Analytics] Failed to setup performance observers:", error);
        }
    }

    private setupErrorHandling(): void {
        if (!this.config.enabled || !this.config.collectErrors || typeof window === "undefined") return;

        // Global error handler
        window.addEventListener("error", (event) => {
            this.trackError(event.error || event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: "javascript_error",
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener("unhandledrejection", (event) => {
            this.trackError(event.reason, {
                type: "unhandled_promise_rejection",
            });
        });
    }

    private startFlushTimer(): void {
        if (!this.config.enabled || this.flushTimer) return;

        this.flushTimer = setInterval(() => {
            this.processQueue();
        }, this.config.flushInterval);
    }

    private processQueue(): void {
        const totalItems = this.events.length + this.metrics.length + this.errors.length;

        if (totalItems === 0) return;

        // In a real implementation, this would send data to an analytics service
        // For now, we'll just log the summary
        console.log("[Analytics] Processing queue:", {
            events: this.events.length,
            metrics: this.metrics.length,
            errors: this.errors.length,
            session: this.session.id,
        });

        // Simulate batch processing
        if (totalItems >= this.config.batchSize) {
            this.clearData();
        }
    }
}

// Analytics helper functions for common tracking patterns

/**
 * Track feature usage
 */
export function trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>): void {
    analytics.trackEvent(`${feature}_${action}`, "feature_usage", properties);
}

/**
 * Track user interaction
 */
export function trackUserInteraction(element: string, action: string, properties?: Record<string, any>): void {
    analytics.trackEvent(`${element}_${action}`, "user_interaction", properties);
}

/**
 * Track performance timing
 */
export function trackTiming(name: string, startTime: number, endTime?: number): void {
    const duration = (endTime || Date.now()) - startTime;
    analytics.trackPerformance(name, duration);
}

/**
 * Create a performance measurement wrapper
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
        const result = fn();
        const end = performance.now();
        analytics.trackPerformance(name, end - start);
        return result;
    } catch (error) {
        const end = performance.now();
        analytics.trackPerformance(name, end - start);
        analytics.trackError(error instanceof Error ? error : new Error(String(error)), { context: name });
        throw error;
    }
}

/**
 * Create an async performance measurement wrapper
 */
export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        const end = performance.now();
        analytics.trackPerformance(name, end - start);
        return result;
    } catch (error) {
        const end = performance.now();
        analytics.trackPerformance(name, end - start);
        analytics.trackError(error instanceof Error ? error : new Error(String(error)), { context: name });
        throw error;
    }
}

// Global analytics instance
export const analytics = new AnalyticsManager();

// Initialize analytics when module loads
if (typeof window !== "undefined") {
    // Defer initialization to allow other modules to load
    setTimeout(() => {
        analytics.initialize();
    }, 100);

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
        analytics.cleanup();
    });
}

export default analytics;
