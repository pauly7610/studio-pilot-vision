import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { DependencyBadges, Dependency } from './DependencyBadges';

const mockDependencies: Dependency[] = [
  {
    id: '1',
    name: 'Stripe Payment Rails',
    type: 'external',
    category: 'partner_rail',
    status: 'blocked',
    blockedSince: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    notes: 'Waiting on Stripe API v3',
  },
  {
    id: '2',
    name: 'Legal Review',
    type: 'internal',
    category: 'legal',
    status: 'pending',
    notes: 'Privacy team review in progress',
  },
  {
    id: '3',
    name: 'SOC2 Certification',
    type: 'internal',
    category: 'compliance',
    status: 'resolved',
    notes: 'Completed Dec 2025',
  },
];

describe('DependencyBadges', () => {
  it('renders nothing when no dependencies', () => {
    const { container } = render(<DependencyBadges dependencies={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dependencies with correct labels', () => {
    render(<DependencyBadges dependencies={mockDependencies} />);
    
    expect(screen.getByText('Stripe Payment Rails')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('shows blocked count badge', () => {
    render(<DependencyBadges dependencies={mockDependencies} />);
    
    expect(screen.getByText('1 Blocked')).toBeInTheDocument();
  });

  it('shows blocked duration', () => {
    render(<DependencyBadges dependencies={mockDependencies} />);
    
    // 14 days = 2 weeks
    expect(screen.getByText('2w')).toBeInTheDocument();
  });

  it('filters to only blockers when showOnlyBlockers is true', () => {
    render(<DependencyBadges dependencies={mockDependencies} showOnlyBlockers />);
    
    expect(screen.getByText('Stripe Payment Rails')).toBeInTheDocument();
    expect(screen.queryByText('Legal')).not.toBeInTheDocument();
    expect(screen.queryByText('Compliance')).not.toBeInTheDocument();
  });

  it('renders compact mode', () => {
    render(<DependencyBadges dependencies={mockDependencies} compact />);
    
    // In compact mode, should show summary badges
    expect(screen.getByText('1 Blocker')).toBeInTheDocument();
    expect(screen.getByText('2 Int')).toBeInTheDocument();
    expect(screen.getByText('1 Ext')).toBeInTheDocument();
  });

  it('handles external dependencies correctly', () => {
    const externalOnly: Dependency[] = [
      {
        id: '1',
        name: 'Visa API',
        type: 'external',
        category: 'api',
        status: 'pending',
      },
    ];
    
    render(<DependencyBadges dependencies={externalOnly} />);
    
    // External deps show name, not category label
    expect(screen.getByText('Visa API')).toBeInTheDocument();
  });

  it('handles internal dependencies correctly', () => {
    const internalOnly: Dependency[] = [
      {
        id: '1',
        name: 'Cyber Review',
        type: 'internal',
        category: 'cyber',
        status: 'pending',
      },
    ];
    
    render(<DependencyBadges dependencies={internalOnly} />);
    
    // Internal deps show category label
    expect(screen.getByText('Cyber')).toBeInTheDocument();
  });
});

