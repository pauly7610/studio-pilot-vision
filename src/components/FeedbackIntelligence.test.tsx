import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { FeedbackIntelligence } from './FeedbackIntelligence';
import * as useProductFeedbackModule from '@/hooks/useProductFeedback';
import * as useProductActionsModule from '@/hooks/useProductActions';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock the hooks
vi.mock('@/hooks/useProductFeedback');
vi.mock('@/hooks/useProductActions');

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

// Mock subcomponents
vi.mock('@/components/AddFeedbackDialog', () => ({
  AddFeedbackDialog: () => <button>Add Feedback</button>,
}));

vi.mock('@/components/FeedbackAnalytics', () => ({
  FeedbackAnalytics: () => <div data-testid="feedback-analytics">Analytics</div>,
}));

const mockFeedbackData = [
  {
    id: 'feedback-1',
    product_id: 'prod-1',
    source: 'email',
    theme: 'usability',
    raw_text: 'Great product!',
    sentiment_score: 0.8,
    impact_level: 'HIGH',
    created_at: '2026-01-10T00:00:00Z',
    products: { name: 'Product A' },
  },
];

describe('FeedbackIntelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(useProductFeedbackModule.useAllFeedback).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    
    vi.mocked(useProductActionsModule.useCreateAction).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  describe('Rendering', () => {
    it('renders the component with title', () => {
      render(<FeedbackIntelligence />);
      expect(screen.getByText(/Customer Feedback Intelligence/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when fetching data', () => {
      vi.mocked(useProductFeedbackModule.useAllFeedback).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<FeedbackIntelligence />);
      
      // Component should render title even during loading
      expect(screen.getByText(/Customer Feedback Intelligence/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('handles empty feedback gracefully', () => {
      vi.mocked(useProductFeedbackModule.useAllFeedback).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<FeedbackIntelligence />);
      expect(screen.getByText(/Customer Feedback Intelligence/i)).toBeInTheDocument();
    });
  });

  describe('With Data', () => {
    it('renders feedback list', () => {
      vi.mocked(useProductFeedbackModule.useAllFeedback).mockReturnValue({
        data: mockFeedbackData,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<FeedbackIntelligence />);
      expect(screen.getByText(/Customer Feedback Intelligence/i)).toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    it('renders search input', () => {
      render(<FeedbackIntelligence />);
      expect(screen.getByPlaceholderText(/search feedback/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('handles error state gracefully', () => {
      vi.mocked(useProductFeedbackModule.useAllFeedback).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch feedback'),
        refetch: vi.fn(),
      } as any);

      render(<FeedbackIntelligence />);
      expect(screen.getByText(/Customer Feedback Intelligence/i)).toBeInTheDocument();
    });
  });
});
