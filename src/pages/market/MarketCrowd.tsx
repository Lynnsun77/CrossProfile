import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Crowd } from '../../types';
import { RadarDual } from '../../components/common/RadarDual';
import { Waterfall } from '../../components/common/Waterfall';
import { formatNumber } from '../../lib/format';
import { fetcher } from '../../lib/fetcher';

export function MarketCrowd() {
  const { id } = useParams<{ id: string }>();
  const [crowd, setCrowd] = useState<Crowd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const crowds = await fetcher<Crowd[]>('/mock/crowds.json');
        const found = crowds.find(c => c.id === id || c.asset_id === id) || crowds[0];
        setCrowd(found);
      } catch (e) {
        console.error('Failed to load crowd:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8 text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  if (!crowd) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-8 text-gray-500">未找到人群数据</div>
        </div>
      </div>
    );
  }

  const waterfallData = crowd.contrib.map(c => ({
    name: c.tag_name,
    value: c.weight * 100
  }));

  const indicatorNames = ['消费力', '活跃度', '品类偏好', '营销敏感', '生命周期'];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-market">人群诊断</h1>
            <Link
              to={`/marketplace/action/${crowd.id}`}
              className="px-6 py-2 bg-market text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              配置运营
            </Link>
          </div>
          <p className="text-gray-600">分析人群画像和特征</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">基本信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">人群规模</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(crowd.size)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">跨域重合度</p>
                <p className="text-2xl font-bold text-gray-900">{(crowd.overlap * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">历史 ROI</p>
                <p className="text-2xl font-bold text-gray-900">{crowd.history_roi}x</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">基础分布</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">性别</p>
                {Object.entries(crowd.demo.gender).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span className="font-medium text-gray-900">{(value * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-gray-500 mb-1">年龄</p>
                {Object.entries(crowd.demo.age).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span className="font-medium text-gray-900">{(value * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">维度雷达图</h2>
            <RadarDual
              ecommerceData={Object.values(crowd.radar_ecommerce)}
              lifestyleData={Object.values(crowd.radar_lifestyle)}
              indicators={indicatorNames}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">标签贡献瀑布图</h2>
            <Waterfall data={waterfallData} />
          </div>
        </div>
      </div>
    </div>
  );
}
