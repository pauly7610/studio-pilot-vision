import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ProductCards } from './ProductCards';
import { mockProduct, mockHighRiskProduct, mockTopPerformer, mockProductPortfolio } from '@/test/utils';
import type { FilterState } from './FilterBar';
import { useProducts } from '@/hooks/useProducts';
import { useProductMetrics } from '@/hooks/useProductMetrics';

// Mock the hooks
vi.mock('@/hooks/useProducts');
vi.mock('@/hooks/useProductMetrics');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock accessibility context
vi.mock('@/contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({
    announceToScreenReader: vi.fn(),
  }),
}));

// Mock sub-components to simplify testing
vi.mock('./TrendSparkline', () => ({
  TrendSparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('./RiskBadge', () => ({
  RiskBadge: ({ risk }: { risk: string }) => <span data-testid="risk-badge">{risk}</span>,
}));

vi.mock('./MomentumIndicator', () => ({
  MomentumIndicator: () => <div data-testid="momentum-indicator" />,
}));

vi.mock('./DependencyBadges', () => ({
  DependencyBadges: () => <div data-testid="dependency-badges" />,
  Dependency: {} as any,
}));

vi.mock('./ConfidenceScore', () => ({
  ConfidenceScore: () => <div data-testid="confidence-score" />,
}));

vi.mock('./DataHealthScore', () => ({
  DataHealthScore: () => <div data-testid="data-health-score" />,
}));

vi.mock('./MerchantSignal', () => ({
  MerchantSignal: () => <div data-testid="merchant-signal" />,
}));

vi.mock('./DataFreshness', () => ({
  DataFreshness: () => <div data-testid="data-freshness" />,
}));

vi.mock('./EscalationPath', () => ({
  EscalationPath: () => <div data-testid="escalation-path" />,
}));

vi.mock('./TransitionReadiness', () => ({
  TransitionReadiness: () => <div data-testid="transition-readiness" />,
}));

const defaultFilters: FilterState = {
  search: '',
  productType: 'all',
  lifecycleStage: 'all',
  riskBand: 'all',
  region: 'all',
  readinessMin: 0,
  readinessMax: 100,
  governanceTier: 'all',
};

describe('ProductCards', () => {
  const mockOnFilteredProductsChange = vi.fn();
  const mockOnToggleProduct = vi.fn();
  const mockUseProducts = vi.mocked(useProducts);
  const mockUseProductMetrics = vi.mocked(useProductMetrics);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockUseProducts.mockReturnValue({
      data: null,
      isLoading: false,
    } as any);
    mockUseProductMetrics.mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: true,
      } as any);

      const { container } = render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      // Skeleton component renders with animate-pulse class from shadcn
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no products match filters', () => {
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters to see more results')).toBeInTheDocument();
    });
  });

  describe('Product Display', () => {
    it('renders product cards', () => {
      mockUseProducts.mockReturnValue({
        data: mockProductPortfolio(),
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
      expect(screen.getByText('Product Beta')).toBeInTheDocument();
    });

    it('displays product count badge', () => {
      const products = mockProductPortfolio();
      mockUseProducts.mockReturnValue({
        data: products,
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByText(`${products.length} Products`)).toBeInTheDocument();
    });

    it('shows product type label', () => {
      mockUseProducts.mockReturnValue({
        data: [mockProduct({ product_type: 'core_products' })],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByText('Core Products')).toBeInTheDocument();
    });

    it('shows region', () => {
      mockUseProducts.mockReturnValue({
        data: [mockProduct({ region: 'EMEA' })],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByText('EMEA')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters products by search term', () => {
      mockUseProducts.mockReturnValue({
        data: mockProductPortfolio(),
        isLoading: false,
      } as any);

      const filtersWithSearch: FilterState = {
        ...defaultFilters,
        search: 'Alpha',
      };

      render(
        <ProductCards
          filters={filtersWithSearch}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Product Beta')).not.toBeInTheDocument();
    });

    it('filters products by lifecycle stage', () => {
      mockUseProducts.mockReturnValue({
        data: mockProductPortfolio(),
        isLoading: false,
      } as any);

      const filtersWithStage: FilterState = {
        ...defaultFilters,
        lifecycleStage: 'pilot',
      };

      render(
        <ProductCards
          filters={filtersWithStage}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      // Only pilot stage products should show
      expect(screen.getByText('Product Alpha')).toBeInTheDocument();
    });

    it('calls onFilteredProductsChange with filtered results', () => {
      const products = mockProductPortfolio();
      mockUseProducts.mockReturnValue({
        data: products,
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(mockOnFilteredProductsChange).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('renders sort dropdown', () => {
      mockUseProducts.mockReturnValue({
        data: mockProductPortfolio(),
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      // Should have sort controls
      expect(screen.getByLabelText('Sort products by')).toBeInTheDocument();
    });

    it('renders group dropdown', () => {
      mockUseProducts.mockReturnValue({
        data: mockProductPortfolio(),
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByLabelText('Group products by')).toBeInTheDocument();
    });
  });

  describe('Product Selection', () => {
    it('renders checkbox when onToggleProduct is provided', () => {
      mockUseProducts.mockReturnValue({
        data: [mockProduct()],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
          selectedProducts={[]}
          onToggleProduct={mockOnToggleProduct}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('shows selected state for selected products', () => {
      const product = mockProduct({ id: 'selected-product' });
      mockUseProducts.mockReturnValue({
        data: [product],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
          selectedProducts={['selected-product']}
          onToggleProduct={mockOnToggleProduct}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Navigation', () => {
    it('navigates to product detail on click', () => {
      const product = mockProduct({ id: 'nav-test-product' });
      mockUseProducts.mockReturnValue({
        data: [product],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      const productCard = screen.getByText('Test Product').closest('[role="button"]');
      if (productCard) {
        fireEvent.click(productCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/product/nav-test-product');
    });
  });

  describe('Risk Alerts', () => {
    it('shows risk alert for high-risk products', () => {
      mockUseProducts.mockReturnValue({
        data: [mockHighRiskProduct()],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByText(/Risk Alert/)).toBeInTheDocument();
      expect(screen.getByText(/governance review/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible product count label', () => {
      mockUseProducts.mockReturnValue({
        data: mockProductPortfolio(),
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      expect(screen.getByLabelText(/products displayed/)).toBeInTheDocument();
    });

    it('has keyboard navigable product cards', () => {
      mockUseProducts.mockReturnValue({
        data: [mockProduct()],
        isLoading: false,
      } as any);

      render(
        <ProductCards
          filters={defaultFilters}
          onFilteredProductsChange={mockOnFilteredProductsChange}
        />
      );

      const productCard = screen.getByRole('button', { name: /View details/i });
      expect(productCard).toHaveAttribute('tabIndex', '0');
    });
  });
});
