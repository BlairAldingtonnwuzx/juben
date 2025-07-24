import React, { useState } from 'react';
import { ArrowLeft, Heart, Download, User, Calendar, Share2, X, ZoomIn, Users, Shield, Sword, Skull, Star, Compass, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Script } from '../types';
import { updateScript, downloadScript } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { fetchScripts } from '../utils/api';

interface ScriptDetailProps {
  script: Script;
  onBack: () => void;
}

interface Role {
  ability: string;
  image: string;
  name: string;
  team: string;
  firstNight: number;
  otherNight: number;
  id: string;
}

interface ScriptMeta {
  logo: string;
  description: string;
  author: string;
  name: string;
  townsfolkName: string;
}

const ScriptDetail: React.FC<ScriptDetailProps> = ({ script, onBack }) => {
  const [currentScript, setCurrentScript] = useState(script);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({});
  const [allVersions, setAllVersions] = useState<Script[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { user } = useAuth();

  // 初始化所有团队为收缩状态
  React.useEffect(() => {
    const teamOrder = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler', '其他设置'];
    const initialCollapsedState = teamOrder.reduce((acc, team) => {
      acc[team] = true; // 默认收缩
      return acc;
    }, {} as Record<string, boolean>);
    setCollapsedTeams(initialCollapsedState);
  }, []);

  // 获取同一剧本的所有版本
  React.useEffect(() => {
    const loadVersions = async () => {
      try {
        const allScripts = await fetchScripts();
        const scripts = allScripts.filter((s: Script) => 
          s.status === 'approved' && 
          s.baseScriptId === currentScript.baseScriptId
        ).sort((a: Script, b: Script) => (b.version || '').localeCompare(a.version || ''));
        setAllVersions(scripts);
      } catch (error) {
        console.error('加载版本失败:', error);
      }
    };
    loadVersions();
  }, [currentScript.baseScriptId]);

  const handleLike = () => {
    if (!user) return;
    
    const newLikes = isLiked ? currentScript.likes - 1 : currentScript.likes + 1;
    
    updateScript(currentScript.id, { likes: newLikes }).then(result => {
      if (result.success) {
        setCurrentScript({ ...currentScript, likes: newLikes });
        setIsLiked(!isLiked);
      }
    });
  };

  const handleDownload = async () => {
    try {
      const result = await downloadScript(currentScript.id);
      if (result.success) {
        // 立即更新本地下载计数
        const newDownloads = currentScript.downloads + 1;
        setCurrentScript({ ...currentScript, downloads: newDownloads });
        
        // 同时更新版本历史中对应版本的下载数量
        setAllVersions(prevVersions => 
          prevVersions.map(version => 
            version.id === currentScript.id 
              ? { ...version, downloads: newDownloads }
              : version
          )
        );
        
        // 同步更新服务器端下载计数
        updateScript(currentScript.id, { downloads: newDownloads });
      } else {
        console.error('下载失败1:', result.error);
        // 可以在这里添加用户提示
      }
    } catch (error) {
      console.error('下载失败2:', error);
    }
  };

  // Parse JSON data
  const jsonData = currentScript.jsonData;
  const scriptMeta: ScriptMeta | null = Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].id === '_meta' 
    ? jsonData[0] as ScriptMeta 
    : null;
  
  const roles: Role[] = Array.isArray(jsonData) 
    ? jsonData.filter((item: any) => item.id !== '_meta') as Role[]
    : [];

  // Add state items to roles as "其他设置" team
  const stateItems = scriptMeta?.state || [];
  const stateRoles = stateItems.map((state, index) => ({
    id: `state_${index}`,
    name: state.stateName,
    ability: state.stateDescription,
    team: '其他设置',
    image: 'https://images.pexels.com/photos/1029807/pexels-photo-1029807.jpeg?auto=compress&cs=tinysrgb&w=100',
    firstNight: 0,
    otherNight: 0
  }));

  const allRoles = [...roles, ...stateRoles];

  const getTeamIcon = (team: string) => {
    switch (team) {
      case 'townsfolk': return <Users className="text-blue-400" size={20} />;
      case 'outsider': return <Shield className="text-yellow-400" size={20} />;
      case 'minion': return <Sword className="text-red-400" size={20} />;
      case 'demon': return <Skull className="text-purple-400" size={20} />;
      case 'fabled': return <Star className="text-gold-400" size={20} />;
      case 'traveler': return <Compass className="text-green-400" size={20} />;
      default: return <Star className="text-gray-400" size={20} />;
    }
  };

  const getTeamName = (team: string) => {
    switch (team) {
      case 'townsfolk': return '镇民';
      case 'outsider': return '外来者';
      case 'minion': return '爪牙';
      case 'demon': return '恶魔';
      case 'fabled': return '传奇角色';
      case 'traveler': return '旅行者';
      default: return '其他设置';
    }
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'townsfolk': return 'border-blue-500 bg-blue-500/10';
      case 'outsider': return 'border-yellow-500 bg-yellow-500/10';
      case 'minion': return 'border-red-500 bg-red-500/10';
      case 'demon': return 'border-purple-500 bg-purple-500/10';
      case 'fabled': return 'border-yellow-400 bg-yellow-400/10';
      case 'traveler': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const groupedRoles = allRoles.reduce((acc, role) => {
    const teamKey = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler'].includes(role.team) 
      ? role.team 
      : '其他设置';
    if (!acc[teamKey]) {
      acc[teamKey] = [];
    }
    acc[teamKey].push(role);
    return acc;
  }, {} as Record<string, Role[]>);

  // Sort roles within each team by firstNight order
  Object.keys(groupedRoles).forEach(team => {
    groupedRoles[team].sort((a, b) => {
      if (a.firstNight === 0 && b.firstNight === 0) return 0;
      if (a.firstNight === 0) return 1;
      if (b.firstNight === 0) return -1;
      return a.firstNight - b.firstNight;
    });
  });

  // Define team order for display
  const teamOrder = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler', '其他设置'];
  const allTeams = teamOrder.filter(team => groupedRoles[team]);

  const toggleTeamCollapse = (team: string) => {
    setCollapsedTeams(prev => ({
      ...prev,
      [team]: !prev[team]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span>返回列表</span>
      </button>

      <div className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg overflow-hidden shadow-xl border border-transparent dark:border-transparent border-gray-200">
        {/* Header with script logo and basic info */}
        <div className="relative">
          <div className="relative group cursor-pointer" onClick={() => setShowFullscreenImage(true)}>
            <img
              src={currentScript.imageUrl}
              alt={scriptMeta?.name || currentScript.title}
              className="w-full h-96 object-contain bg-gray-900"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={48} />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-4xl font-bold text-white mb-2">
              {scriptMeta?.name || currentScript.title}
            </h1>
            {scriptMeta?.author && (
              <p className="text-xl text-gray-300 mb-2">作者：{scriptMeta.author}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {currentScript.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* Script Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white dark:text-white text-gray-900 mb-4">剧本简介</h2>
                {scriptMeta?.logo && (
                  <div className="mb-6 flex justify-center">
                    <img
                      src={scriptMeta.logo}
                      alt="剧本Logo"
                      className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-600 dark:border-gray-600 border-gray-300"
                    />
                  </div>
                )}
                <p className="text-gray-300 dark:text-gray-300 text-gray-700 text-lg leading-relaxed">
                  {scriptMeta?.description || currentScript.description}
                </p>

                {scriptMeta?.status && scriptMeta.status.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-3">特殊规则</h3>
                    <div className="space-y-3">
                      {scriptMeta.status.map((status, index) => (
                        <div key={index} className="bg-gray-700 dark:bg-gray-700 bg-gray-100 rounded-lg p-4">
                          <h4 className="text-white dark:text-white text-gray-900 font-medium mb-2">{status.name}</h4>
                          <p className="text-gray-300 dark:text-gray-300 text-gray-600 text-sm">{status.skill}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Roles by Team */}
              <div className="space-y-8">
                {allTeams.map((team) => {
                  const teamRoles = groupedRoles[team];
                  return (
                  <div key={team} className="space-y-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-700 hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
                      onClick={() => toggleTeamCollapse(team)}
                    >
                      <div className="flex items-center space-x-3">
                      {getTeamIcon(team)}
                      <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900">
                        {getTeamName(team)} ({teamRoles.length})
                      </h3>
                      </div>
                      <div className="text-gray-400 dark:text-gray-400 text-gray-600">
                        {collapsedTeams[team] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                      </div>
                    </div>
                    
                    {!collapsedTeams[team] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamRoles.map((role) => (
                        <div
                          key={role.id}
                          className={`border rounded-lg p-4 ${getTeamColor(team)}`}
                        >
                          <div className="flex items-start space-x-3">
                            <img
                              src={role.image}
                              alt={role.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.pexels.com/photos/1029807/pexels-photo-1029807.jpeg?auto=compress&cs=tinysrgb&w=100';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white dark:text-white text-gray-900 font-semibold mb-2">{role.name}</h4>
                              <p className="text-gray-300 dark:text-gray-300 text-gray-600 text-sm mb-3 leading-relaxed">
                                {role.ability}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-400 text-gray-500">
                                {role.firstNight > 0 && (
                                  <span>首夜: {role.firstNight}</span>
                                )}
                                {role.otherNight > 0 && (
                                  <span>其他夜: {role.otherNight}</span>
                                )}
                              </div>
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

              {/* Raw JSON Data (fallback) */}
              {!Array.isArray(jsonData) && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-4">原始数据</h3>
                  <div className="bg-gray-700 dark:bg-gray-700 bg-gray-100 rounded-lg p-6">
                    <pre className="text-gray-300 dark:text-gray-300 text-gray-600 text-sm overflow-x-auto">
                      {JSON.stringify(currentScript.jsonData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-700 dark:bg-gray-700 bg-gray-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-4">剧本统计</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-red-400">
                      <Heart size={18} />
                      <span>点赞数</span>
                    </div>
                    <span className="text-white dark:text-white text-gray-900 font-semibold">{currentScript.likes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-green-400">
                      <Download size={18} />
                      <span>下载数</span>
                    </div>
                    <span className="text-white dark:text-white text-gray-900 font-semibold">{currentScript.downloads}</span>
                  </div>
                  {allRoles.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-blue-400">
                        <Users size={18} />
                        <span>角色数</span>
                      </div>
                      <span className="text-white dark:text-white text-gray-900 font-semibold">{allRoles.length}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-700 dark:bg-gray-700 bg-gray-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-4">上传信息</h3>
                <div className="space-y-3 text-gray-300 dark:text-gray-300 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>{currentScript.uploaderName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>{currentScript.uploadDate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag size={16} />
                    <span>版本 {currentScript.version}</span>
                  </div>
                </div>
              </div>

              {allVersions.length > 1 && (
                <div className="bg-gray-700 dark:bg-gray-700 bg-gray-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900">版本历史</h3>
                    <button
                      onClick={() => setShowVersions(!showVersions)}
                      className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                    >
                      <span>{showVersions ? '收起' : '展开'}</span>
                      {showVersions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  
                  {showVersions && (
                    <div className="space-y-2">
                      {allVersions.map(version => (
                        <div
                          key={version.id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            version.id === currentScript.id
                              ? 'bg-blue-600/20 border border-blue-500/30'
                              : 'bg-gray-600 dark:bg-gray-600 bg-gray-200 hover:bg-gray-500 dark:hover:bg-gray-500 hover:bg-gray-300 cursor-pointer'
                          }`}
                          onClick={() => {
                            if (version.id !== currentScript.id) {
                              setCurrentScript(version);
                            }
                          }}
                        >
                          <div>
                            <div className="text-white dark:text-white text-gray-900 font-medium">
                              版本 {version.version}
                              {version.id === currentScript.id && (
                                <span className="ml-2 text-blue-400 text-sm">(当前)</span>
                              )}
                            </div>
                            <div className="text-gray-300 dark:text-gray-300 text-gray-600 text-sm">{version.uploadDate}</div>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-300 dark:text-gray-300 text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Heart size={14} />
                              <span>{version.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download size={14} />
                              <span>{version.downloads}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleLike}
                  disabled={!user}
                  className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    isLiked
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  <span>{isLiked ? '已点赞' : '点赞'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Download size={20} />
                  <span>下载 JSON</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      // 生成可直接在浏览器中打开的JSON文件链接
                      const jsonFileUrl = currentScript.jsonUrl || `${window.location.origin}/api/scripts/${currentScript.id}/download`;
                      
                      // 复制到剪贴板
                      if (navigator.clipboard) {
                        await navigator.clipboard.writeText(jsonFileUrl);
                        // 显示复制成功提示
                        setCopySuccess(true);
                        setTimeout(() => {
                          setCopySuccess(false);
                        }, 2000);
                      } else {
                        // 降级方案：使用传统的复制方法
                        const textArea = document.createElement('textarea');
                        textArea.value = jsonFileUrl;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        // 显示复制成功提示
                        setCopySuccess(true);
                        setTimeout(() => {
                          setCopySuccess(false);
                        }, 2000);
                      }
                    } catch (error) {
                      console.error('复制链接失败:', error);
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-700 dark:bg-gray-700 bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-300 text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 rounded-lg font-semibold transition-colors"
                >
                  <Share2 size={20} />
                  <span>{copySuccess ? '已复制!' : '复制json链接'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {showFullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-full max-h-full p-4">
            <button
              onClick={() => setShowFullscreenImage(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
            >
              <X size={24} />
            </button>
            <img
              src={currentScript.imageUrl}
              alt={scriptMeta?.name || currentScript.title}
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={() => setShowFullscreenImage(false)}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
            <p className="text-lg font-semibold">{scriptMeta?.name || currentScript.title}</p>
            <p className="text-sm text-gray-300">点击图片或按钮关闭</p>
          </div>
        </div>
      )}

      {/* 复制成功提示 */}
      {copySuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>链接已复制到剪贴板</span>
        </div>
      )}
    </div>
  );
};

export default ScriptDetail;