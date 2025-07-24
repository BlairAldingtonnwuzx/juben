@echo off
chcp 65001 >nul
echo ========================================
echo    剧本管理系统 - 重启服务脚本
echo ========================================
echo.

echo 正在停止现有服务...
call stop.bat

echo.
echo 等待3秒后重新启动...
timeout /t 3 >nul

echo.
echo 正在重新启动服务...
call deploy.bat