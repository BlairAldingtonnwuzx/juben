@echo off
chcp 65001 >nul
echo ========================================
echo    剧本管理系统 - 快速启动脚本
echo ========================================
echo.

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo 检测到首次运行，正在执行完整部署...
    call deploy.bat
    exit /b
)

echo [1/4] 创建必要目录...
if not exist "uploads" mkdir uploads
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\json" mkdir uploads\json
if not exist "data" mkdir data
if not exist "logs" mkdir logs
echo ✅ 目录检查完成

echo [2/4] 检查端口占用...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo ✅ 端口清理完成

echo [3/4] 启动后端服务...
start /min "剧本管理系统-后端" cmd /c "node server.cjs"
timeout /t 3 >nul
echo ✅ 后端服务启动完成

echo [4/4] 启动前端服务...
echo.
echo ========================================
echo           快速启动完成！
echo ========================================
echo.
echo 🌐 前端地址: http://localhost:5173
echo 🔧 后端API: http://localhost:3001
echo.
echo 🚀 正在打开浏览器...
timeout /t 2 >nul
start http://localhost:5173

npm run dev