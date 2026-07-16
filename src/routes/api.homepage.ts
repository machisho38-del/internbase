import { Hono } from 'hono'
import { Bindings } from '../types'
import { adminAuthMiddleware } from '../middleware/adminAuth'

const homepage = new Hono<{ Bindings: Bindings; Variables: { admin: any } }>()

// ==========================================
// 内定者タイムライン API
// ==========================================

// 公開用：表示可能な内定者タイムラインを取得
homepage.get('/success-stories', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, student_name, university, company_name, comment, display_order
    FROM success_stories
    WHERE is_visible = 1
    ORDER BY display_order ASC, created_at DESC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理用：全タイムライン取得
homepage.get('/success-stories/admin', adminAuthMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM success_stories ORDER BY display_order ASC, created_at DESC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理用：タイムライン新規作成
homepage.post('/success-stories/admin', adminAuthMiddleware, async (c) => {
  const { student_name, university, company_name, comment, is_visible, display_order } = await c.req.json()
  const result = await c.env.DB.prepare(`
    INSERT INTO success_stories (student_name, university, company_name, comment, is_visible, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(student_name, university, company_name, comment || '', is_visible ?? 1, display_order ?? 0).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 管理用：タイムライン更新
homepage.put('/success-stories/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const { student_name, university, company_name, comment, is_visible, display_order } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE success_stories SET
      student_name = ?, university = ?, company_name = ?, comment = ?,
      is_visible = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(student_name, university, company_name, comment || '', is_visible ?? 1, display_order ?? 0, id).run()
  return c.json({ success: true })
})

// 管理用：タイムライン削除
homepage.delete('/success-stories/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM success_stories WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// ==========================================
// ピックアップ求人（人気の求人5選） API
// ==========================================

// 公開用：ピックアップ求人を取得（求人詳細含む）
homepage.get('/featured-jobs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        f.id as featured_id, f.display_order,
        j.id, j.company_id, j.title, j.slug, j.catch_copy, j.work_style, j.hourly_wage_min, j.hourly_wage_max,
        comp.name as company_name, comp.logo_url as company_logo
      FROM featured_jobs f
      JOIN jobs j ON f.job_id = j.id
      JOIN companies comp ON j.company_id = comp.id
      WHERE f.is_visible = 1 AND j.status = 'published' AND comp.status = 'published'
      ORDER BY f.display_order ASC
      LIMIT 5
    `).all()
    return c.json({ success: true, data: results })
  } catch(error: any) {
    console.error('Featured jobs error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 管理用：全ピックアップ求人取得
homepage.get('/featured-jobs/admin', adminAuthMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      f.id, f.job_id, f.is_visible, f.display_order, f.created_at,
      j.title as job_title, comp.name as company_name
    FROM featured_jobs f
    JOIN jobs j ON f.job_id = j.id
    JOIN companies comp ON j.company_id = comp.id
    ORDER BY f.display_order ASC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理用：ピックアップ求人追加
homepage.post('/featured-jobs/admin', adminAuthMiddleware, async (c) => {
  const { job_id, is_visible, display_order } = await c.req.json()
  const result = await c.env.DB.prepare(`
    INSERT INTO featured_jobs (job_id, is_visible, display_order)
    VALUES (?, ?, ?)
  `).bind(job_id, is_visible ?? 1, display_order ?? 0).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 管理用：ピックアップ求人更新
homepage.put('/featured-jobs/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const { job_id, is_visible, display_order } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE featured_jobs SET
      job_id = ?, is_visible = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(job_id, is_visible ?? 1, display_order ?? 0, id).run()
  return c.json({ success: true })
})

// 管理用：ピックアップ求人削除
homepage.delete('/featured-jobs/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM featured_jobs WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// ==========================================
// 大学タグ API
// ==========================================

// 公開用：全大学タグ取得
homepage.get('/university-tags', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, name, slug, description, display_order
    FROM university_tags
    WHERE is_visible = 1
    ORDER BY display_order ASC
  `).all()
  return c.json({ success: true, data: results })
})

// 公開用：特定大学の求人一覧取得
homepage.get('/universities/:slug/jobs', async (c) => {
  const slug = c.req.param('slug')
  
  // 大学タグを取得
  const tag = await c.env.DB.prepare(`
    SELECT * FROM university_tags WHERE slug = ? AND is_visible = 1
  `).bind(slug).first()
  
  if (!tag) {
    return c.json({ success: false, error: 'University not found' }, 404)
  }
  
  // その大学向けの求人を取得
  const { results } = await c.env.DB.prepare(`
    SELECT DISTINCT
      j.id, j.company_id, j.title, j.slug, j.catch_copy, j.description, j.work_content,
      j.work_style, j.remote_available, j.hourly_wage_min, j.hourly_wage_max,
      j.work_hours, j.work_days, j.work_location, j.target_grade, j.university_level,
      j.requirements, j.preferred_requirements, j.selection_flow, j.tags, j.recommended_for,
      j.visibility,
      comp.name as company_name, comp.logo_url as company_logo, comp.industry as company_industry
    FROM jobs j
    JOIN companies comp ON j.company_id = comp.id
    JOIN job_university_tags jut ON j.id = jut.job_id
    WHERE jut.university_tag_id = ? AND j.status = 'published' AND comp.status = 'published'
    ORDER BY j.display_order ASC, j.created_at DESC
  `).bind(tag.id).all()
  
  return c.json({ success: true, university: tag, data: results })
})

// 管理用：全大学タグ取得
homepage.get('/university-tags/admin', adminAuthMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM university_tags ORDER BY display_order ASC
  `).all()
  return c.json({ success: true, data: results })
})

// 管理用：大学タグ作成
homepage.post('/university-tags/admin', adminAuthMiddleware, async (c) => {
  const { name, slug, description, is_visible, display_order } = await c.req.json()
  const result = await c.env.DB.prepare(`
    INSERT INTO university_tags (name, slug, description, is_visible, display_order)
    VALUES (?, ?, ?, ?, ?)
  `).bind(name, slug, description || '', is_visible ?? 1, display_order ?? 0).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

// 管理用：大学タグ更新
homepage.put('/university-tags/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  const { name, slug, description, is_visible, display_order } = await c.req.json()
  await c.env.DB.prepare(`
    UPDATE university_tags SET
      name = ?, slug = ?, description = ?, is_visible = ?, display_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(name, slug, description || '', is_visible ?? 1, display_order ?? 0, id).run()
  return c.json({ success: true })
})

// 管理用：大学タグ削除
homepage.delete('/university-tags/admin/:id', adminAuthMiddleware, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM university_tags WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// 管理用：求人に大学タグを紐付け
homepage.post('/jobs/:job_id/university-tags', adminAuthMiddleware, async (c) => {
  const job_id = c.req.param('job_id')
  const { university_tag_ids } = await c.req.json() // 配列: [1, 3, 4]
  
  // 既存の紐付けを削除
  await c.env.DB.prepare(`DELETE FROM job_university_tags WHERE job_id = ?`).bind(job_id).run()
  
  // 新規紐付けを追加
  for (const tag_id of university_tag_ids || []) {
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO job_university_tags (job_id, university_tag_id) VALUES (?, ?)
    `).bind(job_id, tag_id).run()
  }
  
  return c.json({ success: true })
})

// 管理用：求人の大学タグ一覧取得
homepage.get('/jobs/:job_id/university-tags', adminAuthMiddleware, async (c) => {
  const job_id = c.req.param('job_id')
  const { results } = await c.env.DB.prepare(`
    SELECT ut.id, ut.name, ut.slug
    FROM university_tags ut
    JOIN job_university_tags jut ON ut.id = jut.university_tag_id
    WHERE jut.job_id = ?
    ORDER BY ut.display_order ASC
  `).bind(job_id).all()
  return c.json({ success: true, data: results })
})

export default homepage
