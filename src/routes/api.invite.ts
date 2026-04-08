import { Hono } from 'hono'
import { Bindings } from '../types'

const invite = new Hono<{ Bindings: Bindings }>()

// 招待コード検証（公開）
invite.post('/verify', async (c) => {
  const { code } = await c.req.json()
  if (!code) return c.json({ success: false, error: 'コードを入力してください' }, 400)

  const result = await c.env.DB.prepare(`
    SELECT id, code, description, max_uses, current_uses, expires_at, is_active
    FROM invite_codes
    WHERE code = ? AND is_active = 1
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `).bind(code.trim().toUpperCase()).first()

  if (!result) {
    return c.json({ success: false, error: '招待コードが見つかりません' }, 404)
  }

  const remaining = (result.max_uses as number) - (result.current_uses as number)
  if (remaining <= 0) {
    return c.json({ success: false, error: 'この招待コードは使用上限に達しています' }, 400)
  }

  return c.json({
    success: true,
    data: {
      valid: true,
      code: result.code,
      description: result.description,
      remaining
    }
  })
})

// ---- 管理API ----

// 招待コード一覧（管理）
invite.get('/admin', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM invite_codes ORDER BY created_at DESC
  `).all()
  return c.json({ success: true, data: results })
})

// 招待コード作成（管理）
invite.post('/admin', async (c) => {
  const body = await c.req.json()
  const { code, description, max_uses, expires_at, issued_by } = body

  if (!code) return c.json({ success: false, error: 'コードは必須です' }, 400)

  // 自動生成対応
  const finalCode = code === 'auto'
    ? Math.random().toString(36).substring(2, 10).toUpperCase()
    : code.trim().toUpperCase()

  const result = await c.env.DB.prepare(`
    INSERT INTO invite_codes (code, description, max_uses, expires_at, issued_by)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    finalCode,
    description || null,
    max_uses || 1,
    expires_at || null,
    issued_by || 'admin'
  ).run()

  return c.json({
    success: true,
    data: { id: result.meta.last_row_id, code: finalCode }
  }, 201)
})

// 招待コード一括作成（管理）
invite.post('/admin/bulk', async (c) => {
  const { count, prefix, max_uses, expires_at, description } = await c.req.json()
  const generatedCodes: string[] = []

  for (let i = 0; i < (count || 1); i++) {
    const code = `${prefix || ''}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    await c.env.DB.prepare(`
      INSERT INTO invite_codes (code, description, max_uses, expires_at, issued_by)
      VALUES (?, ?, ?, ?, 'admin')
    `).bind(code, description || null, max_uses || 1, expires_at || null).run()
    generatedCodes.push(code)
  }

  return c.json({ success: true, data: { codes: generatedCodes } }, 201)
})

// 招待コード無効化（管理）
invite.put('/admin/:id/deactivate', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(
    `UPDATE invite_codes SET is_active = 0 WHERE id = ?`
  ).bind(id).run()
  return c.json({ success: true })
})

// 招待コード削除（管理）
invite.delete('/admin/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM invite_codes WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

export default invite
