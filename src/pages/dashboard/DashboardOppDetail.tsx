import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { RadarDual } from '../../components/common/RadarDual';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { formatLargeNumber } from '../../lib/format';
import { buildAssetId } from '../../lib/runtimeTokens';
import { getOpportunityById } from '../../mock';
import { useGlobalState } from '../../store/globalState';
import type { AppView } from '../../types';

function labelOfView(view: AppView) {
  if (view === 'consumer') return '消费视角';
  if (view === 'producer') return '供给视角';
  return '运营视角';
}

export function DashboardOppDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = useGlobalState((s) => s.currentView);
  const opp = getOpportunityById(id || 'opp_001');

  useBreadcrumb([
    { label: '大盘', to: '/dashboard' },
    { label: '机会详情' },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title={currentView === 'consumer' ? opp.title : `${labelOfView(currentView)}机会详情骨架`}
        subtitle={
          currentView === 'consumer'
            ? opp.description
            : '当前详情路由已支持多视角直达与刷新保持，非消费视角先展示占位骨架。'
        }
        moduleTone="dashboard"
        action={
          <button
            type="button"
            onClick={() => navigate(`/marketplace?asset=${opp.suggestedAssets?.[0] ?? buildAssetId(1)}`)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--dashboard-primary)' }}
          >
            一键回跳集市
          </button>
        }
      />

      <div className="mb-6 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-text-2 shadow-sm">
        当前为
        <span className="mx-1 font-semibold text-text-1">{labelOfView(currentView)}</span>
        ，页面内不再提供重复的视角切换入口。
      </div>

      {currentView !== 'consumer' && (
        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <div className="text-sm text-text-2">
            当前路径: <span className="font-semibold text-text-1">{location.pathname}</span>
          </div>
          <div className="mt-2 text-sm text-text-2">
            当前 query: <span className="font-mono text-xs text-text-3">{location.search || '(empty)'}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-text-3">
            机会详情在 {labelOfView(currentView)} 下先作为路由骨架保留，后续可以在同一路径下接入供给方或运营方差异化内容。
          </div>
        </div>
      )}

      {currentView === 'consumer' && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="text-sm text-text-3">机会缺口</div>
          <div className="mt-1 text-2xl font-semibold text-text-1">{opp.gap}%</div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="text-sm text-text-3">目标人群</div>
          <div className="mt-1 text-2xl font-semibold text-text-1">{formatLargeNumber(opp.crowd_size)}</div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="text-sm text-text-3">预估提升</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">+{((opp.estimatedLift ?? 0) * 100).toFixed(1)}%</div>
        </div>
      </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-card border border-border bg-surface p-6">
              <div className="mb-4 text-lg font-semibold text-text-1">机会画像</div>
              <RadarDual
                ecommerceData={[82, 68, 72, 76, 85]}
                lifestyleData={[70, 84, 88, 74, 72]}
                indicators={['消费力', '活跃度', '品类偏好', '营销敏感', '生命周期']}
              />
            </div>

            <div className="space-y-6">
              <div className="rounded-card border border-border bg-surface p-6">
                <div className="mb-3 text-lg font-semibold text-text-1">根因分析</div>
                <div className="space-y-2">
                  {(opp.rootCause ?? []).map((item: string) => (
                    <div key={item} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-1">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-border bg-surface p-6">
                <div className="mb-3 text-lg font-semibold text-text-1">建议资产</div>
                <div className="flex flex-wrap gap-2">
                  {(opp.suggestedAssets ?? []).map((assetId: string) => (
                    <button
                      key={assetId}
                      type="button"
                      onClick={() => navigate(`/marketplace?asset=${assetId}`)}
                      className="rounded-full border border-border bg-bg px-3 py-1.5 text-sm text-text-2 transition-colors hover:border-brand-500 hover:text-brand-500"
                    >
                      {assetId}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
