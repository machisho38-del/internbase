import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'
import { hashStudentPassword, verifyStudentPassword, createStudentSession, getStudentFromSession, clearStudentSession } from '../utils/studentAuth'
import { getAuthenticatedStudentId } from '../utils/studentAccess'
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetEmailConfigured,
  passwordResetExpiresAt,
  sendPasswordResetEmail
} from '../utils/passwordReset'

const students = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// 学生登録（公開）
students.post('/register', async (c) => {
  const body = await c.req.json()
  const {
    last_name, first_name, last_name_kana, first_name_kana,
    email, phone, university, faculty, department, grade, graduation_year,
    invite_code, pr_text, source_media, password
  } = body

  const normalizedLastName = String(last_name ?? '').trim()
  const normalizedFirstName = String(first_name ?? '').trim()
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  const normalizedUniversity = String(university ?? '').trim()
  const normalizedGrade = Number(grade)

  if (!normalizedLastName || !normalizedFirstName || !normalizedEmail || !normalizedUniversity || !normalizedGrade) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return c.json({ success: false, error: '有効なメールアドレスを入力してください' }, 400)
  }

  if (normalizedLastName.length > 100 || normalizedFirstName.length > 100 ||
      normalizedUniversity.length > 200 || !Number.isInteger(normalizedGrade) ||
      normalizedGrade < 1 || normalizedGrade > 4) {
    return c.json({ success: false, error: '入力内容を確認してください' }, 400)
  }

  if (!password || String(password).length < 8 || String(password).length > 128) {
    return c.json({ success: false, error: 'パスワードは8〜128文字で入力してください' }, 400)
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM students WHERE lower(email) = ?`
  ).bind(normalizedEmail).first()
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

  const myCode = generateStudentCode(normalizedLastName, normalizedFirstName)

  const validSourceMedia = ['sunconnect','valueup','genki_intern','sokei_intern_compass','careersourcing','todai_ig','waseda_ig','keio_ig','march_ig','web','other_sns','other']
  const validatedSourceMedia = validSourceMedia.includes(source_media) ? source_media : 'other'
  const passwordHash = await hashStudentPassword(String(password))

  const result = await c.env.DB.prepare(`
    INSERT INTO students (
      last_name, first_name, last_name_kana, first_name_kana,
      email, phone, university, faculty, department, grade, graduation_year,
      invite_code_id, invite_code_used, pr_text,
      my_invite_code, referred_by_student_id, source_media, password_hash
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    normalizedLastName, normalizedFirstName, last_name_kana || null, first_name_kana || null,
    normalizedEmail, phone || null, normalizedUniversity, faculty || null, department || null,
    normalizedGrade, graduation_year || null,
    invite_code_id, invite_code ? invite_code.trim().toUpperCase() : null,
    pr_text || null,
    myCode, referred_by_student_id, validatedSourceMedia, passwordHash
  ).run()

  const studentId = result.meta.last_row_id

  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO invite_codes
      (code, description, max_uses, issued_by, code_type, student_id)
    VALUES (?, ?, 50, ?, 'student', ?)
  `).bind(
    myCode,
    `${normalizedLastName}${normalizedFirstName}さんの紹介コード`,
    normalizedEmail,
    studentId
  ).run()

  await createStudentSession(c, Number(studentId))

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
students.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ success: false, error: 'メールアドレスとパスワードを入力してください' }, 400)
  }

  if (String(password).length > 128) {
    return c.json({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const student = await c.env.DB.prepare(`
    SELECT id, last_name, first_name, email, university, grade,
           my_invite_code, password_hash, status
    FROM students
    WHERE lower(email) = ? AND status = 'active'
  `).bind(normalizedEmail).first() as any

  if (!student || !(await verifyStudentPassword(String(password), student.password_hash))) {
    return c.json({ success: false, error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
  }

  await createStudentSession(c, Number(student.id))

  return c.json({
    success: true,
    data: {
      id: student.id,
      name: `${student.last_name}${student.first_name}`,
      my_invite_code: student.my_invite_code || ''
    }
  })
})

const PASSWORD_RESET_REQUEST_MESSAGE = '登録状況にかかわらず、入力されたメールアドレス宛に再設定方法をご案内します。'

function getPasswordResetOrigin(c: any): string {
  const configuredOrigin = c.env.PUBLIC_SITE_URL?.trim()
  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin)
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin
    } catch {
      // 設定値が無効な場合は、現在アクセス中のPreview/Production URLを使用する。
    }
  }
  return new URL(c.req.url).origin
}

// パスワード再設定メール申請（公開）
students.post('/password-reset/request', async (c) => {
  const { email } = await c.req.json()
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    return c.json({ success: false, error: '有効なメールアドレスを入力してください' }, 400)
  }

  c.header('Cache-Control', 'no-store')
  const genericResponse = { success: true, message: PASSWORD_RESET_REQUEST_MESSAGE }
  const student = await c.env.DB.prepare(`
    SELECT id, email FROM students
    WHERE lower(email) = ? AND status = 'active'
  `).bind(normalizedEmail).first() as any

  // アカウントの有無やメール設定状況をレスポンスから推測できないよう常に同じ内容を返す。
  if (!student || !isPasswordResetEmailConfigured(c.env)) return c.json(genericResponse)

  const recent = await c.env.DB.prepare(`
    SELECT COUNT(*) AS count FROM student_password_resets
    WHERE student_id = ? AND requested_at > datetime('now', '-1 hour')
  `).bind(student.id).first() as any
  if (Number(recent?.count || 0) >= 3) return c.json(genericResponse)

  const token = generatePasswordResetToken()
  const tokenHash = await hashPasswordResetToken(token)
  const result = await c.env.DB.prepare(`
    INSERT INTO student_password_resets (student_id, token_hash, expires_at)
    VALUES (?, ?, ?)
  `).bind(student.id, tokenHash, passwordResetExpiresAt()).run()

  const resetUrl = `${getPasswordResetOrigin(c)}/reset-password?token=${encodeURIComponent(token)}`
  const delivered = await sendPasswordResetEmail(c.env, String(student.email), resetUrl)
  if (!delivered) {
    await c.env.DB.prepare(`DELETE FROM student_password_resets WHERE id = ?`)
      .bind(result.meta.last_row_id).run()
  }

  return c.json(genericResponse)
})

// パスワード再設定の確定（公開）
students.post('/password-reset/confirm', async (c) => {
  const { token, password } = await c.req.json()
  const normalizedToken = String(token ?? '').trim().toLowerCase()
  const normalizedPassword = String(password ?? '')

  if (!/^[a-f0-9]{64}$/.test(normalizedToken)) {
    return c.json({ success: false, error: '再設定リンクが無効か、期限切れです' }, 400)
  }
  if (normalizedPassword.length < 8 || normalizedPassword.length > 128) {
    return c.json({ success: false, error: 'パスワードは8〜128文字で入力してください' }, 400)
  }

  c.header('Cache-Control', 'no-store')
  const tokenHash = await hashPasswordResetToken(normalizedToken)
  const reset = await c.env.DB.prepare(`
    SELECT id, student_id FROM student_password_resets
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')
  `).bind(tokenHash).first() as any
  if (!reset) return c.json({ success: false, error: '再設定リンクが無効か、期限切れです' }, 400)

  const claimed = await c.env.DB.prepare(`
    UPDATE student_password_resets SET used_at = CURRENT_TIMESTAMP
    WHERE id = ? AND used_at IS NULL AND expires_at > datetime('now')
  `).bind(reset.id).run()
  if (Number(claimed.meta.changes || 0) !== 1) {
    return c.json({ success: false, error: '再設定リンクが無効か、期限切れです' }, 400)
  }

  const passwordHash = await hashStudentPassword(normalizedPassword)
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE students SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(passwordHash, reset.student_id),
    c.env.DB.prepare(`DELETE FROM student_sessions WHERE student_id = ?`).bind(reset.student_id),
    c.env.DB.prepare(`
      UPDATE student_password_resets SET used_at = COALESCE(used_at, CURRENT_TIMESTAMP)
      WHERE student_id = ? AND used_at IS NULL
    `).bind(reset.student_id)
  ])

  return c.json({ success: true, message: 'パスワードを再設定しました。新しいパスワードでログインしてください。' })
})

students.get('/me', async (c) => {
  const student = await getStudentFromSession(c)
  if (!student) return c.json({ success: false, error: 'Unauthorized' }, 401)

  c.header('Cache-Control', 'private, no-store')

  return c.json({
    success: true,
    data: {
      id: student.id,
      name: `${student.last_name}${student.first_name}`,
      email: student.email,
      university: student.university,
      grade: student.grade,
      my_invite_code: student.my_invite_code || ''
    }
  })
})

students.post('/logout', async (c) => {
  await clearStudentSession(c)
  return c.json({ success: true })
})

students.get('/mypage/:id', async (c) => {
  const sessionStudent = await getStudentFromSession(c)
  const studentId = getAuthenticatedStudentId(sessionStudent)
  if (!studentId) return c.json({ success: false, error: 'Unauthorized' }, 401)

  c.header('Cache-Control', 'private, no-store')
  const id = String(studentId)
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
