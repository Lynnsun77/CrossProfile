import { Link, useNavigate } from 'react-router-dom';
import { useGlobalState } from '../../store/globalState';

export function Breadcrumb() {
  const navigate = useNavigate();
  const breadcrumb = useGlobalState((s) => s.breadcrumb);
  const items = breadcrumb.slice(-3);

  if (!items.length) return null;

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <nav className="flex items-center gap-2">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={`${crumb.label}-${crumb.to ?? index}`} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              {isLast || !crumb.to ? (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              ) : (
                <Link to={crumb.to} className="text-gray-600 hover:text-gray-900 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
