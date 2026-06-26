@echo off
chcp 65001 >nul
title 上传系统一键启动

echo ========================================
echo    📤 二维码上传系统 - 一键启动
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖（首次运行，请稍候）...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

:: 创建数据目录
if not exist "data\uploads" (
    mkdir data\uploads 2>nul
    echo ✅ 创建数据目录
)

:: 初始化数据文件
if not exist "data\records.json" (
    echo [] > data\records.json
    echo ✅ 初始化数据文件
)

echo.
echo ========================================
echo    ✅ 启动服务器...
echo ========================================
echo.
echo    📤 上传页面: http://localhost:3000
echo    📊 管理后台: http://localhost:3000/admin.html
echo.
echo    💡 按 Ctrl+C 停止服务器
echo ========================================
echo.

node server.js

pause