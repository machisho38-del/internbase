import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { Bindings } from '../types'

export const adminAuthMiddleware = createMiddleware<{ Bindings: Bindings; Variables: { admin: any } }>(async (c, next) => {
  const session = getCookie(c, 'admin_session')
  if (!session) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const row = await c.env.DB.prepare(`
    SELECT a.id, a.name, a.role, a.email
    FROM admin_sessions s
    JOIN admins a ON a.id = s.admin_id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND a.is_active = 1
  `).bind(session).first() as any

  if (!row) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  c.set('admin', row)
  await next()
})
