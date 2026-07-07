import { createMiddleware } from 'hono/factory'
import { Bindings } from '../types'

// Coming Soon 中でも常にアクセス可能なパス
const ALWAYS_ALLOWED = ['/register', '/consultation', '/admin', '/api/', '/static/', '/favicon']

export const comingSoonMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const path = c.req.path

  // 常に許可するパスはスキップ
  if (ALWAYS_ALLOWED.some(p => path.startsWith(p))) {
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
      // site_settings から CS 表示用テキストを取得
      const { results } = await c.env.DB.prepare(
        `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('coming_soon_title','coming_soon_subtitle','coming_soon_date')`
      ).all() as any
      const csSettings: Record<string, string> = {}
      results.forEach((r: any) => { csSettings[r.setting_key] = r.setting_value })

      return c.html(getComingSoonHTML(csSettings))
    }
  } catch (_) {
    // DB エラー時はそのまま通過
  }

  await next()
})

function getComingSoonHTML(s: Record<string, string>): string {
  const title = s.coming_soon_title || '6月公開予定'
  const subtitle = s.coming_soon_subtitle || '現在InternBaseは準備中です。公開をお楽しみに。'
  const date = s.coming_soon_date || '2025年6月'

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coming Soon | InternBase</title>
  <meta name="description" content="InternBase - 高学歴大学生向け長期インターン求人サイト。${date}公開予定。">
  <meta name="robots" content="noindex">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; }
    .gradient-text { background: linear-gradient(135deg, #4f6ef7, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-gradient { background: radial-gradient(ellipse at 20% 50%, rgba(79,110,247,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 50%), linear-gradient(to bottom, #f8faff, #ffffff); }
    .glass { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border: 1px solid rgba(79,110,247,0.2); }
    .fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  </style>
</head>
<body class="bg-white text-gray-900 min-h-screen">
  <div class="hero-gradient min-h-screen flex items-center justify-center px-4">
    <div class="max-w-lg w-full text-center fade-in">
      <div class="flex items-center justify-center gap-3 mb-10">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <i class="fas fa-rocket text-white text-lg"></i>
        </div>
        <span class="text-2xl font-black gradient-text">InternBase</span>
      </div>

      <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-5 py-2 text-sm text-blue-700 font-medium mb-6">
        <i class="fas fa-clock"></i>${date}公開予定
      </div>

      <h1 class="text-4xl sm:text-5xl font-black mb-5 leading-tight">
        <span class="gradient-text">${title}</span>
      </h1>
      <p class="text-gray-600 text-lg leading-relaxed mb-10">${subtitle}</p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/consultation"
          class="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-green-500/25">
          <i class="fab fa-line text-xl"></i>事前に無料相談する
        </a>
        <a href="/register"
          class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25">
          <i class="fas fa-user-plus"></i>事前登録する
        </a>
      </div>

      <div class="mt-16 glass rounded-2xl p-6">
        <p class="text-sm font-semibold text-gray-700 mb-3">
          <i class="fas fa-star text-yellow-400 mr-1"></i>事前登録・相談の特典
        </p>
        <ul class="text-sm text-gray-600 space-y-2 text-left">
          <li class="flex items-center gap-2"><i class="fas fa-check text-green-500 w-4"></i>公開と同時にお知らせが届く</li>
          <li class="flex items-center gap-2"><i class="fas fa-check text-green-500 w-4"></i>非公開の限定求人を先行閲覧</li>
          <li class="flex items-center gap-2"><i class="fas fa-check text-green-500 w-4"></i>キャリア相談を今すぐ予約できる</li>
        </ul>
      </div>

      <p class="text-xs text-gray-400 mt-8">© 2024 InternBase. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}
