-- Repair job JSON array fields that were accidentally saved as JSON strings.
-- Example: "[]" should be [].
UPDATE jobs
SET appeal_points = json_extract(appeal_points, '$')
WHERE appeal_points IS NOT NULL
  AND json_valid(appeal_points)
  AND json_type(appeal_points, '$') = 'text'
  AND json_valid(json_extract(appeal_points, '$'))
  AND json_type(json_extract(appeal_points, '$')) = 'array';

UPDATE jobs
SET skill_set = json_extract(skill_set, '$')
WHERE skill_set IS NOT NULL
  AND json_valid(skill_set)
  AND json_type(skill_set, '$') = 'text'
  AND json_valid(json_extract(skill_set, '$'))
  AND json_type(json_extract(skill_set, '$')) = 'array';
