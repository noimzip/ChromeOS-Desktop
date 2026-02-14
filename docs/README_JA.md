<div align="center">

<img src="../chrome_extension/assets/soul-128.png" width="128px" height="128px">

# Soul Widgets Manager
## ChromeOS に Windows のようなデスクトップ体験を

[English](README.md) | [日本語](README_JA.md)

---

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Version](https://img.shields.io/badge/Version-0.1-green.svg)](https://github.com/noimzip/Soul-Widgets-Manager)

</div>

---

## 📖 プロジェクト概要

### プロジェクトの目的
Soul Widgets Manager は、Web 中心な ChromeOS と、Windows や macOS のような従来のデスクトップ環境とのギャップを埋めることを目的としています。Electron ベースの透明なオーバーレイ技術を使用し、壁紙の上にショートカットやインタラクティブなウィジェットを配置できるカスタマイズ可能なレイヤーを提供します。

### 主要機能
- **インタラクティブなウィジェット:**
  - **時計:** 12角形のモダンなデザイン。
  - **天気:** 複数のプロバイダー（NWS等）に対応し、位置情報に基づいたリアルタイム更新、単位変換（℃/℉）をサポート。
  - **Gmail:** 未読メールの確認や更新をデスクトップから直接行えます。
  - **メディアプレイヤー:** Linux (playerctl) と Chrome ブラウザのメディアを統合制御。
  - **GitHub:** コントリビューショングラフとストリークの表示。
  - **Google カレンダー:** スケジュールの埋め込み表示。
- **デスクトップ管理:**
  - Web アプリ、Linux アプリ、ファイルへのショートカット作成。
  - フォルダによるグループ化。
  - ドラッグ＆ドロップによる自由な配置（グリッドスナップ対応）。
- **システム統合:**
  - マルチディスプレイ対応。
  - 仮想デスクトップ対応（マルチウィンドウモード）。
  - Material Design 3 (M3) に準拠した美しい UI。

---

## 🛠️ インストール

### 前提条件
- **OS:** Linux (Crostini) が有効化された ChromeOS。
- **GPU:** `chrome://flags` で "Crostini GPU Support" が有効であること（推奨）。
- **ソフトウェア:** `git` (プリインストールされていない場合)。

### 手順
1. **リポジトリのクローン:**
   ```shell
   git clone https://github.com/noimzip/Soul-Widgets-Manager.git
   cd Soul-Widgets-Manager
   ```

2. **インストーラーの実行:**
   ```shell
   bash installer.sh
   ```
   このスクリプトは以下を自動的に行います：
   - システムパッケージ (`nodejs`, `npm`, `playerctl`, `libnss3` 等) のインストール。
   - npm パッケージのインストール。
   - (任意) Linux VM 自動起動用拡張機能のセットアップ。

3. **Chrome 拡張機能のインストール:**
   - Chrome で `chrome://extensions` を開く。
   - 右上の「デベロッパー モード」をオンにする。
   - 「パッケージ化されていない拡張機能を読み込む」をクリックし、本プロジェクト内の `chrome_extension` フォルダを選択。

---

## 🚀 使用方法

### 基本コマンド
アプリケーションを起動するには、以下のスクリプトを実行します：
```shell
bash startup.sh
```

### 操作オプション
デスクトップオーバーレイ上で以下の操作が可能です：
- **右クリック:** コンテキストメニューを開き、アプリ・ウィジェット・フォルダの追加や設定画面へアクセス。
- **ドラッグ＆ドロップ:** アイコンやウィジェットの移動。
- **クリック:** ショートカットの起動、ウィジェットの操作。

---

## ⚙️ 設定

設定は GUI（右クリック > 設定）から変更可能ですが、以下のファイルに保存されます。

### 設定ファイル
- **パス:** `~/.config/Soul Widgets Manager/settings.json` (環境により異なる場合があります)

| キー | 型 | 説明 | デフォルト |
| --- | --- | --- | --- |
| `windowCount` | Number | 起動するオーバーレイウィンドウの数（仮想デスクトップ用） | `1` |
| `targetDisplayId` | String | オーバーレイを表示するディスプレイの ID | `primary` |
| `windowResizable` | Boolean | ウィンドウのリサイズ許可 | `true` |
| `autoOpenDevTools` | Boolean | 起動時に開発者ツールを自動で開く | `false` |

### 環境変数
- **Electron 起動フラグ:** `startup.sh` 内で `--ozone-platform-hint=wayland` が設定されています。これは ChromeOS で透明ウィンドウを正しく表示するために必須です。

---

## 💻 開発

### セットアップ
```shell
# 依存関係のインストール
npm install
```

### 開発モードでの実行
```shell
# アプリケーションの起動（ログはターミナルに出力されます）
npm start
```
デバッグ時は、設定メニューまたは `settings.json` で `autoOpenDevTools: true` に設定すると便利です。

### ウィジェットの追加方法
1. `widgets/` ディレクトリに新しいフォルダを作成（例: `my_widget`）。
2. JS と CSS ファイルを作成。
3. `widgets/loader.js` の `registry` に登録。

### コーディング規約
- **スタイル:** 既存のコード（Standard JS 準拠）に従ってください。
- **UI:** `modules/style_manager.js` や `@m3e` ライブラリを使用し、Material Design 3 のガイドラインに沿ったデザインを推奨します。

---

## 🤝 貢献
貢献、バグ報告、機能リクエストをお待ちしております！詳細は [CONTRIBUTING_JA.md](CONTRIBUTING_JA.md) を参照してください。

---

## 📜 ライセンス
このプロジェクトは **GPL-3.0 ライセンス** の下で公開されています。詳細は [LICENSE](../LICENSE) ファイルを参照してください。セキュリティに関する特記事項については [SECURITY_JA.md](SECURITY_JA.md) を参照してください。

---

## 📞 連絡先

### リポジトリ
[https://github.com/noimzip/Soul-Widgets-Manager](https://github.com/noimzip/Soul-Widgets-Manager)

### 開発者
- GitHub Issues または Discussions をご利用ください。

---
<div align="center">
   <b>原作者の Supechicken666 氏に敬意を評します。</b>
</div>
