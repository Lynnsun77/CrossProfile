import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecommendStore } from '../store/useRecommendStore';
import type { DeployConfig } from '../types';

const DEFAULT_TARGET_SYSTEM_OPTIONS = [
  { value: '生服 DMP（LDMP）', label: '生服 DMP（LDMP）' },
  { value: '电商 DMP', label: '电商 DMP' },
  { value: '生服用增策略平台', label: '生服用增策略平台' },
  { value: '电商投放平台', label: '电商投放平台' },
  { value: '电商营销引擎', label: '电商营销引擎' },
  { value: '电商营销中台', label: '电商营销中台' },
  { value: '北冰洋', label: '北冰洋' },
];

type Draft = { downstream: string | null; libraUrl: string };

const URL_REGEX = /^https?:\/\/.+/i;

function isValidUrl(value: string): boolean {
  return URL_REGEX.test(value.trim());
}

export interface DeployConfigModalBindings {
  deploy: DeployConfig;
  closeDeploy: () => void;
  closeDrawer?: () => void;
  setDeployField: (key: keyof DeployConfig, value: DeployConfig[keyof DeployConfig]) => void;
  submitDeploy: () => void;
}

export interface DeployConfigModalProps {
  bindings?: DeployConfigModalBindings;
  title?: string;
  ariaLabel?: string;
  successToastText?: string;
  workbenchHrefBuilder?: (cardId: string) => string;
  systemFieldLabel?: string;
  targetSystemOptions?: Array<{ value: string; label: string }>;
  workbenchLabel?: string;
}

export function DeployConfigModal({
  bindings,
  title = '一键配置',
  ariaLabel = '一键配置',
  successToastText = '投放已提交',
  workbenchHrefBuilder,
  systemFieldLabel = '下游应用系统',
  targetSystemOptions = DEFAULT_TARGET_SYSTEM_OPTIONS,
  workbenchLabel = '去工作台编辑 →',
}: DeployConfigModalProps) {
  const deployFromStore = useRecommendStore((s) => s.deploy);
  const closeDeployFromStore = useRecommendStore((s) => s.closeDeploy);
  const closeDrawerFromStore = useRecommendStore((s) => s.closeDrawer);
  const setDeployFieldFromStore = useRecommendStore((s) => s.setDeployField);
  const submitDeployFromStore = useRecommendStore((s) => s.submitDeploy);

  const resolvedBindings = useMemo<DeployConfigModalBindings>(
    () =>
      bindings ?? {
        deploy: deployFromStore,
        closeDeploy: closeDeployFromStore,
        closeDrawer: closeDrawerFromStore,
        setDeployField: setDeployFieldFromStore,
        submitDeploy: submitDeployFromStore,
      },
    [
      bindings,
      closeDeployFromStore,
      closeDrawerFromStore,
      deployFromStore,
      setDeployFieldFromStore,
      submitDeployFromStore,
    ],
  );

  const { deploy, closeDeploy, setDeployField, submitDeploy } = resolvedBindings;

  // 按 cardId 保留草稿
  const draftsRef = useRef<Record<string, Draft>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const lastCardIdRef = useRef<string | null>(null);

  // 打开 modal 时从本地草稿恢复
  useEffect(() => {
    if (!deploy.open) return;
    if (deploy.cardId === lastCardIdRef.current) return;
    lastCardIdRef.current = deploy.cardId;
    if (deploy.cardId) {
      const draft = draftsRef.current[deploy.cardId];
      if (draft) {
        setDeployField('downstream', draft.downstream);
        setDeployField('libraUrl', draft.libraUrl);
      }
    }
    if (localError !== null) {
      setLocalError(null);
    }
  }, [deploy.open, deploy.cardId, localError, setDeployField]);

  // 关闭 modal 时写回草稿
  const persistDraft = () => {
    if (deploy.cardId) {
      draftsRef.current[deploy.cardId] = {
        downstream: deploy.downstream,
        libraUrl: deploy.libraUrl,
      };
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleCancel = () => {
    persistDraft();
    closeDeploy();
    lastCardIdRef.current = null;
  };

  const handleGoWorkbench = () => {
    if (typeof window === 'undefined') return;
    const cardId = deploy.cardId ?? '';
    const href = workbenchHrefBuilder?.(cardId) ?? `/marketplace/workbench?from=deploy&cardId=${encodeURIComponent(cardId)}`;
    window.open(
      href,
      '_blank',
    );
  };

  const handleConfirm = () => {
    if (!isValidUrl(deploy.libraUrl)) {
      setLocalError('请输入有效的 URL');
      return;
    }
    if (!deploy.downstream) {
      setLocalError('请选择下游系统');
      return;
    }
    setLocalError(null);
    submitDeploy();
    // 成功，清掉该 card 的草稿
    if (deploy.cardId) {
      delete draftsRef.current[deploy.cardId];
    }
    setToast(successToastText);
    closeDeploy();
    lastCardIdRef.current = null;
  };

  const libraUrlError = localError === '请输入有效的 URL';

  if (!deploy.open && !toast) return null;

  return (
    <>
      {deploy.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
          <div
            role="dialog"
            aria-label={ariaLabel}
            className="w-[480px] rounded-2xl bg-white p-6 shadow-xl"
          >
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              <button
                type="button"
                onClick={handleGoWorkbench}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                {workbenchLabel}
              </button>
            </header>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-700">{systemFieldLabel}</span>
                <select
                  value={deploy.downstream ?? ''}
                  onChange={(event) => {
                    const value = event.target.value || null;
                    setDeployField('downstream', value);
                    if (localError === '请选择下游系统') setLocalError(null);
                  }}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">请选择</option>
                  {targetSystemOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-700">libra 链接</span>
                <input
                  type="text"
                  value={deploy.libraUrl}
                  placeholder="https://..."
                  onChange={(event) => {
                    setDeployField('libraUrl', event.target.value);
                    if (libraUrlError) setLocalError(null);
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-sm text-gray-800 focus:outline-none ${
                    libraUrlError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-indigo-400'
                  }`}
                />
                {libraUrlError && (
                  <div className="mt-1 text-[11px] text-red-500">请输入有效的 URL</div>
                )}
              </label>

              {localError && localError !== '请输入有效的 URL' && (
                <div className="text-[11px] text-red-500">{localError}</div>
              )}
            </div>

            <footer className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                确认
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {toast && (
        <div className="fixed right-6 top-6 z-[70] rounded-md bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

export default DeployConfigModal;
