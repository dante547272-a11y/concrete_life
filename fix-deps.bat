@echo off
REM 依赖修复脚本 - Windows
REM Dependency Fix Script

setlocal enabledelayedexpansion

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

echo.
echo ========================================
echo   依赖冲突修复脚本
echo ========================================
echo.

REM 修复后端依赖
if exist "concrete-plant-api" (
    cd concrete-plant-api
    
    echo %BLUE%[INFO]%NC% 备份 package.json...
    if exist "package.json" copy package.json package.json.backup >nul
    
    echo.
    echo 请选择修复方案:
    echo 1^) 安装缺失的依赖（快速）
    echo 2^) 更新 package.json 并重新安装（推荐）
    echo 3^) 完全重新安装所有依赖
    echo 4^) 取消
    echo.
    set /p "choice=请输入选项 (1-4): "
    
    if "!choice!"=="1" (
        echo %BLUE%[INFO]%NC% 安装缺失的依赖...
        call npm install @nestjs/platform-socket.io@^10.0.0 @nestjs/schedule@^4.0.0 @nestjs/websockets@^10.0.0 @types/passport-jwt@^3.0.8 @types/passport-local@^1.0.35 passport-local@^1.0.0 socket.io@^4.6.0
        echo %GREEN%[SUCCESS]%NC% 缺失依赖已安装
    ) else if "!choice!"=="2" (
        echo %BLUE%[INFO]%NC% 更新 package.json...
        if exist "..\package.json.fixed" copy ..\package.json.fixed package.json >nul
        
        echo %BLUE%[INFO]%NC% 删除旧的依赖...
        if exist "node_modules" rmdir /s /q node_modules
        if exist "package-lock.json" del package-lock.json
        
        echo %BLUE%[INFO]%NC% 重新安装依赖...
        call npm install
        echo %GREEN%[SUCCESS]%NC% 依赖重新安装完成
    ) else if "!choice!"=="3" (
        echo %BLUE%[INFO]%NC% 删除所有依赖...
        if exist "node_modules" rmdir /s /q node_modules
        if exist "package-lock.json" del package-lock.json
        
        echo %BLUE%[INFO]%NC% 重新安装依赖...
        call npm install
        echo %GREEN%[SUCCESS]%NC% 依赖重新安装完成
    ) else (
        echo %YELLOW%[WARNING]%NC% 取消修复
    )
    
    cd ..
) else (
    echo %RED%[ERROR]%NC% 未找到后端目录
)

REM 检查前端依赖
if exist "concrete-plant-web" (
    echo.
    echo %BLUE%[INFO]%NC% 检查前端依赖...
    cd concrete-plant-web
    
    call npm ls >nul 2>nul
    if %errorlevel% equ 0 (
        echo %GREEN%[SUCCESS]%NC% 前端依赖正常
    ) else (
        echo %YELLOW%[WARNING]%NC% 前端有一些依赖警告
        set /p "reinstall=是否重新安装前端依赖? (y/N): "
        if /i "!reinstall!"=="y" (
            echo %BLUE%[INFO]%NC% 重新安装前端依赖...
            if exist "node_modules" rmdir /s /q node_modules
            if exist "package-lock.json" del package-lock.json
            call npm install
            echo %GREEN%[SUCCESS]%NC% 前端依赖重新安装完成
        )
    )
    
    cd ..
)

echo.
echo %GREEN%依赖修复完成！%NC%
echo.
echo %BLUE%建议运行测试确保一切正常:%NC%
echo   cd concrete-plant-api ^&^& npm test
echo   cd concrete-plant-web ^&^& npm test
echo.

pause


