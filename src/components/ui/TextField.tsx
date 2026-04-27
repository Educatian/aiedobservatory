import React from "react";
import "./TextField.css";

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  size?: "sm" | "md";
  /** Optional shortcut hint shown at the right edge (e.g. "⌘K"). */
  shortcut?: string;
  /** Visible label rendered above the field. */
  label?: string;
  /** Helper / error text below the field. */
  helper?: string;
  invalid?: boolean;
  containerClassName?: string;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      iconLeft,
      iconRight,
      size = "md",
      shortcut,
      label,
      helper,
      invalid = false,
      className,
      containerClassName,
      id,
      ...rest
    },
    ref,
  ) => {
    const generated = React.useId();
    const inputId = id ?? generated;
    const wrapperClasses = [
      "aied-textfield",
      `aied-textfield--${size}`,
      invalid ? "aied-textfield--invalid" : "",
      containerClassName ?? "",
    ].filter(Boolean).join(" ");

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="aied-textfield__label">
            {label}
          </label>
        )}
        <div className="aied-textfield__field">
          {iconLeft && <span className="aied-textfield__icon">{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`aied-textfield__input ${className ?? ""}`}
            aria-invalid={invalid || undefined}
            {...rest}
          />
          {shortcut && <span className="aied-textfield__shortcut">{shortcut}</span>}
          {iconRight && <span className="aied-textfield__icon">{iconRight}</span>}
        </div>
        {helper && (
          <span className={`aied-textfield__helper${invalid ? " aied-textfield__helper--error" : ""}`}>
            {helper}
          </span>
        )}
      </div>
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
