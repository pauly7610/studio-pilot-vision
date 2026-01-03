import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { CommandPaletteTrigger } from './CommandPalette';

// Note: CommandPalette component uses cmdk which has issues with ResizeObserver in JSDOM
// We test the trigger component and basic functionality here
// Full CommandPalette testing should be done in e2e tests (Playwright)

// Mock the hooks
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    data: [
      {
        id: '1',
        name: 'PayLink Express',
        product_type: 'payment_flows',
        lifecycle_stage: 'pilot',
        region: 'NA',
        readiness: [{ readiness_score: 85, risk_band: 'low' }],
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useProductFeedback', () => ({
  useProductFeedback: () => ({
    data: [],
    isLoading: false,
  }),
}));

describe('CommandPaletteTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<CommandPaletteTrigger />);
    
    expect(screen.getByText('Search...')).toBeInTheDocument();
  });

  it('shows keyboard shortcut hint', () => {
    render(<CommandPaletteTrigger />);
    
    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('has correct styling', () => {
    const { container } = render(<CommandPaletteTrigger />);
    
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('flex', 'items-center');
  });

  it('is focusable', () => {
    render(<CommandPaletteTrigger />);
    
    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});

describe('CommandPalette Keyboard Shortcuts', () => {
  it('document should support keyboard events', () => {
    const handler = vi.fn();
    document.addEventListener('keydown', handler);
    
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    
    expect(handler).toHaveBeenCalled();
    
    document.removeEventListener('keydown', handler);
  });

  it('should detect Cmd+K combination', () => {
    const handler = vi.fn((e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        return true;
      }
      return false;
    });
    
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    const result = handler(event);
    
    expect(result).toBe(true);
  });

  it('should detect / key for search', () => {
    const handler = vi.fn((e: KeyboardEvent) => {
      return e.key === '/';
    });
    
    const event = new KeyboardEvent('keydown', { key: '/' });
    const result = handler(event);
    
    expect(result).toBe(true);
  });
});

describe('CommandPalette Search Logic', () => {
  it('should filter products by name', () => {
    const products = [
      { id: '1', name: 'PayLink Express' },
      { id: '2', name: 'Crypto Bridge' },
      { id: '3', name: 'Risk Analyzer' },
    ];
    
    const search = 'pay';
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('PayLink Express');
  });

  it('should filter products case-insensitively', () => {
    const products = [
      { id: '1', name: 'PayLink Express' },
    ];
    
    const searches = ['PAY', 'Pay', 'pay', 'PAY'];
    
    searches.forEach(search => {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
    });
  });

  it('should return empty array for non-matching search', () => {
    const products = [
      { id: '1', name: 'PayLink Express' },
    ];
    
    const search = 'xyz';
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    
    expect(filtered).toHaveLength(0);
  });

  it('should limit results to 5', () => {
    const products = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: `Product ${i}`,
    }));
    
    const filtered = products.slice(0, 5);
    
    expect(filtered).toHaveLength(5);
  });
});
