# InternBase — フェーズ1 設計変更仕様書（最終版）
> 既存 PROTOTYPE_SPEC.md に対する MVP 方針の差分・修正一覧  
> 作成日: 2026-04-23 | ステータス: **確定版（実装用）**

---

## ① 変更一覧サマリー

| # | 変更カテゴリ | 変更内容の概要 | 理由 | 優先度 |
|---|-------------|---------------|------|--------|
| 1 | 公開モード制御 | Coming Soon モードの追加（site_settings に `site_mode` キー） | 6月公開まで内部整備期間が必要、外部に見せない | **A** |
| 2 | 認証方針 | localStorage → HttpOnly Cookie ベースに変更（admin_sessions テーブル追加） | セキュリティ強化。本番と開発で認証方式を統一 | **A** |
| 3 | 学生登録項目 | フォーム取得項目を6項目に絞る（DBカラムは残す） | 離脱防止・MVP最小化 | **A** |
| 4 | 流入経路管理 | `source_media` カラムを students / consultations に追加 | メディア別LINE振り分けに使う | **A** |
| 5 | 求人詳細構成 | jobs テーブルにカラム追加・詳細ページを16セクション固定構成化 | 詳細ページを固定レイアウトで高品質に見せる | **A** |
| 6 | 管理画面スコープ | **フルスコープ実装**（16カテゴリ全て Phase1 対象） | 运営開始直後から全機能必要。"後回し" 削除 | **A** |
| 7 | フェーズ定義 | Phase1=送客サイト（ただし applications テーブル・応募管理UIは初期から実装） | Phase2・3に向けた基盤を Phase1 で確立 | **A** |
| 8 | /register・/consultation 常時有効化 | Coming Soon 時も有効。設定キー `register_enabled` / `consultation_enabled` を追加 | Coming Soon 期間中に学生リードを獲得 | **A** |
| 9 | UI固定方針 | lp_sections への過依存をやめ、UIレイアウトをコード固定 | 管理コスト削減・デザイン品質担保 | **B** |
| 10 | 画像配置方針 | company / job 単位の image_url を整理・R2は後回し | 初期は URL 文字列で十分 | **B** |
| 11 | LP構成変更 | ヒーローCTAを「LINE相談」メイン・「求人を見る」サブに変更 | 導線設計の明確化 | **B** |
| 12 | /mypage・/universities/:slug | Phase1対象外（Comng Soon 扱い） | MVP優先ページに集中 | **B** |

---

## ② フェーズ定義（確定版）

### Phase 1 — 送客（リード獲得）サイト
- **目的**: 学生との接点作り・LINEへの誘導・求人コンテンツ整備
- **公開ページ**: `/`、`/jobs`、`/jobs/:slug`、`/register`、`/consultation`、`/universities`
- **`/register` / `/consultation`**: Coming Soon 中も **常に有効**
- **applications テーブル・応募管理 UI**: **Phase1 から実装済み**（LINE 経由で応募 → 管理画面で確認）
- **管理画面**: フルスコープ（16カテゴリ全て実装）

### Phase 2 — 応募管理体験の拡充
- **目的**: 学生マイページ、応募状況の可視化、自動ステータス更新
- **追加ページ**: `/mypage`、`/universities/:slug`
- **拡充機能**: 応募管理フロー高度化、学生への通知、詳細フィルタリング
- **R2 画像アップロード**: Phase2 で導入

### Phase 3 — 企業×学生自動マッチング
- **目的**: 企業・学生間の自動通知、進捗共有、マッチング精度向上
- **追加機能**: LINE Bot 連携、自動ステータス通知、マッチングロジック

---

## ③ 既存仕様書（PROTOTYPE_SPEC.md）章ごとの修正点

### 第0章：プロジェクト概要
| 項目 | 対応 |
|------|------|
| サービス名・コンセプト・技術スタック | **そのまま残す** |
| ビジネスモデルの記述 | 「招待コード制 → LINE相談 → 応募 → 内定」は残す。どのメディア経由かを把握する導線管理を追記 |

---

### 第1章：システム構成
**残す:** 全体構成・技術スタック

**追加する（公開モード制御層）:**
```
公開モード制御層（Hono ミドルウェア）
  ├── site_mode = 'coming_soon' の場合
  │     /       → Coming Soon ページ返却
  │     /jobs   → Coming Soon ページ返却
  │     /jobs/:slug  → Coming Soon ページ返却
  │     /universities → Coming Soon ページ返却
  │     /register    → 事前登録フォーム（常に有効）
  │     /consultation → 相談フォーム（常に有効）
  │     /admin       → 通常通り
  └── site_mode = 'public' の場合
        → 通常どおり全ページ表示
```

