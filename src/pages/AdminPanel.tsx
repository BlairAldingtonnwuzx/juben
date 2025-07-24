import React, { useState, useEffect } from 'react';
import { Users, FileText, Settings, CheckCircle, XCircle, Shield, Upload, Trash2, Tag, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { User, Script, UserPermissions } from '../types';
import { updateScript, deleteScript, updateUser, fetchUsers, fetchScripts, fetchSystemConfig, updateSystemConfig } from '../utils/api';
import { deleteUser } from '../utils/api';

const AdminPanel: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('scripts');
  const [users, setUsersState] = useState<User[]>([]);
  const [scripts, setScriptsState] = useState<Script[]>([]);
  const [groupedScripts, setGroupedScripts] = useState<Record<string, Script[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [systemConfig, setSystemConfig] = useState<any>({ availableTags: [] });
  const [newTag, setNewTag] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
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

  useEffect(() => {
    if (isAdmin) {
      const loadData = async () => {
        try {
          const [users, scripts, config] = await Promise.all([
            fetchUsers(),
            fetchScripts(),
            fetchSystemConfig()
          ]);
          
          setUsersState(users);
          setScriptsState(scripts);
          setSystemConfig(config);
        } catch (error) {
          console.error('加载数据失败:', error);
        }
      };
      loadData();
    }
  }, [isAdmin]);

  useEffect(() => {
    const approvedScripts = scripts.filter(s => s.status !== 'pending');
    const grouped = approvedScripts.reduce((acc, script) => {
      const key = script.baseScriptId || script.id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(script);
      return acc;
    }, {} as Record<string, Script[]>);
    
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => (b.version || '').localeCompare(a.version || ''));
    });
    
    setGroupedScripts(grouped);
  }, [scripts]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-900/20 dark:bg-red-900/20 bg-red-100 border border-red-700 dark:border-red-700 border-red-300 rounded-lg p-6 text-center">
          <Shield className="mx-auto mb-4 text-red-400" size={48} />
          <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-2">访问被拒绝</h2>
          <p className="text-gray-300 dark:text-gray-300 text-gray-600">您没有管理员权限，无法访问此页面。</p>
        </div>
      </div>
    );
  }

  const handleScriptAction = (scriptId: string, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    updateScript(scriptId, { status: newStatus }).then(result => {
      if (result.success) {
        const updatedScripts = scripts.map(script =>
          script.id === scriptId ? { ...script, status: newStatus } : script
        );
        setScriptsState(updatedScripts);
      }
    });
  };

  const handleUserPermission = (userId: string, field: 'canUpload' | 'skipReview', value: boolean) => {
    updateUser(userId, { [field]: value }).then(result => {
      if (result.success) {
        const updatedUsers = users.map(u =>
          u.id === userId ? { ...u, [field]: value } : u
        );
        setUsersState(updatedUsers);
      }
    });
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (window.confirm('确定要删除这个剧本吗？此操作不可撤销。')) {
      const result = await deleteScript(scriptId);
      if (result.success) {
        const updatedScripts = scripts.filter(s => s.id !== scriptId);
        setScriptsState(updatedScripts);
      }
    }
  };

  const handleDeleteSeries = async (baseScriptId: string) => {
    const seriesToDelete = scripts.filter(s => s.baseScriptId === baseScriptId);
    const seriesTitle = seriesToDelete[0]?.title || '未知系列';
    
    if (window.confirm(`确定要删除"${seriesTitle}"系列的所有 ${seriesToDelete.length} 个版本吗？此操作不可撤销。`)) {
      try {
        // 逐个删除系列中的所有剧本
        const deletePromises = seriesToDelete.map(script => deleteScript(script.id));
        const results = await Promise.all(deletePromises);
        
        // 检查是否所有删除操作都成功
        const allSuccess = results.every(result => result.success);
        
        if (allSuccess) {
          // 从本地状态中移除已删除的剧本
          const updatedScripts = scripts.filter(s => s.baseScriptId !== baseScriptId);
          setScriptsState(updatedScripts);
          alert(`成功删除"${seriesTitle}"系列的所有版本`);
        } else {
          alert('部分剧本删除失败，请刷新页面查看最新状态');
        }
      } catch (error) {
        console.error('删除系列失败:', error);
        alert('删除系列时发生错误');
      }
    }
  };

  const handleUserPermissionChange = (userId: string, permission: keyof UserPermissions, value: boolean) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const updatedPermissions = { ...user.permissions, [permission]: value };
    updateUser(userId, { permissions: updatedPermissions }).then(result => {
      if (result.success) {
        const updatedUsers = users.map(u =>
          u.id === userId ? { ...u, permissions: updatedPermissions } : u
        );
        setUsersState(updatedUsers);
      }
    });
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || systemConfig.availableTags.includes(newTag.trim())) return;
    
    const updatedTags = [...systemConfig.availableTags, newTag.trim()];
    const result = await updateSystemConfig({ availableTags: updatedTags });
    
    if (result.success) {
      setSystemConfig({ ...systemConfig, availableTags: updatedTags });
      setNewTag('');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = systemConfig.availableTags.filter((tag: string) => tag !== tagToRemove);
    const result = await updateSystemConfig({ availableTags: updatedTags });
    
    if (result.success) {
      setSystemConfig({ ...systemConfig, availableTags: updatedTags });
    }
  };

  const handleAddUser = async () => {
    const newUser = {
      id: Date.now().toString(),
      ...userForm,
      joinDate: new Date().toISOString().split('T')[0],
      uploadCount: 0
    };

    const updatedUsers = [...users, newUser];
    const result = await updateUser('new', newUser);
    
    if (result.success) {
      setUsersState(updatedUsers);
      setShowAddUserModal(false);
      resetUserForm();
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      canUpload: user.canUpload,
      skipReview: user.skipReview,
      permissions: user.permissions || {
        canViewScripts: true,
        canDownloadScripts: true,
        canUploadScripts: true,
        canManageUsers: false,
        canManageTags: false,
        canApproveScripts: false,
        canDeleteScripts: false
      }
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const updatedUser = {
      ...editingUser,
      ...userForm
    };

    const result = await updateUser(editingUser.id, userForm);
    
    if (result.success) {
      const updatedUsers = users.map(u => 
        u.id === editingUser.id ? updatedUser : u
      );
      setUsersState(updatedUsers);
      setShowEditUserModal(false);
      setEditingUser(null);
      resetUserForm();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      // 这里需要添加删除用户的API调用
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsersState(updatedUsers);
    }
  };

  const resetUserForm = () => {
    setUserForm({
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
  };
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const pendingScripts = scripts.filter(s => s.status === 'pending');
  const approvedScripts = scripts.filter(s => s.status !== 'pending');

  const tabs = [
    { id: 'scripts', label: '剧本审核', icon: FileText },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'permissions', label: '权限管理', icon: Shield },
    { id: 'tags', label: '标签管理', icon: Tag },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white dark:text-white text-gray-900 mb-4">管理员后台</h1>
        <p className="text-gray-300 dark:text-gray-300 text-gray-600">管理剧本审核、用户权限和系统设置</p>
      </div>

      <div className="flex space-x-8">
        <div className="w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-200 hover:text-white dark:hover:text-white hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'scripts' && (
            <div className="space-y-6">
              {pendingScripts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">
                    待审核剧本 ({pendingScripts.length})
                  </h2>
                  <div className="space-y-4">
                    {pendingScripts.map((script) => (
                      <div key={script.id} className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-transparent dark:border-transparent border-gray-200">
                        <div className="flex items-start space-x-4">
                          <img
                            src={script.imageUrl}
                            alt={script.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-2">{script.title}</h3>
                            <p className="text-gray-300 dark:text-gray-300 text-gray-600 mb-2">{script.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {script.tags.map(tag => (
                                <span key={tag} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">
                              上传者：{script.uploaderName} · {script.uploadDate}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Tag size={14} className="text-gray-400" />
                              <span className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">版本 {script.version}</span>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleScriptAction(script.id, 'approve')}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                              <CheckCircle size={16} />
                              <span>通过</span>
                            </button>
                            <button
                              onClick={() => handleScriptAction(script.id, 'reject')}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              <XCircle size={16} />
                              <span>拒绝</span>
                            </button>
                            <button
                              onClick={() => handleDeleteScript(script.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                              <span>删除</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">
                  所有剧本 ({approvedScripts.length})
                </h2>
                <div className="space-y-4">
                  {Object.entries(groupedScripts).map(([groupKey, groupScripts]) => {
                    const mainScript = groupScripts[0]; // 最新版本作为主要显示
                    const isExpanded = expandedGroups[groupKey];
                    
                    return (
                      <div key={groupKey} className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg overflow-hidden border border-transparent dark:border-transparent border-gray-200">
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => toggleGroupExpansion(groupKey)}
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={mainScript.imageUrl}
                              alt={mainScript.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <h3 className="text-white dark:text-white text-gray-900 font-semibold">{mainScript.title}</h3>
                              <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">
                                {groupScripts.length} 个版本 · 最新: {mainScript.version}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">
                              总下载: {groupScripts.reduce((sum, s) => sum + s.downloads, 0)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSeries(groupKey);
                              }}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                              title="删除整个系列"
                            >
                              <Trash2 size={14} />
                              <span>删除系列</span>
                            </button>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-gray-700 dark:border-gray-700 border-gray-200">
                            <table className="w-full">
                              <thead className="bg-gray-700 dark:bg-gray-700 bg-gray-100">
                                <tr>
                                  <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">版本</th>
                                  <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">上传者</th>
                                  <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">状态</th>
                                  <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">点赞/下载</th>
                                  <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">日期</th>
                                  <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {groupScripts.map((script) => (
                                  <tr key={script.id} className="border-t border-gray-600 dark:border-gray-600 border-gray-200">
                                    <td className="px-6 py-4 text-white dark:text-white text-gray-900 font-medium">{script.version}</td>
                                    <td className="px-6 py-4 text-gray-300 dark:text-gray-300 text-gray-600">{script.uploaderName}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-sm ${
                                        script.status === 'approved' 
                                          ? 'bg-green-600 text-white' 
                                          : 'bg-red-600 text-white'
                                      }`}>
                                        {script.status === 'approved' ? '已通过' : '已拒绝'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 dark:text-gray-300 text-gray-600">{script.likes} / {script.downloads}</td>
                                    <td className="px-6 py-4 text-gray-300 dark:text-gray-300 text-gray-600">{script.uploadDate}</td>
                                    <td className="px-6 py-4">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteScript(script.id);
                                        }}
                                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                      >
                                        <Trash2 size={14} />
                                        <span>删除</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">用户管理</h2>
              
              {/* 添加用户按钮 */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>添加用户</span>
                </button>
              </div>

              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg overflow-hidden border border-transparent dark:border-transparent border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-700 dark:bg-gray-700 bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">用户</th>
                      <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">角色</th>
                      <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">上传数量</th>
                      <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">加入时间</th>
                      <th className="px-6 py-3 text-left text-white dark:text-white text-gray-900">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-gray-700 dark:border-gray-700 border-gray-200">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white dark:text-white text-gray-900 font-medium">{u.name}</div>
                            <div className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">{u.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            u.role === 'admin' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {u.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300 dark:text-gray-300 text-gray-600">{u.uploadCount}</td>
                        <td className="px-6 py-4 text-gray-300 dark:text-gray-300 text-gray-600">{u.joinDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditUser(u)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              <Settings size={14} />
                              <span>编辑</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              <Trash2 size={14} />
                              <span>删除</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div>
              <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">权限管理</h2>
              <div className="space-y-6">
                {users.map((user) => (
                  <div key={user.id} className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-transparent dark:border-transparent border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900">{user.name}</h3>
                        <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">{user.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm ${
                        user.role === 'admin' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries({
                        canViewScripts: '查看剧本',
                        canDownloadScripts: '下载剧本',
                        canUploadScripts: '上传剧本',
                        canManageUsers: '管理用户',
                        canManageTags: '管理标签',
                        canApproveScripts: '审核剧本',
                        canDeleteScripts: '删除剧本'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.permissions?.[key as keyof UserPermissions] || false}
                            onChange={(e) => handleUserPermissionChange(user.id, key as keyof UserPermissions, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-300 dark:text-gray-300 text-gray-700 text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div>
              <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">标签管理</h2>
              
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 mb-6 border border-transparent dark:border-transparent border-gray-200">
                <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-4">添加新标签</h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="输入新标签名称"
                    className="flex-1 px-4 py-2 bg-gray-700 dark:bg-gray-700 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || systemConfig.availableTags.includes(newTag.trim())}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>添加</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-transparent dark:border-transparent border-gray-200">
                <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-4">
                  现有标签 ({systemConfig.availableTags.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {systemConfig.availableTags.map((tag: string) => (
                    <div
                      key={tag}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                {systemConfig.availableTags.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-center py-8">
                    暂无标签，请添加新标签
                  </p>
                )}
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">系统设置</h2>
              <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg p-6 border border-transparent dark:border-transparent border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white dark:text-white text-gray-900 font-medium">自动审核</h3>
                      <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">新用户上传的剧本自动通过审核</p>
                    </div>
                    <button className="bg-gray-600 dark:bg-gray-600 bg-gray-300 hover:bg-gray-500 dark:hover:bg-gray-500 hover:bg-gray-400 text-white dark:text-white text-gray-900 px-4 py-2 rounded-lg transition-colors">
                      已关闭
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white dark:text-white text-gray-900 font-medium">用户注册</h3>
                      <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">允许新用户注册账户</p>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                      已开启
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white dark:text-white text-gray-900 font-medium">上传限制</h3>
                      <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">每个用户每日最大上传数量</p>
                    </div>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-20 px-3 py-2 bg-gray-700 dark:bg-gray-700 bg-white text-white dark:text-white text-gray-900 rounded border border-gray-600 dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 添加用户模态框 */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">添加用户</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">姓名</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">角色</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value as 'user' | 'admin'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userForm.canUpload}
                    onChange={(e) => setUserForm({...userForm, canUpload: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">允许上传</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userForm.skipReview}
                    onChange={(e) => setUserForm({...userForm, skipReview: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">免审核</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  resetUserForm();
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                disabled={!userForm.name || !userForm.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户模态框 */}
      {showEditUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">编辑用户</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">姓名</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">角色</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value as 'user' | 'admin'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">基本权限</h3>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={userForm.canUpload}
                      onChange={(e) => setUserForm({...userForm, canUpload: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">允许上传</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={userForm.skipReview}
                      onChange={(e) => setUserForm({...userForm, skipReview: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">免审核</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">详细权限</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({
                    canViewScripts: '查看剧本',
                    canDownloadScripts: '下载剧本',
                    canUploadScripts: '上传剧本',
                    canManageUsers: '管理用户',
                    canManageTags: '管理标签',
                    canApproveScripts: '审核剧本',
                    canDeleteScripts: '删除剧本'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={userForm.permissions[key as keyof UserPermissions] || false}
                        onChange={(e) => setUserForm({
                          ...userForm,
                          permissions: {
                            ...userForm.permissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  resetUserForm();
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={!userForm.name || !userForm.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;