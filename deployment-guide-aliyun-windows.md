# 剧本管理系统 - 阿里云Windows服务器部署手册

## 目录
1. [服务器准备](#服务器准备)
2. [环境安装](#环境安装)
3. [项目部署](#项目部署)
4. [服务配置](#服务配置)
5. [域名和SSL配置](#域名和ssl配置)
6. [监控和维护](#监控和维护)

## 服务器准备

### 1. 购买阿里云ECS实例
- **操作系统**: Windows Server 2019/2022
- **配置建议**: 
  - CPU: 2核心以上
  - 内存: 4GB以上
  - 硬盘: 40GB以上SSD
  - 带宽: 5Mbps以上

### 2. 安全组配置
在阿里云控制台配置安全组规则：
```
入方向规则：
- 端口 22 (SSH) - 源：0.0.0.0/0
- 端口 80 (HTTP) - 源：0.0.0.0/0  
- 端口 443 (HTTPS) - 源：0.0.0.0/0
- 端口 3389 (RDP) - 源：您的IP地址
- 端口 3001 (后端API) - 源：0.0.0.0/0
```

### 3. 连接服务器
使用远程桌面连接到Windows服务器：
- 地址：您的ECS公网IP
- 用户名：Administrator
- 密码：购买时设置的密码

## 环境安装

### 1. 安装Node.js
1. 访问 [Node.js官网](https://nodejs.org/)
2. 下载Windows版本的LTS版本（推荐18.x或20.x）
3. 运行安装程序，选择默认选项
4. 打开命令提示符，验证安装：
```cmd
node --version
npm --version
```

### 2. 安装Git
1. 访问 [Git官网](https://git-scm.com/download/win)
2. 下载Windows版本
3. 安装时选择默认选项
4. 验证安装：
```cmd
git --version
```

### 3. 安装PM2（进程管理器）
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

### 4. 安装IIS（可选，用于前端静态文件服务）
1. 打开"控制面板" → "程序" → "启用或关闭Windows功能"
2. 勾选"Internet Information Services"
3. 展开并勾选以下选项：
   - Web管理工具 → IIS管理控制台
   - 万维网服务 → 常见HTTP功能（全部）
   - 万维网服务 → 应用程序开发功能 → CGI

## 项目部署

### 1. 创建项目目录
```cmd
mkdir C:\www
cd C:\www
```

### 2. 克隆项目代码
```cmd
git clone <您的项目仓库地址> script-management
cd script-management
```

### 3. 安装依赖
```cmd
npm install
```

### 4. 创建生产环境配置

创建 `ecosystem.config.js` 文件：
```javascript
module.exports = {
  apps: [{
    name: 'script-management-backend',
    script: 'server.cjs',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};
```

### 5. 修改后端配置
编辑 `server.cjs`，修改CORS配置以支持生产环境：

```javascript
// 在CORS配置中添加您的域名
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://localhost:5173', 
    'http://127.0.0.1:5173', 
    'https://127.0.0.1:5173',
    'http://your-domain.com',  // 替换为您的域名
    'https://your-domain.com', // 替换为您的域名
    'http://your-server-ip',   // 替换为您的服务器IP
    'https://your-server-ip'   // 替换为您的服务器IP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
}));
```

### 6. 构建前端
```cmd
npm run build
```

### 7. 创建必要目录
```cmd
mkdir logs
mkdir uploads
mkdir uploads\images
mkdir uploads\json
mkdir data
```

## 服务配置

### 1. 启动后端服务
```cmd
pm2 start ecosystem.config.js
pm2 save
```

### 2. 配置IIS部署前端

#### 方法一：使用IIS部署静态文件
1. 打开IIS管理器
2. 右键"网站" → "添加网站"
3. 配置如下：
   - 网站名称：script-management-frontend
   - 物理路径：C:\www\script-management\dist
   - 端口：80（或其他端口）

4. 创建 `web.config` 文件在 `dist` 目录：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

#### 方法二：使用serve包部署
```cmd
npm install -g serve
pm2 start "serve -s dist -p 80" --name "frontend"
pm2 save
```

### 3. 配置防火墙
打开Windows防火墙，添加入站规则：
- 端口 80 (HTTP)
- 端口 443 (HTTPS)
- 端口 3001 (后端API)

### 4. 设置开机自启
```cmd
pm2 startup
pm2 save
```

## 域名和SSL配置

### 1. 域名解析
在您的域名服务商处添加A记录：
```
类型: A
主机记录: @ 或 www
记录值: 您的ECS公网IP
TTL: 600
```

### 2. 申请SSL证书

#### 使用阿里云免费SSL证书：
1. 登录阿里云控制台
2. 搜索"SSL证书"
3. 购买免费证书（每年20个）
4. 申请证书并完成域名验证
5. 下载IIS格式证书

#### 配置IIS SSL：
1. 将证书导入到服务器
2. 在IIS中绑定HTTPS，选择证书
3. 强制HTTPS重定向

### 3. 配置HTTPS重定向
在IIS中添加URL重写规则，将HTTP重定向到HTTPS。

## 监控和维护

### 1. 查看服务状态
```cmd
pm2 status
pm2 logs
pm2 monit
```

### 2. 重启服务
```cmd
pm2 restart all
```

### 3. 更新代码
```cmd
cd C:\www\script-management
git pull origin main
npm install
npm run build
pm2 restart all
```

### 4. 备份数据
创建定时任务备份 `data` 和 `uploads` 目录：
```cmd
# 创建备份脚本 backup.bat
xcopy "C:\www\script-management\data" "C:\backup\data_%date:~0,10%" /E /I /Y
xcopy "C:\www\script-management\uploads" "C:\backup\uploads_%date:~0,10%" /E /I /Y
```

### 5. 日志管理
定期清理日志文件：
```cmd
pm2 flush  # 清空日志
```

### 6. 性能监控
安装性能监控工具：
```cmd
npm install -g pm2-web
pm2-web --port 8080
```

## 常见问题解决

### 1. 端口被占用
```cmd
netstat -ano | findstr :3001
taskkill /PID <进程ID> /F
```

### 2. 权限问题
确保IIS应用程序池的身份有足够权限访问项目文件。

### 3. 文件上传问题
检查 `uploads` 目录权限，确保IIS用户有写入权限。

### 4. 数据库连接问题
检查防火墙设置和数据库连接字符串。

## 安全建议

1. **定期更新系统和软件**
2. **使用强密码**
3. **限制不必要的端口访问**
4. **定期备份数据**
5. **监控系统日志**
6. **使用HTTPS**
7. **定期更新SSL证书**

## 性能优化

1. **启用Gzip压缩**
2. **配置静态文件缓存**
3. **使用CDN加速**
4. **数据库优化**
5. **监控服务器资源使用情况**

---

## 快速部署脚本

创建 `deploy.bat` 自动化部署脚本：

```batch
@echo off
echo Starting deployment...

cd C:\www\script-management

echo Pulling latest code...
git pull origin main

echo Installing dependencies...
npm install

echo Building frontend...
npm run build

echo Restarting services...
pm2 restart all

echo Deployment completed!
pause
```

使用方法：双击运行 `deploy.bat` 即可自动更新部署。

---

**注意事项：**
- 请根据实际情况修改IP地址、域名等配置
- 建议在测试环境先验证部署流程
- 定期备份重要数据
- 监控服务器性能和日志