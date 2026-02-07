#!/bin/bash

# Soul Widgets Manager Startup Script

# bash または zsh で実行されているかチェック
if [ -z "$BASH_VERSION" ] && [ -z "$ZSH_VERSION" ]; then
    echo "Warning: This script is optimized for bash/zsh. Using 'sh' may cause unexpected behavior."
    echo "Recommended: 'bash startup.sh' or './startup.sh'"
    echo "--------------------------------------------------"
fi

# スクリプトの実行ディレクトリに移動（どこから実行しても動作するようにする）
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# 依存関係（node_modules）のチェック
if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not found. Please run 'sh installer.sh' first."
    exit 1
fi

# すでに実行中かチェック（二重起動防止）
# package.json で定義されている起動コマンドを検索
if pgrep -f "electron . --ozone-platform-hint=wayland" > /dev/null; then
    echo "Soul Widgets Manager is already running."
    exit 0
fi

echo "Starting Soul Widgets Manager..."

# バックグラウンドで起動
# デバッグ用に /dev/null ではなく startup.log にログを出力するように変更
nohup npm start > startup.log 2>&1 &

# 起動に成功したか少し待って確認
sleep 2

if pgrep -f "electron . --ozone-platform-hint=wayland" > /dev/null; then
    echo "Application started successfully."
    echo "Logs are available in startup.log"
    # ターミナルを自動で閉じる（元の挙動を維持）
    exit
else
    echo "Failed to start. Please check startup.log for details:"
    cat startup.log
    exit 1
fi
