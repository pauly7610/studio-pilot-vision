import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { MomentumIndicator } from './MomentumIndicator';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
}));

describe('MomentumIndicator', () => {
  const mockImprovingData = [
    { value: 60 },
    { value: 65 },
    { value: 68 },
    { value: 75 },
    { value: 78 },
    { value: 82 },
  ];

  const mockDecliningData = [
    { value: 80 },
    { value: 78 },
    { value: 75 },
    { value: 70 },
    { value: 65 },
    { value: 60 },
  ];

  const mockStableData = [
    { value: 70 },
    { value: 70 },
    { value: 71 },
    { value: 70 },
    { value: 70 },
    { value: 71 },
  ];

  it('renders the component', () => {
    render(
      <MomentumIndicator 
        data={mockImprovingData}
        currentValue={82}
        previousValue={60}
      />
    );
    
    // Component should render
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('shows improving status when values trend up', () => {
    render(
      <MomentumIndicator 
        data={mockImprovingData}
        currentValue={82}
        previousValue={60}
      />
    );
    
    expect(screen.getByText('Improving')).toBeInTheDocument();
  });

  it('shows declining status when values trend down', () => {
    render(
      <MomentumIndicator 
        data={mockDecliningData}
        currentValue={60}
        previousValue={80}
      />
    );
    
    expect(screen.getByText('Declining')).toBeInTheDocument();
  });

  it('shows stable status when values are flat', () => {
    render(
      <MomentumIndicator 
        data={mockStableData}
        currentValue={70}
        previousValue={70}
      />
    );
    
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('renders sparkline chart elements', () => {
    render(
      <MomentumIndicator 
        data={mockImprovingData}
        currentValue={82}
        previousValue={60}
      />
    );
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
  });

  it('shows positive delta for improving trend', () => {
    render(
      <MomentumIndicator 
        data={mockImprovingData}
        currentValue={82}
        previousValue={60}
      />
    );
    
    // Shows positive percentage change
    expect(screen.getByText(/\+\d+/)).toBeInTheDocument();
  });

  it('shows negative delta for declining trend', () => {
    render(
      <MomentumIndicator 
        data={mockDecliningData}
        currentValue={60}
        previousValue={80}
      />
    );
    
    // Shows negative percentage change
    expect(screen.getByText(/-\d+/)).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(
      <MomentumIndicator 
        data={mockImprovingData}
        currentValue={82}
        previousValue={60}
        compact
      />
    );
    
    // Compact mode shows delta value
    expect(screen.getByText(/\+22%/)).toBeInTheDocument();
  });
});
