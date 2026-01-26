import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Header } from "./components/Header";
import { Card, MetricCard } from "./components/Card";
import { Label } from "./components/Label";
import { colors, typography } from "./designSystem";

export const Section1_Portfolio: React.FC = () => {
  const frame = useCurrentFrame();
  const fps = 30;

  // Fade in entire section
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: "clamp" });

  // Risk Intelligence animation - stagger reveal
  const riskCardsOpacity = interpolate(frame, [fps * 0.8, fps * 1.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3-week forecast items
  const forecastItems = [
    { name: "Caribbean Tourism Hub", current: "22%", projected: "7%", loss: "-$0.5M" },
    { name: "AfriGo Integration", current: "38%", projected: "23%", loss: "-$0.7M" },
    { name: "Agent Pay", current: "25%", projected: "10%", loss: "-$0.7M" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: colors.background,
        fontFamily: typography.fontFamily,
        opacity,
        position: "relative",
      }}
    >
      <Header />

      <div style={{ padding: "48px", paddingTop: "24px" }}>
        {/* Section Heading */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: colors.mutedForeground,
            marginBottom: "20px",
          }}
        >
          Portfolio Snapshot
        </div>

        {/* Four Metric Cards - matching actual app screenshots */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <MetricCard
            title="Total Revenue"
            value="$56.2M"
            subtitle="↑ 18.2% vs last quarter"
            color={colors.success}
            icon="$"
          />
          <MetricCard
            title="Active Products"
            value="37"
            subtitle="37 in portfolio"
            color={colors.primary}
            icon="◎"
          />
          <MetricCard
            title="Launch Success Rate"
            value="73%"
            subtitle="↓ 4.3% vs last quarter"
            color={colors.warning}
            icon="✓"
          />
          <MetricCard
            title="High Risk Products"
            value="10"
            subtitle="10 require attention"
            color={colors.destructive}
            icon="⚠"
          />
        </div>

        {/* Risk Intelligence Section - KEY DIFFERENTIATOR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            opacity: riskCardsOpacity,
          }}
        >
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <span style={{ fontSize: "18px", fontWeight: 600, color: colors.foreground }}>
            Risk Intelligence
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1.2fr",
            gap: "20px",
            opacity: riskCardsOpacity,
          }}
        >
          {/* Revenue at Risk Card */}
          <Card
            leftBorder={colors.destructive}
            style={{
              padding: "24px",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ color: colors.destructive, fontSize: "14px" }}>$</span>
              <span style={{ fontSize: "14px", color: colors.mutedForeground }}>Revenue at Risk</span>
            </div>
            <div style={{ fontSize: "42px", fontWeight: 700, color: colors.destructive, marginBottom: "8px" }}>
              $390.4M
            </div>
            <div style={{ fontSize: "13px", color: colors.mutedForeground }}>
              37 high-risk products
            </div>
          </Card>

          {/* Escalation Cost Card */}
          <Card
            leftBorder={colors.warning}
            style={{
              padding: "24px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ color: colors.warning, fontSize: "14px" }}>⏱</span>
              <span style={{ fontSize: "14px", color: colors.mutedForeground }}>Escalation Cost</span>
            </div>
            <div style={{ fontSize: "42px", fontWeight: 700, color: colors.warning, marginBottom: "8px" }}>
              $1.5M
            </div>
            <div style={{ fontSize: "13px", color: colors.mutedForeground }}>
              ~20 days avg delay • $15K/day
            </div>
          </Card>

          {/* 3-Week Inaction Forecast Card */}
          <Card style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ color: colors.primary, fontSize: "14px" }}>⚡</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: colors.foreground }}>
                3-Week Inaction Forecast
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {forecastItems.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: colors.foreground, fontWeight: 500 }}>{item.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: colors.mutedForeground }}>{item.current}</span>
                    <span style={{ color: colors.destructive }}>→ {item.projected}</span>
                    <span
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: colors.destructive,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {item.loss}
                    </span>
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  borderTop: `1px solid ${colors.border}`,
                  fontSize: "13px",
                }}
              >
                <span style={{ color: colors.mutedForeground }}>Total potential loss</span>
                <span style={{ color: colors.destructive, fontWeight: 700 }}>-$1.9M</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Label text="Self-Service Visibility • Risk Quantification" />
    </div>
  );
};
