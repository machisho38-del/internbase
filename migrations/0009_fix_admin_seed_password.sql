-- Align the development seed admin password with the SHA-256 hashing used by api.auth.ts.
-- Password: admin123
UPDATE admins
SET password_hash = '5ed35afd3cd274ad80f692fd8485d7e30e1277f73b65fab3c441726cd0f74afc'
WHERE email = 'admin@internship.jp'
  AND password_hash = '$2a$10$placeholder_hash_replace_on_deploy';
