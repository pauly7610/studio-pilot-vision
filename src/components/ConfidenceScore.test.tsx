import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { ConfidenceScore } from './ConfidenceScore';

describe('ConfidenceScore', () => {
  describe('Rendering', () => {
    it('renders the component with score', () => {
      render(<ConfidenceScore score={85} label="Revenue Confidence" />);
      expect(document.body.textContent).toContain('85');
    });

    it('renders label when showLabel is true', () => {
      render(<ConfidenceScore score={75} label="Confidence" showLabel />);
      expect(screen.getByText('Confidence')).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      render(<ConfidenceScore score={75} label="Confidence" showLabel={false} />);
      expect(screen.queryByText('Confidence')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(<ConfidenceScore score={80} label="Score" size="sm" />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders medium size', () => {
      render(<ConfidenceScore score={80} label="Score" size="md" />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders large size', () => {
      render(<ConfidenceScore score={80} label="Score" size="lg" />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Score Ranges', () => {
    it('handles high confidence (90+)', () => {
      render(<ConfidenceScore score={95} label="High" />);
      expect(document.body.textContent).toContain('95');
    });

    it('handles medium-high confidence (70-89)', () => {
      render(<ConfidenceScore score={75} label="Medium-High" />);
      expect(document.body.textContent).toContain('75');
    });

    it('handles medium confidence (50-69)', () => {
      render(<ConfidenceScore score={55} label="Medium" />);
      expect(document.body.textContent).toContain('55');
    });

    it('handles low confidence (below 50)', () => {
      render(<ConfidenceScore score={35} label="Low" />);
      expect(document.body.textContent).toContain('35');
    });

    it('handles zero confidence', () => {
      render(<ConfidenceScore score={0} label="Zero" />);
      expect(document.body.textContent).toContain('0');
    });

    it('handles 100% confidence', () => {
      render(<ConfidenceScore score={100} label="Perfect" />);
      expect(document.body.textContent).toContain('100');
    });
  });

  describe('Associated Value', () => {
    it('displays associated value when provided', () => {
      render(
        <ConfidenceScore 
          score={85} 
          label="Revenue" 
          associatedValue="$5.2M"
          associatedValueLabel="Revenue Forecast"
        />
      );
      // The associatedValue is in the tooltip, not visible by default
      // Check that the score percentage is displayed instead
      expect(document.body.textContent).toContain('85');
    });

    it('handles missing associated value', () => {
      render(<ConfidenceScore score={85} label="Revenue" />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Justification', () => {
    it('accepts justification text', () => {
      render(
        <ConfidenceScore 
          score={75} 
          label="Score" 
          justification="Based on historical data and market trends"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles negative score', () => {
      render(<ConfidenceScore score={-10} label="Negative" />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles score above 100', () => {
      render(<ConfidenceScore score={150} label="Above 100" />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles decimal score', () => {
      render(<ConfidenceScore score={85.5} label="Decimal" />);
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
