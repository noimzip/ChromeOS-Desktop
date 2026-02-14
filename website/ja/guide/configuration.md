# 設定

Soul Widgets Managerの設定は、グラフィカルな設定メニュー（右クリック > 設定）から行うか、設定ファイルを直接編集することで変更できます。

## 設定ファイル

設定は以下のJSONファイルに保存されます：
`~/.config/Soul Widgets Manager/settings.json`

(注: 正確なパスは環境によって若干異なる場合があります)。

### 設定オプション

| キー | 型 | デフォルト | 説明 |
| :--- | :--- | :--- | :--- |
| `windowCount` | Number | `1` | 起動するオーバーレイウィンドウの数。複数の仮想デスクトップを使用する場合はこれを増やします。 |
| `targetDisplayId` | String | `primary` | オーバーレイを表示するディスプレイのID。マルチモニター設定に便利です。 |
| `windowResizable` | Boolean | `true` | オーバーレイウィンドウのリサイズを許可するかどうか（通常はデバッグや特定のセットアップ用）。 |
| `autoOpenDevTools` | Boolean | `false` | `true` の場合、起動時にChrome開発者ツールが自動的に開きます。 |
| `securityMode` | String | `standard` | セキュリティレベル: `strict`, `standard`, または `none`。 |
| `allowedBinaries` | String[] | `[]` | 許可された Linux コマンドパスのリスト（`strict` モードで使用）。 |
| `allowedDomains` | String[] | `[]` | 許可された外部ドメインのリスト（`strict` モードで使用）。 |

## ウィジェットの設定

ほとんどのウィジェット固有の設定はブラウザの `localStorage` に保存され、ウィジェットを右クリックして **設定** を選択することで、UIから直接設定できます。

### 天気ウィジェット
- **プロバイダー:** Open-Meteo または National Weather Service (NWS) から選択。
- **位置情報モード:** 自動（IP/ブラウザ経由）または手動座標。
- **単位:** 摂氏（℃）または華氏（℉）。
- **更新間隔:** 天気データと位置情報を更新する頻度。
- **形状:** ウィジェットの外観（ピル、サークル等）をカスタマイズ。

### Gmailウィジェット
Gmailウィジェットを使用するには、メールにアクセスするための **Google Cloud プロジェクト** が必要です：
- **クライアント ID & クライアント シークレット:** Google Cloud Console から取得したこれらの情報を入力する必要があります。
- **認証フロー:** 設定後、OAuth2 経由で安全にログインできます。
- **スコープ:** ウィジェットは未読メールを表示するために `gmail.readonly` アクセスのみを要求します。

## 環境変数

アプリケーションは通常 `startup.sh` 経由で起動されます。このスクリプトはElectronに特定のフラグを設定します：

```bash
electron . --ozone-platform-hint=wayland
```

- `--ozone-platform-hint=wayland`: **必須。** ElectronにWaylandバックエンドの使用を強制します。これはChromeOS (Linux) で透明ウィンドウをサポートするために必要です。これがないと、背景が透明ではなく黒くなる場合があります。
