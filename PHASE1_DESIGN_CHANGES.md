# InternBase — フェーズ1 設計変更仕様書
> 既存 PROTOTYPE_SPEC.md に対する MVP 方針の差分・修正一覧  
> 作成日: 2026-04-23 | ステータス: 確定版（実装前レビュー用）

---

## ① 変更一覧サマリー

| # | 変更カテゴリ | 変更内容の概要 | 理由 | 優先度 |
|---|-------------|---------------|------|--------|
| 1 | 公開モード制御 | Coming Soon モードの追加（site_settings に `site_mode` キー） | 6月公開まで内部整備期間が必要、外部に見せない | **A** |
| 2 | 認証方針 | localStorage → HttpOnly Cookie ベースに変更 | セキュリティ。本番と開発で認証方式を統一したい | **A** |
| 3 | 学生登録項目 | フォーム取得項目を6項目に絞る（DBカラムは残す） | 離脱防止・MVP最小化 | **A** |
| 4 | 流入経路管理 | `source_media` カラムを students / consultations に追加 | どのメディア経由かを把握してLINE振り分けに使う | **A** |
| 5 | 求人詳細構成 | jobs テーブルにカラム追加・詳細ページの固定構成化 | 詳細ページを固定レイアウトで高品質に見せる | **A** |
| 6 | 管理画面スコープ | Phase1対象機能を9カテゴリに絞る | 作りすぎない・コンテンツ管理に集中 | **A** |
| 7 | UI固定方針 | lp_sections への過依存をやめ、UIレイアウトをコード固定 | 管理コスト削減・デザイン品質担保 | **B** |
| 8 | 画像配置方針 | company / job 単位の image_url を整理・R2は後回し | 初期は URL 文字列で持てば十分 | **B** |
| 9 | 導線固定 | /mypage・/universities/:slug を Phase1対象外に | MVP優先ページ以外は Coming Soon 扱い | **B** |
| 10 | LP構成変更 | ヒーローCTAを「相談」メイン・「求人探す」サブに変更 | 導線設計の明確化 | **B** |

---

## ② 既存仕様書（PROTOTYPE_SPEC.md）章ごとの修正点

### 第0章：プロジェクト概要
| 項目 | 対応 |
|------|------|
| サービス名・コンセプト・技術スタック | **そのまま残す** |
| ビジネスモデルの記述 | 「招待コード制 → LINE相談 → 応募 → 内定」は残す。ただし「どのメディアから来たか」を把握する導線管理を追記 |

---

### 第1章：システム構成
**残す:** 全体構成・技術スタック

**追加する:**
```
公開モード制御層（Hono ミドルウェア）
  ├── site_mode = 'coming_soon' の場合
  │     /       → Coming Soon ページ返却
  │     /jobs   → Coming Soon ページ返却
  │     /jobs/:slug  → Coming Soon ページ返却
  │     /register    → 事前登録フォーム（有効）
  │     /consultation → 相談フォーム（有効）
  │     /admin       → 通常通り
  └── site_mode = 'public' の場合
        → 通常どおり全ページ表示
```

---

### 第2章：カラーパレット / デザイントークン
**そのまま残す。** UIフレームは固定なので変更なし。

---

### 第3章：データベース設計
→ 「③ DB修正案」で詳述。複数テーブルに変更あり。

---

### 第4章：API エンドポイント
→ 「④ API修正案」で詳述。認証・Coming Soon 制御が主な変更。

---

### 第5章：フロントエンドページ構成
**残す:** 全体構成・ルーティング方式（pathname 判定）

**修正する:**
- `initHomePage()` のCTAを「LINE相談メイン」に変更
- `initJobDetailPage()` を固定構成（§8）に従い全面リライト
- Coming Soon 時の各ページ描画関数を追加

**削る（Phase1対象外）:**
- `initMyPage()` → Phase2以降
- `initUniversityJobsPage()` → Phase2以降

**追加する:**
- `initComingSoonPage()` — 6月公開予定表示・相談フォームのみ有効
- 流入媒体選択UI（登録・相談フォームの最初のステップに追加）

---

### 第6章：URL マッピング
**Phase1 対象ページ（コード実装する）:**

| URL | モード = public | モード = coming_soon |
|-----|----------------|---------------------|
| `/` | LP フル表示 | Coming Soon ページ |
| `/jobs` | 求人一覧 | Coming Soon ページ |
| `/jobs/:slug` | 求人詳細 | Coming Soon ページ |
| `/register` | 登録フォーム | 事前登録フォーム（有効） |
| `/consultation` | 相談フォーム | 相談フォーム（有効） |
| `/universities` | 大学別一覧 | Coming Soon ページ |
| `/admin` | 管理画面 | 管理画面（通常） |

**Phase1 対象外（実装しない or Coming Soon のまま）:**
- `/mypage` → Phase2
- `/universities/:slug` → Phase2

---

