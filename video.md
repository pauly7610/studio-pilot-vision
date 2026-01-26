I have the studio-pilot-vision repository open. I want to add a Remotion demo video to this project.

Create a new directory called `demo-video` in the root of this repo and set up a Remotion project inside it using:

npx create-video@latest demo-video --template=blank

Then, using the detailed specifications in the file I'm about to share, build a 60-second demo video that showcases the MSIP platform. The video should:

1. Match the exact design system from src/index.css (colors, typography, components)
2. Show 5 sections: Portfolio Dashboard → Pay-Mae Detail → AI Insights → Feedback Intelligence → Closing
3. Have smooth animations and transitions
4. Output as MP4 at 1920x1080, 30fps

Here are the complete specifications:

[Paste the entire Claude_Code_Remotion_Prompt.md contents here]

# Prompt for Claude Code: Build MSIP Demo Video with Remotion

## Project Overview
Build a 60-second Remotion video showcasing the Mastercard Studio Intelligence Platform (MSIP) for a product management interview case study presentation. The video must authentically replicate the UI design from the live site at studio-pilot-vision.lovable.app and demonstrate how MSIP solves the Pay-Mae crisis scenario.

---

## Technical Requirements

### Remotion Setup
- **Duration:** 60 seconds (1800 frames at 30fps)
- **Resolution:** 1920x1080 (Full HD)
- **FPS:** 30
- **Codec:** H.264 for maximum compatibility
- **Output:** MP4 file

### Tech Stack
```json
{
  "remotion": "^4.0.x",
  "@remotion/cli": "^4.0.x", 
  "react": "^19.x",
  "react-dom": "^19.x",
  "typescript": "^5.x"
}
```

---

## Design System (CRITICAL - Must Match Exactly)

### Color Palette (HSL Values)
```typescript
const colors = {
  // Mastercard Brand Colors
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(220, 26%, 14%)',
  primary: 'hsl(14, 100%, 57%)',        // Mastercard Orange
  primaryGlow: 'hsl(14, 100%, 67%)',
  secondary: 'hsl(220, 26%, 14%)',      // Navy Corporate
  
  // Semantic Colors
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',
  
  // UI Elements
  card: 'hsl(0, 0%, 100%)',
  border: 'hsl(220, 13%, 91%)',
  muted: 'hsl(220, 13%, 95%)',
  mutedForeground: 'hsl(220, 9%, 46%)',
  
  // Gradients
  gradient: 'linear-gradient(to br, hsl(0, 0%, 100%), hsl(220, 13%, 97%))',
  cardGradient: 'linear-gradient(135deg, hsl(30, 41%, 18%), hsl(15, 23%, 10%))',
};
```

### Typography
- **Font Family:** `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Headers:** Font weight 700, tracking tight
- **Body:** Font weight 400-500
- **Key metrics:** Font weight 700

### Component Styling

#### Card Component
```typescript
{
  backgroundColor: colors.card,
  borderRadius: '12px',
  border: `1px solid ${colors.border}`,
  boxShadow: '0 4px 20px -2px rgba(51, 65, 85, 0.08)',
  overflow: 'hidden',
}
```

#### Badge Component
```typescript
{
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  border: '1.5px solid',
}

// Variants:
- warning: bg rgba(245, 158, 11, 0.1), text hsl(38, 92%, 50%)
- destructive: bg rgba(239, 68, 68, 0.1), text hsl(0, 84%, 60%)
- success: bg rgba(34, 197, 94, 0.1), text hsl(142, 76%, 36%)
```

#### Progress Bar
```typescript
{
  height: '12px',
  background: colors.muted,
  borderRadius: '9999px',
  overflow: 'hidden',
}
// Fill:
{
  background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryGlow})`,
  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
}
```

#### Header (Sticky)
```typescript
{
  borderBottom: `1px solid ${colors.border}`,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(8px)',
  padding: '16px 48px',
}
```

---

## Video Structure & Timing

### Section 1: Portfolio Dashboard (0-10 seconds, frames 0-300)

**Visual Elements:**
- Sticky header with Mastercard logo (40px circular gradient orange/red)
- Title: "Studio Intelligence" (24px, bold)
- Subtitle: "North America Portfolio Command Center" (12px, muted)
- Section heading: "Portfolio Snapshot" (18px, semibold, muted color)

