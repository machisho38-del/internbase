-- Add user-facing occupation category for job search and admin job postings.
ALTER TABLE jobs ADD COLUMN occupation TEXT DEFAULT 'その他';

UPDATE jobs
SET occupation = 'その他'
WHERE occupation IS NULL OR occupation = '';
