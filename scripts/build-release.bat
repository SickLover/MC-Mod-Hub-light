@echo off
chcp 65001 >nul
title MC Mod Hub - 构建安装包

echo ========================================
echo   MC Mod Hub - 一键构建安装包
echo ========================================
echo.

:: 进入项目目录
cd /d D:\vibe-coding\projects\mc-mod-hub-light

:: 第1步：升级版本号
echo [1/3] 升级版本号（patch）
call npm run version:patch
if %errorlevel% neq 0 (
    echo ❌ 版本号升级失败！
    pause
    exit /b 1
)
echo ✅ 版本号升级完成
echo.

:: 第2步：构建安装包
echo [2/3] 构建安装包...
call npm run build:release
if %errorlevel% neq 0 (
    echo ❌ 构建失败！
    pause
    exit /b 1
)
echo ✅ 构建成功
echo.

:: 第3步：显示产物路径
echo [3/3] 构建产物如下：
echo.
set MSI_DIR=D:\vibe-coding\projects\mc-mod-hub-light\src-tauri\target\release\bundle\msi
set NSIS_DIR=D:\vibe-coding\projects\mc-mod-hub-light\src-tauri\target\release\bundle\nsis

dir /b "%MSI_DIR%\*.msi" 2>nul && echo 📦 MSI: %MSI_DIR% 或 echo ⚠️ MSI 未找到
dir /b "%NSIS_DIR%\*.exe" 2>nul && echo 📦 EXE: %NSIS_DIR% 或 echo ⚠️ EXE 未找到
echo.

:: 获取新版本号
for /f "tokens=*" %%v in ('node -p "require('./package.json').version"') do set NEW_VER=%%v

echo ========================================
echo   🎉 构建完成！版本号: %NEW_VER%
echo ========================================
echo.
echo 后续手动操作：
echo   1. git add .
echo   2. git commit -m "v%NEW_VER%: xxx"
echo   3. git tag v%NEW_VER%
echo   4. git push origin master
echo   5. git push origin v%NEW_VER%
echo   6. 去 GitHub Releases 上传安装包
echo.
pause
