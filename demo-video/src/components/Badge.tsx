import React from "react";
import { styles } from "../designSystem";

type BadgeVariant = "warning" | "destructive" | "success" | "primary";

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant, style }) => {
  const variantStyle = styles.badge[variant];

  return (
    <span
      style={{
        ...styles.badge.base,
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
