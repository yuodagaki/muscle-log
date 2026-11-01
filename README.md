# Muscle Log

部位別の筋トレ回数を記録・積み重ね・偏りを可視化する個人用Webアプリケーション。

- 詳細仕様: [`muscle-log-handoff/SPEC.md`](muscle-log-handoff/SPEC.md)（正本）
- 画面仕様: `HOME_UI.md` / `REPORT_UI.md` / `SETTINGS_UI.md` / `muscle-log-body-ui/BODY_UI.md`

正確な負荷計測・消費カロリー・運動メニュー提案は目的としていません。記録データは
この端末のブラウザ内（IndexedDB）にのみ保存され、外部サーバーには送信されません。

## 技術スタック

React 19 / TypeScript（strict） / Vite 8 / Tailwind CSS 4 / Dexie.js（IndexedDB） /
Recharts / vite-plugin-pwa / Vitest + Testing Library

バックエンド・DBサーバー・認証・外部APIは使用しません。

## セットアップ

```bash
npm ci
npm run dev       # 開発サーバー（http://localhost:5173/muscle-log/ など）
npm run test      # Vitest（watch）
npm run test -- --run   # 一度だけ実行（CIと同じ）
npm run build     # 型チェック + 本番ビルド（dist/）
npm run preview   # ビルド結果をローカルで確認
npm run lint      # oxlint
```

## GitHub Pagesへの公開

`main`への`push`で [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) が
依存インストール → テスト → ビルド → Pagesデプロイを実行します。`dist/`はGitで管理せず、
ビルドごとにActions上で生成されます。利用者の記録データ（JSONバックアップ）もリポジトリには含めません。

### 公開パス（Viteの`base`）の扱い

GitHub Pagesはリポジトリ名がサブパスになります（例: `https://<user>.github.io/muscle-log/`）。
このプロジェクトでは`vite.config.ts`の`BASE_PATH`を環境変数`VITE_BASE_PATH`で上書きできるようにしており、
デプロイワークフローは`VITE_BASE_PATH=/${{ github.event.repository.name }}/`を自動設定します。
そのため**リポジトリ名を変更しても、ワークフロー側の設定変更は不要**です。

ルート直下（`https://<user>.github.io/`）で公開する場合は、`.github/workflows/deploy.yml`の
`VITE_BASE_PATH`行を削除するか`/`に変更してください。

### Pagesの設定

リポジトリの Settings → Pages → Source を **GitHub Actions** に設定してください。

### デプロイ前の確認事項

**GitHubへのpushや実際のPages公開は、ユーザーの明示的な承認を得てから実行してください。**
このセッションではリポジトリへの初回コミットのみを行い、リモートへのpushは未実施です。

## ディレクトリ構成

```text
src/
├── domain/        # 型・定数・日付計算・集計・検証（純粋関数、Vitestで網羅）
├── storage/        # Dexie(IndexedDB)永続化、JSONエクスポート/インポート
├── hooks/          # AppDataContext（liveQuery）、記録操作の保存ロック
├── components/
│   ├── body-map/    # 人体SVG（選択UI・ヒートマップ共通）
│   ├── layout/       # 共通レイアウト・下部タブ・日付セレクター
│   ├── record-entry/ # 手入力・ワンタップ・履歴編集
│   ├── report/        # 期間切替・サマリー・推移グラフ・継続カレンダー
│   ├── settings/      # JSON書き出し・復元・PWA案内
│   └── common/         # 確認ダイアログ・保存状態表示
└── pages/           # ホーム・レポート・設定の3画面
```

## 仕様上の判断事項（SPEC.md 8章に基づく）

`[確定]`はSPEC.md/各UI仕様の確定事項をそのまま実装したもの、`[暫定]`は仕様書が
明示的に「未承認・変更可能」としている項目です。画像（PNG参考デザイン）にのみ描かれ、
Markdown仕様書に記載のない機能（データ全件初期化・テーマ切替・リマインド設定トグル等）は
**実装していません**。

