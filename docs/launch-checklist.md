# InternBase 公開・SEOチェックリスト

この文書は、Production では Coming Soon のみを公開し、Preview ではサイト本体を確認しながら開発する期間から、正式公開へ移行するまでの手順をまとめたものです。

## 環境の役割

| 環境 | D1 | `site_mode` | 用途 |
| --- | --- | --- | --- |
| Production | `internship-production` | `coming_soon` | 一般ユーザーには Coming Soon を表示 |
| Preview | `internship-preview` | `public` | サイト本体と管理画面の確認 |

`site_mode` が `coming_soon` の間は、公開 API を `503` にして開発中データの取得・更新を防ぎます。管理者ログイン後の管理 API、管理画面、規約、運営者情報、robots.txt、sitemap.xml は引き続き利用できます。

## ドメイン取得後に行う設定

1. Cloudflare Pages の **Custom domains** から正式ドメインを Production に接続する。
2. Cloudflare Pages の Production 環境変数 `PUBLIC_SITE_URL` に `https://正式ドメイン` を設定する。
3. Preview では `PUBLIC_SITE_URL` を設定しない。Branch Preview は自動的に `X-Robots-Tag: noindex, nofollow` と検索拒否用 robots.txt を返す。機密性も必要な場合は、さらに Cloudflare Access で保護する。
4. HTTPS 証明書が Active になり、HTTP から HTTPS へ転送されることを確認する。
5. `pages.dev` から正式ドメインへの転送は、正式ドメインで Production の表示確認後に Cloudflare Redirect Rules で `301` を設定する。

> `PUBLIC_SITE_URL` を設定するまでは、canonical、OG URL、sitemap はリクエストされたホストを自動的に使用します。そのため、ドメイン決定前にコードへ仮ドメインを埋め込む必要はありません。

## デプロイ前の必須作業

1. Preview D1 にマイグレーションを適用し、動作確認する。
2. 管理画面の「サイト設定」で次を入力する。
   - 運営者名
   - 代表者名
   - 所在地
   - 事業内容
   - 問い合わせメールアドレス
   - 規約最終更新日
3. プライバシーポリシーと利用規約を事業内容に合わせて専門家が確認する。
4. Production D1 のバックアップを取得してから、同じマイグレーションを適用する。
5. Production の `site_mode` が `coming_soon` のままであることを確認してデプロイする。

## Coming Soon 期間の確認

- Production の `/` と `/jobs` が Coming Soon を表示する。
- Production の `/api/jobs` が `503` を返す。
- Production の `/robots.txt` が `Disallow: /` を返す。
- Production の `/sitemap.xml` に URL が含まれない。
- Production の `/admin` へログインできる。
- Preview の `/jobs`、求人詳細、大学別求人、登録、ログイン、管理画面を確認できる。
- Preview の登録・編集・削除が `internship-preview` のみに反映され、Production のデータが変化しない。

## 正式公開の切り替え

1. Preview の最終確認と CI が成功していることを確認する。
2. Production D1 の `site_mode` を `public` に変更する。
3. `/robots.txt` に `Allow: /` と正式ドメインの Sitemap が出ることを確認する。
4. `/sitemap.xml` に公開求人と大学タグの URL が含まれることを確認する。
5. 求人詳細の title、description、canonical、OGP、JobPosting 構造化データを確認する。
6. Google Search Console に正式ドメインを登録し、サイトマップを送信する。

## 公開直前の品質確認

- PageSpeed Insights または Lighthouse をモバイル・デスクトップで実行する。
- Core Web Vitals の LCP、INP、CLS を記録し、主要ページ（トップ、求人一覧、求人詳細）を個別に確認する。
- OGP デバッガーで `/og-default.png` と求人固有画像の表示を確認する。
- Google リッチリザルトテストで公開求人の JobPosting を確認する。
- 404 ページが HTTP `404` を返すことを確認する。
- canonical がページごとの正式 URL になり、Preview URL や `pages.dev` が混ざっていないことを確認する。

Core Web Vitals と検索エンジンの認識状況は、正式ドメインで実際に配信した後でなければ確定できません。公開後も Search Console の実測データを継続的に確認します。
