-- =============================================
-- 拡張スキーマ: サイト設定・FAQ・お知らせ・招待コード拡張
-- =============================================

-- サイト設定テーブル（key-value形式）
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text' CHECK(setting_type IN ('text','url','html','json','boolean','number')),
  label TEXT NOT NULL,
  description TEXT,
  group_name TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LPセクション設定テーブル
CREATE TABLE IF NOT EXISTS lp_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON形式でセクション内容を保存
  is_visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FAQテーブル
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_visible INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- お知らせテーブル
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info' CHECK(type IN ('info','warning','success','campaign')),
  link_url TEXT,
  link_text TEXT,
  is_visible INTEGER DEFAULT 1,
  starts_at DATETIME,
  ends_at DATETIME,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 求人テーブルにvisibility列を追加
ALTER TABLE jobs ADD COLUMN visibility TEXT DEFAULT 'public'
  CHECK(visibility IN ('public','members','draft','closed'));

-- 学生の招待コード（自分が発行できるコード）
-- ※SQLiteはALTER TABLE ADD COLUMN UNIQUEをサポートしていないため、UNIQUEなしで追加してインデックスで代替
ALTER TABLE students ADD COLUMN my_invite_code TEXT;
ALTER TABLE students ADD COLUMN my_invite_code_uses INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN referral_count INTEGER DEFAULT 0;

-- 招待コードに種別・発行者学生ID・提携企業名を追加
ALTER TABLE invite_codes ADD COLUMN code_type TEXT DEFAULT 'admin'
  CHECK(code_type IN ('admin','student','partner'));
ALTER TABLE invite_codes ADD COLUMN student_id INTEGER REFERENCES students(id);
ALTER TABLE invite_codes ADD COLUMN partner_name TEXT;

-- 招待コード経由の登録追跡
ALTER TABLE students ADD COLUMN referred_by_student_id INTEGER REFERENCES students(id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_group ON site_settings(group_name);
CREATE INDEX IF NOT EXISTS idx_faqs_visible ON faqs(is_visible, display_order);
CREATE INDEX IF NOT EXISTS idx_announcements_visible ON announcements(is_visible, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_jobs_visibility ON jobs(visibility);
CREATE INDEX IF NOT EXISTS idx_students_my_invite ON students(my_invite_code);
