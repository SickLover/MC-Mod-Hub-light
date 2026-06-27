@echo off
chcp 65001 >nul
title MC Mod Hub - Build Installer

echo ========================================
echo   MC Mod Hub - Build Installer
echo ========================================
echo.

cd /d D:\vibe-coding\projects\mc-mod-hub-light

:: Step 1: Bump version
echo [1/3] Bumping version (patch)...
call npm run version:patch
if %errorlevel% neq 0 (
    echo [ERROR] Version bump failed!
    pause
    exit /b 1
)
echo [OK] Version bumped
echo.

:: Step 2: Build release
echo [2/3] Building release package...
call npm run build:release
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Build succeeded
echo.

:: Step 3: Show output
echo [3/3] Build artifacts:
echo.
set MSI_DIR=D:\vibe-coding\projects\mc-mod-hub-light\src-tauri\target\release\bundle\msi
set NSIS_DIR=D:\vibe-coding\projects\mc-mod-hub-light\src-tauri\target\release\bundle\nsis

if exist "%MSI_DIR%" (
    echo [MSI] %MSI_DIR%
    dir /b "%MSI_DIR%\*.msi" 2>nul
) else (
    echo [WARN] MSI directory not found
)

if exist "%NSIS_DIR%" (
    echo [NSIS] %NSIS_DIR%
    dir /b "%NSIS_DIR%\*.exe" 2>nul
) else (
    echo [WARN] NSIS directory not found
)
echo.

:: Get new version
for /f "tokens=*" %%v in ('node -p "require('./package.json').version"') do set NEW_VER=%%v

echo ========================================
echo   [DONE] Version: %NEW_VER%
echo ========================================
echo.
echo Manual steps:
echo   1. git add .
echo   2. git commit -m "v%NEW_VER%: ..."
echo   3. git tag v%NEW_VER%
echo   4. git push origin master
echo   5. git push origin v%NEW_VER%
echo   6. Upload installer to GitHub Releases
echo.
pause
