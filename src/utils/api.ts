const API_BASE_URL = '/api';

// 添加请求配置
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  mode: 'cors' as RequestMode,
  credentials: 'include' as RequestCredentials,
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 获取所有剧本
export const fetchScripts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取剧本失败:', error);
    return [];
  }
};

// 获取所有用户
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取用户失败:', error);
    return [];
  }
};

// 上传剧本
export const uploadScript = async (formData: FormData): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts`, {
      method: 'POST',
      mode: 'cors' as RequestMode,
      credentials: 'include' as RequestCredentials,
      headers: {
        // 不要设置Content-Type，让浏览器自动设置multipart/form-data边界
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload response error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('上传剧本失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '网络错误' 
    };
  }
};

// 更新剧本状态
export const updateScript = async (id: string, updates: any): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('更新剧本失败:', error);
    return { success: false, error: '网络错误' };
  }
};

// 删除剧本
export const deleteScript = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('删除剧本失败:', error);
    return { success: false, error: '网络错误' };
  }
};

// 更新用户权限
export const updateUser = async (id: string, updates: any): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('更新用户失败:', error);
    return { success: false, error: '网络错误' };
  }
};

// 删除用户
export const deleteUser = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('删除用户失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '网络错误' };
  }
};

// 用户登录
export const loginUser = async (email: string, password: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('登录失败:', error);
    return { success: false, error: '网络错误' };
  }
};

// 下载剧本JSON
export const downloadScript = async (id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/scripts/${id}/download`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const downloadBlob = new Blob([blob], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `script_${id}.json`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename[^;=\n]*=((['"]).*?\3|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]) || (filenameMatch[2] && filenameMatch[2].replace(/['"]/g, ''));
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || error.message || '下载失败' };
    }
  } catch (error) {
    console.error('下载失败:', error);
    return { success: false, error: '网络错误' };
  }
};

// 获取系统配置
export const fetchSystemConfig = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return { 
      availableTags: ['推理', '悬疑', '科幻', '恐怖', '冒险', '角色扮演', '团队合作', '简单', '中等难度', '高难度'],
      systemSettings: {
        allowUserRegistration: true,
        requireScriptApproval: true,
        maxUploadSizeKB: 10240,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/json'],
        maxUploadsPerDay: 10,
        maxScriptsPerUser: 50
      }
    };
  }
};

// 更新系统配置
export const updateSystemConfig = async (config: any): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'PUT',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Config update response error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '网络错误' };
  }
};