# アーキテクチャ

Soul Widgets Managerは、ChromeOS上でシームレスな体験を提供するために、3層構造のアーキテクチャを採用しています。

## 1. Electronホスト (`main.js`)
Linuxコンテナ内で実行されるアプリケーションの中核です。
- **透明ウィンドウ:** デスクトップを覆う、フレームのないクリックスルー可能なウィンドウを作成します。
- **WebSocketサーバー:** Chrome拡張機能と通信するために、ポート `25600` でローカルサーバーを実行します。
- **システム操作:** シェルコマンドの実行 (`exec`)、アプリの起動、ファイルの展開 (`xdg-open`) などの低レベルタスクを処理します。
- **メディアポーリング:** `playerctl` を使用して、他のLinuxアプリケーションからメディアステータスを取得します。

## 2. デスクトップレイヤー (`index.html` + `modules/`)
Electronウィンドウ内でレンダリングされるビジュアルフロントエンドです。
- **Material Design 3:** 一貫したスタイリングのために `@m3e` ライブラリを使用して構築されています。
- **App Manager:** ショートカットとウィジェットの状態と永続性（CRUD操作）を管理します。
- **Style Manager:** 動的なテーマ設定と視覚効果を処理します。

## 3. Chrome拡張機能 (`chrome_extension/`)
メインアプリはLinuxコンテナ内で実行されるため、ブラウザ情報に直接アクセスすることはできません。拡張機能がこのギャップを埋めます。
- **メディアキャプチャ:** YouTubeやSpotifyなどのサポートされているサイトからメタデータ（タイトル、アーティスト、アートワーク）を読み取ります。
- **データ転送:** WebSocket接続を介してこのデータをElectronホストに送信します。

## ダイアグラム
```mermaid
graph TD
    Browser[Chrome Browser] <-->|Extension API| Ext[Chrome Extension]
    Ext <-->|WebSocket :25600| Electron[Electron Host (Linux)]
    Electron <-->|IPC| UI[Desktop UI (Renderer)]
    Electron -->|playerctl| LinuxApps[Linux Media Apps]
    Electron -->|exec| System[System Commands]
```
