import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { Bindings } from '../types'
import { escapeHtml, getPublicOrigin, renderSeoTags } from '../utils/seo'
import { isPreviewDeployment } from '../utils/deployment'

// 公開前も運用に必要な画面・静的アセット・法務ページは利用可能にする。
const ALWAYS_ALLOWED_PREFIXES = ['/admin', '/static/', '/favicon']
const ALWAYS_ALLOWED_EXACT = [
  '/consultation', '/privacy', '/terms', '/company', '/robots.txt', '/sitemap.xml', '/og-default.png'
]
const PUBLIC_API_ALLOWED = [
  '/api/health', '/api/auth/admin/login', '/api/auth/admin/setup',
  '/api/settings', '/api/settings/public-info', '/api/consultation'
]

async function hasValidAdminSession(c: any): Promise<boolean> {
  const session = getCookie(c, 'admin_session')
  if (!session) return false
  const row = await c.env.DB.prepare(`
    SELECT s.id
    FROM admin_sessions s
    JOIN admins a ON a.id = s.admin_id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND a.is_active = 1
  `).bind(session).first()
  return Boolean(row)
}

export const comingSoonMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const path = c.req.path

  // Branch Preview always exposes the application under test. Production's
  // Coming Soon setting must not mask routes or turn public APIs into 503s.
  if (isPreviewDeployment(c)) return await next()

  // 管理画面・静的アセット・法務ページはスキップ
  if (ALWAYS_ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix)) || ALWAYS_ALLOWED_EXACT.includes(path)) {
    return await next()
  }

  if (PUBLIC_API_ALLOWED.includes(path)) {
    return await next()
  }

  // site_mode を DB から取得（batch使用で最新値を確実に取得）
  try {
    const batchResult = await c.env.DB.batch([
      c.env.DB.prepare(`SELECT setting_value FROM site_settings WHERE setting_key = 'site_mode'`)
    ])
    const setting = batchResult[0]?.results?.[0] as any
    const mode = setting?.setting_value ?? 'coming_soon'

    if (mode === 'coming_soon') {
      if (path.startsWith('/api/')) {
        if (await hasValidAdminSession(c)) return await next()
        c.header('Cache-Control', 'no-store')
        return c.json({ success: false, error: 'Service is not publicly available yet' }, 503)
      }

      // site_settings から CS 表示用テキストを取得
      const { results } = await c.env.DB.prepare(
        `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('coming_soon_title','coming_soon_subtitle','coming_soon_date','line_url')`
      ).all() as any
      const csSettings: Record<string, string> = {}
      results.forEach((r: any) => { csSettings[r.setting_key] = r.setting_value })

      c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
      return c.html(getComingSoonHTML(csSettings, getPublicOrigin(c)))
    }
  } catch (_) {
    // 公開状態を確認できない場合は安全側に倒し、サイト本体を公開しない。
    if (path.startsWith('/api/')) {
      c.header('Cache-Control', 'no-store')
      return c.json({ success: false, error: 'Service availability could not be verified' }, 503)
    }
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
    return c.html(getComingSoonHTML({}, getPublicOrigin(c)), 503)
  }

  await next()
})

function getComingSoonHTML(s: Record<string, string>, origin: string): string {
  const title = escapeHtml(s.coming_soon_title || '公開準備中')
  const subtitle = escapeHtml(s.coming_soon_subtitle || '現在ガクチカインターンは準備中です。公開をお楽しみに。')
  const date = escapeHtml(s.coming_soon_date || '近日公開')
  const lineUrl = getSafeLineUrl(s.line_url)
  const seo = renderSeoTags(origin, {
    title: 'Coming Soon | ガクチカインターン',
    description: `ガクチカインターン - 高学歴大学生向け長期インターン求人サイト。${date}公開予定。`,
    path: '/',
    robots: 'noindex, nofollow'
  })

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${seo}
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; }
    .gradient-text { background: linear-gradient(135deg, #4f6ef7, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-gradient { background: radial-gradient(ellipse at 20% 50%, rgba(79,110,247,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 50%), linear-gradient(to bottom, #f8faff, #ffffff); }
    .glass { background: rgba(255,255,255,0.92); backdrop-filter: blur(14px); border: 1px solid rgba(79,110,247,0.16); box-shadow: 0 18px 50px rgba(79,110,247,0.08); }
    .fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  </style>
</head>
<body class="bg-white text-gray-900 min-h-screen">
  <div class="hero-gradient min-h-screen flex items-center justify-center px-4">
    <div class="max-w-xl w-full text-center fade-in py-10">
      <div class="flex items-center justify-center gap-3 mb-10">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <i class="fas fa-rocket text-white text-lg"></i>
        </div>
        <span class="text-2xl font-black gradient-text">ガクチカインターン</span>
      </div>

      <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-5 py-2 text-sm text-blue-700 font-medium mb-6">
        <i class="fas fa-clock"></i>${date}公開予定
      </div>

      <h1 class="text-4xl sm:text-5xl font-black mb-5 leading-tight">
        <span class="gradient-text">${title}</span>
      </h1>
      <p class="text-gray-600 text-lg leading-relaxed mb-10">${subtitle}</p>

      <div class="mt-12 glass rounded-3xl p-6 sm:p-8">
        <p class="text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-tools text-blue-500 mr-1"></i>サービス公開に向けて準備中です</p>
        <p class="text-sm text-gray-600 leading-relaxed">厳選した長期インターン求人と、学生のキャリア形成を支援する機能を準備しています。</p>
        <div class="mt-6 border-t border-gray-100 pt-6">
          <p class="text-base font-bold text-gray-900 mb-2">公開前でも無料で相談できます</p>
          <p class="text-xs text-gray-500 leading-relaxed mb-5">最新情報の受け取りや長期インターンの相談は、公式LINEまたは無料相談フォームをご利用ください。</p>
          <div class="grid sm:grid-cols-2 gap-3">
            ${lineUrl ? `
            <a href="${escapeHtml(lineUrl)}" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 bg-[#06c755] hover:bg-[#05b84e] text-white font-bold px-5 py-3.5 rounded-xl transition-colors shadow-md shadow-green-500/20">
              <i class="fab fa-line text-xl"></i>公式LINEを追加
            </a>` : `
            <span class="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-bold px-5 py-3.5 rounded-xl" aria-disabled="true">
              <i class="fab fa-line text-xl"></i>公式LINE準備中
            </span>`}
            <a href="/consultation"
              class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-5 py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20">
              <i class="fas fa-comments"></i>無料相談を申し込む
            </a>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center gap-4 text-xs text-gray-400 mt-8">
        <a href="/privacy" class="hover:text-blue-600">プライバシーポリシー</a>
        <a href="/terms" class="hover:text-blue-600">利用規約</a>
        <a href="/company" class="hover:text-blue-600">運営者情報</a>
      </div>
      <p class="text-xs text-gray-400 mt-4">© 2026 ガクチカインターン. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

function getSafeLineUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}
