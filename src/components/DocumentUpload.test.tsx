import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { DocumentUpload } from './DocumentUpload';

// Mock the hooks
vi.mock('@/hooks/useAIInsights', () => ({
  useUploadDocument: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      success: true,
      job_id: 'test-job-123',
      status: 'queued',
      filename: 'test.pdf',
      file_size_mb: 1.5,
      message: 'Document queued for processing',
    }),
    isPending: false,
  }),
  useJobStatus: (jobId: string | null) => ({
    data: jobId ? {
      status: 'completed',
      progress: 100,
      filename: 'test.pdf',
      extracted_chars: 5000,
      chroma_ingested: 10,
      cognee_ingested: true,
      cognee_note: 'Relationships build on next sync',
    } : null,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('DocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload button', () => {
    render(<DocumentUpload />);
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);
    
    await user.click(screen.getByRole('button', { name: /upload document/i }));
    
    expect(screen.getByText(/upload document to ai/i)).toBeInTheDocument();
    expect(screen.getByText(/drag & drop or click to upload/i)).toBeInTheDocument();
  });

  it('shows product link when productName is provided', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload productName="PayLink Express" productId="123" />);
    
    await user.click(screen.getByRole('button', { name: /upload document/i }));
    
    expect(screen.getByText(/linking to: paylink express/i)).toBeInTheDocument();
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    
    render(<DocumentUpload />);
    await user.click(screen.getByRole('button', { name: /upload document/i }));
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    // Create an invalid file
    const invalidFile = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('not supported'));
    });
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    
    render(<DocumentUpload />);
    await user.click(screen.getByRole('button', { name: /upload document/i }));
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a file larger than 10MB
    const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
    const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('too large'));
    });
  });

  it('accepts valid PDF file', async () => {
    const user = userEvent.setup();
    
    render(<DocumentUpload />);
    await user.click(screen.getByRole('button', { name: /upload document/i }));
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a valid PDF file
    const validFile = new File(['%PDF-1.4 test content'], 'document.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });
  });

  it('shows upload button when file is selected', async () => {
    const user = userEvent.setup();
    
    render(<DocumentUpload />);
    await user.click(screen.getByRole('button', { name: /upload document/i }));
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload to ai/i })).toBeInTheDocument();
    });
  });

  it('renders custom trigger', () => {
    render(
      <DocumentUpload 
        trigger={<button data-testid="custom-trigger">Custom Upload</button>} 
      />
    );
    
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });
});

