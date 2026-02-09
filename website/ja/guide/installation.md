# インストール

## 前提条件

インストールする前に、Chromebookが以下の要件を満たしていることを確認してください：

1.  **Linux (Crostini) が有効:** ChromeOSの設定でLinux開発環境をオンにする必要があります。
2.  **GPUアクセラレーション:** 滑らかなアニメーションのために、`chrome://flags` で "Crostini GPU Support" が有効になっていることを確認してください。
3.  **Git:** インストールされていない場合は、`sudo apt install git` を実行してください。

## ステップバイステップガイド

### 1. リポジトリのクローン
Linuxターミナルを開き、以下を実行します：
```bash
git clone https://github.com/noimzip/Soul-Widgets-Manager.git
cd Soul-Widgets-Manager
```

### 2. インストーラーの実行
依存関係を処理するための自動インストーラースクリプトを提供しています。
```bash
bash installer.sh
```
このスクリプトは以下を行います：
- システムパッケージのインストール: `nodejs`, `npm`, `playerctl`, `xdg-utils`、およびElectronに必要なライブラリ (`libnss3` など)。
- Node.js依存関係のインストール (`npm install`)。
- (任意) Linux VMを常時起動させるための [AutoStart 拡張機能](https://github.com/supechicken/ChromeOS-AutoStart) のダウンロード。

### 3. Chrome拡張機能のインストール
ブラウザとの連携には拡張機能が必要です。
1.  Chromeを開き、`chrome://extensions` にアクセスします。
2.  **デベロッパーモード**を有効にします（右上のトグル）。
3.  **パッケージ化されていない拡張機能を読み込む**をクリックします。
4.  `Soul-Widgets-Manager` ディレクトリに移動し、`chrome_extension` フォルダを選択します。
