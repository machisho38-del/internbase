import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const settings = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// ローカル開発環境のWALバグ回避用メモリキャッシュ
// Cloudflare Workers本番環境ではグローバル変数はworkerライフタイム中保持される
const _settingsCache: Record<string, string> = {}

// ==========================================
// サイト設定 API
// ==========================================

// 全設定取得（公開・管理共通）
settings.get('/', async (c) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  const group = c.req.query('group')
  let query = `SELECT setting_key, setting_value, setting_type, group_name FROM site_settings WHERE 1=1`
  const params: any[] = []
  if (group) { query += ` AND group_name = ?`; params.push(group) }
  query += ` ORDER BY group_name, display_order`
  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  // key-valueのオブジェクト形式に変換
  const settingsObj: Record<string, any> = {}
  for (const row of results as any[]) {
    let val = row.setting_value
    if (row.setting_type === 'boolean') val = val === '1'
    if (row.setting_type === 'number') val = Number(val)
    settingsObj[row.setting_key] = val
  }
  return c.json({ success: true, data: settingsObj })
})

// 管理用：グループ別詳細取得
settings.get('/admin/all', adminAuthMiddleware, async (c) => {
  const hiddenKeys = [
    'line_url_todai',
    'line_url_waseda',
    'line_url_keio',
    'line_url_march',
  ]
  const hiddenGroups = ['contact', 'legacy_contact']
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM site_settings
    WHERE setting_key NOT IN (${hiddenKeys.map(() => '?').join(',')})
      AND group_name NOT IN (${hiddenGroups.map(() => '?').join(',')})
    ORDER BY group_name, display_order
  `).bind(...hiddenKeys, ...hiddenGroups).all()
  return c.json({ success: true, data: results })
})

// 公開用：現在の公開モードのみ取得
// キャッシュがあればキャッシュを返す（wrangler D1 WALバグ回避）
settings.get('/site-mode', async (c) => {
  if (_settingsCache['site_mode'] !== undefined) {
    return c.json({ success: true, data: { site_mode: _settingsCache['site_mode'] } })
  }
  const results = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT setting_value FROM site_settings WHERE setting_key = 'site_mode'`)
  ])
  const setting = results[0]?.results?.[0] as any
  const mode = setting?.setting_value ?? 'coming_soon'
  _settingsCache['site_mode'] = mode
  return c.json({ success: true, data: { site_mode: mode } })
})

// 管理用：公開モード切替
settings.put('/admin/site-mode', adminAuthMiddleware, async (c) => {
  const { site_mode } = await c.req.json()
  if (!['coming_soon', 'public'].includes(site_mode)) {
    return c.json({ success: false, error: '無効なモードです' }, 400)
  }
  await c.env.DB.prepare(
    `UPDATE site_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'site_mode'`
  ).bind(site_mode).run()
  // キャッシュを即時更新（wrangler D1 WALバグ回避）
  _settingsCache['site_mode'] = site_mode
  return c.json({ success: true, data: { site_mode } })
})

// 管理用：複数設定一括更新
settings.put('/admin/bulk/update', adminAuthMiddleware, async (c) => {
  const body = await c.req.json() // { key: value, ... }
  for (const [key, value] of Object.entries(body)) {
    await c.env.DB.prepare(`
      UPDATE site_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
    `).bind(String(value ?? ''), key).run()
  }
  return c.json({ success: true })
})

// 管理用：単一設定更新
settings.put('/admin/:key', adminAuthMiddleware, async (c) => {
  const key = c.req.param('key')
  const { value } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE site_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE setting_key = ?
  `).bind(String(value ?? ''), key).run()
  return c.json({ success: true })
})

// ==========================================
// LPセクション API
// ==========================================

settings.get('/lp-sections', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM lp_sections WHERE is_visible = 1 ORDER BY display_order
  `).all()
  return c.json({ success: true, data: results })
})

