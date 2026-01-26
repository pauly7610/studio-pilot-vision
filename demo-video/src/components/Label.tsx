import React from "react";
import { colors } from "../designSystem";

interface LabelProps {
  text: string;
}

export const Label: React.FC<LabelProps> = ({ text }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "48px",
        right: "48px",
        backgroundColor: "rgba(255, 107, 0, 0.1)",
        color: colors.primary,
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        border: `1px solid ${colors.primary}`,
      }}
    >
      {text}
    </div>
  );
};