### 第8章：状態管理（localStorage）
**削除する:**
```javascript
// 以下を削除
localStorage.getItem('admin_token')
localStorage.setItem('admin_token', token)
localStorage.removeItem('admin_token')
```

**残す（公開サイト側の学生情報は localStorage で継続）:**
```javascript
localStorage.getItem('student_id')      // 登録済み学生ID
localStorage.getItem('student_name')    // 学生氏名
localStorage.getItem('my_invite_code')  // 自分の招待コード
```

> 管理画面の認証は Cookie に移行。公開サイトの学生識別は引き続き localStorage（Phase1ではそのまま）。

---

### 第9章：ビジネスロジック
**追加する:**

#### 9.4 Coming Soon モード制御
```
site_settings.site_mode = 'coming_soon' | 'public'
Hono ミドルウェアが全ルート前にチェック
→ coming_soon 時は対象ページを CS ページに差し替え
→ /register / /consultation / /admin は常に通過
```

#### 9.5 流入媒体管理
```
登録・相談フォームに「どこで知りましたか？」選択を追加
選択肢:
  - todai_ig     （東大向けInstagram）
  - waseda_ig    （早稲田向けInstagram）
  - keio_ig      （慶應向けInstagram）
  - march_ig     （MARCH向けInstagram）
  - web          （Webサイトを見て）
  - other_sns    （その他SNS）
  - other        （その他）
→ students.source_media / consultations.source_media に保存
→ 保存された media に応じて適切なLINE URLへ誘導
```

---

## ③ DB修正案

### 3-1. site_settings に追加するキー

| key | type | 初期値 | 説明 |
|-----|------|--------|------|
| `site_mode` | text | `'coming_soon'` | `'coming_soon'` or `'public'` |
| `coming_soon_title` | text | `'6月公開予定'` | Coming Soonページのタイトル |
| `coming_soon_subtitle` | text | `'現在準備中です...'` | サブタイトル |
| `coming_soon_date` | text | `'2025年6月'` | 公開予定時期（表示用文字列） |
| `line_url_todai` | url | `''` | 東大向けLINE URL |
| `line_url_waseda` | url | `''` | 早稲田向けLINE URL |
| `line_url_keio` | url | `''` | 慶應向けLINE URL |
| `line_url_march` | url | `''` | MARCH向けLINE URL |
| `line_url_default` | url | `''` | デフォルトLINE URL（既存の `line_url` を改名） |

> 既存の `line_url` キーは `line_url_default` に **改名**（後方互換のため移行スクリプト必要）。

---

### 3-2. students テーブル修正

#### Phase1 フォーム取得項目（6項目）

| カラム | 必須 | フォーム表示 | 備考 |
|--------|------|------------|------|
| `last_name` | ✓ | ✓ | |
| `first_name` | ✓ | ✓ | |
| `email` | ✓ | ✓ | |
| `university` | ✓ | ✓ | |
| `faculty` | | ✓ | 学部（任意） |
| `grade` | ✓ | ✓ | 学年 |
| `invite_code_used` | | ✓ | 招待コード（任意） |

#### DBには残すが初期フォームには出さない項目

| カラム | 将来利用想定 |
|--------|------------|
| `last_name_kana` | 将来の本人確認・PDF出力時 |
| `first_name_kana` | 同上 |
| `phone` | LINE誘導後に収集予定 |
| `department` | 任意追加情報 |
| `graduation_year` | 将来の就活サポート機能 |
| `pr_text` | 応募時に別途収集 |
| `line_user_id` | LINE連携時 |
| `line_display_name` | LINE連携時 |

#### 新規追加カラム

```sql
ALTER TABLE students ADD COLUMN source_media TEXT DEFAULT 'other';
-- 値: todai_ig / waseda_ig / keio_ig / march_ig / web / other_sns / other
```

---

### 3-3. consultations テーブル修正

#### 新規追加カラム

```sql
ALTER TABLE consultations ADD COLUMN source_media TEXT DEFAULT 'other';
-- 値: students と同じ選択肢
```

---

### 3-4. jobs テーブル修正（求人詳細ページ固定構成対応）

#### 追加カラム

```sql
-- 求人詳細固定構成セクション
ALTER TABLE jobs ADD COLUMN appeal_points TEXT;
-- JSON: [{title, body}, {title, body}, {title, body}] ← 「このインターンの魅力3点」

ALTER TABLE jobs ADD COLUMN position_features TEXT;
-- テキスト: ポジションの特徴

ALTER TABLE jobs ADD COLUMN onboarding_flow TEXT;
-- テキスト: 入社後の流れ（例: 1週目〜1ヶ月目〜3ヶ月目）

ALTER TABLE jobs ADD COLUMN task_examples TEXT;
-- JSON or テキスト: 案件例・主な業務リスト

ALTER TABLE jobs ADD COLUMN skill_set TEXT;
-- JSON: ["TypeScript", "Figma", ...] ← 習得できるスキルセット

ALTER TABLE jobs ADD COLUMN career_path TEXT;
-- テキスト: キャリアパス・将来像

ALTER TABLE jobs ADD COLUMN recommended_for TEXT;
-- テキスト: こんな人におすすめ

ALTER TABLE jobs ADD COLUMN hero_image_url TEXT;
-- 求人詳細FVの大画像URL（初期はnull → デフォルト画像表示）

ALTER TABLE jobs ADD COLUMN card_image_url TEXT;
-- 求人カードサムネ画像URL（初期はnull → 企業ロゴで代替）
```

