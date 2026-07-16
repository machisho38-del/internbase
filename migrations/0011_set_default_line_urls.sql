-- Keep legacy/default LINE settings populated so admin and public fallbacks stay connected.
UPDATE site_settings
SET setting_value = 'https://lin.ee/ohGc4ij', updated_at = CURRENT_TIMESTAMP
WHERE setting_key IN ('line_url', 'line_url_default');
