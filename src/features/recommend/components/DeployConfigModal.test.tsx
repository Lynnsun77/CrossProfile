import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRecommendStore } from '../store/useRecommendStore';
import { DeployConfigModal } from './DeployConfigModal';

describe('DeployConfigModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    act(() => {
      useRecommendStore.getState().reset();
    });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
    act(() => {
      useRecommendStore.getState().reset();
    });
  });

  it('默认读取 recommend store 并在确认后展示成功提示', () => {
    act(() => {
      useRecommendStore.getState().openDeploy('card_1');
    });

    render(<DeployConfigModal />);

    act(() => {
      expect(screen.getByRole('option', { name: '北冰洋' })).toBeInTheDocument();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '生服 DMP（LDMP）' } });
      fireEvent.change(screen.getByPlaceholderText('https://...'), {
        target: { value: 'https://example.com/deploy' },
      });
      fireEvent.click(screen.getByRole('button', { name: '确认' }));
    });

    expect(screen.getByText('投放已提交')).toBeInTheDocument();
    expect(useRecommendStore.getState().deploy.open).toBe(false);
    expect(useRecommendStore.getState().deploy.status).toBe('draft');

    act(() => {
      vi.runOnlyPendingTimers();
    });
  });

  it('支持通过 bindings 复用，且不会依赖 closeDrawer', () => {
    const closeDeploy = vi.fn();
    const setDeployField = vi.fn();
    const submitDeploy = vi.fn();

    render(
      <DeployConfigModal
        bindings={{
          deploy: {
            open: true,
            cardId: 'hero_card_1',
            downstream: null,
            libraUrl: '',
            status: 'draft',
            error: null,
          },
          closeDeploy,
          setDeployField,
          submitDeploy,
        }}
        title="Hero 一键配置"
        ariaLabel="Hero 一键配置"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Hero 一键配置' })).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '确认' }));
    });
    expect(submitDeploy).not.toHaveBeenCalled();
    expect(screen.getByText('请输入有效的 URL')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '取消' }));
    });
    expect(closeDeploy).toHaveBeenCalled();
  });
});
