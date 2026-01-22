import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { AddFeedbackDialog } from './AddFeedbackDialog';

// Mock the hooks
vi.mock('@/hooks/useProductFeedback', () => ({
  useCreateFeedback: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-feedback-id' }),
    isPending: false,
    isError: false,
  })),
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({
    data: [
      { id: 'prod-1', name: 'Product A' },
      { id: 'prod-2', name: 'Product B' },
    ],
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

describe('AddFeedbackDialog', () => {
  const defaultProductId = 'test-product-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders trigger button when provided', () => {
      render(
        <AddFeedbackDialog 
          triggerButton={<button>Add Feedback</button>}
        />
      );
      expect(screen.getByText('Add Feedback')).toBeInTheDocument();
    });

    it('renders default trigger when not provided', () => {
      render(<AddFeedbackDialog />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Dialog Opening', () => {
    it('opens dialog when trigger is clicked', async () => {
      render(
        <AddFeedbackDialog 
          triggerButton={<button>Open</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open'));
      
      await waitFor(() => {
        // Actual title is "Log New Feedback"
        expect(screen.getByText('Log New Feedback')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('renders form fields in dialog', async () => {
      render(
        <AddFeedbackDialog 
          triggerButton={<button>Open</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open'));
      
      await waitFor(() => {
        // Check for labels - use getAllByText since there may be multiple
        expect(screen.getByLabelText(/Product/i)).toBeInTheDocument();
      });
    });

    it('renders feedback textarea', async () => {
      render(
        <AddFeedbackDialog 
          triggerButton={<button>Open</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open'));
      
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/feedback/i);
        expect(textarea).toBeInTheDocument();
      });
    });
  });

  describe('Default Product', () => {
    it('accepts defaultProductId prop', () => {
      const { container } = render(
        <AddFeedbackDialog 
          triggerButton={<button>Open</button>}
          defaultProductId={defaultProductId}
        />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Buttons in Dialog', () => {
    it('renders cancel button', async () => {
      render(
        <AddFeedbackDialog 
          triggerButton={<button>Open</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open'));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('renders submit button', async () => {
      render(
        <AddFeedbackDialog 
          triggerButton={<button>Open</button>}
        />
      );
      
      fireEvent.click(screen.getByText('Open'));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add feedback/i })).toBeInTheDocument();
      });
    });
  });
});
