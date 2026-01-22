import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ActionItem } from './ActionItem';

// Mock the hooks
vi.mock('@/hooks/useProductActions', () => ({
  useUpdateAction: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ActionItem uses ProductAction interface from useProductActions
const createTestAction = (overrides = {}) => ({
  id: 'action-uuid',
  product_id: 'test-product-uuid',
  title: 'Test Action',
  description: 'Test action description',
  status: 'pending' as const,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  ...overrides,
});

describe('ActionItem', () => {
  const productId = 'test-product-uuid';
  const testAction = createTestAction();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the action title', () => {
      render(<ActionItem action={testAction} productId={productId} />);
      expect(screen.getByText(testAction.title)).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      render(<ActionItem action={testAction} productId={productId} compact />);
      expect(screen.getByText(testAction.title)).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('shows Open status for pending actions', () => {
      const pendingAction = createTestAction({ status: 'pending' });
      render(<ActionItem action={pendingAction} productId={productId} />);
      expect(screen.getByText(/Open/)).toBeInTheDocument();
    });

    it('shows In Progress status', () => {
      const inProgressAction = createTestAction({ status: 'in_progress' });
      render(<ActionItem action={inProgressAction} productId={productId} />);
      expect(screen.getByText(/In Progress/)).toBeInTheDocument();
    });

    it('shows Resolved status for completed actions', () => {
      const completedAction = createTestAction({ status: 'completed' });
      render(<ActionItem action={completedAction} productId={productId} />);
      expect(screen.getByText(/Resolved/)).toBeInTheDocument();
    });
  });

  describe('Status Buttons', () => {
    it('shows Mark In Progress button for pending actions', () => {
      const pendingAction = createTestAction({ status: 'pending' });
      render(<ActionItem action={pendingAction} productId={productId} />);
      expect(screen.getByText('Mark In Progress')).toBeInTheDocument();
    });

    it('shows Mark Resolved button for non-completed actions', () => {
      const pendingAction = createTestAction({ status: 'pending' });
      render(<ActionItem action={pendingAction} productId={productId} />);
      expect(screen.getByText('Mark Resolved')).toBeInTheDocument();
    });

    it('hides status buttons for completed actions', () => {
      const completedAction = createTestAction({ status: 'completed' });
      render(<ActionItem action={completedAction} productId={productId} />);
      expect(screen.queryByText('Mark In Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('Mark Resolved')).not.toBeInTheDocument();
    });
  });

  describe('Note Functionality', () => {
    it('shows Add Note button when no description', () => {
      const actionNoDesc = createTestAction({ description: '' });
      render(<ActionItem action={actionNoDesc} productId={productId} />);
      expect(screen.getByText(/Add Note/)).toBeInTheDocument();
    });

    it('shows Edit Note button when has description', () => {
      render(<ActionItem action={testAction} productId={productId} />);
      expect(screen.getByText(/Edit Note/)).toBeInTheDocument();
    });

    it('displays existing note', () => {
      render(<ActionItem action={testAction} productId={productId} />);
      expect(screen.getByText(testAction.description)).toBeInTheDocument();
    });
  });

  describe('Status Updates', () => {
    it('can click Mark In Progress button', () => {
      const pendingAction = createTestAction({ status: 'pending' });
      render(<ActionItem action={pendingAction} productId={productId} />);
      
      const button = screen.getByText('Mark In Progress');
      fireEvent.click(button);
      
      // Button should be clickable without errors
      expect(button).toBeInTheDocument();
    });

    it('can click Mark Resolved button', () => {
      const pendingAction = createTestAction({ status: 'pending' });
      render(<ActionItem action={pendingAction} productId={productId} />);
      
      const button = screen.getByText('Mark Resolved');
      fireEvent.click(button);
      
      // Button should be clickable without errors
      expect(button).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('shows checkmark button in compact mode for non-completed', () => {
      const pendingAction = createTestAction({ status: 'pending' });
      render(<ActionItem action={pendingAction} productId={productId} compact />);
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('hides checkmark button for completed actions in compact mode', () => {
      const completedAction = createTestAction({ status: 'completed' });
      render(<ActionItem action={completedAction} productId={productId} compact />);
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });
  });

  describe('Timestamp', () => {
    it('displays last updated timestamp', () => {
      render(<ActionItem action={testAction} productId={productId} />);
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });
  });
});
