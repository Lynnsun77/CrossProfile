import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ActionConfig } from '../../types';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import { mockDispatch } from '../../lib/fetcher';

export function MarketAction() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useBreadcrumb([
    { label: '智能推荐', to: '/marketplace' },
    { label: '运营配置' },
  ]);

  const [config, setConfig] = useState<ActionConfig>({
    crowd_id: id || '',
    touchpoints: ['push'],
    subsidy_level: 'mid',
    budget: 500000,
    copywriting_choice: 'default',
    channels: ['ldmp']
  });

  const handleDispatch = async () => {
    setLoading(true);
    try {
      await mockDispatch();
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/marketplace/tasks');
      }, 2000);
    } catch (e) {
      console.error('Dispatch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-market mb-2">运营配置</h1>
        <p className="text-gray-600">配置运营动作和渠道</p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
          任务已成功派发！正在跳转到任务列表...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">配置表单</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                触达渠道
              </label>
              <div className="flex flex-wrap gap-2">
                {(['push', 'lifestyle_home', 'ecommerce_coupon'] as const).map((tp) => (
                  <button
                    key={tp}
                    onClick={() => setConfig({
                      ...config,
                      touchpoints: config.touchpoints.includes(tp)
                        ? config.touchpoints.filter((t) => t !== tp)
                        : [...config.touchpoints, tp]
                    })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.touchpoints.includes(tp)
                        ? 'bg-market text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tp === 'push' ? '推送' : tp === 'lifestyle_home' ? '生服首页' : '电商优惠券'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                补贴水平
              </label>
              <div className="flex gap-2">
                {(['low', 'mid', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfig({ ...config, subsidy_level: level })}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.subsidy_level === level
                        ? 'bg-market text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level === 'low' ? '低' : level === 'mid' ? '中' : '高'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预算（元）
              </label>
              <input
                type="number"
                value={config.budget}
                onChange={(e) => setConfig({ ...config, budget: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-market"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                渠道选择
              </label>
              <div className="flex flex-wrap gap-2">
                {(['ldmp', 'ecommerce_dmp', 'policy_platform', 'money_eff', 'api'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setConfig({
                      ...config,
                      channels: config.channels.includes(ch)
                        ? config.channels.filter((c) => c !== ch)
                        : [...config.channels, ch]
                    })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.channels.includes(ch)
                        ? 'bg-market text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ch === 'ldmp' ? '本地DMP' : ch === 'ecommerce_dmp' ? '电商DMP' : ch === 'policy_platform' ? '政策平台' : ch === 'money_eff' ? '资金效率' : 'API'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">预估效果</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">预估曝光</p>
              <p className="text-2xl font-bold text-gray-900">5.2M</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">预估 CTR</p>
              <p className="text-2xl font-bold text-gray-900">3.2%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">预估 CVR</p>
              <p className="text-2xl font-bold text-gray-900">1.8%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">预估 GMV 提升</p>
              <p className="text-2xl font-bold text-green-600">+2.1%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <Link
          to="/marketplace"
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </Link>
        <button
          onClick={handleDispatch}
          disabled={loading}
          className="px-6 py-2 bg-market text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? '派发中...' : '立即派发'}
        </button>
      </div>
    </div>
  );
}
