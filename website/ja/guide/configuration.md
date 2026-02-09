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

## 環境変数

アプリケーションは通常 `startup.sh` 経由で起動されます。このスクリプトはElectronに特定のフラグを設定します：

```bash
electron . --ozone-platform-hint=wayland
```

- `--ozone-platform-hint=wayland`: **必須。** ElectronにWaylandバックエンドの使用を強制します。これはChromeOS (Linux) で透明ウィンドウをサポートするために必要です。これがないと、背景が透明ではなく黒くなる場合があります。
