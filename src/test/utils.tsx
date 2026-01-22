import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { Product } from '@/hooks/useProducts';

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: ReactNode;
}

function AllTheProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Create a mock product with sensible defaults
 */
export const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'test-product-uuid',
  name: 'Test Product',
  product_type: 'core_products',
  region: 'North America',
  lifecycle_stage: 'pilot',
  launch_date: '2026-03-15',
  revenue_target: 5000000,
  owner_email: 'test@mastercard.com',
  success_metric: 'Revenue growth',
  gating_status: 'GREEN',
  governance_tier: 'standard',
  budget_code: 'TEST-001',
  pii_flag: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  revenue_confidence: 0.85,
  timeline_confidence: 0.75,
  ttm_target_days: 90,
  ttm_actual_days: 85,
  readiness: [{ readiness_score: 75, risk_band: 'medium', momentum: 'improving' }],
  prediction: [{ success_probability: 0.82, confidence_level: 0.9 }],
  compliance: [],
  market_evidence: [],
  partners: [],
  dependencies: [],
  ...overrides,
});

/**
 * Create a high-risk product
 */
export const mockHighRiskProduct = (overrides: Partial<Product> = {}): Product =>
  mockProduct({
    name: 'High Risk Product',
    lifecycle_stage: 'early_pilot',
    readiness: [{ readiness_score: 45, risk_band: 'high', momentum: 'declining' }],
    prediction: [{ success_probability: 0.35, confidence_level: 0.7 }],
    gating_status: 'RED',
    ...overrides,
  });

/**
 * Create a top-performing product
 */
export const mockTopPerformer = (overrides: Partial<Product> = {}): Product =>
  mockProduct({
    name: 'Top Performer',
    lifecycle_stage: 'commercial',
    readiness: [{ readiness_score: 92, risk_band: 'low', momentum: 'improving' }],
    prediction: [{ success_probability: 0.95, confidence_level: 0.95 }],
    gating_status: 'GREEN',
    revenue_target: 15000000,
    ...overrides,
  });

/**
 * Create a mock product action
 */
export const mockProductAction = (overrides: Record<string, unknown> = {}) => ({
  id: 'action-uuid',
  product_id: 'test-product-uuid',
  action_type: 'intervention',
  title: 'Test Action',
  description: 'Test action description',
  status: 'pending',
  priority: 'medium',
  assigned_to: 'test@mastercard.com',
  due_date: '2026-02-15',
  created_at: '2026-01-15T00:00:00Z',
  ...overrides,
});

/**
 * Create a mock product feedback item
 */
export const mockProductFeedback = (overrides: Record<string, unknown> = {}) => ({
  id: 'feedback-uuid',
  product_id: 'test-product-uuid',
  source: 'customer',
  theme: 'usability',
  raw_text: 'Great product, needs better documentation',
  sentiment_score: 0.7,
  impact_level: 'MEDIUM',
  created_at: '2026-01-10T00:00:00Z',
  ...overrides,
});

/**
 * Create a mock dependency
 */
export const mockDependency = (overrides: Record<string, unknown> = {}) => ({
  id: 'dependency-uuid',
  name: 'External API Integration',
  type: 'external',
  category: 'api',
  status: 'pending',
  blockedSince: null,
  notes: 'Waiting on partner approval',
  ...overrides,
});

/**
 * Create a blocked dependency
 */
export const mockBlockedDependency = (overrides: Record<string, unknown> = {}) =>
  mockDependency({
    name: 'Partner Rail',
    type: 'external',
    category: 'partner_rail',
    status: 'blocked',
    blockedSince: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Blocked by partner approval process',
    ...overrides,
  });

/**
 * Create a mock AI insight response
 */
export const mockAIInsightResponse = (overrides: Record<string, unknown> = {}) => ({
  success: true,
  insight: 'Based on the portfolio analysis, 3 products are at risk of missing Q1 targets.',
  sources: [
    { text: 'Product: Test Product, Stage: pilot, Risk: medium', metadata: {}, score: 0.95 },
    { text: 'Product: Another Product, Stage: scaling, Risk: low', metadata: {}, score: 0.88 },
  ],
  error: null,
  usage: { prompt_tokens: 150, completion_tokens: 200, total_tokens: 350 },
  ...overrides,
});

/**
 * Create a list of mock products for portfolio testing
 */
export const mockProductPortfolio = (): Product[] => [
  mockProduct({ id: 'prod-1', name: 'Product Alpha', region: 'North America' }),
  mockProduct({ id: 'prod-2', name: 'Product Beta', region: 'EMEA', lifecycle_stage: 'scaling' }),
  mockHighRiskProduct({ id: 'prod-3', name: 'Product Gamma', region: 'APAC' }),
  mockTopPerformer({ id: 'prod-4', name: 'Product Delta', region: 'North America' }),
  mockProduct({ id: 'prod-5', name: 'Product Epsilon', region: 'Africa', lifecycle_stage: 'concept' }),
];

// ============================================================================
// MOCK HOOK FACTORIES
// ============================================================================

/**
 * Create mock for useProducts hook
 */
export const createMockUseProducts = (products: Product[] = mockProductPortfolio()) => ({
  data: products,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
});

/**
 * Create mock for useAIHealth hook
 */
export const createMockUseAIHealth = (isHealthy = true) => ({
  data: isHealthy 
    ? { status: 'healthy', vector_store: { connected: true, document_count: 150 }, cognee_initialized: true }
    : { status: 'unhealthy', vector_store: { connected: false, document_count: 0 }, cognee_initialized: false },
  isLoading: false,
  isError: !isHealthy,
});

/**
 * Create mock for useAIQuery hook
 */
export const createMockUseAIQuery = () => ({
  mutateAsync: vi.fn().mockResolvedValue(mockAIInsightResponse()),
  isPending: false,
  isError: false,
  error: null,
});

/**
 * Create mock for useProductActions hook
 */
export const createMockUseProductActions = (actions = [mockProductAction()]) => ({
  data: actions,
  isLoading: false,
  isError: false,
});

// ============================================================================
// CHART MOCKS (for recharts)
// ============================================================================

/**
 * Common recharts mock for components that use charts
 */
export const rechartsModuleMock = {
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scatter-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Pie: () => <div data-testid="pie" />,
  Scatter: () => <div data-testid="scatter" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

