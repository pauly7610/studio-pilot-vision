import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Card } from "./components/Card";
import { Badge } from "./components/Badge";
import { Progress } from "./components/Progress";
import { Label } from "./components/Label";
import { colors, typography } from "./designSystem";

export const Section4_Feedback: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in: frames 0-15
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Sentiment cards scale in: frames 30-90 (1-3 seconds)
  const cardScale = interpolate(frame, [30, 90], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Theme bars fill: frames 120-240 (4-8 seconds)
  const barProgress = interpolate(frame, [120, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const themes = [
    { name: "Integration Complexity", count: 127, percent: 100, color: colors.destructive },
    { name: "Time-to-Value", count: 98, percent: 77, color: colors.success },
    { name: "Documentation Quality", count: 84, percent: 66, color: colors.warning },
    { name: "API Performance", count: 76, percent: 60, color: colors.success },
    { name: "Support Response Time", count: 63, percent: 50, color: colors.destructive },
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
        overflow: "hidden",
      }}
    >
      {/* Header with Volume Badge */}
      <div style={{ padding: "48px", paddingBottom: "0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>💬</span>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: colors.foreground, margin: 0 }}>
              Customer Feedback Intelligence
            </h1>
          </div>
          {/* Volume Badge - Shows systematic capture */}
          <div
            style={{
              backgroundColor: "rgba(255, 107, 0, 0.1)",
              border: `1px solid ${colors.primary}`,
              borderRadius: "8px",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: 700, color: colors.primary }}>114</span>
            <span style={{ fontSize: "14px", color: colors.mutedForeground }}>feedback items captured</span>
          </div>
        </div>
        <p style={{ fontSize: "16px", color: colors.mutedForeground, margin: "8px 0 24px" }}>
          Systematic capture across all customer touchpoints • Auto-classified by sentiment & theme
        </p>
      </div>

      <div style={{ padding: "0 48px" }}>
        {/* Sentiment Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            marginBottom: "24px",
            opacity: cardOpacity,
            transform: `scale(${cardScale})`,
          }}
        >
          {/* Positive */}
          <Card
            style={{
              padding: "28px",
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "16px" }}>👍</span>
              <span style={{ fontSize: "14px", color: colors.mutedForeground }}>Positive</span>
            </div>
            <div style={{ fontSize: "44px", fontWeight: 700, color: colors.success, marginBottom: "4px" }}>
              73%
            </div>
            <div style={{ fontSize: "14px", color: colors.success }}>↑ 8% vs last quarter</div>
          </Card>

          {/* Neutral */}
          <Card
            style={{
              padding: "28px",
              background: "linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 107, 0, 0.05))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "16px" }}>😐</span>
              <span style={{ fontSize: "14px", color: colors.mutedForeground }}>Neutral</span>
            </div>
            <div style={{ fontSize: "44px", fontWeight: 700, color: colors.primary, marginBottom: "4px" }}>
              19%
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>→ Stable</div>
          </Card>

          {/* Negative */}
          <Card
            style={{
              padding: "28px",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "16px" }}>👎</span>
              <span style={{ fontSize: "14px", color: colors.mutedForeground }}>Negative</span>
            </div>
            <div style={{ fontSize: "44px", fontWeight: 700, color: colors.destructive, marginBottom: "4px" }}>
              8%
            </div>
            <div style={{ fontSize: "14px", color: colors.success }}>↓ 3% vs last quarter</div>
          </Card>
        </div>

        {/* Top Themes Card */}
        <Card style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: colors.foreground }}>
              Top Customer Themes (Last 30 Days)
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Badge variant="primary">Auto-Clustered</Badge>
              <Badge variant="success">Actionable</Badge>
            </div>
          </div>

          {themes.map((theme, index) => (
            <div
              key={theme.name}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 110px 1fr",
                alignItems: "center",
                gap: "16px",
                marginBottom: index < themes.length - 1 ? "16px" : 0,
              }}
            >
              {/* Theme name with colored dot */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: theme.color,
                  }}
                />
                <span style={{ fontSize: "14px", fontWeight: 500, color: colors.foreground }}>
                  {theme.name}
                </span>
              </div>

              {/* Count */}
              <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
                {theme.count} mentions
              </div>

              {/* Progress bar */}
              <Progress
                value={theme.percent * barProgress}
                color={theme.color}
                style={{ height: "10px" }}
              />
            </div>
          ))}
        </Card>
      </div>

      <Label text="Systematic Customer Voice • Scalable Feedback Loop" />
    </div>
  );
};
