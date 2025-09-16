import cn from "classnames";
import { useCallback, useState } from "react";
import type { ImportResult } from "../../utils/import";
import { importLegacyConfig } from "../../utils/import";
import { Button } from "../ui";

import "./migrationTool.css";

interface MigrationToolProps {
    onMigrate: (result: ImportResult) => void;
    className?: string;
}

export function MigrationTool({ onMigrate, className }: MigrationToolProps) {
    const [configText, setConfigText] = useState<string>("");
    const [isMigrating, setIsMigrating] = useState(false);
    const [error, setError] = useState<string>("");
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleMigrate = useCallback(async () => {
        if (!configText.trim()) {
            setError("Please enter a configuration to migrate");
            return;
        }

        setIsMigrating(true);
        setError("");
        setResult(null);

        try {
            const configData = JSON.parse(configText);
            const migrationResult = await importLegacyConfig(configData);

            setResult(migrationResult);

            if (migrationResult.errors.length > 0) {
                setError(migrationResult.errors.join(", "));
            }
        } catch (parseError) {
            setError("Invalid JSON format. Please check your configuration data.");
        } finally {
            setIsMigrating(false);
        }
    }, [configText]);

    const handleApplyMigration = useCallback(() => {
        if (result) {
            onMigrate(result);
            setConfigText("");
            setResult(null);
        }
    }, [result, onMigrate]);

    const migrationToolCn = cn("MigrationTool", className);

    return (
        <div className={migrationToolCn}>
            <div className="MigrationTool__header">
                <h3 className="MigrationTool__title">Legacy Configuration Migration</h3>
                <p className="MigrationTool__description">
                    Paste your legacy IconCreator JSON configuration below to migrate it to the new visual editor
                    format.
                </p>
            </div>

            <div className="MigrationTool__section">
                <label className="MigrationTool__label">
                    Legacy Configuration (JSON)
                    <textarea
                        className="MigrationTool__textarea"
                        value={configText}
                        onChange={(e) => setConfigText(e.target.value)}
                        placeholder={`{
  "config": {
    "bgGradStart": "#1f3552",
    "bgGradMid": "#0f2238",
    "bgGradEnd": "#081523",
    "panelTop": "#24415f",
    ...
  }
}`}
                        rows={12}
                    />
                </label>
            </div>

            <div className="MigrationTool__actions">
                <Button
                    onClick={handleMigrate}
                    disabled={isMigrating || !configText.trim()}
                    className="MigrationTool__migrate-btn">
                    {isMigrating ? "Migrating..." : "Preview Migration"}
                </Button>
            </div>

            {error && (
                <div className="MigrationTool__error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div className="MigrationTool__result">
                    <h4 className="MigrationTool__result-title">Migration Preview</h4>

                    <div className="MigrationTool__stats">
                        <div className="MigrationTool__stat">
                            <span className="MigrationTool__stat-label">Objects Created:</span>
                            <span className="MigrationTool__stat-value">{result.objects.length}</span>
                        </div>
                        <div className="MigrationTool__stat">
                            <span className="MigrationTool__stat-label">Layers:</span>
                            <span className="MigrationTool__stat-value">{result.layers.length}</span>
                        </div>
                    </div>

                    {result.warnings.length > 0 && (
                        <div className="MigrationTool__warnings">
                            <h5>Migration Notes:</h5>
                            <ul>
                                {result.warnings.map((warning, index) => (
                                    <li key={index} className="MigrationTool__warning">
                                        {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="MigrationTool__result-actions">
                        <Button onClick={handleApplyMigration} className="MigrationTool__apply-btn">
                            Apply Migration
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