**Four Metric Cards (Grid layout):**
1. Total Revenue: $56.2M (green), ↑ 18.2% vs last quarter
2. Active Products: 37 (orange), 37 in portfolio
3. Launch Success Rate: 73% (warning), ↓ 4.3% vs last quarter
4. High Risk Products: 10 (red), 10 require attention

**Risk Intelligence Section (KEY DIFFERENTIATOR):**
Header: ⚠️ Risk Intelligence

**Three cards in grid:**
1. **Revenue at Risk Card (Red left border, red gradient bg):**
   - Title: "Revenue at Risk"
   - Value: $390.4M (42px, red, bold)
   - Subtitle: "37 high-risk products"

2. **Escalation Cost Card (Warning left border, warning gradient bg):**
   - Title: "Escalation Cost"
   - Value: $1.5M (42px, warning, bold)
   - Subtitle: "~20 days avg delay • $15K/day"

3. **3-Week Inaction Forecast Card:**
   - Title: "3-Week Inaction Forecast"
   - Three product rows with current %, projected %, and loss:
     - Caribbean Tourism Hub: 22% → 7%, -$0.5M
     - AfriGo Integration: 38% → 23%, -$0.7M
     - Agent Pay: 25% → 10%, -$0.7M
   - Footer: "Total potential loss: -$1.9M"

**Bottom-right label:** "Self-Service Visibility • Risk Quantification" (orange badge)

**Animation:**
- Fade in entire screen: 0-0.5s
- Risk Intelligence cards stagger in: 0.8-1.5s
- No cursor movement yet - let visuals breathe

**Interview Talking Point:** This directly addresses the case study's "I don't know this product" problem. PMs no longer need to ask for status - they have self-service visibility with quantified business impact.

---

### Section 2: Product Detail View - Pay-Mae (10-25 seconds, frames 300-750)

**Breadcrumb:** Portfolio → Latin America & Caribbean → Pay-Mae

**Product Header:**
- H1: "Pay-Mae" (32px bold)
- Badges: "Gate 3-4" (warning), "↓ Declining" (destructive)
- Description: "Mobile payment solution for Latin American markets" (16px muted)

**Three Metric Cards:**
1. Readiness Score: 62% (warning orange), ↓ 8% this week
2. Launch Risk: High (red), 3 critical blockers
3. VIP Customer: Yes (green), Contract pending

**Critical Blockers Card (Red left border):**
Header: 🚨 Critical Blockers

**Blocker 1 (Red background):**
- Badge: "External Rail" (destructive)
- Title: "Blocked by: Stripe Integration"
- Details: "API certification pending • Estimated delay: 3 weeks"

**Blocker 2 (Red background):**
- Badge: "Regulatory" (warning)
- Title: "BACEN Compliance Review"
- Details: "Awaiting Central Bank of Brazil approval • In progress"

**Auto-Escalation Alert (Orange background):**
- Icon: ⚡
- Title: "Auto-Escalation Triggered" (orange text, bold)
- Details: "Ambassador Deep Dive scheduled • VP Product notified"

**Bottom-right label:** "External Blocker Visibility • Auto-Escalation"

**Animation:**
- Fade in: 10-10.5s
- Cursor movement simulating scroll: 12-17s (smooth downward motion to reveal blockers)
- Pause on auto-escalation: 18-24s

---

### Section 3: AI Insights (25-40 seconds, frames 750-1200)

**Header:**
- Title: "AI Insights" (32px)
- Subtitle: "Knowledge Graph • RAG Pipeline • Causal Reasoning"

**Query Input Card:**
- Label: "Natural Language Query" (14px muted)
- Typed text animation: "What's blocking my Q1 launches in Latin America?"
- Typing cursor effect during animation

**AI Response Card (Orange left border):**

**Header row:**
- Icon: 🤖 AI Analysis Complete
- Badge: "Confidence: 94%" (green)

**Response text:**
"Three critical blockers are impacting your Q1 Latin America launches:"

**Blocker 1 (Orange left border):**
- Title: "1. Pay-Mae: External Partner Delay"
- Text: "Stripe API certification pending (3-week delay). This affects 2 additional products (PIX Gateway, Nubank Card Issuance)."

**Blocker 2 (Warning left border):**
- Title: "2. Mercado Pago Connect: Regulatory Approval"
- Text: "BACEN compliance review in progress. Historical data shows 6-8 week average approval time."

