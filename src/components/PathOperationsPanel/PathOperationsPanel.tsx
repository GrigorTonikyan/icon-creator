import React, { useState, useCallback, useMemo } from "react";
import { pathOperations } from "../../utils/PathOperations";
import type { PathObject, PathOperationType } from "../../types/editor";
import cn from "classnames";
import "./pathOperationsPanel.css";

interface PathOperationsPanelProps {
    selectedPaths: PathObject[];
    onPathCreated: (path: PathObject) => void;
    onError: (error: string) => void;
    className?: string;
}

interface OperationResult {
    success: boolean;
    path?: PathObject;
    error?: string;
    operation: string;
    timestamp: number;
}

export function PathOperationsPanel({ selectedPaths, onPathCreated, onError, className }: PathOperationsPanelProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeOperation, setActiveOperation] = useState<string | null>(null);
    const [operationHistory, setOperationHistory] = useState<OperationResult[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Boolean operation parameters
    const [booleanOptions, setBooleanOptions] = useState({
        operation: "unite" as PathOperationType,
        optimize: true,
        precision: 2,
    });

    // Simplification parameters
    const [simplifyOptions, setSimplifyOptions] = useState({
        tolerance: 1.0,
        preserveCorners: false,
        optimize: true,
        precision: 2,
    });

    // Smoothing parameters
    const [smoothOptions, setSmoothOptions] = useState({
        smoothingFactor: 0.5,
        preserveEnds: true,
        optimize: true,
    });

    // Offset parameters
    const [offsetOptions, setOffsetOptions] = useState({
        offset: 10,
        joinType: "round" as "miter" | "round" | "bevel",
        optimize: true,
    });

    // Check if operations are available
    const canPerformBoolean = selectedPaths.length >= 2;
    const canPerformSingle = selectedPaths.length === 1;

    // Add operation to history
    const addToHistory = useCallback((result: OperationResult) => {
        setOperationHistory((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 operations
    }, []);

    // Generic operation handler
    const handleOperation = useCallback(
        async (
            operationName: string,
            operationFn: () => Promise<{ success: boolean; result?: PathObject; error?: string }>
        ) => {
            setIsProcessing(true);
            setActiveOperation(operationName);

            try {
                const result = await operationFn();

                const historyEntry: OperationResult = {
                    success: result.success,
                    path: result.result,
                    error: result.error,
                    operation: operationName,
                    timestamp: Date.now(),
                };

                addToHistory(historyEntry);

                if (result.success && result.result) {
                    onPathCreated(result.result);
                } else if (result.error) {
                    onError(result.error);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                onError(`${operationName} failed: ${errorMessage}`);

                addToHistory({
                    success: false,
                    error: errorMessage,
                    operation: operationName,
                    timestamp: Date.now(),
                });
            } finally {
                setIsProcessing(false);
                setActiveOperation(null);
            }
        },
        [addToHistory, onPathCreated, onError]
    );

    // Boolean operations
    const handleBooleanOperation = useCallback(
        (operation: PathOperationType) => {
            handleOperation(`Boolean ${operation}`, async () => {
                return pathOperations.performBooleanOperation(operation, selectedPaths);
            });
        },
        [selectedPaths, handleOperation]
    );

    // Single path operations
    const handleSimplify = useCallback(() => {
        const path = selectedPaths[0];
        if (!path) return;

        handleOperation("Simplify", async () => {
            return pathOperations.simplifyPath(path, simplifyOptions);
        });
    }, [selectedPaths, simplifyOptions, handleOperation]);

    const handleSmooth = useCallback(() => {
        const path = selectedPaths[0];
        if (!path) return;

        handleOperation("Smooth", async () => {
            return pathOperations.smoothPath(path, smoothOptions);
        });
    }, [selectedPaths, smoothOptions, handleOperation]);

    const handleOffset = useCallback(() => {
        const path = selectedPaths[0];
        if (!path) return;

        handleOperation("Offset", async () => {
            return pathOperations.offsetPath(path, offsetOptions.offset, offsetOptions);
        });
    }, [selectedPaths, offsetOptions, handleOperation]);

    const handleReverse = useCallback(() => {
        const path = selectedPaths[0];
        if (!path) return;

        handleOperation("Reverse", async () => {
            return pathOperations.reversePath(path);
        });
    }, [selectedPaths, handleOperation]);

    const handleToAbsolute = useCallback(() => {
        const path = selectedPaths[0];
        if (!path) return;

        handleOperation("Convert to Absolute", async () => {
            return pathOperations.convertToAbsolute(path);
        });
    }, [selectedPaths, handleOperation]);

    // Path analysis
    const pathAnalysis = useMemo(() => {
        if (selectedPaths.length !== 1) return null;

        const result = pathOperations.analyzePath(selectedPaths[0]);
        return result.success ? result.analysis : null;
    }, [selectedPaths]);

    const pathOperationsPanelCn = cn("PathOperationsPanel", className, {
        processing: isProcessing,
        "no-selection": selectedPaths.length === 0,
    });

    return (
        <div className={pathOperationsPanelCn}>
            <div className="panel-header">
                <h3>Path Operations</h3>
                <span className="selection-info">
                    {selectedPaths.length} path{selectedPaths.length !== 1 ? "s" : ""} selected
                </span>
            </div>

            {selectedPaths.length === 0 && (
                <div className="no-selection-message">
                    <p>Select one or more paths to enable operations</p>
                </div>
            )}

            {/* Boolean Operations */}
            {canPerformBoolean && (
                <div className="operation-section">
                    <h4>Boolean Operations</h4>
                    <div className="boolean-operations">
                        <button
                            className="operation-btn unite"
                            onClick={() => handleBooleanOperation("unite")}
                            disabled={isProcessing}>
                            {activeOperation === "Boolean unite" ? "Processing..." : "Unite"}
                        </button>
                        <button
                            className="operation-btn subtract"
                            onClick={() => handleBooleanOperation("subtract")}
                            disabled={isProcessing}>
                            {activeOperation === "Boolean subtract" ? "Processing..." : "Subtract"}
                        </button>
                        <button
                            className="operation-btn intersect"
                            onClick={() => handleBooleanOperation("intersect")}
                            disabled={isProcessing}>
                            {activeOperation === "Boolean intersect" ? "Processing..." : "Intersect"}
                        </button>
                        <button
                            className="operation-btn exclude"
                            onClick={() => handleBooleanOperation("exclude")}
                            disabled={isProcessing}>
                            {activeOperation === "Boolean exclude" ? "Processing..." : "Exclude"}
                        </button>
                    </div>
                </div>
            )}

            {/* Single Path Operations */}
            {canPerformSingle && (
                <div className="operation-section">
                    <h4>Path Modifications</h4>

                    {/* Quick Operations */}
                    <div className="quick-operations">
                        <button className="operation-btn simplify" onClick={handleSimplify} disabled={isProcessing}>
                            {activeOperation === "Simplify" ? "Processing..." : "Simplify"}
                        </button>
                        <button className="operation-btn smooth" onClick={handleSmooth} disabled={isProcessing}>
                            {activeOperation === "Smooth" ? "Processing..." : "Smooth"}
                        </button>
                        <button className="operation-btn reverse" onClick={handleReverse} disabled={isProcessing}>
                            {activeOperation === "Reverse" ? "Processing..." : "Reverse"}
                        </button>
                        <button className="operation-btn absolute" onClick={handleToAbsolute} disabled={isProcessing}>
                            {activeOperation === "Convert to Absolute" ? "Processing..." : "To Absolute"}
                        </button>
                    </div>

                    {/* Advanced Options Toggle */}
                    <button className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                        {showAdvanced ? "Hide" : "Show"} Advanced Options
                    </button>

                    {showAdvanced && (
                        <div className="advanced-options">
                            {/* Simplify Options */}
                            <div className="option-group">
                                <h5>Simplify Options</h5>
                                <label>
                                    Tolerance:
                                    <input
                                        type="number"
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                        value={simplifyOptions.tolerance}
                                        onChange={(e) =>
                                            setSimplifyOptions((prev) => ({
                                                ...prev,
                                                tolerance: parseFloat(e.target.value) || 1.0,
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={simplifyOptions.preserveCorners}
                                        onChange={(e) =>
                                            setSimplifyOptions((prev) => ({
                                                ...prev,
                                                preserveCorners: e.target.checked,
                                            }))
                                        }
                                    />
                                    Preserve Corners
                                </label>
                            </div>

                            {/* Smooth Options */}
                            <div className="option-group">
                                <h5>Smooth Options</h5>
                                <label>
                                    Smoothing Factor:
                                    <input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={smoothOptions.smoothingFactor}
                                        onChange={(e) =>
                                            setSmoothOptions((prev) => ({
                                                ...prev,
                                                smoothingFactor: parseFloat(e.target.value) || 0.5,
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={smoothOptions.preserveEnds}
                                        onChange={(e) =>
                                            setSmoothOptions((prev) => ({
                                                ...prev,
                                                preserveEnds: e.target.checked,
                                            }))
                                        }
                                    />
                                    Preserve End Points
                                </label>
                            </div>

                            {/* Offset Options */}
                            <div className="option-group">
                                <h5>Offset Options</h5>
                                <label>
                                    Offset Distance:
                                    <input
                                        type="number"
                                        min="-100"
                                        max="100"
                                        step="1"
                                        value={offsetOptions.offset}
                                        onChange={(e) =>
                                            setOffsetOptions((prev) => ({
                                                ...prev,
                                                offset: parseFloat(e.target.value) || 10,
                                            }))
                                        }
                                    />
                                </label>
                                <label>
                                    Join Type:
                                    <select
                                        value={offsetOptions.joinType}
                                        onChange={(e) =>
                                            setOffsetOptions((prev) => ({
                                                ...prev,
                                                joinType: e.target.value as "miter" | "round" | "bevel",
                                            }))
                                        }>
                                        <option value="round">Round</option>
                                        <option value="miter">Miter</option>
                                        <option value="bevel">Bevel</option>
                                    </select>
                                </label>
                                <button className="operation-btn offset" onClick={handleOffset} disabled={isProcessing}>
                                    {activeOperation === "Offset" ? "Processing..." : "Apply Offset"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Path Analysis */}
            {pathAnalysis && (
                <div className="operation-section">
                    <h4>Path Analysis</h4>
                    <div className="analysis-info">
                        <div className="analysis-item">
                            <span className="label">Length:</span>
                            <span className="value">{pathAnalysis.length.toFixed(2)}px</span>
                        </div>
                        <div className="analysis-item">
                            <span className="label">Nodes:</span>
                            <span className="value">{pathAnalysis.nodeCount}</span>
                        </div>
                        <div className="analysis-item">
                            <span className="label">Closed:</span>
                            <span className="value">{pathAnalysis.isClosed ? "Yes" : "No"}</span>
                        </div>
                        <div className="analysis-item">
                            <span className="label">Complexity:</span>
                            <span className={`value complexity-${pathAnalysis.complexity}`}>
                                {pathAnalysis.complexity}
                            </span>
                        </div>
                        <div className="analysis-item">
                            <span className="label">Bounds:</span>
                            <span className="value">
                                {pathAnalysis.bounds.width.toFixed(1)} × {pathAnalysis.bounds.height.toFixed(1)}
                            </span>
                        </div>
                        {!pathAnalysis.validation.isValid && (
                            <div className="analysis-item error">
                                <span className="label">Errors:</span>
                                <span className="value">{pathAnalysis.validation.errors.join(", ")}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Operation History */}
            {operationHistory.length > 0 && (
                <div className="operation-section">
                    <h4>Recent Operations</h4>
                    <div className="operation-history">
                        {operationHistory.slice(0, 5).map((entry, index) => (
                            <div
                                key={`${entry.operation}-${entry.timestamp}`}
                                className={cn("history-item", {
                                    success: entry.success,
                                    error: !entry.success,
                                })}>
                                <span className="operation-name">{entry.operation}</span>
                                <span className="operation-status">{entry.success ? "✓" : "✗"}</span>
                                {entry.error && (
                                    <span className="operation-error" title={entry.error}>
                                        {entry.error.length > 30 ? entry.error.substring(0, 30) + "..." : entry.error}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
