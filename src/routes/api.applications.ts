import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const applications = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// 応募（公開）
applications.post('/', async (c) => {
  const body = await c.req.json()
  const { student_id, job_id, motivation, available_hours, source_media } = body

  if (!student_id || !job_id) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  const validSourceMedia = ['sunconnect','valueup','todai_ig','waseda_ig','keio_ig','march_ig','web','other_sns','other']
  const validatedSourceMedia = validSourceMedia.includes(source_media) ? source_media : 'other'

  const existing = await c.env.DB.prepare(
    `SELECT id FROM applications WHERE student_id = ? AND job_id = ?`
  ).bind(student_id, job_id).first()
  if (existing) {
    return c.json({ success: false, error: 'この求人にはすでに応募済みです' }, 409)
  }

  const job = await c.env.DB.prepare(
    `SELECT id, title FROM jobs WHERE id = ? AND status = 'published'`
  ).bind(job_id).first()
  if (!job) return c.json({ success: false, error: '求人が見つかりません' }, 404)

  const result = await c.env.DB.prepare(`
    INSERT INTO applications (student_id, job_id, motivation, available_hours, source_media)
    VALUES (?, ?, ?, ?, ?)
  `).bind(student_id, job_id, motivation || null, available_hours || null, validatedSourceMedia).run()

  await c.env.DB.prepare(
    `UPDATE jobs SET applicant_count = applicant_count + 1 WHERE id = ?`
  ).bind(job_id).run()

  return c.json({
    success: true,
    data: { id: result.meta.last_row_id, message: '応募が完了しました' }
  }, 201)
})

// ---- 管理API（認証必須）----

// 応募一覧（管理）
applications.get('/admin', adminAuthMiddleware, async (c) => {
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
applications.get('/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  // stats/summary との競合を防ぐ
  if (id === 'stats') return c.json({ success: false, error: 'Not found' }, 404)

  const application = await c.env.DB.prepare(`
    SELECT a.*,
      s.last_name || s.first_name as student_name,
      s.last_name, s.first_name,
      s.email as student_email, s.phone as student_phone,
      s.university as student_university, s.grade as student_grade,
      s.source_media as student_source_media,
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
applications.put('/admin/:id', adminAuthMiddleware, async (c) => {
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
applications.get('/admin/stats/summary', adminAuthMiddleware, async (c) => {
  try {
    const term = c.req.query('term') || 'all'

    let dateFilter = ''
    if (term === 'week')  dateFilter = `AND a.created_at >= datetime('now', '-7 days')`
    if (term === 'month') dateFilter = `AND a.created_at >= datetime('now', '-1 month')`
    if (term === 'year')  dateFilter = `AND a.created_at >= datetime('now', '-1 year')`

    let studentDateFilter = ''
    if (term === 'week')  studentDateFilter = `AND s2.created_at >= datetime('now', '-7 days')`
    if (term === 'month') studentDateFilter = `AND s2.created_at >= datetime('now', '-1 month')`
    if (term === 'year')  studentDateFilter = `AND s2.created_at >= datetime('now', '-1 year')`

    const totalStudents = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM students WHERE status='active'`).first()
    const totalApplications = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM applications`).first()
    const activeJobs = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM jobs WHERE status='published'`).first()
    const pendingApplications = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM applications WHERE status='applied'`).first()
    const totalConsultations = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM consultations`).first()
    const pendingConsultations = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM consultations WHERE status='pending'`).first()
    const termStudents = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM students s2 WHERE s2.status='active' ${studentDateFilter}`).first()
    const termApplications = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM applications a2 WHERE 1=1 ${dateFilter.replace(/\ba\./g, 'a2.')}`).first()

    const { results: statusBreakdown } = await c.env.DB.prepare(`
      SELECT a.status, COUNT(*) as count FROM applications a WHERE 1=1 ${dateFilter} GROUP BY a.status
    `).all()

    const { results: topCompanies } = await c.env.DB.prepare(`
      SELECT co.name as company_name, COUNT(*) as cnt
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN companies co ON co.id = j.company_id
      WHERE 1=1 ${dateFilter}
      GROUP BY co.id ORDER BY cnt DESC LIMIT 5
    `).all()

    let trendQuery = ''
    if (term === 'week') {
      trendQuery = `
        SELECT strftime('%m/%d', a.created_at) as label, COUNT(*) as count
        FROM applications a WHERE a.created_at >= datetime('now', '-7 days')
        GROUP BY strftime('%Y-%m-%d', a.created_at) ORDER BY label`
    } else if (term === 'month') {
      trendQuery = `
        SELECT strftime('%m/%d', a.created_at) as label, COUNT(*) as count
        FROM applications a WHERE a.created_at >= datetime('now', '-30 days')
        GROUP BY strftime('%Y-%m-%d', a.created_at) ORDER BY label`
    } else if (term === 'year') {
      trendQuery = `
        SELECT strftime('%Y/%m', a.created_at) as label, COUNT(*) as count
        FROM applications a WHERE a.created_at >= datetime('now', '-1 year')
        GROUP BY strftime('%Y-%m', a.created_at) ORDER BY label`
    } else {
      trendQuery = `
        SELECT strftime('%Y/%m', a.created_at) as label, COUNT(*) as count
        FROM applications a
        GROUP BY strftime('%Y-%m', a.created_at) ORDER BY label LIMIT 12`
    }
    const { results: trendData } = await c.env.DB.prepare(trendQuery).all()

    const { results: recentApplications } = await c.env.DB.prepare(`
      SELECT a.*, s.last_name || s.first_name as student_name,
        j.title as job_title, c.name as company_name
      FROM applications a
      JOIN students s ON s.id = a.student_id
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      ORDER BY a.created_at DESC LIMIT 10
    `).all()

    // 流入媒体別学生数
    const { results: sourceBreakdown } = await c.env.DB.prepare(`
      SELECT source_media, COUNT(*) as count FROM students GROUP BY source_media ORDER BY count DESC
    `).all()

    return c.json({
      success: true,
      data: {
        term,
        total_students: (totalStudents as any)?.count || 0,
        total_applications: (totalApplications as any)?.count || 0,
        active_jobs: (activeJobs as any)?.count || 0,
        pending_applications: (pendingApplications as any)?.count || 0,
        total_consultations: (totalConsultations as any)?.count || 0,
        pending_consultations: (pendingConsultations as any)?.count || 0,
        term_students: (termStudents as any)?.count || 0,
        term_applications: (termApplications as any)?.count || 0,
        status_breakdown: statusBreakdown,
        source_breakdown: sourceBreakdown,
        top_companies: topCompanies,
        trend_data: trendData,
        recent_applications: recentApplications
      }
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Internal error' }, 500)
  }
})

export default applications
