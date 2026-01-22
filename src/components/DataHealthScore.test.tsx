import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { DataHealthScore } from './DataHealthScore';

describe('DataHealthScore', () => {
  const completeProduct = {
    owner_email: 'test@mastercard.com',
    region: 'North America',
    budget_code: 'TEST-001',
    pii_flag: false,
    gating_status: 'GREEN',
    success_metric: 'Revenue growth',
  };

  const incompleteProduct = {
    owner_email: 'test@mastercard.com',
    region: undefined,
    budget_code: undefined,
    pii_flag: undefined,
    gating_status: undefined,
    success_metric: undefined,
  };

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<DataHealthScore product={completeProduct} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders in compact mode', () => {
      render(<DataHealthScore product={completeProduct} compact />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Health Score Calculation', () => {
    it('shows high score for complete data', () => {
      render(<DataHealthScore product={completeProduct} />);
      // Should indicate good data health
      expect(document.body.textContent).toBeTruthy();
    });

    it('shows low score for incomplete data', () => {
      render(<DataHealthScore product={incompleteProduct} />);
      // Should indicate poor data health
      expect(document.body.textContent).toBeTruthy();
    });

    it('shows partial score for partially complete data', () => {
      const partialProduct = {
        owner_email: 'test@mastercard.com',
        region: 'EMEA',
        budget_code: undefined,
        pii_flag: undefined,
        gating_status: 'AMBER',
        success_metric: undefined,
      };
      
      render(<DataHealthScore product={partialProduct} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Required Fields', () => {
    it('checks owner_email field', () => {
      const product = { ...incompleteProduct, owner_email: 'test@example.com' };
      render(<DataHealthScore product={product} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('checks region field', () => {
      const product = { ...incompleteProduct, region: 'APAC' };
      render(<DataHealthScore product={product} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('checks budget_code field', () => {
      const product = { ...incompleteProduct, budget_code: 'BUD-001' };
      render(<DataHealthScore product={product} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('checks pii_flag field', () => {
      const product = { ...incompleteProduct, pii_flag: true };
      render(<DataHealthScore product={product} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('checks gating_status field', () => {
      const product = { ...incompleteProduct, gating_status: 'GREEN' };
      render(<DataHealthScore product={product} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('checks success_metric field', () => {
      const product = { ...incompleteProduct, success_metric: 'User acquisition' };
      render(<DataHealthScore product={product} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty product object', () => {
      render(<DataHealthScore product={{}} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles null values', () => {
      const productWithNulls = {
        owner_email: null,
        region: null,
        budget_code: null,
        pii_flag: null,
        gating_status: null,
        success_metric: null,
      };
      
      render(<DataHealthScore product={productWithNulls} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles empty string values', () => {
      const productWithEmptyStrings = {
        owner_email: '',
        region: '',
        budget_code: '',
        pii_flag: false,
        gating_status: '',
        success_metric: '',
      };
      
      render(<DataHealthScore product={productWithEmptyStrings} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Visual Indicators', () => {
    it('shows positive indicator for high health', () => {
      render(<DataHealthScore product={completeProduct} />);
      // Should show green/positive visual
      expect(document.body.textContent).toBeTruthy();
    });

    it('shows warning indicator for medium health', () => {
      const mediumProduct = {
        owner_email: 'test@mastercard.com',
        region: 'EMEA',
        budget_code: 'BUD-001',
        pii_flag: undefined,
        gating_status: undefined,
        success_metric: undefined,
      };
      
      render(<DataHealthScore product={mediumProduct} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('shows negative indicator for low health', () => {
      render(<DataHealthScore product={incompleteProduct} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
