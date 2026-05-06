import { describe, expect, it } from 'vitest';
import { getActiveNavItemId, getVisibleNavGroups, hasSideNav } from './navigation';
import { isNavCollapsible, isNavLeaf, isNavSectionTitle } from '../components/nav/nav.types';

function flattenLeafItems(
  view: Parameters<typeof getVisibleNavGroups>[0],
  options?: Parameters<typeof getVisibleNavGroups>[1],
) {
  return getVisibleNavGroups(view, options).flatMap((group) =>
    group.items.flatMap((item) => {
      if (isNavLeaf(item)) return [item];
      if (isNavCollapsible(item)) return item.children;
      return [];
    }),
  );
}

describe('navigation helpers', () => {
  it('returns grouped side nav by view', () => {
    expect(getVisibleNavGroups('consumer')).toHaveLength(4);
    expect(getVisibleNavGroups('producer')).toHaveLength(6);
    expect(getVisibleNavGroups('operator')).toHaveLength(0);
  });

  it('keeps hidden routes out of nav but resolves active parent ids', () => {
    const producerGroups = getVisibleNavGroups('producer');
    const producerItems = flattenLeafItems('producer');
    const consumerItems = flattenLeafItems('consumer', { consumerSubRole: 'business' });
    const producerAssetDirectory = producerItems.find((item) => item.label === '资产目录');
    const governanceGroup = producerGroups.find((group) => group.label === '质量治理');
    const producerTicketParent = governanceGroup?.items.find((item) => isNavCollapsible(item) && item.label === '工单与归因');
    const consumerMarketplaceHome = consumerItems.find((item) => item.label === '市集首页');

    expect(producerItems.map((item) => item.label)).not.toContain('编辑特征');
    expect(producerItems.map((item) => item.label)).not.toContain('工单详情');

    expect(getActiveNavItemId('/catalog/features/feature_001/edit', 'producer')).toBe(producerAssetDirectory?.id);
    expect(getActiveNavItemId('/quality/tickets/ticket_001', 'producer')).toBe(producerTicketParent?.id);
    expect(getActiveNavItemId('/marketplace/asset/aid_001', 'consumer', { consumerSubRole: 'business' })).toBe(
      consumerMarketplaceHome?.id,
    );
  });

  it('keeps operator routes compatible without exposing side nav', () => {
    expect(hasSideNav('/dashboard', 'operator')).toBe(false);
    expect(getActiveNavItemId('/dashboard', 'operator')).toBeNull();
  });

  it('keeps hidden producer health dashboard routable while removing the page from side nav', () => {
    const producerItems = flattenLeafItems('producer');
    const dashboardItem = producerItems.find((item) => item.label === '大盘健康');
    const governanceItem = producerItems.find((item) => item.label === '治理总览');

    expect(dashboardItem).toBeUndefined();
    expect(governanceItem?.to).toBe('/quality/governance');
    expect(hasSideNav('/dashboard/health', 'producer')).toBe(false);
  });

  it('filters consumer nav by subRole while keeping section titles and collapsible items', () => {
    const businessGroups = getVisibleNavGroups('consumer', { consumerSubRole: 'business' });
    const algorithmGroups = getVisibleNavGroups('consumer', { consumerSubRole: 'algorithm' });

    const businessGroup = businessGroups.find((group) => group.label === '市集中心');
    const algorithmGroup = algorithmGroups.find((group) => group.label === '算法工坊');
    const businessLabels = flattenLeafItems('consumer', { consumerSubRole: 'business' }).map((item) => item.label);

    expect(businessGroup?.items.some((item) => isNavSectionTitle(item) && item.label === '推荐工作台')).toBe(true);
    expect(businessLabels).toContain('下游消费方打通页');
    expect(businessLabels).not.toContain('新建动作');
    expect(businessLabels).not.toContain('任务监控');
    expect(algorithmGroup?.items.some((item) => isNavSectionTitle(item) && item.label === '基础能力')).toBe(true);
    expect(businessLabels).not.toContain('Pack 组装');
    expect(flattenLeafItems('consumer', { consumerSubRole: 'algorithm' }).map((item) => item.label)).not.toContain('市集首页');
  });

  it('supports recentDynamic entries and hiddenInNav items in the same config contract', () => {
    const businessGroups = getVisibleNavGroups('consumer', { consumerSubRole: 'business' });
    const marketGroup = businessGroups.find((group) => group.label === '市集中心');
    const recentItem = marketGroup?.items.find((item) => isNavLeaf(item) && item.label === '最近访问');
    const businessLabels = flattenLeafItems('consumer', { consumerSubRole: 'business' }).map((item) => item.label);

    expect(recentItem && isNavLeaf(recentItem) ? recentItem.recentDynamic?.bucket : null).toBe('consumer-market-recent');
    expect(businessLabels).not.toContain('资产详情');
    expect(businessLabels).not.toContain('Agent 推荐结果');
    expect(hasSideNav('/marketplace/crowd/a_001', 'consumer', { consumerSubRole: 'business' })).toBe(true);
    expect(hasSideNav('/marketplace/agent', 'consumer', { consumerSubRole: 'business' })).toBe(true);
  });

  it('maps legacy marketplace action and task urls to the unified workbench nav item', () => {
    const businessItems = flattenLeafItems('consumer', { consumerSubRole: 'business' });
    const workbenchItem = businessItems.find((item) => item.label === '下游消费方打通页');

    expect(getActiveNavItemId('/marketplace/workbench', 'consumer', { consumerSubRole: 'business' })).toBe(workbenchItem?.id);
    expect(getActiveNavItemId('/marketplace/action/new', 'consumer', { consumerSubRole: 'business' })).toBe(
      workbenchItem?.id,
    );
    expect(getActiveNavItemId('/marketplace/tasks', 'consumer', { consumerSubRole: 'business' })).toBe(workbenchItem?.id);
    expect(getActiveNavItemId('/marketplace/action/action_001', 'consumer', { consumerSubRole: 'business' })).toBe(
      workbenchItem?.id,
    );
  });
});
