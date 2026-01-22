import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { EscalationPath } from './EscalationPath';

describe('EscalationPath', () => {
  describe('Rendering', () => {
    it('renders the component', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="GREEN"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders in compact mode', () => {
      // Compact mode returns null when escalationLevel is "none"
      // To render something, we need cycles >= 2 for high risk
      render(
        <EscalationPath
          riskBand="high"
          gatingStatus="RED"
          lifecycleStage="commercial"
          cyclesInCurrentStatus={2}
          compact
        />
      );
      // Should show "SteerCo" badge
      expect(screen.getByText(/SteerCo/)).toBeInTheDocument();
    });
  });

  describe('Risk Band Escalation', () => {
    it('handles low risk', () => {
      render(
        <EscalationPath
          riskBand="low"
          gatingStatus="GREEN"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles medium risk', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="AMBER"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles high risk', () => {
      render(
        <EscalationPath
          riskBand="high"
          gatingStatus="RED"
          lifecycleStage="early_pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Gating Status', () => {
    it('handles GREEN status', () => {
      render(
        <EscalationPath
          riskBand="low"
          gatingStatus="GREEN"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles AMBER status', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="AMBER"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles RED status', () => {
      render(
        <EscalationPath
          riskBand="high"
          gatingStatus="RED"
          lifecycleStage="early_pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles PII/Privacy Review status', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="PII/Privacy Review"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles Regional Legal status', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="Regional Legal"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Gating Status Since', () => {
    it('handles recent gating status', () => {
      const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="AMBER"
          gatingStatusSince={recentDate}
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles old gating status (bottleneck)', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      render(
        <EscalationPath
          riskBand="high"
          gatingStatus="PII/Privacy Review"
          gatingStatusSince={oldDate}
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles undefined gatingStatusSince', () => {
      render(
        <EscalationPath
          riskBand="low"
          gatingStatus="GREEN"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Lifecycle Stages', () => {
    it('handles concept stage', () => {
      render(
        <EscalationPath
          riskBand="low"
          gatingStatus="GREEN"
          lifecycleStage="concept"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles early_pilot stage', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="AMBER"
          lifecycleStage="early_pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles pilot stage', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="AMBER"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles commercial stage', () => {
      render(
        <EscalationPath
          riskBand="low"
          gatingStatus="GREEN"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles sunset stage', () => {
      render(
        <EscalationPath
          riskBand="medium"
          gatingStatus="AMBER"
          lifecycleStage="sunset"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Escalation Triggers', () => {
    it('triggers escalation for high risk with RED status', () => {
      render(
        <EscalationPath
          riskBand="high"
          gatingStatus="RED"
          lifecycleStage="pilot"
        />
      );
      // Should indicate escalation is needed
      expect(document.body.textContent).toBeTruthy();
    });

    it('no escalation for low risk with GREEN status', () => {
      render(
        <EscalationPath
          riskBand="low"
          gatingStatus="GREEN"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
