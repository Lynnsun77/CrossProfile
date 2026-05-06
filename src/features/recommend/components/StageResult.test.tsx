import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecommendStore } from '../hooks/useRecommendStore';
import { StageResult } from './StageResult';

vi.mock('../../../components/common/AIWorkbench', () => ({
  AIWorkbench: () => <div data-testid="ai-workbench-stub">AI Workbench Stub</div>,
}));

vi.mock('../../../components/common/AssetCard', () => ({
  AssetCard: ({ asset }: { asset: { name: string } }) => <div data-testid="asset-card-stub">{asset.name}</div>,
}));

describe('StageResult', () => {
  beforeEach(() => {
    useRecommendStore.getState().reset();
  });

  it('结果态展示与 Agent 对齐的时间线和推荐卡容器，并复用已有推荐资产', () => {
    useRecommendStore.setState({
      step: 'result',
      subRole: 'business',
      view: 'A',
      input: {
        text: '帮我为火锅商家找提升转化的资产组合',
        goalId: 'conversion',
        sceneId: 'cross',
      },
      requirement: {
        industry: '川渝火锅',
        merchantId: 'M-88231',
        merchantName: '示例火锅店',
        merchant: { id: 'M-88231', name: '示例火锅店' },
        problemCrowds: [{ key: 'p_a3', label: 'A3 人群：转化率低', priority: 1 }],
        problems: [{ id: 'p_a3', segment: 'A3 人群', description: '转化率低', priority: 'high' }],
        scopes: [
          { key: 'self', label: '当前商家跃迁人群', checked: true },
          { key: 'bench', label: '标杆商家', checked: true },
          { key: 'cross', label: '跨行业相似', checked: false },
        ],
        miningScope: { selfHistory: true, benchmark: true, crossIndustry: false },
        actions: [
          { key: 'product', label: '商品优化', checked: true },
          { key: 'campaign', label: '营销活动', checked: true },
          { key: 'content', label: '内容优化', checked: false },
          { key: 'acquire', label: '人群拉新', checked: false },
        ],
        actionTypes: { product: true, marketing: true, content: false, acquisition: false },
        features: [
          { key: 'power', label: '消费力', checked: true },
          { key: 'scene', label: '消费场景', checked: true },
          { key: 'interest', label: '兴趣关键词', checked: true },
          { key: 'freq', label: '频次', checked: false },
        ],
        featureDims: { consumeLevel: true, scene: true, keyword: true, frequency: false },
        confidence: 0.82,
      },
      thinkingTrace: [
        {
          id: 'r1',
          label: '匹配动作矩阵',
          description: '按问题人群 x 动作类型匹配候选资产。',
          status: 'done',
          timestampMs: 1200,
        },
      ],
      actions: [],
      featureBundle: {
        crowdSegments: [],
        features: [],
        executableAssets: [
          { id: 'asset_004', name: '电商复购人群模板', type: 'crowd_template' },
          { id: 'model_001', name: '聚餐意图模型', type: 'model' },
        ],
      },
      gaps: [],
    });

    render(
      <MemoryRouter>
        <StageResult />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Agent 思考链路区块')).toBeInTheDocument();
    expect(screen.getByLabelText('AI 推荐卡片区域')).toBeInTheDocument();
    expect(screen.getByText('电商复购人群模板')).toBeInTheDocument();
    expect(screen.getByText('聚餐意图模型')).toBeInTheDocument();
    expect(screen.getByText('沿用现有推荐结果，只调整容器形态与展示密度。')).toBeInTheDocument();
  });

  it('非结果态保留推荐骨架容器，避免布局突变', () => {
    useRecommendStore.setState({
      step: 'recommending',
      subRole: 'business',
      view: 'A',
      input: {
        text: '帮我找能提升 GMV 的跨域会员运营资产',
        goalId: 'growth',
        sceneId: 'cross',
      },
      requirement: null,
      thinkingTrace: [],
      actions: [],
      featureBundle: null,
      gaps: [],
    });

    const { container } = render(
      <MemoryRouter>
        <StageResult />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('AI 推荐卡片区域')).toBeInTheDocument();
    expect(screen.getByText('推荐结果生成中，请稍候。')).toBeInTheDocument();
    expect(screen.getAllByTestId('recommend-card-skeleton')).toHaveLength(3);
    expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0);
  });
});
