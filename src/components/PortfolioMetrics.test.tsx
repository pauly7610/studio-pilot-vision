import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { PortfolioMetrics } from './PortfolioMetrics';

// PortfolioMetrics takes totalProducts and highRiskProducts as props, not a products array
describe('PortfolioMetrics', () => {
  describe('Rendering', () => {
    it('renders metric cards', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={2} />);
      // Renders metric cards with titles
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Products')).toBeInTheDocument();
      expect(screen.getByText('Launch Success Rate')).toBeInTheDocument();
      expect(screen.getByText('High Risk Products')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('handles zero products', () => {
      render(<PortfolioMetrics totalProducts={0} highRiskProducts={0} />);
      // Multiple '0' values on page (products, high risk), so check by role/context
      expect(screen.getByText('No products')).toBeInTheDocument();
      expect(screen.getByText('All on track')).toBeInTheDocument();
    });
  });

  describe('Total Products', () => {
    it('displays correct product count', () => {
      render(<PortfolioMetrics totalProducts={5} highRiskProducts={1} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays single product count', () => {
      render(<PortfolioMetrics totalProducts={1} highRiskProducts={0} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows products in portfolio message', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={2} />);
      expect(screen.getByText('10 in portfolio')).toBeInTheDocument();
    });
  });

  describe('Revenue Metrics', () => {
    it('calculates and displays total revenue', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={2} />);
      // Total revenue = totalProducts * 1.52 (average ~$1.5M per product)
      // 10 * 1.52 = $15.2M
      expect(screen.getByText('$15.2M')).toBeInTheDocument();
    });

    it('shows revenue change indicator', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={2} />);
      expect(screen.getByText('+18.2%')).toBeInTheDocument();
    });
  });

  describe('Risk Distribution', () => {
    it('shows high risk products count', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows require attention message for high risk', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={3} />);
      expect(screen.getByText('3 require attention')).toBeInTheDocument();
    });

    it('shows all on track when no high risk products', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={0} />);
      expect(screen.getByText('All on track')).toBeInTheDocument();
    });
  });

  describe('Success Rate', () => {
    it('calculates success rate correctly', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={2} />);
      // Success rate = max(65, 100 - (2/10)*100) = max(65, 80) = 80%
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('has minimum success rate of 65%', () => {
      render(<PortfolioMetrics totalProducts={10} highRiskProducts={8} />);
      // Success rate = max(65, 100 - (8/10)*100) = max(65, 20) = 65%
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles large product counts', () => {
      render(<PortfolioMetrics totalProducts={100} highRiskProducts={20} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('handles all products being high risk', () => {
      render(<PortfolioMetrics totalProducts={5} highRiskProducts={5} />);
      expect(screen.getByText('5 require attention')).toBeInTheDocument();
    });
  });
});
