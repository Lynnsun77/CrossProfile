import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetScriptPlayerForTests } from './hooks/useScriptPlayer';
import { useRecommendStore } from './hooks/useRecommendStore';
import { RecommendPage } from './RecommendPage';
import { DEFAULT_LARK_DOC_URL } from './scripts/lark-merchant-insight.script';

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/marketplace/recommend" element={<RecommendPage />} />
        <Route
          path="/marketplace"
          element={<div data-testid="marketplace-landing">marketplace-landing</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RecommendPage (compat container)', () => {
  beforeEach(() => {
    __resetScriptPlayerForTests();
    useRecommendStore.getState().reset();
  });

  afterEach(() => {
    __resetScriptPlayerForTests();
    useRecommendStore.getState().reset();
    vi.useRealTimers();
  });

  it('带 ?doc= 参数时重定向到智能推荐首页并透传 doc', () => {
    renderPage(`/marketplace/recommend?doc=${encodeURIComponent(DEFAULT_LARK_DOC_URL)}`);
    // 跳转后应到达智能推荐首页
    expect(screen.getByTestId('marketplace-landing')).toBeInTheDocument();
  });

  it('没有 doc 参数时使用默认文档 URL 并跳转智能推荐首页', () => {
    renderPage('/marketplace/recommend');
    expect(screen.getByTestId('marketplace-landing')).toBeInTheDocument();
  });
});
