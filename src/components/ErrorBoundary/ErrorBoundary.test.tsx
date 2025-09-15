import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error("Test error");
    }
    return <div>No error</div>;
};

describe("ErrorBoundary", () => {
    test("should render children when no error occurs", () => {
        render(
            <ErrorBoundary>
                <div>Test content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    test("should render error UI when error occurs", () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /refresh the entire page/i })).toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    test("should render custom fallback when provided", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const customFallback = <div>Custom error message</div>;

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Custom error message")).toBeInTheDocument();
        expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

        consoleSpy.mockRestore();
    });

    test("should provide try again and refresh buttons", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Error state should be visible
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();

        // Buttons should be present
        const tryAgainButton = screen.getByRole("button", { name: /try again/i });
        const refreshButton = screen.getByRole("button", { name: /refresh the entire page/i });

        expect(tryAgainButton).toBeInTheDocument();
        expect(refreshButton).toBeInTheDocument();

        // Try again button should be clickable
        await userEvent.click(tryAgainButton);
        // The click itself doesn't throw an error, which means the handler works

        consoleSpy.mockRestore();
    });

    test("should apply custom className", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const { container } = render(
            <ErrorBoundary className="custom-error">
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(container.firstChild).toHaveClass("ErrorBoundary", "custom-error");

        consoleSpy.mockRestore();
    });

    test("should show error details in development", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Error Details (Development Only)")).toBeInTheDocument();

        process.env.NODE_ENV = originalNodeEnv;
        consoleSpy.mockRestore();
    });
});
