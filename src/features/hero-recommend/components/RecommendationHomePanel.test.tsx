import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroupedRecommendations, RecommendationCard } from '../types';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { RecommendationHomePanel } from './RecommendationHomePanel';

function makeHeroCard(
  partial: Partial<RecommendationCard> & Pick<RecommendationCard, 'id' | 'name' | 'group'>,
): RecommendationCard {
  return {
    ...partial,
    id: partial.id,
    group: partial.group,
    name: partial.name,
    objectType: partial.objectType ?? '策略',
    matchScore: partial.matchScore ?? (partial.group === 'ready' ? 92 : 76),
    matchLabel: partial.matchLabel ?? (partial.group === 'ready' ? '高匹配' : '中匹配'),
    oneLineReason: partial.oneLineReason ?? `${partial.name} 的推荐理由`,
    hitTags: partial.hitTags ?? ['cross', 'BTM+', '人群包'],
    metrics: partial.metrics ?? [
      { label: 'GMV', value: '+12%' },
      { label: '人群规模', value: '128万' },
      { label: '置信度', value: '92%' },
    ],
    goals: partial.goals ?? ['orders'],
    scenes: partial.scenes ?? ['local_growth'],
    preferenceTags: partial.preferenceTags ?? ['高复用'],
    reasons: partial.reasons ?? ['命中目标', '历史复用高'],
  };
}

