@echo off
chcp 65001 >nul
echo ========================================
echo    剧本管理系统 - 一键部署脚本
echo ========================================
echo.

:: 检查Node.js是否安装
echo [1/8] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js环境检查通过

:: 检查npm是否可用
echo [2/8] 检查npm包管理器...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: npm不可用
    pause
    exit /b 1
)
echo ✅ npm包管理器检查通过

:: 安装依赖
echo [3/8] 安装项目依赖...
echo 正在安装依赖包，请稍候...
npm install
if errorlevel 1 (
    echo ❌ 错误: 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

:: 创建必要目录
echo [4/8] 创建必要目录...
if not exist "uploads" mkdir uploads
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\json" mkdir uploads\json
if not exist "data" mkdir data
if not exist "logs" mkdir logs
echo ✅ 目录创建完成

:: 构建前端
echo [5/8] 构建前端项目...
echo 正在构建前端，请稍候...
npm run build
if errorlevel 1 (
    echo ❌ 错误: 前端构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建完成

:: 检查端口占用
echo [6/8] 检查端口占用情况...
netstat -ano | findstr :3001 >nul
if not errorlevel 1 (
    echo ⚠️  警告: 端口3001已被占用
    echo 正在尝试结束占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)
echo ✅ 端口检查完成

:: 启动后端服务
echo [7/8] 启动后端服务...
echo 正在启动后端服务器...
start /min "剧本管理系统-后端" cmd /c "node server.cjs"
timeout /t 3 >nul

:: 检查后端是否启动成功
echo 检查后端服务状态...
curl -s http://localhost:3001 >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 后端服务启动失败
    echo 请检查端口3001是否被占用或查看错误日志
    pause
    exit /b 1
)
echo ✅ 后端服务启动成功

:: 启动前端开发服务器
echo [8/8] 启动前端服务...
echo 正在启动前端开发服务器...
echo.
echo ========================================
echo           部署完成！
echo ========================================
echo.
echo 🌐 前端地址: http://localhost:5173
echo 🔧 后端API: http://localhost:3001
echo.
echo 📝 默认管理员账号:
echo    邮箱: admin@mm.com
echo    (首次登录时系统会自动创建)
echo.
echo 💡 提示:
echo    - 前端服务将在新窗口中启动
echo    - 后端服务已在后台运行
echo    - 按 Ctrl+C 可停止前端服务
echo    - 关闭此窗口不会影响后端服务
echo.
echo 🚀 正在打开浏览器...
echo ========================================

:: 等待2秒后打开浏览器
timeout /t 2 >nul
start http://localhost:5173

:: 启动前端开发服务器
npm run dev

echo.
echo 部署脚本执行完毕
pause