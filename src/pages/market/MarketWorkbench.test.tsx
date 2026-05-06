import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MarketWorkbench } from './MarketWorkbench';

function renderWorkbench(initialEntry = '/marketplace/workbench') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/marketplace/workbench" element={<MarketWorkbench />} />
        <Route path="/marketplace/action/:id" element={<MarketWorkbench />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MarketWorkbench', () => {
  it('展示 Task3 顶部能力并允许切换到供给视角', () => {
    renderWorkbench();

    expect(screen.getByText('F4 全页筛选器')).toBeInTheDocument();
    expect(screen.getByText('F2 三域拓扑图')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /F1 覆盖人群/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '供给' }));

    expect(screen.getAllByText('政策平台通道').length).toBeGreaterThan(0);
  });

  it('点击 KPI 风险卡后联动到风险优先节点', () => {
    renderWorkbench();

    fireEvent.click(screen.getByRole('button', { name: /F1 治理风险/ }));

    const insightCard = screen.getByText('右侧联动洞察').closest('section');
    expect(insightCard).not.toBeNull();
    expect(within(insightCard as HTMLElement).getAllByText('首页承接策略').length).toBeGreaterThan(0);
  });

  it('点击拓扑节点后同步更新右侧洞察和配置区', () => {
    renderWorkbench();

    fireEvent.click(screen.getByRole('button', { name: /流失召回人群/ }));

    const insightCard = screen.getByText('右侧联动洞察').closest('section');
    expect(insightCard).not.toBeNull();
    expect(within(insightCard as HTMLElement).getAllByText('流失召回人群').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('crowd_recall_14d')).toBeInTheDocument();
  });

  it('全页筛选与节点选择共同过滤任务列表', () => {
    renderWorkbench();

    fireEvent.change(screen.getByLabelText('任务状态筛选'), { target: { value: 'done' } });
    fireEvent.click(screen.getByRole('button', { name: /流失召回人群/ }));

    expect(screen.getByText('流失召回人群 x 首页回流提醒')).toBeInTheDocument();
    expect(screen.queryByText('高潜复购人群 x 跨域满减券')).not.toBeInTheDocument();
  });
});
