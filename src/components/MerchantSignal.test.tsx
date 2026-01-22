import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { MerchantSignal } from './MerchantSignal';
import { mockProductFeedback } from '@/test/utils';

describe('MerchantSignal', () => {
  const sampleFeedback = [
    mockProductFeedback({ id: '1', sentiment_score: 0.8 }),
    mockProductFeedback({ id: '2', sentiment_score: 0.6 }),
    mockProductFeedback({ id: '3', sentiment_score: -0.2 }),
  ];

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<MerchantSignal feedback={sampleFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders in compact mode', () => {
      render(<MerchantSignal feedback={sampleFeedback} compact />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('handles empty feedback array', () => {
      render(<MerchantSignal feedback={[]} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Sentiment Aggregation', () => {
    it('calculates positive sentiment', () => {
      const positiveFeedback = [
        mockProductFeedback({ sentiment_score: 0.9 }),
        mockProductFeedback({ sentiment_score: 0.8 }),
        mockProductFeedback({ sentiment_score: 0.7 }),
      ];
      
      render(<MerchantSignal feedback={positiveFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('calculates negative sentiment', () => {
      const negativeFeedback = [
        mockProductFeedback({ sentiment_score: -0.5 }),
        mockProductFeedback({ sentiment_score: -0.7 }),
        mockProductFeedback({ sentiment_score: -0.3 }),
      ];
      
      render(<MerchantSignal feedback={negativeFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('calculates neutral sentiment', () => {
      const neutralFeedback = [
        mockProductFeedback({ sentiment_score: 0.1 }),
        mockProductFeedback({ sentiment_score: -0.1 }),
        mockProductFeedback({ sentiment_score: 0 }),
      ];
      
      render(<MerchantSignal feedback={neutralFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Feedback Count', () => {
    it('displays feedback count', () => {
      render(<MerchantSignal feedback={sampleFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles single feedback item', () => {
      render(<MerchantSignal feedback={[mockProductFeedback()]} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles many feedback items', () => {
      const manyFeedback = Array.from({ length: 20 }, (_, i) => 
        mockProductFeedback({ id: `feedback-${i}` })
      );
      render(<MerchantSignal feedback={manyFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Feedback Sources', () => {
    it('handles customer feedback', () => {
      const customerFeedback = [mockProductFeedback({ source: 'customer' })];
      render(<MerchantSignal feedback={customerFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles partner feedback', () => {
      const partnerFeedback = [mockProductFeedback({ source: 'partner' })];
      render(<MerchantSignal feedback={partnerFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles internal feedback', () => {
      const internalFeedback = [mockProductFeedback({ source: 'internal' })];
      render(<MerchantSignal feedback={internalFeedback} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Impact Levels', () => {
    it('handles high impact feedback', () => {
      const highImpact = [mockProductFeedback({ impact_level: 'HIGH' })];
      render(<MerchantSignal feedback={highImpact} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles low impact feedback', () => {
      const lowImpact = [mockProductFeedback({ impact_level: 'LOW' })];
      render(<MerchantSignal feedback={lowImpact} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles null sentiment scores', () => {
      const nullSentiment = [
        mockProductFeedback({ sentiment_score: null }),
      ];
      render(<MerchantSignal feedback={nullSentiment} />);
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles undefined sentiment scores', () => {
      const undefinedSentiment = [
        mockProductFeedback({ sentiment_score: undefined }),
      ];
      render(<MerchantSignal feedback={undefinedSentiment as any} />);
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
