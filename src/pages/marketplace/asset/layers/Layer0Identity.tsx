import type { DerivedAsset } from '../../../../api/assets';
import { Definition } from '../components/Definition';
import { DistributionMini } from '../components/DistributionMini';
import { IdentityCard } from '../components/IdentityCard';
import { IsIsNot } from '../components/IsIsNot';
import { QuantSummary } from '../components/QuantSummary';
import { RecommendReason } from '../components/RecommendReason';
import { SamplePreview } from '../components/SamplePreview';
import { SupplierCollapse } from '../components/SupplierCollapse';
import { UseCaseTags } from '../components/UseCaseTags';
import { VerdictBanner } from '../components/VerdictBanner';
import type {
  AssetDetailDefinition,
  AssetDetailDistributionMini,
  AssetDetailGlossaryTerm,
  AssetDetailIdentity,
  AssetDetailIsIsNot,
  AssetDetailQueryState,
  AssetDetailQuantMetric,
  AssetDetailReasonItem,
  AssetDetailSamplePreview,
  AssetDetailSupplierPanel,
  AssetDetailVerdictBanner,
} from '../types';

interface Layer0IdentityProps {
  asset?: DerivedAsset;
  identity?: AssetDetailIdentity;
  query: AssetDetailQueryState;
  definition?: AssetDetailDefinition;
  isIsNot?: AssetDetailIsIsNot;
  useCaseTags?: string[];
  samplePreview?: AssetDetailSamplePreview[];
  distributionMini?: AssetDetailDistributionMini;
  quantSummary?: AssetDetailQuantMetric[];
  recommendReason?: {
    confidence: number;
    summary: string;
    items: AssetDetailReasonItem[];
  };
  verdictBanner?: AssetDetailVerdictBanner;
  supplierPanel?: AssetDetailSupplierPanel;
  showSupplierPanel?: boolean;
  glossary: Record<string, AssetDetailGlossaryTerm>;
  loading?: boolean;
  error?: string | null;
  onOpenDrilldown: (drilldownId: string, title?: string) => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

export function Layer0Identity(props: Layer0IdentityProps) {
  return (
    <section id="asset-layer-0" className="space-y-4">
      <IdentityCard asset={props.asset} identity={props.identity} query={props.query} loading={props.loading} error={props.error} />
      <Definition definition={props.definition} glossary={props.glossary} loading={props.loading} error={props.error} />
      <IsIsNot data={props.isIsNot} loading={props.loading} error={props.error} />
      <UseCaseTags tags={props.useCaseTags} loading={props.loading} error={props.error} />
      <SamplePreview items={props.samplePreview} loading={props.loading} error={props.error} />
      <DistributionMini data={props.distributionMini} loading={props.loading} error={props.error} />
      <QuantSummary
        metrics={props.quantSummary}
        glossary={props.glossary}
        onOpenDrilldown={props.onOpenDrilldown}
        loading={props.loading}
        error={props.error}
      />
      <RecommendReason data={props.recommendReason} loading={props.loading} error={props.error} />
      <VerdictBanner
        banner={props.verdictBanner}
        loading={props.loading}
        error={props.error}
        onPrimaryAction={props.onPrimaryAction}
        onSecondaryAction={props.onSecondaryAction}
      />
      <SupplierCollapse data={props.supplierPanel} visible={props.showSupplierPanel} />
    </section>
  );
}
