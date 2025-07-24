import React, { useState, useEffect } from 'react';
import { Trophy, Heart, Download, Medal, Award, Star } from 'lucide-react';
import { Script } from '../types';
import { fetchScripts } from '../utils/api';

interface RankingProps {
  onScriptSelect: (script: Script) => void;
}

const Ranking: React.FC<RankingProps> = ({ onScriptSelect }) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [sortBy, setSortBy] = useState<'likes' | 'downloads'>('downloads');

  useEffect(() => {
    const loadScripts = async () => {
      try {
        const allScripts = await fetchScripts();
        const approvedScripts = allScripts.filter((script: Script) => script.status === 'approved');
        setScripts(approvedScripts);
      } catch (error) {
        console.error('加载剧本失败:', error);
      }
    };
    loadScripts();
  }, []);

  const sortedScripts = [...scripts].sort((a, b) => b[sortBy] - a[sortBy]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="text-yellow-400" size={24} />;
      case 1: return <Medal className="text-gray-400" size={24} />;
      case 2: return <Award className="text-orange-400" size={24} />;
      default: return <Star className="text-blue-400" size={20} />;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/30';
      case 1: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 2: return 'bg-gradient-to-r from-orange-400/20 to-orange-500/20 border-orange-400/30';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white dark:text-white text-gray-900 mb-4">排行榜</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setSortBy('downloads')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'downloads'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 dark:bg-gray-700 bg-gray-200 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-300'
            }`}
          >
            下载量排行
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'likes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 dark:bg-gray-700 bg-gray-200 text-gray-300 dark:text-gray-300 text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 hover:bg-gray-300'
            }`}
          >
            点赞量排行
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedScripts.map((script, index) => (
          <div
            key={script.id}
            className={`border rounded-lg p-6 transition-all duration-300 hover:shadow-lg cursor-pointer ${getRankBg(index)}`}
            onClick={() => onScriptSelect(script)}
          >
            <div className="flex items-center space-x-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full">
                {getRankIcon(index)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white dark:text-white text-gray-900 mb-2">{script.title}</h3>
                    <p className="text-gray-300 dark:text-gray-300 text-gray-600 mb-3 line-clamp-2">{script.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {script.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <img
                    src={script.imageUrl}
                    alt={script.title}
                    className="w-24 h-24 object-cover rounded-lg ml-4"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-gray-400 dark:text-gray-400 text-gray-500 text-sm">
                    上传者：{script.uploaderName} · {script.uploadDate}
                  </div>
                  
                  <div className="flex space-x-6">
                    <div className="flex items-center space-x-2">
                      <Heart className="text-red-400" size={18} />
                      <span className="text-white dark:text-white text-gray-900 font-semibold">{script.likes}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Download className="text-green-400" size={18} />
                      <span className="text-white dark:text-white text-gray-900 font-semibold">{script.downloads}</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedScripts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-400 text-gray-500 text-lg">暂无剧本数据</p>
        </div>
      )}
    </div>
  );
};

export default Ranking;