**常時有効パスの設定キー:**
```
register_enabled    = 'true'  (デフォルト: true)
consultation_enabled = 'true' (デフォルト: true)
```

---

### 第2章：カラーパレット / デザイントークン
**そのまま残す。** UIフレームは固定なので変更なし。

---

### 第3章：データベース設計
→ 「④ DB修正案」で詳述。複数テーブルに変更あり。

---

### 第4章：API エンドポイント
→ 「⑤ API修正案」で詳述。認証・Coming Soon 制御が主な変更。

---

### 第5章：フロントエンドページ構成
**残す:** 全体構成・ルーティング方式（pathname 判定）

**修正する:**
- `initHomePage()` のCTAを「LINE相談メイン」に変更
- `initJobDetailPage()` を固定16セクション構成に全面リライト
- Coming Soon 時の各ページ描画関数を追加
- 登録・相談フォームの最初のステップに流入媒体選択UIを追加

**削る（Phase1対象外）:**
- `initMyPage()` → Phase2以降
- `initUniversityJobsPage()` → Phase2以降

**追加する:**
- `initComingSoonPage()` — 公開予定表示・相談フォームへのCTA
- 流入媒体選択UI（登録・相談フォームの最初のステップ）

---

### 第6章：URL マッピング

**Phase1 対象ページ（実装する）:**

| URL | site_mode = public | site_mode = coming_soon |
|-----|-------------------|------------------------|
| `/` | LP フル表示 | Coming Soon ページ |
| `/jobs` | 求人一覧 | Coming Soon ページ |
| `/jobs/:slug` | 求人詳細 | Coming Soon ページ |
| `/register` | 登録フォーム | **事前登録フォーム（常に有効）** |
| `/consultation` | 相談フォーム | **相談フォーム（常に有効）** |
| `/universities` | 大学別一覧 | Coming Soon ページ |
| `/admin` | 管理画面 | 管理画面（通常） |

**Phase1 対象外（Coming Soon 表示）:**
- `/mypage` → Phase2
- `/universities/:slug` → Phase2

---

### 第7章：ナビゲーション構成
**変更なし**（スマホ/PCレスポンシブ対応は既存通り）

---

### 第8章：状態管理（localStorage）
**削除する（管理画面認証部分）:**
```javascript
localStorage.getItem('admin_token')
localStorage.setItem('admin_token', token)
localStorage.removeItem('admin_token')
```

**残す（公開サイト側は localStorage で継続）:**
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
   (register_enabled / consultation_enabled = 'true' が前提)
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

#### 9.6 応募フロー（Phase1）
```
学生が求人詳細ページ → 「この求人に応募する」CTA クリック
→ applications テーブルに INSERT（status = 'applied'）
→ 応募完了後、LINE 誘導ページへリダイレクト
管理画面の応募管理から状態確認・ステータス更新が可能
```

---

## ④ DB修正案

### 4-1. site_settings に追加するキー

| key | type | 初期値 | 説明 |
|-----|------|--------|------|
| `site_mode` | text | `'coming_soon'` | `'coming_soon'` or `'public'` |
| `register_enabled` | text | `'true'` | 登録フォームを Coming Soon 中も有効にするか |
| `consultation_enabled` | text | `'true'` | 相談フォームを Coming Soon 中も有効にするか |
| `coming_soon_title` | text | `'6月公開予定'` | Coming Soonページのタイトル |
| `coming_soon_subtitle` | text | `'現在準備中です...'` | サブタイトル |
| `coming_soon_date` | text | `'2025年6月'` | 公開予定時期（表示用文字列） |
| `line_url_todai` | url | `''` | 東大向けLINE URL |
| `line_url_waseda` | url | `''` | 早稲田向けLINE URL |
| `line_url_keio` | url | `''` | 慶應向けLINE URL |
| `line_url_march` | url | `''` | MARCH向けLINE URL |
| `line_url_default` | url | `''` | デフォルトLINE URL（既存 `line_url` を改名） |

> 既存の `line_url` キーは `line_url_default` に **改名**（後方互換のため移行スクリプト必要）。

---

### 4-2. students テーブル修正

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

