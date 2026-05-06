import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UsageSelector } from './UsageSelector';

describe('UsageSelector', () => {
  it('supports switching selected use case', () => {
    const onSelect = vi.fn();
    render(
      <UsageSelector
        options={[
          { key: 'marketing', label: '营销触达', description: 'desc1' },
          { key: 'recommendation', label: '推荐排序', description: 'desc2' },
        ]}
        selectedKey="marketing"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /推荐排序/i }));
    expect(onSelect).toHaveBeenCalledWith('recommendation');
  });
});
