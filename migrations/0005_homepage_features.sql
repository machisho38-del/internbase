-- =============================================
-- トップページ新機能のスキーマ追加
-- =============================================

-- ① 内定者タイムライン
CREATE TABLE IF NOT EXISTS success_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,           -- 学生名（例: Aさん、田中さん）
  university TEXT NOT NULL,             -- 大学名（例: 東京大学、早稲田大学）
  company_name TEXT NOT NULL,           -- 内定先企業名
  comment TEXT,                         -- 所感（1-2行）
  is_visible INTEGER DEFAULT 1,         -- 公開フラグ（1=公開、0=非公開）
  display_order INTEGER DEFAULT 0,      -- 表示順（昇順）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_success_stories_visible_order 
  ON success_stories(is_visible, display_order);

-- ② ピックアップ求人（トップページ「人気の求人5選」）
CREATE TABLE IF NOT EXISTS featured_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,              -- 求人ID（jobs.id への FK）
  is_visible INTEGER DEFAULT 1,         -- 公開フラグ
  display_order INTEGER DEFAULT 0,      -- 表示順（昇順）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_featured_jobs_visible_order 
  ON featured_jobs(is_visible, display_order);

-- ③ 大学タグマスタ
CREATE TABLE IF NOT EXISTS university_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,            -- 大学名（例: 東京大学、慶應義塾大学）
  slug TEXT UNIQUE NOT NULL,            -- URL用スラッグ（例: todai, keio）
  description TEXT,                     -- 説明文（大学向けメッセージ等）
  is_visible INTEGER DEFAULT 1,         -- 公開フラグ
  display_order INTEGER DEFAULT 0,      -- 表示順
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_university_tags_visible_order 
  ON university_tags(is_visible, display_order);

-- ④ 求人×大学タグの中間テーブル
CREATE TABLE IF NOT EXISTS job_university_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,              -- 求人ID
  university_tag_id INTEGER NOT NULL,   -- 大学タグID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (university_tag_id) REFERENCES university_tags(id) ON DELETE CASCADE,
  UNIQUE(job_id, university_tag_id)
);

CREATE INDEX IF NOT EXISTS idx_job_university_tags_job 
  ON job_university_tags(job_id);
CREATE INDEX IF NOT EXISTS idx_job_university_tags_university 
  ON job_university_tags(university_tag_id);
