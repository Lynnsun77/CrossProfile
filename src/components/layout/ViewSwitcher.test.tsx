import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ViewSwitcher } from './ViewSwitcher';

describe('ViewSwitcher', () => {
  it('switches to next enabled view', () => {
    const onSwitch = vi.fn();
    render(
      <ViewSwitcher
        current_view="consumer"
        available_views={[
          { view: 'consumer', label: '消费方', description: 'desc', disabled: false },
          { view: 'producer', label: '供给方', description: 'desc', disabled: false },
        ]}
        on_switch={onSwitch}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /供给方/i }));
    expect(onSwitch).toHaveBeenCalledWith('producer');
  });

  it('maps operator current view to producer selection when operator is hidden', () => {
    render(
      <ViewSwitcher
        current_view="operator"
        available_views={[
          { view: 'consumer', label: '消费方', description: 'desc', disabled: false },
          { view: 'producer', label: '供给方', description: 'desc', disabled: false },
        ]}
        on_switch={vi.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: /供给方/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /消费方/i })).toHaveAttribute('aria-selected', 'false');
  });
});
