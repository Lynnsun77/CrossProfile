import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';

export function ModulePlaceholder() {
  const { module } = useParams<{ module: string }>();

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={`模块占位: ${module ?? 'unknown'}`}
          subtitle="该路由用于承接未实现模块的跳转，占位页后续可替换为真实页面。"
          moduleTone="market"
        />

        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="text-sm text-text-2">
            当前访问: <span className="font-semibold text-text-1">/placeholder/{module ?? 'unknown'}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
            你可以从这里回到主线页面继续演示:
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/marketplace"
              className="rounded-lg bg-module-market px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              去市集
            </Link>
            <Link
              to="/factory"
              className="rounded-lg bg-module-workshop px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              去工坊
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg bg-module-dashboard px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              去大盘
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
