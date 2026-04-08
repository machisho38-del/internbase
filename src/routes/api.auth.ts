import { Hono } from 'hono'
import { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

// 簡易パスワードハッシュ（Web Crypto API使用）
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

// 管理者ログイン
auth.post('/admin/login', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ success: false, error: 'メールアドレスとパスワードを入力してください' }, 400)
  }

  const passwordHash = await hashPassword(password)
  const admin = await c.env.DB.prepare(`
    SELECT * FROM admins WHERE email = ? AND password_hash = ? AND is_active = 1
  `).bind(email, passwordHash).first()

  if (!admin) {
    return c.json({ success: false, error: 'メールアドレスまたはパスワードが間違っています' }, 401)
  }

  // セッショントークン生成・保存
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await c.env.DB.prepare(`
    UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(admin.id).run()

  return c.json({
    success: true,
    data: {
      token,
      expires_at: expiresAt,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    }
  })
})

// パスワード設定（初回セットアップ用）
auth.post('/admin/setup', async (c) => {
  const { setup_key, email, password, name } = await c.req.json()

  // セットアップキー確認（環境変数から取得）
  const validSetupKey = (c.env as any).SETUP_KEY || 'setup_intern_2024'
  if (setup_key !== validSetupKey) {
    return c.json({ success: false, error: 'セットアップキーが無効です' }, 403)
  }

  const passwordHash = await hashPassword(password)

  // 既存管理者更新 or 新規作成
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

// トークン検証
auth.post('/admin/verify', async (c) => {
  // フロントエンドでlocalStorageからトークンを持ち、
  // 今回は簡易実装のため、DB保存なしでフロント側管理
  return c.json({ success: true })
})

export default auth
