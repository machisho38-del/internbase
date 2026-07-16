export type Bindings = {
  DB: D1Database
}

export type Company = {
  id: number
  name: string
  slug: string
  logo_url: string | null
  industry: string
  size: string | null
  founded_year: number | null
  website_url: string | null
  description: string
  mission: string | null
  culture: string | null
  office_location: string | null
  office_access: string | null
  status: 'published' | 'draft' | 'archived'
  display_order: number
  created_at: string
  updated_at: string
}

export type Job = {
  id: number
  company_id: number
  title: string
  slug: string
  job_type: string
  occupation: string | null
  catch_copy: string | null
  description: string
  work_content: string
  requirements: string | null
  preferred_requirements: string | null
  highlights: string | null  // JSON
  growth_points: string | null
  work_hours: string | null
  work_days: string | null
  work_location: string | null
  work_style: 'onsite' | 'remote' | 'hybrid' | null
  remote_available: number
  hourly_wage_min: number | null
  hourly_wage_max: number | null
  wage_note: string | null
  target_grade: string | null
  university_level: string | null
  min_hours_per_month: number | null
  max_hours_per_month: number | null
  selection_flow: string | null
  tags: string | null  // JSON
  status: 'published' | 'draft' | 'closed'
  display_order: number
  applicant_count: number
  created_at: string
  updated_at: string
  // JOIN
  company_name?: string
  company_logo?: string
  company_industry?: string
}

export type Student = {
  id: number
  last_name: string
  first_name: string
  last_name_kana: string | null
  first_name_kana: string | null
  email: string
  phone: string | null
  university: string
  faculty: string | null
  department: string | null
  grade: number
  graduation_year: number | null
  line_user_id: string | null
  line_display_name: string | null
  invite_code_id: number | null
  invite_code_used: string | null
  pr_text: string | null
  status: 'active' | 'inactive'
  admin_memo: string | null
  created_at: string
  updated_at: string
}

export type Application = {
  id: number
  student_id: number
  job_id: number
  status: string
  motivation: string | null
  available_hours: string | null
  admin_memo: string | null
  next_action: string | null
  next_action_date: string | null
  interview_date: string | null
  confirmation_sent: number
  created_at: string
  updated_at: string
  // JOIN
  student_name?: string
  student_email?: string
  student_university?: string
  student_grade?: number
  job_title?: string
  company_name?: string
}

export type InviteCode = {
  id: number
  code: string
  description: string | null
  max_uses: number
  current_uses: number
  issued_by: string
  expires_at: string | null
  is_active: number
  created_at: string
}

export type Consultation = {
  id: number
  name: string
  email: string
  phone: string | null
  university: string | null
  grade: number | null
  concern: string | null
  message: string | null
  preferred_datetime: string | null
  status: 'pending' | 'contacted' | 'completed' | 'cancelled'
  admin_memo: string | null
  created_at: string
  updated_at: string
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: '応募済み',
  reviewing: '書類選考中',
  interview1: '1次面接',
  interview2: '2次面接',
  interview3: '最終面接',
  offered: '内定',
  accepted: '内定承諾',
  rejected: '不採用',
  withdrawn: '辞退'
}

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  applied: '#6b7280',
  reviewing: '#3b82f6',
  interview1: '#8b5cf6',
  interview2: '#a855f7',
  interview3: '#7c3aed',
  offered: '#f59e0b',
  accepted: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#9ca3af'
}
