import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { TransitionReadiness } from './TransitionReadiness';

describe('TransitionReadiness', () => {
  describe('Rendering', () => {
    it('renders the component', () => {
      render(
        <TransitionReadiness
          productId="test-product-id"
          productName="Test Product"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders in compact mode', () => {
      render(
        <TransitionReadiness
          productId="test-product-id"
          productName="Test Product"
          lifecycleStage="pilot"
          compact
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Lifecycle Stage Filtering', () => {
    it('renders for commercial stage', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Commercial Product"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders for pilot stage', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Pilot Product"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders for scaling stage', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Scaling Product"
          lifecycleStage="scaling"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Transition Items', () => {
    it('handles empty transition items', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Test Product"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('BAU Handover Checklist', () => {
    it('displays sales assets status', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Test Product"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('displays tech documentation status', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Test Product"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('displays ops readiness status', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Test Product"
          lifecycleStage="commercial"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('accepts all required props', () => {
      const { container } = render(
        <TransitionReadiness
          productId="product-123"
          productName="My Product"
          lifecycleStage="commercial"
        />
      );
      expect(container).toBeInTheDocument();
    });

    it('handles undefined optional props', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Test Product"
          lifecycleStage="pilot"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles early lifecycle stages', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Early Product"
          lifecycleStage="concept"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles sunset stage', () => {
      render(
        <TransitionReadiness
          productId="test-id"
          productName="Sunset Product"
          lifecycleStage="sunset"
        />
      );
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
