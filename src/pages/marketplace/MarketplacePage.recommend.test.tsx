import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHeroRecommendStore } from '../../features/hero-recommend/store/useHeroRecommendStore';
import { MarketplacePage } from './MarketplacePage';
import { useGlobalState } from '../../store/globalState';

async function renderPage(initialEntry = '/marketplace?view=consumer') {
  const rendered = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Routes>
    </MemoryRouter>,
  );

  await act(async () => {
    vi.runOnlyPendingTimers();
  });

  return rendered;
}

describe('MarketplacePage 单一推荐主链路', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    act(() => {
      useGlobalState.setState({
        currentView: 'consumer',
        consumerSubRole: 'business',
      });
      useHeroRecommendStore.setState({
        heroDraft: { goalIds: [], sceneIds: [], text: '' },
        textLocked: false,
        analysisPhase: 'idle',
        analysisStep: 0,
        intentParsed: null,
        grouped: useHeroRecommendStore.getInitialState().grouped,
        summaryText: '',
        candidateIds: [],
        detailCardId: null,
        detailAnchor: 'top',
        submittedDeployCardIds: [],
        deploy: {
          open: false,
          cardId: null,
          downstream: null,
          libraUrl: '',
          status: 'draft',
          error: null,
        },
        _timers: [],
      });
    });
  });

  afterEach(() => {
    act(() => {
      useHeroRecommendStore.getState()._clearTimers();
    });
    vi.useRealTimers();
  });

  it('页面仅保留 Hero 主入口并展示更多可浏览资产区', async () => {
    await renderPage();

    expect(screen.getByText('描述你的需求，AI 帮你找到最佳方案')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '需求输入' })).toBeInTheDocument();
    expect(screen.getByText('更多可浏览资产')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '查询' })).not.toBeInTheDocument();
    expect(screen.queryByText('高级筛选')).not.toBeInTheDocument();
  });

  it('fallback 主按钮可打开缺口需求弹窗', async () => {
    await renderPage();

    fireEvent.change(screen.getByPlaceholderText('如：我想在生服用增场景提升订单量'), {
      target: { value: '我需要海外直播冷启动素材诊断标签' },
    });
    fireEvent.click(screen.getByRole('button', { name: '生成推荐' }));

    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: '去提需更多画像标签建设' }));
    expect(screen.getByText('缺口需求')).toBeInTheDocument();
  });
});
