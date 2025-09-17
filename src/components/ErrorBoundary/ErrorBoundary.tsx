import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui";
import { CrashRecoveryManager, ErrorUtils } from "../../utils/errorRecovery";

import cn from "classnames";
import "./errorBoundary.css";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    className?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    level?: "critical" | "high" | "medium" | "low";
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
    isRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    private crashRecoveryManager = CrashRecoveryManager.getInstance();

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            isRecovering: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });

        // Generate and submit crash report
        const crashReport = this.crashRecoveryManager.generateCrashReport(error, errorInfo.componentStack || "", {
            level: this.props.level || "high",
            boundaryLocation: "ErrorBoundary",
        });
        this.crashRecoveryManager.submitCrashReport(crashReport);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: undefined,
            errorInfo: undefined,
            isRecovering: false,
        });
    };

    handleRecover = () => {
        this.setState({ isRecovering: true });

        // Attempt recovery after a short delay
        setTimeout(() => {
            this.crashRecoveryManager.setRecoveryMode(true);
            window.location.reload();
        }, 1000);
    };

    override render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const error = this.state.error;
            const errorSeverity = ErrorUtils.getErrorSeverity(error);
            const isRecoverable = ErrorUtils.isRecoverable(error);
            const userMessage = ErrorUtils.getUserFriendlyMessage(error);

            const errorBoundaryCn = cn("ErrorBoundary", this.props.className, {
                "ErrorBoundary--critical": errorSeverity === "critical",
                "ErrorBoundary--high": errorSeverity === "high",
                "ErrorBoundary--medium": errorSeverity === "medium",
                "ErrorBoundary--low": errorSeverity === "low",
                "ErrorBoundary--recovering": this.state.isRecovering,
            });

            return (
                <div className={errorBoundaryCn} role="alert" aria-live="assertive">
                    <div className="ErrorBoundary__content">
                        <div className="ErrorBoundary__icon">
                            {errorSeverity === "critical"
                                ? "💥"
                                : errorSeverity === "high"
                                ? "⚠️"
                                : errorSeverity === "medium"
                                ? "⚡"
                                : "ℹ️"}
                        </div>

                        <h2 className="ErrorBoundary__title">
                            {errorSeverity === "critical"
                                ? "Critical Error"
                                : errorSeverity === "high"
                                ? "Application Error"
                                : errorSeverity === "medium"
                                ? "Something Went Wrong"
                                : "Minor Issue"}
                        </h2>

                        <p className="ErrorBoundary__message">{userMessage}</p>

                        <div className="ErrorBoundary__actions">
                            {this.state.isRecovering ? (
                                <div className="ErrorBoundary__recovery">
                                    <div className="ErrorBoundary__spinner" aria-label="Recovering..."></div>
                                    <span>Attempting recovery...</span>
                                </div>
                            ) : (
                                <>
                                    <Button onClick={this.handleReset} variant="primary">
                                        Try Again
                                    </Button>

                                    {isRecoverable && (
                                        <Button
                                            onClick={this.handleRecover}
                                            variant="secondary"
                                            aria-label="Attempt recovery">
                                            Recover
                                        </Button>
                                    )}

                                    <Button
                                        onClick={() => window.location.reload()}
                                        variant="secondary"
                                        aria-label="Refresh the entire page">
                                        Refresh Page
                                    </Button>
                                </>
                            )}
                        </div>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="ErrorBoundary__details">
                                <summary>Error Details (Development Only)</summary>
                                <div className="ErrorBoundary__error-info">
                                    <p>
                                        <strong>Error:</strong> {ErrorUtils.formatError(this.state.error)}
                                    </p>
                                    <pre className="ErrorBoundary__error-text" aria-label="Error technical details">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
