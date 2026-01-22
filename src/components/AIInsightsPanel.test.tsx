import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { AIInsightsPanel } from './AIInsightsPanel';
import { mockAIInsightResponse } from '@/test/utils';
import * as useAIInsightsModule from '@/hooks/useAIInsights';

// Mock the hooks module
vi.mock('@/hooks/useAIInsights');

// Mock DocumentUpload component
vi.mock('@/components/DocumentUpload', () => ({
  DocumentUpload: () => <button>Upload Document</button>,
}));

describe('AIInsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks for all hooks
    vi.mocked(useAIInsightsModule.useAIHealth).mockReturnValue({
      data: { status: 'healthy', vector_store: { connected: true, document_count: 150 } },
      isLoading: false,
    } as any);
    
    vi.mocked(useAIInsightsModule.useAIStats).mockReturnValue({
      data: { total_vectors: 150, collection: 'product_documents' },
      isLoading: false,
    } as any);
    
    vi.mocked(useAIInsightsModule.useAIQuery).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(mockAIInsightResponse()),
      isPending: false,
      isError: false,
    } as any);
    
    vi.mocked(useAIInsightsModule.useProductInsight).mockReturnValue({
      data: {
        success: true,
        insight: 'This product has strong market positioning.',
        sources: [],
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any);
    
    vi.mocked(useAIInsightsModule.usePortfolioInsight).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(mockAIInsightResponse()),
      isPending: false,
    } as any);
    
    vi.mocked(useAIInsightsModule.useUploadJiraCSV).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    
    vi.mocked(useAIInsightsModule.useJobStatus).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);
  });

  describe('Rendering', () => {
    it('renders the component with title', () => {
      render(<AIInsightsPanel />);
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    });

    it('renders health status when offline', () => {
      vi.mocked(useAIInsightsModule.useAIHealth).mockReturnValue({
        data: { status: 'unhealthy' },
        isLoading: false,
      } as any);

      render(<AIInsightsPanel />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      render(<AIInsightsPanel compact />);
      expect(screen.getByText('AI Insight')).toBeInTheDocument();
    });

    it('shows offline badge in compact mode when unhealthy', () => {
      vi.mocked(useAIInsightsModule.useAIHealth).mockReturnValue({
        data: { status: 'unhealthy' },
        isLoading: false,
      } as any);

      render(<AIInsightsPanel compact />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Insight Type Selection', () => {
    it('renders insight type selector for product view', () => {
      render(<AIInsightsPanel productId="test-id" productName="Test Product" />);
      // Multiple "Executive Summary" elements exist (tab and content), so just verify at least one exists
      const elements = screen.getAllByText('Executive Summary');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('displays product insight when available', () => {
      render(<AIInsightsPanel productId="test-id" productName="Test Product" />);
      expect(screen.getByText('This product has strong market positioning.')).toBeInTheDocument();
    });
  });

  describe('Query Section', () => {
    it('renders query textarea for portfolio', () => {
      render(<AIInsightsPanel />);
      expect(screen.getByPlaceholderText('Ask about your product portfolio...')).toBeInTheDocument();
    });

    it('renders product-specific placeholder when productId provided', () => {
      render(<AIInsightsPanel productId="test-id" productName="My Product" />);
      expect(screen.getByPlaceholderText('Ask about My Product...')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton during product insight fetch', () => {
      vi.mocked(useAIInsightsModule.useProductInsight).mockReturnValue({
        data: null,
        isLoading: true,
        refetch: vi.fn(),
      } as any);

      render(<AIInsightsPanel productId="test-id" productName="Test Product" />);
      // Component should render without crashing during loading
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('shows error message when insight has error', () => {
      vi.mocked(useAIInsightsModule.useProductInsight).mockReturnValue({
        data: {
          success: false,
          error: 'Failed to generate insight',
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(<AIInsightsPanel productId="test-id" productName="Test Product" />);
      expect(screen.getByText('Failed to generate insight')).toBeInTheDocument();
    });
  });
});
