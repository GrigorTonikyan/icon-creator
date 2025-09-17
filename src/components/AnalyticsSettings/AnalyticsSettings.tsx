import React, { useState, useEffect } from "react";
import cn from "classnames";
import { analytics, type AnalyticsConfig } from "../../utils/analytics";
import "./analyticsSettings.css";

interface AnalyticsSettingsProps {
    className?: string;
}

/**
 * Analytics Settings Component
 * Provides user interface for configuring analytics and telemetry preferences
 */
export function AnalyticsSettings({ className }: AnalyticsSettingsProps) {
    const [config, setConfig] = useState<AnalyticsConfig>(analytics.getConfig());
    const [session, setSession] = useState(analytics.getSession());
    const [summary, setSummary] = useState(analytics.getAnalyticsSummary());
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Update state periodically
        const interval = setInterval(() => {
            setSession(analytics.getSession());
            setSummary(analytics.getAnalyticsSummary());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleConfigChange = (key: keyof AnalyticsConfig, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        analytics.updateConfig({ [key]: value });
    };

    const handleClearData = () => {
        if (confirm("Are you sure you want to clear all analytics data? This action cannot be undone.")) {
            analytics.clearData();
            setSummary(analytics.getAnalyticsSummary());
        }
    };

    const handleExportData = () => {
        const data = analytics.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatDuration = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const analyticsSettingsCn = cn("AnalyticsSettings", className, {
        expanded: isExpanded,
        disabled: !config.enabled,
    });

    return (
        <div className={analyticsSettingsCn}>
            <div className="AnalyticsSettings-header">
                <h3 className="AnalyticsSettings-title">Analytics & Telemetry</h3>
                <button
                    type="button"
                    className="AnalyticsSettings-toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    aria-controls="analytics-settings-content">
                    {isExpanded ? "Collapse" : "Expand"}
                </button>
            </div>

            <div id="analytics-settings-content" className="AnalyticsSettings-content" aria-hidden={!isExpanded}>
                {/* Main Controls */}
                <div className="AnalyticsSettings-section">
                    <h4 className="AnalyticsSettings-sectionTitle">General Settings</h4>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => handleConfigChange("enabled", e.target.checked)}
                                className="AnalyticsSettings-checkbox"
                            />
                            Enable Analytics & Telemetry
                        </label>
                        <p className="AnalyticsSettings-description">
                            Collect usage data to improve the application experience
                        </p>
                    </div>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            <input
                                type="checkbox"
                                checked={config.privacyMode}
                                onChange={(e) => handleConfigChange("privacyMode", e.target.checked)}
                                disabled={!config.enabled}
                                className="AnalyticsSettings-checkbox"
                            />
                            Privacy Mode
                        </label>
                        <p className="AnalyticsSettings-description">Limit data collection to essential metrics only</p>
                    </div>
                </div>

                {/* Data Collection Controls */}
                <div className="AnalyticsSettings-section">
                    <h4 className="AnalyticsSettings-sectionTitle">Data Collection</h4>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            <input
                                type="checkbox"
                                checked={config.collectUsage}
                                onChange={(e) => handleConfigChange("collectUsage", e.target.checked)}
                                disabled={!config.enabled}
                                className="AnalyticsSettings-checkbox"
                            />
                            Feature Usage Tracking
                        </label>
                        <p className="AnalyticsSettings-description">
                            Track which features are used to prioritize development
                        </p>
                    </div>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            <input
                                type="checkbox"
                                checked={config.collectPerformance}
                                onChange={(e) => handleConfigChange("collectPerformance", e.target.checked)}
                                disabled={!config.enabled}
                                className="AnalyticsSettings-checkbox"
                            />
                            Performance Monitoring
                        </label>
                        <p className="AnalyticsSettings-description">
                            Monitor application performance to identify optimization opportunities
                        </p>
                    </div>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            <input
                                type="checkbox"
                                checked={config.collectErrors}
                                onChange={(e) => handleConfigChange("collectErrors", e.target.checked)}
                                disabled={!config.enabled}
                                className="AnalyticsSettings-checkbox"
                            />
                            Error Reporting
                        </label>
                        <p className="AnalyticsSettings-description">
                            Automatically report errors to help improve stability
                        </p>
                    </div>
                </div>

                {/* Advanced Settings */}
                <div className="AnalyticsSettings-section">
                    <h4 className="AnalyticsSettings-sectionTitle">Advanced Settings</h4>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            Session Timeout (minutes)
                            <input
                                type="number"
                                min="5"
                                max="180"
                                value={config.sessionTimeout}
                                onChange={(e) => handleConfigChange("sessionTimeout", parseInt(e.target.value))}
                                disabled={!config.enabled}
                                className="AnalyticsSettings-numberInput"
                            />
                        </label>
                    </div>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            Batch Size
                            <input
                                type="number"
                                min="10"
                                max="500"
                                value={config.batchSize}
                                onChange={(e) => handleConfigChange("batchSize", parseInt(e.target.value))}
                                disabled={!config.enabled}
                                className="AnalyticsSettings-numberInput"
                            />
                        </label>
                    </div>

                    <div className="AnalyticsSettings-field">
                        <label className="AnalyticsSettings-label">
                            Flush Interval (seconds)
                            <input
                                type="number"
                                min="5"
                                max="300"
                                value={config.flushInterval / 1000}
                                onChange={(e) => handleConfigChange("flushInterval", parseInt(e.target.value) * 1000)}
                                disabled={!config.enabled}
                                className="AnalyticsSettings-numberInput"
                            />
                        </label>
                    </div>
                </div>

                {/* Current Session Info */}
                <div className="AnalyticsSettings-section">
                    <h4 className="AnalyticsSettings-sectionTitle">Current Session</h4>

                    <div className="AnalyticsSettings-stats">
                        <div className="AnalyticsSettings-stat">
                            <span className="AnalyticsSettings-statLabel">Session ID:</span>
                            <span className="AnalyticsSettings-statValue">{session.id}</span>
                        </div>

                        <div className="AnalyticsSettings-stat">
                            <span className="AnalyticsSettings-statLabel">Duration:</span>
                            <span className="AnalyticsSettings-statValue">
                                {formatDuration(session.lastActivity - session.startTime)}
                            </span>
                        </div>

                        <div className="AnalyticsSettings-stat">
                            <span className="AnalyticsSettings-statLabel">Events:</span>
                            <span className="AnalyticsSettings-statValue">{summary.events}</span>
                        </div>

                        <div className="AnalyticsSettings-stat">
                            <span className="AnalyticsSettings-statLabel">Performance Metrics:</span>
                            <span className="AnalyticsSettings-statValue">{summary.metrics}</span>
                        </div>

                        <div className="AnalyticsSettings-stat">
                            <span className="AnalyticsSettings-statLabel">Errors:</span>
                            <span className="AnalyticsSettings-statValue">{summary.errors}</span>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="AnalyticsSettings-section">
                    <h4 className="AnalyticsSettings-sectionTitle">Data Management</h4>

                    <div className="AnalyticsSettings-actions">
                        <button
                            type="button"
                            onClick={handleExportData}
                            className="AnalyticsSettings-button AnalyticsSettings-button--secondary"
                            disabled={!config.enabled}>
                            Export Data
                        </button>

                        <button
                            type="button"
                            onClick={handleClearData}
                            className="AnalyticsSettings-button AnalyticsSettings-button--danger"
                            disabled={!config.enabled}>
                            Clear All Data
                        </button>
                    </div>

                    <p className="AnalyticsSettings-description">
                        Export your analytics data for analysis or clear all stored data. Clearing data cannot be
                        undone.
                    </p>
                </div>

                {/* Privacy Information */}
                <div className="AnalyticsSettings-section">
                    <h4 className="AnalyticsSettings-sectionTitle">Privacy Information</h4>
                    <div className="AnalyticsSettings-privacy">
                        <p>
                            <strong>Data Collection:</strong> We collect only the data you authorize above. No personal
                            information is collected without explicit consent.
                        </p>
                        <p>
                            <strong>Data Storage:</strong> All analytics data is stored locally in your browser. No data
                            is transmitted to external servers.
                        </p>
                        <p>
                            <strong>Data Usage:</strong> Collected data is used solely to improve application
                            performance and user experience.
                        </p>
                        <p>
                            <strong>Data Control:</strong> You can export, clear, or disable data collection at any time
                            using the controls above.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsSettings;
