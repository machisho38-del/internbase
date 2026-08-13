-- Correct the official Japanese brand spelling for environments that already
-- applied migration 0021 before the spelling correction.
UPDATE site_settings
SET setting_value = 'ガクチカインターン', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'site_name';

UPDATE site_settings
SET setting_value = '© 2026 ガクチカインターン. All rights reserved.', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'footer_copyright';

UPDATE site_settings
SET setting_value = '現在、ガクチカインターンは準備中です。公開をお楽しみに。', updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'coming_soon_subtitle';