#### 既存カラムの扱い

| 既存カラム | フェーズ1での扱い |
|-----------|-----------------|
| `highlights` | **そのまま残す**（魅力JSONとして流用可） → `appeal_points` とどちらか選択 |
| `growth_points` | `skill_set` / `career_path` に役割分割。既存データは `growth_points` に残す |
| `university_level` | 残すがフォームには出さない（管理画面から直接入力） |
| `wage_note` | 残す |

> `highlights` と `appeal_points` は当面共存。フェーズ2でどちらかに統一予定。

---

### 3-5. companies テーブル修正

#### 追加カラム

```sql
ALTER TABLE companies ADD COLUMN hero_image_url TEXT;
-- 企業詳細ページ用ヒーロー画像（求人詳細の「会社概要」セクションに表示）

ALTER TABLE companies ADD COLUMN service_description TEXT;
-- 「サービス / 事業内容」（求人詳細固定構成の1セクション）
```

#### 既存カラムで流用するもの

| 既存カラム | 求人詳細での使い方 |
|-----------|-----------------|
| `description` | 「会社概要」セクション |
| `mission` | 「ミッション」セクション |
| `culture` | メンバー紹介の補足として流用 |
| `logo_url` | 求人カード・詳細ヘッダー |

---

### 3-6. 既存テーブルの役割見直し

| テーブル | Phase1の扱い | 備考 |
|---------|-------------|------|
| `site_settings` | **活用・拡張** | site_mode / LINE URL 複数 を追加 |
| `lp_sections` | **範囲を絞って活用** | `features` セクションのみ使用。それ以外はコード固定 |
| `faqs` | **そのまま活用** | 管理画面から編集可 |
| `announcements` | **そのまま活用** | 管理画面から編集可 |
| `success_stories` | **そのまま活用** | タイムライン管理 |
| `featured_jobs` | **そのまま活用** | ピックアップ求人管理 |
| `university_tags` | **そのまま活用** | 大学タグ管理（/universities 用） |
| `job_university_tags` | **そのまま活用** | 求人×大学タグ紐付け |
| `admins` | **そのまま活用** | Cookie認証に変更後も構造は同じ |

**Phase1 で使わないテーブル（DBには残す）:**
- `applications` → Phase2（応募機能はLINE誘導に一本化）
- `invite_codes` の高度な機能（partner_name 等）→ 単純化して使用

---

## ④ API修正案

### 4-1. 認証API (`/api/auth`) の変更

#### 変更前（既存）
```
POST /auth/admin/login → { token: "abc..." } をJSON返却
フロント: localStorage.setItem('admin_token', token)
管理API: 認証チェックなし（現状）
POST /auth/admin/verify → 常に { success: true }（形骸化）
```

#### 変更後（Phase1）
```
POST /api/auth/admin/login
  リクエスト: { email, password }
  成功時: Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400
  レスポンス: { success: true, data: { name, role } }  ← tokenをJSONに含めない

GET /api/auth/admin/me
  Cookie を検証して現在のログイン管理者情報を返す
  未認証: 401

POST /api/auth/admin/logout
  Cookie を無効化（Max-Age=0 で上書き）
  レスポンス: { success: true }

POST /api/auth/admin/verify
  GET /api/auth/admin/me に統合（削除）
```

#### Hono ミドルウェア設計

```typescript
// src/middleware/adminAuth.ts
import { createMiddleware } from 'hono/factory'

export const adminAuthMiddleware = createMiddleware(async (c, next) => {
  const session = getCookie(c, 'session')
  if (!session) return c.json({ success: false, error: 'Unauthorized' }, 401)

  // D1 でセッション検証（sessions テーブル or site_settings に簡易保存）
  const admin = await verifySession(c.env.DB, session)
  if (!admin) return c.json({ success: false, error: 'Unauthorized' }, 401)

  c.set('admin', admin)
  await next()
})

// 管理APIルートに適用
app.use('/api/*/admin*', adminAuthMiddleware)
app.use('/api/auth/admin/me', adminAuthMiddleware)
```

#### sessions テーブル追加

```sql
CREATE TABLE IF NOT EXISTS admin_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id    INTEGER NOT NULL REFERENCES admins(id),
  token       TEXT UNIQUE NOT NULL,   -- crypto.randomUUID() で生成
  expires_at  DATETIME NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
```

> トークンはUUID形式（`crypto.randomUUID()`）。有効期限は24時間。  
> ログイン時に INSERT、ログアウト時に DELETE。期限切れは me API で検証時に削除。

