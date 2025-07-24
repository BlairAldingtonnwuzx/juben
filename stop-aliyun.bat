@echo off
chcp 65001 >nul
echo ========================================
echo   剧本管理系统 - 阿里云服务停止脚本
echo ========================================
echo.

echo [1/4] 停止Node.js后端服务...
:: 查找并结束Node.js进程
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo table ^| findstr server.cjs') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: 结束占用3001端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo ✅ 后端服务已停止

echo [2/4] 停止前端服务...
:: 查找并结束前端相关进程
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo table ^| findstr vite') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo ✅ 前端服务已停止

echo [3/4] 清理临时文件...
if exist "*.log" del /q "*.log" >nul 2>&1
if exist "logs\*.log" del /q "logs\*.log" >nul 2>&1
echo ✅ 临时文件清理完成

echo [4/4] 显示服务状态...
netstat -ano | findstr :3001 >nul
if errorlevel 1 (
    echo ✅ 端口3001已释放
) else (
    echo ⚠️  端口3001仍被占用，可能需要手动处理
)

echo.
echo ========================================
echo         所有服务已停止
echo ========================================
echo.
echo 如需重新启动服务，请运行:
echo   - deploy-aliyun.bat (完整部署)
echo   - start-backend.bat (仅启动后端)
echo.
pause