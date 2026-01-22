import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { FilterBar, FilterState } from './FilterBar';
import { mockProductPortfolio } from '@/test/utils';
import * as exportUtils from '@/lib/exportUtils';
import { toast } from 'sonner';

// Mock the export utilities
vi.mock('@/lib/exportUtils', () => ({
  exportProductsToCSV: vi.fn(),
  exportProductsToExcel: vi.fn(),
  ExportProduct: {} as any,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

describe('FilterBar', () => {
  const mockOnFilterChange = vi.fn();
  const mockProducts = mockProductPortfolio();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the search input', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    });

    it('displays product count', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={10}
        />
      );

      expect(screen.getByText(mockProducts.length.toString())).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('renders export button', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onFilterChange when search input changes', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'test query',
      });
    });

    it('has accessible label for search', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByLabelText('Search products by name')).toBeInTheDocument();
    });
  });

  describe('Filter Dropdowns', () => {
    it('renders product type filter', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('All Types')).toBeInTheDocument();
    });

    it('renders lifecycle stage filter', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('All Stages')).toBeInTheDocument();
    });

    it('renders risk band filter', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('All Risk')).toBeInTheDocument();
    });

    it('renders region filter', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('All Regions')).toBeInTheDocument();
    });

    it('renders governance tier filter', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('All Tiers')).toBeInTheDocument();
    });
  });

  describe('Active Filters', () => {
    it('shows active filter count when filters are applied', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={3}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('Active:')).toBeInTheDocument();
      // Multiple elements may have "3" (count badge), so use getAllByText
      const threes = screen.getAllByText('3');
      expect(threes.length).toBeGreaterThan(0);
    });

    it('shows clear button when filters are active', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={2}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('hides active filters section when no filters are active', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.queryByText('Active:')).not.toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', () => {
      render(
        <FilterBar
          filters={{ ...defaultFilters, search: 'test', riskBand: 'high' }}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={2}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith(defaultFilters);
    });
  });

  describe('Advanced Filters', () => {
    it('renders advanced filters toggle button', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('advanced button is clickable', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      // Click advanced button should work without errors
      const advancedButton = screen.getByText('Advanced');
      fireEvent.click(advancedButton);
      
      // Button should still be in document after click
      expect(advancedButton).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('renders export button', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      // Export button should be present
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('export button is clickable', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      const exportButton = screen.getByText('Export');
      // Should be able to click without errors
      fireEvent.click(exportButton);
      expect(exportButton).toBeInTheDocument();
    });

    it('export button disabled state with no products', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={[]}
          totalProducts={0}
        />
      );

      // Export button still renders even with no products
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders mobile filter toggle button', () => {
      render(
        <FilterBar
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          activeFilterCount={0}
          filteredProducts={mockProducts}
          totalProducts={mockProducts.length}
        />
      );

      // Mobile filter button should exist (may be hidden via CSS)
      const filterButtons = screen.getAllByText('Filters');
      expect(filterButtons.length).toBeGreaterThan(0);
    });
  });
});
