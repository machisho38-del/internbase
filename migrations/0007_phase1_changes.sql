-- migrations/0007_phase1_changes.sql
-- Phase1 設計変更対応マイグレーション

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
