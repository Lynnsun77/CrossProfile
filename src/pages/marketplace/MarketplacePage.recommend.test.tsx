import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MarketplacePage } from './MarketplacePage';
import { useRecommendStore } from '../../features/recommend/store/useRecommendStore';
import { useGlobalState } from '../../store/globalState';

function renderPage(initialEntry = '/marketplace?view=consumer') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MarketplacePage recommend query', () => {
  beforeEach(() => {
    useRecommendStore.getState().reset();
    act(() => {
      useGlobalState.setState({
        currentView: 'consumer',
        consumerSubRole: 'business',
      });
    });
  });

  afterEach(() => {
    useRecommendStore.getState().reset();
  });

  it('普通文本点击查询后提交 manual intent', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('需求输入'), {
      target: { value: '帮我找提升 GMV 的会员资产' },
    });
    fireEvent.click(screen.getByRole('button', { name: '查询' }));

    await waitFor(() => {
      expect(useRecommendStore.getState().intent.source).toBe('manual');
      expect(useRecommendStore.getState().thinkingTask).not.toBeNull();
    });
  });

  it('飞书链接点击查询后提交 feishu_doc intent', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('需求输入'), {
      target: { value: 'https://bytedance.larkoffice.com/wiki/abc123' },
    });
    fireEvent.click(screen.getByRole('button', { name: '查询' }));

    await waitFor(() => {
      expect(useRecommendStore.getState().intent.source).toBe('feishu_doc');
      expect(useRecommendStore.getState().thinkingTask).not.toBeNull();
    });
  });
});
