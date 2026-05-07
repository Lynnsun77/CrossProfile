import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHeroRecommendStore } from '../../features/hero-recommend/store/useHeroRecommendStore';
import { useRecommendStore } from '../../features/recommend/store/useRecommendStore';
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
        detailSource: 'hero',
        platformDetailContext: {
          grouped: null,
          tabKey: null,
          tabLabel: null,
        },
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
      useRecommendStore.getState().reset();
    });
  });

  afterEach(() => {
    act(() => {
      useHeroRecommendStore.getState()._clearTimers();
      useRecommendStore.getState().reset();
    });
    vi.useRealTimers();
  });

  it('页面仅保留 Hero 主入口并展示更多可浏览资产区', async () => {
    await renderPage();

    expect(screen.getByText('描述你的需求，AI 帮你找到最佳方案')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '需求输入' })).toBeInTheDocument();
    expect(screen.getByText('平台推荐')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: '平台推荐来源 Tab' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '自营标签' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('更多可浏览资产')).toBeInTheDocument();
    expect(screen.queryByText('平台推荐预览')).not.toBeInTheDocument();
    expect(screen.queryByText('推荐来源')).not.toBeInTheDocument();
    expect(screen.queryByText('以下画像资产高度匹配，可以直接配置使用')).not.toBeInTheDocument();
    expect(screen.queryByText('匹配到了与你的需求相似的画像资产')).not.toBeInTheDocument();
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

    fireEvent.click(screen.getAllByRole('button', { name: '去提需更多画像标签建设' })[0]!);
    expect(screen.getByText('缺口需求')).toBeInTheDocument();
  });

  it('平台推荐卡片点击后打开 RecommendationDetailModal，并按平台来源展示文案', async () => {
    await renderPage();

    const platformSection = screen.getByText('平台推荐').closest('section');
    expect(platformSection).not.toBeNull();
    expect(within(platformSection as HTMLElement).queryByText('ready（可直接复用）')).not.toBeInTheDocument();
    expect(within(platformSection as HTMLElement).queryByText('adaptable（可加工后使用）')).not.toBeInTheDocument();
    expect(within(platformSection as HTMLElement).queryByText(/高匹配|中匹配/)).not.toBeInTheDocument();
    fireEvent.click(within(platformSection as HTMLElement).getAllByRole('button', { name: '查看详情' })[0]!);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(useHeroRecommendStore.getState().detailSource).toBe('platform');
    expect(within(dialog).getByText(/平台推荐 \/ 自营标签 \/ ready（可直接复用）/)).toBeInTheDocument();
    expect(within(dialog).getByText('为什么平台推荐')).toBeInTheDocument();
    expect(within(dialog).getByText('推荐信心来源')).toBeInTheDocument();
    expect(within(dialog).getByText(/来源路径：/)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/平台推荐/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/自营标签/).length).toBeGreaterThan(0);
  });

  it('可切换到近期热门 tab，并将详情来源同步到平台上下文', async () => {
    await renderPage();

    const recentHotTab = screen.getByRole('tab', { name: '近期热门' });
    fireEvent.click(recentHotTab);
    expect(recentHotTab).toHaveAttribute('aria-selected', 'true');

    const platformSection = screen.getByText('平台推荐').closest('section');
    fireEvent.click(within(platformSection as HTMLElement).getAllByRole('button', { name: '查看详情' })[0]!);

    expect(useHeroRecommendStore.getState().platformDetailContext.tabKey).toBe('recent_hot');
    expect(useHeroRecommendStore.getState().platformDetailContext.tabLabel).toBe('近期热门');
    expect(screen.getByText('为什么近期热门')).toBeInTheDocument();
    expect(screen.getAllByText(/平台推荐/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/近期热门/).length).toBeGreaterThan(0);
  });
});
