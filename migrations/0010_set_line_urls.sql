-- Set public LINE destinations for the current source media options.
UPDATE site_settings
SET setting_value = 'https://lin.ee/ohGc4ij', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'line_url_sunconnect';

UPDATE site_settings
SET setting_value = 'https://lin.ee/usH63GD', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'line_url_valueup';