---

### 4-2. Coming Soon ミドルウェア

```typescript
// src/middleware/comingSoon.ts
// 公開ページルートの前段に適用

const PUBLIC_ALWAYS_ALLOWED = ['/register', '/consultation', '/admin', '/api/']

export const comingSoonMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.path
  const isAlwaysAllowed = PUBLIC_ALWAYS_ALLOWED.some(p => path.startsWith(p))

  if (isAlwaysAllowed) return await next()

  // site_mode をDBから取得（キャッシュ推奨）
  const setting = await c.env.DB.prepare(
    `SELECT setting_value FROM site_settings WHERE setting_key = 'site_mode'`
  ).first()
  const mode = (setting as any)?.setting_value ?? 'coming_soon'

  if (mode === 'coming_soon') {
    // Coming Soon HTML を返す（getPublicHTML('coming-soon') 相当）
    return c.html(getComingSoonHTML())
  }

  await next()
})
```

---

### 4-3. 新規追加エンドポイント

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/auth/admin/me` | ログイン状態確認（Cookie検証） |
| POST | `/api/auth/admin/logout` | ログアウト（Cookie削除） |
| GET | `/api/settings/site-mode` | 現在の公開モード取得（公開用・キャッシュなし） |
| PUT | `/api/settings/admin/site-mode` | 公開モード切替（管理用） |

---

### 4-4. 変更が必要な既存エンドポイント

| エンドポイント | 変更内容 |
|--------------|---------|
| `POST /api/auth/admin/login` | Cookie 返却に変更。JSON に token を含めない |
| `POST /api/auth/admin/verify` | 廃止 → `GET /api/auth/admin/me` に統合 |
| `POST /api/students/register` | `source_media` フィールドを受け取るよう追加 |
| `POST /api/consultation` | `source_media` フィールドを受け取るよう追加 |
| 全管理API `*/admin*` | adminAuthMiddleware を適用（現状は認証なし） |

---

### 4-5. Cookie認証対応の影響範囲

**バックエンド (src/):**
- `src/routes/api.auth.ts` → 全面書き換え
- `src/index.tsx` → adminAuthMiddleware / comingSoonMiddleware の登録
- 新規: `src/middleware/adminAuth.ts`
- 新規: `src/middleware/comingSoon.ts`
- DB migration 追加: `admin_sessions` テーブル

**フロントエンド (public/static/admin.js):**
- `localStorage.setItem('admin_token', ...)` → 削除
- `localStorage.getItem('admin_token')` → 削除
- `checkAuth()` → `GET /api/auth/admin/me` を fetch して判断する方式に変更
- `adminLogout()` → `POST /api/auth/admin/logout` を呼んでリダイレクト
- Axios のリクエストヘッダーから Authorization 削除
- **Axios の `withCredentials: true` を設定**（Cookie 送信のため）

```javascript
// admin.js の API インスタンス変更
const API = axios.create({
  baseURL: '/api',
  withCredentials: true  // ← 追加。Cookie を毎リクエストに含める
});

// checkAuth の変更
async function checkAuth() {
  try {
    const res = await API.get('/auth/admin/me');
    document.getElementById('admin-name').textContent = res.data.data.name;
    return true;
  } catch(e) {
    showAdminLogin();
    return false;
  }
}

// ログアウト
async function adminLogout() {
  await API.post('/auth/admin/logout');
  localStorage.removeItem('admin_name');
  showAdminLogin();
}
```

---

## ⑤ 公開画面修正案

### 5-1. Coming Soon ページ仕様

```
URL: 全ページ（site_mode = coming_soon 時）
表示内容:
  - InternBase ロゴ
  - 「〇月公開予定」（site_settings.coming_soon_date）
  - タイトル（site_settings.coming_soon_title）
  - サブテキスト（site_settings.coming_soon_subtitle）
  - 「事前に無料相談する」ボタン → /consultation
  - 「事前登録する」ボタン → /register
  - SNS（Instagram）リンク（大学別）
