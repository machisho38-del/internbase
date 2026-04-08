import { Hono } from 'hono'
import { Bindings } from '../types'

const jobs = new Hono<{ Bindings: Bindings }>()

// 求人一覧（公開）
jobs.get('/', async (c) => {
  const industry = c.req.query('industry')
  const workStyle = c.req.query('work_style')
  const q = c.req.query('q')

  let query = `
    SELECT j.*, c.name as company_name, c.logo_url as company_logo,
           c.industry as company_industry, c.slug as company_slug
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.status = 'published' AND c.status = 'published'
  `
  const params: any[] = []

  if (industry) { query += ` AND c.industry = ?`; params.push(industry) }
  if (workStyle) { query += ` AND j.work_style = ?`; params.push(workStyle) }
  if (q) { query += ` AND (j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ?)`; params.push(`%${q}%`, `%${q}%`, `%${q}%`) }

  query += ` ORDER BY j.display_order ASC, j.created_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ success: true, data: results })
})

// 求人詳細（公開）
jobs.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const job = await c.env.DB.prepare(`
    SELECT j.*, c.name as company_name, c.logo_url as company_logo,
           c.industry as company_industry, c.slug as company_slug,
           c.description as company_description, c.mission as company_mission,
           c.culture as company_culture, c.website_url as company_website,
           c.office_location, c.office_access
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.slug = ? AND j.status = 'published' AND c.status = 'published'
  `).bind(slug).first()

  if (!job) return c.json({ success: false, error: 'Not found' }, 404)
  return c.json({ success: true, data: job })
})

// ---- 管理API ----

// 求人一覧（管理）
jobs.get('/admin/all', async (c) => {
  const companyId = c.req.query('company_id')
  let query = `
    SELECT j.*, c.name as company_name
    FROM jobs j JOIN companies c ON c.id = j.company_id
  `
  const params: any[] = []
  if (companyId) { query += ` WHERE j.company_id = ?`; params.push(companyId) }
  query += ` ORDER BY j.display_order ASC, j.created_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ success: true, data: results })
})

// 求人作成
jobs.post('/admin', async (c) => {
  const body = await c.req.json()
  const {
    company_id, title, slug, catch_copy, description, work_content,
    requirements, preferred_requirements, highlights, growth_points,
    work_hours, work_days, work_location, work_style, remote_available,
    hourly_wage_min, hourly_wage_max, wage_note, target_grade, university_level,
    min_hours_per_month, max_hours_per_month, selection_flow, tags, status, display_order
  } = body

  if (!company_id || !title || !slug || !description || !work_content) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO jobs (company_id, title, slug, catch_copy, description, work_content,
      requirements, preferred_requirements, highlights, growth_points,
      work_hours, work_days, work_location, work_style, remote_available,
      hourly_wage_min, hourly_wage_max, wage_note, target_grade, university_level,
      min_hours_per_month, max_hours_per_month, selection_flow, tags, status, display_order)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    company_id, title, slug, catch_copy || null, description, work_content,
    requirements || null, preferred_requirements || null,
    highlights ? JSON.stringify(highlights) : null, growth_points || null,
    work_hours || null, work_days || null, work_location || null,
    work_style || null, remote_available ? 1 : 0,
    hourly_wage_min || null, hourly_wage_max || null, wage_note || null,
    target_grade || null, university_level || null,
    min_hours_per_month || null, max_hours_per_month || null,
    selection_flow || null,
    tags ? JSON.stringify(tags) : null,
    status || 'published', display_order || 0
  ).run()

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
})

// 求人更新
jobs.put('/admin/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    company_id, title, slug, catch_copy, description, work_content,
    requirements, preferred_requirements, highlights, growth_points,
    work_hours, work_days, work_location, work_style, remote_available,
    hourly_wage_min, hourly_wage_max, wage_note, target_grade, university_level,
    min_hours_per_month, max_hours_per_month, selection_flow, tags, status, display_order
  } = body

  await c.env.DB.prepare(`
    UPDATE jobs SET
      company_id=?, title=?, slug=?, catch_copy=?, description=?, work_content=?,
      requirements=?, preferred_requirements=?, highlights=?, growth_points=?,
      work_hours=?, work_days=?, work_location=?, work_style=?, remote_available=?,
      hourly_wage_min=?, hourly_wage_max=?, wage_note=?, target_grade=?, university_level=?,
      min_hours_per_month=?, max_hours_per_month=?, selection_flow=?, tags=?,
      status=?, display_order=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(
    company_id, title, slug, catch_copy || null, description, work_content,
    requirements || null, preferred_requirements || null,
    highlights ? JSON.stringify(highlights) : null, growth_points || null,
    work_hours || null, work_days || null, work_location || null,
    work_style || null, remote_available ? 1 : 0,
    hourly_wage_min || null, hourly_wage_max || null, wage_note || null,
    target_grade || null, university_level || null,
    min_hours_per_month || null, max_hours_per_month || null,
    selection_flow || null,
    tags ? JSON.stringify(tags) : null,
    status || 'published', display_order || 0, id
  ).run()

  return c.json({ success: true })
})

// 求人削除
jobs.delete('/admin/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM jobs WHERE id=?`).bind(id).run()
  return c.json({ success: true })
})

export default jobs
