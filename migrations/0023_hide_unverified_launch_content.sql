-- Keep unverified development content out of Preview and Production launch data.
-- Rows are retained as drafts/hidden so an operator can review and republish them.

-- The first two slugs come from the development seed migration. The third is a
-- clearly incomplete test job that was found in Preview during launch review.
UPDATE jobs
SET status = 'draft', updated_at = CURRENT_TIMESTAMP
WHERE slug IN ('acroforce-sales', 'techgrowth-marketing', 'sssssssssss');

UPDATE featured_jobs
SET is_visible = 0, updated_at = CURRENT_TIMESTAMP
WHERE job_id IN (
  SELECT id FROM jobs
  WHERE slug IN ('acroforce-sales', 'techgrowth-marketing', 'sssssssssss')
);

UPDATE companies
SET status = 'draft', updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT company_id FROM jobs
  WHERE slug IN ('acroforce-sales', 'techgrowth-marketing', 'sssssssssss')
);

-- No story in the current dataset has a recorded publication approval. Hide
-- every row until the operator has confirmed the person, wording, and consent.
UPDATE success_stories
SET is_visible = 0, updated_at = CURRENT_TIMESTAMP;

UPDATE site_settings
SET setting_value = '0',
    description = '掲載許諾済みかつ公開設定の実績だけを表示',
    updated_at = CURRENT_TIMESTAMP
WHERE setting_key = 'success_stories_enabled';

-- Existing university descriptions include development copy and unsupported
-- outcome claims. Re-enable only reviewed tags from the admin screen.
UPDATE university_tags
SET is_visible = 0, updated_at = CURRENT_TIMESTAMP;
