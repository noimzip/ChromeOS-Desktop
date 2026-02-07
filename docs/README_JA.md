<div align="center">

<img src="../chrome_extension/assets/soul-128.png" width="128px" height="128px">

# Soul Widgets Manager
## ChromeOS に Windows のようなデスクトップ体験を

[English](README.md) | [日本語](README_JA.md)

---

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Version](https://img.shields.io/badge/Version-0.1-green.svg)](https://github.com/noimzip/Soul-Widgets-Manager)

Soul Widgets Manager は、ChromeOS のデスクトップにショートカットやインタラクティブなウィジェットを表示する、Electron ベースの透明オーバーレイです。Web 中心な ChromeOS と従来のデスクトップ環境のギャップを埋め、カスタマイズ可能なレイヤーを提供します。

</div>

---

## ✨ 主な機能

### 🧩 インタラクティブなウィジェット
- **時計ウィジェット:** ユニークな12角形のデザインを採用したスタイリッシュでモダンな時計。
- **メディアプレイヤー:** Linux アプリ（playerctl経由）と Chrome のメディア再生を統合管理。アルバムアート、シークバー、再生コントロールを搭載。
- **GitHub コントリビューション:** デスクトップ上で直接、草（コントリビューション）やストリークを確認可能。
- **Google カレンダー:** 埋め込み表示により、スケジュールを常に確認可能（月・週・アジェンダ表示に対応）。

### 🚀 デスクトップ管理
- **ショートカット:** Web アプリ (URL)、Linux アプリ、ファイル、フォルダのショートカットを追加可能。
- **フォルダ:** ショートカットを自由にグループ化。
- **カスタマイズ:** Material Design 3 (M3) に基づく UI を採用：
    - ダーク/ライト/システムテーマに対応。
    - カスタムカラースキーム（画像からの色抽出機能付き）。
    - アイコン形状やブラー効果の調整。
    - 多言語対応（日本語・英語）。

### 🖥️ システム連携
- **マルチディスプレイ対応:** どの画面にオーバーレイを表示するか選択可能。
- **仮想デスクトップ:** 複数のウィンドウを作成し、異なる仮想デスクトップに配置可能。
- **Chrome 連携:** 専用拡張機能により、ブラウザとデスクトップレイヤー間のシームレスな通信を実現。

---

## 🛠️ インストール方法

### 前提条件
- Linux (Crostini) が有効化された ChromeOS。
- `nodejs` および `npm` (インストーラーにより自動でインストールされます)。

### セットアップ
1. **リポジトリをクローン:**
   ```shell
   git clone https://github.com/noimzip/Soul-Widgets-Manager.git
   cd Soul-Widgets-Manager
   ```

2. **インストーラーの実行:**
   ```shell
   bash installer.sh
   ```
   *依存関係のインストールと、オプションで自動起動拡張機能のセットアップを行います。*

3. **Chrome 拡張機能のインストール:**
   - `/chrome_extension` フォルダにある拡張機能をサイドロードします。
   - 詳細な手順については [こちらのガイド](https://github.com/supechicken/ChromeOS-LivePaper#installation) を参照してください。

---

## 🚀 使い方

### 起動方法
以下のコマンドを実行してアプリケーションをバックグラウンドで起動します：
```shell
bash startup.sh
```

### 設定
- デスクトップを**右クリック**することで、アプリやウィジェットの追加、**設定メニュー**を開くことができます。
- アイコンやウィジェットは**ドラッグ＆ドロップ**で移動可能です。設定で「グリッドモード」を有効にすると、正確に整列させることができます。
- **仮想デスクトップ:** 複数の仮想デスクトップを使用する場合、設定の「ウィンドウ数」を増やし、各ウィンドウをそれぞれのデスクトップに移動させてください。

---

## ⚙️ 仕組み
- **Electron オーバーレイ:** Electron を使用して作成された、壁紙の上・ウィンドウの下に位置する透明なウィンドウ。
- **WebSocket 通信:** ローカルの WebSocket サーバー (ポート 25600) を使用して Chrome 拡張機能と通信し、メディア情報の同期や「ファイル」「設定」などのシステムアプリの起動を行います。
- **M3 エコシステム:** `@m3e` ライブラリを使用し、一貫性のある美しい Material Design 3 体験を提供します。

---

## 🤝 貢献
このプロジェクトは現在 **開発中 (WIP)** です。貢献、バグ報告、機能リクエストをお待ちしております。

## 📜 ライセンス
このプロジェクトは **GPL-3.0 ライセンス** の下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

---
<div align="center">
   <b>原作者の Supechicken666 氏に敬意を評します。</b>
</div>
