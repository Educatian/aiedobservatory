import React from "react";
import "./Btn.css";

export type BtnKind = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
export type BtnSize = "sm" | "md" | "lg";

export interface BtnProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  kind?: BtnKind;
  size?: BtnSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Render with the AIED brand gradient (only meaningful for kind="primary"). */
  gradient?: boolean;
  /** Visual pressed state for ghost buttons used as toggles. */
  active?: boolean;
  /** Render an icon-only button (square, no padding). */
  iconOnly?: boolean;
  type?: "button" | "submit" | "reset";
}

const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
  (
    {
      kind = "primary",
      size = "md",
      iconLeft,
      iconRight,
      gradient = false,
      active = false,
      iconOnly = false,
      type = "button",
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "aied-btn",
      `aied-btn--${kind}`,
      `aied-btn--${size}`,
      gradient ? "aied-btn--gradient" : "",
      active ? "aied-btn--active" : "",
      iconOnly ? "aied-btn--icon-only" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} type={type} className={classes} {...rest}>
        {iconLeft && <span className="aied-btn__icon">{iconLeft}</span>}
        {children && <span className="aied-btn__label">{children}</span>}
        {iconRight && <span className="aied-btn__icon">{iconRight}</span>}
      </button>
    );
  },
);

Btn.displayName = "Btn";

export default Btn;
