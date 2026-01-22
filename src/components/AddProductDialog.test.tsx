import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { AddProductDialog } from './AddProductDialog';

// Mock the hooks
vi.mock('@/hooks/useProducts', () => ({
  useCreateProduct: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-id', name: 'Test Product' }),
    isPending: false,
    isError: false,
  })),
}));

vi.mock('@/hooks/useAIInsights', () => ({
  useUploadDocument: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useJobStatus: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AddProductDialog', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders trigger button when provided', () => {
      render(<AddProductDialog trigger={<button>Add Product</button>} />);
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });

    it('renders default trigger when not provided', () => {
      render(<AddProductDialog />);
      // Default trigger shows "Add Product" button
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Dialog Opening', () => {
    it('opens dialog when trigger is clicked', async () => {
      render(<AddProductDialog trigger={<button>Open Dialog</button>} />);
      
      fireEvent.click(screen.getByText('Open Dialog'));
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields (when open)', () => {
    it('renders form fields in dialog', async () => {
      render(<AddProductDialog trigger={<button>Open</button>} />);
      
      fireEvent.click(screen.getByText('Open'));
      
      await waitFor(() => {
        expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('has details and document tabs', async () => {
      render(<AddProductDialog trigger={<button>Open</button>} />);
      
      fireEvent.click(screen.getByText('Open'));
      
      await waitFor(() => {
        // Actual tab names are "Product Details" and "Document"
        expect(screen.getByRole('tab', { name: /Product Details/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Document/i })).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('accepts onSuccess callback prop', () => {
      const { container } = render(
        <AddProductDialog trigger={<button>Open</button>} onSuccess={mockOnSuccess} />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