フッター: なし or シンプルなコピーライトのみ
```

---

### 5-2. トップページ（/ ） 変更点

#### 残す構成
- ヒーローセクション（文言のみ site_settings から）
- 実績セクション（stat_* は site_settings から）
- 内定者タイムライン（success_stories テーブルから）
- FAQセクション（faqs テーブルから）
- 下段CTAセクション（LINE相談）

#### 変更する箇所

| 箇所 | 変更前 | 変更後 |
|------|--------|--------|
| ヒーローCTA1 | 「求人を探す」（青ボタン） | 「LINEで無料相談」（緑・メインCTA） |
| ヒーローCTA2 | 「LINEで無料相談」（緑ボタン） | 「求人を見る」（白抜き・サブ） |
| 招待コード×相談の2カラムセクション | 「招待コード登録」+「LINE相談」 | 「流入媒体別LINE導線」に変更（後述） |

#### 削除する箇所
- `lp_sections` の features 以外のセクション連携（コード固定に移行）

#### 追加する箇所
- 「あなたの大学はどちらですか？」の大学別LINE誘導ブロック  
  （site_mode = public の場合のみ表示）

---

### 5-3. 求人一覧ページ（/jobs）変更点

**変更なし（既存仕様を維持）**  
ただし Coming Soon 時は表示されない。

---

### 5-4. 求人詳細ページ（/jobs/:slug）固定構成

既存の `renderJobDetail()` を以下の固定セクション順に全面リライト。

```
┌─────────────────────────────────────────┐
│ 1. FV（求人タイトル・企業名・バッジ群・  │
│    hero_image_url or デフォルト画像）    │
├─────────────────────────────────────────┤
│ 2. このインターンの魅力3点               │
│    （appeal_points JSON / highlights）  │
├─────────────────────────────────────────┤
│ 3. 勤務条件サマリー                     │
│    （時給・時間・場所・スタイル）        │
├─────────────────────────────────────────┤
│ 4. 会社概要 / ミッション                │
│    （companies.description / mission）  │
├─────────────────────────────────────────┤
│ 5. サービス / 事業内容                  │
│    （companies.service_description）    │
├─────────────────────────────────────────┤
│ 6. ポジションの特徴                     │
│    （jobs.position_features）           │
├─────────────────────────────────────────┤
│ 7. 業務概要（jobs.work_content）        │
├─────────────────────────────────────────┤
│ 8. 入社後の流れ                         │
│    （jobs.onboarding_flow）             │
├─────────────────────────────────────────┤
│ 9. 主な業務 / 案件例                    │
│    （jobs.task_examples）               │
├─────────────────────────────────────────┤
│ 10. 習得できるスキルセット              │
│     （jobs.skill_set JSON）             │
├─────────────────────────────────────────┤
│ 11. キャリアパス（jobs.career_path）    │
├─────────────────────────────────────────┤
│ 12. こんな人におすすめ                  │
│     （jobs.recommended_for）            │
├─────────────────────────────────────────┤
│ 13. 応募 / 相談 CTA（固定）             │
│     ・「この求人に応募する」→ LINE誘導  │
│     ・「まず相談する」→ /consultation  │
├─────────────────────────────────────────┤
│ 14. 採用情報（requirements 等）         │
├─────────────────────────────────────────┤
│ 15. 会社情報（office_location 等）      │
├─────────────────────────────────────────┤
│ 16. 最終CTA（固定）                    │
└─────────────────────────────────────────┘
```

> セクション13（応募/相談CTA）は右サイドバーとしても固定表示（sticky）。  
> `null` のフィールドはセクション自体を非表示にする（表示制御はJS側で対応）。

---

### 5-5. 登録ページ（/register）変更点

#### フォーム項目の変更

| フィールド | 変更前 | 変更後 |
|-----------|--------|--------|
| 姓名 | あり | **あり** |
| フリガナ | あり | **削除（Phase2）** |
| メール | あり | **あり** |
| 電話番号 | あり | **削除（Phase2）** |
| 大学名 | あり | **あり** |
| 学部 | あり | **あり（任意）** |
| 学科 | あり | **削除（Phase2）** |
| 学年 | あり | **あり** |
| 自己PR | あり | **削除（Phase2）** |
| 招待コード | あり | **あり（任意）** |
| **流入媒体** | なし | **追加（必須）** |

#### 流入媒体選択UI（登録フォームの最初のステップ）

```
どこでInternBaseを知りましたか？
  ○ 東大向けInstagram
  ○ 早稲田向けInstagram
  ○ 慶應向けInstagram
  ○ MARCH向けInstagram
  ○ Webサイトを見て
  ○ その他SNS
  ○ その他
