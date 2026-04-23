import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const companies = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// 企業一覧（公開）
companies.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT c.*, COUNT(j.id) as job_count
    FROM companies c
    LEFT JOIN jobs j ON j.company_id = c.id AND j.status = 'published'
    WHERE c.status = 'published'
    GROUP BY c.id
    ORDER BY c.display_order ASC, c.created_at DESC
  `).all()
  return c.json({ success: true, data: results })
})

// 企業詳細（公開）
companies.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  // admin は除外
  if (slug === 'admin') return c.json({ success: false, error: 'Not found' }, 404)

  const company = await c.env.DB.prepare(
    `SELECT * FROM companies WHERE slug = ? AND status = 'published'`
  ).bind(slug).first()
  if (!company) return c.json({ success: false, error: 'Not found' }, 404)

  const { results: jobs } = await c.env.DB.prepare(`
    SELECT * FROM jobs WHERE company_id = ? AND status = 'published'
    ORDER BY display_order ASC
  `).bind((company as any).id).all()

  return c.json({ success: true, data: { ...company, jobs } })
})

// ---- 管理API（認証必須）----

// 企業一覧（管理）
companies.get('/admin/all', adminAuthMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT c.*, COUNT(j.id) as job_count
    FROM companies c
    LEFT JOIN jobs j ON j.company_id = c.id
    GROUP BY c.id
    ORDER BY c.display_order ASC, c.created_at DESC
  `).all()
  return c.json({ success: true, data: results })
})

// 企業作成
companies.post('/admin', adminAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const {
    name, slug, industry, size, founded_year, website_url, description,
    mission, culture, office_location, office_access, status, display_order,
    logo_url, hero_image_url, service_description
  } = body

  if (!name || !slug || !industry || !description) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO companies (name, slug, logo_url, industry, size, founded_year, website_url,
      description, mission, culture, office_location, office_access, status, display_order,
      hero_image_url, service_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name, slug, logo_url || null, industry, size || null, founded_year || null,
    website_url || null, description, mission || null, culture || null,
    office_location || null, office_access || null,
    status || 'published', display_order || 0,
    hero_image_url || null, service_description || null
  ).run()

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
})

// 企業更新
companies.put('/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    name, slug, industry, size, founded_year, website_url, description,
    mission, culture, office_location, office_access, status, display_order,
    logo_url, hero_image_url, service_description
  } = body

  await c.env.DB.prepare(`
    UPDATE companies SET
      name=?, slug=?, logo_url=?, industry=?, size=?, founded_year=?, website_url=?,
      description=?, mission=?, culture=?, office_location=?, office_access=?,
      status=?, display_order=?, hero_image_url=?, service_description=?,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    name, slug, logo_url || null, industry, size || null, founded_year || null,
    website_url || null, description, mission || null, culture || null,
    office_location || null, office_access || null,
    status || 'published', display_order || 0,
    hero_image_url || null, service_description || null,
    id
  ).run()

  return c.json({ success: true })
})

// 企業削除
companies.delete('/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM companies WHERE id=?`).bind(id).run()
  return c.json({ success: true })
})

export default companies
