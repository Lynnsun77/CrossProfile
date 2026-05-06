import type { AssetDetailLineageEdge, AssetDetailLineageNode } from '../types';
import { EmptyState } from './EmptyState';

interface LineageDiagramProps {
  nodes?: AssetDetailLineageNode[];
  edges?: AssetDetailLineageEdge[];
  loading?: boolean;
  error?: string | null;
}

const nodeColor = {
  source: 'bg-sky-50 text-sky-700 border-sky-200',
  process: 'bg-violet-50 text-violet-700 border-violet-200',
  output: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function LineageDiagram({ nodes, edges, loading, error }: LineageDiagramProps) {
  if (loading) return <div className="h-44 animate-pulse rounded-2xl bg-bg" />;
  if (error) return <EmptyState title="血缘图加载失败" description={error} />;
  if (!nodes?.length) return <EmptyState title="暂无血缘图" />;
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="text-sm font-semibold text-text-1">血缘透视</div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {nodes.map((node) => (
          <div key={node.id} className={`rounded-xl border px-4 py-3 text-sm ${nodeColor[node.type]}`}>
            {node.label}
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-text-3">链路: {edges?.map((edge) => `${edge.from}→${edge.to}`).join(' / ')}</div>
    </div>
  );
}
