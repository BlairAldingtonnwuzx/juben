import React, { useState, useEffect } from 'react';
import { Home, TrendingUp, Upload, Settings, User, LogOut, LogIn, Sun, Moon, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { updateUser, fetchSystemConfig } from '../utils/api';

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
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const { login } = useAuth();

  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const config = await fetchSystemConfig();
        setSystemSettings(config.systemSettings || { allowUserRegistration: true });
      } catch (error) {
        console.error('Failed to load system settings:', error);
        // 默认允许注册
        setSystemSettings({ systemSettings: { allowUserRegistration: true } });
      }
    };
    loadSystemSettings();
    
    // 监听系统设置更新事件
    const handleSettingsUpdate = (event: CustomEvent) => {
      setSystemSettings(event.detail.systemSettings || { allowUserRegistration: true });
    };
    
    window.addEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  // 当注册功能被禁用时，自动切换到登录模式
  useEffect(() => {
    if (systemSettings?.allowUserRegistration === false && isRegistering) {
      setIsRegistering(false);
      resetForm();
    }
  }, [systemSettings?.allowUserRegistration, isRegistering]);
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const loginSuccess = await login(email, password);
      if (loginSuccess) {
        onClose();
        resetForm();
      } else {
        setError('登录失败，请检查邮箱和密码');
      }
    } catch (error) {
      setError('登录时发生错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // 客户端验证
    if (!name.trim()) {
      setError('请输入用户名');
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = {
        name: name.trim(),
        email: email.trim(),
        role: 'user' as const,
        canUpload: true,
        skipReview: false,
        permissions: {
          canViewScripts: true,
          canDownloadScripts: true,
          canUploadScripts: true,
          canManageUsers: false,
          canManageTags: false,
          canApproveScripts: false,
          canDeleteScripts: false
        }
      };

      const result = await updateUser('new', newUser);
      
      if (result.success) {
        setSuccess('注册成功！请使用新账户登录');
        setTimeout(() => {
          setIsRegistering(false);
          setSuccess('');
          resetForm();
        }, 2000);
      } else {
        setError(result.error || '注册失败，请稍后重试');
      }
    } catch (error) {
      setError('注册时发生错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = () => {
    setIsRegistering(!isRegistering);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    setIsRegistering(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {isRegistering ? (
              <UserPlus className="text-blue-500" size={24} />
            ) : (
              <LogIn className="text-blue-500" size={24} />
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRegistering ? '注册账户' : '登录账户'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                用户名 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                placeholder="请输入用户名"
                required={isRegistering}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              邮箱地址 *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              placeholder={isRegistering ? "请输入邮箱地址" : "请输入邮箱地址"}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              密码 *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                placeholder="输入密码"
                required
                disabled={isSubmitting}
                minLength={isRegistering ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                确认密码 *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  placeholder="输入密码"
                  required={isRegistering}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{isRegistering ? '注册中...' : '登录中...'}</span>
              </>
            ) : (
              <>
                {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
                <span>{isRegistering ? '注册账户' : '立即登录'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={switchMode}
            disabled={isSubmitting}
            className={`font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              systemSettings?.allowUserRegistration !== false
                ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            style={{ display: systemSettings?.allowUserRegistration === false && isRegistering ? 'none' : 'block' }}
          >
            {isRegistering ? '已有账户？立即登录' : (systemSettings?.allowUserRegistration !== false ? '没有账户？立即注册' : '注册功能已关闭')}
          </button>
          {systemSettings?.allowUserRegistration === false && !isRegistering && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              管理员已关闭用户注册功能
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;