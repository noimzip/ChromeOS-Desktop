# 開発者ガイド

## 開発セットアップ

Soul Widgets Managerの開発を始めるには：

1.  **依存関係のインストール:**
    ```bash
    npm install
    ```

2.  **開発モードでの実行:**
    ```bash
    npm start
    ```
    これによりアプリケーションが起動し、ログがターミナルに直接出力されます。

::: tip デバッグ
DOMやコンソールエラーを検査するには、`settings.json` で `autoOpenDevTools: true` に設定するか、デスクトップを右クリックして「設定」を選択し、トグルを切り替えてください。
:::

## 新しいウィジェットの追加

ウィジェットシステムは拡張可能に設計されています。以下の手順に従ってカスタムウィジェットを作成してください：

1.  **ディレクトリの作成:**
    `widgets/` に新しいフォルダを作成します（例: `widgets/my_widget/`）。

2.  **ファイルの作成:**
    ロジックとスタイルを追加します：
    - `my_widget.js`
    - `my_widget.css`

3.  **ウィジェットの登録:**
    `widgets/loader.js` を開き、`registry` オブジェクトにウィジェットを追加します：

    ```javascript
    'my_widget_id': {
      js: './widgets/my_widget/my_widget.js',
      css: './widgets/my_widget/my_widget.css'
    }
    ```

4.  **ロジックの実装:**
    ウィジェットのコードを記述します。メインアプリケーションが提供するグローバルユーティリティや `M3` UIライブラリにアクセスできます。

## コーディング規約

- **スタイル:** Standard JSスタイルに従っています。コードが簡潔で整形されていることを確認してください。
- **UIコンポーネント:** `modules/style_manager.js` と `@m3e` ライブラリを使用して、ウィジェットがアプリケーションの残りの部分のMaterial Design 3の美学と一致するようにしてください。
