import React from "react";
import { styles, colors } from "../designSystem";

interface ProgressProps {
  value: number; // 0-100
  color?: string;
  style?: React.CSSProperties;
}

export const Progress: React.FC<ProgressProps> = ({ value, color, style }) => {
  const fillColor = color || `linear-gradient(90deg, ${colors.primary}, ${colors.primaryGlow})`;

  return (
    <div style={{ ...styles.progressBar.container, ...style }}>
      <div
        style={{
          ...styles.progressBar.fill,
          width: `${value}%`,
          background: fillColor,
        }}
      />
    </div>
  );
};
