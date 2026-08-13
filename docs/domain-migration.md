# ガクチカインターン 独自ドメイン移行手順

正式ドメインが決まるまでは、コードに仮ドメインを埋め込まない。ドメイン取得後、Cloudflare Pages の環境変数で切り替える。

## 1. Previewでの事前確認

1. 独自ドメインをCloudflare Pagesへ追加する前に、Branch Previewで画面・管理画面・E2Eを確認する。
2. Preview環境の`PUBLIC_SITE_URL`と`LEGACY_SITE_HOSTS`は空欄のままにする。
3. Preview D1の`site_name`が「ガクチカインターン」であることを確認する。

## 2. 独自ドメイン接続

1. Cloudflareの **Workers & Pages → internship-site → Custom domains** を開く。
2. 取得した正式ドメインを追加し、証明書が`Active`になるまで待つ。
3. Production環境だけに`PUBLIC_SITE_URL=https://正式ドメイン`を設定する。
4. 正式ドメインでトップ、求人一覧、求人詳細、管理画面、規約ページを確認する。

`PUBLIC_SITE_URL`はcanonical、OGP、JobPosting、sitemapの基準URLとして使用される。

## 3. 旧URLからの転送

正式ドメインでの確認が終わってから、Production環境だけに`LEGACY_SITE_HOSTS`を設定する。複数ある場合はカンマ区切りにする。

```text
LEGACY_SITE_HOSTS=internship-site.pages.dev,旧ドメイン.example
```

設定した旧ホストへのアクセスは、パスとクエリ文字列を保ったまま正式ドメインへHTTP 308で恒久転送される。Branch Previewのホストは指定しない。

## 4. SEO切替確認

- 正式ドメインの各ページでcanonicalが正式ドメインになっている。
- `https://正式ドメイン/robots.txt`が正式公開後に`Allow: /`を返す。
- `https://正式ドメイン/sitemap.xml`に公開求人が含まれる。
- 旧URLの任意の求人詳細が、同じパスの正式ドメインへ転送される。
- Search Consoleへ正式ドメインを登録し、sitemapを送信する。

## 5. 切り戻し

問題が起きた場合は、まず`LEGACY_SITE_HOSTS`を空欄にして転送を止める。`PUBLIC_SITE_URL`はcanonicalに影響するため、正式ドメイン自体が利用できない場合だけ元へ戻す。
