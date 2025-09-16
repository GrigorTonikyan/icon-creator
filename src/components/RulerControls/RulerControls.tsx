/**
 * RulerControls component
 * Provides controls for ruler visibility, units, and measurement settings
 */

import React from "react";
import { useEditor } from "../../contexts/EditorContext";
import { type UnitType, UNIT_LABELS } from "../../utils/rulerUtils";
import "./rulerControls.css";

interface RulerControlsProps {
    className?: string;
}

export const RulerControls: React.FC<RulerControlsProps> = ({ className }) => {
    const { state, toggleRulers, setRulerUnit, toggleMeasurements, setMeasurementPrecision } = useEditor();

    const { rulers } = state;

    // Handle unit change
    const handleUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRulerUnit(event.target.value as UnitType);
    };

    // Handle precision change
    const handlePrecisionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setMeasurementPrecision(parseInt(event.target.value, 10));
    };

    return (
        <div className={`ruler-controls ${className || ""}`}>
            <h4 className="ruler-controls__title">Rulers & Measurements</h4>

            <div className="ruler-controls__section">
                {/* Ruler visibility toggle */}
                <label className="ruler-controls__toggle">
                    <input
                        type="checkbox"
                        checked={rulers.visible}
                        onChange={toggleRulers}
                        className="ruler-controls__checkbox"
                    />
                    <span className="ruler-controls__label">Show Rulers</span>
                    <div className="ruler-controls__toggle-switch">
                        <div className="ruler-controls__toggle-thumb"></div>
                    </div>
                </label>

                {/* Unit selection */}
                <div className="ruler-controls__field">
                    <label htmlFor="ruler-unit" className="ruler-controls__field-label">
                        Unit
                    </label>
                    <select
                        id="ruler-unit"
                        value={rulers.unit}
                        onChange={handleUnitChange}
                        disabled={!rulers.visible}
                        className="ruler-controls__select">
                        {Object.entries(UNIT_LABELS).map(([unit, label]) => (
                            <option key={unit} value={unit}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="ruler-controls__section">
                {/* Measurement visibility toggle */}
                <label className="ruler-controls__toggle">
                    <input
                        type="checkbox"
                        checked={rulers.showMeasurements}
                        onChange={toggleMeasurements}
                        disabled={!rulers.visible}
                        className="ruler-controls__checkbox"
                    />
                    <span className="ruler-controls__label">Show Measurements</span>
                    <div className="ruler-controls__toggle-switch">
                        <div className="ruler-controls__toggle-thumb"></div>
                    </div>
                </label>

                {/* Precision setting */}
                <div className="ruler-controls__field">
                    <label htmlFor="measurement-precision" className="ruler-controls__field-label">
                        Precision
                    </label>
                    <select
                        id="measurement-precision"
                        value={rulers.precision}
                        onChange={handlePrecisionChange}
                        disabled={!rulers.visible || !rulers.showMeasurements}
                        className="ruler-controls__select">
                        <option value={0}>0 (1, 2, 3)</option>
                        <option value={1}>1 (1.0, 2.0, 3.0)</option>
                        <option value={2}>2 (1.00, 2.00, 3.00)</option>
                        <option value={3}>3 (1.000, 2.000, 3.000)</option>
                    </select>
                </div>
            </div>

            {/* Status information */}
            <div className="ruler-controls__status">
                {rulers.visible ? (
                    <div className="ruler-controls__status-item">
                        <span className="ruler-controls__status-icon ruler-controls__status-icon--active">●</span>
                        <span className="ruler-controls__status-text">
                            Rulers: {UNIT_LABELS[rulers.unit]}
                            {rulers.showMeasurements && ", Measurements: On"}
                        </span>
                    </div>
                ) : (
                    <div className="ruler-controls__status-item">
                        <span className="ruler-controls__status-icon ruler-controls__status-icon--inactive">●</span>
                        <span className="ruler-controls__status-text">Rulers: Off</span>
                    </div>
                )}
            </div>

            {/* Usage hint */}
            <div className="ruler-controls__hint">
                <p className="ruler-controls__hint-text">Select 2+ objects to see distance measurements</p>
            </div>
        </div>
    );
};