```

> 選択後、該当する LINE URL（`line_url_todai` 等）に誘導する。  
> 登録完了画面で表示するLINEリンクが media によって変わる。

---

### 5-6. 相談ページ（/consultation）変更点

フォームの最初に **流入媒体選択** を追加（登録フォームと同じ選択肢）。  
それ以外の構成は変更なし。

---

### 5-7. /mypage・/universities/:slug

**Phase1では実装しない。** 該当URLアクセス時は Coming Soon ページ相当の簡易画面を表示。

---

## ⑥ 管理画面修正案

### 6-1. Phase1 で管理画面に残す機能（9カテゴリ）

| # | 管理対象 | 既存機能 | Phase1変更 |
|---|---------|---------|-----------|
| 1 | **企業管理** | CRUD | そのまま残す |
| 2 | **求人管理** | CRUD + 大学タグ | 詳細ページ追加フィールドをフォームに追加 |
| 3 | **FAQ管理** | CRUD | そのまま残す |
| 4 | **お知らせ管理** | CRUD | そのまま残す |
| 5 | **主要文言管理** | site_settings 編集 | 対象キーを絞って整理（下記参照） |
| 6 | **タイムライン** | success_stories CRUD | そのまま残す |
| 7 | **ピックアップ求人** | featured_jobs CRUD | そのまま残す |
| 8 | **大学タグ管理** | university_tags CRUD | そのまま残す |
| 9 | **公開モード切替** | なし（新規） | site_mode を ON/OFF するUI を追加 |

---

### 6-2. Phase1 では後回しにしてよい管理機能

| 機能 | 理由 |
|------|------|
| 学生一覧・詳細表示 | 管理画面からは Phase2 で。現状DBに蓄積されれば十分 |
| 応募管理 | LINE で対応するため Phase1 不要 |
| 招待コード管理 | 初期は手動でDB直接挿入でよい（管理画面は Phase2） |
| 無料相談管理 | メール or DB 確認でよい（管理画面は Phase2） |
| ダッシュボード統計 | Phase2 で再設計。初期は不要 |
| LP セクション高度編集 | 廃止（コード固定化に移行） |

---

### 6-3. 主要文言管理（site_settings）の対象キー絞り込み

Phase1 管理画面から変更できる文言キーを以下に限定する：

```
【Coming Soon 設定】
  site_mode              ← 公開 / 非公開 の切替（トグルUI）
  coming_soon_title
  coming_soon_subtitle
  coming_soon_date

【ヒーローセクション】
  hero_badge_text
  hero_title_line1
  hero_title_line2
  hero_title_line3
  hero_subtitle

【LINE URL 設定】
  line_url_default
  line_url_todai
  line_url_waseda
  line_url_keio
  line_url_march

【実績数字】
  stat_companies
  stat_jobs
  stat_students
  stat_success_rate

【会員限定バナー】
  members_banner_enabled
  members_banner_title
  members_banner_text
  members_banner_btn
```

**管理画面から触らせない（コード固定）:**
- ナビゲーションの構成・リンク
- カードのレイアウト・色
- フォントサイズ・余白
- CTA の位置・形状

---

### 6-4. 公開モード切替UI（管理画面に新規追加）

```
【公開モード設定】（ダッシュボードのトップ or 専用セクション）

現在のモード: ■ Coming Soon  / □ 公開中

[ Coming Soon に変更 ] / [ 公開に切り替える ]

⚠️ 公開に切り替えると、全ユーザーが求人一覧・詳細を閲覧できます。
   元に戻すことも可能です。
