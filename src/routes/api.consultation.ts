import { Hono } from 'hono'
import { Bindings } from '../types'

const consultation = new Hono<{ Bindings: Bindings }>()

// 無料相談申込（公開）
consultation.post('/', async (c) => {
  const body = await c.req.json()
  const { name, email, phone, university, grade, concern, message, preferred_datetime } = body

  if (!name || !email) {
    return c.json({ success: false, error: '氏名とメールアドレスは必須です' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO consultations (name, email, phone, university, grade, concern, message, preferred_datetime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name, email, phone || null, university || null, grade || null,
    concern || null, message || null, preferred_datetime || null
  ).run()

  return c.json({
    success: true,
    data: { id: result.meta.last_row_id, message: '無料相談のお申し込みを受け付けました' }
  }, 201)
})

// ---- 管理API ----

// 相談一覧（管理）
consultation.get('/admin', async (c) => {
  const status = c.req.query('status')
  let query = `SELECT * FROM consultations WHERE 1=1`
  const params: any[] = []
  if (status) { query += ` AND status = ?`; params.push(status) }
  query += ` ORDER BY created_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ success: true, data: results })
})

// 相談ステータス更新（管理）
consultation.put('/admin/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { status, admin_memo } = body

  await c.env.DB.prepare(`
    UPDATE consultations SET status=?, admin_memo=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(status, admin_memo || null, id).run()

  return c.json({ success: true })
})

export default consultation
