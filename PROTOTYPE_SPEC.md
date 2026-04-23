# InternBase — プロトタイプ仕様書
> 他AIツールへの引き継ぎ・高精度実装用ドキュメント  
> 最終更新: 2026-04-23

---

## 0. プロジェクト概要

| 項目 | 内容 |
|------|------|
| サービス名 | **InternBase** |
| コンセプト | 高学歴大学生（東大・早慶・MARCH）向け厳選長期インターン求人サイト |
| ターゲット | 大学1〜4年生（就活差別化意識が高い層） |
| ビジネスモデル | 招待コード制（クローズドβ）+ LINEで無料相談 → 応募 → 内定 |
| デプロイ先 | Cloudflare Pages（Edge Runtime） |
| フレームワーク | **Hono (TypeScript)** + Cloudflare D1 (SQLite) |
| フロントエンド | Vanilla JS + Tailwind CSS (CDN) + FontAwesome (CDN) |

---

## 1. システム構成

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Pages (Edge)                            │
│                                                     │
│  src/index.tsx  ← Hono アプリケーション             │
│  ├── API ルーティング (/api/*)                       │
│  └── HTML 生成 (SSR-like テンプレート)               │
│                                                     │
│  public/static/                                     │
│  ├── public.js   ← 公開サイト JS (~1300行)           │
│  └── admin.js    ← 管理画面 JS (~2600行)             │
│                                                     │
│  Cloudflare D1 (SQLite)                             │
│  └── 全データ永続化                                  │
└─────────────────────────────────────────────────────┘
```

### 技術スタック詳細

```
Runtime     : Cloudflare Workers (Web API準拠、Node.js APIなし)
Framework   : Hono v4
DB          : Cloudflare D1 (SQLite互換)
CSS         : Tailwind CSS v3 (CDN: https://cdn.tailwindcss.com)
Icons       : FontAwesome 6.4.0 (CDN: jsdelivr)
HTTP Client : Axios 1.6.0 (CDN: jsdelivr)
Font        : Noto Sans JP (Google Fonts)
Build       : Vite + @hono/vite-cloudflare-pages
```

---

## 2. カラーパレット / デザイントークン

### 公開サイト（白ベース）

```javascript
// tailwind.config の colors 拡張
colors: {
  primary: {
    50:  '#f0f4ff',
    100: '#e0e9ff',
    400: '#6b8afd',
    500: '#4f6ef7',  // メインカラー（青）
    600: '#3b5ce6',
    700: '#2945d4',
    900: '#1a2f99'
  },
  purple: {
    50:  '#faf5ff',
    100: '#f3e8ff',
    400: '#c084fc',
    500: '#a855f7',  // サブカラー（紫）
    600: '#9333ea',
    700: '#7e22ce'
  },
  dark: {
    800: '#0f1629',
    900: '#080d1a',
    950: '#040810'
  }
}
// body: bg-white text-gray-900
```

### 管理画面（ダークテーマ）

```javascript
colors: {
  primary: { 500: '#4f6ef7', 600: '#3b5ce6', 700: '#2945d4' },
  dark: { 700: '#1a2235', 800: '#0f1629', 900: '#080d1a' }
}
// body: bg-dark-900 text-white
```

### 共通 CSS ユーティリティクラス（公開サイト）

```css
.glass         { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
                 border: 1px solid rgba(79,110,247,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.gradient-text { background: linear-gradient(135deg, #4f6ef7, #a855f7);
                 -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-gradient { background: radial-gradient(ellipse at 20% 50%, rgba(79,110,247,0.12) 0%, transparent 60%),
                              radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 50%),
                              linear-gradient(to bottom, #f8faff, #ffffff); }
.card-hover    { transition: all 0.3s ease; }
.card-hover:hover { transform: translateY(-4px); border-color: rgba(79,110,247,0.5);
                    box-shadow: 0 12px 24px rgba(79,110,247,0.12); }
.tag           { background: rgba(79,110,247,0.12); border: 1px solid rgba(79,110,247,0.3);
                 color: #2945d4; font-weight: 500; }
.fade-in       { animation: fadeIn 0.6s ease-out; }
```

---

## 3. データベース設計（Cloudflare D1 / SQLite）

### テーブル一覧

| テーブル名 | 用途 |
|-----------|------|
| `companies` | 企業情報 |
| `jobs` | 求人情報 |
| `students` | 登録学生 |
| `applications` | 応募情報 |
| `invite_codes` | 招待コード |
| `consultations` | 無料相談申込 |
| `admins` | 管理者ログイン |
| `site_settings` | サイト設定（key-value） |
| `lp_sections` | LPセクション設定（JSON） |
| `faqs` | よくある質問 |
| `announcements` | お知らせバナー |
| `success_stories` | 内定者タイムライン |
| `featured_jobs` | ピックアップ求人（最大5件） |
| `university_tags` | 大学タグマスタ |
| `job_university_tags` | 求人×大学タグ（中間テーブル） |

### 主要テーブル定義

#### companies
```sql
CREATE TABLE companies (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,        -- URL用 例: abc-corp
  logo_url       TEXT,
  industry       TEXT NOT NULL,               -- 例: IT・SaaS, HR・人材
  size           TEXT,
  founded_year   INTEGER,
  website_url    TEXT,
  description    TEXT NOT NULL,
  mission        TEXT,
  culture        TEXT,
  office_location TEXT,
  office_access  TEXT,
  status         TEXT DEFAULT 'published'     -- published / draft / archived
                 CHECK(status IN ('published','draft','archived')),
  display_order  INTEGER DEFAULT 0,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### jobs
```sql
CREATE TABLE jobs (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id           INTEGER NOT NULL REFERENCES companies(id),
  title                TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  job_type             TEXT DEFAULT 'internship',
  catch_copy           TEXT,
  description          TEXT NOT NULL,
  work_content         TEXT NOT NULL,
  requirements         TEXT,
  preferred_requirements TEXT,
  highlights           TEXT,    -- JSON: [{icon, title, body}, ...]
  growth_points        TEXT,
  work_hours           TEXT,    -- 例: 週3日〜, 1日3時間〜
  work_days            TEXT,
  work_location        TEXT,
  work_style           TEXT CHECK(work_style IN ('onsite','remote','hybrid')),
  remote_available     INTEGER DEFAULT 0,
  hourly_wage_min      INTEGER,
  hourly_wage_max      INTEGER,
  wage_note            TEXT,
  target_grade         TEXT,    -- 例: 大学1〜4年生
  university_level     TEXT,
  min_hours_per_month  INTEGER,
  max_hours_per_month  INTEGER,
  selection_flow       TEXT,
  tags                 TEXT,    -- JSON: ["マーケ", "Excel"]
  status               TEXT DEFAULT 'published'
                       CHECK(status IN ('published','draft','closed')),
  visibility           TEXT DEFAULT 'public'
                       CHECK(visibility IN ('public','members','draft','closed')),
  display_order        INTEGER DEFAULT 0,
  applicant_count      INTEGER DEFAULT 0,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> **visibility の使い分け**
> - `public`   → 未登録ユーザーにも表示
> - `members`  → 登録学生のみ表示（会員限定求人）

#### students
```sql
CREATE TABLE students (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  last_name             TEXT NOT NULL,
  first_name            TEXT NOT NULL,
  last_name_kana        TEXT,
  first_name_kana       TEXT,
  email                 TEXT UNIQUE NOT NULL,
  phone                 TEXT,
  university            TEXT NOT NULL,
  faculty               TEXT,
  department            TEXT,
  grade                 INTEGER NOT NULL CHECK(grade BETWEEN 1 AND 4),
  graduation_year       INTEGER,
  line_user_id          TEXT,
  line_display_name     TEXT,
  invite_code_id        INTEGER REFERENCES invite_codes(id),
  invite_code_used      TEXT,
  pr_text               TEXT,
  status                TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
  admin_memo            TEXT,
  -- 招待コード関連（拡張）
  my_invite_code        TEXT UNIQUE,           -- 自分が発行できる紹介コード
  my_invite_code_uses   INTEGER DEFAULT 0,
  referral_count        INTEGER DEFAULT 0,
  referred_by_student_id INTEGER REFERENCES students(id),
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### applications
```sql
CREATE TABLE applications (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id        INTEGER NOT NULL REFERENCES students(id),
  job_id            INTEGER NOT NULL REFERENCES jobs(id),
  status            TEXT DEFAULT 'applied'
    CHECK(status IN (
      'applied',     -- 応募済み
      'reviewing',   -- 書類選考中
      'interview1',  -- 1次面接
      'interview2',  -- 2次面接
      'interview3',  -- 最終面接
      'offered',     -- 内定
      'accepted',    -- 内定承諾
      'rejected',    -- 不採用
      'withdrawn'    -- 辞退
    )),
  motivation        TEXT,
  available_hours   TEXT,
  admin_memo        TEXT,
  next_action       TEXT,
  next_action_date  DATE,
  interview_date    DATETIME,
  confirmation_sent INTEGER DEFAULT 0,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, job_id)
);
```

#### invite_codes
```sql
CREATE TABLE invite_codes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT UNIQUE NOT NULL,
  description  TEXT,
  max_uses     INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  issued_by    TEXT DEFAULT 'admin',
  expires_at   DATETIME,
  is_active    INTEGER DEFAULT 1,
  -- 拡張列
  code_type    TEXT DEFAULT 'admin'
               CHECK(code_type IN ('admin','student','partner')),
  student_id   INTEGER REFERENCES students(id),  -- 学生が発行する場合
  partner_name TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### site_settings (key-value)
```sql
CREATE TABLE site_settings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key   TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type  TEXT DEFAULT 'text'
                CHECK(setting_type IN ('text','url','html','json','boolean','number')),
  label         TEXT NOT NULL,
  description   TEXT,
  group_name    TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**主要設定キー一覧:**

| key | 説明 | 例 |
|-----|------|-----|
| `site_name` | サイト名 | InternBase |
| `hero_badge_text` | ヒーローバッジ | 高学歴大学生向け・厳選求人のみ掲載 |
| `hero_title_line1` | ヒーロータイトル1行目 | 圧倒的な |
| `hero_title_line2` | ヒーロータイトル2行目 | 実務経験を、 |
| `hero_title_line3` | ヒーロータイトル3行目 | 今すぐ始めよう。 |
| `hero_subtitle` | ヒーローサブタイトル | 〜本物のスキルと実績を手に入れろ。 |
| `hero_cta1_text` | CTAボタン1テキスト | 求人を探す |
| `hero_cta2_text` | CTAボタン2テキスト | LINEで無料相談 |
| `line_url` | LINE公式アカウントURL | https://lin.ee/xxxxx |
| `stat_companies` | 掲載企業数（表示用） | 50 |
| `stat_jobs` | 求人数（表示用） | 200 |
| `stat_students` | 登録学生数（表示用） | 1000 |
| `stat_success_rate` | 就活成功率（表示用） | 95 |
| `members_banner_enabled` | 会員限定バナー表示 | true |
| `members_banner_title` | バナータイトル | 登録者限定！非公開求人あり |
| `members_banner_text` | バナー本文 | 登録するだけで見られる特別求人... |
| `members_banner_btn` | バナーボタン | 今すぐ登録して確認する |
| `feature_section_title` | 特徴セクションタイトル | 選ばれる理由 |
| `feature_section_subtitle` | 特徴セクションサブタイトル | 〜本質的な成長環境を提供します |
| `student_referral_enabled` | 学生紹介機能ON/OFF | true |
| `student_referral_reward` | 紹介特典説明文 | 友人に共有して特典をゲットしよう |
| `contact_email` | 問い合わせメール | contact@internbase.jp |

#### lp_sections (LP動的コンテンツ)
```sql
CREATE TABLE lp_sections (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key  TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,
  content      TEXT NOT NULL,  -- JSON形式
  is_visible   INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**section_key: 'features' の content JSON 形式:**
```json
[
  {
    "icon": "shield-alt",
    "color": "primary",
    "title": "厳選された求人のみ",
    "body": "運営が実際に訪問・審査した企業の求人のみ掲載しています。"
  },
  {
    "icon": "fab fa-line",
    "color": "green",
    "title": "LINEでサポート",
    "body": "応募から内定まで、公式LINEでプロがサポートします。"
  }
]
```

#### university_tags
```sql
CREATE TABLE university_tags (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT UNIQUE NOT NULL,   -- 例: 東京大学
  slug         TEXT UNIQUE NOT NULL,   -- 例: todai
  description  TEXT,
  is_visible   INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### job_university_tags (中間テーブル)
```sql
CREATE TABLE job_university_tags (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id            INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  university_tag_id INTEGER NOT NULL REFERENCES university_tags(id) ON DELETE CASCADE,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, university_tag_id)
);
```

---

## 4. API エンドポイント一覧

### ベースURL: `/api`

#### 4.1 求人 (`/api/jobs`)

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| GET | `/jobs` | なし | 求人一覧（フィルタ可） |
| GET | `/jobs/:slug` | なし | 求人詳細 |
| GET | `/jobs/admin/all` | 管理者 | 全求人（管理用） |
| POST | `/jobs/admin` | 管理者 | 求人作成 |
| PUT | `/jobs/admin/:id` | 管理者 | 求人更新 |
| DELETE | `/jobs/admin/:id` | 管理者 | 求人削除 |

**GET /api/jobs クエリパラメータ:**
```
q           : キーワード検索（タイトル・説明・企業名）
industry    : 業種フィルタ（例: IT・SaaS）
work_style  : 勤務形態（onsite / remote / hybrid）
student_id  : 学生ID（指定時 → members 求人も表示）
members=1   : 会員限定求人のみ取得
```

**GET /api/jobs レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company_id": 1,
      "title": "マーケティングインターン",
      "slug": "marketing-intern-abc",
      "catch_copy": "〜本物のマーケターになれる〜",
      "work_style": "hybrid",
      "remote_available": 1,
      "hourly_wage_min": 1200,
      "hourly_wage_max": 1500,
      "visibility": "public",
      "status": "published",
      "tags": "[\"マーケ\", \"SNS\"]",
      "applicant_count": 5,
      "company_name": "ABC株式会社",
      "company_logo": null,
      "company_industry": "IT・SaaS",
      "company_slug": "abc-corp"
    }
  ],
  "members_job_count": 12
}
```

**POST /api/jobs/admin リクエスト Body:**
```json
{
  "company_id": 1,
  "title": "タイトル",
  "slug": "unique-slug",
  "catch_copy": "キャッチコピー",
  "description": "求人の説明",
  "work_content": "業務内容",
  "requirements": "求める人材",
  "preferred_requirements": "歓迎スキル",
  "highlights": [{"icon": "🚀", "title": "魅力", "body": "説明"}],
  "growth_points": "身につくスキル",
  "work_hours": "週3日〜, 1日3時間〜",
  "work_days": "月〜金",
  "work_location": "東京都渋谷区",
  "work_style": "hybrid",
  "remote_available": true,
  "hourly_wage_min": 1200,
  "hourly_wage_max": 1500,
  "wage_note": null,
  "target_grade": "大学1〜4年生",
  "min_hours_per_month": 40,
  "max_hours_per_month": 80,
  "selection_flow": "書類→面談→内定",
  "tags": ["マーケ", "SNS"],
  "status": "published",
  "visibility": "public",
  "display_order": 0
}
```

#### 4.2 企業 (`/api/companies`)

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| GET | `/companies` | なし | 企業一覧 |
| GET | `/companies/:slug` | なし | 企業詳細 |
| GET | `/companies/admin/all` | 管理者 | 全企業（管理用） |
| POST | `/companies/admin` | 管理者 | 企業作成 |
| PUT | `/companies/admin/:id` | 管理者 | 企業更新 |
| DELETE | `/companies/admin/:id` | 管理者 | 企業削除 |

#### 4.3 学生 (`/api/students`)

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| POST | `/students/register` | なし | 学生登録 |
| GET | `/students/mypage/:id` | なし | マイページ情報 |
| GET | `/students/admin` | 管理者 | 学生一覧 |
| GET | `/students/admin/:id` | 管理者 | 学生詳細（応募・紹介履歴含む） |
| PUT | `/students/admin/:id` | 管理者 | 学生情報更新 |

**POST /api/students/register リクエスト Body:**
```json
{
  "last_name": "山田",
  "first_name": "太郎",
  "last_name_kana": "ヤマダ",
  "first_name_kana": "タロウ",
  "email": "yamada@univ.ac.jp",
  "phone": "09012345678",
  "university": "東京大学",
  "faculty": "経済学部",
  "department": "経済学科",
  "grade": 3,
  "graduation_year": 2026,
  "invite_code": "WELCOME2024",
  "pr_text": "自己PR..."
}
```

**POST /api/students/register レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "my_invite_code": "YT8X3K",
    "message": "登録が完了しました"
  }
}
```

#### 4.4 応募 (`/api/applications`)

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| POST | `/applications` | なし | 応募送信 |
| GET | `/applications/admin` | 管理者 | 応募一覧 |
| GET | `/applications/admin/:id` | 管理者 | 応募詳細 |
| PUT | `/applications/admin/:id` | 管理者 | ステータス更新 |
| GET | `/applications/admin/stats/summary` | 管理者 | ダッシュボード統計 |

**GET /api/applications/admin/stats/summary クエリ:**
```
term : week / month / year / all
```

**統計レスポンス:**
```json
{
  "success": true,
  "data": {
    "term": "month",
    "total_students": 120,
    "total_applications": 340,
    "active_jobs": 45,
    "pending_applications": 28,
    "term_students": 15,
    "term_applications": 42,
    "status_breakdown": [
      {"status": "applied", "count": 20},
      {"status": "interview1", "count": 8}
    ],
    "top_companies": [
      {"company_name": "ABC株式会社", "cnt": 15}
    ],
    "trend_data": [
      {"label": "04/01", "count": 3},
      {"label": "04/02", "count": 5}
    ],
    "recent_applications": [...]
  }
}
```

#### 4.5 招待コード (`/api/invite`)

| Method | Path | 説明 |
|--------|------|------|
| POST | `/invite/verify` | コード検証 |
| GET | `/invite/admin` | 全コード一覧（管理） |
| POST | `/invite/admin` | コード作成 |
| PUT | `/invite/admin/:id` | コード更新 |
| DELETE | `/invite/admin/:id` | コード削除 |

**POST /api/invite/verify リクエスト:**
```json
{ "code": "WELCOME2024" }
```

#### 4.6 無料相談 (`/api/consultation`)

| Method | Path | 説明 |
|--------|------|------|
| POST | `/consultation` | 相談申込 |
| GET | `/consultation/admin` | 相談一覧（管理） |
| PUT | `/consultation/admin/:id` | ステータス更新 |

**POST /api/consultation リクエスト Body:**
```json
{
  "name": "山田太郎",
  "email": "yamada@univ.ac.jp",
  "phone": "090...",
  "university": "東京大学",
  "grade": 3,
  "concern": "インターン選びで迷っている、就活との両立が不安",
  "message": "具体的な悩み...",
  "preferred_datetime": "平日の午後など"
}
```

#### 4.7 管理者認証 (`/api/auth`)

| Method | Path | 説明 |
|--------|------|------|
| POST | `/auth/admin/login` | 管理者ログイン |
| POST | `/auth/admin/setup` | 初回パスワード設定 |
| POST | `/auth/admin/verify` | トークン検証 |

**POST /api/auth/admin/login:**
```json
{ "email": "admin@example.com", "password": "password" }
```
**レスポンス:**
```json
{
  "success": true,
  "data": {
    "token": "abc123...",
    "expires_at": "2026-04-24T10:00:00.000Z",
    "admin": { "id": 1, "email": "...", "name": "管理者", "role": "super_admin" }
  }
}
```

> 注意: 認証トークンはフロントエンドの localStorage で管理（`admin_token`, `admin_name`）。  
> DBにセッション保存なし（簡易実装）。

**POST /api/auth/admin/setup（初回セットアップ）:**
```json
{
  "setup_key": "setup_intern_2024",
  "email": "admin@example.com",
  "password": "your_password",
  "name": "管理者名"
}
```

#### 4.8 サイト設定 (`/api/settings`)

| Method | Path | 説明 |
|--------|------|------|
| GET | `/settings` | 全設定取得（key-value変換済み） |
| GET | `/settings?group=hero` | グループ別取得 |
| GET | `/settings/admin/all` | 管理用全設定 |
| PUT | `/settings/admin/:key` | 単一設定更新 |
| PUT | `/settings/admin/bulk/update` | 一括更新 |
| GET | `/settings/lp-sections` | LPセクション（公開） |
| GET | `/settings/lp-sections/admin` | LPセクション（管理） |
| PUT | `/settings/lp-sections/admin/:key` | LPセクション更新 |
| GET | `/settings/faqs` | FAQ（公開） |
| GET | `/settings/faqs/admin` | FAQ（管理） |
| POST | `/settings/faqs/admin` | FAQ作成 |
| PUT | `/settings/faqs/admin/:id` | FAQ更新 |
| DELETE | `/settings/faqs/admin/:id` | FAQ削除 |
| GET | `/settings/announcements` | お知らせ（公開・有効期間内） |
| GET | `/settings/announcements/admin` | お知らせ（管理・全件） |
| POST | `/settings/announcements/admin` | お知らせ作成 |
| PUT | `/settings/announcements/admin/:id` | お知らせ更新 |
| DELETE | `/settings/announcements/admin/:id` | お知らせ削除 |

#### 4.9 ホームページコンテンツ (`/api/homepage`)

| Method | Path | 説明 |
|--------|------|------|
| GET | `/homepage/success-stories` | 内定者タイムライン（公開） |
| GET | `/homepage/success-stories/admin` | 内定者タイムライン（管理） |
| POST | `/homepage/success-stories/admin` | 内定者追加 |
| PUT | `/homepage/success-stories/admin/:id` | 内定者更新 |
| DELETE | `/homepage/success-stories/admin/:id` | 内定者削除 |
| GET | `/homepage/featured-jobs` | ピックアップ求人（公開、最大5件） |
| GET | `/homepage/featured-jobs/admin` | ピックアップ求人（管理） |
| POST | `/homepage/featured-jobs/admin` | ピックアップ求人追加 |
| PUT | `/homepage/featured-jobs/admin/:id` | ピックアップ求人更新 |
| DELETE | `/homepage/featured-jobs/admin/:id` | ピックアップ求人削除 |
| GET | `/homepage/university-tags` | 大学タグ一覧（公開） |
| GET | `/homepage/university-tags/admin` | 大学タグ（管理） |
| POST | `/homepage/university-tags/admin` | 大学タグ作成 |
| PUT | `/homepage/university-tags/admin/:id` | 大学タグ更新 |
| DELETE | `/homepage/university-tags/admin/:id` | 大学タグ削除 |
| GET | `/homepage/universities/:slug/jobs` | 特定大学の求人一覧 |
| POST | `/homepage/jobs/:job_id/university-tags` | 求人に大学タグ紐付け |
| GET | `/homepage/jobs/:job_id/university-tags` | 求人の大学タグ取得 |

**POST /api/homepage/jobs/:job_id/university-tags リクエスト:**
```json
{ "university_tag_ids": [1, 3, 4] }
```
> 既存の紐付けを全削除して再登録（replace方式）

---

## 5. フロントエンド ページ構成

### 5.1 公開サイト（`public/static/public.js`）

ルーティングは `src/index.tsx` のSSR-likeテンプレートで行い、  
クライアント側では `window.location.pathname` で判断して各 `init*()` 関数を呼び出す。

```javascript
// public.js 内のルーティング
const path = window.location.pathname;
if (path === '/' || path === '')           initHomePage();
else if (path === '/jobs')                 initJobsPage();
else if (path.startsWith('/jobs/'))        initJobDetailPage();
else if (path === '/universities')         initUniversitiesPage();
else if (path.startsWith('/universities/')) {
  const slug = path.split('/')[2];
  initUniversityJobsPage(slug);
}
else if (path === '/register')             initRegisterPage();
else if (path === '/consultation')         initConsultationPage();
else if (path === '/mypage')               initMyPage();
```

#### ページ別関数一覧

| 関数名 | URL | 概要 |
|--------|-----|------|
| `initHomePage()` | `/` | LP（全セクション） |
| `initJobsPage()` | `/jobs` | 求人一覧 + フィルタ |
| `initJobDetailPage()` | `/jobs/:slug` | 求人詳細 + 応募モーダル |
| `initUniversitiesPage()` | `/universities` | 大学別求人トップ |
| `initUniversityJobsPage(slug)` | `/universities/:slug` | 大学別求人一覧 |
| `initRegisterPage()` | `/register` | 新規登録フロー |
| `initConsultationPage()` | `/consultation` | 無料相談フォーム |
| `initMyPage()` | `/mypage` | マイページ |

#### LP (`initHomePage()`) セクション構成

1. **お知らせバナー** - DBのannouncements（有効期間内のみ）
2. **ヒーローセクション** - site_settings から動的テキスト、CTAはLINE相談 + 求人検索
3. **招待コード × 無料相談** - 2カラムグリッド
4. **大学別おすすめ求人** - university_tags をグリッド表示（max 12件）
5. **人気求人5選** - featured_jobs（max 5件）
6. **会員限定バナー** - 未ログイン時のみ表示、members_job_count を動的表示
7. **実績セクション** - site_settings の stat_* を表示
8. **内定者タイムライン** - success_stories を自動横スクロール（CSSアニメーション）
9. **特徴セクション** - lp_sections の 'features' キー（JSON配列）
10. **FAQセクション** - faqs テーブル
11. **CTAセクション（LINE誘導）** - 最下部

#### 求人カード `renderJobCard(job, isMembersTab)` のデータマッピング

```javascript
// 表示要素
- 企業ロゴ（logo_url）または企業名イニシャル
- 企業名（company_name）
- 求人タイトル（title）
- キャッチコピー（catch_copy）
- 業種バッジ（company_industry）
- 勤務形態バッジ（work_style: onsite/remote/hybrid）
- リモート可バッジ（remote_available === 1）
- 時給表示（hourly_wage_min〜hourly_wage_max, なければ"応相談"）
- 応募者数（applicant_count）
- タグ最大3件（tags JSON配列）
- 会員限定バッジ（visibility === 'members'）
```

### 5.2 管理画面（`public/static/admin.js`）

SPA構成。`navigate(page)` 関数で画面切り替え。

#### 管理画面ページ一覧

| ページキー | 関数名 | 機能 |
|-----------|--------|------|
| `dashboard` | `loadDashboard()` | 統計ダッシュボード（週/月/年/全期間切替） |
| `companies` | `loadCompanies()` | 企業CRUD |
| `jobs` | `loadJobs()` | 求人CRUD + 大学タグ選択 |
| `students` | `loadStudents()` | 学生一覧・詳細 |
| `applications` | `loadApplications()` | 応募管理・ステータス更新 |
| `invites` | `loadInvites()` | 招待コード管理 |
| `consultations` | `loadConsultations()` | 無料相談管理 |
| `site-settings` | `loadSiteSettings()` | サイト設定（グループ別） |
| `lp-edit` | `loadLpEdit()` | LPセクション編集 |
| `faqs` | `loadFaqs()` | FAQ CRUD |
| `announcements` | `loadAnnouncements()` | お知らせ CRUD |
| `success-stories` | `loadSuccessStories()` | 内定者タイムライン管理 |
| `featured-jobs` | `loadFeaturedJobs()` | ピックアップ求人管理 |
| `university-tags` | `loadUniversityTags()` | 大学タグマスタ管理 |

#### 管理画面認証フロー

```javascript
// localStorage に保存
localStorage.setItem('admin_token', token);
localStorage.setItem('admin_name', adminName);

// 画面初期化時に checkAuth() を呼ぶ
function checkAuth() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    showAdminLogin();  // ログイン画面表示
    return false;
  }
  return true;
}
```

#### 求人編集モーダル (`showJobModal`) のフィールド

| フィールド | 型 | 必須 | 備考 |
|-----------|------|------|------|
| company_id | select | ✓ | companies一覧から選択 |
| title | text | ✓ | |
| slug | text | ✓ | URL用スラッグ |
| catch_copy | text | | |
| description | textarea | ✓ | |
| work_content | textarea | ✓ | |
| requirements | textarea | | |
| work_hours | text | | |
| work_location | text | | |
| hourly_wage_min | number | | |
| hourly_wage_max | number | | |
| work_style | radio | | onsite/remote/hybrid |
| selection_flow | text | | |
| target_grade | text | | |
| status | radio | | published/draft/closed |
| visibility | radio | | public/members |
| university_tag_ids | checkbox[] | | 大学タグ複数選択（全タグ取得して表示） |

**大学タグ保存フロー（2ステップ）:**
```javascript
// 1. 求人を作成/更新
const jobId = await submitCreateJob() or submitUpdateJob();

// 2. 大学タグを紐付け
await API.post(`/homepage/jobs/${jobId}/university-tags`, {
  university_tag_ids: selectedTagIds  // 選択済みIDの配列
});
```

---

## 6. ページ URL マッピング (src/index.tsx)

| HTTP | URL | 関数 | title | description |
|------|-----|------|-------|-------------|
| GET | `/` | getPublicHTML('home') | InternBase \| 高学歴大学生向け長期インターン求人サイト | 東大・早慶・MARCHなど... |
| GET | `/jobs` | getPublicHTML('jobs') | 求人一覧 \| InternBase | 厳選された長期インターン求人一覧... |
| GET | `/jobs/:slug` | getPublicHTML('job-detail') | 求人詳細 \| InternBase | 長期インターン求人の詳細情報... |
| GET | `/universities` | getPublicHTML('universities') | 大学別おすすめ求人 \| InternBase | 東大・早稲田・慶應など... |
| GET | `/universities/:slug` | getPublicHTML('university-jobs') | 大学別求人 \| InternBase | あなたの大学に特化した... |
| GET | `/register` | getPublicHTML('register') | 新規登録 \| InternBase | 招待コードで登録して... |
| GET | `/consultation` | getPublicHTML('consultation') | 無料相談 \| InternBase | キャリアのプロが... |
| GET | `/mypage` | getPublicHTML('mypage') | マイページ \| InternBase | 応募履歴や招待コードの確認... |
| GET | `/admin` | getAdminHTML() | 管理画面 - InternBase | |
| GET | `/admin/*` | getAdminHTML() | 管理画面 - InternBase | |

---

## 7. ナビゲーション構成

### 公開サイト ナビゲーション

```
[ロゴ: InternBase]  [求人を探す] [大学別求人] [無料相談]  [LINE無料相談 (緑)] [登録する (グラデ)]
```

**モバイル（md未満）:** ハンバーガーメニュー → 縦メニュー表示
```
- 求人を探す
- 大学別求人  
- 無料相談（LINE）
- 新規登録
```

### フッター構成

```
[ロゴ + キャッチ] [求人を探す欄] [サービス欄] [公式LINE欄]
© 2024 InternBase.   プライバシーポリシー | 利用規約
```

---

## 8. 状態管理（localStorage）

```javascript
// 公開サイト
localStorage.getItem('student_id')      // 登録済み学生ID
localStorage.getItem('student_name')    // 学生氏名
localStorage.getItem('my_invite_code')  // 自分の招待コード

// 管理画面
localStorage.getItem('admin_token')     // 管理者認証トークン
localStorage.getItem('admin_name')      // 管理者名
```

---

## 9. ビジネスロジック

### 9.1 招待コードシステム

```
管理者コード（admin）: 上限回数設定可、期限設定可
学生紹介コード（student）: 自動生成、上限50回
パートナーコード（partner）: 企業や提携先向け

学生登録時:
1. 招待コード検証（任意）
2. 使用回数インクリメント
3. 紹介者（学生）のreferral_countをインクリメント
4. 新規学生の紹介コード自動生成（姓名イニシャル + ランダム5文字）
   例: 山田太郎 → "YT8X3K"
```

### 9.2 求人の公開範囲制御

```
visibility = 'public'  → 全ユーザー閲覧可
visibility = 'members' → student_id がある場合のみ
  - 一覧API: student_id クエリがある場合に含める
  - 詳細API: student_id ない場合 → 403 + error: "members_only"
  - フロント: 403受信時 → 会員限定ページを表示
```

### 9.3 応募フロー

```
1. 求人詳細ページで「応募する」ボタン
2. student_id が localStorage にある場合 → 応募モーダル表示
   ない場合 → 登録ページへリダイレクト
3. 重複チェック（student_id + job_id UNIQUE制約）
4. 応募成功 → applicant_count +1
5. 管理画面で応募ステータス管理
```

---

## 10. 開発環境 / ファイル構成

```
/home/user/webapp/
├── src/
│   ├── index.tsx                  # Honoメインアプリ（ルーティング + HTML生成）
│   ├── types.ts                   # Bindings型定義（D1: DB）
│   └── routes/
│       ├── api.auth.ts            # 認証API
│       ├── api.companies.ts       # 企業API
│       ├── api.jobs.ts            # 求人API
│       ├── api.students.ts        # 学生API
│       ├── api.applications.ts    # 応募API
│       ├── api.invite.ts          # 招待コードAPI
│       ├── api.consultation.ts    # 相談API
│       ├── api.settings.ts        # 設定・LP・FAQ・お知らせAPI
│       └── api.homepage.ts        # ホームページコンテンツAPI
├── public/
│   └── static/
│       ├── public.js              # 公開サイト JS (~1300行)
│       └── admin.js               # 管理画面 JS (~2600行)
├── migrations/
│   ├── 0001_initial_schema.sql    # 基本テーブル
│   ├── 0002_seed_data.sql         # 初期データ
│   ├── 0003_extensions.sql        # 拡張テーブル（設定・FAQ等）
│   ├── 0004_seed_settings.sql     # 設定初期値
│   ├── 0005_homepage_features.sql # ホームページ機能テーブル
│   └── 0006_seed_homepage_features.sql # ホームページ初期データ
├── wrangler.jsonc                 # Cloudflare設定
├── vite.config.ts                 # Viteビルド設定
├── tsconfig.json                  # TypeScript設定
├── package.json                   # npm設定
└── ecosystem.config.cjs           # PM2設定（開発環境）
```

### types.ts

```typescript
export type Bindings = {
  DB: D1Database;
}
```

### wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "internbase",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "<your-d1-database-id>"
    }
  ]
}
```

---

## 11. 実装済み機能 チェックリスト

### 公開サイト
- [x] LP（ヒーロー・招待コード・大学別・ピックアップ・会員限定バナー・実績・タイムライン・特徴・FAQ・CTA）
- [x] 求人一覧（フィルタ: キーワード・業種・勤務形態）
- [x] 求人詳細（応募モーダル）
- [x] 大学別求人一覧（/universities）
- [x] 大学別求人詳細（/universities/:slug）
- [x] 新規登録フロー（招待コード検証 → フォーム → 完了）
- [x] 無料相談フォーム
- [x] マイページ（応募履歴・招待コード確認）
- [x] 会員限定求人（登録後に閲覧可）
- [x] モバイル対応ナビゲーション
- [x] SEO（ページ別title・description・OGP）

### 管理画面
- [x] ダッシュボード（統計・グラフ・週/月/年切替）
- [x] 企業CRUD
- [x] 求人CRUD + 大学タグ選択
- [x] 学生一覧・詳細
- [x] 応募管理・ステータス更新
- [x] 招待コード管理
- [x] 無料相談管理
- [x] サイト設定編集
- [x] LP編集（特徴カード等）
- [x] FAQ管理
- [x] お知らせ管理
- [x] 内定者タイムライン管理
- [x] ピックアップ求人管理（最大5件）
- [x] 大学タグマスタ管理
- [x] 管理者ログイン認証

---

## 12. 未実装・改善点（次フェーズ候補）

- [ ] 管理画面：求人・企業の会員限定ステータス変更ボタン（一覧から直接変更）
- [ ] サイト設定の contact フィールドが英語表示のまま（日本語ラベルに修正）
- [ ] LP編集欄に「編集方法・事例」の説明文追加
- [ ] メール通知（応募確認・面接調整）
- [ ] LINE Messaging API連携（応募後の自動メッセージ）
- [ ] 求人検索の全文検索強化（SQLite FTS対応）
- [ ] 画像アップロード（企業ロゴ → Cloudflare R2）
- [ ] ページネーション（求人一覧・学生一覧）
- [ ] 学生登録後のメール認証
- [ ] 管理者の複数アカウント対応（ロール管理）

---

## 13. ローカル開発 起動方法

```bash
# 依存関係インストール（初回のみ）
cd /home/user/webapp && npm install

# マイグレーション適用
npx wrangler d1 migrations apply webapp-production --local

# ビルド
npm run build

# 起動（PM2経由）
pm2 start ecosystem.config.cjs

# 動作確認
curl http://localhost:3000
curl http://localhost:3000/api/health
```

**ecosystem.config.cjs:**
```javascript
module.exports = {
  apps: [{
    name: 'internship-site',
    script: 'npx',
    args: 'wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000',
    env: { NODE_ENV: 'development' },
    watch: false,
    instances: 1,
    exec_mode: 'fork'
  }]
}
```

---

## 14. 重要な実装パターン

### D1 データベースアクセス（Hono）
```typescript
// Bindings定義が必要
const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/jobs', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM jobs WHERE status = 'published'
  `).all()
  
  return c.json({ success: true, data: results })
})

// パラメータバインド（SQLインジェクション防止）
const job = await c.env.DB.prepare(`
  SELECT * FROM jobs WHERE slug = ?
`).bind(slug).first()

// INSERT後のID取得
const result = await c.env.DB.prepare(`
  INSERT INTO jobs (title) VALUES (?)
`).bind(title).run()
const newId = result.meta.last_row_id
```

### フロントエンドAPIコール（Axios）
```javascript
const API = axios.create({ baseURL: '/api' });

// GET
const res = await API.get('/jobs?industry=IT・SaaS');
const jobs = res.data.data;

// POST
const res = await API.post('/students/register', formData);
if (res.data.success) { /* 成功処理 */ }

// エラーハンドリング
try {
  await API.put(`/jobs/admin/${id}`, data);
} catch(e) {
  const msg = e.response?.data?.error || 'エラーが発生しました';
  alert(msg);
}
```

### 静的ファイルのサーブ（Hono + Cloudflare Pages）
```typescript
// src/index.tsx
import { serveStatic } from 'hono/cloudflare-workers'  // ← Cloudflare専用

app.use('/static/*', serveStatic({ root: './public' }))
// public/static/public.js → /static/public.js でアクセス
```

---

## 15. セキュリティ考慮事項

1. **認証**: 管理画面はlocalStorageトークン（簡易実装）→ 本番は JWT + DB検証を推奨
2. **APIアクセス制御**: 現状、管理APIに認証チェックなし → 本番はトークン検証ミドルウェア追加を推奨
3. **SQLインジェクション**: D1のプリペアドステートメント（`?` バインド）で防止済み
4. **XSS**: innerHTML使用箇所あり → DBから取得したテキストはエスケープ必要
5. **環境変数**: `SETUP_KEY` で初回セットアップを保護

---

*このドキュメントは InternBase の現状実装を完全に記述したプロトタイプ仕様書です。*  
*他のAIツールでの実装・改善にご活用ください。*