**Blocker 3 (Green left border):**
- Title: "3. SPEI Mexico: Internal Resource Constraint"
- Text: "Engineering team at 110% capacity. Recommend shifting 1 FTE from lower-priority project."

**Recommended Action Card (Green background):**
- Icon: 💡
- Title: "Recommended Action" (green, bold)
- Text: "Escalate Stripe blocker to VP level for peer-to-peer conversation. Unblocks $2.4M in projected Q1 revenue across 3 products."

**Footer:** "Sources: Product DB (37 products), Jira (428 tickets), Confluence (89 docs)" (12px muted)

**Bottom-right label:** "Knowledge Graph • 94% Confidence"

**Animation:**
- Fade in: 25-25.5s
- Query typing: 26-28s (character by character with cursor)
- AI response streaming: 30-38s (progressive reveal, not instant)
- Pause on recommendation: 38-39s

---

### Section 4: Feedback Intelligence (40-50 seconds, frames 1200-1500)

**Header with Volume Badge:**
- Icon: 💬
- Title: "Customer Feedback Intelligence" (32px, bold)
- Volume Badge (right side): "114" (20px, bold, orange) + "feedback items captured" (14px, muted)
- Subtitle: "Systematic capture across all customer touchpoints • Auto-classified by sentiment & theme"

**Three Sentiment Cards (Gradient backgrounds, with emoji icons):**
1. 👍 Positive: 73% (green gradient), ↑ 8% vs last quarter
2. 😐 Neutral: 19% (orange gradient), → Stable  
3. 👎 Negative: 8% (red gradient), ↓ 3% vs last quarter

**Top Themes Card:**
Header row with title + badges:
- Title: "Top Customer Themes (Last 30 Days)"
- Badges: "Auto-Clustered" (primary), "Actionable" (success)

**Five theme rows (each with colored dot, name, count, progress bar):**
1. Integration Complexity - 127 mentions (red dot, red bar at 100%)
2. Time-to-Value - 98 mentions (green dot, green bar at ~77%)
3. Documentation Quality - 84 mentions (orange dot, orange bar at ~66%)
4. API Performance - 76 mentions (green dot, green bar at ~60%)
5. Support Response Time - 63 mentions (red dot, red bar at ~50%)

**Bottom-right label:** "Systematic Customer Voice • Scalable Feedback Loop"

**Animation:**
- Fade in: 40-40.5s
- Sentiment cards scale in: 41-43s (slight zoom effect)
- Theme bars fill: 44-48s (progressive left-to-right fill)

**Interview Talking Point:** This directly addresses the Sales EVP's request from the case study: "a customer feedback loop that scales beyond this product." The 114 items shows systematic capture, not ad-hoc collection.

---

### Section 5: Closing (50-60 seconds, frames 1500-1800)

**Centered layout, white background gradient:**

**Main title (Gradient text orange to orange-glow):**
"Studio Intelligence Platform" (56px, bold)

**Subtitle:**
"Production-ready prototype demonstrating pipeline visibility, go-to-market readiness, and scalable customer feedback infrastructure for North America" (22px, centered, max-width 900px)

**Three Value Cards (Grid layout, white cards with colored top borders) - ALIGNED TO CASE STUDY:**

**Card 1 (Green border):**
- Emoji: 📊
- Title: "Self-Service Visibility" (20px bold)
- Text: "No more ad-hoc status requests" (14px muted)

**Card 2 (Warning border):**
- Emoji: ⚠️  
- Title: "Risk Quantification"
- Text: "Know the cost of inaction before it's too late"

**Card 3 (Orange/Primary border):**
- Emoji: 💬
- Title: "Scalable Feedback Loop"
- Text: "Systematic customer voice capture"

**Bottom section:**
- Text: "Explore the live demo" (20px, muted)
- URL box: "studio-pilot-vision.lovable.app" (32px, bold, orange text, orange border, light orange background with pulsing glow)

**Animation:**
- Fade in + scale: 50-52s (title zooms in slightly)
- Cards fade in sequentially: 52-55s (left, center, right)
- URL appears: 56-60s (fade + subtle glow pulse)

