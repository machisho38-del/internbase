-- Hide the legacy LINE/SNS/contact settings group from site settings.
-- Values stay in site_settings so public fallbacks can keep working.
UPDATE site_settings
SET group_name = 'legacy_contact',
    display_order = 900,
    updated_at = CURRENT_TIMESTAMP
WHERE group_name = 'contact';
