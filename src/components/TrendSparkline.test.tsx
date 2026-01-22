import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { TrendSparkline } from './TrendSparkline';

// Mock recharts - TrendSparkline uses LineChart directly (not ResponsiveContainer)
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
}));

describe('TrendSparkline', () => {
  const sampleData = [
    { value: 50 },
    { value: 55 },
    { value: 52 },
    { value: 60 },
    { value: 65 },
    { value: 70 },
  ];

  describe('Rendering', () => {
    it('renders the sparkline with proper accessibility', () => {
      render(<TrendSparkline data={sampleData} />);
      // TrendSparkline renders with role="img" and aria-label
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('renders line chart', () => {
      render(<TrendSparkline data={sampleData} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('shows trend percentage', () => {
      render(<TrendSparkline data={sampleData} />);
      // Shows percentage change: (70-50)/50 = 40%
      expect(screen.getByText(/40\.0%/)).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('returns null for empty data array', () => {
      const { container } = render(<TrendSparkline data={[]} />);
      // Component returns null for empty data
      expect(container.firstChild).toBeNull();
    });

    it('returns null for single data point', () => {
      const { container } = render(<TrendSparkline data={[{ value: 50 }]} />);
      // Component requires at least 2 data points
      expect(container.firstChild).toBeNull();
    });

    it('renders with many data points', () => {
      const manyPoints = Array.from({ length: 20 }, (_, i) => ({ value: i * 5 }));
      render(<TrendSparkline data={manyPoints} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Trend Direction', () => {
    it('shows positive trend for upward data', () => {
      const upwardData = [
        { value: 10 },
        { value: 50 },
      ];
      render(<TrendSparkline data={upwardData} />);
      // (50-10)/10 = 400%
      expect(screen.getByText(/\+400\.0%/)).toBeInTheDocument();
    });

    it('shows negative trend for downward data', () => {
      const downwardData = [
        { value: 50 },
        { value: 25 },
      ];
      render(<TrendSparkline data={downwardData} />);
      // (25-50)/50 = -50%
      expect(screen.getByText(/-50\.0%/)).toBeInTheDocument();
    });

    it('shows zero trend for flat data', () => {
      const flatData = [
        { value: 50 },
        { value: 50 },
      ];
      render(<TrendSparkline data={flatData} />);
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });
  });

  describe('Value Ranges', () => {
    it('handles zero starting value', () => {
      const zeroData = [{ value: 0 }, { value: 10 }];
      render(<TrendSparkline data={zeroData} />);
      // When first value is 0, trendPercent is 0
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('handles negative values', () => {
      const negativeData = [{ value: -10 }, { value: -5 }];
      render(<TrendSparkline data={negativeData} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('handles large values', () => {
      const largeData = [{ value: 1000000 }, { value: 2000000 }];
      render(<TrendSparkline data={largeData} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('accepts color prop', () => {
      render(<TrendSparkline data={sampleData} color="#ff0000" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('accepts height prop', () => {
      render(<TrendSparkline data={sampleData} height={50} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('can hide trend icon', () => {
      render(<TrendSparkline data={sampleData} showTrendIcon={false} />);
      // Still renders chart but without trend icon/percentage
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