**Interview Talking Point:** Each value card maps to a case study problem: visibility (Maria didn't know the product), risk quantification (no readiness framework), and feedback loop (Sales EVP request).

---

## Animation Principles

### Global Animations
- **Fade transitions:** 0.5s ease-out between sections
- **Cursor movement:** Smooth bezier curves, not linear
- **Text typing:** 40ms per character with blinking cursor
- **Progress bars:** Ease-out fill animation
- **Card entrances:** Subtle scale (1.05 → 1.0) with fade

### Interpolation Examples
```typescript
// Fade in
const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: 'clamp' });

// Cursor movement
const cursorX = interpolate(frame, [fps * 2, fps * 5], [100, 800], { extrapolateRight: 'clamp' });

// Typing effect
const displayedText = query.slice(0, Math.floor(query.length * progress));
```

### Timing Best Practices
- Hold key frames for 2-3 seconds (60-90 frames)
- Transition between sections: 0.5s overlap for smoothness
- No sudden cuts - always fade or blend

---

## Cursor Simulation

**Only show cursor in Section 2 (Pay-Mae detail):**

```typescript
const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{
    position: 'absolute',
    left: x,
    top: y,
    width: 20,
    height: 20,
    background: 'rgba(255, 107, 0, 0.8)',
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    zIndex: 9999,
  }}
/>
);
```

**Movement path:**
- Start: Near top of Pay-Mae card (frame 360)
- Scroll down to blockers section (frames 360-510)
- Hover on "Blocked by: Stripe" (frames 510-600)
- Move to auto-escalation alert (frames 600-690)
- Fade out (frames 690-750)

---

## Data to Display

### Products Referenced
- Pay-Mae (Latin America)
- PIX Gateway (Brazil)
- Nubank Card Issuance (Brazil)
- Mercado Pago Connect (LATAM)
- SPEI Mexico (Mexico)

### Regulatory Bodies
- BACEN (Central Bank of Brazil)
- Banxico (Bank of Mexico)

### Partner/External Dependencies
- Stripe (External Rail blocker)

### Metrics
- Total Revenue: $56.2M (↑ 18.2%)
- Active Products: 37
- Launch Success Rate: 73% (↓ 4.3%)
- High Risk Products: 10
- Revenue at Risk: $390.4M
- Escalation Cost: $1.5M (~20 days avg delay)
- 3-Week Inaction Loss: $1.9M
- Pay-Mae Readiness: 62%
- AI Confidence: 94%
- Revenue Impact (AI recommendation): $2.4M
- Positive Sentiment: 73%
- Feedback Items Captured: 114

---

## File Structure

```
msip-demo/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── src/
│   ├── index.tsx           # Entry point
│   ├── Root.tsx            # Composition registration
│   ├── MSIPDemo.tsx        # Main component with Sequences
│   ├── Section1_Portfolio.tsx
│   ├── Section2_PayMae.tsx
│   ├── Section3_AIInsights.tsx
│   ├── Section4_Feedback.tsx
│   ├── Section5_Closing.tsx
│   └── components/
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Progress.tsx
│       └── Cursor.tsx
└── out/
    └── msip-demo.mp4      # Final output
```

---

## Rendering Commands

```bash
# Preview in browser
npm run start

# Render video
npm run render

# Or direct command
npx remotion render MSIPDemo out/msip-demo.mp4 --codec=h264
```

---

## Quality Checklist

Before finalizing, verify:

✅ **Colors match exactly** - Use HSL values from design system
✅ **Typography weights correct** - Bold headers (700), normal body (400-500)
✅ **Card shadows subtle** - Not too heavy
✅ **Badges have proper padding** - 4px vertical, 12px horizontal
✅ **Gradients smooth** - No banding artifacts
✅ **Cursor movement natural** - Bezier curves, not linear
✅ **Text readable at 1080p** - Minimum 12px font size
✅ **Timing feels natural** - Not too rushed, not too slow
✅ **Labels positioned correctly** - Bottom-right corner, 48px from edges
✅ **All emoji render** - 🚨⚠️✓⚡💡🤖🎯💬📊👍👎😐
✅ **Risk Intelligence prominent** - $390.4M and $1.5M values clearly visible
✅ **Feedback volume shown** - "114 feedback items" badge visible
✅ **Case study alignment clear** - Each section addresses a specific problem

---

## Narration Script Integration

**The video will be SILENT.** Paul will narrate live during the interview using this script:

### 0-10s (Portfolio Dashboard + Risk Intelligence)
*"This is what self-service visibility looks like. When the Pay-Mae situation emerged, Maria said 'I don't know this product.' With this dashboard, she wouldn't need to ask anyone—37 products, real-time metrics, and the key differentiator: Risk Intelligence. Not just 'what's happening' but 'what it costs us.' $390 million in revenue at risk. $1.5 million in escalation costs from delays. And the 3-week forecast shows exactly what happens if we don't act—$1.9 million potential loss across three products. This is the visibility gap the case study describes."*

### 10-25s (Pay-Mae Detail)
*"Let's drill into Pay-Mae specifically. Here's what the system surfaces immediately: Gate 3-4 status, readiness declining 8% this week, and most importantly—the blocker visibility that was missing. External Rail: blocked by Stripe. Regulatory: BACEN pending. And the system has already auto-triggered an escalation—Ambassador Deep Dive scheduled, VP notified. This is exactly what would have prevented the crisis."*

### 25-40s (AI Insights)
*"The AI layer takes this further. Instead of manually aggregating data from Jira and Confluence—imagine Maria just asks: 'What's blocking my Q1 launches in Latin America?' The knowledge graph instantly synthesizes: Three critical blockers. Pay-Mae's Stripe delay affects two other products. Mercado Pago needs regulatory approval. SPEI Mexico has resource constraints. And here's the key—it provides the recommended action with financial context: escalate the Stripe blocker to unblock $2.4 million in Q1 revenue."*

### 40-50s (Feedback Intelligence)
*"Now here's the Sales EVP's request from the case study: 'a customer feedback loop that scales beyond this product.' This is that system. 114 feedback items systematically captured—not ad-hoc, but across all customer touchpoints. Auto-classified by sentiment, auto-clustered by theme. Integration complexity is the top friction point with 127 mentions. This scales to every product in the portfolio, not just Pay-Mae."*

### 50-60s (Closing)
*"So in 60 seconds, you've seen a production-ready prototype that addresses exactly what the case study revealed: Self-service visibility—no more 'I don't know this product.' Risk quantification—the cost of inaction is explicit, not hidden. And a scalable feedback loop—exactly what the Sales EVP requested. This is what the 90-day roadmap delivers."*

---

## Case Study Alignment Map

| Case Study Problem | Demo Section | Feature Shown |
|-------------------|--------------|---------------|
| "I don't know this product" | Section 1 | Self-service dashboard, no ad-hoc requests |
| No readiness assessment framework | Section 1 | Risk Intelligence with $ impact |
| "Is it ready for VIP customer?" | Section 2 | Readiness score, blocker visibility |
| No playbook or bandwidth | Section 2 | Auto-escalation triggers |
| Sales EVP feedback loop request | Section 4 | 114 items, systematic capture |
| Scale beyond Pay-Mae | Section 5 | 37 products, scalable infrastructure |

---

## Success Criteria

The video should:
1. ✅ Look like it came from the actual studio-pilot-vision.lovable.app site
2. ✅ Tell the story of how MSIP solves the Pay-Mae crisis
3. ✅ Demonstrate technical sophistication (AI, knowledge graphs, auto-escalation)
4. ✅ Feel professional and polished, not amateurish
5. ✅ Be exactly 60 seconds (±2 seconds acceptable)
6. ✅ Export as H.264 MP4 under 50MB

---

## Additional Context

**Interview Context:**
This video is being shown after presenting a case study response for the "Manager, Product Management, Studio Ambassador, North America" role at Mastercard.

**Interview Panel:**
- VP of Mastercard Foundry
- Director PM from Canada
- Product Specialist
- Director of Tech Program Management (former Studio Ambassador)

**Case Study Scenario (Pay-Mae Crisis):**
- Maria (new PM) inherited Pay-Mae 2 weeks ago
- VIP customer escalation from Japan's largest issuer
- Sales EVP request: "We need a customer feedback loop that scales beyond this product"
- Key gaps identified: No visibility, no readiness framework, no playbook

**Goal:** Prove Paul can execute on the strategic framework he proposed by showing a working prototype that validates technical feasibility. The video directly demonstrates solutions to the case study's problems.

**Strategic Narrative:**
1. Section 1 answers "I don't know this product" → Self-service visibility
2. Section 1 answers "Is it ready?" → Risk quantification with $ impact
3. Section 2 answers "No playbook" → Auto-escalation & blocker visibility
4. Section 4 answers "Feedback loop that scales" → 114 items, systematic capture
5. Section 5 ties back to 90-day roadmap deliverables

**Tone:** Collaborative and empowering (Studio Ambassador is a support/enabler role, not a hero role).

---

## Start Here

1. Set up Remotion project with dependencies
2. Create color system and component library first
3. Build each section as separate component
4. Compose in MSIPDemo.tsx using <Sequence>
5. Test timing in preview mode
6. Render final video

After building, give me the command to render the final video.

---

## ElevenLabs Narration Script

**Voice Settings for Antoni:**
- Stability: 0.5
- Clarity + Similarity Enhancement: 0.75
- Style: 0
- Speed: Default (1.0)

---

### 60-Second Script for Antoni (~65 words)

**Copy this exact text - timed for 60 seconds:**

```
Portfolio visibility. Thirty-seven products. Risk intelligence showing revenue at risk.

Pay-Mae detail. Blockers surfaced. Escalation triggered automatically.

AI insights. Natural language query. Actionable recommendations.

Feedback intelligence. Systematic capture. Auto-classified.

Self-service visibility. Risk quantification. Scalable feedback. Production ready.
```

---

### Alternative 60-Second Script (~65 words)

**Slightly more narrative version:**

```
Self-service visibility across thirty-seven products. Risk intelligence quantifies the cost of inaction.

Drilling into Pay-Mae. Critical blockers surfaced automatically. Escalation already triggered.

AI synthesizes insights from natural language queries. Recommended actions with financial context.

Feedback captured systematically. Auto-classified by sentiment and theme.

Visibility. Risk quantification. Scalable feedback infrastructure.
```

---

### Extended Script (~350 words, ~2 minutes)

**Use this for a longer narration or if you want more detail:**

```
This is what self-service visibility looks like.

When the Pay-Mae situation emerged, Maria said, "I don't know this product." With this dashboard, she wouldn't need to ask anyone. Thirty-seven products. Real-time metrics. And the key differentiator: Risk Intelligence.

Not just what's happening, but what it costs us.

Three hundred ninety million dollars in revenue at risk. One point five million in escalation costs from delays. And the three-week forecast shows exactly what happens if we don't act. One point nine million in potential losses across three products.

This is the visibility gap the case study describes.

Now let's drill into Pay-Mae specifically.

Here's what the system surfaces immediately. Gate three to four status. Readiness declining eight percent this week. And most importantly, the blocker visibility that was missing.

External Rail: blocked by Stripe. Regulatory: BACEN pending.

And the system has already auto-triggered an escalation. Ambassador Deep Dive scheduled. VP notified.

This is exactly what would have prevented the crisis.

The AI layer takes this further.

Instead of manually aggregating data from Jira and Confluence, imagine Maria just asks: "What's blocking my Q1 launches in Latin America?"

The knowledge graph instantly synthesizes three critical blockers. Pay-Mae's Stripe delay affects two other products. Mercado Pago needs regulatory approval. SPEI Mexico has resource constraints.

And here's the key. It provides the recommended action with financial context. Escalate the Stripe blocker to unblock two point four million dollars in Q1 revenue.

Now, here's the Sales EVP's request from the case study: "A customer feedback loop that scales beyond this product."

This is that system.

One hundred fourteen feedback items systematically captured. Not ad-hoc, but across all customer touchpoints. Auto-classified by sentiment. Auto-clustered by theme. Integration complexity is the top friction point with one hundred twenty-seven mentions.

This scales to every product in the portfolio.

So in sixty seconds, you've seen a production-ready prototype that addresses exactly what the case study revealed.

Self-service visibility. No more "I don't know this product."

Risk quantification. The cost of inaction is explicit, not hidden.

And a scalable feedback loop. Exactly what the Sales EVP requested.

This is what the ninety-day roadmap delivers.
```

---

### Pronunciation Guide for ElevenLabs

| Term | Pronunciation |
|------|---------------|
| MSIP | "Em-Sip" or spell out "M-S-I-P" |
| Pay-Mae | "Pay-May" |
| BACEN | "Bah-SEN" (Central Bank of Brazil) |
| LATAM | "Lat-Am" |
| Q1 | "Q-One" or "Quarter One" |
| Jira | "Jeer-ah" |
| SPEI | "Spay" (Mexican payment system) |
| VP | "V-P" |
| EVP | "E-V-P" |

---

### ElevenLabs Export Settings

For syncing with Remotion video:
- Export as MP3 or WAV
- Sample rate: 44100 Hz
- Ensure total duration matches ~60 seconds
- If generating segments, leave 0.5s silence between sections for transitions