### 4-3. consultations テーブル修正

#### 新規追加カラム

```sql
ALTER TABLE consultations ADD COLUMN source_media TEXT DEFAULT 'other';
-- 値: students と同じ選択肢
```

---

### 4-4. jobs テーブル修正（求人詳細ページ固定構成対応）

#### 追加カラム（全て保持）

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

### 4-5. companies テーブル修正

#### 追加カラム（全て保持）

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

### 4-6. 既存テーブルの役割（全て Phase1 で活用）

| テーブル | Phase1の扱い | 備考 |
|---------|-------------|------|
| `site_settings` | **活用・拡張** | site_mode / LINE URL 複数 / register_enabled を追加 |
| `lp_sections` | **範囲を絞って活用** | `features` セクションのみ使用。それ以外はコード固定 |
| `faqs` | **そのまま活用** | 管理画面から編集可 |
| `announcements` | **そのまま活用** | 管理画面から編集可 |
| `success_stories` | **そのまま活用** | タイムライン管理 |
| `featured_jobs` | **そのまま活用** | ピックアップ求人管理 |
| `university_tags` | **そのまま活用** | 大学タグ管理（/universities 用） |
| `job_university_tags` | **そのまま活用** | 求人×大学タグ紐付け |
| `admins` | **そのまま活用** | Cookie認証に変更後も構造は同じ |
| `applications` | **Phase1 から活用** | 応募管理・ステータス管理 |
| `invite_codes` | **Phase1 から活用** | 管理画面で発行・管理 |
| `students` | **Phase1 から活用** | 一覧・詳細表示 |
| `consultations` | **Phase1 から活用** | 相談管理 |
| `admin_sessions` | **新規追加** | Cookie ベースセッション管理 |

---

## ⑤ API修正案

### 5-1. 認証API (`/api/auth`) の変更

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
  廃止 → GET /api/auth/admin/me に統合
```

#### Hono ミドルウェア設計

```typescript
// src/middleware/adminAuth.ts
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'

