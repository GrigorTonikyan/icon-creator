import React, { useState, useCallback } from 'react';
import cn from 'classnames';
import { Effect } from '../../../types/editor';
import { EffectUtils } from '../../../utils/effectUtils';
import { ChevronRightIcon, TrashIcon } from './icons';
import { Button } from '../Button/Button';
import './effectControl.css';

interface EffectControlProps {
  effects: Effect[];
  onChange: (effects: Effect[]) => void;
  disabled?: boolean;
  className?: string;
}

export function EffectControl({
  effects,
  onChange,
  disabled = false,
  className
}: EffectControlProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedEffectType, setSelectedEffectType] = useState<string>('drop-shadow');

  const availableEffectTypes: string[] = [
    'drop-shadow',
    'inner-shadow',
    'glow',
    'blur',
    'brightness',
    'contrast',
    'saturation',
    'hue-rotate'
  ];

  const handleAddEffect = useCallback(() => {
    const newEffect = EffectUtils.createDefaultEffect(selectedEffectType);
    onChange([...effects, newEffect]);
  }, [effects, onChange, selectedEffectType]);

  const handleRemoveEffect = useCallback((index: number) => {
    const newEffects = effects.filter((_, i) => i !== index);
    onChange(newEffects);
  }, [effects, onChange]);

  const handleToggleEffect = useCallback((index: number) => {
    const newEffects = effects.map((effect, i) => 
      i === index ? { ...effect, enabled: !effect.enabled } : effect
    );
    onChange(newEffects);
  }, [effects, onChange]);

  const handleEffectChange = useCallback((index: number, updatedEffect: Effect) => {
    const newEffects = effects.map((effect, i) => 
      i === index ? updatedEffect : effect
    );
    onChange(newEffects);
  }, [effects, onChange]);

  const renderEffectProperty = useCallback((
    effect: Effect,
    property: string,
    value: any,
    onChange: (value: any) => void
  ) => {
    const propertyConfig = getPropertyConfig(effect.effect.type, property);
    
    if (!propertyConfig) return null;

    const { label, type, min, max, step } = propertyConfig;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
      onChange(newValue);
    };

    return (
      <div key={property} className="EffectControl__property">
        <label className="EffectControl__property-label">{label}</label>
        {type === 'color' ? (
          <input
            type="color"
            value={value}
            onChange={handleChange}
            className="EffectControl__color-input"
          />
        ) : type === 'range' ? (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="EffectControl__property-input"
          />
        ) : (
          <input
            type={type}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="EffectControl__property-input"
          />
        )}
      </div>
    );
  }, []);

  const renderEffect = useCallback((effect: Effect, index: number) => {
    const effectName = getEffectDisplayName(effect.effect.type);

    const handlePropertyChange = (property: string, value: any) => {
      const updatedEffect = {
        ...effect,
        effect: {
          ...effect.effect,
          [property]: value
        }
      };
      handleEffectChange(index, updatedEffect);
    };

    return (
      <div key={effect.id} className="EffectControl__effect-item">
        <div className="EffectControl__effect-header">
          <span className="EffectControl__effect-name">{effectName}</span>
          <div className="EffectControl__effect-controls">
            <input
              type="checkbox"
              checked={effect.enabled}
              onChange={() => handleToggleEffect(index)}
              className="EffectControl__effect-enabled"
            />
            <button
              onClick={() => handleRemoveEffect(index)}
              className="EffectControl__effect-remove"
              title="Remove effect"
            >
              <TrashIcon size={12} />
            </button>
          </div>
        </div>
        
        <div className="EffectControl__effect-properties">
          {getEffectProperties(effect.effect.type).map(property => 
            renderEffectProperty(
              effect,
              property,
              (effect.effect as any)[property],
              (value) => handlePropertyChange(property, value)
            )
          )}
        </div>
      </div>
    );
  }, [handleEffectChange, handleToggleEffect, handleRemoveEffect, renderEffectProperty]);

  const combinedFilters = EffectUtils.effectsToCSSFilter(effects);

  const effectControlCn = cn(
    'EffectControl',
    {
      'EffectControl--disabled': disabled
    },
    className
  );

  return (
    <div className={effectControlCn}>
      <div className="EffectControl__header">
        <span className="EffectControl__label">Effects</span>
        <button
          className={cn('EffectControl__toggle', {
            'EffectControl__toggle--expanded': isExpanded
          })}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronRightIcon size={12} />
        </button>
      </div>

      <div className={cn('EffectControl__content', {
        'EffectControl__content--collapsed': !isExpanded
      })}>
        <div className="EffectControl__effects">
          {effects.map(renderEffect)}
        </div>

        <div className="EffectControl__add-effect">
          <select
            value={selectedEffectType}
            onChange={(e) => setSelectedEffectType(e.target.value)}
            className="EffectControl__add-select"
          >
            {availableEffectTypes.map(type => (
              <option key={type} value={type}>
                {getEffectDisplayName(type)}
              </option>
            ))}
          </select>
          <Button
            onClick={handleAddEffect}
            size="sm"
            className="EffectControl__add-btn"
          >
            Add Effect
          </Button>
        </div>

        {effects.length > 0 && (
          <div className="EffectControl__preview">
            <div className="EffectControl__preview-label">Preview</div>
            <div 
              className="EffectControl__preview-sample"
              style={{ filter: combinedFilters }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getEffectDisplayName(type: string): string {
  const names: Record<string, string> = {
    'drop-shadow': 'Drop Shadow',
    'inner-shadow': 'Inner Shadow',
    'glow': 'Glow',
    'blur': 'Blur',
    'brightness': 'Brightness',
    'contrast': 'Contrast',
    'saturation': 'Saturation',
    'hue-rotate': 'Hue Rotate'
  };
  return names[type] || type;
}

function getEffectProperties(type: string): string[] {
  const properties: Record<string, string[]> = {
    'drop-shadow': ['offsetX', 'offsetY', 'blur', 'color'],
    'inner-shadow': ['offsetX', 'offsetY', 'blur', 'color'],
    'glow': ['blur', 'color'],
    'blur': ['radius'],
    'brightness': ['value'],
    'contrast': ['value'],
    'saturation': ['value'],
    'hue-rotate': ['degrees']
  };
  return properties[type] || [];
}

interface PropertyConfig {
  label: string;
  type: 'number' | 'range' | 'color';
  min?: number;
  max?: number;
  step?: number;
}

function getPropertyConfig(effectType: string, property: string): PropertyConfig | null {
  const configs: Record<string, PropertyConfig> = {
    offsetX: { label: 'Offset X', type: 'range', min: -50, max: 50, step: 1 },
    offsetY: { label: 'Offset Y', type: 'range', min: -50, max: 50, step: 1 },
    blur: { label: 'Blur', type: 'range', min: 0, max: 20, step: 0.1 },
    radius: { label: 'Radius', type: 'range', min: 0, max: 20, step: 0.1 },
    color: { label: 'Color', type: 'color' },
    value: { label: 'Value', type: 'range', min: 0, max: 200, step: 1 },
    degrees: { label: 'Degrees', type: 'range', min: 0, max: 360, step: 1 }
  };

  return configs[property] || null;
}