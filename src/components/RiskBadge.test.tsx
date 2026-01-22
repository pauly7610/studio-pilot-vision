import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { RiskBadge } from './RiskBadge';

// Mock accessibility context
vi.mock('@/contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({
    highContrastMode: false,
    colorBlindMode: 'none',
  }),
}));

describe('RiskBadge', () => {
  describe('Rendering', () => {
    it('renders the badge', () => {
      render(<RiskBadge risk="medium" />);
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });
  });

  describe('Risk Levels', () => {
    it('renders low risk badge', () => {
      render(<RiskBadge risk="low" />);
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
    });

    it('renders medium risk badge', () => {
      render(<RiskBadge risk="medium" />);
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });

    it('renders high risk badge', () => {
      render(<RiskBadge risk="high" />);
      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label for low risk', () => {
      render(<RiskBadge risk="low" />);
      expect(screen.getByLabelText('Risk level: Low Risk')).toBeInTheDocument();
    });

    it('has aria-label for medium risk', () => {
      render(<RiskBadge risk="medium" />);
      expect(screen.getByLabelText('Risk level: Medium Risk')).toBeInTheDocument();
    });

    it('has aria-label for high risk', () => {
      render(<RiskBadge risk="high" />);
      expect(screen.getByLabelText('Risk level: High Risk')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('shows emoji for low risk', () => {
      render(<RiskBadge risk="low" />);
      expect(screen.getByText('🟢')).toBeInTheDocument();
    });

    it('shows emoji for medium risk', () => {
      render(<RiskBadge risk="medium" />);
      expect(screen.getByText('🟡')).toBeInTheDocument();
    });

    it('shows emoji for high risk', () => {
      render(<RiskBadge risk="high" />);
      expect(screen.getByText('🔴')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('accepts className prop', () => {
      const { container } = render(<RiskBadge risk="low" className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
