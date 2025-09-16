import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import { HistoryPanel } from "./HistoryPanel";

describe("HistoryPanel", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <EditorProvider>{children}</EditorProvider>;

    test("should render empty state initially", () => {
        render(<HistoryPanel />, { wrapper });

        expect(screen.getByText("History")).toBeInTheDocument();
        expect(screen.getByText("No history yet")).toBeInTheDocument();
        expect(screen.getByText("Actions will appear here as you edit")).toBeInTheDocument();
    });

    test("should show undo/redo buttons", () => {
        render(<HistoryPanel />, { wrapper });

        const undoButton = screen.getByLabelText(/undo last action/i);
        const redoButton = screen.getByLabelText(/redo last undone action/i);
        const clearButton = screen.getByLabelText(/clear history/i);

        expect(undoButton).toBeInTheDocument();
        expect(redoButton).toBeInTheDocument();
        expect(clearButton).toBeInTheDocument();

        // Buttons should be disabled initially
        expect(undoButton).toBeDisabled();
        expect(redoButton).toBeDisabled();
        expect(clearButton).toBeDisabled();
    });

    test("should have proper accessibility attributes", () => {
        render(<HistoryPanel />, { wrapper });

        const title = screen.getByRole("heading", { name: "History" });
        expect(title).toBeInTheDocument();

        const undoButton = screen.getByRole("button", { name: /undo last action/i });
        const redoButton = screen.getByRole("button", { name: /redo last undone action/i });
        const clearButton = screen.getByRole("button", { name: /clear history/i });

        expect(undoButton).toHaveAttribute("aria-label");
        expect(redoButton).toHaveAttribute("aria-label");
        expect(clearButton).toHaveAttribute("aria-label");
    });

    test("should apply custom className", () => {
        const { container } = render(<HistoryPanel className="custom-class" />, { wrapper });

        const historyPanel = container.firstChild as HTMLElement;
        expect(historyPanel).toHaveClass("history-panel", "custom-class");
    });

    test("should render with proper CSS structure", () => {
        const { container } = render(<HistoryPanel />, { wrapper });

        expect(container.querySelector(".history-panel")).toBeInTheDocument();
        expect(container.querySelector(".history-panel__header")).toBeInTheDocument();
        expect(container.querySelector(".history-panel__content")).toBeInTheDocument();
        expect(container.querySelector(".history-panel__actions")).toBeInTheDocument();
        expect(container.querySelector(".history-panel__empty")).toBeInTheDocument();
    });
});
