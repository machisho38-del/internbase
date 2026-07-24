import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const students = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// 学生登録（公開）
students.post('/register', async (c) => {
  const body = await c.req.json()
  const {
    last_name, first_name, last_name_kana, first_name_kana,
    email, phone, university, faculty, department, grade, graduation_year,
    invite_code, pr_text, source_media
  } = body

  if (!last_name || !first_name || !email || !university || !grade) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM students WHERE email = ?`
  ).bind(email).first()
  if (existing) {
    return c.json({ success: false, error: 'このメールアドレスは既に登録されています' }, 409)
  }

  let invite_code_id: number | null = null
  let referred_by_student_id: number | null = null

  if (invite_code && invite_code.trim()) {
    const codeStr = invite_code.trim().toUpperCase()

    const code = await c.env.DB.prepare(`
      SELECT ic.*, s.id as referrer_student_id
      FROM invite_codes ic
      LEFT JOIN students s ON s.my_invite_code = ic.code
      WHERE ic.code = ? AND ic.is_active = 1
      AND (ic.expires_at IS NULL OR ic.expires_at > CURRENT_TIMESTAMP)
      AND ic.current_uses < ic.max_uses
    `).bind(codeStr).first() as any

    if (!code) {
      return c.json({ success: false, error: '招待コードが無効または期限切れです' }, 400)
    }
    invite_code_id = code.id as number
    if (code.referrer_student_id) {
      referred_by_student_id = code.referrer_student_id as number
    }

    await c.env.DB.prepare(
      `UPDATE invite_codes SET current_uses = current_uses + 1 WHERE id = ?`
    ).bind(invite_code_id).run()

    if (referred_by_student_id) {
      await c.env.DB.prepare(
        `UPDATE students SET referral_count = referral_count + 1,
         my_invite_code_uses = my_invite_code_uses + 1 WHERE id = ?`
      ).bind(referred_by_student_id).run()
    }
  }

  const myCode = generateStudentCode(last_name, first_name)

  const validSourceMedia = ['sunconnect','valueup','other','todai_ig','waseda_ig','keio_ig','march_ig','web','other_sns']
  const validatedSourceMedia = validSourceMedia.includes(source_media) ? source_media : 'other'

  const result = await c.env.DB.prepare(`
    INSERT INTO students (
      last_name, first_name, last_name_kana, first_name_kana,
      email, phone, university, faculty, department, grade, graduation_year,
      invite_code_id, invite_code_used, pr_text,
      my_invite_code, referred_by_student_id, source_media
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    last_name, first_name, last_name_kana || null, first_name_kana || null,
    email, phone || null, university, faculty || null, department || null,
    grade, graduation_year || null,
    invite_code_id, invite_code ? invite_code.trim().toUpperCase() : null,
    pr_text || null,
    myCode, referred_by_student_id, validatedSourceMedia
  ).run()

  const studentId = result.meta.last_row_id

  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO invite_codes
      (code, description, max_uses, issued_by, code_type, student_id)
    VALUES (?, ?, 50, ?, 'student', ?)
  `).bind(
    myCode,
    `${last_name}${first_name}さんの紹介コード`,
    email,
    studentId
  ).run()

  return c.json({
    success: true,
    data: {
      id: studentId,
      my_invite_code: myCode,
      message: '登録が完了しました'
    }
  }, 201)
})

function generateStudentCode(lastName: string, firstName: string): string {
  const prefix = (lastName[0] + firstName[0])
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, 'X')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}${random}`
}

// マイページ情報取得（公開・学生ID必要）
students.get('/mypage/:id', async (c) => {
  const id = c.req.param('id')
  const student = await c.env.DB.prepare(`
    SELECT id, last_name, first_name, email, university, grade,
           my_invite_code, my_invite_code_uses, referral_count,
           invite_code_used, status, created_at
    FROM students WHERE id = ? AND status = 'active'
  `).bind(id).first()

  if (!student) return c.json({ success: false, error: 'Not found' }, 404)

  const { results: applications } = await c.env.DB.prepare(`
    SELECT a.id, a.status, a.created_at,
           j.title as job_title, j.slug as job_slug,
           c.name as company_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.student_id = ?
    ORDER BY a.created_at DESC
  `).bind(id).all()

  const referralInfo = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM students WHERE referred_by_student_id = ?
  `).bind(id).first() as any

  return c.json({
    success: true,
    data: {
      ...student,
      applications,
      referral_count: (referralInfo as any)?.count || 0
    }
  })
})

// ---- 管理API（認証必須）----

// 学生一覧（管理）
students.get('/admin', adminAuthMiddleware, async (c) => {
  const q = c.req.query('q')
  const university = c.req.query('university')
  const grade = c.req.query('grade')
  const source_media = c.req.query('source_media')

  let query = `
    SELECT s.*, ic.code as invite_code_display
    FROM students s
    LEFT JOIN invite_codes ic ON ic.id = s.invite_code_id
    WHERE 1=1
  `
  const params: any[] = []

  if (q) {
    query += ` AND (s.last_name LIKE ? OR s.first_name LIKE ? OR s.email LIKE ?)`
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (university) { query += ` AND s.university LIKE ?`; params.push(`%${university}%`) }
  if (grade) { query += ` AND s.grade = ?`; params.push(grade) }
  if (source_media) { query += ` AND s.source_media = ?`; params.push(source_media) }

  query += ` ORDER BY s.created_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ success: true, data: results })
})

// 学生詳細（管理）
students.get('/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const student = await c.env.DB.prepare(`
    SELECT s.*, ic.code as invite_code_display
    FROM students s
    LEFT JOIN invite_codes ic ON ic.id = s.invite_code_id
    WHERE s.id = ?
  `).bind(id).first()
  if (!student) return c.json({ success: false, error: 'Not found' }, 404)

  const { results: applications } = await c.env.DB.prepare(`
    SELECT a.*, j.title as job_title, c.name as company_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.student_id = ?
    ORDER BY a.created_at DESC
  `).bind(id).all()

  const { results: referrals } = await c.env.DB.prepare(`
    SELECT id, last_name, first_name, university, grade, created_at
    FROM students WHERE referred_by_student_id = ?
  `).bind(id).all()

  return c.json({ success: true, data: { ...student, applications, referrals } })
})

// 学生更新（管理）
students.put('/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    last_name, first_name, last_name_kana, first_name_kana,
    email, phone, university, faculty, department, grade, graduation_year,
    status, admin_memo
  } = body

  await c.env.DB.prepare(`
    UPDATE students SET
      last_name=?, first_name=?, last_name_kana=?, first_name_kana=?,
      email=?, phone=?, university=?, faculty=?, department=?, grade=?,
      graduation_year=?, status=?, admin_memo=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    last_name, first_name, last_name_kana || null, first_name_kana || null,
    email, phone || null, university, faculty || null, department || null,
    grade, graduation_year || null, status || 'active', admin_memo || null, id
  ).run()

  return c.json({ success: true })
})

export default students
