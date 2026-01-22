import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { EditProductDialog } from './EditProductDialog';
import { mockProduct } from '@/test/utils';

// Mock the hooks
vi.mock('@/hooks/useProducts', () => ({
  useUpdateProduct: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'test-id', name: 'Updated Product' }),
    isPending: false,
    isError: false,
  })),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditProductDialog', () => {
  const mockOnSuccess = vi.fn();
  const testProduct = mockProduct();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders trigger button', () => {
      render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Edit</button>}
        />
      );
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('renders default edit icon trigger when no trigger provided', () => {
      render(<EditProductDialog product={testProduct} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Dialog Opening', () => {
    it('opens dialog when trigger is clicked', async () => {
      render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Open Edit Dialog</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open Edit Dialog'));
      
      // Use findByRole which handles async portal rendering
      const dialog = await screen.findByRole('dialog', {}, { timeout: 3000 });
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Pre-populated Fields', () => {
    it('populates name field with product name when dialog opens', async () => {
      render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Open Edit</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open Edit'));
      
      // Wait for dialog to open
      await screen.findByRole('dialog', {}, { timeout: 3000 });
      
      // Check that name field is populated
      const nameInput = screen.getByLabelText(/Product Name/i);
      expect(nameInput).toHaveValue(testProduct.name);
    });

    it('populates owner email with product owner', async () => {
      render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Open Edit</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open Edit'));
      
      await screen.findByRole('dialog', {}, { timeout: 3000 });
      
      const emailInput = screen.getByLabelText(/Product Owner Email/i);
      expect(emailInput).toHaveValue(testProduct.owner_email);
    });
  });

  describe('Form Editing', () => {
    it('allows editing name field', async () => {
      render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Open Edit</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open Edit'));
      
      await screen.findByRole('dialog', {}, { timeout: 3000 });
      
      const nameInput = screen.getByLabelText(/Product Name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Product Name' } });
      expect(nameInput).toHaveValue('Updated Product Name');
    });
  });

  describe('Buttons', () => {
    it('renders save button in dialog', async () => {
      render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Open Edit</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open Edit'));
      
      await screen.findByRole('dialog', {}, { timeout: 3000 });
      
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });

    it('renders cancel button in dialog', async () => {
      render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Open Edit</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open Edit'));
      
      await screen.findByRole('dialog', {}, { timeout: 3000 });
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('accepts onSuccess callback prop', () => {
      const { container } = render(
        <EditProductDialog 
          product={testProduct}
          trigger={<button>Edit</button>}
          onSuccess={mockOnSuccess}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
