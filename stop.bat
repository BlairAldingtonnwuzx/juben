@echo off
chcp 65001 >nul
echo ========================================
echo    剧本管理系统 - 停止服务脚本
echo ========================================
echo.

echo [1/3] 停止前端服务...
:: 查找并结束Vite开发服务器进程
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo table ^| findstr vite') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo ✅ 前端服务已停止

echo [2/3] 停止后端服务...
:: 查找并结束占用3001端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo ✅ 后端服务已停止

echo [3/3] 清理临时文件...
:: 清理可能的临时文件
if exist "*.log" del /q "*.log" >nul 2>&1
echo ✅ 清理完成

echo.
echo ========================================
echo         所有服务已停止
echo ========================================
echo.
echo 如需重新启动，请运行 deploy.bat
echo.
pause