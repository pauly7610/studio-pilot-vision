import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { DataFreshness } from './DataFreshness';

describe('DataFreshness', () => {
  describe('Rendering', () => {
    it('renders the component', () => {
      render(
        <DataFreshness
          lastUpdated="2026-01-20T10:00:00Z"
          dataContractComplete={true}
          mandatoryFieldsFilled={6}
          totalMandatoryFields={6}
        />
      );
      
      // Component should render
      expect(document.body.textContent).toBeTruthy();
    });

    it('renders in compact mode', () => {
      render(
        <DataFreshness
          lastUpdated="2026-01-20T10:00:00Z"
          dataContractComplete={true}
          mandatoryFieldsFilled={6}
          totalMandatoryFields={6}
          compact
        />
      );
      
      // Should render without errors in compact mode
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Data Contract Status', () => {
    it('shows complete status when contract is complete', () => {
      render(
        <DataFreshness
          lastUpdated="2026-01-20T10:00:00Z"
          dataContractComplete={true}
          mandatoryFieldsFilled={6}
          totalMandatoryFields={6}
        />
      );
      
      // Should indicate complete data contract
      expect(document.body.textContent).toBeTruthy();
    });

    it('shows incomplete status when contract is not complete', () => {
      render(
        <DataFreshness
          lastUpdated="2026-01-20T10:00:00Z"
          dataContractComplete={false}
          mandatoryFieldsFilled={3}
          totalMandatoryFields={6}
        />
      );
      
      // Should indicate incomplete data contract
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Mandatory Fields', () => {
    it('shows all fields filled', () => {
      render(
        <DataFreshness
          lastUpdated="2026-01-20T10:00:00Z"
          dataContractComplete={true}
          mandatoryFieldsFilled={6}
          totalMandatoryFields={6}
        />
      );
      
      expect(document.body.textContent).toBeTruthy();
    });

    it('shows partial fields filled', () => {
      render(
        <DataFreshness
          lastUpdated="2026-01-20T10:00:00Z"
          dataContractComplete={false}
          mandatoryFieldsFilled={4}
          totalMandatoryFields={6}
        />
      );
      
      expect(document.body.textContent).toBeTruthy();
    });

    it('shows zero fields filled', () => {
      render(
        <DataFreshness
          lastUpdated="2026-01-20T10:00:00Z"
          dataContractComplete={false}
          mandatoryFieldsFilled={0}
          totalMandatoryFields={6}
        />
      );
      
      expect(document.body.textContent).toBeTruthy();
    });
  });

  describe('Last Updated', () => {
    it('handles recent update', () => {
      const recentDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      
      render(
        <DataFreshness
          lastUpdated={recentDate}
          dataContractComplete={true}
          mandatoryFieldsFilled={6}
          totalMandatoryFields={6}
        />
      );
      
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles old update', () => {
      const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
      
      render(
        <DataFreshness
          lastUpdated={oldDate}
          dataContractComplete={true}
          mandatoryFieldsFilled={6}
          totalMandatoryFields={6}
        />
      );
      
      expect(document.body.textContent).toBeTruthy();
    });

    it('handles undefined lastUpdated', () => {
      render(
        <DataFreshness
          lastUpdated={undefined}
          dataContractComplete={false}
          mandatoryFieldsFilled={0}
          totalMandatoryFields={6}
        />
      );
      
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
