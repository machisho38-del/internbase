-- =============================================
-- 公開前の仮URL・仮データ整理
-- =============================================

-- 規約ページへのリンクを実ページに向ける
UPDATE site_settings
SET setting_value = '/privacy', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'privacy_policy_url' AND setting_value = '#';

UPDATE site_settings
SET setting_value = '/terms', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'terms_url' AND setting_value = '#';

-- 明らかなLINEプレースホルダーだけを空に戻す
UPDATE site_settings
SET setting_value = '', updated_at = CURRENT_TIMESTAMP
WHERE setting_key IN ('line_url', 'line_id')
  AND setting_value IN ('https://lin.ee/xxxxxxx', '@xxxxxxx', '#');

-- 初期表示の実績数値を過大に見せない
UPDATE site_settings
SET setting_value = '2', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'stat_companies' AND setting_value = '50';

UPDATE site_settings
SET setting_value = '2', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'stat_jobs' AND setting_value = '200';

UPDATE site_settings
SET setting_value = '0', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'stat_students' AND setting_value = '1000';

UPDATE site_settings
SET setting_value = '0', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'stat_success_rate' AND setting_value = '95';

-- 本物の実績が入るまでは内定者タイムラインを表示しない
INSERT OR IGNORE INTO site_settings
  (setting_key, setting_value, setting_type, label, description, group_name, display_order)
VALUES
  ('success_stories_enabled', '0', 'boolean', '内定者タイムライン表示', '本物の掲載許諾済み実績がある場合のみ1にする', 'homepage', 10);

UPDATE success_stories
SET is_visible = 0, updated_at = CURRENT_TIMESTAMP
WHERE company_name IN (
  'Google Japan',
  'マッキンゼー・アンド・カンパニー',
  'LINE株式会社',
  'アクセンチュア',
  '野村證券',
  'Preferred Networks',
  'リクルート',
  'サイバーエージェント',
  'トヨタ自動車',
  '楽天グループ'
);

-- 初期告知の表現を実態に合わせる
UPDATE announcements
SET body = '長期インターン求人サイトをオープンしました。掲載求人は順次追加していきます。',
    updated_at = CURRENT_TIMESTAMP
WHERE title = 'サービスをリリースしました！'
  AND body = '長期インターン求人サイトをオープンしました。多数の厳選求人を掲載中です。';
