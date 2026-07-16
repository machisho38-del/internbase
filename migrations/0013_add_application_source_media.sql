-- Track which source media was selected when a student applies to a job.
ALTER TABLE applications ADD COLUMN source_media TEXT DEFAULT 'other';

