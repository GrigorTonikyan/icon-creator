import React, { createContext, useContext, useEffect, useRef, Fragment } from "react";
import { CrashRecoveryManager, AutoSaveManager } from "../../utils/errorRecovery";
import { ErrorBoundary } from "../ErrorBoundary";

interface ErrorRecoveryContextType {
    crashRecovery: CrashRecoveryManager;
    autoSave: AutoSaveManager;
    reportError: (error: Error, context?: string) => void;
}

const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | null>(null);

interface ErrorRecoveryProviderProps {
    children: React.ReactNode;
    autoSaveInterval?: number;
}

/**
 * ErrorRecoveryProvider Component
 *
 * Provides application-wide error recovery capabilities including:
 * - Crash detection and recovery
 * - Automatic state persistence
 * - Error reporting and tracking
 * - Integration with ErrorBoundary for UI error handling
 *
 * Features:
 * - Configurable auto-save intervals
 * - Crash report generation and submission
 * - State persistence across sessions
 * - Graceful error handling with recovery options
 */
export function ErrorRecoveryProvider({
    children,
    autoSaveInterval = 30000, // 30 seconds default
}: ErrorRecoveryProviderProps) {
    const crashRecoveryRef = useRef<CrashRecoveryManager | null>(null);
    const autoSaveRef = useRef<AutoSaveManager | null>(null);

    // Initialize error recovery systems
    useEffect(() => {
        // Initialize crash recovery manager
        crashRecoveryRef.current = CrashRecoveryManager.getInstance();

        // Initialize auto-save manager
        autoSaveRef.current = AutoSaveManager.getInstance();
        autoSaveRef.current.configure({ interval: autoSaveInterval });
        autoSaveRef.current.start();

        // Set up global error handlers
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = new Error(event.reason?.toString() || "Unhandled promise rejection");
            const errorInfo = `Promise rejection at: ${event.reason}`;
            const report = crashRecoveryRef.current?.generateCrashReport(error, errorInfo, {
                type: "promise-rejection",
                reason: event.reason,
            });
            if (report) {
                crashRecoveryRef.current?.submitCrashReport(report);
            }
        };

        const handleError = (event: ErrorEvent) => {
            const error = new Error(event.message);
            error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
            const errorInfo = `Global error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
            const report = crashRecoveryRef.current?.generateCrashReport(error, errorInfo, {
                type: "global-error",
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
            if (report) {
                crashRecoveryRef.current?.submitCrashReport(report);
            }
        };

        // Register global error handlers
        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        window.addEventListener("error", handleError);

        // Cleanup function
        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
            window.removeEventListener("error", handleError);
            autoSaveRef.current?.stop();
        };
    }, [autoSaveInterval]);

    // Report error function for manual error reporting
    const reportError = (error: Error, context?: string) => {
        const errorInfo = context || "Manual error report";
        const report = crashRecoveryRef.current?.generateCrashReport(error, errorInfo, {
            type: "manual-report",
            context,
        });
        if (report) {
            crashRecoveryRef.current?.submitCrashReport(report);
        }
    };

    // Context value
    const contextValue: ErrorRecoveryContextType = {
        crashRecovery: crashRecoveryRef.current!,
        autoSave: autoSaveRef.current!,
        reportError,
    };

    return (
        <ErrorRecoveryContext.Provider value={contextValue}>
            <ErrorBoundary>
                <Fragment>{children}</Fragment>
            </ErrorBoundary>
        </ErrorRecoveryContext.Provider>
    );
}

/**
 * Hook to access error recovery functionality
 *
 * @returns Error recovery context with crash recovery, auto-save, and error reporting
 */
export function useErrorRecovery(): ErrorRecoveryContextType {
    const context = useContext(ErrorRecoveryContext);
    if (!context) {
        throw new Error("useErrorRecovery must be used within an ErrorRecoveryProvider");
    }
    return context;
}
