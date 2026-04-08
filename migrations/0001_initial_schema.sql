-- =============================================
-- 長期インターンサイト 初期スキーマ
-- =============================================

-- 招待コードテーブル
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  issued_by TEXT NOT NULL DEFAULT 'admin',
  expires_at DATETIME,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 企業テーブル
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT NOT NULL,
  size TEXT,
  founded_year INTEGER,
  website_url TEXT,
  description TEXT NOT NULL,
  mission TEXT,
  culture TEXT,
  office_location TEXT,
  office_access TEXT,
  status TEXT DEFAULT 'published' CHECK(status IN ('published','draft','archived')),
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 求人テーブル
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'internship',
  catch_copy TEXT,
  description TEXT NOT NULL,
  -- 業務内容
  work_content TEXT NOT NULL,
  -- 求める人材
  requirements TEXT,
  preferred_requirements TEXT,
  -- 魅力・特徴（JSON配列）
  highlights TEXT,
  -- 成長できること
  growth_points TEXT,
  -- 勤務条件
  work_hours TEXT,
  work_days TEXT,
  work_location TEXT,
  work_style TEXT CHECK(work_style IN ('onsite','remote','hybrid')),
  remote_available INTEGER DEFAULT 0,
  -- 給与
  hourly_wage_min INTEGER,
  hourly_wage_max INTEGER,
  wage_note TEXT,
  -- 応募条件
  target_grade TEXT,
  university_level TEXT,
  min_hours_per_month INTEGER,
  max_hours_per_month INTEGER,
  -- 選考フロー
  selection_flow TEXT,
  -- タグ（JSON配列）
  tags TEXT,
  -- ステータス
  status TEXT DEFAULT 'published' CHECK(status IN ('published','draft','closed')),
  display_order INTEGER DEFAULT 0,
  applicant_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 学生テーブル
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 基本情報
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name_kana TEXT,
  first_name_kana TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  -- 学籍情報
  university TEXT NOT NULL,
  faculty TEXT,
  department TEXT,
  grade INTEGER NOT NULL CHECK(grade BETWEEN 1 AND 4),
  graduation_year INTEGER,
  -- LINE
  line_user_id TEXT,
  line_display_name TEXT,
  -- 招待コード
  invite_code_id INTEGER,
  invite_code_used TEXT,
  -- その他
  pr_text TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
  admin_memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invite_code_id) REFERENCES invite_codes(id)
);

-- 応募テーブル
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  -- ステータス
  status TEXT DEFAULT 'applied' CHECK(status IN (
    'applied',      -- 応募済み
    'reviewing',    -- 書類選考中
    'interview1',   -- 1次面接
    'interview2',   -- 2次面接
    'interview3',   -- 最終面接
    'offered',      -- 内定
    'accepted',     -- 内定承諾
    'rejected',     -- 不採用
    'withdrawn'     -- 辞退
  )),
  -- 応募内容
  motivation TEXT,
  available_hours TEXT,
  -- 進捗管理
  admin_memo TEXT,
  next_action TEXT,
  next_action_date DATE,
  -- 面接日程
  interview_date DATETIME,
  -- メール送信フラグ（将来用）
  confirmation_sent INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  UNIQUE(student_id, job_id)
);

-- 無料相談テーブル
CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 相談者情報
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  university TEXT,
  grade INTEGER,
  -- 相談内容
  concern TEXT,
  message TEXT,
  preferred_datetime TEXT,
  -- ステータス
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','contacted','completed','cancelled')),
  admin_memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 管理者テーブル
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK(role IN ('super_admin','admin')),
  is_active INTEGER DEFAULT 1,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
