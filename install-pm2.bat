@echo off
chcp 65001 >nul
echo ========================================
echo     安装PM2进程管理器 (推荐生产环境)
echo ========================================
echo.

echo [1/3] 安装PM2...
npm install -g pm2
if errorlevel 1 (
    echo ❌ PM2安装失败
    pause
    exit /b 1
)
echo [OK] PM2安装完成

echo [2/3] 配置PM2开机自启...
pm2 startup
echo [OK] PM2开机自启配置完成

echo [3/3] 创建PM2配置文件...
echo module.exports = { > ecosystem.config.js
echo   apps: [{ >> ecosystem.config.js
echo     name: 'script-management-backend', >> ecosystem.config.js
echo     script: 'server.cjs', >> ecosystem.config.js
echo     instances: 1, >> ecosystem.config.js
echo     exec_mode: 'fork', >> ecosystem.config.js
echo     env: { >> ecosystem.config.js
echo       NODE_ENV: 'production', >> ecosystem.config.js
echo       PORT: 3001 >> ecosystem.config.js
echo     }, >> ecosystem.config.js
echo     error_file: 'logs/err.log', >> ecosystem.config.js
echo     out_file: 'logs/out.log', >> ecosystem.config.js
echo     log_file: 'logs/combined.log', >> ecosystem.config.js
echo     time: true, >> ecosystem.config.js
echo     max_restarts: 10, >> ecosystem.config.js
echo     restart_delay: 4000 >> ecosystem.config.js
echo   }] >> ecosystem.config.js
echo }; >> ecosystem.config.js

echo [OK] PM2配置文件创建完成

echo.
echo ========================================
echo          PM2安装完成！
echo ========================================
echo.
echo 使用PM2管理服务:
echo   启动: pm2 start ecosystem.config.js
echo   停止: pm2 stop all
echo   重启: pm2 restart all
echo   状态: pm2 status
echo   日志: pm2 logs
echo   监控: pm2 monit
echo.
echo 保存PM2配置: pm2 save
echo.
pause