| 項目 | 採用内容 | 区分 |
|---|---|---|
| ワンタップ加算プリセット | `+5` / `+10` / `+20` のみ。`+50`はHOME_UI.mdで「画面デザインの追加候補」とされ必須ではないため見送り | 暫定（SPEC.md確定値を優先） |
| 手入力の初期値・補助ステップ | 初期値20、補助`+1/+5/+10/+20` | 暫定（HOME_UI.md記載どおり） |
| レポート初期表示期間 | 今週 | 暫定（REPORT_UI.md記載どおり） |
| 推移グラフ初期単位 | 日別 | 暫定（REPORT_UI.md記載どおり） |
| 継続カレンダーの表示粒度 | 今週=週間チップ、今月=月間グリッド、今年=月単位リスト、全期間=年単位リスト | 暫定（長期間の全日付を一度に描画しない方針に基づく独自実装） |
| 設定画面の対象機能 | JSON書き出し/復元・保存状態表示・バックアップ案内・アプリについて・PWA案内のみ | 確定（SETTINGS_UI.mdが未承認機能として明示除外した項目は実装しない） |
| タイムスタンプの保存形式 | `createdAt`/`updatedAt`/`exportedAt`はUTC ISO 8601（`Z`終端） | 暫定（SPEC.mdの例は`+09:00`だが、ISO 8601として有効な形式であればよいと解釈） |
| Service Worker更新 | `registerType: 'prompt'`＋vite-plugin-pwaの既定の登録スクリプトを使用。独自の更新バナーは実装せず、強制リロードが起きない既定動作に委ねた | 暫定（SPEC.md 8章「強制リロードを避ける」を満たす最小実装） |

## テスト

Vitest + Testing Library + fake-indexeddb で58件のテストを実装し、すべて成功しています（`npm run test -- --run`）。

カバーしている主なケース（SPEC.md 7章の要求に対応）:

- 同一部位・同日への複数回記録の累計（履歴は分割、合計は合算）
- 過去日付への追加・編集・削除、`createdAt`保持と`updatedAt`更新
- 不正な回数（0・負数・小数・安全な整数超過）・不正な日付（存在しない日付）の拒否
- 休息日を含めた1日あたり平均（7日・合計500回・運動2日 → 約71.4回/日）
- 週・月・年境界をまたぐ推移集計（期間外を含めない／うるう年）
- レコードIDの重複防止（追加時・JSONインポート時の双方）
- JSONの正常なエクスポート/インポート、往復（export→import）検証
- 不正JSON（構文エラー・スキーマ不正・バージョン不一致・重複ID）の全件拒否
- インポート確認前・検証失敗時・キャンセル時に既存データが変更されないこと
- IndexedDB書き込み失敗時に成功表示をしないこと（UI統合テスト）
- 新しいDB接続でも記録が参照できること（ページ再読み込み相当の永続化確認）

### 未検証（実機・実ブラウザが必要なため、このセッションでは確認できていません）

SPEC.md 7章の指示「実機検証ができない項目は、未検証と明記してください」に従い、以下は**未検証**です。

- iPhone Safari（通常タブ）での実際の操作性・ソフトウェアキーボード・Safe Area表示
- ホーム画面に追加したPWAとしての起動・オフラインでの記録追加/閲覧
- Service Workerインストール後のアプリ更新時に既存記録が失われないこと（実機再現）
- GitHub Pagesへの実デプロイ後、サブパスURLでの直接アクセス・リロード・アセット読み込み
- `navigator.share()` / ダウンロードシートの実際の挙動（Safariバージョン依存）
- VoiceOverでの読み上げ・フォーカス移動の実機確認

ビルド成果物の`dist/index.html`は、`VITE_BASE_PATH`に応じてアイコン・スクリプト・manifestの
URLが正しく書き換わることを静的に確認済みです。

## 既知のSafari上の制約（設計前提）

- Safariはファイルシステムへの直接上書き保存ができないため、JSONエクスポートは
  ダウンロード/共有シートの起動のみを行い、保存の完了はアプリ側で確認できません。
  そのため書き出し後に「保存できましたか？」と明示的に確認し、確認した場合にのみ
  バックアップ済みとして記録します。
- 通常のSafariタブとホーム画面に追加したPWAとでは、IndexedDBの保存領域が
  分離される場合があります。両方から同じ記録が見える保証はありません（設定画面に案内を表示）。
- `beforeinstallprompt`はiOSでは発火しないため、ホーム画面への追加は手順の案内のみです。
