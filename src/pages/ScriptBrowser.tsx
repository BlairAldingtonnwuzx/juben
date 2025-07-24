import React, { useState, useEffect } from 'react';
import { Heart, Download, Eye, Calendar, User, Tag } from 'lucide-react';
import { Script } from '../types';
import { fetchScripts, fetchSystemConfig } from '../utils/api';

interface ScriptBrowserProps {
  onScriptSelect: (script: Script) => void;
}

const ScriptBrowser: React.FC<ScriptBrowserProps> = ({ onScriptSelect }) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const loadScripts = async () => {
      try {
        const [allScripts, config] = await Promise.all([
          fetchScripts(),
          fetchSystemConfig()
        ]);
        const approvedScripts = allScripts.filter((script: Script) => script.status === 'approved');
        setScripts(approvedScripts);
        setAvailableTags(config.availableTags || []);
      } catch (error) {
        console.error('加载剧本失败:', error);
        // 使用本地存储作为后备
        const stored = localStorage.getItem('scripts');
        if (stored) {
          const localScripts = JSON.parse(stored);
          const approvedScripts = localScripts.filter((script: Script) => script.status === 'approved');
          setScripts(approvedScripts);
        }
        // 设置默认标签作为后备
        setAvailableTags(['推理', '悬疑', '科幻', '恐怖', '冒险', '角色扮演', '团队合作', '简单', '中等难度', '高难度']);
      }
    };
    loadScripts();
  }, []);

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || script.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white dark:text-white text-gray-900 mb-4">剧本浏览</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索剧本..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 dark:bg-gray-800 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-700 dark:border-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-2 bg-gray-800 dark:bg-gray-800 bg-white text-white dark:text-white text-gray-900 rounded-lg border border-gray-700 dark:border-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">所有标签</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScripts.map((script) => (
          <div
            key={script.id}
            className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-transparent dark:border-transparent border-gray-200"
            onClick={() => onScriptSelect(script)}
          >
            <div className="relative">
              <img
                src={script.imageUrl}
                alt={script.title}
                className="w-full h-64 object-cover"
                style={{ minHeight: '256px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/1029807/pexels-photo-1029807.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                {script.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-2">{script.title}</h3>
              <p className="text-gray-400 dark:text-gray-400 text-gray-600 mb-4 line-clamp-2">{script.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500 text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <User size={14} />
                  <span>{script.uploaderName}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Tag size={14} />
                    <span>{script.version || 'v1.0'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{script.uploadDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1 text-red-400">
                    <Heart size={16} />
                    <span>{script.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-400">
                    <Download size={16} />
                    <span>{script.downloads}</span>
                  </div>
                </div>
                <button className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1">
                  <Eye size={16} />
                  <span>查看详情</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredScripts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-lg">没有找到匹配的剧本</p>
        </div>
      )}
    </div>
  );
};

export default ScriptBrowser;