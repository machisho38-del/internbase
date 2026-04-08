import { Hono } from 'hono'
import { Bindings } from '../types'

const applications = new Hono<{ Bindings: Bindings }>()

// 応募（公開）
applications.post('/', async (c) => {
  const body = await c.req.json()
  const { student_id, job_id, motivation, available_hours } = body

  if (!student_id || !job_id) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  // 重複チェック
  const existing = await c.env.DB.prepare(
    `SELECT id FROM applications WHERE student_id = ? AND job_id = ?`
  ).bind(student_id, job_id).first()
  if (existing) {
    return c.json({ success: false, error: 'この求人にはすでに応募済みです' }, 409)
  }

  // 求人存在確認
  const job = await c.env.DB.prepare(
    `SELECT id, title FROM jobs WHERE id = ? AND status = 'published'`
  ).bind(job_id).first()
  if (!job) return c.json({ success: false, error: '求人が見つかりません' }, 404)

  const result = await c.env.DB.prepare(`
    INSERT INTO applications (student_id, job_id, motivation, available_hours)
    VALUES (?, ?, ?, ?)
  `).bind(student_id, job_id, motivation || null, available_hours || null).run()

  // 応募数インクリメント
  await c.env.DB.prepare(
    `UPDATE jobs SET applicant_count = applicant_count + 1 WHERE id = ?`
  ).bind(job_id).run()

  return c.json({
    success: true,
    data: { id: result.meta.last_row_id, message: '応募が完了しました' }
  }, 201)
})

// ---- 管理API ----

// 応募一覧（管理）
applications.get('/admin', async (c) => {
  const status = c.req.query('status')
  const companyId = c.req.query('company_id')
  const studentId = c.req.query('student_id')

  let query = `
    SELECT a.*,
      s.last_name || s.first_name as student_name,
      s.email as student_email,
      s.university as student_university,
      s.grade as student_grade,
      j.title as job_title,
      c.name as company_name,
      c.id as company_id
    FROM applications a
    JOIN students s ON s.id = a.student_id
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE 1=1
  `
  const params: any[] = []

  if (status) { query += ` AND a.status = ?`; params.push(status) }
  if (companyId) { query += ` AND c.id = ?`; params.push(companyId) }
  if (studentId) { query += ` AND a.student_id = ?`; params.push(studentId) }

  query += ` ORDER BY a.updated_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ success: true, data: results })
})

// 応募詳細（管理）
applications.get('/admin/:id', async (c) => {
  const id = c.req.param('id')
  const application = await c.env.DB.prepare(`
    SELECT a.*,
      s.last_name || s.first_name as student_name,
      s.last_name, s.first_name,
      s.email as student_email, s.phone as student_phone,
      s.university as student_university, s.grade as student_grade,
      j.title as job_title, j.work_location, j.hourly_wage_min, j.hourly_wage_max,
      c.name as company_name
    FROM applications a
    JOIN students s ON s.id = a.student_id
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.id = ?
  `).bind(id).first()

  if (!application) return c.json({ success: false, error: 'Not found' }, 404)
  return c.json({ success: true, data: application })
})

// 応募ステータス更新（管理）
applications.put('/admin/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { status, admin_memo, next_action, next_action_date, interview_date } = body

  await c.env.DB.prepare(`
    UPDATE applications SET
      status=?, admin_memo=?, next_action=?, next_action_date=?,
      interview_date=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    status, admin_memo || null, next_action || null,
    next_action_date || null, interview_date || null, id
  ).run()

  return c.json({ success: true })
})

// ダッシュボード統計（管理）
applications.get('/admin/stats/summary', async (c) => {
  const [totalStudents, totalApplications, activeJobs, pendingApplications] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM students WHERE status='active'`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM applications`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM jobs WHERE status='published'`).first(),
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM applications WHERE status='applied'`).first(),
  ])

  const { results: statusBreakdown } = await c.env.DB.prepare(`
    SELECT status, COUNT(*) as count FROM applications GROUP BY status
  `).all()

  const { results: recentApplications } = await c.env.DB.prepare(`
    SELECT a.*, s.last_name || s.first_name as student_name,
      j.title as job_title, c.name as company_name
    FROM applications a
    JOIN students s ON s.id = a.student_id
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    ORDER BY a.created_at DESC LIMIT 10
  `).all()

  return c.json({
    success: true,
    data: {
      total_students: (totalStudents as any)?.count || 0,
      total_applications: (totalApplications as any)?.count || 0,
      active_jobs: (activeJobs as any)?.count || 0,
      pending_applications: (pendingApplications as any)?.count || 0,
      status_breakdown: statusBreakdown,
      recent_applications: recentApplications
    }
  })
})

export default applications
