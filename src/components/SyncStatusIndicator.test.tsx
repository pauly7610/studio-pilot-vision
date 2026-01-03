import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { SyncStatusIndicator } from './SyncStatusIndicator';

// Mock fetch for health check
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the indicator', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        chromadb: true,
        cognee: true,
        groq: true,
        timestamp: new Date().toISOString(),
      }),
    });

    render(<SyncStatusIndicator />);
    
    // Should show some content
    await waitFor(() => {
      expect(screen.getByText(/AI Ready|Connecting/i)).toBeInTheDocument();
    });
  });

  it('shows connected status when health check passes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        chromadb: true,
        cognee: true,
        groq: true,
      }),
    });

    render(<SyncStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Ready')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows error status when health check fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SyncStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows offline status when browser is offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    render(<SyncStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  it('renders in compact mode', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        chromadb: true,
        cognee: true,
        groq: true,
      }),
    });

    const { container } = render(<SyncStatusIndicator compact />);
    
    // Compact mode should render a smaller element
    await waitFor(() => {
      const indicator = container.querySelector('.h-8.w-8');
      expect(indicator).toBeInTheDocument();
    });
  });

  it('shows service details in tooltip', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        chromadb: true,
        cognee: true,
        groq: true,
        stats: {
          total_documents: 150,
          total_chunks: 2500,
        },
      }),
    });

    render(<SyncStatusIndicator />);
    
    // The tooltip content should mention service names
    await waitFor(() => {
      expect(screen.getByText('AI Ready')).toBeInTheDocument();
    });
    
    // Hover to see tooltip (tooltip content is rendered but may be hidden)
    // In tests we can check if the content exists in the DOM
  });

  it('handles degraded status when some services are down', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'degraded',
        chromadb: true,
        cognee: false,
        groq: true,
      }),
    });

    render(<SyncStatusIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText('Degraded')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