function resetHeroStore(grouped?: GroupedRecommendations) {
  useHeroRecommendStore.setState({
    heroDraft: { goalIds: [], sceneIds: [], text: '' },
    textLocked: false,
    analysisPhase: grouped ? 'ready' : 'idle',
    analysisStep: 0,
    intentParsed: null,
    grouped: grouped ?? useHeroRecommendStore.getInitialState().grouped,
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
}

describe('RecommendationHomePanel', () => {
  beforeEach(() => {
    resetHeroStore();
  });

  afterEach(() => {
    act(() => {
      useHeroRecommendStore.getState()._clearTimers();
    });
    vi.restoreAllMocks();
  });

  it('ready 卡片可直接复用一键配置弹窗完成配置', () => {
    resetHeroStore({
      ready: [makeHeroCard({ id: 'ready_1', name: 'ready_card', group: 'ready' })],
      adaptable: [],
      fallback: { show: false },
    });

    render(<RecommendationHomePanel />);

    fireEvent.click(screen.getByRole('button', { name: '一键配置' }));

    expect(screen.getByRole('dialog', { name: '一键配置' })).toBeInTheDocument();
    expect(screen.getByText('下游应用系统')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '生服 DMP（LDMP）' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '北冰洋' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '生服 DMP（LDMP）' } });
    fireEvent.change(screen.getByPlaceholderText('https://...'), {
      target: { value: 'https://example.com/libra/task' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(screen.getByText('已提交配置请求')).toBeInTheDocument();
    expect(useHeroRecommendStore.getState().deploy.open).toBe(false);
    expect(useHeroRecommendStore.getState().submittedDeployCardIds).toEqual(['ready_1']);
    expect(screen.getByRole('button', { name: '已提交配置' })).toBeInTheDocument();
  });

  it('ready 详情弹窗展示一键配置，adaptable 详情弹窗保留候选动作', () => {
    resetHeroStore({
      ready: [makeHeroCard({ id: 'ready_2', name: 'ready_detail_card', group: 'ready' })],
      adaptable: [makeHeroCard({ id: 'adapt_1', name: 'adapt_detail_card', group: 'adaptable', objectType: '人群' })],
      fallback: { show: false },
    });

    render(<RecommendationHomePanel />);

    fireEvent.click(screen.getAllByRole('button', { name: '查看详情' })[0]);
    const readyDialog = screen.getByRole('dialog', { name: 'ready_detail_card详情' });
    expect(within(readyDialog).getByRole('button', { name: '一键配置' })).toBeInTheDocument();
    expect(within(readyDialog).getByText('为什么推荐你')).toBeInTheDocument();
    expect(within(readyDialog).getByText('推荐信心来源')).toBeInTheDocument();
    expect(within(readyDialog).getByText('适用场景判断')).toBeInTheDocument();
    expect(within(readyDialog).getByText('接入建议')).toBeInTheDocument();
    expect(within(readyDialog).getByText('数据来源与血缘')).toBeInTheDocument();

    fireEvent.click(within(readyDialog).getByRole('button', { name: '一键配置' }));
    expect(screen.getByRole('dialog', { name: 'ready_detail_card详情' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '一键配置' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getAllByRole('button', { name: '查看详情' })[1]);

    const adaptableDialog = screen.getByRole('dialog', { name: 'adapt_detail_card详情' });
    expect(within(adaptableDialog).queryByRole('button', { name: '一键配置' })).not.toBeInTheDocument();

    const addCandidateButton = within(adaptableDialog).getByRole('button', { name: '加入候选' });
    fireEvent.click(addCandidateButton);

    expect(useHeroRecommendStore.getState().candidateIds).toEqual(['adapt_1']);
    expect(within(adaptableDialog).getByRole('button', { name: '已加入候选' })).toBeInTheDocument();
  });

  it('卡片的为什么推荐动作会打开详情并定位到原因模块', () => {
    resetHeroStore({
      ready: [makeHeroCard({ id: 'ready_anchor', name: 'anchor_card', group: 'ready' })],
      adaptable: [],
      fallback: { show: false },
    });

    const scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    render(<RecommendationHomePanel />);

    fireEvent.click(screen.getByRole('button', { name: '为什么推荐' }));

    expect(screen.getByRole('dialog', { name: 'anchor_card详情' })).toBeInTheDocument();
    expect(useHeroRecommendStore.getState().detailAnchor).toBe('reason');
    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it('从 ready 详情提交配置后保留详情并更新为已提交状态', () => {
    resetHeroStore({
      ready: [makeHeroCard({ id: 'ready_submit', name: 'submit_card', group: 'ready' })],
      adaptable: [],
      fallback: { show: false },
    });

    render(<RecommendationHomePanel />);

    fireEvent.click(screen.getByRole('button', { name: '查看详情' }));
    const detailDialog = screen.getByRole('dialog', { name: 'submit_card详情' });
    fireEvent.click(within(detailDialog).getByRole('button', { name: '一键配置' }));

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '北冰洋' } });
    fireEvent.change(screen.getByPlaceholderText('https://...'), {
      target: { value: 'https://example.com/submit' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(screen.queryByRole('dialog', { name: '一键配置' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'submit_card详情' })).toBeInTheDocument();
    expect(within(screen.getByRole('dialog', { name: 'submit_card详情' })).getAllByRole('button', { name: '已提交配置' }).length).toBeGreaterThan(0);
    expect(screen.getByText('已提交配置请求')).toBeInTheDocument();
  });

  it('ready 卡片左上角固定展示收益最优/匹配度最高及对应说明标签', () => {
    resetHeroStore({
      ready: [
        makeHeroCard({
          id: 'ready_benefit',
          name: 'benefit_card',
          group: 'ready',
          highlightTag: '收益最优',
          metrics: [
            { label: 'GMV', value: '+15%' },
            { label: '人群规模', value: '210万' },
            { label: '置信度', value: '90%' },
          ],
        }),
        makeHeroCard({
          id: 'ready_match',
          name: 'match_card',
          group: 'ready',
          highlightTag: '匹配度最高',
          matchScore: 95,
        }),
      ],
      adaptable: [],
      fallback: { show: false },
    });

    render(<RecommendationHomePanel />);

    expect(screen.getByText('收益最优')).toBeInTheDocument();
    expect(screen.getByText('匹配度最高')).toBeInTheDocument();
    expect(screen.getByText('历史收益GMV +15%')).toBeInTheDocument();
    expect(screen.getByText('高匹配 95%')).toBeInTheDocument();
  });

  it('系统已理解你的需求模块支持编辑并重新生成', () => {
    vi.useFakeTimers();
    useHeroRecommendStore.setState({
      ...useHeroRecommendStore.getState(),
      heroDraft: { goalIds: ['orders'], sceneIds: ['local_growth'], text: '我想在生服用增场景提升订单量' },
      textLocked: true,
      analysisPhase: 'ready',
      analysisStep: 4,
      intentParsed: {
        target: '提升订单量',
        scene: '生服用增',
        objectType: '策略',
        preference: '高复用',
        goalIds: ['orders'],
        sceneIds: ['local_growth'],
        rawText: '我想在生服用增场景提升订单量',
      },
      grouped: {
        ready: [makeHeroCard({ id: 'ready_edit', name: 'initial_card', group: 'ready', goals: ['orders'], scenes: ['local_growth'] })],
        adaptable: [],
        fallback: { show: false },
      },
      summaryText: '当前有 1 个结果',
    });

    render(<RecommendationHomePanel />);

    const summaryPanel = screen.getByText('系统已理解你的需求').closest('div.rounded-2xl');
    expect(summaryPanel).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '编辑' }));
    const inputs = within(summaryPanel as HTMLElement).getAllByRole('textbox');
    const preferenceSelect = within(summaryPanel as HTMLElement).getByRole('combobox');
    fireEvent.change(inputs[0], { target: { value: '拉升 GMV' } });
    fireEvent.change(inputs[1], { target: { value: '电商营销' } });
    fireEvent.change(preferenceSelect, { target: { value: '优先高匹配方案' } });
    fireEvent.click(screen.getByRole('button', { name: '重新生成' }));

    act(() => {
      vi.runAllTimers();
    });

    expect(useHeroRecommendStore.getState().intentParsed?.target).toBe('拉升 GMV');
    expect(useHeroRecommendStore.getState().intentParsed?.scene).toBe('电商营销');
    expect(useHeroRecommendStore.getState().intentParsed?.preference).toBe('优先高匹配方案');
    expect(useHeroRecommendStore.getState().heroDraft.goalIds).toEqual(['gmv']);
    expect(useHeroRecommendStore.getState().heroDraft.sceneIds).toEqual(['ecom_mkt']);
    expect(useHeroRecommendStore.getState().grouped?.ready[0]?.highlightTag).toBe('匹配度最高');
    vi.useRealTimers();
  });
});
