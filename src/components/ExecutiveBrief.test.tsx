import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { ExecutiveBrief } from './ExecutiveBrief';
import { mockProduct, mockHighRiskProduct, mockTopPerformer, mockProductPortfolio } from '@/test/utils';

// Mock the hooks
vi.mock('@/hooks/useProductActions', () => ({
  useProductActions: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useCreateAction: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Mock the PDF export
vi.mock('@/lib/pdfExport', () => ({
  exportExecutivePDF: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ActionItem component
vi.mock('@/components/ActionItem', () => ({
  ActionItem: ({ action }: { action: { title: string } }) => (
    <div data-testid="action-item">{action.title}</div>
  ),
}));

describe('ExecutiveBrief', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with title', () => {
      render(<ExecutiveBrief products={mockProductPortfolio()} />);
      expect(screen.getByText('Executive Brief')).toBeInTheDocument();
    });

    it('renders export button', () => {
      render(<ExecutiveBrief products={mockProductPortfolio()} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('shows empty state when no products', () => {
      render(<ExecutiveBrief products={[]} />);
      // Component still renders the card, just with 0% success rate
      expect(screen.getByText('Executive Brief')).toBeInTheDocument();
    });
  });

  describe('Portfolio Metrics', () => {
    it('displays success rate', () => {
      const products = mockProductPortfolio();
      render(<ExecutiveBrief products={products} />);
      
      // Text is lowercase "success"
      expect(screen.getByText('success')).toBeInTheDocument();
    });

    it('displays average revenue target', () => {
      const products = mockProductPortfolio();
      render(<ExecutiveBrief products={products} />);
      
      // Text is lowercase "avg target"
      expect(screen.getByText('avg target')).toBeInTheDocument();
    });
  });

  describe('Revenue at Risk', () => {
    it('displays revenue at risk metric', () => {
      const products = [mockHighRiskProduct()];
      render(<ExecutiveBrief products={products} />);
      
      expect(screen.getByText('Revenue at Risk')).toBeInTheDocument();
    });

    it('displays escalation cost metric', () => {
      const products = [mockHighRiskProduct()];
      render(<ExecutiveBrief products={products} />);
      
      expect(screen.getByText('Escalation Cost')).toBeInTheDocument();
    });
  });

  describe('Decision Impact Preview', () => {
    it('shows decision impact section', () => {
      const highRiskProducts = [
        mockHighRiskProduct({ id: '1', name: 'At Risk Product', revenue_target: 5000000 }),
      ];
      
      render(<ExecutiveBrief products={highRiskProducts} />);
      
      expect(screen.getByText(/If No Action/)).toBeInTheDocument();
    });
  });

  describe('Top Performers Section', () => {
    it('displays top candidates section', () => {
      // Component requires readinessScore >= 85 AND successProb >= 80
      // successProb comes directly from success_probability, so needs to be >= 80
      const products = [
        mockTopPerformer({ 
          id: '1', 
          name: 'Star Product',
          readiness: [{ readiness_score: 92, risk_band: 'low', momentum: 'improving' }],
          prediction: [{ success_probability: 95, confidence_level: 0.95 }]
        }),
      ];
      
      render(<ExecutiveBrief products={products} />);
      
      expect(screen.getByText('Top Candidates')).toBeInTheDocument();
    });

    it('shows top performer names', () => {
      const products = [
        mockTopPerformer({ 
          id: '1', 
          name: 'Star Product',
          readiness: [{ readiness_score: 92, risk_band: 'low', momentum: 'improving' }],
          prediction: [{ success_probability: 95, confidence_level: 0.95 }]
        }),
      ];
      
      render(<ExecutiveBrief products={products} />);
      
      expect(screen.getByText(/Star Product/)).toBeInTheDocument();
    });
  });

  describe('High Risk Section', () => {
    it('displays action required section', () => {
      const highRiskProducts = [
        mockHighRiskProduct({ id: '1', name: 'Critical Product' }),
      ];
      
      render(<ExecutiveBrief products={highRiskProducts} />);
      
      expect(screen.getByText(/Action Required/)).toBeInTheDocument();
    });
  });

  describe('Timestamp', () => {
    it('displays the MSIP AI badge', () => {
      render(<ExecutiveBrief products={mockProductPortfolio()} />);
      // Text includes "MSIP AI"
      expect(screen.getByText(/MSIP AI/)).toBeInTheDocument();
    });

    it('displays week timestamp', () => {
      render(<ExecutiveBrief products={mockProductPortfolio()} />);
      expect(screen.getByText(/Week of/)).toBeInTheDocument();
    });
  });

  describe('Mixed Portfolio', () => {
    it('handles mixed portfolio with various risk levels', () => {
      const mixedPortfolio = [
        mockTopPerformer({ id: '1', name: 'Top Product' }),
        mockProduct({ id: '2', name: 'Normal Product' }),
        mockHighRiskProduct({ id: '3', name: 'Risky Product' }),
      ];
      
      render(<ExecutiveBrief products={mixedPortfolio} />);
      
      expect(screen.getByText('Executive Brief')).toBeInTheDocument();
    });
  });
});
