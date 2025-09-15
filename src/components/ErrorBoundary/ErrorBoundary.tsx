import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui";

import cn from "classnames";
import "./errorBoundary.css";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    className?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const errorBoundaryCn = cn("ErrorBoundary", this.props.className);

            return (
                <div className={errorBoundaryCn} role="alert" aria-live="assertive">
                    <div className="ErrorBoundary__content">
                        <h2 className="ErrorBoundary__title">Something went wrong</h2>
                        <p className="ErrorBoundary__message">
                            An unexpected error occurred. Please try refreshing the page or contact support if the
                            problem persists.
                        </p>

                        <div className="ErrorBoundary__actions">
                            <Button onClick={this.handleReset} variant="primary">
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="secondary"
                                aria-label="Refresh the entire page">
                                Refresh Page
                            </Button>
                        </div>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="ErrorBoundary__details">
                                <summary>Error Details (Development Only)</summary>
                                <pre className="ErrorBoundary__error-text" aria-label="Error technical details">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
