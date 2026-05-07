import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRoleStore } from '../../store/roleStore';

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRoleStore();

  const getActiveMain = () => {
    if (location.pathname.startsWith('/marketplace')) return 'marketplace';
    if (location.pathname.startsWith('/factory')) return 'factory';
    if (location.pathname.startsWith('/dashboard')) return 'dashboard';
    return null;
  };

  const activeMain = getActiveMain();

  const isActive = (tab: string) => activeMain === tab;

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：Logo 和主要导航 */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-text-1">
              Cross-Profile
            </Link>
            
            <nav className="flex gap-1">
              <Link
                to="/marketplace"
                className={`px-4 py-2 text-sm font-medium transition-all duration-platform relative ${
                  isActive('marketplace')
                    ? 'text-module-market'
                    : 'text-text-3 hover:text-text-2'
                }`}
              >
                {isActive('marketplace') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-brand rounded-t-full" />
                )}
                智能推荐
              </Link>
              <Link
                to="/factory"
                className={`px-4 py-2 text-sm font-medium transition-all duration-platform relative ${
                  isActive('factory')
                    ? 'text-module-workshop'
                    : 'text-text-3 hover:text-text-2'
                }`}
              >
                {isActive('factory') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-brand rounded-t-full" />
                )}
                工坊
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 text-sm font-medium transition-all duration-platform relative ${
                  isActive('dashboard')
                    ? 'text-module-dashboard'
                    : 'text-text-3 hover:text-text-2'
                }`}
              >
                {isActive('dashboard') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-brand rounded-t-full" />
                )}
                大盘
              </Link>
            </nav>
          </div>

          {/* 右侧：头像和我的按钮 */}
          <div className="flex items-center gap-4">
            {/* 我的按钮 */}
            <button
              onClick={() => navigate('/my')}
              className="text-sm text-text-2 hover:text-text-1 font-medium transition-colors duration-platform"
            >
              我的
            </button>
            
            {/* 头像 */}
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-3 text-sm">
              {role === 'algo' ? 'A' : 'B'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
