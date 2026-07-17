-- Add student password login and cookie-backed sessions.
ALTER TABLE students ADD COLUMN password_hash TEXT;

CREATE TABLE IF NOT EXISTS student_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON student_sessions(token);
CREATE INDEX IF NOT EXISTS idx_student_sessions_student_id ON student_sessions(student_id);
