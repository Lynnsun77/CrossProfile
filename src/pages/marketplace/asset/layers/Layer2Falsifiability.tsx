import { BaselineCompare } from '../components/BaselineCompare';
import { BoundaryCases } from '../components/BoundaryCases';
import { DefinitionChangelog } from '../components/DefinitionChangelog';
import { KnownIssues } from '../components/KnownIssues';
import { LineageDiagram } from '../components/LineageDiagram';
import { StabilityCurve } from '../components/StabilityCurve';
import type {
  AssetDetailBaselineCompareRow,
  AssetDetailBoundaryCase,
  AssetDetailChangelogItem,
  AssetDetailKnownIssue,
  AssetDetailLineageEdge,
  AssetDetailLineageNode,
  AssetDetailStabilityPoint,
} from '../types';

interface Layer2FalsifiabilityProps {
  knownIssues?: AssetDetailKnownIssue[];
  stabilityCurve?: AssetDetailStabilityPoint[];
  boundaryCases?: AssetDetailBoundaryCase[];
  definitionChangelog?: AssetDetailChangelogItem[];
  lineageDiagram?: { nodes: AssetDetailLineageNode[]; edges: AssetDetailLineageEdge[] };
  baselineCompare?: AssetDetailBaselineCompareRow[];
  loading?: boolean;
  error?: string | null;
  onOpenDrilldown: (drilldownId: string, title?: string) => void;
}

export function Layer2Falsifiability({
  knownIssues,
  stabilityCurve,
  boundaryCases,
  definitionChangelog,
  lineageDiagram,
  baselineCompare,
  loading,
  error,
  onOpenDrilldown,
}: Layer2FalsifiabilityProps) {
  return (
    <section id="asset-layer-2" className="space-y-4">
      <KnownIssues items={knownIssues} loading={loading} error={error} onOpenDrilldown={onOpenDrilldown} />
      <StabilityCurve points={stabilityCurve} loading={loading} error={error} />
      <BoundaryCases items={boundaryCases} loading={loading} error={error} />
      <DefinitionChangelog items={definitionChangelog} loading={loading} error={error} />
      <LineageDiagram nodes={lineageDiagram?.nodes} edges={lineageDiagram?.edges} loading={loading} error={error} />
      <BaselineCompare rows={baselineCompare} loading={loading} error={error} />
    </section>
  );
}
