@echo off
chcp 65001 >nul
echo ========================================
echo   剧本管理系统 - 阿里云Windows部署脚本
echo ========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if errorlevel 1 (
    echo ⚠️  建议以管理员身份运行此脚本以获得最佳体验
    echo 继续执行中...
    echo.
)

:: 显示服务器信息
echo [系统信息]
echo 服务器: %COMPUTERNAME%
echo 用户: %USERNAME%
echo 时间: %DATE% %TIME%
echo.

:: 检查Node.js环境
echo [1/10] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未检测到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    echo 建议版本: 18.x 或更高
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js版本: %NODE_VERSION%

:: 检查npm
echo [2/10] 检查npm包管理器...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: npm不可用
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm版本: %NPM_VERSION%

:: 检查防火墙端口
echo [3/10] 检查防火墙设置...
netsh advfirewall firewall show rule name="Node.js Server Port 3001" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  正在添加防火墙规则...
    netsh advfirewall firewall add rule name="Node.js Server Port 3001" dir=in action=allow protocol=TCP localport=3001 >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  无法自动添加防火墙规则，请手动开放端口3001
    ) else (
        echo [OK] 已添加防火墙规则（端口3001）
    )
) else (
    echo [OK] 防火墙规则已存在
)

:: 检查端口占用
echo [4/10] 检查端口占用情况...
netstat -ano | findstr :3001 >nul
if not errorlevel 1 (
    echo ⚠️  端口3001已被占用，正在尝试释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
    echo [OK] 端口清理完成
) else (
    echo [OK] 端口3001可用
)

:: 安装依赖
echo [5/10] 安装项目依赖...
echo 正在安装依赖包，请稍候...
npm install --production=false
if errorlevel 1 (
    echo ❌ 依赖安装失败，尝试清理缓存后重试...
    npm cache clean --force
    rmdir /s /q node_modules 2>nul
    npm install --production=false
    if errorlevel 1 (
        echo ❌ 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)
echo [OK] 依赖安装完成

:: 创建目录结构
echo [6/10] 创建目录结构...
if not exist "uploads" mkdir uploads
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\json" mkdir uploads\json
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "backup" mkdir backup

:: 设置目录权限（如果有管理员权限）
icacls uploads /grant Everyone:F >nul 2>&1
icacls data /grant Everyone:F >nul 2>&1
icacls logs /grant Everyone:F >nul 2>&1

echo [OK] 目录结构创建完成

:: 构建前端
echo [7/10] 构建前端项目...
echo 正在构建前端，请稍候...
npm run build
if errorlevel 1 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)
echo [OK] 前端构建完成

:: 创建服务启动脚本
echo [8/10] 创建服务管理脚本...
echo @echo off > start-backend.bat
echo title 剧本管理系统-后端服务 >> start-backend.bat
echo echo 后端服务启动中... >> start-backend.bat
echo node server.cjs >> start-backend.bat

echo @echo off > start-frontend.bat
echo title 剧本管理系统-前端服务 >> start-frontend.bat
echo echo 前端服务启动中... >> start-frontend.bat
echo npm run preview >> start-frontend.bat

echo [OK] 服务脚本创建完成

:: 启动后端服务
echo [9/10] 启动后端服务...
start /min "剧本管理系统-后端" cmd /c start-backend.bat
timeout /t 5 >nul

:: 检查后端服务状态
echo 检查后端服务状态...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001' -TimeoutSec 5 -UseBasicParsing | Out-Null; Write-Host '[OK] 后端服务启动成功' } catch { Write-Host '⚠️  后端服务可能需要更多时间启动，请稍后检查' }" 2>nul
if errorlevel 1 (
    echo [INFO] 使用备用检查方法...
    timeout /t 2 >nul
    netstat -ano | findstr :3001 >nul
    if not errorlevel 1 (
        echo [OK] 后端服务端口已监听
    ) else (
        echo [WARN] 后端服务可能需要更多时间启动
    )
)

:: 获取服务器IP
echo [10/10] 获取访问地址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set SERVER_IP=%%a
    goto :found_ip
)
:found_ip
set SERVER_IP=%SERVER_IP: =%

echo.
echo ========================================
echo           部署完成！
echo ========================================
echo.
echo 🌐 访问地址:
echo    本地访问: http://localhost:3001
if defined SERVER_IP (
    echo    内网访问: http://%SERVER_IP%:3001
)
echo    外网访问: http://您的公网IP:3001
echo.
echo 🔧 后端API: 
echo    本地: http://localhost:3001/api
if defined SERVER_IP (
    echo    内网: http://%SERVER_IP%:3001/api
)
echo.
echo 📝 默认管理员账号:
echo    邮箱: admin@mm.com
echo    (首次登录时系统会自动创建)
echo.
echo 💡 重要提示:
echo    1. 请在阿里云控制台安全组中开放端口3001
echo    2. 如需域名访问，请配置域名解析
echo    3. 建议配置SSL证书启用HTTPS
echo    4. 定期备份data和uploads目录
echo.
echo 📁 重要目录:
echo    数据目录: %CD%\data
echo    上传目录: %CD%\uploads
echo    日志目录: %CD%\logs
echo    备份目录: %CD%\backup
echo.
echo 🔄 服务管理:
echo    启动后端: start-backend.bat
echo    停止服务: stop.bat
echo    重启服务: restart.bat
echo.
echo ========================================

:: 创建桌面快捷方式（如果可能）
if exist "%USERPROFILE%\Desktop" (
    echo 正在创建桌面快捷方式...
    echo [InternetShortcut] > "%USERPROFILE%\Desktop\剧本管理系统.url"
    echo URL=http://localhost:3001 >> "%USERPROFILE%\Desktop\剧本管理系统.url"
    echo IconFile=%SystemRoot%\System32\SHELL32.dll >> "%USERPROFILE%\Desktop\剧本管理系统.url"
    echo IconIndex=13 >> "%USERPROFILE%\Desktop\剧本管理系统.url"
    echo [OK] 桌面快捷方式已创建
)

echo.
echo 部署脚本执行完毕！
echo 按任意键退出...
pause >nul