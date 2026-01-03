import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { FeedbackAnalytics } from './FeedbackAnalytics';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

const mockFeedbackData = [
  { 
    product: 'PayLink Express',
    productId: '1',
    theme: 'usability',
    sentiment: 'positive' as const,
    sentimentScore: 0.8,
    volume: 10,
    impact: 'MEDIUM' as const,
    source: 'merchant'
  },
  { 
    product: 'PayLink Express',
    productId: '1',
    theme: 'usability',
    sentiment: 'positive' as const,
    sentimentScore: 0.9,
    volume: 15,
    impact: 'LOW' as const,
    source: 'merchant'
  },
  { 
    product: 'Crypto Bridge',
    productId: '2',
    theme: 'pricing',
    sentiment: 'neutral' as const,
    sentimentScore: 0.5,
    volume: 5,
    impact: 'MEDIUM' as const,
    source: 'internal'
  },
  { 
    product: 'PayLink Express',
    productId: '1',
    theme: 'performance',
    sentiment: 'negative' as const,
    sentimentScore: 0.2,
    volume: 8,
    impact: 'HIGH' as const,
    source: 'merchant'
  },
  { 
    product: 'Digital Wallet',
    productId: '3',
    theme: 'performance',
    sentiment: 'negative' as const,
    sentimentScore: 0.3,
    volume: 12,
    impact: 'HIGH' as const,
    source: 'support'
  },
];

describe('FeedbackAnalytics', () => {
  it('renders the component', () => {
    render(<FeedbackAnalytics feedbackData={mockFeedbackData} />);
    
    // Should render charts (multiple bar charts exist)
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
  });

  it('handles empty feedback data', () => {
    render(<FeedbackAnalytics feedbackData={[]} />);
    
    // Should still render charts without crashing
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders responsive containers for charts', () => {
    render(<FeedbackAnalytics feedbackData={mockFeedbackData} />);
    
    const containers = screen.getAllByTestId('responsive-container');
    expect(containers.length).toBeGreaterThanOrEqual(2);
  });

  it('renders with different feedback counts', () => {
    const singleFeedback = [mockFeedbackData[0]];
    render(<FeedbackAnalytics feedbackData={singleFeedback} />);
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});
