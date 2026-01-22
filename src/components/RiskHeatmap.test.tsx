import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { RiskHeatmap } from './RiskHeatmap';
import { mockProduct, mockHighRiskProduct, mockTopPerformer, mockProductPortfolio } from '@/test/utils';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scatter-chart">{children}</div>
  ),
  Scatter: () => <div data-testid="scatter" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  ZAxis: () => <div data-testid="z-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('RiskHeatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with title', () => {
      render(<RiskHeatmap products={mockProductPortfolio()} />);
      // Actual title is "Revenue vs Risk Analysis"
      expect(screen.getByText('Revenue vs Risk Analysis')).toBeInTheDocument();
    });

    it('renders the chart container', () => {
      render(<RiskHeatmap products={mockProductPortfolio()} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders scatter chart', () => {
      render(<RiskHeatmap products={mockProductPortfolio()} />);
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('handles empty products array gracefully', () => {
      render(<RiskHeatmap products={[]} />);
      // Still renders the card with title
      expect(screen.getByText('Revenue vs Risk Analysis')).toBeInTheDocument();
    });
  });

  describe('Product Data', () => {
    it('accepts products prop', () => {
      const products = mockProductPortfolio();
      const { container } = render(<RiskHeatmap products={products} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with single product', () => {
      render(<RiskHeatmap products={[mockProduct()]} />);
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    it('renders with high-risk products', () => {
      render(<RiskHeatmap products={[mockHighRiskProduct()]} />);
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    it('renders with top performers', () => {
      render(<RiskHeatmap products={[mockTopPerformer()]} />);
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });
  });

  describe('Axes', () => {
    it('renders x-axis', () => {
      render(<RiskHeatmap products={mockProductPortfolio()} />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    });

    it('renders y-axis', () => {
      render(<RiskHeatmap products={mockProductPortfolio()} />);
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('renders tooltip component', () => {
      render(<RiskHeatmap products={mockProductPortfolio()} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });
});
