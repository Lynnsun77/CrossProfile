interface ErrorStateProps {
  status?: 401 | 403 | 404 | 500;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const defaultCopy = {
  401: {
    title: '未登录或登录已过期',
    description: '请重新登录后再查看诊断详情。',
  },
  403: {
    title: '当前视角无权限访问',
    description: '请切换到有权限的视角，或联系管理员开通权限。',
  },
  404: {
    title: '资产不存在',
    description: '当前资产未找到，可能已下线或链接已失效。',
  },
  500: {
    title: '系统暂时异常',
    description: '请稍后重试，或先查看其他可用资产。',
  },
};

export function ErrorState({ status = 500, title, description, onRetry }: ErrorStateProps) {
  const copy = defaultCopy[status];
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <div className="text-xs uppercase tracking-[0.12em] text-rose-500">HTTP {status}</div>
      <div className="mt-2 text-lg font-semibold text-rose-900">{title || copy.title}</div>
      <p className="mt-2 text-sm text-rose-700">{description || copy.description}</p>
      {onRetry ? (
        <div className="mt-4">
          <button type="button" onClick={onRetry} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">
            重试
          </button>
        </div>
      ) : null}
    </div>
  );
}
