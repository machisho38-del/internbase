-- 流入媒体選択肢の更新: SUNCONNECTインターン局・バリューアップ就活インターン情報局
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order)
VALUES
  ('line_url_sunconnect', '', 'url', 'LINE URL（SUNCONNECTインターン局）',        'SUNCONNECTインターン局経由の学生向けLINE URL', 'line', 5),
  ('line_url_valueup',    '', 'url', 'LINE URL（バリューアップ就活インターン情報局）', 'バリューアップ就活インターン情報局経由の学生向けLINE URL', 'line', 6);
