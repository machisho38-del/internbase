import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Bindings } from './types'

import companiesApi from './routes/api.companies'
import jobsApi from './routes/api.jobs'
import studentsApi from './routes/api.students'
import applicationsApi from './routes/api.applications'
import inviteApi from './routes/api.invite'
import consultationApi from './routes/api.consultation'
import authApi from './routes/api.auth'
import settingsApi from './routes/api.settings'
import homepageApi from './routes/api.homepage'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// API ルーティング
app.route('/api/companies', companiesApi)
app.route('/api/jobs', jobsApi)
app.route('/api/students', studentsApi)
app.route('/api/applications', applicationsApi)
app.route('/api/invite', inviteApi)
app.route('/api/consultation', consultationApi)
app.route('/api/auth', authApi)
app.route('/api/settings', settingsApi)
app.route('/api/homepage', homepageApi)

// ヘルスチェック
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// 公開画面 - LP
app.get('/', (c) => {
  return c.html(getPublicHTML('home'))
})

// 公開画面 - 求人一覧
app.get('/jobs', (c) => {
  return c.html(getPublicHTML('jobs'))
})

// 公開画面 - 求人詳細
app.get('/jobs/:slug', (c) => {
  return c.html(getPublicHTML('job-detail'))
})

// 公開画面 - 大学別求人
app.get('/universities', (c) => {
  return c.html(getPublicHTML('universities'))
})

// 公開画面 - 特定大学の求人一覧
app.get('/universities/:slug', (c) => {
  return c.html(getPublicHTML('university-jobs'))
})

// 公開画面 - 登録
app.get('/register', (c) => {
  return c.html(getPublicHTML('register'))
})

// 公開画面 - 無料相談
app.get('/consultation', (c) => {
  return c.html(getPublicHTML('consultation'))
})

// 公開画面 - マイページ
app.get('/mypage', (c) => {
  return c.html(getPublicHTML('mypage'))
})

// 管理画面 - 全ページSPA
app.get('/admin', (c) => c.html(getAdminHTML()))
app.get('/admin/*', (c) => c.html(getAdminHTML()))

// --- HTML生成 ---

