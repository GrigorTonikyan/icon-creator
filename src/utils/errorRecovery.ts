/**
 * Error Recovery utilities for handling crashes and recovery
 */

export interface CrashReport {
    error: Error;
    errorInfo: string;
    timestamp: number;
    userAgent: string;
    url: string;
    userId?: string;
    projectId?: string;
    additionalData?: Record<string, any>;
}

export interface RecoveryState {
    lastSaved: number;
    projectData: string;
    viewport: Record<string, any>;
    selection: string[];
    tool: string;
}

export interface AutoSaveConfig {
    enabled: boolean;
    interval: number; // in milliseconds
    maxRetries: number;
    storageKey: string;
}

/**
 * Manages crash detection and recovery functionality
 */
export class CrashRecoveryManager {
    private static instance: CrashRecoveryManager;
    private recoveryStates: Map<string, RecoveryState> = new Map();
    private isRecovering = false;

    static getInstance(): CrashRecoveryManager {
        if (!CrashRecoveryManager.instance) {
            CrashRecoveryManager.instance = new CrashRecoveryManager();
        }
        return CrashRecoveryManager.instance;
    }

    /**
     * Save current state for recovery purposes
     */
    saveRecoveryState(projectId: string, state: Partial<RecoveryState>): void {
        try {
            const currentState = this.recoveryStates.get(projectId) || {
                lastSaved: Date.now(),
                projectData: "",
                viewport: {},
                selection: [],
                tool: "select",
            };

            const newState: RecoveryState = {
                ...currentState,
                ...state,
                lastSaved: Date.now(),
            };

            this.recoveryStates.set(projectId, newState);

            // Also save to localStorage for persistence
            localStorage.setItem(`recovery_${projectId}`, JSON.stringify(newState));
        } catch (error) {
            console.error("Failed to save recovery state:", error);
        }
    }

    /**
     * Check if recovery state exists for a project
     */
    hasRecoveryState(projectId: string): boolean {
        return this.recoveryStates.has(projectId) || localStorage.getItem(`recovery_${projectId}`) !== null;
    }

    /**
     * Get recovery state for a project
     */
    getRecoveryState(projectId: string): RecoveryState | null {
        try {
            // Check memory first
            let state = this.recoveryStates.get(projectId);

            // If not in memory, check localStorage
            if (!state) {
                const saved = localStorage.getItem(`recovery_${projectId}`);
                if (saved) {
                    state = JSON.parse(saved) as RecoveryState;
                    if (state) {
                        this.recoveryStates.set(projectId, state);
                    }
                }
            }

            return state || null;
        } catch (error) {
            console.error("Failed to get recovery state:", error);
            return null;
        }
    }

    /**
     * Clear recovery state after successful recovery
     */
    clearRecoveryState(projectId: string): void {
        this.recoveryStates.delete(projectId);
        localStorage.removeItem(`recovery_${projectId}`);
    }

    /**
     * Check if currently in recovery mode
     */
    isInRecoveryMode(): boolean {
        return this.isRecovering;
    }

    /**
     * Set recovery mode
     */
    setRecoveryMode(recovering: boolean): void {
        this.isRecovering = recovering;
    }

    /**
     * Generate crash report
     */
    generateCrashReport(error: Error, errorInfo: string, additionalData?: Record<string, any>): CrashReport {
        return {
            error,
            errorInfo,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            additionalData,
        };
    }

    /**
     * Submit crash report (placeholder for actual reporting service)
     */
    submitCrashReport(report: CrashReport): void {
        try {
            // In a real app, this would send to a crash reporting service
            console.error("Crash Report:", report);

            // Save to localStorage for debugging
            const reports = JSON.parse(localStorage.getItem("crash_reports") || "[]");
            reports.push(report);
            // Keep only last 10 reports
            if (reports.length > 10) {
                reports.splice(0, reports.length - 10);
            }
            localStorage.setItem("crash_reports", JSON.stringify(reports));
        } catch (error) {
            console.error("Failed to submit crash report:", error);
        }
    }
}

/**
 * Manages automatic saving functionality
 */
