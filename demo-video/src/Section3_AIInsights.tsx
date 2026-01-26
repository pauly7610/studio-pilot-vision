import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Card } from "./components/Card";
import { Badge } from "./components/Badge";
import { Label } from "./components/Label";
import { colors, typography } from "./designSystem";

export const Section3_AIInsights: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in: frames 0-15
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Query typing: frames 30-90 (1-3 seconds)
  const query = "What's blocking my Q1 launches in Latin America?";
  const queryProgress = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayedQuery = query.slice(0, Math.floor(query.length * queryProgress));

  // Cursor blink
  const cursorVisible = frame < 100 && Math.floor(frame / 15) % 2 === 0;

  // AI response progressive reveal: frames 150-390 (5-13 seconds)
  const responseProgress = interpolate(frame, [150, 390], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Individual element reveals
  const showHeader = responseProgress > 0;
  const showBlocker1 = responseProgress > 0.15;
  const showBlocker2 = responseProgress > 0.4;
  const showBlocker3 = responseProgress > 0.65;
  const showRecommendation = responseProgress > 0.85;
  const showFooter = responseProgress > 0.95;

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
      {/* Header */}
      <div style={{ padding: "48px", paddingBottom: "0" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, color: colors.foreground, margin: 0 }}>
          AI Insights
        </h1>
        <p style={{ fontSize: "16px", color: colors.mutedForeground, margin: "8px 0 32px" }}>
          Knowledge Graph • RAG Pipeline • Causal Reasoning
        </p>
      </div>

      <div style={{ padding: "0 48px" }}>
        {/* Query Input Card */}
        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ fontSize: "14px", color: colors.mutedForeground, marginBottom: "12px" }}>
            Natural Language Query
          </div>
          <div
            style={{
              fontSize: "20px",
              color: colors.foreground,
              fontWeight: 500,
              padding: "16px",
              backgroundColor: colors.muted,
              borderRadius: "8px",
              minHeight: "28px",
            }}
          >
            {displayedQuery}
            {cursorVisible && (
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "24px",
                  backgroundColor: colors.primary,
                  marginLeft: "2px",
                  verticalAlign: "text-bottom",
                }}
              />
            )}
          </div>
        </Card>

        {/* AI Response Card */}
        <Card
          leftBorder={colors.primary}
          style={{ padding: "32px", opacity: showHeader ? 1 : 0 }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "24px" }}>🤖</span>
              <span style={{ fontSize: "18px", fontWeight: 600, color: colors.foreground }}>
                AI Analysis Complete
              </span>
            </div>
            <Badge variant="success">Confidence: 94%</Badge>
          </div>

          {/* Response text */}
          <p style={{ fontSize: "16px", color: colors.foreground, marginBottom: "20px" }}>
            Three critical blockers are impacting your Q1 Latin America launches:
          </p>

          {/* Blocker 1 */}
          <div
            style={{
              borderLeft: `4px solid ${colors.primary}`,
              paddingLeft: "16px",
              marginBottom: "16px",
              opacity: showBlocker1 ? 1 : 0,
              transform: showBlocker1 ? "translateX(0)" : "translateX(-20px)",
              transition: "all 0.3s ease-out",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 600, color: colors.foreground, marginBottom: "4px" }}>
              1. Pay-Mae: External Partner Delay
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
              Stripe API certification pending (3-week delay). This affects 2 additional products
              (PIX Gateway, Nubank Card Issuance).
            </div>
          </div>

          {/* Blocker 2 */}
          <div
            style={{
              borderLeft: `4px solid ${colors.warning}`,
              paddingLeft: "16px",
              marginBottom: "16px",
              opacity: showBlocker2 ? 1 : 0,
              transform: showBlocker2 ? "translateX(0)" : "translateX(-20px)",
              transition: "all 0.3s ease-out",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 600, color: colors.foreground, marginBottom: "4px" }}>
              2. Mercado Pago Connect: Regulatory Approval
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
              BACEN compliance review in progress. Historical data shows 6-8 week average approval time.
            </div>
          </div>

          {/* Blocker 3 */}
          <div
            style={{
              borderLeft: `4px solid ${colors.success}`,
              paddingLeft: "16px",
              marginBottom: "20px",
              opacity: showBlocker3 ? 1 : 0,
              transform: showBlocker3 ? "translateX(0)" : "translateX(-20px)",
              transition: "all 0.3s ease-out",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 600, color: colors.foreground, marginBottom: "4px" }}>
              3. SPEI Mexico: Internal Resource Constraint
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>
              Engineering team at 110% capacity. Recommend shifting 1 FTE from lower-priority project.
            </div>
          </div>

          {/* Recommended Action */}
          <div
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderRadius: "12px",
              padding: "20px",
              opacity: showRecommendation ? 1 : 0,
              transform: showRecommendation ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.3s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "20px" }}>💡</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: colors.success }}>
                Recommended Action
              </span>
            </div>
            <div style={{ fontSize: "14px", color: colors.foreground }}>
              Escalate Stripe blocker to VP level for peer-to-peer conversation. Unblocks $2.4M in
              projected Q1 revenue across 3 products.
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "20px",
              fontSize: "12px",
              color: colors.mutedForeground,
              opacity: showFooter ? 1 : 0,
            }}
          >
            Sources: Product DB (37 products), Jira (428 tickets), Confluence (89 docs)
          </div>
        </Card>
      </div>

      <Label text="Knowledge Graph • 94% Confidence" />
    </div>
  );
};
