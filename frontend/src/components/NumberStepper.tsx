import React from 'react';
import { IconMinus, IconPlus } from './Icons';
import './NumberStepper.css';

interface NumberStepperProps {
  id: string;
  label: string;
  unit?: string;
  value: number | undefined;
  step?: number;
  min?: number;
  placeholder?: string;
  onChange: (value: number | undefined) => void;
}

const roundToStep = (value: number, step: number) => {
  const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const NumberStepper: React.FC<NumberStepperProps> = ({
  id,
  label,
  unit,
  value,
  step = 0.1,
  min = 0,
  placeholder = '—',
  onChange,
}) => {
  const bump = (direction: 1 | -1) => {
    const base = value ?? 0;
    const next = roundToStep(base + direction * step, step);
    onChange(next < min ? min : next);
  };

  return (
    <div className="number-stepper">
      <div className="number-stepper-label">
        <label htmlFor={id}>{label}</label>
        {unit ? <span className="number-stepper-unit">{unit}</span> : null}
      </div>
      <div className="number-stepper-controls">
        <button
          type="button"
          className="number-stepper-btn"
          aria-label={`Decrease ${label}`}
          onClick={() => bump(-1)}
        >
          <IconMinus size={18} />
        </button>
        <input
          id={id}
          className="number-stepper-input"
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) =>
            onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
          }
        />
        <button
          type="button"
          className="number-stepper-btn"
          aria-label={`Increase ${label}`}
          onClick={() => bump(1)}
        >
          <IconPlus size={18} />
        </button>
      </div>
    </div>
  );
};

export default NumberStepper;
