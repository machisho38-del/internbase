import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const auth = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// パスワードハッシュ（Web Crypto API）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'intern_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

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

  const passwordHash = await hashPassword(password)
  const admin = await c.env.DB.prepare(
    `SELECT * FROM admins WHERE email = ? AND password_hash = ? AND is_active = 1`
  ).bind(email, passwordHash).first() as any

  if (!admin) {
    return c.json({ success: false, error: 'メールアドレスまたはパスワードが間違っています' }, 401)
  }

  // セッション生成・DB保存
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

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

  const validSetupKey = (c.env as any).SETUP_KEY || 'setup_intern_2024'
  if (setup_key !== validSetupKey) {
    return c.json({ success: false, error: 'セットアップキーが無効です' }, 403)
  }

  const passwordHash = await hashPassword(password)

  const existing = await c.env.DB.prepare(`SELECT id FROM admins WHERE email = ?`).bind(email).first()
  if (existing) {
    await c.env.DB.prepare(`UPDATE admins SET password_hash = ?, name = ? WHERE email = ?`)
      .bind(passwordHash, name || '管理者', email).run()
  } else {
    await c.env.DB.prepare(`INSERT INTO admins (email, password_hash, name, role) VALUES (?, ?, ?, 'super_admin')`)
      .bind(email, passwordHash, name || '管理者').run()
  }

  return c.json({ success: true, message: 'パスワードを設定しました' })
})

// 旧互換：verify エンドポイント（廃止→meにリダイレクト）
auth.post('/admin/verify', adminAuthMiddleware, (c) => {
  return c.json({ success: true })
})

export default auth
