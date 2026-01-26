import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Section1_Portfolio } from "./Section1_Portfolio";
import { Section2_PayMae } from "./Section2_PayMae";
import { Section3_AIInsights } from "./Section3_AIInsights";
import { Section4_Feedback } from "./Section4_Feedback";
import { Section5_Closing } from "./Section5_Closing";
import { colors } from "./designSystem";

// Timeline:
// Section 1: Portfolio Dashboard - 0-10 seconds (frames 0-300)
// Section 2: Pay-Mae Detail - 10-25 seconds (frames 300-750)
// Section 3: AI Insights - 25-40 seconds (frames 750-1200)
// Section 4: Feedback Intelligence - 40-50 seconds (frames 1200-1500)
// Section 5: Closing - 50-60 seconds (frames 1500-1800)

const SECTION_TIMINGS = {
  section1: { start: 0, duration: 300 },
  section2: { start: 300, duration: 450 },
  section3: { start: 750, duration: 450 },
  section4: { start: 1200, duration: 300 },
  section5: { start: 1500, duration: 300 },
};

// Transition overlay component for smooth fades
const TransitionOverlay: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();

  // Fade out from previous section (0.5s = 15 frames)
  const opacity = interpolate(
    frame,
    [startFrame - 15, startFrame],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (frame < startFrame - 15 || frame > startFrame) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity,
        zIndex: 100,
      }}
    />
  );
};

export const MSIPDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Section 1: Portfolio Dashboard */}
      <Sequence from={SECTION_TIMINGS.section1.start} durationInFrames={SECTION_TIMINGS.section1.duration}>
        <Section1_Portfolio />
      </Sequence>

      {/* Section 2: Pay-Mae Detail */}
      <Sequence from={SECTION_TIMINGS.section2.start} durationInFrames={SECTION_TIMINGS.section2.duration}>
        <Section2_PayMae />
      </Sequence>

      {/* Section 3: AI Insights */}
      <Sequence from={SECTION_TIMINGS.section3.start} durationInFrames={SECTION_TIMINGS.section3.duration}>
        <Section3_AIInsights />
      </Sequence>

      {/* Section 4: Feedback Intelligence */}
      <Sequence from={SECTION_TIMINGS.section4.start} durationInFrames={SECTION_TIMINGS.section4.duration}>
        <Section4_Feedback />
      </Sequence>

      {/* Section 5: Closing */}
      <Sequence from={SECTION_TIMINGS.section5.start} durationInFrames={SECTION_TIMINGS.section5.duration}>
        <Section5_Closing />
      </Sequence>

      {/* Transition overlays for smooth section changes */}
      <TransitionOverlay startFrame={SECTION_TIMINGS.section2.start} />
      <TransitionOverlay startFrame={SECTION_TIMINGS.section3.start} />
      <TransitionOverlay startFrame={SECTION_TIMINGS.section4.start} />
      <TransitionOverlay startFrame={SECTION_TIMINGS.section5.start} />
    </AbsoluteFill>
  );
};
