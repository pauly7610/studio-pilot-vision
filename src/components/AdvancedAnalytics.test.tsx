import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { mockProduct, mockProductPortfolio, mockHighRiskProduct, mockTopPerformer } from '@/test/utils';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
}));

describe('AdvancedAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<AdvancedAnalytics products={mockProductPortfolio()} />);
      // Component renders section titles for different analytics views
      expect(screen.getByText('Readiness Score Distribution')).toBeInTheDocument();
    });

    it('renders chart containers', () => {
      render(<AdvancedAnalytics products={mockProductPortfolio()} />);
      const containers = screen.getAllByTestId('responsive-container');
      expect(containers.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('handles empty products array', () => {
      render(<AdvancedAnalytics products={[]} />);
      // Still renders structure even with no data
      expect(screen.getByText('Readiness Score Distribution')).toBeInTheDocument();
    });
  });

  describe('Readiness Distribution', () => {
    it('displays readiness score chart', () => {
      const products = [
        mockProduct({ id: '1', readiness: [{ readiness_score: 90, risk_band: 'low' }] }),
        mockProduct({ id: '2', readiness: [{ readiness_score: 70, risk_band: 'medium' }] }),
      ];

      render(<AdvancedAnalytics products={products} />);
      expect(screen.getByText('Readiness Score Distribution')).toBeInTheDocument();
    });
  });

  describe('Risk Analysis', () => {
    it('displays risk by product type chart', () => {
      render(<AdvancedAnalytics products={mockProductPortfolio()} />);
      // Actual title is "Risk Level Breakdown by Type"
      expect(screen.getByText('Risk Level Breakdown by Type')).toBeInTheDocument();
    });

    it('handles mixed risk levels', () => {
      const products = [
        mockTopPerformer({ id: '1' }),
        mockProduct({ id: '2' }),
        mockHighRiskProduct({ id: '3' }),
      ];

      render(<AdvancedAnalytics products={products} />);
      expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    });
  });

  describe('Revenue Analysis', () => {
    it('displays revenue projections chart', () => {
      render(<AdvancedAnalytics products={mockProductPortfolio()} />);
      expect(screen.getByText('Revenue Projections by Type')).toBeInTheDocument();
    });

    it('handles products with various revenue targets', () => {
      const products = [
        mockProduct({ id: '1', revenue_target: 10000000 }),
        mockProduct({ id: '2', revenue_target: null }),
      ];

      render(<AdvancedAnalytics products={products} />);
      expect(screen.getByText('Revenue Projections by Type')).toBeInTheDocument();
    });
  });

  describe('Success Probability', () => {
    it('displays success probability chart', () => {
      render(<AdvancedAnalytics products={mockProductPortfolio()} />);
      expect(screen.getByText('Success Probability Distribution')).toBeInTheDocument();
    });
  });

  describe('Chart Types', () => {
    it('renders bar charts', () => {
      render(<AdvancedAnalytics products={mockProductPortfolio()} />);
      expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles single product', () => {
      render(<AdvancedAnalytics products={[mockProduct()]} />);
      expect(screen.getByText('Readiness Score Distribution')).toBeInTheDocument();
    });

    it('handles products with missing data', () => {
      const productsWithMissingData = [
        mockProduct({ id: '1', readiness: undefined, prediction: undefined }),
      ];

      render(<AdvancedAnalytics products={productsWithMissingData} />);
      expect(screen.getByText('Readiness Score Distribution')).toBeInTheDocument();
    });
  });
});
