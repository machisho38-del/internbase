-- Add configurable LINE URLs for placeholder source media.
-- Keep them empty until real LINE accounts are assigned.
INSERT OR IGNORE INTO site_settings
  (setting_key, setting_value, setting_type, label, description, group_name, display_order)
VALUES
  ('line_url_genki_intern', '', 'url', 'LINE URL（元気インターン）', '元気インターン経由の学生向けLINE URL。未設定時はLINEへ遷移しません。', 'line', 7),
  ('line_url_sokei_intern_compass', '', 'url', 'LINE URL（早慶インターンコンパス）', '早慶インターンコンパス経由の学生向けLINE URL。未設定時はLINEへ遷移しません。', 'line', 8),
  ('line_url_careersourcing', '', 'url', 'LINE URL（CareerSourcing）', 'CareerSourcing経由の学生向けLINE URL。未設定時はLINEへ遷移しません。', 'line', 9);

UPDATE site_settings
SET setting_value = '', updated_at = CURRENT_TIMESTAMP
WHERE setting_key IN ('line_url_genki_intern', 'line_url_sokei_intern_compass', 'line_url_careersourcing');

