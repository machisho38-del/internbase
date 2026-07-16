import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const jobs = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// 求人一覧（公開）
jobs.get('/', async (c) => {
  const industry = c.req.query('industry')
  const workStyle = c.req.query('work_style')
  const q = c.req.query('q')?.trim()
  const membersOnly = c.req.query('members') === '1'
  const studentId = c.req.query('student_id')

  let query = `
    SELECT j.*, c.name as company_name, c.logo_url as company_logo,
           c.industry as company_industry, c.slug as company_slug
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE c.status = 'published'
  `
  const params: any[] = []

  if (studentId) {
    query += ` AND j.visibility IN ('public','members') AND j.status = 'published'`
  } else if (membersOnly) {
    query += ` AND j.visibility = 'members' AND j.status = 'published'`
  } else {
    query += ` AND j.visibility = 'public' AND j.status = 'published'`
  }

  if (industry) { query += ` AND c.industry = ?`; params.push(industry) }
  if (workStyle) { query += ` AND j.work_style = ?`; params.push(workStyle) }
  if (q) {
    const like = `%${q}%`
    query += ` AND (
      j.title LIKE ? OR j.slug LIKE ? OR j.catch_copy LIKE ? OR j.description LIKE ? OR
      j.work_content LIKE ? OR j.requirements LIKE ? OR j.preferred_requirements LIKE ? OR
      j.highlights LIKE ? OR j.growth_points LIKE ? OR j.work_hours LIKE ? OR j.work_days LIKE ? OR
      j.work_location LIKE ? OR j.target_grade LIKE ? OR j.university_level LIKE ? OR
      j.selection_flow LIKE ? OR j.tags LIKE ? OR j.appeal_points LIKE ? OR j.position_features LIKE ? OR
      j.onboarding_flow LIKE ? OR j.task_examples LIKE ? OR j.skill_set LIKE ? OR j.career_path LIKE ? OR
      j.recommended_for LIKE ? OR c.name LIKE ? OR c.industry LIKE ? OR c.description LIKE ? OR
      c.service_description LIKE ? OR
      CASE j.work_style WHEN 'onsite' THEN '出社' WHEN 'remote' THEN 'リモート' WHEN 'hybrid' THEN 'ハイブリッド' ELSE '' END LIKE ? OR
      CASE j.remote_available WHEN 1 THEN 'リモート可' ELSE '' END LIKE ? OR
      CASE j.visibility WHEN 'members' THEN '会員限定' ELSE '公開求人' END LIKE ?
    )`
    params.push(...Array(30).fill(like))
  }

  query += ` ORDER BY j.display_order ASC, j.created_at DESC`

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  const membersCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.visibility = 'members' AND j.status = 'published' AND c.status = 'published'
  `).first() as any

  return c.json({
    success: true,
    data: results,
    members_job_count: membersCount?.cnt || 0
  })
})

// 求人詳細（公開）
jobs.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  if (slug === 'admin') return c.json({ success: false, error: 'Not found' }, 404)

  const studentId = c.req.query('student_id')

  const job = await c.env.DB.prepare(`
    SELECT j.*, c.name as company_name, c.logo_url as company_logo,
           c.industry as company_industry, c.slug as company_slug,
           c.description as company_description, c.mission as company_mission,
           c.culture as company_culture, c.website_url as company_website,
           c.office_location, c.office_access,
           c.hero_image_url as company_hero_image_url,
           c.service_description as company_service_description
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.slug = ? AND j.status = 'published' AND c.status = 'published'
  `).bind(slug).first() as any

  if (!job) return c.json({ success: false, error: 'Not found' }, 404)

  if (job.visibility === 'members' && !studentId) {
    return c.json({
      success: false,
      error: 'members_only',
      message: 'この求人は登録学生のみ閲覧できます'
    }, 403)
  }

  return c.json({ success: true, data: job })
})

// ---- 管理API（認証必須）----

// 求人一覧（管理）
jobs.get('/admin/all', adminAuthMiddleware, async (c) => {
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
jobs.post('/admin', adminAuthMiddleware, async (c) => {
  const body = await c.req.json()
  const {
    company_id, title, slug, catch_copy, description, work_content,
    requirements, preferred_requirements, highlights, growth_points,
    work_hours, work_days, work_location, work_style, remote_available,
    hourly_wage_min, hourly_wage_max, wage_note, target_grade, university_level,
    min_hours_per_month, max_hours_per_month, selection_flow, tags,
    status, visibility, display_order,
    // Phase1 新フィールド
    appeal_points, position_features, onboarding_flow, task_examples, skill_set,
    career_path, recommended_for, hero_image_url, card_image_url
  } = body

  if (!company_id || !title || !slug || !description || !work_content) {
    return c.json({ success: false, error: '必須項目が不足しています' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO jobs (company_id, title, slug, catch_copy, description, work_content,
      requirements, preferred_requirements, highlights, growth_points,
      work_hours, work_days, work_location, work_style, remote_available,
      hourly_wage_min, hourly_wage_max, wage_note, target_grade, university_level,
      min_hours_per_month, max_hours_per_month, selection_flow, tags,
      status, visibility, display_order,
      appeal_points, position_features, onboarding_flow, task_examples, skill_set,
      career_path, recommended_for, hero_image_url, card_image_url)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
    status || 'published', visibility || 'public', display_order || 0,
    appeal_points ? JSON.stringify(appeal_points) : null,
    position_features || null, onboarding_flow || null, task_examples || null,
    skill_set ? JSON.stringify(skill_set) : null,
    career_path || null, recommended_for || null,
    hero_image_url || null, card_image_url || null
  ).run()

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
})

// 求人更新
jobs.put('/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    company_id, title, slug, catch_copy, description, work_content,
    requirements, preferred_requirements, highlights, growth_points,
    work_hours, work_days, work_location, work_style, remote_available,
    hourly_wage_min, hourly_wage_max, wage_note, target_grade, university_level,
    min_hours_per_month, max_hours_per_month, selection_flow, tags,
    status, visibility, display_order,
    appeal_points, position_features, onboarding_flow, task_examples, skill_set,
    career_path, recommended_for, hero_image_url, card_image_url
  } = body

  await c.env.DB.prepare(`
    UPDATE jobs SET
      company_id=?, title=?, slug=?, catch_copy=?, description=?, work_content=?,
      requirements=?, preferred_requirements=?, highlights=?, growth_points=?,
      work_hours=?, work_days=?, work_location=?, work_style=?, remote_available=?,
      hourly_wage_min=?, hourly_wage_max=?, wage_note=?, target_grade=?, university_level=?,
      min_hours_per_month=?, max_hours_per_month=?, selection_flow=?, tags=?,
      status=?, visibility=?, display_order=?,
      appeal_points=?, position_features=?, onboarding_flow=?, task_examples=?,
      skill_set=?, career_path=?, recommended_for=?, hero_image_url=?, card_image_url=?,
      updated_at=CURRENT_TIMESTAMP
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
    status || 'published', visibility || 'public', display_order || 0,
    appeal_points ? JSON.stringify(appeal_points) : null,
    position_features || null, onboarding_flow || null, task_examples || null,
    skill_set ? JSON.stringify(skill_set) : null,
    career_path || null, recommended_for || null,
    hero_image_url || null, card_image_url || null,
    id
  ).run()

  return c.json({ success: true })
})

// 求人削除
jobs.delete('/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM jobs WHERE id=?`).bind(id).run()
  return c.json({ success: true })
})

export default jobs
