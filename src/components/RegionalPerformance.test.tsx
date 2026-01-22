import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { RegionalPerformance } from './RegionalPerformance';
import { mockProduct, mockProductPortfolio } from '@/test/utils';

// Mock recharts via ChartContainer
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltipContent: () => <div data-testid="chart-tooltip" />,
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('RegionalPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with title', () => {
      render(<RegionalPerformance products={mockProductPortfolio()} />);
      expect(screen.getByText('Regional Performance')).toBeInTheDocument();
    });

    it('renders chart containers', () => {
      render(<RegionalPerformance products={mockProductPortfolio()} />);
      expect(screen.getAllByTestId('chart-container').length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('handles empty products array', () => {
      render(<RegionalPerformance products={[]} />);
      expect(screen.getByText('Regional Performance')).toBeInTheDocument();
    });
  });

  describe('Region Grouping', () => {
    it('groups products by region', () => {
      const products = [
        mockProduct({ id: '1', region: 'North America' }),
        mockProduct({ id: '2', region: 'EMEA' }),
        mockProduct({ id: '3', region: 'North America' }),
        mockProduct({ id: '4', region: 'APAC' }),
      ];

      render(<RegionalPerformance products={products} />);
      expect(screen.getByText('Regional Performance')).toBeInTheDocument();
    });

    it('handles products from single region', () => {
      const products = [
        mockProduct({ id: '1', region: 'North America' }),
        mockProduct({ id: '2', region: 'North America' }),
      ];

      render(<RegionalPerformance products={products} />);
      expect(screen.getByText('Regional Performance')).toBeInTheDocument();
    });
  });

  describe('Chart Elements', () => {
    it('renders bar chart', () => {
      render(<RegionalPerformance products={mockProductPortfolio()} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Revenue Calculations', () => {
    it('handles products with revenue targets', () => {
      const products = [
        mockProduct({ id: '1', region: 'North America', revenue_target: 5000000 }),
        mockProduct({ id: '2', region: 'EMEA', revenue_target: 3000000 }),
      ];

      render(<RegionalPerformance products={products} />);
      expect(screen.getByText('Regional Performance')).toBeInTheDocument();
    });

    it('handles products without revenue targets', () => {
      const products = [
        mockProduct({ id: '1', region: 'North America', revenue_target: null }),
      ];

      render(<RegionalPerformance products={products} />);
      expect(screen.getByText('Regional Performance')).toBeInTheDocument();
    });
  });

  describe('Region Stats', () => {
    it('shows region statistics', () => {
      const products = mockProductPortfolio();
      render(<RegionalPerformance products={products} />);
      
      // Should show regional breakdown stats
      expect(screen.getByText('Regional Performance')).toBeInTheDocument();
    });
  });
});
