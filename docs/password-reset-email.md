# パスワード再設定メールの環境設定

パスワード再設定メールは Resend API を利用して送信する。コードをデプロイするだけでは送信されないため、Cloudflare Pages の対象環境に次の値を設定する。

- `RESEND_API_KEY`: Resendで発行したAPIキー。Cloudflareでは暗号化されたSecretとして登録する。
- `PASSWORD_RESET_FROM_EMAIL`: Resendで送信認証済みのFromアドレス（例: `ガクチカインターン <support@example.jp>`）。
- `PASSWORD_RESET_REPLY_TO`: 返信先アドレス。必要な場合のみ設定する。

PreviewとProductionは設定が分かれている。まずPreviewだけに登録して実送信を確認し、確認後にProductionへ同じ構成を登録する。

## Preview確認

1. Cloudflare Pages の `internship-site` を開く。
2. `Settings` → `Variables and secrets` で環境を `Preview` に切り替える。
3. 上記の値を追加して再デプロイする。
4. Previewで登録済みのテスト学生のメールアドレスを使い、`/forgot-password`から送信する。
5. 受信したリンクが同じPreviewホストの`/reset-password`を指すことを確認する。
6. 新しいパスワードでログインでき、以前のセッションが無効になることを確認する。

アカウントの存在を第三者に推測されないよう、未登録メール・メール設定不足・送信失敗の場合も公開画面の応答文は同一にしている。送信できない場合はCloudflareのFunctionsログで `Password reset email delivery failed` を確認する。
