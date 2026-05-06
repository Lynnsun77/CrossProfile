import { AbEntry } from '../components/AbEntry';
import { CompareTable } from '../components/CompareTable';
import { PreflightCheck } from '../components/PreflightCheck';
import { RoiEstimator } from '../components/RoiEstimator';
import { ShortlistButton } from '../components/ShortlistButton';
import { SubscribeCTA } from '../components/SubscribeCTA';
import { SubscribeImpact } from '../components/SubscribeImpact';
import { TryPanel } from '../components/TryPanel';
import type {
  AssetDetailCompareRow,
  AssetDetailPreflightCheckItem,
  AssetDetailRoiEstimatorScenario,
  AssetDetailSubscribeCta,
  AssetDetailSubscribeImpact,
  AssetDetailTryRunPreset,
  AssetDetailTryRunResult,
} from '../types';

interface Layer3DecisionProps {
  assetId?: string;
  subscribeImpact?: AssetDetailSubscribeImpact;
  tryRun?: {
    presets: AssetDetailTryRunPreset[];
    result: AssetDetailTryRunResult;
  };
  compareTable?: AssetDetailCompareRow[];
  roiEstimator?: AssetDetailRoiEstimatorScenario[];
  preflightCheck?: AssetDetailPreflightCheckItem[];
  subscribeCta?: AssetDetailSubscribeCta;
  compareWith?: string | null;
  loading?: boolean;
  error?: string | null;
  onPrimaryAction?: () => void;
  onCreateAb?: () => void;
}

export function Layer3Decision({
  assetId,
  subscribeImpact,
  tryRun,
  compareTable,
  roiEstimator,
  preflightCheck,
  subscribeCta,
  compareWith,
  loading,
  error,
  onPrimaryAction,
  onCreateAb,
}: Layer3DecisionProps) {
  return (
    <section id="asset-layer-3" className="space-y-4">
      <SubscribeImpact data={subscribeImpact} loading={loading} error={error} />
      <TryPanel presets={tryRun?.presets} initialResult={tryRun?.result} loading={loading} error={error} />
      <RoiEstimator items={roiEstimator} loading={loading} error={error} />
      <PreflightCheck items={preflightCheck} loading={loading} error={error} />
      <CompareTable rows={compareTable} compareWith={compareWith} loading={loading} error={error} />
      <div className="flex flex-wrap gap-2">
        <ShortlistButton assetId={assetId} />
        <AbEntry onCreate={onCreateAb || (() => undefined)} />
      </div>
      <SubscribeCTA data={subscribeCta} assetId={assetId} loading={loading} error={error} onPrimaryAction={onPrimaryAction} />
    </section>
  );
}
