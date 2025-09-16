import cn from "classnames";
import { useCallback, useRef, useState } from "react";
import type { ImportOptions, ImportPreview, ImportResult } from "../../utils/import";
import { detectImportFormat, generateImportPreview, importFile } from "../../utils/import";
import { Button } from "../ui";

import "./importControls.css";

interface ImportControlsProps {
    onImport: (result: ImportResult) => void;
    className?: string;
}

export function ImportControls({ onImport, className }: ImportControlsProps) {
    const [importOptions, setImportOptions] = useState<ImportOptions>({
        preserveLayers: true,
        convertTextToPaths: false,
        groupElements: true,
        validateSvg: true,
        scaleFactor: 1,
        centerContent: true,
    });

    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileFormat, setFileFormat] = useState<{ format: string; isValid: boolean } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setError("");
        setPreview(null);
        setFileFormat(null);

        try {
            // First detect format
            const formatDetection = await detectImportFormat(file);
            setFileFormat({
                format: formatDetection.format,
                isValid: formatDetection.isValid,
            });

            if (!formatDetection.isValid) {
                setError(formatDetection.error || "Invalid file format");
                return;
            }

            // Generate preview only for valid files
            const previewResult = await generateImportPreview(file);
            setPreview(previewResult);

            if (previewResult.errors.length > 0) {
                setError(previewResult.errors.join(", "));
            }
        } catch (err) {
            setError(`Failed to process file: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    }, []);

    const handleImportFile = useCallback(async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        setError("");

        try {
            const result = await importFile(selectedFile, importOptions);

            if (result.errors.length > 0) {
                setError(result.errors.join(", "));
            } else {
                onImport(result);
                // Reset state after successful import
                setSelectedFile(null);
                setPreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        } catch (err) {
            setError(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsImporting(false);
        }
    }, [selectedFile, importOptions, onImport]);

    const handleOptionChange = useCallback(<K extends keyof ImportOptions>(key: K, value: ImportOptions[K]) => {
        setImportOptions((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleBrowseFiles = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const importControlsCn = cn("ImportControls", className);

    return (
        <div className={importControlsCn}>
            <div className="ImportControls__header">
                <h3 className="ImportControls__title">Import Files</h3>
            </div>

            {/* File Selection */}
            <div className="ImportControls__section">
                <div className="ImportControls__file-input">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".svg,.json"
                        onChange={handleFileSelect}
                        className="ImportControls__hidden-input"
                    />
                    <Button onClick={handleBrowseFiles} variant="secondary" className="ImportControls__browse-btn">
                        Choose File
                    </Button>
                    {selectedFile && (
                        <div className="ImportControls__file-info">
                            <span className="ImportControls__file-name">{selectedFile.name}</span>
                            {fileFormat && (
                                <span
                                    className={`ImportControls__format-badge ${
                                        fileFormat.isValid ? "valid" : "invalid"
                                    }`}>
                                    {fileFormat.format === "svg"
                                        ? "SVG"
                                        : fileFormat.format === "legacy-config"
                                        ? "Legacy Config"
                                        : fileFormat.format}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <p className="ImportControls__help-text">
                    Supports SVG files and legacy IconCreator JSON configurations
                </p>
            </div>

            {/* Import Options */}
            {selectedFile && (
                <div className="ImportControls__section">
                    <h4 className="ImportControls__section-title">Import Options</h4>

                    <div className="ImportControls__options">
                        <label className="ImportControls__checkbox">
                            <input
                                type="checkbox"
                                checked={importOptions.preserveLayers}
                                onChange={(e) => handleOptionChange("preserveLayers", e.target.checked)}
                            />
                            Preserve layers and groups
                        </label>

                        <label className="ImportControls__checkbox">
                            <input
                                type="checkbox"
                                checked={importOptions.centerContent}
                                onChange={(e) => handleOptionChange("centerContent", e.target.checked)}
                            />
                            Center imported content
                        </label>

                        <label className="ImportControls__checkbox">
                            <input
                                type="checkbox"
                                checked={importOptions.validateSvg}
                                onChange={(e) => handleOptionChange("validateSvg", e.target.checked)}
                            />
                            Validate SVG format
                        </label>

                        <label className="ImportControls__checkbox">
                            <input
                                type="checkbox"
                                checked={importOptions.convertTextToPaths}
                                onChange={(e) => handleOptionChange("convertTextToPaths", e.target.checked)}
                            />
                            Convert text to paths
                        </label>
                    </div>

                    <div className="ImportControls__scale-control">
                        <label className="ImportControls__label">
                            Scale Factor
                            <input
                                type="number"
                                className="ImportControls__input"
                                value={importOptions.scaleFactor || 1}
                                min="0.1"
                                max="10"
                                step="0.1"
                                onChange={(e) => handleOptionChange("scaleFactor", parseFloat(e.target.value) || 1)}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div className="ImportControls__section">
                    <h4 className="ImportControls__section-title">Preview</h4>

                    <div className="ImportControls__preview">
                        <div className="ImportControls__preview-stats">
                            <div className="ImportControls__stat">
                                <span className="ImportControls__stat-label">Objects:</span>
                                <span className="ImportControls__stat-value">{preview.objectCount}</span>
                            </div>
                            <div className="ImportControls__stat">
                                <span className="ImportControls__stat-label">Layers:</span>
                                <span className="ImportControls__stat-value">{preview.layerCount}</span>
                            </div>
                            <div className="ImportControls__stat">
                                <span className="ImportControls__stat-label">Size:</span>
                                <span className="ImportControls__stat-value">
                                    {preview.dimensions.width} × {preview.dimensions.height}
                                </span>
                            </div>
                        </div>

                        {preview.svgContent && (
                            <div className="ImportControls__preview-image">
                                <div
                                    className="ImportControls__svg-preview"
                                    dangerouslySetInnerHTML={{ __html: preview.svgContent }}
                                />
                            </div>
                        )}

                        {preview.warnings.length > 0 && (
                            <div className="ImportControls__warnings">
                                <h5>Warnings:</h5>
                                <ul>
                                    {preview.warnings.map((warning, index) => (
                                        <li key={index} className="ImportControls__warning">
                                            {warning}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="ImportControls__error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Import Action */}
            {selectedFile && preview && preview.errors.length === 0 && (
                <div className="ImportControls__actions">
                    <Button onClick={handleImportFile} disabled={isImporting} className="ImportControls__import-btn">
                        {isImporting ? "Importing..." : "Import SVG"}
                    </Button>
                </div>
            )}
        </div>
    );
}
