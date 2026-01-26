import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Card } from "./components/Card";
import { colors, typography } from "./designSystem";

export const Section5_Closing: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in + scale: frames 0-60 (0-2 seconds)
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleScale = interpolate(frame, [0, 60], [1.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cards fade in sequentially: frames 60-150 (2-5 seconds)
  const card1Opacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card2Opacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const card3Opacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL appears: frames 180-300 (6-10 seconds)
  const urlOpacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle glow pulse for URL
  const glowIntensity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.6, 0.3],
    { extrapolateRight: "clamp" }
  );

  const valueCards = [
    {
      emoji: "📊",
      title: "Self-Service Visibility",
      text: "No more ad-hoc status requests",
      borderColor: colors.success,
    },
    {
      emoji: "⚠️",
      title: "Risk Quantification",
      text: "Know the cost of inaction before it's too late",
      borderColor: colors.warning,
    },
    {
      emoji: "💬",
      title: "Scalable Feedback Loop",
      text: "Systematic customer voice capture",
      borderColor: colors.primary,
    },
  ];

  const cardOpacities = [card1Opacity, card2Opacity, card3Opacity];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(to bottom right, hsl(0, 0%, 100%), hsl(220, 13%, 97%))",
        fontFamily: typography.fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px",
        position: "relative",
      }}
    >
      {/* Main Title with Gradient */}
      <h1
        style={{
          fontSize: "56px",
          fontWeight: 700,
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryGlow})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: 0,
          marginBottom: "24px",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textAlign: "center",
        }}
      >
        Studio Intelligence Platform
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: "22px",
          color: colors.mutedForeground,
          textAlign: "center",
          maxWidth: "900px",
          lineHeight: 1.5,
          margin: 0,
          marginBottom: "48px",
          opacity: titleOpacity,
        }}
      >
        Production-ready prototype demonstrating pipeline visibility, go-to-market readiness,
        and scalable customer feedback infrastructure for North America
      </p>

      {/* Three Value Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "32px",
          marginBottom: "64px",
          width: "100%",
          maxWidth: "1000px",
        }}
      >
        {valueCards.map((card, index) => (
          <Card
            key={card.title}
            style={{
              padding: "32px",
              textAlign: "center",
              borderTop: `4px solid ${card.borderColor}`,
              opacity: cardOpacities[index],
              transform: `translateY(${(1 - cardOpacities[index]) * 20}px)`,
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>{card.emoji}</div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: colors.foreground,
                marginBottom: "8px",
              }}
            >
              {card.title}
            </div>
            <div style={{ fontSize: "14px", color: colors.mutedForeground }}>{card.text}</div>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div style={{ textAlign: "center", opacity: urlOpacity }}>
        <p style={{ fontSize: "20px", color: colors.mutedForeground, margin: 0, marginBottom: "16px" }}>
          Explore the live demo
        </p>
        <div
          style={{
            display: "inline-block",
            fontSize: "32px",
            fontWeight: 700,
            color: colors.primary,
            padding: "16px 32px",
            borderRadius: "12px",
            border: `2px solid ${colors.primary}`,
            backgroundColor: `rgba(255, 107, 0, ${glowIntensity * 0.15})`,
            boxShadow: `0 0 ${30 * glowIntensity}px rgba(255, 107, 0, ${glowIntensity * 0.3})`,
          }}
        >
          studio-pilot-vision.lovable.app
        </div>
      </div>
    </div>
  );
};
