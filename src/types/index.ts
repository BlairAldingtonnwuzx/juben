export interface Script {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  jsonData: any;
  uploaderId: string;
  uploaderName: string;
  uploadDate: string;
  likes: number;
  downloads: number;
  status: 'pending' | 'approved' | 'rejected';
  tags: string[];
  version: string;
  baseScriptId?: string; // 用于关联同一剧本的不同版本
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  canUpload: boolean;
  skipReview: boolean;
  joinDate: string;
  uploadCount: number;
  permissions: UserPermissions;
}

export interface UserPermissions {
  canViewScripts: boolean;
  canDownloadScripts: boolean;
  canUploadScripts: boolean;
  canManageUsers: boolean;
  canManageTags: boolean;
  canApproveScripts: boolean;
  canDeleteScripts: boolean;
}

export interface SystemConfig {
  availableTags: string[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}