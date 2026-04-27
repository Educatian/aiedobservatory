import React from "react";
import "./SegmentControl.css";

export interface SegmentOption<V extends string = string> {
  value: V;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentControlProps<V extends string = string> {
  value: V;
  onChange: (next: V) => void;
  options: SegmentOption<V>[];
  /** Optional accessible name for the group. */
  ariaLabel?: string;
  className?: string;
}

function SegmentControl<V extends string = string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SegmentControlProps<V>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`aied-segment ${className ?? ""}`.trim()}>
      {options.map(o => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`aied-segment__opt${selected ? " aied-segment__opt--selected" : ""}`}
          >
            {o.icon && <span className="aied-segment__icon">{o.icon}</span>}
            <span className="aied-segment__label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentControl;
