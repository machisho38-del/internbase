-- Update Coming Soon cover copy for the August launch window.
UPDATE site_settings
SET setting_value = '8月公開予定', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'coming_soon_title';

UPDATE site_settings
SET setting_value = '2026年8月', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'coming_soon_date';

