interface ArchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchDrawer({ isOpen, onClose }: ArchDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 bg-white p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">三层架构总览</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="border-2 border-market rounded-lg p-6">
            <h3 className="text-lg font-bold text-market mb-4">智能推荐层</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• 资产库</li>
              <li>• 人群分析</li>
              <li>• 特征挖掘</li>
              <li>• 运营包管理</li>
            </ul>
          </div>
          <div className="border-2 border-foundry rounded-lg p-6">
            <h3 className="text-lg font-bold text-foundry mb-4">工坊层</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• 特征工程</li>
              <li>• 人群圈选</li>
              <li>• 运营包构建</li>
              <li>• 派发配置</li>
            </ul>
          </div>
          <div className="border-2 border-dashboard rounded-lg p-6">
            <h3 className="text-lg font-bold text-dashboard mb-4">大盘层</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• 全局看板</li>
              <li>• 健康度监控</li>
              <li>• 机会发现</li>
              <li>• 绩效追踪</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
