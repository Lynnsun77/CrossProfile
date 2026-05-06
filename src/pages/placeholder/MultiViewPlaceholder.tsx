import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { useGlobalState } from '../../store/globalState';
import { getExposedSwitcherViews, getSupportedViewsForPath, updateSearchParam } from '../../lib/view';
import type { AppView } from '../../types';

function inferTitle(pathname: string) {
  if (pathname.startsWith('/catalog')) return '资产目录骨架';
  if (pathname.startsWith('/recommender')) return '推荐缺口分析骨架';
  if (pathname.startsWith('/factory')) return '供给方工坊骨架';
  if (pathname.startsWith('/quality')) return '质量治理骨架';
  if (pathname.startsWith('/drilldown')) return '单特征诊断骨架';
  return '模块骨架';
}

export function MultiViewPlaceholder() {
  const location = useLocation();
  const currentView = useGlobalState((s) => s.currentView);

  const supportedViews = getExposedSwitcherViews(getSupportedViewsForPath(location.pathname));

  const buildLinkWithView = (path: string, view: AppView) => ({
    pathname: path,
    search: updateSearchParam(location.search, 'view', view),
  });

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={inferTitle(location.pathname)}
          subtitle={`当前访问 ${location.pathname}`}
          moduleTone="market"
        />

        <div className="mb-5 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
          当前页面按
          <span className="mx-1 font-semibold text-text-1">
            {currentView === 'producer' ? '供给视角' : currentView === 'operator' ? '运营视角' : '消费视角'}
          </span>
          渲染，占位页仍保留带 `?view=` 的直达链接。
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="text-sm text-text-2">
            当前路径: <span className="font-semibold text-text-1">{location.pathname}</span>
          </div>
          <div className="mt-2 text-sm text-text-2">
            当前 query: <span className="font-mono text-xs text-text-3">{location.search || '(empty)'}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
            该页面是 Part 1 路由骨架，占位承接后续 Part 2-5 的真实实现。
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {supportedViews.map((view) => (
              <Link
                key={view}
                to={buildLinkWithView(location.pathname, view)}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-2 transition hover:border-module-market/20 hover:text-module-market"
              >
                以{view === 'consumer' ? '消费' : view === 'producer' ? '供给' : '运营'}视角打开
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
