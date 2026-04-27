import React from "react";
import "./Tag.css";

export type TagKind = "neutral" | "blue" | "purple" | "teal" | "cyan" | "green" | "red" | "yellow" | "cool";

export interface TagProps {
  kind?: TagKind;
  /** Show a colored dot before the label. */
  dot?: boolean;
  /** Visual size; "sm" is the default Carbon-equivalent height. */
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

const Tag: React.FC<TagProps> = ({ kind = "neutral", dot = false, size = "sm", className, children }) => {
  const classes = ["aied-tag", `aied-tag--${kind}`, `aied-tag--${size}`, className ?? ""].filter(Boolean).join(" ");
  return (
    <span className={classes}>
      {dot && <span className="aied-tag__dot" aria-hidden />}
      <span className="aied-tag__label">{children}</span>
    </span>
  );
};

export default Tag;
