import React, { useState } from "react";
import { ConflictResolution as ConflictResolutionType, ChangeOperation, User } from "../../types/editor";
import cn from "classnames";
import "./conflictResolution.css";

interface ConflictResolutionDialogProps {
    conflict: ConflictResolutionType;
    users: Record<string, User>;
    onResolve: (conflict: ConflictResolutionType) => void;
    onCancel: () => void;
    className?: string;
}

/**
 * Dialog for resolving conflicts between simultaneous edits
 */
export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
    conflict,
    users,
    onResolve,
    onCancel,
    className,
}) => {
    const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionType["resolutionStrategy"]>(
        conflict.resolutionStrategy
    );
    const [selectedOperation, setSelectedOperation] = useState<ChangeOperation | null>(null);

    const dialogCn = cn("ConflictResolutionDialog", className);

    const handleResolve = () => {
        const resolvedConflict: ConflictResolutionType = {
            ...conflict,
            resolutionStrategy: selectedStrategy,
            resolvedOperation: selectedOperation || undefined,
            resolvedBy: "current-user", // This would be the actual current user ID
            isResolved: true,
        };

        onResolve(resolvedConflict);
    };

    const formatOperationType = (type: ChangeOperation["type"]) => {
        switch (type) {
            case "create":
                return "Create";
            case "update":
                return "Update";
            case "delete":
                return "Delete";
            case "move":
                return "Move";
            case "transform":
                return "Transform";
            case "style":
                return "Style";
            default:
                return type;
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getOperationDescription = (operation: ChangeOperation) => {
        const user = users[operation.userId];
        const userName = user?.name || operation.userId;
        const time = formatTimestamp(operation.timestamp);

        return `${userName} ${formatOperationType(operation.type).toLowerCase()}d at ${time}`;
    };

    return (
        <div className={dialogCn}>
            <div className="ConflictResolutionDialog__backdrop" onClick={onCancel} />

            <div className="ConflictResolutionDialog__content">
                <div className="ConflictResolutionDialog__header">
                    <h3>Resolve Conflict</h3>
                    <button className="ConflictResolutionDialog__close" onClick={onCancel} aria-label="Close dialog">
                        ×
                    </button>
                </div>

                <div className="ConflictResolutionDialog__body">
                    <div className="ConflictResolutionDialog__description">
                        <p>Multiple users have made conflicting changes. Choose how to resolve this conflict:</p>
                    </div>

                    <div className="ConflictResolutionDialog__operations">
                        <h4>Conflicting Operations:</h4>
                        {conflict.conflictingOperations.map((operation, index) => {
                            const user = users[operation.userId];

                            return (
                                <div
                                    key={operation.id}
                                    className={cn("ConflictResolutionDialog__operation", {
                                        selected: selectedOperation?.id === operation.id,
                                    })}
                                    onClick={() => setSelectedOperation(operation)}>
                                    <div className="ConflictResolutionDialog__operationHeader">
                                        <div
                                            className="ConflictResolutionDialog__userIndicator"
                                            style={{ backgroundColor: user?.color }}>
                                            {user?.name?.charAt(0) || operation.userId.charAt(0)}
                                        </div>

                                        <div className="ConflictResolutionDialog__operationInfo">
                                            <div className="ConflictResolutionDialog__operationTitle">
                                                {formatOperationType(operation.type)} Operation
                                            </div>
                                            <div className="ConflictResolutionDialog__operationDescription">
                                                {getOperationDescription(operation)}
                                            </div>
                                        </div>

                                        <div className="ConflictResolutionDialog__operationTime">
                                            {formatTimestamp(operation.timestamp)}
                                        </div>
                                    </div>

                                    {operation.path && (
                                        <div className="ConflictResolutionDialog__operationPath">
                                            Property: {operation.path}
                                        </div>
                                    )}

                                    <div className="ConflictResolutionDialog__operationChanges">
                                        {operation.beforeValue !== undefined && (
                                            <div className="ConflictResolutionDialog__change">
                                                <span className="ConflictResolutionDialog__changeLabel">From:</span>
                                                <code>{JSON.stringify(operation.beforeValue)}</code>
                                            </div>
                                        )}
                                        {operation.afterValue !== undefined && (
                                            <div className="ConflictResolutionDialog__change">
                                                <span className="ConflictResolutionDialog__changeLabel">To:</span>
                                                <code>{JSON.stringify(operation.afterValue)}</code>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="ConflictResolutionDialog__strategies">
                        <h4>Resolution Strategy:</h4>

                        <div className="ConflictResolutionDialog__strategyOptions">
                            <label className="ConflictResolutionDialog__strategyOption">
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="last-write-wins"
                                    checked={selectedStrategy === "last-write-wins"}
                                    onChange={(e) =>
                                        setSelectedStrategy(
                                            e.target.value as ConflictResolutionType["resolutionStrategy"]
                                        )
                                    }
                                />
                                <div className="ConflictResolutionDialog__strategyInfo">
                                    <div className="ConflictResolutionDialog__strategyTitle">Last Write Wins</div>
                                    <div className="ConflictResolutionDialog__strategyDescription">
                                        Accept the most recent change and discard others
                                    </div>
                                </div>
                            </label>

                            <label className="ConflictResolutionDialog__strategyOption">
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="manual"
                                    checked={selectedStrategy === "manual"}
                                    onChange={(e) =>
                                        setSelectedStrategy(
                                            e.target.value as ConflictResolutionType["resolutionStrategy"]
                                        )
                                    }
                                />
                                <div className="ConflictResolutionDialog__strategyInfo">
                                    <div className="ConflictResolutionDialog__strategyTitle">Manual Selection</div>
                                    <div className="ConflictResolutionDialog__strategyDescription">
                                        Choose which specific operation to keep
                                    </div>
                                </div>
                            </label>

                            <label className="ConflictResolutionDialog__strategyOption">
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="auto-merge"
                                    checked={selectedStrategy === "auto-merge"}
                                    onChange={(e) =>
                                        setSelectedStrategy(
                                            e.target.value as ConflictResolutionType["resolutionStrategy"]
                                        )
                                    }
                                />
                                <div className="ConflictResolutionDialog__strategyInfo">
                                    <div className="ConflictResolutionDialog__strategyTitle">Auto Merge</div>
                                    <div className="ConflictResolutionDialog__strategyDescription">
                                        Attempt to merge non-conflicting properties
                                    </div>
                                </div>
                            </label>

                            <label className="ConflictResolutionDialog__strategyOption">
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="rollback"
                                    checked={selectedStrategy === "rollback"}
                                    onChange={(e) =>
                                        setSelectedStrategy(
                                            e.target.value as ConflictResolutionType["resolutionStrategy"]
                                        )
                                    }
                                />
                                <div className="ConflictResolutionDialog__strategyInfo">
                                    <div className="ConflictResolutionDialog__strategyTitle">Rollback</div>
                                    <div className="ConflictResolutionDialog__strategyDescription">
                                        Revert all changes and restore previous state
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {selectedStrategy === "manual" && (
                        <div className="ConflictResolutionDialog__manualSelection">
                            <p className="ConflictResolutionDialog__note">
                                Select an operation above to keep its changes.
                            </p>
                        </div>
                    )}
                </div>

                <div className="ConflictResolutionDialog__footer">
                    <button
                        className="ConflictResolutionDialog__button ConflictResolutionDialog__button--secondary"
                        onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="ConflictResolutionDialog__button ConflictResolutionDialog__button--primary"
                        onClick={handleResolve}
                        disabled={selectedStrategy === "manual" && !selectedOperation}>
                        Resolve Conflict
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ConflictIndicatorProps {
    conflictCount: number;
    onClick: () => void;
    className?: string;
}

/**
 * Small indicator showing the number of unresolved conflicts
 */
export const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({ conflictCount, onClick, className }) => {
    if (conflictCount === 0) return null;

    const indicatorCn = cn("ConflictIndicator", className);

    return (
        <button className={indicatorCn} onClick={onClick} title="View conflicts">
            <span className="ConflictIndicator__icon">⚠️</span>
            <span className="ConflictIndicator__count">{conflictCount}</span>
        </button>
    );
};

interface ConflictListProps {
    conflicts: ConflictResolutionType[];
    users: Record<string, User>;
    onSelectConflict: (conflict: ConflictResolutionType) => void;
    className?: string;
}

/**
 * List of all conflicts in the session
 */
export const ConflictList: React.FC<ConflictListProps> = ({ conflicts, users, onSelectConflict, className }) => {
    const listCn = cn("ConflictList", className);

    const unresolvedConflicts = conflicts.filter((c) => !c.isResolved);

    if (unresolvedConflicts.length === 0) {
        return (
            <div className={listCn}>
                <div className="ConflictList__empty">No unresolved conflicts</div>
            </div>
        );
    }

    return (
        <div className={listCn}>
            <div className="ConflictList__header">
                <h4>Unresolved Conflicts ({unresolvedConflicts.length})</h4>
            </div>

            <div className="ConflictList__items">
                {unresolvedConflicts.map((conflict) => (
                    <div key={conflict.id} className="ConflictList__item" onClick={() => onSelectConflict(conflict)}>
                        <div className="ConflictList__itemHeader">
                            <span className="ConflictList__itemTitle">
                                Conflict in {conflict.conflictingOperations[0]?.objectId || "unknown object"}
                            </span>
                            <span className="ConflictList__itemTime">
                                {new Date(conflict.timestamp).toLocaleTimeString()}
                            </span>
                        </div>

                        <div className="ConflictList__itemDescription">
                            {conflict.conflictingOperations.length} conflicting operations
                        </div>

                        <div className="ConflictList__itemUsers">
                            {conflict.conflictingOperations.map((op) => {
                                const user = users[op.userId];
                                return (
                                    <div
                                        key={op.userId}
                                        className="ConflictList__itemUser"
                                        style={{ backgroundColor: user?.color }}
                                        title={user?.name || op.userId}>
                                        {user?.name?.charAt(0) || op.userId.charAt(0)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
