@echo off
chcp 65001 >nul
echo ========================================
echo       剧本管理系统 - 数据备份脚本
echo ========================================
echo.

:: 创建备份目录
set BACKUP_DATE=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DATE=%BACKUP_DATE: =0%
set BACKUP_DIR=backup\backup_%BACKUP_DATE%

echo [1/4] 创建备份目录...
if not exist "backup" mkdir backup
mkdir "%BACKUP_DIR%"
echo ✅ 备份目录: %BACKUP_DIR%

echo [2/4] 备份数据文件...
if exist "data" (
    xcopy "data" "%BACKUP_DIR%\data" /E /I /Y >nul
    echo ✅ 数据文件备份完成
) else (
    echo ⚠️  数据目录不存在
)

echo [3/4] 备份上传文件...
if exist "uploads" (
    xcopy "uploads" "%BACKUP_DIR%\uploads" /E /I /Y >nul
    echo ✅ 上传文件备份完成
) else (
    echo ⚠️  上传目录不存在
)

echo [4/4] 备份配置文件...
if exist "package.json" copy "package.json" "%BACKUP_DIR%\" >nul
if exist "server.cjs" copy "server.cjs" "%BACKUP_DIR%\" >nul
if exist "ecosystem.config.js" copy "ecosystem.config.js" "%BACKUP_DIR%\" >nul
echo ✅ 配置文件备份完成

:: 创建备份信息文件
echo 备份时间: %date% %time% > "%BACKUP_DIR%\backup_info.txt"
echo 服务器: %COMPUTERNAME% >> "%BACKUP_DIR%\backup_info.txt"
echo 用户: %USERNAME% >> "%BACKUP_DIR%\backup_info.txt"

echo.
echo ========================================
echo          备份完成！
echo ========================================
echo.
echo 备份位置: %CD%\%BACKUP_DIR%
echo.
echo 建议定期备份以下内容:
echo   - data目录 (用户数据和剧本信息)
echo   - uploads目录 (上传的文件)
echo   - 配置文件
echo.
pause