```

実装: `PUT /api/settings/admin/site-mode` を呼ぶだけ。

---

### 6-5. lp_sections の扱い

| section_key | Phase1 の扱い |
|-------------|--------------|
| `features` | **残す**（特徴カードはここから取得） |
| その他のセクション | **使わない**（コード側に固定） |

管理画面の「LP編集」ページは、`features` セクションの編集のみに絞る。  
（既存の高度なLP編集 UI は不要。シンプルなテキスト編集のみ）

---

## ⑦ UI固定ルール案

### 7-1. トップページ（/ ）固定ルール

| 要素 | 固定事項 |
|------|---------|
| ナビゲーション | 4リンク構成（求人を探す・大学別・無料相談）＋ CTAボタン2つ。リンク先も固定 |
| ヒーロー | 左テキスト・右画像の2カラム。テキスト3行構成。CTA2ボタン配置 |
| CTAボタン配置 | 1番目: LINE相談（緑）、2番目: 求人一覧（白抜き）。順序・色は変えない |
| 大学別セクション | 12グリッド上限。アイコン+名前の縦カード |
| ピックアップ求人 | 1〜5件の水平グリッド。カードデザインは固定 |
| 実績セクション | 4指標（企業数・求人数・学生数・成功率）の横並び |
| タイムライン | 自動横スクロール。カード幅・高さ固定 |
| FAQセクション | アコーディオン。max-w-3xl センタリング |
| フッター | 4カラム構成（ロゴ・求人リンク・サービス・LINE）。変更不可 |

---

### 7-2. 求人一覧（/jobs）固定ルール

| 要素 | 固定事項 |
|------|---------|
| フィルター | キーワード・業種・勤務形態の3フィルター固定 |
| カードグリッド | 1列（モバイル）/ 2列（タブレット）/ 3列（PC） |
| 求人カード構成 | ロゴ/イニシャル → 企業名 → タイトル → バッジ群 → 時給 → 応募数 → タグ |

---

### 7-3. 求人詳細（/jobs/:slug）固定ルール

| 要素 | 固定事項 |
|------|---------|
| セクション順序 | §5-4 の16セクション順を変えない |
| CTA（応募/相談） | 右サイドバー sticky + セクション13・16 の3箇所に固定配置 |
| 企業ロゴ位置 | FVヘッダー左上固定 |
| hero_image | FV の右側 or 背景。null 時はグラデーション背景で代替 |
| モバイル | サイドバーCTAを非表示 → 下固定のfloating CTA に切替 |

---

### 7-4. 全ページ共通 固定デザイン原則

```
1. カラー変更はしない（primary: #4f6ef7, secondary: #a855f7 を固定）
2. フォントは Noto Sans JP 固定
3. ボタンの角丸は rounded-xl（12px）統一
4. カードは glass クラス（白95%・blur・薄い青ボーダー）統一
5. セクション間の余白は py-20 統一（モバイルは py-12）
6. max-w-7xl / max-w-4xl / max-w-3xl のコンテナ幅は変えない
7. 画像の aspect-ratio は求人カード: 16:9、ヒーロー: 4:3
8. CTA の最優先色は green-500（LINE）、第2優先は primary-500（青）
```

---

### 7-5. 後から修正工数を減らすために今固定すべきUIルール

1. **求人カードのデータ表示順序を固定**: ロゴ → 企業名 → タイトル → バッジ → 時給 → 応募数 の順。後で並べ替えると全カードに影響する
2. **CTA の文言パターンを2種類に固定**: 「この求人に応募する」（応募CTA）と「まず相談する」（相談CTA）。パターンが増えると導線が複雑化する
3. **流入媒体の選択肢を定数として管理**: `source_media` の選択肢はコード内の定数ファイルで管理し、フロントエンドとDBで一致させる
4. **LINE URL の振り分けロジックをAPI側で持つ**: フロント側でLINE URLをハードコードしない。`/api/settings` から動的取得する

---

## ⑧ フェーズ1 実装優先順位

### 優先A（MVP公開のために必須）

| タスク | 対象ファイル | 見積工数 |
|--------|------------|---------|
| Cookie認証の実装（admin_sessions テーブル + api.auth.ts 全書き換え） | src/routes/api.auth.ts, DB migration | 大 |
| adminAuthMiddleware の作成・全管理APIへの適用 | src/middleware/adminAuth.ts, src/index.tsx | 中 |
| comingSoonMiddleware の作成・ルート適用 | src/middleware/comingSoon.ts, src/index.tsx | 小 |
| site_mode の site_settings 追加 + 管理画面公開モード切替UI | DB migration, admin.js | 小 |
| admin.js の localStorage 認証削除 → Cookie認証対応 | public/static/admin.js | 中 |
| students / consultations に source_media カラム追加 | DB migration | 小 |
| 登録・相談フォームに流入媒体選択ステップ追加 | public/static/public.js | 中 |
| LINE URL の大学別分岐ロジック（設定 + フロント表示） | site_settings, public.js | 中 |

---

### 優先B（品質・コンテンツ充実のため必要）

| タスク | 対象ファイル | 見積工数 |
|--------|------------|---------|
| 求人詳細ページを固定16セクション構成に全面リライト | public/static/public.js | 大 |
| jobs テーブルに追加カラム（appeal_points, hero_image_url 等） | DB migration | 小 |
| 求人詳細用フィールドを管理画面編集フォームに追加 | public/static/admin.js | 中 |
| companies テーブルに hero_image_url / service_description 追加 | DB migration | 小 |
| Coming Soon ページの実装 | src/index.tsx, public/static/public.js | 小 |
| トップページのCTA順序変更（LINE相談メイン化） | public/static/public.js | 小 |
| 主要文言管理画面のキー絞り込み（不要キーを非表示） | public/static/admin.js | 小 |

---

### 優先C（後回しにしてよいもの）

| タスク | 備考 |
|--------|------|
| /mypage 実装 | Phase2。現状は簡易 Coming Soon 表示 |
| /universities/:slug 実装 | Phase2。現状は Coming Soon 表示 |
| 応募管理画面 | Phase2。LINE対応で不要 |
| 学生一覧管理画面 | Phase2。DBに蓄積されれば十分 |
| ダッシュボード統計 | Phase2。初期は不要 |
| 画像アップロード（Cloudflare R2） | Phase2。初期はURL文字列入力 |
| 招待コード管理画面 | Phase2。DB直接操作で対応 |
| 無料相談管理画面 | Phase2。メール確認で対応 |
| メール通知 | Phase2。LINE連絡で代替 |

---

## 付録A: 追加マイグレーションファイル構成案

```sql
-- migrations/0007_phase1_changes.sql

-- ① 公開モード設定の追加
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, group_name, display_order)
VALUES
  ('site_mode',            'coming_soon', 'text',    '公開モード',          'system',  0),
  ('coming_soon_title',    '6月公開予定', 'text',    'CSタイトル',          'system',  1),
  ('coming_soon_subtitle', '現在InternBaseは準備中です。公開をお楽しみに。', 'text', 'CSサブタイトル', 'system', 2),
  ('coming_soon_date',     '2025年6月',   'text',    'CS公開予定日',        'system',  3),
  ('line_url_default',     '',            'url',     'LINE URL（デフォルト）', 'line', 0),
  ('line_url_todai',       '',            'url',     'LINE URL（東大）',    'line',    1),
  ('line_url_waseda',      '',            'url',     'LINE URL（早稲田）',  'line',    2),
  ('line_url_keio',        '',            'url',     'LINE URL（慶應）',    'line',    3),
  ('line_url_march',       '',            'url',     'LINE URL（MARCH）',   'line',    4);

