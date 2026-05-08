import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useHeroRecommendStore } from '../store/useHeroRecommendStore';
import { RecommendationHero } from './RecommendationHero';

function resetHeroStore() {
  useHeroRecommendStore.setState({
    ...useHeroRecommendStore.getInitialState(),
    heroDraft: { goalIds: [], sceneIds: [], text: '' },
    textLocked: false,
    analysisPhase: 'idle',
    analysisStep: 0,
    intentParsed: null,
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

describe('RecommendationHero', () => {
  beforeEach(() => {
    resetHeroStore();
  });

  afterEach(() => {
    useHeroRecommendStore.getState()._clearTimers();
  });

  it('业务目标只允许单选，并支持再次点击取消', () => {
    render(<RecommendationHero />);

    const goalGroup = screen.getByRole('radiogroup', { name: '业务目标' });
    const orders = within(goalGroup).getByRole('radio', { name: '订单量' });
    const gmv = within(goalGroup).getByRole('radio', { name: 'GMV' });

    fireEvent.click(orders);
    expect(orders).toHaveAttribute('aria-checked', 'true');
    expect(gmv).toHaveAttribute('aria-checked', 'false');
    expect(useHeroRecommendStore.getState().heroDraft.goalIds).toEqual(['orders']);

    fireEvent.click(gmv);
    expect(orders).toHaveAttribute('aria-checked', 'false');
    expect(gmv).toHaveAttribute('aria-checked', 'true');
    expect(useHeroRecommendStore.getState().heroDraft.goalIds).toEqual(['gmv']);

    fireEvent.click(gmv);
    expect(gmv).toHaveAttribute('aria-checked', 'false');
    expect(useHeroRecommendStore.getState().heroDraft.goalIds).toEqual([]);
  });

  it('业务场景只允许单选，并支持切换到新的场景', () => {
    render(<RecommendationHero />);

    const sceneGroup = screen.getByRole('radiogroup', { name: '业务场景' });
    const localGrowth = within(sceneGroup).getByRole('radio', { name: '生服用增' });
    const ecomMkt = within(sceneGroup).getByRole('radio', { name: '电商营销' });

    fireEvent.click(localGrowth);
    expect(localGrowth).toHaveAttribute('aria-checked', 'true');
    expect(ecomMkt).toHaveAttribute('aria-checked', 'false');
    expect(useHeroRecommendStore.getState().heroDraft.sceneIds).toEqual(['local_growth']);

    fireEvent.click(ecomMkt);
    expect(localGrowth).toHaveAttribute('aria-checked', 'false');
    expect(ecomMkt).toHaveAttribute('aria-checked', 'true');
    expect(useHeroRecommendStore.getState().heroDraft.sceneIds).toEqual(['ecom_mkt']);
  });
});
