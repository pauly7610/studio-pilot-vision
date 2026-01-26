import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface CursorProps {
  x: number;
  y: number;
  visible?: boolean;
}

export const Cursor: React.FC<CursorProps> = ({ x, y, visible = true }) => {
  const frame = useCurrentFrame();

  // Subtle pulse animation
  const pulse = interpolate(
    frame % 30,
    [0, 15, 30],
    [1, 1.1, 1],
    { extrapolateRight: "clamp" }
  );

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 20 * pulse,
        height: 20 * pulse,
        background: "rgba(255, 107, 0, 0.8)",
        borderRadius: "50%",
        border: "2px solid white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        pointerEvents: "none",
        zIndex: 9999,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};
