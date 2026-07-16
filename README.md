# InternBase

高学歴大学生向けの長期インターン求人サイトです。
現在は Cloudflare Pages の Preview 環境で確認・調整しています。

最終更新日: 2026年7月16日

## 現在の共有URL

| 用途 | URL |
| --- | --- |
| Preview公開URL | https://codex-preview.internship-site.pages.dev |
| 管理画面 | https://codex-preview.internship-site.pages.dev/admin |
| 事前登録 | https://codex-preview.internship-site.pages.dev/register |
| 無料相談 | https://codex-preview.internship-site.pages.dev/consultation |
| 求人一覧 | https://codex-preview.internship-site.pages.dev/jobs |
| 大学別求人 | https://codex-preview.internship-site.pages.dev/universities |

## 現在の公開状態

- 公開モード: `Coming Soon`
- 表紙表示: `8月公開予定`
- 公開予定表示: `2026年8月公開予定`
- `/register`、`/consultation`、`/admin` は Coming Soon 中でも利用可能

## 管理画面ログイン

| 項目 | 内容 |
| --- | --- |
| URL | https://codex-preview.internship-site.pages.dev/admin |
| メールアドレス | `admin@internship.jp` |
| パスワード / パスコード | 共有済みの一時パスワードを使用 |

注意: 管理画面パスワードは GitHub README には直接記載しない運用です。必要な場合は管理者間で別途共有してください。

## 現在設定しているLINE URL

| 導線 | URL |
| --- | --- |
| Sunconnect公式LINE | https://lin.ee/ohGc4ij |
| バリューアップ公式LINE | https://lin.ee/usH63GD |
| デフォルトLINE | https://lin.ee/ohGc4ij |

## 確認済みの主な機能

- Coming Soon 表紙の表示
- 管理画面ログイン
- 管理画面からの公開モード切替
- 管理画面の設定変更と公開画面への反映
- LINE / SNS / 連絡先設定の公開画面連携
- 事前登録フォーム入力
- 無料相談フォーム入力
- 求人キーワード検索
- 大学別求人検索

## Cloudflare構成

| 項目 | 内容 |
| --- | --- |
| Pages project | `internship-site` |
| Preview branch | `codex-preview` |
| D1 database | `internship-production` |
| D1 database id | `67fcdefe-d10b-4f52-b391-a96181f1813b` |

## 関係者確認時の見方

1. まず Preview公開URL を開く
2. 表紙が `8月公開予定` になっていることを確認する
3. `/register` から事前登録フォームを確認する
4. `/consultation` から無料相談フォームを確認する
5. `/admin` にログインして、設定変更が公開画面へ反映されるか確認する

## セキュリティメモ

- `.env`、API Token、Cloudflare Token、管理画面パスワードは GitHub に載せない
- 管理画面パスワードを変更した場合は、READMEではなく別経路で共有する
- 本番公開前に、テスト登録データと相談データを確認・整理する
- 本番URLへ切り替える前に、Cloudflare Pages の Production deployment とD1設定を再確認する