function getPublicHTML(page: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>InternBase - 長期インターン求人サイト</title>
  <meta name="description" content="厳選された長期インターン求人。あなたのキャリアをここから始めよう。">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#f0f4ff',
              100: '#e0e9ff',
              500: '#4f6ef7',
              600: '#3b5ce6',
              700: '#2945d4',
              900: '#1a2f99'
            },
            dark: {
              800: '#0f1629',
              900: '#080d1a',
              950: '#040810'
            }
          },
          fontFamily: {
            sans: ['Noto Sans JP', 'sans-serif']
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; }
    .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
    .gradient-text { background: linear-gradient(135deg, #4f6ef7, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-gradient { background: radial-gradient(ellipse at 20% 50%, rgba(79,110,247,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.1) 0%, transparent 50%), #080d1a; }
    .card-hover { transition: all 0.3s ease; }
    .card-hover:hover { transform: translateY(-4px); border-color: rgba(79,110,247,0.5); box-shadow: 0 20px 40px rgba(79,110,247,0.15); }
    .tag { background: rgba(79,110,247,0.15); border: 1px solid rgba(79,110,247,0.3); color: #818cf8; }
    .fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #080d1a; } ::-webkit-scrollbar-thumb { background: #2945d4; border-radius: 3px; }
    .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  </style>
</head>
<body class="bg-dark-900 text-white min-h-screen">

  <!-- ナビゲーション -->
  <nav class="fixed top-0 w-full z-50 glass border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <a href="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <i class="fas fa-rocket text-white text-sm"></i>
          </div>
          <span class="text-xl font-bold gradient-text">InternBase</span>
        </a>
        <div class="hidden md:flex items-center gap-6">
          <a href="/jobs" class="text-gray-300 hover:text-white transition-colors text-sm">求人を探す</a>
          <a href="/consultation" class="text-gray-300 hover:text-white transition-colors text-sm">無料相談</a>
        </div>
        <div class="flex items-center gap-3">
          <a href="/consultation" class="text-sm text-gray-300 hover:text-white transition-colors hidden sm:block">無料相談</a>
          <a href="/register" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
            <i class="fas fa-user-plus mr-1"></i>登録する
          </a>
        </div>
      </div>
    </div>
  </nav>

  <!-- メインコンテンツ -->
  <main id="app" class="pt-16"></main>

  <!-- フッター -->
  <footer class="border-t border-white/10 mt-24 py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-rocket text-white text-xs"></i>
            </div>
            <span class="font-bold gradient-text">InternBase</span>
          </div>
          <p class="text-gray-500 text-xs leading-relaxed">厳選された長期インターン求人で、<br>あなたのキャリアを加速させよう。</p>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-3 text-gray-300">求人を探す</h4>
          <ul class="space-y-2 text-gray-500 text-sm">
            <li><a href="/jobs" class="hover:text-white transition-colors">全ての求人</a></li>
            <li><a href="/jobs?work_style=remote" class="hover:text-white transition-colors">リモート可</a></li>
            <li><a href="/jobs?industry=IT・SaaS" class="hover:text-white transition-colors">IT・SaaS</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-3 text-gray-300">サービス</h4>
          <ul class="space-y-2 text-gray-500 text-sm">
            <li><a href="/register" class="hover:text-white transition-colors">新規登録</a></li>
            <li><a href="/consultation" class="hover:text-white transition-colors">無料相談</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-3 text-gray-300">公式LINE</h4>
          <p class="text-gray-500 text-xs mb-3">応募後の連絡は公式LINEで行います。</p>
          <a href="#" class="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg transition-colors">
            <i class="fab fa-line"></i>LINEを追加
          </a>
        </div>
      </div>
      <div class="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p class="text-gray-600 text-xs">© 2024 InternBase. All rights reserved.</p>
        <div class="flex gap-4 text-gray-600 text-xs">
          <a href="#" class="hover:text-white transition-colors">プライバシーポリシー</a>
          <a href="#" class="hover:text-white transition-colors">利用規約</a>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/public.js"></script>
  <script>
    // 現在のページを判定してルーティング
    const path = window.location.pathname;
    if (path === '/' || path === '') initHomePage();
    else if (path === '/jobs') initJobsPage();
    else if (path.startsWith('/jobs/')) initJobDetailPage();
    else if (path === '/universities') initUniversitiesPage();
    else if (path.startsWith('/universities/')) {
      const slug = path.split('/')[2];
      initUniversityJobsPage(slug);
    }
    else if (path === '/register') initRegisterPage();
    else if (path === '/consultation') initConsultationPage();
    else if (path === '/mypage') initMyPage();
  </script>
</body>
</html>`
}

function getAdminHTML(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理画面 - InternBase</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 500: '#4f6ef7', 600: '#3b5ce6', 700: '#2945d4' },
            dark: { 700: '#1a2235', 800: '#0f1629', 900: '#080d1a' }
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; }
    .sidebar-item { transition: all 0.2s; }
    .sidebar-item:hover, .sidebar-item.active { background: rgba(79,110,247,0.15); color: #818cf8; }
    .status-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 9999px; font-weight: 500; }
    .glass { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
    .table-row:hover { background: rgba(79,110,247,0.05); }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #080d1a; } ::-webkit-scrollbar-thumb { background: #2945d4; }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .modal-overlay { background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }
  </style>
</head>
<body class="bg-dark-900 text-white min-h-screen flex">

  <!-- サイドバー -->
  <aside id="sidebar" class="w-64 min-h-screen bg-dark-800 border-r border-white/10 flex flex-col fixed left-0 top-0 z-40">
    <div class="p-5 border-b border-white/10">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
          <i class="fas fa-rocket text-white text-xs"></i>
        </div>
        <span class="font-bold text-sm">InternBase</span>
        <span class="text-xs text-gray-500 ml-1">管理</span>
      </div>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <a href="#" onclick="navigate('dashboard')" data-page="dashboard" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-chart-pie w-4 text-center"></i>ダッシュボード
      </a>
      <div class="pt-3 pb-1">
        <p class="text-xs text-gray-600 px-3 uppercase tracking-wider">求人管理</p>
      </div>
      <a href="#" onclick="navigate('companies')" data-page="companies" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-building w-4 text-center"></i>企業管理
      </a>
      <a href="#" onclick="navigate('jobs')" data-page="jobs" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-briefcase w-4 text-center"></i>求人管理
      </a>
      <div class="pt-3 pb-1">
        <p class="text-xs text-gray-600 px-3 uppercase tracking-wider">学生管理</p>
      </div>
      <a href="#" onclick="navigate('students')" data-page="students" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-user-graduate w-4 text-center"></i>学生一覧
      </a>
      <a href="#" onclick="navigate('applications')" data-page="applications" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-file-alt w-4 text-center"></i>応募管理
      </a>
      <div class="pt-3 pb-1">
        <p class="text-xs text-gray-600 px-3 uppercase tracking-wider">設定</p>
      </div>
      <a href="#" onclick="navigate('invites')" data-page="invites" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-ticket-alt w-4 text-center"></i>招待コード
      </a>
      <a href="#" onclick="navigate('consultations')" data-page="consultations" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-comments w-4 text-center"></i>無料相談
      </a>
      <div class="pt-3 pb-1">
        <p class="text-xs text-gray-600 px-3 uppercase tracking-wider">コンテンツ管理</p>
      </div>
      <a href="#" onclick="navigate('site-settings')" data-page="site-settings" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-cog w-4 text-center"></i>サイト設定
      </a>
      <a href="#" onclick="navigate('lp-edit')" data-page="lp-edit" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-edit w-4 text-center"></i>LP編集
      </a>
      <a href="#" onclick="navigate('faqs')" data-page="faqs" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-question-circle w-4 text-center"></i>FAQ管理
      </a>
      <a href="#" onclick="navigate('announcements')" data-page="announcements" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-bullhorn w-4 text-center"></i>お知らせ管理
      </a>
      <div class="text-xs text-gray-600 px-3 py-2 mt-4">トップページ管理</div>
      <a href="#" onclick="navigate('success-stories')" data-page="success-stories" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-trophy w-4 text-center"></i>内定者タイムライン
      </a>
      <a href="#" onclick="navigate('featured-jobs')" data-page="featured-jobs" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-star w-4 text-center"></i>ピックアップ求人
      </a>
      <a href="#" onclick="navigate('university-tags')" data-page="university-tags" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-sm cursor-pointer">
        <i class="fas fa-university w-4 text-center"></i>大学タグ管理
      </a>
    </nav>

    <div class="p-4 border-t border-white/10">
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <i class="fas fa-circle text-green-400 text-xs"></i>
        <span id="admin-name">管理者</span>
      </div>
      <button onclick="adminLogout()" class="mt-2 text-xs text-gray-600 hover:text-red-400 transition-colors w-full text-left">
        <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
      </button>
    </div>
  </aside>

  <!-- メインコンテンツ -->
  <div class="ml-64 flex-1 flex flex-col min-h-screen">
    <!-- ヘッダー -->
    <header class="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-dark-800/50 sticky top-0 z-30">
      <div id="page-title" class="text-sm font-medium text-gray-300">ダッシュボード</div>
      <div class="flex items-center gap-3">
        <a href="/" target="_blank" class="text-xs text-gray-500 hover:text-white transition-colors">
          <i class="fas fa-external-link-alt mr-1"></i>公開画面
        </a>
      </div>
    </header>

    <!-- ページコンテンツ -->
    <main id="admin-content" class="flex-1 p-6 overflow-auto"></main>
  </div>

  <!-- モーダル -->
  <div id="modal" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay">
    <div id="modal-content" class="bg-dark-800 rounded-xl border border-white/10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/admin.js"></script>
</body>
</html>`
}

export default app
