import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'
import { hashAdminPassword, verifyAdminPassword } from '../utils/adminPassword'

const auth = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// セッショントークン生成
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// =========================================
// 管理者ログイン（Cookie発行）
// =========================================
auth.post('/admin/login', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ success: false, error: 'メールアドレスとパスワードを入力してください' }, 400)
  }

  if (String(password).length > 128) {
    return c.json({ success: false, error: 'メールアドレスまたはパスワードが間違っています' }, 401)
  }

  const admin = await c.env.DB.prepare(
    `SELECT * FROM admins WHERE lower(email) = ? AND is_active = 1`
  ).bind(String(email).trim().toLowerCase()).first() as any

  const verification = await verifyAdminPassword(String(password), admin?.password_hash)
  if (!admin || !verification.valid) {
    return c.json({ success: false, error: 'メールアドレスまたはパスワードが間違っています' }, 401)
  }

  if (verification.needsUpgrade) {
    const upgradedHash = await hashAdminPassword(String(password))
    await c.env.DB.prepare(`UPDATE admins SET password_hash = ? WHERE id = ?`)
      .bind(upgradedHash, admin.id).run()
  }

  // セッション生成・DB保存
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 19)

  await c.env.DB.prepare(
    `INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)`
  ).bind(admin.id, token, expiresAt).run()

  await c.env.DB.prepare(
    `UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(admin.id).run()

  // 古いセッションを削除（同一adminの期限切れ分）
  await c.env.DB.prepare(
    `DELETE FROM admin_sessions WHERE admin_id = ? AND expires_at <= datetime('now')`
  ).bind(admin.id).run()

  // HttpOnly Cookie 発行
  setCookie(c, 'admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 86400
  })

  return c.json({
    success: true,
    data: { name: admin.name, role: admin.role }
  })
})

// =========================================
// ログイン状態確認
// =========================================
auth.get('/admin/me', adminAuthMiddleware, (c) => {
  const admin = c.get('admin')
  return c.json({ success: true, data: admin })
})

// =========================================
// ログアウト（Cookie削除）
// =========================================
auth.post('/admin/logout', async (c) => {
  const { getCookie } = await import('hono/cookie')
  const token = getCookie(c, 'admin_session')
  if (token) {
    await c.env.DB.prepare(`DELETE FROM admin_sessions WHERE token = ?`).bind(token).run()
  }
  deleteCookie(c, 'admin_session', { path: '/' })
  return c.json({ success: true })
})

// =========================================
// パスワード設定（初回セットアップ）
// =========================================
auth.post('/admin/setup', async (c) => {
  const { setup_key, email, password, name } = await c.req.json()

  const validSetupKey = (c.env as any).SETUP_KEY
  if (!validSetupKey || setup_key !== validSetupKey) {
    return c.json({ success: false, error: 'セットアップキーが無効です' }, 403)
  }

  if (!email || !password || String(password).length < 12 || String(password).length > 128) {
    return c.json({ success: false, error: 'メールアドレスと12〜128文字のパスワードを指定してください' }, 400)
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const passwordHash = await hashAdminPassword(String(password))

  const existing = await c.env.DB.prepare(`SELECT id FROM admins WHERE lower(email) = ?`).bind(normalizedEmail).first()
  if (existing) {
    await c.env.DB.prepare(`UPDATE admins SET email = ?, password_hash = ?, name = ? WHERE id = ?`)
      .bind(normalizedEmail, passwordHash, name || '管理者', (existing as any).id).run()
  } else {
    await c.env.DB.prepare(`INSERT INTO admins (email, password_hash, name, role) VALUES (?, ?, ?, 'super_admin')`)
      .bind(normalizedEmail, passwordHash, name || '管理者').run()
  }

  return c.json({ success: true, message: 'パスワードを設定しました' })
})

// 旧互換：verify エンドポイント（廃止→meにリダイレクト）
auth.post('/admin/verify', adminAuthMiddleware, (c) => {
  return c.json({ success: true })
})

export default auth
