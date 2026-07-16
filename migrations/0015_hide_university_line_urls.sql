-- Move legacy university-specific LINE URL settings out of the active LINE/SNS group.
-- The admin settings API also filters these keys so they are no longer editable there.
UPDATE site_settings
SET group_name = 'legacy_line',
    display_order = 900,
    updated_at = CURRENT_TIMESTAMP
WHERE setting_key IN (
  'line_url_todai',
  'line_url_waseda',
  'line_url_keio',
  'line_url_march'
);
