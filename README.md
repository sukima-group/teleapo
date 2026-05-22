# 川嶋メソッド テレアポ管理 PWA v25

スキマグループ合同会社のアポインター向け業務管理 PWA

**本番URL**: https://sukima-group.github.io/teleapo/

## v25 で追加した内容

### 福田貴美恵 様 (PIN 095) アカウント追加

5人目のアポインターとして、福田貴美恵様のアカウントを追加しました。

| 変更箇所 | 内容 |
|---|---|
| `index.html` STAFF配列 | `{id:"s095",nm:"福田貴美恵",pin:"095",sh:"福田"}` 追加 |
| `gas-code.txt` PIN_MAP | `"095":"福田"` 追加 |
| `gas-code.txt` FULL_NAME_MAP | `"095":"福田貴美恵"` 追加 |
| `gas-code.txt` APPOINTER_DRIVE_MAP | `"福田": { email: "fukuda.sukimagroup@gmail.com", folder_name: "福田_CallRecordings" }` 追加 |

GASスプレッドシートの「福田」シートは、初回のリストアップロード時に自動作成されます。

## ログインPIN (5名体制)

| PIN | アポインター |
|---|---|
| 091 | 柏木幸代 |
| 092 | 園田絵里 |
| 093 | 堀内真紀子 |
| 094 | 河野由香 |
| **095** | **福田貴美恵 (新規追加)** |
| 9999 | 管理者 |

## 検証結果

- GAS handlers: **25/25 全合格**
- クライアント STAFF配列: **11/11 全合格**

## デプロイ手順

### Step 1: GASを再デプロイ

1. Apps Script エディタを開く
2. `gas-code.txt` の内容を全コピーして既存コードに上書き
3. 「デプロイ」→「デプロイを管理」→「編集」→「新しいバージョン」→「デプロイ」
4. (URLは変わりません)

### Step 2: GitHub に7ファイルアップロード

リポジトリ `sukima-group/teleapo` に以下を上書きアップロード:
- `.nojekyll`
- `index.html` (UTF-8 BOM付き, v25)
- `gas-code.txt`
- `manifest.json`
- `sw.js` (v25.0.0)
- `icon-192.png`
- `icon-512.png`
- `README.md`

### Step 3: 全端末でブラウザキャッシュ完全クリア

- PC (Chrome): F12 → Application → Storage → Clear site data → Ctrl+Shift+R
- スマホ: PWAアイコン削除 → ブラウザでサイトデータクリア → 再度ホーム画面追加

### Step 4: 動作確認

1. 管理者 (PIN 9999) でログイン
2. 「📥 リスト読込」→ アップロード先で「福田貴美恵 (リスト未設定)」が選択肢に表示される
3. 福田貴美恵に5件アップロード
4. 別端末で PIN 095 でログイン
5. ✅ 5件のリストが見える
6. 「📞 発信」で電話発信できることを確認
