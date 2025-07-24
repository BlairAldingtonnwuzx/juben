# 剧本管理系统部署指南

## 当前部署状态
- ✅ 前端已发布到 Netlify: https://harmonious-truffle-09ea7b.netlify.app
- ❌ 后端需要单独部署

## 后端部署选项

### 1. 使用 Railway (推荐)
```bash
# 1. 注册 Railway 账号: https://railway.app
# 2. 安装 Railway CLI
npm install -g @railway/cli

# 3. 登录并部署
railway login
railway init
railway up
```

### 2. 使用 Render
```bash
# 1. 注册 Render 账号: https://render.com
# 2. 连接 GitHub 仓库
# 3. 选择 "Web Service"
# 4. 设置构建命令: npm install
# 5. 设置启动命令: npm run start-backend
```

### 3. 使用 Heroku
```bash
# 1. 安装 Heroku CLI
# 2. 登录并创建应用
heroku login
heroku create your-app-name

# 3. 部署
git add .
git commit -m "Deploy backend"
git push heroku main
```

### 4. 使用 Vercel (Serverless)
需要将 Express 应用转换为 Serverless 函数。

## 前端配置更新

部署后端后，需要更新前端的 API 地址：

1. 在 `src/utils/api.ts` 中更新 `API_BASE_URL`
2. 将 `'/api'` 改为您的后端部署地址，如：
   ```typescript
   const API_BASE_URL = 'https://your-backend-url.railway.app/api';
   ```

## 环境变量设置

后端部署时需要设置以下环境变量：
- `PORT`: 服务器端口（通常由平台自动设置）
- `NODE_ENV`: production

## 文件上传注意事项

由于使用了本地文件存储，建议：
1. 使用云存储服务（如 AWS S3、Cloudinary）
2. 或者使用支持持久化存储的部署平台

## 数据库

当前使用 JSON 文件存储，生产环境建议：
1. 使用 MongoDB Atlas（免费层）
2. 或者 PostgreSQL（Railway、Render 都提供）