@echo off
chcp 65001 >nul
echo ========================================
echo   剧本管理系统 - 阿里云服务重启脚本
echo ========================================
echo.

echo 正在停止现有服务...
call stop-aliyun.bat

echo.
echo 等待5秒后重新启动...
timeout /t 5 >nul

echo.
echo 正在重新启动服务...
call deploy-aliyun.bat