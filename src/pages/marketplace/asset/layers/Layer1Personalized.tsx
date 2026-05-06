import { useEffect, useState } from 'react';
import { CoverageGapAlert } from '../components/CoverageGapAlert';
import { CoverageWaterfall } from '../components/CoverageWaterfall';
import { GranularityHint } from '../components/GranularityHint';
import { PeerUsage } from '../components/PeerUsage';
import { PersonalSamples } from '../components/PersonalSamples';
import { QualityBadges } from '../components/QualityBadges';
import { QualityVerdict } from '../components/QualityVerdict';
import { SliceDistribution } from '../components/SliceDistribution';
import { ScopeSelector } from '../components/ScopeSelector';
import { UsageSelector } from '../components/UsageSelector';
import type {
  AssetDetailCoverageGapAlert,
  AssetDetailCoverageStage,
  AssetDetailGranularityHint,
  AssetDetailPeerUsage,
  AssetDetailPersonalSample,
  AssetDetailQualityBadge,
  AssetDetailScopeSelector,
  AssetDetailSliceDistribution,
  AssetDetailUseCaseOption,
  AssetDetailUseCaseVerdict,
} from '../types';

interface Layer1PersonalizedProps {
  scopeSelector?: AssetDetailScopeSelector;
  coverageGapAlert?: AssetDetailCoverageGapAlert;
  granularityHint?: AssetDetailGranularityHint;
  coverageWaterfall?: AssetDetailCoverageStage[];
  usageSelector?: {
    selectedKey: string;
    options: AssetDetailUseCaseOption[];
  };
  qualityVerdict?: AssetDetailUseCaseVerdict[];
  qualityBadges?: AssetDetailQualityBadge[];
  personalSamples?: AssetDetailPersonalSample[];
  peerUsage?: AssetDetailPeerUsage[];
  sliceDistribution?: AssetDetailSliceDistribution[];
  loading?: boolean;
  error?: string | null;
  onOpenDrilldown: (drilldownId: string, title?: string) => void;
  onApplyScope?: (scope: string) => void;
}

export function Layer1Personalized({
  scopeSelector,
  coverageGapAlert,
  granularityHint,
  coverageWaterfall,
  usageSelector,
  qualityVerdict,
  qualityBadges,
  personalSamples,
  peerUsage,
  sliceDistribution,
  loading,
  error,
  onOpenDrilldown,
  onApplyScope,
}: Layer1PersonalizedProps) {
  const [selectedKey, setSelectedKey] = useState(usageSelector?.selectedKey || '');

  useEffect(() => {
    setSelectedKey(usageSelector?.selectedKey || '');
  }, [usageSelector?.selectedKey]);

  return (
    <section id="asset-layer-1" className="space-y-4">
      <ScopeSelector data={scopeSelector} loading={loading} error={error} onApply={onApplyScope} />
      <CoverageGapAlert data={coverageGapAlert} loading={loading} error={error} />
      <CoverageWaterfall items={coverageWaterfall} loading={loading} error={error} onOpenDrilldown={onOpenDrilldown} />
      <UsageSelector options={usageSelector?.options} selectedKey={selectedKey} onSelect={setSelectedKey} loading={loading} error={error} />
      <QualityVerdict items={qualityVerdict} selectedKey={selectedKey} loading={loading} error={error} />
      <QualityBadges items={qualityBadges} loading={loading} error={error} />
      <GranularityHint data={granularityHint} loading={loading} error={error} />
      <PersonalSamples items={personalSamples} loading={loading} error={error} />
      <PeerUsage items={peerUsage} loading={loading} error={error} />
      <SliceDistribution items={sliceDistribution} loading={loading} error={error} />
    </section>
  );
}
