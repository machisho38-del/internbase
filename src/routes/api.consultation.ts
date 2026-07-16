import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const consultation = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// 無料相談申込（公開）
consultation.post('/', async (c) => {
  const body = await c.req.json()
  const { name, email, phone, university, grade, concern, message, preferred_datetime, source_media } = body

  if (!name || !email) {
    return c.json({ success: false, error: '氏名とメールアドレスは必須です' }, 400)
  }

  const validSourceMedia = ['sunconnect','valueup','genki_intern','sokei_intern_compass','careersourcing','todai_ig','waseda_ig','keio_ig','march_ig','web','other_sns','other']
  const validatedSourceMedia = validSourceMedia.includes(source_media) ? source_media : 'other'

  const result = await c.env.DB.prepare(`
    INSERT INTO consultations (name, email, phone, university, grade, concern, message, preferred_datetime, source_media)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name, email, phone || null, university || null, grade || null,
    concern || null, message || null, preferred_datetime || null, validatedSourceMedia
  ).run()

  return c.json({
    success: true,
    data: { id: result.meta.last_row_id, message: '無料相談のお申し込みを受け付けました' }
  }, 201)
})

// ---- 管理API（認証必須）----

// 相談一覧（管理）
consultation.get('/admin', adminAuthMiddleware, async (c) => {
  const status = c.req.query('status')
  const source_media = c.req.query('source_media')
  let query = `SELECT * FROM consultations WHERE 1=1`
  const params: any[] = []
  if (status) { query += ` AND status = ?`; params.push(status) }
  if (source_media) { query += ` AND source_media = ?`; params.push(source_media) }
  query += ` ORDER BY created_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ success: true, data: results })
})

// 相談ステータス更新（管理）
consultation.put('/admin/:id', adminAuthMiddleware, async (c) => {
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
