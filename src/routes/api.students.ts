import { Hono } from 'hono'
import { Bindings } from '../types'

const students = new Hono<{ Bindings: Bindings }>()

// 学生登録（公開）
students.post('/register', async (c) => {
  const body = await c.req.json()
  const {
    last_name, first_name, last_name_kana, first_name_kana,
    email, phone, university, faculty, department, grade, graduation_year,
    invite_code, pr_text
  } = body

  if (!last_name || !first_name || !email || !university || !grade) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  // メール重複チェック
  const existing = await c.env.DB.prepare(
    `SELECT id FROM students WHERE email = ?`
  ).bind(email).first()
  if (existing) {
    return c.json({ success: false, error: 'このメールアドレスは既に登録されています' }, 409)
  }

  // 招待コード処理（任意）
  let invite_code_id: number | null = null
  if (invite_code && invite_code.trim()) {
    const code = await c.env.DB.prepare(`
      SELECT * FROM invite_codes
      WHERE code = ? AND is_active = 1
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      AND current_uses < max_uses
    `).bind(invite_code.trim().toUpperCase()).first()

    if (!code) {
      return c.json({ success: false, error: '招待コードが無効または期限切れです' }, 400)
    }
    invite_code_id = code.id as number

    // 使用回数更新
    await c.env.DB.prepare(
      `UPDATE invite_codes SET current_uses = current_uses + 1 WHERE id = ?`
    ).bind(invite_code_id).run()
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO students (
      last_name, first_name, last_name_kana, first_name_kana,
      email, phone, university, faculty, department, grade, graduation_year,
      invite_code_id, invite_code_used, pr_text
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    last_name, first_name, last_name_kana || null, first_name_kana || null,
    email, phone || null, university, faculty || null, department || null,
    grade, graduation_year || null,
    invite_code_id, invite_code ? invite_code.trim().toUpperCase() : null,
    pr_text || null
  ).run()

  return c.json({
    success: true,
    data: { id: result.meta.last_row_id, message: '登録が完了しました' }
  }, 201)
})

// ---- 管理API ----

// 学生一覧（管理）
students.get('/admin', async (c) => {
  const q = c.req.query('q')
  const university = c.req.query('university')
  const grade = c.req.query('grade')

  let query = `SELECT s.*, ic.code as invite_code_display FROM students s LEFT JOIN invite_codes ic ON ic.id = s.invite_code_id WHERE 1=1`
  const params: any[] = []

  if (q) {
    query += ` AND (s.last_name LIKE ? OR s.first_name LIKE ? OR s.email LIKE ?)`
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (university) { query += ` AND s.university LIKE ?`; params.push(`%${university}%`) }
  if (grade) { query += ` AND s.grade = ?`; params.push(grade) }

  query += ` ORDER BY s.created_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ success: true, data: results })
})

// 学生詳細（管理）
students.get('/admin/:id', async (c) => {
  const id = c.req.param('id')
  const student = await c.env.DB.prepare(
    `SELECT s.*, ic.code as invite_code_display FROM students s LEFT JOIN invite_codes ic ON ic.id = s.invite_code_id WHERE s.id = ?`
  ).bind(id).first()
  if (!student) return c.json({ success: false, error: 'Not found' }, 404)

  const { results: applications } = await c.env.DB.prepare(`
    SELECT a.*, j.title as job_title, c.name as company_name
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.student_id = ?
    ORDER BY a.created_at DESC
  `).bind(id).all()

  return c.json({ success: true, data: { ...student, applications } })
})

// 学生更新（管理）
students.put('/admin/:id', async (c) => {
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
