import React from "react";
import { colors, styles } from "../designSystem";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  leftBorder?: string;
  background?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, leftBorder, background }) => {
  return (
    <div
      style={{
        ...styles.card,
        backgroundColor: background || colors.card,
        borderLeft: leftBorder ? `4px solid ${leftBorder}` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon?: string;
  style?: React.CSSProperties;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color = colors.foreground,
  icon,
  style,
}) => {
  return (
    <Card style={{ padding: "24px", ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
          {title}
        </div>
        {icon && (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              color: color,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize: "36px", fontWeight: 700, color, marginBottom: "4px" }}>{value}</div>
      {subtitle && (
        <div style={{ fontSize: "12px", color: colors.mutedForeground }}>{subtitle}</div>
      )}
    </Card>
  );
};
