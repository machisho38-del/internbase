# InternBase - 長期インターン求人サイト

## プロジェクト概要
高学歴大学生向けの長期インターン求人プラットフォーム。
厳選された求人のみ掲載し、招待コード制による質の高いユーザー管理を実現。

## アクセスURL（ローカル開発）
- **公開サイト**: http://localhost:3000/
- **求人一覧**: http://localhost:3000/jobs
- **求人詳細**: http://localhost:3000/jobs/:slug
- **新規登録**: http://localhost:3000/register
- **無料相談**: http://localhost:3000/consultation
- **管理画面**: http://localhost:3000/admin

## 管理画面ログイン情報（初期）
- メール: admin@internship.jp
- パスワード: admin123
- ※本番環境では必ず変更すること

## 実装済み機能

### 公開画面
- [x] LP（ヒーロー・求人一覧・特徴・CTA）
- [x] 求人一覧（業種・勤務形態フィルタ・キーワード検索）
- [x] 求人詳細（魅力・業務内容・勤務条件・選考フロー・応募ボタン）
- [x] 招待コード付き新規登録フォーム（招待コード任意）
- [x] 応募フォーム（登録済み学生→LINE誘導）
- [x] 無料相談申込フォーム

### 管理画面（/admin）
- [x] ダッシュボード（KPI・応募状況・最近の応募）
- [x] 企業管理（一覧・追加・編集・削除）
- [x] 求人管理（一覧・追加・編集・削除）
- [x] 学生管理（一覧・検索・詳細・管理メモ）
- [x] 応募管理（一覧・ステータス更新・進捗メモ・面接日程）
- [x] 招待コード管理（作成・一括生成・無効化・削除）
- [x] 無料相談管理（一覧・ステータス更新）

## データモデル

### テーブル構成
| テーブル | 説明 |
|---------|------|
| companies | 企業情報 |
| jobs | 求人情報（企業に紐付く） |
| students | 登録学生 |
| applications | 応募（学生×求人） |
| invite_codes | 招待コード |
| consultations | 無料相談申込 |
| admins | 管理者 |

### ストレージ
- **DB**: Cloudflare D1（SQLite）

## 技術スタック
- **バックエンド**: Hono (TypeScript) + Cloudflare Workers
- **フロントエンド**: Vanilla JS + Tailwind CSS (CDN)
- **DB**: Cloudflare D1 (SQLite)
- **デプロイ**: Cloudflare Pages

## 開発コマンド
```bash
npm run build          # ビルド
npm run db:migrate:local  # ローカルDB作成
npm run db:seed        # テストデータ投入
npm run db:reset       # DB初期化

pm2 start ecosystem.config.cjs   # サービス起動
pm2 restart internship-site      # 再起動
pm2 logs --nostream               # ログ確認
```

## 初回セットアップ（パスワード設定）
```bash
curl -X POST http://localhost:3000/api/auth/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"setup_key":"setup_intern_2024","email":"admin@example.com","password":"your_password","name":"管理者名"}'
```

## 未実装（今後の拡張）
- [ ] サービス名カスタマイズ（現在: InternBase）
- [ ] 公式LINE連携（WebhookによるDM自動化）
- [ ] メール通知（応募確認・選考連絡）
- [ ] 企業自身によるログイン・求人更新
- [ ] 新卒採用情報ページ
- [ ] 就活イベント情報ページ
- [ ] 学生-企業間チャット機能

## デプロイ状況
- **プラットフォーム**: Cloudflare Pages（予定）
- **現在**: ローカル開発中
- **最終更新**: 2024年
