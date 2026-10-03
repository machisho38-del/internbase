CREATE TABLE IF NOT EXISTS student_password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_password_resets_student
  ON student_password_resets(student_id, requested_at);

CREATE INDEX IF NOT EXISTS idx_student_password_resets_token
  ON student_password_resets(token_hash, expires_at, used_at);