settings.get('/lp-sections/admin', adminAuthMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM lp_sections ORDER BY display_order
  `).all()
  return c.json({ success: true, data: results })
})

settings.put('/lp-sections/admin/:key', adminAuthMiddleware, async (c) => {
  const key = c.req.param('key')
  const { content, is_visible } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE lp_sections SET
      content = ?,
      is_visible = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE section_key = ?
  `).bind(
    typeof content === 'string' ? content : JSON.stringify(content),
    is_visible ? 1 : 0,
    key
  ).run()
  return c.json({ success: true })
})

// ==========================================
// FAQ API
// ==========================================

// 公開：FAQ一覧
settings.get('/faqs', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, question, answer, category, display_order
    FROM faqs WHERE is_visible = 1
    ORDER BY display_order ASC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理：FAQ一覧
settings.get('/faqs/admin', adminAuthMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM faqs ORDER BY display_order ASC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理：FAQ作成
settings.post('/faqs/admin', adminAuthMiddleware, async (c) => {
  const { question, answer, category, is_visible, display_order } = await c.req.json()
  if (!question || !answer) return c.json({ success: false, error: '質問と回答は必須です' }, 400)
  const result = await c.env.DB.prepare(`
    INSERT INTO faqs (question, answer, category, is_visible, display_order)
    VALUES (?, ?, ?, ?, ?)
  `).bind(question, answer, category || 'general', is_visible ? 1 : 1, display_order || 0).run()
  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
})

// 管理：FAQ更新
settings.put('/faqs/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const { question, answer, category, is_visible, display_order } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE faqs SET question=?, answer=?, category=?, is_visible=?, display_order=?,
    updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).bind(question, answer, category || 'general', is_visible ? 1 : 0, display_order || 0, id).run()
  return c.json({ success: true })
})

// 管理：FAQ削除
settings.delete('/faqs/admin/:id', adminAuthMiddleware, async (c) => {
  await c.env.DB.prepare(`DELETE FROM faqs WHERE id=?`).bind(c.req.param('id')).run()
  return c.json({ success: true })
})

// ==========================================
// お知らせ API
// ==========================================

// 公開：お知らせ一覧（現在有効なもの）
settings.get('/announcements', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, title, body, type, link_url, link_text, display_order
    FROM announcements
    WHERE is_visible = 1
      AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
      AND (ends_at IS NULL OR ends_at >= CURRENT_TIMESTAMP)
    ORDER BY display_order ASC, created_at DESC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理：お知らせ一覧（全件）
settings.get('/announcements/admin', adminAuthMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM announcements ORDER BY display_order ASC, created_at DESC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理：お知らせ作成
settings.post('/announcements/admin', adminAuthMiddleware, async (c) => {
  const { title, body, type, link_url, link_text, is_visible, starts_at, ends_at, display_order } = await c.req.json()
  if (!title) return c.json({ success: false, error: 'タイトルは必須です' }, 400)
  const result = await c.env.DB.prepare(`
    INSERT INTO announcements (title, body, type, link_url, link_text, is_visible, starts_at, ends_at, display_order)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).bind(
    title, body || null, type || 'info',
    link_url || null, link_text || null,
    is_visible ? 1 : 1,
    starts_at || null, ends_at || null,
    display_order || 0
  ).run()
  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
})

// 管理：お知らせ更新
settings.put('/announcements/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const { title, body, type, link_url, link_text, is_visible, starts_at, ends_at, display_order } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE announcements SET
      title=?, body=?, type=?, link_url=?, link_text=?, is_visible=?,
      starts_at=?, ends_at=?, display_order=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    title, body || null, type || 'info',
    link_url || null, link_text || null,
    is_visible ? 1 : 0,
    starts_at || null, ends_at || null,
    display_order || 0, id
  ).run()
  return c.json({ success: true })
})

// 管理：お知らせ削除
settings.delete('/announcements/admin/:id', adminAuthMiddleware, async (c) => {
  await c.env.DB.prepare(`DELETE FROM announcements WHERE id=?`).bind(c.req.param('id')).run()
  return c.json({ success: true })
})

export default settings
