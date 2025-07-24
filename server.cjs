const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 启用CORS - 必须在其他中间件之前
app.use(cors({
  origin: ['http://localhost:5173', 'https://localhost:5173', 'http://127.0.0.1:5173', 'https://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());

// 确保必要的目录存在
const uploadsDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const jsonDir = path.join(uploadsDir, 'json');
const dataDir = path.join(__dirname, 'data');

[uploadsDir, imagesDir, jsonDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'image') {
      cb(null, imagesDir);
    } else if (file.fieldname === 'json') {
      cb(null, jsonDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'image' ? 'script-img-' : 'script-json-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'image') {
      // 只允许图片文件
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('只允许上传图片文件'));
      }
    } else if (file.fieldname === 'json') {
      // 只允许JSON文件
      if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        cb(null, true);
      } else {
        cb(new Error('只允许上传JSON文件'));
      }
    } else {
      cb(null, true);
    }
  }
});

// 数据文件路径
const scriptsDataFile = path.join(dataDir, 'scripts.json');
const usersDataFile = path.join(dataDir, 'users.json');
const configDataFile = path.join(dataDir, 'config.json');

// 初始化数据文件
const initDataFiles = () => {
  // 初始化用户数据
  const defaultUsers = [
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

  // 初始化剧本数据
  const defaultScripts = [
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

  // 初始化系统配置
  const defaultConfig = {
    availableTags: ['推理', '悬疑', '科幻', '恐怖', '冒险', '角色扮演', '团队合作', '简单', '中等难度', '高难度'],
    systemSettings: {
      allowUserRegistration: true,
      requireScriptApproval: true,
      maxUploadSizeKB: 10240,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/json'],
      maxUploadsPerDay: 10,
      maxScriptsPerUser: 50,
      requireEmailVerification: false,
      autoApproveNewUsers: true
    }
  };

  if (!fs.existsSync(usersDataFile)) {
    fs.writeFileSync(usersDataFile, JSON.stringify(defaultUsers, null, 2));
  }
  
  if (!fs.existsSync(scriptsDataFile)) {
    fs.writeFileSync(scriptsDataFile, JSON.stringify(defaultScripts, null, 2));
  }
  
  if (!fs.existsSync(configDataFile)) {
    fs.writeFileSync(configDataFile, JSON.stringify(defaultConfig, null, 2));
  }
};

// 读取数据
const readScripts = () => {
  try {
    const data = fs.readFileSync(scriptsDataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取剧本数据失败:', error);
    return [];
  }
};

const readUsers = () => {
  try {
    const data = fs.readFileSync(usersDataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取用户数据失败:', error);
    return [];
  }
};

const readConfig = () => {
  try {
    const data = fs.readFileSync(configDataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取配置数据失败:', error);
    return { availableTags: [] };
  }
};

// 写入数据
const writeScripts = (scripts) => {
  try {
    fs.writeFileSync(scriptsDataFile, JSON.stringify(scripts, null, 2));
    return true;
  } catch (error) {
    console.error('写入剧本数据失败:', error);
    return false;
  }
};

const writeUsers = (users) => {
  try {
    fs.writeFileSync(usersDataFile, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('写入用户数据失败:', error);
    return false;
  }
};

const writeConfig = (config) => {
  try {
    fs.writeFileSync(configDataFile, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('写入配置数据失败:', error);
    return false;
  }
};

// API路由

// 获取所有剧本
app.get('/api/scripts', (req, res) => {
  const scripts = readScripts();
  res.json(scripts);
});

// 获取所有用户
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// 上传剧本
app.post('/api/scripts', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'json', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, description, tags, uploaderName, version, baseScriptId, uploaderId } = req.body;
    
    if (!title || !description || !version) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    if (!req.files || !req.files.image || !req.files.json) {
      return res.status(400).json({ error: '请上传图片和JSON文件' });
    }

    // 读取并验证JSON文件
    const jsonFile = req.files.json[0];
    let jsonData;
    try {
      const jsonContent = fs.readFileSync(jsonFile.path, 'utf8');
      jsonData = JSON.parse(jsonContent);
    } catch (error) {
      // 删除已上传的文件
      if (req.files.image) fs.unlinkSync(req.files.image[0].path);
      fs.unlinkSync(jsonFile.path);
      return res.status(400).json({ error: 'JSON文件格式错误' });
    }

    const imageFile = req.files.image[0];
    const imageUrl = `http://localhost:${PORT}/uploads/images/${imageFile.filename}`;
    const jsonUrl = `http://localhost:${PORT}/uploads/json/${jsonFile.filename}`;

    const scripts = readScripts();
    const users = readUsers();
    
    // 查找用户信息
    const user = users.find(u => u.id === uploaderId);
    const config = readConfig();
    const settings = config.systemSettings || {};
    
    const finalBaseScriptId = baseScriptId || Date.now().toString();
    const newScript = {
      id: Date.now().toString(),
      title,
      description,
      imageUrl,
      jsonUrl,
      jsonData,
      uploaderId: uploaderId || 'anonymous',
      uploaderName: user?.name || uploaderName || '匿名用户',
      uploadDate: new Date().toISOString().split('T')[0],
      likes: 0,
      downloads: 0,
      status: (user?.skipReview || !settings.requireScriptApproval) ? 'approved' : 'pending',
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      version: version.trim(),
      baseScriptId: finalBaseScriptId
    };

    scripts.push(newScript);
    
    if (writeScripts(scripts)) {
      // 更新用户上传计数
      if (user) {
        user.uploadCount = (user.uploadCount || 0) + 1;
        writeUsers(users);
      }
      
      res.json({ 
        success: true, 
        script: newScript,
        message: (user?.skipReview || !settings.requireScriptApproval) ? '剧本上传成功并已发布' : '剧本上传成功，等待审核'
      });
    } else {
      res.status(500).json({ error: '保存剧本数据失败' });
    }
  } catch (error) {
    console.error('上传剧本失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新剧本状态
app.put('/api/scripts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, likes, downloads } = req.body;
    
    const scripts = readScripts();
    const scriptIndex = scripts.findIndex(s => s.id === id);
    
    if (scriptIndex === -1) {
      return res.status(404).json({ error: '剧本不存在' });
    }
    
    if (status !== undefined) {
      scripts[scriptIndex].status = status;
    }
    if (likes !== undefined) {
      scripts[scriptIndex].likes = likes;
    }
    if (downloads !== undefined) {
      scripts[scriptIndex].downloads = downloads;
    }
    
    if (writeScripts(scripts)) {
      res.json({ success: true, script: scripts[scriptIndex] });
    } else {
      res.status(500).json({ error: '更新剧本失败' });
    }
  } catch (error) {
    console.error('更新剧本失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除剧本
app.delete('/api/scripts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const scripts = readScripts();
    const scriptIndex = scripts.findIndex(s => s.id === id);
    
    if (scriptIndex === -1) {
      return res.status(404).json({ error: '剧本不存在' });
    }
    
    const script = scripts[scriptIndex];
    
    // 删除关联的文件
    if (script.imageUrl && script.imageUrl.includes('localhost')) {
      const imagePath = script.imageUrl.replace(`http://localhost:${PORT}`, '.');
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (script.jsonUrl && script.jsonUrl.includes('localhost')) {
      const jsonPath = script.jsonUrl.replace(`http://localhost:${PORT}`, '.');
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath);
      }
    }
    
    scripts.splice(scriptIndex, 1);
    
    if (writeScripts(scripts)) {
      res.json({ success: true, message: '剧本删除成功' });
    } else {
      res.status(500).json({ error: '删除剧本失败' });
    }
  } catch (error) {
    console.error('删除剧本失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户权限
app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const users = readUsers();
    
    if (id === 'new') {
      // 添加新用户
      const newUser = {
        id: Date.now().toString(),
        ...updates,
        joinDate: new Date().toISOString().split('T')[0],
        uploadCount: 0
      };
      users.push(newUser);
      
      if (writeUsers(users)) {
        res.json({ success: true, user: newUser });
      } else {
        res.status(500).json({ error: '添加用户失败' });
      }
    } else {
      // 更新现有用户
      const userIndex = users.findIndex(u => u.id === id);
      
      if (userIndex === -1) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      // 更新用户信息
      users[userIndex] = { ...users[userIndex], ...updates };
      
      if (writeUsers(users)) {
        res.json({ success: true, user: users[userIndex] });
      } else {
        res.status(500).json({ error: '更新用户失败' });
      }
    }
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除用户
app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    users.splice(userIndex, 1);
    
    if (writeUsers(users)) {
      res.json({ success: true, message: '用户删除成功' });
    } else {
      res.status(500).json({ error: '删除用户失败' });
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登录
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: '用户不存在' });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 下载JSON文件
app.get('/api/scripts/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const scripts = readScripts();
    const script = scripts.find(s => s.id === id);
    
    if (!script) {
      return res.status(404).json({ error: '剧本不存在' });
    }
    
    // 检查原始JSON文件是否存在
    if (!script.jsonUrl) {
      return res.status(400).json({ error: 'JSON文件不存在' });
    }
    
    // 获取原始JSON文件路径 - 使用更健壮的方法
    let jsonPath;
    try {
      const url = new URL(script.jsonUrl);
      jsonPath = path.join(__dirname, url.pathname);
    } catch (urlError) {
      // 如果URL解析失败，尝试作为相对路径处理
      jsonPath = path.join(__dirname, script.jsonUrl.replace(/^https?:\/\/[^\/]+/, ''));
    }
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'JSON文件未找到' });
    }
    
    // 增加下载计数
    script.downloads = (script.downloads || 0) + 1;
    writeScripts(scripts);
    
    // 设置下载头部
    const filename = `${script.title.replace(/[^\w\s-]/g, '').trim() || 'script'}_${script.version || 'v1.0'}.json`;
    const encodedFilename = encodeURIComponent(filename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', 'application/json');
    
    // 直接发送原始JSON文件
    res.sendFile(path.resolve(jsonPath));
  } catch (error) {
    console.error('下载失败:', error);
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取系统配置
app.get('/api/config', (req, res) => {
  const config = readConfig();
  res.json(config);
});

// 更新系统配置
app.put('/api/config', (req, res) => {
  try {
    const config = req.body;
    
    if (writeConfig(config)) {
      res.json({ success: true, config });
    } else {
      res.status(500).json({ error: '更新配置失败' });
    }
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    message: '剧本管理系统API服务器',
    version: '1.0.0',
    endpoints: {
      scripts: '/api/scripts',
      users: '/api/users',
      login: '/api/login',
      config: '/api/config'
    }
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制（最大10MB）' });
    }
  }
  res.status(500).json({ error: error.message || '服务器内部错误' });
});

// 初始化数据
initDataFiles();

// 启动服务器
app.listen(PORT, () => {
  console.log(`HTTP服务器运行在 http://localhost:${PORT}`);
  console.log(`上传目录: ${uploadsDir}`);
  console.log(`数据目录: ${dataDir}`);
});