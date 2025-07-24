import React, { useState, useEffect } from 'react';
import { Users, FileText, Settings, Check, X, Trash2, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Plus, Save, Loader2, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchScripts, fetchUsers, updateScript, deleteScript, updateUser, deleteUser, fetchSystemConfig, updateSystemConfig } from '../utils/api';
import { Script, User } from '../types';

interface AdminPanelProps {
  onScriptSelect: (script: Script) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onScriptSelect }) => {
  // 所有 hooks 必须在组件顶部无条件调用
  const { user, isAdmin } = useAuth();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<'scripts' | 'users' | 'settings'>('scripts');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 剧本相关状态
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [collapsedSeries, setCollapsedSeries] = useState<Record<string, boolean>>({});
  
  // 用户管理相关状态
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin',
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
  });
  
  // 系统设置相关状态
  const [systemSettings, setSystemSettings] = useState({
    allowUserRegistration: true,
    requireScriptApproval: true,
    maxUploadSizeKB: 10240,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/json'],
    maxUploadsPerDay: 10,
    maxScriptsPerUser: 50
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  const usersPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [scriptsData, usersData, configData] = await Promise.all([
        fetchScripts(),
        fetchUsers(),
        fetchSystemConfig()
      ]);
      
      setScripts(scriptsData);
      setUsers(usersData);
      setAvailableTags(configData.availableTags || []);
      setSystemSettings(configData.systemSettings || systemSettings);
    } catch (error) {
      setError('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect hooks - 必须在所有 useState 之后，早期返回之前
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 早期返回检查 - 在所有 hooks 调用之后
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">访问被拒绝</h2>
          <p className="text-red-300">您没有权限访问管理后台</p>
        </div>
      </div>
    );
  }

  const handleScriptStatusChange = async (scriptId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const result = await updateScript(scriptId, { status: newStatus });
      if (result.success) {
        setScripts(prev => prev.map(script => 
          script.id === scriptId ? { ...script, status: newStatus } : script
        ));
        setSuccess(`剧本状态已更新为${newStatus === 'approved' ? '已通过' : newStatus === 'rejected' ? '已拒绝' : '待审核'}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('更新剧本状态失败');
      }
    } catch (error) {
      setError('更新剧本状态失败');
      console.error('更新剧本状态失败:', error);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (window.confirm('确定要删除这个剧本吗？此操作不可撤销。')) {
      try {
        const result = await deleteScript(scriptId);
        if (result.success) {
          setScripts(prev => prev.filter(script => script.id !== scriptId));
          setSuccess('剧本删除成功');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('删除剧本失败');
        }
      } catch (error) {
        setError('删除剧本失败');
        console.error('删除剧本失败:', error);
      }
    }
  };

  const handleDeleteSeries = async (baseScriptId: string) => {
    const seriesScripts = scripts.filter(script => 
      (script.baseScriptId || script.id) === baseScriptId
    );
    
    if (seriesScripts.length === 0) return;
    
    const seriesName = seriesScripts[0].title;
    const confirmMessage = `确定要删除整个"${seriesName}"系列吗？这将删除 ${seriesScripts.length} 个版本的剧本，此操作不可撤销。`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const deletePromises = seriesScripts.map(script => deleteScript(script.id));
        const results = await Promise.all(deletePromises);
        
        const successCount = results.filter(result => result.success).length;
        
        if (successCount === seriesScripts.length) {
          setScripts(prev => prev.filter(script => 
            (script.baseScriptId || script.id) !== baseScriptId
          ));
          setSuccess(`成功删除"${seriesName}"系列的 ${successCount} 个剧本`);
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(`删除系列时出现错误，成功删除 ${successCount}/${seriesScripts.length} 个剧本`);
        }
      } catch (error) {
        setError('删除剧本系列失败');
        console.error('删除剧本系列失败:', error);
      }
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const result = await updateUser(userId, updates);
      if (result.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ));
        setSuccess('用户信息更新成功');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('更新用户信息失败');
      }
    } catch (error) {
      setError('更新用户信息失败');
      console.error('更新用户信息失败:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      try {
        const result = await deleteUser(userId);
        if (result.success) {
          setUsers(prev => prev.filter(user => user.id !== userId));
          setSuccess('用户删除成功');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(result.error || '删除用户失败');
        }
      } catch (error) {
        setError('删除用户失败');
        console.error('删除用户失败:', error);
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setError('请填写用户名和邮箱');
      return;
    }

    try {
      const result = await updateUser('new', {
        ...newUser,
        joinDate: new Date().toISOString().split('T')[0],
        uploadCount: 0
      });
      
      if (result.success) {
        setUsers(prev => [...prev, result.user]);
        setNewUser({
          name: '',
          email: '',
          role: 'user',
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
        });
        setShowAddUser(false);
        setSuccess('用户添加成功');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || '添加用户失败');
      }
    } catch (error) {
      setError('添加用户失败');
      console.error('添加用户失败:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const config = {
        availableTags,
        systemSettings
      };
      
      const result = await updateSystemConfig(config);
      if (result.success) {
        setSuccess('系统设置保存成功');
        setTimeout(() => setSuccess(''), 3000);
        
        // 触发全局设置更新事件 - 通知所有客户端
        window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { 
          detail: { systemSettings } 
        }));
        
        // 广播到其他窗口/标签页
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('systemSettings');
          channel.postMessage({ type: 'settingsUpdated', systemSettings });
          channel.close();
        }
      } else {
        setError(result.error || '保存设置失败');
      }
    } catch (error) {
      setError('保存设置失败');
      console.error('保存设置失败:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      setAvailableTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setAvailableTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const toggleSeriesCollapse = (baseScriptId: string) => {
    setCollapsedSeries(prev => ({
      ...prev,
      [baseScriptId]: !prev[baseScriptId]
    }));
  };

  // 过滤和分组逻辑
  const filteredScripts = scripts.filter(script => {
    if (statusFilter === 'all') return true;
    return script.status === statusFilter;
  });

  const groupedScripts = filteredScripts.reduce((acc, script) => {
    const baseId = script.baseScriptId || script.id;
    if (!acc[baseId]) {
      acc[baseId] = [];
    }
    acc[baseId].push(script);
    return acc;
  }, {} as Record<string, Script[]>);

  // 用户搜索和分页
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // 统计数据
  const scriptStats = {
    total: scripts.length,
    pending: scripts.filter(s => s.status === 'pending').length,
    approved: scripts.filter(s => s.status === 'approved').length,
    rejected: scripts.filter(s => s.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">管理后台</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'scripts'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileText size={18} />
            <span>剧本审核</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Users size={18} />
            <span>用户管理</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Settings size={18} />
            <span>系统设置</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-green-900/20 border border-green-700 rounded-lg p-4 flex items-center space-x-3">
          <Check className="text-green-400" size={20} />
          <p className="text-green-300">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center space-x-3">
          <X className="text-red-400" size={20} />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {activeTab === 'scripts' && (
        <div className="space-y-6">
          {/* 状态筛选器 */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              全部 ({scriptStats.total})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-yellow-600/20'
              }`}
            >
              待审核 ({scriptStats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-green-600/20'
              }`}
            >
              已通过 ({scriptStats.approved})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-red-600/20'
              }`}
            >
              已拒绝 ({scriptStats.rejected})
            </button>
          </div>

          {Object.keys(groupedScripts).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {statusFilter === 'all' ? '暂无剧本' : `暂无${statusFilter === 'pending' ? '待审核' : statusFilter === 'approved' ? '已通过' : '已拒绝'}的剧本`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedScripts).map(([baseScriptId, seriesScripts]) => {
                const isCollapsed = collapsedSeries[baseScriptId];
                const mainScript = seriesScripts[0];
                
                return (
                  <div key={baseScriptId} className="bg-gray-800 rounded-lg border border-gray-700">
                    {/* 系列标题栏 */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                      onClick={() => toggleSeriesCollapse(baseScriptId)}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={mainScript.imageUrl}
                          alt={mainScript.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="text-xl font-semibold text-white">{mainScript.title}</h3>
                          <p className="text-gray-400">
                            {seriesScripts.length} 个版本 • 上传者：{mainScript.uploaderName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSeries(baseScriptId);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
                          title="删除整个系列"
                        >
                          <Trash2 size={16} />
                          <span>删除系列</span>
                        </button>
                        <div className="text-gray-400">
                          {isCollapsed ? '展开' : '收起'}
                        </div>
                      </div>
                    </div>

                    {/* 版本列表 */}
                    {!isCollapsed && (
                      <div className="border-t border-gray-700">
                        {seriesScripts.map((script) => (
                          <div key={script.id} className="p-4 border-b border-gray-700 last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-2">
                                  <span className="text-white font-medium">版本 {script.version}</span>
                                  <span className="text-gray-400 text-sm">{script.uploadDate}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-400 text-sm">状态：</span>
                                    <select
                                      value={script.status}
                                      onChange={(e) => handleScriptStatusChange(script.id, e.target.value as any)}
                                      className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="pending">待审核</option>
                                      <option value="approved">已通过</option>
                                      <option value="rejected">已拒绝</option>
                                    </select>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      script.status === 'approved' ? 'bg-green-600 text-white' :
                                      script.status === 'rejected' ? 'bg-red-600 text-white' :
                                      'bg-yellow-600 text-white'
                                    }`}>
                                      {script.status === 'approved' ? '已通过' :
                                       script.status === 'rejected' ? '已拒绝' : '待审核'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">{script.description}</p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {script.tags.map(tag => (
                                    <span key={tag} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                  <span>👍 {script.likes}</span>
                                  <span>📥 {script.downloads}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => onScriptSelect(script)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                                  title="查看详情"
                                >
                                  <Info size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteScript(script.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                                  title="删除此版本"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* 搜索和添加用户 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索用户名、邮箱或角色..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>添加用户</span>
            </button>
          </div>

          {/* 用户统计 */}
          <div className="text-gray-400 text-sm">
            显示 {startIndex + 1}-{Math.min(startIndex + usersPerPage, filteredUsers.length)} 条，共 {filteredUsers.length} 个用户
            {searchTerm && ` (搜索: "${searchTerm}")`}
          </div>

          {/* 用户列表 */}
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {searchTerm ? '未找到匹配的用户' : '暂无用户'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">用户</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">角色</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">权限</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">统计</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-gray-400 text-sm">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as 'user' | 'admin' })}
                            className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">普通用户</option>
                            <option value="admin">管理员</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={user.canUpload}
                                onChange={(e) => handleUpdateUser(user.id, { canUpload: e.target.checked })}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-300">可上传</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={user.skipReview}
                                onChange={(e) => handleUpdateUser(user.id, { skipReview: e.target.checked })}
                                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-300">免审核</span>
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300">
                            <div>加入时间: {user.joinDate}</div>
                            <div>上传数量: {user.uploadCount || 0}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                            title="删除用户"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  <ChevronLeft size={16} />
                  <span>上一页</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  <span>下一页</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 添加用户模态框 */}
          {showAddUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-xl font-semibold text-white mb-4">添加新用户</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">用户名</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入邮箱地址"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">角色</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newUser.canUpload}
                        onChange={(e) => setNewUser(prev => ({ ...prev, canUpload: e.target.checked }))}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">允许上传剧本</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newUser.skipReview}
                        onChange={(e) => setNewUser(prev => ({ ...prev, skipReview: e.target.checked }))}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">跳过审核</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* 用户注册设置 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">用户注册设置</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-gray-300 font-medium">允许用户注册</span>
                  <p className="text-gray-400 text-sm">关闭后，新用户无法自行注册账户</p>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={systemSettings.allowUserRegistration}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, allowUserRegistration: e.target.checked }))}
                    className="sr-only"
                    id="allowUserRegistration"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                      systemSettings.allowUserRegistration ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                    <label
                      htmlFor="allowUserRegistration"
                      className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform cursor-pointer ${
                        systemSettings.allowUserRegistration ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 剧本审核设置 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">剧本审核设置</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-gray-300 font-medium">需要审核剧本</span>
                  <p className="text-gray-400 text-sm">关闭后，所有剧本将自动通过审核</p>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={systemSettings.requireScriptApproval}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, requireScriptApproval: e.target.checked }))}
                    className="sr-only"
                    id="requireScriptApproval"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                      systemSettings.requireScriptApproval ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                    <label
                      htmlFor="requireScriptApproval"
                      className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform cursor-pointer ${
                        systemSettings.requireScriptApproval ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 上传限制设置 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">上传限制设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  最大文件大小 (KB)
                </label>
                <input
                  type="number"
                  min="1024"
                  max="102400"
                  value={systemSettings.maxUploadSizeKB}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maxUploadSizeKB: parseInt(e.target.value) || 10240 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  当前: {(systemSettings.maxUploadSizeKB / 1024).toFixed(1)} MB
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  每日上传限制
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={systemSettings.maxUploadsPerDay}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maxUploadsPerDay: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  每个用户每天最多上传剧本数量
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  用户剧本总数限制
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={systemSettings.maxScriptsPerUser}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maxScriptsPerUser: parseInt(e.target.value) || 50 }))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  每个用户最多拥有的剧本数量
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  允许的文件类型
                </label>
                <div className="space-y-2">
                  {['image/jpeg', 'image/png', 'image/gif', 'application/json'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={systemSettings.allowedFileTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSystemSettings(prev => ({
                              ...prev,
                              allowedFileTypes: [...prev.allowedFileTypes, type]
                            }));
                          } else {
                            setSystemSettings(prev => ({
                              ...prev,
                              allowedFileTypes: prev.allowedFileTypes.filter(t => t !== type)
                            }));
                          }
                        }}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">
                        {type === 'image/jpeg' ? 'JPEG 图片' :
                         type === 'image/png' ? 'PNG 图片' :
                         type === 'image/gif' ? 'GIF 图片' :
                         'JSON 文件'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 标签管理 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">标签管理</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="输入新标签"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <span
                    key={tag}
                    className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-blue-700 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {settingsLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>保存设置</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;