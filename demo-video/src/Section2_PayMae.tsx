import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Header } from "./components/Header";
import { Card, MetricCard } from "./components/Card";
import { Badge } from "./components/Badge";
import { Cursor } from "./components/Cursor";
import { Label } from "./components/Label";
import { colors, typography } from "./designSystem";

export const Section2_PayMae: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in: frames 0-15
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Scroll animation: frames 60-210 (2-7 seconds into section)
  const scrollY = interpolate(
    frame,
    [60, 210],
    [0, 200],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Cursor position: frames 60-390
  const cursorX = interpolate(
    frame,
    [60, 210, 300, 390],
    [960, 600, 600, 500],
    { extrapolateRight: "clamp" }
  );
  const cursorY = interpolate(
    frame,
    [60, 210, 300, 390],
    [300, 580, 700, 780],
    { extrapolateRight: "clamp" }
  );
  const cursorVisible = frame >= 60 && frame <= 390;

  // Cursor opacity for fade out
  const cursorOpacity = interpolate(
    frame,
    [360, 390],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: colors.background,
        fontFamily: typography.fontFamily,
        opacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Header
        showBreadcrumb
        breadcrumb={["Portfolio", "Latin America & Caribbean", "Pay-Mae"]}
      />

      <div
        style={{
          padding: "48px",
          paddingTop: "32px",
          transform: `translateY(-${scrollY}px)`,
        }}
      >
        {/* Product Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: colors.foreground, margin: 0 }}>
              Pay-Mae
            </h1>
            <Badge variant="warning">Gate 3-4</Badge>
            <Badge variant="destructive">↓ Declining</Badge>
          </div>
          <p style={{ fontSize: "16px", color: colors.mutedForeground, margin: 0 }}>
            Mobile payment solution for Latin American markets
          </p>
        </div>

        {/* Four Metric Cards - matching ProductDetail.tsx */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <MetricCard
            title="Readiness Score"
            value="62%"
            subtitle="↓ 8% this week"
            color={colors.warning}
            icon="◎"
          />
          <MetricCard
            title="Success Prediction"
            value="71%"
            subtitle="ML Model Confidence"
            color={colors.success}
            icon="↑"
          />
          <MetricCard
            title="Revenue Target"
            value="$2.4M"
            subtitle="Q1 2026 projection"
            color={colors.primary}
            icon="$"
          />
          <MetricCard
            title="Launch Date"
            value="Mar 15"
            subtitle="42 days remaining"
            color={colors.warning}
            icon="📅"
          />
        </div>

        {/* Critical Blockers Card */}
        <Card leftBorder={colors.destructive} style={{ padding: "32px", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "24px",
              fontSize: "18px",
              fontWeight: 600,
              color: colors.foreground,
            }}
          >
            <span>🚨</span>
            Critical Blockers
          </div>

          {/* Blocker 1 */}
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Badge variant="destructive">External Rail</Badge>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: colors.foreground, marginBottom: "8px" }}>
              Blocked by: Stripe Integration
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
              API certification pending • Estimated delay: 3 weeks
            </div>
          </div>

          {/* Blocker 2 */}
          <div
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Badge variant="warning">Regulatory</Badge>
            </div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: colors.foreground, marginBottom: "8px" }}>
              BACEN Compliance Review
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
              Awaiting Central Bank of Brazil approval • In progress
            </div>
          </div>

          {/* Auto-Escalation Alert */}
          <div
            style={{
              backgroundColor: "rgba(255, 107, 0, 0.12)",
              borderRadius: "12px",
              padding: "20px",
              border: `1px solid ${colors.primary}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "20px" }}>⚡</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: colors.primary }}>
                Auto-Escalation Triggered
              </span>
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
              Ambassador Deep Dive scheduled • VP Product notified
            </div>
          </div>
        </Card>
      </div>

      {/* Cursor */}
      {cursorVisible && (
        <div style={{ opacity: cursorOpacity }}>
          <Cursor x={cursorX} y={cursorY} />
        </div>
      )}

      <Label text="External Blocker Visibility • Auto-Escalation" />
    </div>
  );
};
