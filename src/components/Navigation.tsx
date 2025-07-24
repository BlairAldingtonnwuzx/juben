import React, { useState } from 'react';
import { Home, TrendingUp, Upload, Settings, User, LogOut, LogIn, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navItems = [
    { id: 'browser', label: '剧本浏览', icon: Home },
    { id: 'ranking', label: '排行榜', icon: TrendingUp },
    { id: 'upload', label: '上传剧本', icon: Upload },
    ...(isAdmin ? [{ id: 'admin', label: '管理后台', icon: Settings }] : []),
  ];

  return (
    <>
      <nav className="bg-gray-900 dark:bg-gray-900 bg-white border-b border-gray-800 dark:border-gray-800 border-gray-200 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-white dark:text-white text-gray-900">剧本管理平台</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex space-x-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onPageChange(item.id)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                          currentPage === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 dark:text-gray-300 text-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-100 hover:text-white dark:hover:text-white hover:text-gray-900'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-300 dark:text-gray-300 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors rounded-md hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-100"
                title={isDarkMode ? '切换到白天模式' : '切换到夜间模式'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-300 dark:text-gray-300 text-gray-600">
                    <User size={18} />
                    <span className="text-sm">{user.name}</span>
                    {user.role === 'admin' && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">管理员</span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-300 dark:text-gray-300 text-gray-600 hover:text-white dark:hover:text-white hover:text-gray-900 transition-colors flex items-center space-x-1"
                  >
                    <LogOut size={18} />
                    <span className="text-sm">退出</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <LogIn size={18} />
                  <span>登录</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800 dark:bg-gray-800 bg-gray-50">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2 ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 dark:text-gray-300 text-gray-600 hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-100 hover:text-white dark:hover:text-white hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      onClose();
    } else {
      setError('登录失败，请检查邮箱和密码');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">登录</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="admin@example.com 或 user@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="任意密码"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              登录
            </button>
          </div>
        </form>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>演示账户：</p>
          <p>管理员：admin@example.com</p>
          <p>普通用户：user@example.com</p>
        </div>
      </div>
    </div>
  );
};

export default Navigation;