export const adminAuthMiddleware = createMiddleware(async (c, next) => {
  const session = getCookie(c, 'session')
  if (!session) return c.json({ success: false, error: 'Unauthorized' }, 401)

  // D1 でセッション検証
  const row = await c.env.DB.prepare(
    `SELECT a.id, a.name, a.role FROM admin_sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(session).first()
  if (!row) return c.json({ success: false, error: 'Unauthorized' }, 401)

  c.set('admin', row)
  await next()
})

// src/index.tsx への適用
app.use('/api/*/admin*', adminAuthMiddleware)
app.use('/api/auth/admin/me', adminAuthMiddleware)
```

#### admin_sessions テーブル

```sql
CREATE TABLE IF NOT EXISTS admin_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,   -- crypto.randomUUID() で生成
  expires_at  DATETIME NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
```

---

### 5-2. Coming Soon ミドルウェア

```typescript
// src/middleware/comingSoon.ts
import { createMiddleware } from 'hono/factory'

const ALWAYS_ALLOWED = ['/register', '/consultation', '/admin', '/api/']

export const comingSoonMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.path
  if (ALWAYS_ALLOWED.some(p => path.startsWith(p))) return await next()

  // site_mode をDBから取得
  const setting = await c.env.DB.prepare(
    `SELECT setting_value FROM site_settings WHERE setting_key = 'site_mode'`
  ).first()
  const mode = (setting as any)?.setting_value ?? 'coming_soon'

  if (mode === 'coming_soon') {
    return c.html(getComingSoonHTML())
  }
  await next()
})
```

> `/register` `/consultation` は常に通過。`register_enabled` / `consultation_enabled` が `'false'` になった場合のみ制限する（デフォルトは `'true'`）。

---

### 5-3. 新規追加エンドポイント

| Method | Path | 用途 |
|--------|------|------|
| GET | `/api/auth/admin/me` | ログイン状態確認（Cookie検証） |
| POST | `/api/auth/admin/logout` | ログアウト（Cookie削除） |
| GET | `/api/settings/site-mode` | 現在の公開モード取得 |
| PUT | `/api/settings/admin/site-mode` | 公開モード切替（管理用） |
| GET | `/api/students/admin` | 学生一覧（管理用） |
| GET | `/api/students/admin/:id` | 学生詳細（管理用） |
| PUT | `/api/students/admin/:id` | 学生情報更新 |
| GET | `/api/applications/admin` | 応募一覧（管理用・フィルタ付き） |
| PUT | `/api/applications/admin/:id` | 応募ステータス更新 |
| POST | `/api/applications` | 学生が応募（公開用） |
| GET | `/api/dashboard/admin` | ダッシュボード統計 |

---

### 5-4. 変更が必要な既存エンドポイント

| エンドポイント | 変更内容 |
|--------------|---------|
| `POST /api/auth/admin/login` | Cookie 返却に変更。JSON に token を含めない |
| `POST /api/auth/admin/verify` | 廃止 → `GET /api/auth/admin/me` に統合 |
| `POST /api/students/register` | `source_media` フィールドを受け取るよう追加 |
| `POST /api/consultation` | `source_media` フィールドを受け取るよう追加 |
| 全管理API `*/admin*` | adminAuthMiddleware を適用（現状は認証なし） |

---

### 5-5. Cookie認証対応の影響範囲

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
- Axios リクエストヘッダーから Authorization 削除
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

## ⑥ 公開画面修正案

### 6-1. Coming Soon ページ仕様

```
URL: 全ページ（site_mode = coming_soon 時）
表示内容:
  - InternBase ロゴ
  - 「〇月公開予定」（site_settings.coming_soon_date）
  - タイトル（site_settings.coming_soon_title）
  - サブテキスト（site_settings.coming_soon_subtitle）
  - 「事前に無料相談する」ボタン → /consultation
  - 「事前登録する」ボタン → /register
フッター: シンプルなコピーライトのみ
```

---

### 6-2. トップページ（/ ） 変更点

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
| 招待コード×相談の2カラムセクション | 「招待コード登録」+「LINE相談」（重複あり） | 「流入媒体別LINE導線」に変更（重複削除） |

#### 削除する箇所
- ナビゲーション「無料相談」項目の重複（1つに統合）
- ヒーロー直下の「招待コード登録」セクションの重複配置
- `lp_sections` の features 以外のセクション連携（コード固定に移行）

#### 追加する箇所
- 「あなたの大学はどちらですか？」の大学別LINE誘導ブロック
  （site_mode = public の場合のみ表示）

---

### 6-3. 求人一覧ページ（/jobs）変更点

**変更なし（既存仕様を維持）**
ただし Coming Soon 時は表示されない。

---

### 6-4. 求人詳細ページ（/jobs/:slug）固定16セクション構成

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
│     ・「この求人に応募する」→ 応募処理  │
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
> モバイルではサイドバーを非表示にし、画面下部にfloating CTAを配置。

---

### 6-5. 登録ページ（/register）変更点

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

### 6-6. 相談ページ（/consultation）変更点

フォームの最初に **流入媒体選択** を追加（登録フォームと同じ選択肢）。
それ以外の構成は変更なし。

---

### 6-7. /mypage・/universities/:slug

**Phase1では実装しない。** 該当URLアクセス時は Coming Soon 相当の簡易画面を表示。

---

## ⑦ 管理画面修正案（フルスコープ）

### 7-1. Phase1 管理画面の全機能（16カテゴリ・全て実装対象）

| # | 管理対象 | 既存機能 | Phase1変更 |
|---|---------|---------|-----------|
| 1 | **ダッシュボード** | 統計・グラフ | 学生数・応募数・相談数・閲覧数。期間切替（週/月/全期間）あり |
| 2 | **企業管理** | CRUD | hero_image_url / service_description を編集フォームに追加 |
| 3 | **求人管理** | CRUD + 大学タグ | 詳細ページ追加フィールド（appeal_points 等）をフォームに追加 |
| 4 | **学生一覧・詳細** | なし → **Phase1実装** | 登録学生の一覧・source_media・ステータス確認 |
| 5 | **応募管理・ステータス更新** | なし → **Phase1実装** | 応募一覧・ステータス変更（applied→reviewing→offered等）・メモ |
| 6 | **招待コード管理** | なし → **Phase1実装** | コード発行・一覧・使用状況確認 |
| 7 | **無料相談管理** | なし → **Phase1実装** | 相談一覧・source_media確認・対応ステータス管理 |
| 8 | **FAQ管理** | CRUD | そのまま残す |
| 9 | **お知らせ管理** | CRUD | そのまま残す |
| 10 | **主要文言管理** | site_settings 編集 | 対象キーを絞って整理（下記参照） |
| 11 | **LP編集** | lp_sections CRUD | featuresセクションのみ編集可に絞る |
| 12 | **タイムライン** | success_stories CRUD | そのまま残す |
| 13 | **ピックアップ求人** | featured_jobs CRUD | そのまま残す（上限5件） |
| 14 | **大学タグ管理** | university_tags CRUD | そのまま残す |
| 15 | **公開モード切替** | なし → **新規追加** | site_mode を ON/OFF するUI |
| 16 | **管理者ログイン認証** | localStorage → **Cookie認証** | HttpOnly Cookie ベース認証に移行 |

---

### 7-2. ダッシュボード統計仕様

```
表示指標:
  - 登録学生数（合計 / 今週 / 今月）
  - 応募数（合計 / 今週 / 今月）
  - 無料相談数（合計 / 今週 / 今月）
  - 求人閲覧数（求人別ランキング形式）
  - source_media 別の流入比率グラフ（円グラフ or 棒グラフ）

期間フィルター: 今週 / 今月 / 全期間

API: GET /api/dashboard/admin
  Response: {
    students: { total, this_week, this_month },
    applications: { total, this_week, this_month },
    consultations: { total, this_week, this_month },
    source_media_stats: [{ media, count }],
    popular_jobs: [{ slug, title, applicant_count }]
  }
```

---

### 7-3. 応募管理仕様

```
一覧表示:
  - 学生名・大学・応募求人・応募日・現ステータス
  - フィルター: ステータス別 / 求人別 / 日付範囲

ステータス遷移:
  applied → reviewing → interview1 → interview2 → interview3
                      → offered → accepted / rejected / withdrawn

操作:
  - ステータス変更（ドロップダウン）
  - 管理者メモの入力
  - 次アクション・次アクション日時の設定
  - 面接日時の記録
```

---

### 7-4. 招待コード管理仕様

```
機能:
  - 新規コード発行（code, description, max_uses, expires_at を設定）
  - コード一覧（使用状況・残り回数・有効期限）
  - 無効化（is_active を false に）
  - code_type: 'admin'（管理者発行）/ 'student'（学生紹介）/ 'partner'

API:
  GET /api/invites/admin        → コード一覧
  POST /api/invites/admin       → 新規発行
  PUT /api/invites/admin/:id    → 編集・無効化
  DELETE /api/invites/admin/:id → 削除
```

---

### 7-5. 無料相談管理仕様

```
一覧表示:
  - 相談者名・大学・学年・相談内容・source_media・登録日・ステータス
  - フィルター: ステータス別 / source_media 別

ステータス:
  pending → contacted → completed / cancelled

操作:
  - ステータス変更
  - 管理者メモ入力
```

---

### 7-6. 主要文言管理（site_settings）の対象キー

Phase1 管理画面から変更できる文言キーを以下に限定する：

```
【Coming Soon 設定】
  site_mode              ← 公開 / 非公開 の切替（トグルUI）
  register_enabled       ← 登録フォームの有効/無効
  consultation_enabled   ← 相談フォームの有効/無効
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

### 7-7. 公開モード切替UI

```
【公開モード設定】（ダッシュボードのトップ or 専用セクション）

現在のモード: ■ Coming Soon  / □ 公開中

[ Coming Soon に変更 ] / [ 公開に切り替える ]

⚠️ 公開に切り替えると、全ユーザーが求人一覧・詳細を閲覧できます。
   元に戻すことも可能です。
```

実装: `PUT /api/settings/admin/site-mode` を呼ぶだけ。

---

### 7-8. lp_sections の扱い

| section_key | Phase1 の扱い |
|-------------|--------------|
| `features` | **残す**（特徴カードはここから取得） |
| その他のセクション | **使わない**（コード側に固定） |

管理画面の「LP編集」ページは、`features` セクションの編集のみに絞る。

---

## ⑧ UI固定ルール

### 8-1. トップページ（/ ）固定ルール

| 要素 | 固定事項 |
|------|---------|
| ナビゲーション | 「求人を探す」「大学別」「無料相談」の3リンク + CTAボタン2つ（重複なし） |
| ヒーロー | 左テキスト・右画像の2カラム。テキスト3行構成。CTA2ボタン配置 |
| CTAボタン配置 | 1番目: LINE相談（緑）、2番目: 求人一覧（白抜き）。順序・色は変えない |
| 大学別セクション | 12グリッド上限。アイコン+名前の縦カード |
| ピックアップ求人 | 1〜5件の水平グリッド。カードデザインは固定 |
| 実績セクション | 4指標（企業数・求人数・学生数・成功率）の横並び |
| タイムライン | 自動横スクロール。カード幅・高さ固定 |
| FAQセクション | アコーディオン。max-w-3xl センタリング |
| フッター | 4カラム構成（ロゴ・求人リンク・サービス・LINE）。変更不可 |

---

### 8-2. 求人一覧（/jobs）固定ルール

| 要素 | 固定事項 |
|------|---------|
| フィルター | キーワード・業種・勤務形態の3フィルター固定 |
| カードグリッド | 1列（モバイル）/ 2列（タブレット）/ 3列（PC） |
| 求人カード構成 | ロゴ/イニシャル → 企業名 → タイトル → バッジ群 → 時給 → 応募数 → タグ |

---

### 8-3. 求人詳細（/jobs/:slug）固定ルール

| 要素 | 固定事項 |
|------|---------|
| セクション順序 | §6-4 の16セクション順を変えない |
| CTA（応募/相談） | 右サイドバー sticky + セクション13・16 の3箇所に固定配置 |
| 企業ロゴ位置 | FVヘッダー左上固定 |
| hero_image | FV の右側 or 背景。null 時はグラデーション背景で代替 |
| モバイル | サイドバーCTAを非表示 → 下固定のfloating CTA に切替 |

---

### 8-4. 全ページ共通 固定デザイン原則

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

### 8-5. 後から修正工数を減らすために今固定すべきUIルール

1. **求人カードのデータ表示順序を固定**: ロゴ → 企業名 → タイトル → バッジ → 時給 → 応募数 の順
2. **CTA の文言パターンを2種類に固定**: 「この求人に応募する」（応募CTA）と「まず相談する」（相談CTA）
3. **流入媒体の選択肢を定数として管理**: `source_media` の選択肢はコード内の定数ファイルで管理し、フロントエンドとDBで一致させる
4. **LINE URL の振り分けロジックをAPI側で持つ**: フロント側でLINE URLをハードコードしない。`/api/settings` から動的取得する

---

## ⑨ フェーズ1 実装優先順位（確定版）

### 優先A（MVP公開のために必須）

| タスク | 対象ファイル | 見積工数 |
|--------|------------|---------|
| Cookie認証の実装（admin_sessions テーブル + api.auth.ts 全書き換え） | src/routes/api.auth.ts, DB migration | 大 |
| adminAuthMiddleware の作成・全管理APIへの適用 | src/middleware/adminAuth.ts, src/index.tsx | 中 |
| comingSoonMiddleware の作成・ルート適用（/register・/consultation 常時通過） | src/middleware/comingSoon.ts, src/index.tsx | 小 |
| site_mode + register_enabled + consultation_enabled の site_settings 追加 | DB migration | 小 |
| 管理画面 公開モード切替UI | public/static/admin.js | 小 |
| admin.js の localStorage 認証削除 → Cookie認証対応 | public/static/admin.js | 中 |
| students / consultations に source_media カラム追加 | DB migration | 小 |
| 登録・相談フォームに流入媒体選択ステップ追加 | public/static/public.js | 中 |
| LINE URL の大学別分岐ロジック（設定 + フロント表示） | site_settings, public.js | 中 |
| **学生一覧・詳細 管理画面の実装** | public/static/admin.js, src/routes/ | 中 |
| **応募管理・ステータス更新 管理画面の実装** | public/static/admin.js, src/routes/api.applications.ts | 大 |
| **招待コード管理 管理画面の実装** | public/static/admin.js, src/routes/ | 中 |
| **無料相談管理 管理画面の実装** | public/static/admin.js, src/routes/ | 中 |
| **ダッシュボード統計の実装** | public/static/admin.js, src/routes/api.dashboard.ts | 中 |
| 求人詳細ページを固定16セクション構成に全面リライト | public/static/public.js | 大 |
| jobs テーブルに追加カラム（appeal_points, hero_image_url 等） | DB migration | 小 |

---

### 優先B（品質・コンテンツ充実のため必要）

| タスク | 対象ファイル | 見積工数 |
|--------|------------|---------|
| 求人詳細用フィールドを管理画面編集フォームに追加 | public/static/admin.js | 中 |
| companies テーブルに hero_image_url / service_description 追加 | DB migration | 小 |
| 企業管理フォームへの追加フィールド反映 | public/static/admin.js | 小 |
| Coming Soon ページの実装 | src/index.tsx, public/static/public.js | 小 |
| トップページのCTA順序変更（LINE相談メイン化）+ ナビ重複修正 | public/static/public.js, src/index.tsx | 小 |
| 主要文言管理画面のキー絞り込み（不要キーを非表示） | public/static/admin.js | 小 |
| ダッシュボードグラフ（source_media 比率・登録推移） | public/static/admin.js | 中 |
| 応募フロー（学生が求人詳細から応募 → applications INSERT） | public/static/public.js | 中 |

---

### 優先C（後回しにしてよいもの）

| タスク | 備考 |
|--------|------|
| /mypage 実装 | Phase2。現状は簡易 Coming Soon 表示 |
| /universities/:slug 実装 | Phase2。現状は Coming Soon 表示 |
| R2 画像アップロード | Phase2。初期はURL文字列入力 |
| メール通知 | Phase2。LINE連絡で代替 |
| LINE Bot 連携 | Phase3 |
| 自動マッチングロジック | Phase3 |

---

## 付録A: 追加マイグレーションファイル構成案

```sql
-- migrations/0007_phase1_changes.sql

-- ① 公開モード設定の追加
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, group_name, display_order)
VALUES
  ('site_mode',             'coming_soon', 'text', '公開モード',             'system', 0),
  ('register_enabled',      'true',        'text', '登録フォーム有効化',      'system', 1),
  ('consultation_enabled',  'true',        'text', '相談フォーム有効化',      'system', 2),
  ('coming_soon_title',     '6月公開予定', 'text', 'CSタイトル',             'system', 3),
  ('coming_soon_subtitle',  '現在InternBaseは準備中です。公開をお楽しみに。', 'text', 'CSサブタイトル', 'system', 4),
  ('coming_soon_date',      '2025年6月',   'text', 'CS公開予定日',           'system', 5),
  ('line_url_default',      '',            'url',  'LINE URL（デフォルト）',  'line',   0),
  ('line_url_todai',        '',            'url',  'LINE URL（東大）',       'line',   1),
  ('line_url_waseda',       '',            'url',  'LINE URL（早稲田）',     'line',   2),
  ('line_url_keio',         '',            'url',  'LINE URL（慶應）',       'line',   3),
  ('line_url_march',        '',            'url',  'LINE URL（MARCH）',      'line',   4);

-- ② 学生テーブルに流入媒体追加
ALTER TABLE students ADD COLUMN source_media TEXT DEFAULT 'other';

-- ③ 相談テーブルに流入媒体追加
ALTER TABLE consultations ADD COLUMN source_media TEXT DEFAULT 'other';

-- ④ 求人テーブルに詳細ページ用カラム追加（全て保持）
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

## 付録D: 応募フロー（Phase1）

```
【学生側フロー】
求人詳細ページ
  ↓ 「この求人に応募する」クリック
  ↓ 未登録 → /register へリダイレクト
  ↓ 登録済み → 応募確認モーダル
  ↓ POST /api/applications { student_id, job_id, motivation(任意) }
  ↓ applications テーブルへ INSERT（status = 'applied'）
  ↓ 応募完了 → LINE誘導（source_media に応じたURL）

【管理画面側フロー】
/admin 応募管理タブ
  ↓ 一覧表示（学生名・求人・応募日・ステータス）
  ↓ ステータス変更（applied → reviewing → interview1 → offered → accepted）
  ↓ メモ・次アクション日時・面接日時 の記録
```

---

## 付録E: ナビゲーション重複修正（最終版）

現状の重複項目:
- ヘッダーナビ「無料相談」が2箇所に存在 → **1箇所に統合**
- ヒーロー直下セクション「招待コード登録」が独立して配置され、ヒーローCTAと重複 → **削除**

修正後のナビゲーション構成（PC）:
```
InternBase ロゴ | 求人を探す | 大学別求人 | 無料相談 | [事前登録] [LINE相談]
```

修正後のナビゲーション構成（モバイルメニュー）:
```
求人を探す
大学別求人
無料相談
事前登録する
LINEで無料相談
```

---

*このドキュメントは実装者が直接コード修正に使えるよう設計しています。*  
*各変更の実装時は PROTOTYPE_SPEC.md と本書を併読してください。*  
*「後回し」「Phase2」の記載がない管理機能は全て Phase1 実装対象です。*