export class AutoSaveManager {
    private static instance: AutoSaveManager;
    private config: AutoSaveConfig = {
        enabled: true,
        interval: 30000, // 30 seconds
        maxRetries: 3,
        storageKey: "autosave_data",
    };
    private saveTimeoutId: NodeJS.Timeout | null = null;
    private lastSaveTime = 0;
    private saveInProgress = false;
    private saveCallback?: (data: any) => Promise<void>;

    static getInstance(): AutoSaveManager {
        if (!AutoSaveManager.instance) {
            AutoSaveManager.instance = new AutoSaveManager();
        }
        return AutoSaveManager.instance;
    }

    /**
     * Configure auto-save settings
     */
    configure(config: Partial<AutoSaveConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Set the save callback function
     */
    setSaveCallback(callback: (data: any) => Promise<void>): void {
        this.saveCallback = callback;
    }

    /**
     * Start auto-save timer
     */
    start(): void {
        if (!this.config.enabled) return;

        this.stop(); // Clear any existing timer
        this.saveTimeoutId = setTimeout(() => {
            this.performAutoSave();
        }, this.config.interval);
    }

    /**
     * Stop auto-save timer
     */
    stop(): void {
        if (this.saveTimeoutId) {
            clearTimeout(this.saveTimeoutId);
            this.saveTimeoutId = null;
        }
    }

    /**
     * Trigger immediate save
     */
    async triggerSave(data: any): Promise<boolean> {
        if (this.saveInProgress) {
            return false;
        }

        try {
            this.saveInProgress = true;

            if (this.saveCallback) {
                await this.saveCallback(data);
            } else {
                // Fallback to localStorage
                localStorage.setItem(
                    this.config.storageKey,
                    JSON.stringify({
                        data,
                        timestamp: Date.now(),
                    })
                );
            }

            this.lastSaveTime = Date.now();
            return true;
        } catch (error) {
            console.error("Auto-save failed:", error);
            return false;
        } finally {
            this.saveInProgress = false;
        }
    }

    /**
     * Get last saved data
     */
    getLastSavedData(): any {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error("Failed to get last saved data:", error);
            return null;
        }
    }

    /**
     * Get time since last save
     */
    getTimeSinceLastSave(): number {
        return Date.now() - this.lastSaveTime;
    }

    /**
     * Check if auto-save is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Perform auto-save operation
     */
    private async performAutoSave(): Promise<void> {
        // This would typically get current app state and save it
        // For now, we'll just restart the timer
        this.start();
    }
}

/**
 * Utility functions for error handling
 */
export const ErrorUtils = {
    /**
     * Format error for display
     */
    formatError(error: Error): string {
        return `${error.name}: ${error.message}`;
    },

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error: Error): string {
        // Map technical errors to user-friendly messages
        const errorMessages: Record<string, string> = {
            NetworkError: "There was a problem connecting to the server. Please check your internet connection.",
            TypeError: "Something went wrong with the application. Please try refreshing the page.",
            ReferenceError: "A required component is missing. Please refresh the page.",
            SyntaxError: "There was a problem with the application code. Please refresh the page.",
            QuotaExceededError: "Storage space is full. Please clear some space and try again.",
            SecurityError: "Access was denied due to security restrictions.",
        };

        return errorMessages[error.name] || "An unexpected error occurred. Please try again.";
    },

    /**
     * Check if error is recoverable
     */
    isRecoverable(error: Error): boolean {
        const recoverableErrors = ["NetworkError", "TimeoutError", "QuotaExceededError"];

        return recoverableErrors.includes(error.name);
    },

    /**
     * Get error severity level
     */
    getErrorSeverity(error: Error): "low" | "medium" | "high" | "critical" {
        const criticalErrors = ["ReferenceError", "TypeError"];
        const highErrors = ["SecurityError", "SyntaxError"];
        const mediumErrors = ["NetworkError", "TimeoutError"];

        if (criticalErrors.includes(error.name)) return "critical";
        if (highErrors.includes(error.name)) return "high";
        if (mediumErrors.includes(error.name)) return "medium";
        return "low";
    },
};
