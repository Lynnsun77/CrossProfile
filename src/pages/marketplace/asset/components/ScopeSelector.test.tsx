import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScopeSelector } from './ScopeSelector';

describe('ScopeSelector', () => {
  it('applies edited scope', () => {
    const onApply = vi.fn();
    render(
      <ScopeSelector
        data={{
          editable: true,
          scopeLabel: '原始范围',
          dimensions: [{ label: '域', value: '跨域' }],
        }}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /编辑/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '新的范围定义' } });
    fireEvent.click(screen.getByRole('button', { name: /应用并重算/i }));

    expect(onApply).toHaveBeenCalledWith('新的范围定义');
  });
});