-- ② 学生テーブルに流入媒体追加
ALTER TABLE students ADD COLUMN source_media TEXT DEFAULT 'other';

-- ③ 相談テーブルに流入媒体追加
ALTER TABLE consultations ADD COLUMN source_media TEXT DEFAULT 'other';

-- ④ 求人テーブルに詳細ページ用カラム追加
ALTER TABLE jobs ADD COLUMN appeal_points TEXT;
ALTER TABLE jobs ADD COLUMN position_features TEXT;
ALTER TABLE jobs ADD COLUMN onboarding_flow TEXT;
ALTER TABLE jobs ADD COLUMN task_examples TEXT;
ALTER TABLE jobs ADD COLUMN skill_set TEXT;
ALTER TABLE jobs ADD COLUMN career_path TEXT;
ALTER TABLE jobs ADD COLUMN recommended_for TEXT;
ALTER TABLE jobs ADD COLUMN hero_image_url TEXT;
ALTER TABLE jobs ADD COLUMN card_image_url TEXT;

-- ⑤ 企業テーブルに詳細用カラム追加
ALTER TABLE companies ADD COLUMN hero_image_url TEXT;
ALTER TABLE companies ADD COLUMN service_description TEXT;

-- ⑥ 管理者セッションテーブル
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
```

---

## 付録B: source_media 定数定義（フロント・バック共通化用）

```typescript
// src/constants.ts （新規作成）
export const SOURCE_MEDIA_OPTIONS = [
  { value: 'todai_ig',  label: '東大向けInstagram',   line_key: 'line_url_todai' },
  { value: 'waseda_ig', label: '早稲田向けInstagram', line_key: 'line_url_waseda' },
  { value: 'keio_ig',   label: '慶應向けInstagram',   line_key: 'line_url_keio' },
  { value: 'march_ig',  label: 'MARCH向けInstagram',  line_key: 'line_url_march' },
  { value: 'web',       label: 'Webサイトを見て',      line_key: 'line_url_default' },
  { value: 'other_sns', label: 'その他SNS',           line_key: 'line_url_default' },
  { value: 'other',     label: 'その他',              line_key: 'line_url_default' },
] as const;
```

```javascript
// public/static/public.js の先頭に追記（フロント用）
const SOURCE_MEDIA_OPTIONS = [
  { value: 'todai_ig',  label: '東大向けInstagram',   line_key: 'line_url_todai' },
  { value: 'waseda_ig', label: '早稲田向けInstagram', line_key: 'line_url_waseda' },
  { value: 'keio_ig',   label: '慶應向けInstagram',   line_key: 'line_url_keio' },
  { value: 'march_ig',  label: 'MARCH向けInstagram',  line_key: 'line_url_march' },
  { value: 'web',       label: 'Webサイトを見て',      line_key: 'line_url_default' },
  { value: 'other_sns', label: 'その他SNS',           line_key: 'line_url_default' },
  { value: 'other',     label: 'その他',              line_key: 'line_url_default' },
];
// 登録/相談完了後、selectedMedia の line_key から settings[line_key] の URL を取得して誘導
```

---

## 付録C: 画像配置方針まとめ

| 画像の種類 | 管理単位 | DBカラム | 初期運用 | R2移行時期 |
|-----------|---------|---------|---------|-----------|
| ヒーロー右側メイン画像 | LP共通 | site_settings に `hero_image_url` キー追加 | 外部URL or CDN | Phase2 |
| 企業ロゴ | company単位 | `companies.logo_url`（既存） | 外部URL入力 | Phase2 |
| 企業ヒーロー画像 | company単位 | `companies.hero_image_url`（追加） | 外部URL入力 | Phase2 |
| 求人カードサムネ | job単位 | `jobs.card_image_url`（追加） | null → 企業ロゴで代替 | Phase2 |
| 求人詳細FV画像 | job単位 | `jobs.hero_image_url`（追加） | null → グラデーション背景 | Phase2 |
| 大学別カードアイコン | 固定 | コードに FontAwesome アイコン固定 | 変更不要 | 不要 |
| タイムライン小アイコン | 固定 | FontAwesome固定（fa-user-graduate） | 変更不要 | 不要 |
| FAQ/相談イラスト | 固定 | FontAwesome固定 | 変更不要 | 不要 |

**デフォルト画像運用方針:**
- `logo_url` が null → 企業名イニシャル1文字をアイコン表示（既存実装通り）
- `hero_image_url` が null → グラデーション背景（`hero-gradient` クラス）で代替
- `card_image_url` が null → `logo_url` の拡大表示で代替

---

*このドキュメントは実装者が直接コード修正に使えるよう設計しています。*  
*各変更の実装時は PROTOTYPE_SPEC.md と本書を併読してください。*
