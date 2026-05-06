import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataSourceBadge } from './DataSourceBadge';

describe('DataSourceBadge', () => {
  it('renders BTM+ label and tooltip for btm_plus', () => {
    const { container } = render(<DataSourceBadge type="btm_plus" />);
    expect(screen.getByText('BTM+')).toBeInTheDocument();
    const badge = container.querySelector('span[title]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('title')).toContain('平台自建');
  });

  it('renders 外采 label and tooltip for external', () => {
    const { container } = render(<DataSourceBadge type="external" />);
    expect(screen.getByText('外采')).toBeInTheDocument();
    const badge = container.querySelector('span[title]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('title')).toContain('外部');
  });

  it('renders 跨域 label and tooltip for cross_domain', () => {
    const { container } = render(<DataSourceBadge type="cross_domain" />);
    expect(screen.getByText('跨域')).toBeInTheDocument();
    const badge = container.querySelector('span[title]');
    expect(badge).not.toBeNull();
    const title = badge!.getAttribute('title') ?? '';
    expect(title.includes('跨业务域') || title.includes('跨域')).toBe(true);
  });

  it('renders 小端 label and tooltip for private_end', () => {
    const { container } = render(<DataSourceBadge type="private_end" />);
    expect(screen.getByText('小端')).toBeInTheDocument();
    const badge = container.querySelector('span[title]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('title')).toContain('小端');
  });

  it('renders 未标注 label and tooltip when type is not provided', () => {
    const { container } = render(<DataSourceBadge />);
    expect(screen.getByText('未标注')).toBeInTheDocument();
    const badge = container.querySelector('span[title]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('title')).toContain('未标注');
  });
});
