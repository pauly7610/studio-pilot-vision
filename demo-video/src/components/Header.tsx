import React from "react";
import { colors, styles, typography } from "../designSystem";

interface HeaderProps {
  showBreadcrumb?: boolean;
  breadcrumb?: string[];
}

export const Header: React.FC<HeaderProps> = ({ showBreadcrumb, breadcrumb }) => {
  return (
    <div style={styles.header}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: typography.fontFamily,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Mastercard Logo */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF5F00, #EB001B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.9)",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: colors.foreground }}>
              Studio Intelligence
            </div>
            <div style={{ fontSize: "12px", color: colors.mutedForeground }}>
              North America Portfolio Command Center
            </div>
          </div>
        </div>

        {showBreadcrumb && breadcrumb && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            {breadcrumb.map((item, index) => (
              <React.Fragment key={item}>
                <span
                  style={{
                    color: index === breadcrumb.length - 1 ? colors.foreground : colors.mutedForeground,
                    fontWeight: index === breadcrumb.length - 1 ? 600 : 400,
                  }}
                >
                  {item}
                </span>
                {index < breadcrumb.length - 1 && (
                  <span style={{ color: colors.mutedForeground }}>/</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
