import { Script, User } from '../types';
import { fetchScripts, fetchUsers } from './api';

// Mock data for demonstration
const defaultUsers: User[] = [
  {
    id: '1',
    name: '管理员',
    email: 'admin@example.com',
    role: 'admin',
    canUpload: true,
    skipReview: true,
    joinDate: '2024-01-01',
    uploadCount: 0,
    permissions: {
      canViewScripts: true,
      canDownloadScripts: true,
      canUploadScripts: true,
      canManageUsers: true,
      canManageTags: true,
      canApproveScripts: true,
      canDeleteScripts: true
    }
  },
  {
    id: '2',
    name: '普通用户',
    email: 'user@example.com',  
    role: 'user',
    canUpload: true,
    skipReview: false,
    joinDate: '2024-01-15',
    uploadCount: 3,
    permissions: {
      canViewScripts: true,
      canDownloadScripts: true,
      canUploadScripts: true,
      canManageUsers: false,
      canManageTags: false,
      canApproveScripts: false,
      canDeleteScripts: false
    }
  }
];

const defaultScripts: Script[] = [
  {
    id: '1',
    title: '神秘庄园',
    description: '一个充满悬疑和谜题的推理剧本，适合6-8人游戏',
    imageUrl: 'https://images.pexels.com/photos/1029807/pexels-photo-1029807.jpeg?auto=compress&cs=tinysrgb&w=800',
    jsonData: { chapters: 8, difficulty: 'medium', duration: '3-4小时' },
    uploaderId: '2',
    uploaderName: '普通用户',
    uploadDate: '2024-01-20',
    likes: 42,
    downloads: 156,
    status: 'approved',
    tags: ['推理', '悬疑', '中等难度'],
    version: 'v1.0',
    baseScriptId: '1'
  },
  {
    id: '2', 
    title: '星际逃亡',
    description: '科幻背景的角色扮演剧本，体验太空冒险',
    imageUrl: 'https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg?auto=compress&cs=tinysrgb&w=800',
    jsonData: { chapters: 6, difficulty: 'hard', duration: '4-5小时' },
    uploaderId: '2',
    uploaderName: '普通用户',
    uploadDate: '2024-01-18',
    likes: 38,
    downloads: 124,
    status: 'approved',
    tags: ['科幻', '冒险', '高难度'],
    version: 'v1.0',
    baseScriptId: '2'
  },
  {
    id: '3',
    title: '古堡秘密',
    description: '中世纪背景的恐怖剧本，挑战玩家的胆量',
    imageUrl: 'https://images.pexels.com/photos/161162/castle-germany-mansion-manor-161162.jpeg?auto=compress&cs=tinysrgb&w=800',
    jsonData: { chapters: 7, difficulty: 'easy', duration: '2-3小时' },
    uploaderId: '2',
    uploaderName: '普通用户',
    uploadDate: '2024-01-16',
    likes: 29,
    downloads: 98,
    status: 'pending',
    tags: ['恐怖', '中世纪', '简单'],
    version: 'v1.0',
    baseScriptId: '3'
  }
];

export const getUsers = async (): Promise<User[]> => {
  try {
    // 优先从服务器获取数据
    const serverUsers = await fetchUsers();
    if (serverUsers && serverUsers.length > 0) {
      return serverUsers;
    }
  } catch (error) {
    console.error('从服务器获取用户失败，使用本地数据:', error);
  }
  
  // 服务器获取失败时使用本地存储
  const stored = localStorage.getItem('users');
  return stored ? JSON.parse(stored) : defaultUsers;
};

export const setUsers = (users: User[]): void => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const getScripts = async (): Promise<Script[]> => {
  try {
    // 优先从服务器获取数据
    const serverScripts = await fetchScripts();
    if (serverScripts && serverScripts.length > 0) {
      return serverScripts;
    }
  } catch (error) {
    console.error('从服务器获取剧本失败，使用本地数据:', error);
  }
  
  // 服务器获取失败时使用本地存储
  const stored = localStorage.getItem('scripts');
  return stored ? JSON.parse(stored) : defaultScripts;
};

export const setScripts = (scripts: Script[]): void => {
  localStorage.setItem('scripts', JSON.stringify(scripts));
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

// Initialize default data if not exists
const initializeData = async () => {
  if (!localStorage.getItem('users')) {
    setUsers(defaultUsers);
  }
  if (!localStorage.getItem('scripts')) {
    setScripts(defaultScripts);
  }
};

initializeData();