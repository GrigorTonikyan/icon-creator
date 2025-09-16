import cn from "classnames";
import { useEditor } from "../../contexts/EditorContext";
import type { HistoryEntry } from "../../types/editor";
import { Button } from "../ui/Button/Button";
import { Icon } from "../ui/Icon/Icon";
import "./historyPanel.css";

export interface HistoryPanelProps {
    className?: string;
}

/**
 * HistoryPanel Component
 *
 * Displays the action history in chronological order with:
 * - User-friendly action descriptions
 * - Timestamps for each action
 * - Undo/Redo buttons
 * - History navigation (click to revert to specific point)
 * - Clear history option
 */
export function HistoryPanel({ className }: HistoryPanelProps) {
    const { state, undo, redo, clearHistory } = useEditor();
    const { history, canUndo, canRedo } = state;

    // Combine undo and redo stacks to show complete history
    // Undo stack is in reverse chronological order (newest first in stack)
    // Redo stack is in chronological order
    const allHistory = [
        ...history.undoStack.slice().reverse(), // Reverse to show oldest first
        ...history.redoStack,
    ].sort((a, b) => a.timestamp - b.timestamp);

    // Current position in history (number of undo steps from present)
    const currentPosition = history.undoStack.length;

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffMinutes < 1) return "Just now";
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const getHistoryItemIcon = (entry: HistoryEntry) => {
        const actionType = entry.action.type;

        switch (actionType) {
            case "ADD_OBJECT":
                return "plus";
            case "DELETE_OBJECT":
                return "trash";
            case "UPDATE_OBJECT":
                return "edit";
            case "ADD_LAYER":
                return "plus";
            case "DELETE_LAYER":
                return "minus";
            case "UPDATE_LAYER":
                return "edit";
            case "RENAME_LAYER":
                return "edit";
            case "GROUP_LAYERS":
                return "folder";
            case "UNGROUP_LAYER":
                return "folder";
            case "MOVE_LAYERS":
                return "move";
            case "DUPLICATE_LAYERS":
                return "copy";
            case "PATH_OPERATION":
                return "scissors";
            case "REORDER_LAYERS":
                return "move";
            case "TOGGLE_LAYER_VISIBILITY":
                return "eye";
            case "TOGGLE_LAYER_LOCK":
                return "lock";
            default:
                return "activity";
        }
    };
    const handleHistoryItemClick = (targetIndex: number) => {
        const currentIndex = allHistory.length - history.redoStack.length - 1;
        const stepsToMove = currentIndex - targetIndex;

        // Perform multiple undo/redo operations to reach target state
        for (let i = 0; i < Math.abs(stepsToMove); i++) {
            if (stepsToMove > 0) {
                undo();
            } else {
                redo();
            }
        }
    };

    const historyPanelClass = cn("history-panel", className);

    return (
        <div className={historyPanelClass}>
            <div className="history-panel__header">
                <h3 className="history-panel__title">History</h3>
                <div className="history-panel__actions">
                    {/* Undo button */}
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canUndo}
                        onClick={undo}
                        aria-label="Undo last action (Ctrl+Z)">
                        <Icon name="undo" />
                    </Button>

                    {/* Redo button */}
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canRedo}
                        onClick={redo}
                        aria-label="Redo last undone action (Ctrl+Y)">
                        <Icon name="redo" />
                    </Button>

                    {/* Clear history button */}
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={history.undoStack.length === 0}
                        onClick={clearHistory}
                        aria-label="Clear history">
                        <Icon name="trash" />
                    </Button>
                </div>
            </div>

            <div className="history-panel__content">
                {allHistory.length === 0 ? (
                    <div className="history-panel__empty">
                        <Icon name="clock" className="history-panel__empty-icon" />
                        <p className="history-panel__empty-text">No history yet</p>
                        <p className="history-panel__empty-subtext">Actions will appear here as you edit</p>
                    </div>
                ) : (
                    <div className="history-panel__list">
                        {/* Current state indicator */}
                        <div className="history-item history-item--current">
                            <div className="history-item__content">
                                <Icon name="circle" className="history-item__icon" />
                                <div className="history-item__info">
                                    <span className="history-item__description">Current state</span>
                                    <span className="history-item__timestamp">Now</span>
                                </div>
                            </div>
                        </div>

                        {/* History entries in reverse chronological order */}
                        {allHistory
                            .slice()
                            .reverse()
                            .map((entry, index) => {
                                const actualIndex = allHistory.length - 1 - index;
                                const isInUndoStack = actualIndex < currentPosition;
                                const isInRedoStack = actualIndex >= currentPosition;
                                const isCurrent = actualIndex === currentPosition - 1;

                                return (
                                    <div
                                        key={entry.id}
                                        className={cn("history-item", {
                                            "history-item--undone": isInRedoStack,
                                            "history-item--current": isCurrent,
                                        })}
                                        onClick={() => handleHistoryItemClick(actualIndex)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                handleHistoryItemClick(actualIndex);
                                            }
                                        }}>
                                        <div className="history-item__content">
                                            <Icon name={getHistoryItemIcon(entry)} className="history-item__icon" />
                                            <div className="history-item__info">
                                                <span className="history-item__description">{entry.description}</span>
                                                <span className="history-item__timestamp">
                                                    {formatTimestamp(entry.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
        </div>
    );
}
