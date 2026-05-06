import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TryPanel } from './TryPanel';

describe('TryPanel', () => {
  it('runs try calculation and renders result', async () => {
    render(
      <TryPanel
        presets={[
          { id: 'preset-marketing', label: '营销促活', scenario: '券投放', expectedReach: 1280000, expectedLift: 0.18 },
        ]}
        initialResult={{
          selectedPresetId: 'preset-marketing',
          expectedReach: 1280000,
          expectedLift: 0.18,
          expectedRisk: '覆盖过滤后可控',
          latencyMs: 1840,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /运行试算/i }));

    await waitFor(() => {
      expect(screen.getByText(/1840ms/i)).toBeInTheDocument();
    });
  });
});
