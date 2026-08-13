-- Rename the service and enable the public timeline container.
-- Individual stories still require is_visible = 1, so legacy sample rows remain hidden.
UPDATE site_settings
SET setting_value = 'ガクチカインターン', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'site_name';

UPDATE site_settings
SET setting_value = '© 2026 ガクチカインターン. All rights reserved.', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'footer_copyright';

UPDATE site_settings
SET setting_value = '現在、ガクチカインターンは準備中です。公開をお楽しみに。', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'coming_soon_subtitle';

INSERT OR IGNORE INTO site_settings
  (setting_key, setting_value, setting_type, label, description, group_name, display_order)
VALUES
  ('success_stories_enabled', '1', 'boolean', '内定者タイムライン表示', '掲載許諾済みかつ公開設定の実績だけを表示', 'homepage', 10);

UPDATE site_settings
SET setting_value = '1',
    description = '掲載許諾済みかつ公開設定の実績だけを表示',
    updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'success_stories_enabled';
