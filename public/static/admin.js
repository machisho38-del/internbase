// ==========================================
// InternBase - 管理画面 JavaScript
// ==========================================

const API = axios.create({ baseURL: '/api', withCredentials: true });

const JOB_OCCUPATION_OPTIONS = ['営業', 'マーケティング', 'コンサルティング', '事務', 'エンジニア', '人事', '事業開発', 'その他'];

function renderAdminOccupationOptions(selected = 'その他') {
  return JOB_OCCUPATION_OPTIONS.map(o =>
    `<option value="${o}" ${selected === o ? 'selected' : ''}>${o}</option>`
  ).join('');
}

const STATUS_LABELS = {
  applied: '応募済み', reviewing: '書類選考中',
  interview1: '1次面接', interview2: '2次面接', interview3: '最終面接',
  offered: '内定', accepted: '内定承諾', rejected: '不採用', withdrawn: '辞退'
};
const STATUS_COLORS = {
  applied: 'bg-gray-500/20 text-gray-300', reviewing: 'bg-blue-500/20 text-blue-300',
  interview1: 'bg-purple-500/20 text-purple-300', interview2: 'bg-violet-500/20 text-violet-300',
  interview3: 'bg-indigo-500/20 text-indigo-300', offered: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300', rejected: 'bg-red-500/20 text-red-400',
  withdrawn: 'bg-gray-600/20 text-gray-500'
};

// ==========================================
// 認証（Cookie ベース）
// ==========================================
async function checkAuth() {
  try {
    const res = await API.get('/auth/admin/me');
    if (res.data.success) {
      const admin = res.data.data;
      const nameEl = document.getElementById('admin-name');
      if (nameEl) nameEl.textContent = admin.name || '管理者';
      return true;
    }
  } catch(e) {
    // 401 など → 未認証
  }
  showLoginPage();
  return false;
}

function showLoginPage() {
  document.getElementById('sidebar').classList.add('hidden');
  document.querySelector('.ml-64').classList.remove('ml-64');
  document.getElementById('admin-content').innerHTML = `
    <div class="min-h-screen flex items-center justify-center">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-rocket text-white text-lg"></i>
          </div>
          <h1 class="text-2xl font-bold mb-1">管理画面</h1>
          <p class="text-gray-500 text-sm">InternBase Admin</p>
        </div>
        <div class="glass rounded-2xl p-7">
          <form onsubmit="submitLogin(event)">
            <div class="mb-4">
              <label class="block text-xs text-gray-400 mb-1.5">メールアドレス</label>
              <input id="login-email" type="email" required placeholder="admin@internship.jp"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>
            <div class="mb-5">
              <label class="block text-xs text-gray-400 mb-1.5">パスワード</label>
              <input id="login-password" type="password" required placeholder="••••••••"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>
            <div id="login-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
            <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
              <i class="fas fa-sign-in-alt mr-2"></i>ログイン
            </button>
          </form>
          <div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p class="text-xs text-yellow-400/80">
              <i class="fas fa-info-circle mr-1"></i>
              初回は <code class="bg-white/10 px-1 rounded">/api/auth/admin/setup</code> でパスワードを設定してください
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function submitLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'ログイン中...';

  try {
    const res = await API.post('/auth/admin/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    });
    if (res.data.success) {
      // Cookie は自動で設定される（HttpOnly）
      window.location.reload();
    }
  } catch(e) {
    document.getElementById('login-error').textContent = e.response?.data?.error || 'ログインに失敗しました';
    document.getElementById('login-error').classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>ログイン';
  }
}

async function adminLogout() {
  try {
    await API.post('/auth/admin/logout');
  } catch(e) { /* ignore */ }
  window.location.reload();
}

// ==========================================
// ナビゲーション
// ==========================================
function navigate(page) {
  document.querySelectorAll('[data-page]').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const titles = {
    dashboard: 'ダッシュボード', companies: '企業管理', jobs: '求人管理',
    students: '学生一覧', applications: '応募管理', invites: '招待コード', consultations: '無料相談',
    'site-settings': 'サイト設定', 'lp-edit': 'LP編集', faqs: 'FAQ管理', announcements: 'お知らせ管理',
    'success-stories': '内定者タイムライン管理', 'featured-jobs': 'ピックアップ求人設定', 'university-tags': '大学タグ管理'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  const pages = {
    dashboard: loadDashboard, companies: loadCompanies, jobs: loadJobs,
    students: loadStudents, applications: loadApplications, invites: loadInvites,
    consultations: loadConsultations,
    'site-settings': loadSiteSettings, 'lp-edit': loadLpEdit,
    faqs: loadFaqs, announcements: loadAnnouncements,
    'success-stories': loadSuccessStories, 'featured-jobs': loadFeaturedJobs, 'university-tags': loadUniversityTags
  };
  if (pages[page]) pages[page]();
}

// ==========================================
// ダッシュボード
// ==========================================
let _dashTerm = 'month'; // デフォルト: 月間

async function loadDashboard(term) {
  if (term) _dashTerm = term;
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse space-y-4"><div class="h-24 bg-white/5 rounded-xl"></div><div class="h-64 bg-white/5 rounded-xl"></div></div>`;

  try {
    const res = await API.get(`/applications/admin/stats/summary?term=${_dashTerm}`);
    const d = res.data.data;

    const statusBreakdown = {};
    d.status_breakdown.forEach(s => statusBreakdown[s.status] = s.count);

    const termLabel = { week: '週間', month: '月間', year: '年間', all: '累計' };
    const termBtns = ['week', 'month', 'year', 'all'].map(t => `
      <button onclick="loadDashboard('${t}')"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${_dashTerm===t ? 'bg-primary-500 text-white' : 'glass text-gray-400 hover:text-white'}">
        ${termLabel[t]}
      </button>
    `).join('');

    content.innerHTML = `
      <!-- ターム切り替え -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold text-lg">ダッシュボード</h2>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 mr-1">表示期間：</span>
          ${termBtns}
        </div>
      </div>

      <!-- KPIカード（5枚） -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-user-graduate text-blue-400 text-sm"></i>
            </div>
            <span class="text-xs text-gray-600">累計</span>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.total_students}<span class="text-base font-normal text-gray-500 ml-1">名</span></div>
          <div class="text-xs text-gray-500 mb-1">登録学生数</div>
          ${_dashTerm !== 'all' ? `<div class="text-xs text-green-400"><i class="fas fa-arrow-up mr-0.5"></i>${termLabel[_dashTerm]}新規 ${d.term_students}名</div>` : ''}
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-file-alt text-purple-400 text-sm"></i>
            </div>
            <span class="text-xs text-gray-600">累計</span>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.total_applications}<span class="text-base font-normal text-gray-500 ml-1">件</span></div>
          <div class="text-xs text-gray-500 mb-1">総応募数</div>
          ${_dashTerm !== 'all' ? `<div class="text-xs text-purple-400"><i class="fas fa-arrow-up mr-0.5"></i>${termLabel[_dashTerm]}応募 ${d.term_applications}件</div>` : ''}
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
              <i class="fab fa-line text-green-400 text-sm"></i>
            </div>
            <span class="text-xs text-gray-600">累計</span>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.total_consultations}<span class="text-base font-normal text-gray-500 ml-1">件</span></div>
          <div class="text-xs text-gray-500 mb-1">無料相談数</div>
          <div class="text-xs text-orange-400">${d.pending_consultations}件 対応待ち</div>
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-briefcase text-teal-400 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.active_jobs}<span class="text-base font-normal text-gray-500 ml-1">件</span></div>
          <div class="text-xs text-gray-500">公開中求人</div>
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-bell text-yellow-400 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.pending_applications}<span class="text-base font-normal text-gray-500 ml-1">件</span></div>
          <div class="text-xs text-gray-500">未対応応募</div>
        </div>
      </div>

      <!-- 応募推移グラフ + 企業別応募ランキング + 流入媒体別グラフ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- 応募推移 -->
        <div class="lg:col-span-2 glass rounded-xl p-5">
          <h3 class="font-bold text-sm mb-4">応募数推移 <span class="text-gray-500 font-normal text-xs">（${termLabel[_dashTerm]}）</span></h3>
          ${d.trend_data && d.trend_data.length > 0 ? `
          <div class="flex items-end gap-1 h-28" id="trend-chart">
            ${(() => {
              const maxVal = Math.max(...d.trend_data.map(t => t.count), 1);
              return d.trend_data.map(t => `
                <div class="flex-1 flex flex-col items-center gap-1 group">
                  <div class="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">${t.count}</div>
                  <div class="w-full bg-primary-500/70 hover:bg-primary-500 rounded-t transition-colors"
                    style="height:${Math.max(4, Math.round((t.count/maxVal)*96))}px"></div>
                  <div class="text-xs text-gray-600 whitespace-nowrap" style="font-size:0.6rem">${t.label}</div>
                </div>
              `).join('');
            })()}
          </div>` : `
          <div class="h-28 flex items-center justify-center text-gray-600 text-sm">
            <i class="fas fa-chart-bar text-3xl mb-2 block opacity-20 text-center"></i>
            <p class="text-center">データがまだありません</p>
          </div>`}
        </div>

        <!-- 企業別応募ランキング -->
        <div class="glass rounded-xl p-5">
          <h3 class="font-bold text-sm mb-4">企業別応募数 <span class="text-gray-500 font-normal text-xs">Top 5</span></h3>
          <div class="space-y-3">
            ${d.top_companies && d.top_companies.length > 0
              ? d.top_companies.map((co, i) => {
                  const maxC = d.top_companies[0].cnt || 1;
                  const pct = Math.round((co.cnt / maxC) * 100);
                  return `
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-gray-300 truncate flex-1 mr-2">
                          <span class="text-gray-600 mr-1">${i+1}.</span>${co.company_name}
                        </span>
                        <span class="font-bold text-white flex-shrink-0">${co.cnt}件</span>
                      </div>
                      <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all" style="width:${pct}%; background:hsl(${230 + i*20},70%,60%)"></div>
                      </div>
                    </div>
                  `;
                }).join('')
              : '<p class="text-gray-600 text-xs text-center py-4">データがありません</p>'
            }
          </div>
        </div>
      </div>

      <!-- 流入媒体別グラフ -->
      <div class="glass rounded-xl p-5 mb-6">
        <h3 class="font-bold text-sm mb-4">流入媒体別 登録学生数 <span class="text-gray-500 font-normal text-xs">（累計）</span></h3>
        ${d.source_breakdown && d.source_breakdown.length > 0 ? (() => {
          const sourceLabels = {
            sunconnect: 'SUNCONNECT',
            valueup: 'バリューアップ',
            genki_intern: '元気インターン',
            sokei_intern_compass: '早慶インターンコンパス',
            careersourcing: 'CareerSourcing',
            other: 'その他'
          };
          const sourceColors = [
            '#4f6ef7','#a855f7','#22c55e','#f59e0b','#ef4444','#06b6d4','#8b5cf6'
          ];
          const total = d.source_breakdown.reduce((s, r) => s + (r.count || 0), 0) || 1;
          return `
          <div class="space-y-2.5">
            ${d.source_breakdown.map((row, i) => {
              const label = sourceLabels[row.source_media] || row.source_media || 'その他';
              const pct = Math.round((row.count / total) * 100);
              const color = sourceColors[i % sourceColors.length];
              return `
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-gray-400">${label}</span>
                  <span class="font-bold">${row.count}名 <span class="text-gray-600 font-normal">(${pct}%)</span></span>
                </div>
                <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" style="width:${pct}%; background:${color}"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <p class="text-xs text-gray-600 mt-3 text-right">合計 ${total}名</p>`;
        })() : '<p class="text-gray-600 text-xs text-center py-4">データがありません</p>'}
      </div>

      <!-- ステータス内訳 + 最近の応募 -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- 応募ステータス内訳 -->
        <div class="lg:col-span-2 glass rounded-xl p-5">
          <h3 class="font-bold text-sm mb-4">ステータス内訳 <span class="text-gray-500 font-normal text-xs">（${termLabel[_dashTerm]}）</span></h3>
          <div class="space-y-2.5">
            ${Object.entries(STATUS_LABELS).map(([k, label]) => {
              const count = statusBreakdown[k] || 0;
              const total = d.term_applications || d.total_applications || 1;
              const pct = Math.round((count/total)*100);
              return `
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-gray-400">${label}</span>
                    <span class="font-bold">${count}件</span>
                  </div>
                  <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 rounded-full transition-all" style="width:${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 最近の応募 -->
        <div class="lg:col-span-3 glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-sm">最近の応募</h3>
            <button onclick="navigate('applications')" class="text-xs text-primary-400 hover:text-primary-300">全て見る</button>
          </div>
          <div class="space-y-2">
            ${d.recent_applications.slice(0,8).map(a => `
              <div class="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div class="w-7 h-7 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-400">
                  ${(a.student_name||'?')[0]}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium truncate">${a.student_name}</p>
                  <p class="text-xs text-gray-500 truncate">${a.job_title} / ${a.company_name}</p>
                </div>
                <span class="status-badge ${STATUS_COLORS[a.status] || 'bg-gray-500/20 text-gray-400'} text-xs">
                  ${STATUS_LABELS[a.status] || a.status}
                </span>
              </div>
            `).join('') || '<p class="text-gray-600 text-xs text-center py-4">応募データがありません</p>'}
          </div>
        </div>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400 text-sm">データ取得に失敗しました: ${e.message}</div>`;
  }
}

// ==========================================
// 企業管理
// ==========================================
async function loadCompanies() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    const res = await API.get('/companies/admin/all');
    const companies = res.data.data;

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">企業一覧 <span class="text-gray-500 font-normal text-sm">(${companies.length}社)</span></h2>
        <button onclick="showCompanyModal()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <i class="fas fa-plus mr-1"></i>企業を追加
        </button>
      </div>
      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left text-xs text-gray-500 font-medium px-4 py-3">企業名</th>
              <th class="text-left text-xs text-gray-500 font-medium px-4 py-3 hidden md:table-cell">業種</th>
              <th class="text-left text-xs text-gray-500 font-medium px-4 py-3 hidden lg:table-cell">求人数</th>
              <th class="text-left text-xs text-gray-500 font-medium px-4 py-3">ステータス</th>
              <th class="text-left text-xs text-gray-500 font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            ${companies.map(c => `
              <tr class="table-row border-b border-white/5 last:border-0">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0">
                      ${(c.name||'?')[0]}
                    </div>
                    <div>
                      <p class="text-sm font-medium">${c.name}</p>
                      <p class="text-xs text-gray-500">/${c.slug}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 hidden md:table-cell">
                  <span class="text-xs text-gray-400">${c.industry}</span>
                </td>
                <td class="px-4 py-3 hidden lg:table-cell">
                  <span class="text-xs text-gray-400">${c.job_count}件</span>
                </td>
                <td class="px-4 py-3">
                  <span class="status-badge ${c.status==='published' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}">
                    ${c.status==='published' ? '公開中' : c.status==='draft' ? '下書き' : 'アーカイブ'}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button onclick="showCompanyModal(${JSON.stringify(c).replace(/"/g, '&quot;')})" class="text-xs text-primary-400 hover:text-primary-300">編集</button>
                    <button onclick="deleteCompany(${c.id})" class="text-xs text-red-400 hover:text-red-300">削除</button>
                  </div>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5" class="text-center text-gray-600 py-8 text-sm">企業データがありません</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`;
  }
}

function showCompanyModal(company = null) {
  const isEdit = !!company;
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');

  modalContent.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">${isEdit ? '企業を編集' : '企業を追加'}</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="${isEdit ? `submitUpdateCompany(event, ${company.id})` : 'submitCreateCompany(event)'}">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">企業名 *</label>
              <input name="name" required value="${company?.name||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">スラッグ * (URLに使用)</label>
              <input name="slug" required value="${company?.slug||''}" placeholder="company-name" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">業種 *</label>
              <input name="industry" required value="${company?.industry||''}" placeholder="IT・SaaS" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">従業員規模</label>
              <input name="size" value="${company?.size||''}" placeholder="11-50名" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">企業説明 *</label>
            <textarea name="description" required rows="3" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${company?.description||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">ミッション</label>
            <input name="mission" value="${company?.mission||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">勤務地</label>
              <input name="office_location" value="${company?.office_location||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">アクセス</label>
              <input name="office_access" value="${company?.office_access||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">企業サイト</label>
              <input name="website_url" type="url" value="${company?.website_url||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">ステータス</label>
              <select name="status" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
                <option value="published" ${company?.status==='published'?'selected':''}>公開</option>
                <option value="draft" ${company?.status==='draft'?'selected':''}>下書き</option>
                <option value="archived" ${company?.status==='archived'?'selected':''}>アーカイブ</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">ロゴ URL</label>
            <input name="logo_url" type="url" value="${company?.logo_url||''}" placeholder="https://..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">ヒーロー画像 URL <span class="text-gray-600 font-normal">（求人詳細の会社概要セクションに表示）</span></label>
            <input name="hero_image_url" type="url" value="${company?.hero_image_url||''}" placeholder="https://..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">サービス / 事業内容 <span class="text-gray-600 font-normal">（求人詳細の§5に表示）</span></label>
            <textarea name="service_description" rows="3" placeholder="提供しているサービス・事業の概要を記載..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${company?.service_description||''}</textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="closeModal()" class="flex-1 glass text-white text-sm py-2.5 rounded-lg hover:bg-white/10 transition-colors">キャンセル</button>
          <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-2.5 rounded-lg transition-colors">${isEdit ? '更新する' : '追加する'}</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function submitCreateCompany(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  try {
    await API.post('/companies/admin', data);
    closeModal(); loadCompanies();
  } catch(err) { alert(err.response?.data?.error || '作成に失敗しました'); }
}

async function submitUpdateCompany(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  try {
    await API.put(`/companies/admin/${id}`, data);
    closeModal(); loadCompanies();
  } catch(err) { alert(err.response?.data?.error || '更新に失敗しました'); }
}

async function deleteCompany(id) {
  if (!confirm('この企業を削除しますか？関連する求人も削除されます。')) return;
  await API.delete(`/companies/admin/${id}`);
  loadCompanies();
}

// ==========================================
// 求人管理
// ==========================================
async function loadJobs() {
  const content = document.getElementById('admin-content');
  try {
    const [jobsRes, companiesRes, uniTagsRes] = await Promise.all([
      API.get('/jobs/admin/all'),
      API.get('/companies/admin/all'),
      API.get('/homepage/university-tags')
    ]);
    const jobs = jobsRes.data.data;
    const companies = companiesRes.data.data;
    const universityTags = uniTagsRes.data.data || [];

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">求人一覧 <span class="text-gray-500 font-normal text-sm">(${jobs.length}件)</span></h2>
        <button onclick="showJobModal(null, ${JSON.stringify(companies).replace(/"/g,'&quot;')}, ${JSON.stringify(universityTags).replace(/"/g,'&quot;')})" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <i class="fas fa-plus mr-1"></i>求人を追加
        </button>
      </div>
      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left text-xs text-gray-500 px-4 py-3">求人名</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3 hidden md:table-cell">企業</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3 hidden lg:table-cell">時給</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3 hidden lg:table-cell">応募数</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">ステータス</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            ${jobs.map(j => `
              <tr class="table-row border-b border-white/5 last:border-0">
                <td class="px-4 py-3">
                  <p class="text-sm font-medium">${j.title}</p>
                  <p class="text-xs text-gray-500">/${j.slug}</p>
                  ${j.occupation ? `<p class="text-xs text-primary-300 mt-1"><i class="fas fa-briefcase mr-1"></i>${j.occupation}</p>` : ''}
                </td>
                <td class="px-4 py-3 hidden md:table-cell text-xs text-gray-400">${j.company_name}</td>
                <td class="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                  ${j.hourly_wage_min ? '¥'+j.hourly_wage_min.toLocaleString()+'〜' : '応相談'}
                </td>
                <td class="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">${j.applicant_count}名</td>
                <td class="px-4 py-3">
                  <div class="flex flex-col gap-1">
                    <span class="status-badge ${j.status==='published' ? 'bg-green-500/20 text-green-400' : j.status==='draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}">
                      ${j.status==='published' ? '公開中' : j.status==='draft' ? '下書き' : 'クローズ'}
                    </span>
                    ${j.visibility==='members' ? '<span class="status-badge bg-yellow-500/20 text-yellow-400"><i class="fas fa-lock mr-0.5 text-xs"></i>会員限定</span>' : '<span class="status-badge bg-gray-600/20 text-gray-400"><i class="fas fa-globe mr-0.5 text-xs"></i>全公開</span>'}
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button onclick="showJobModal(${JSON.stringify(j).replace(/"/g,'&quot;')}, ${JSON.stringify(companies).replace(/"/g,'&quot;')}, ${JSON.stringify(universityTags).replace(/"/g,'&quot;')})" class="text-xs text-primary-400 hover:text-primary-300">編集</button>
                    <a href="/jobs/${j.slug}" target="_blank" class="text-xs text-gray-400 hover:text-white">表示</a>
                    <button onclick="deleteJob(${j.id})" class="text-xs text-red-400 hover:text-red-300">削除</button>
                  </div>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="6" class="text-center text-gray-600 py-8 text-sm">求人データがありません</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) { content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`; }
}

async function showJobModal(job = null, companies = [], universityTags = []) {
  const isEdit = !!job;
  const modal = document.getElementById('modal');
  const mc = document.getElementById('modal-content');

  // 求人の大学タグを取得
  let selectedTagIds = [];
  if (isEdit && job.id) {
    try {
      const tagsRes = await API.get(`/homepage/jobs/${job.id}/university-tags`);
      selectedTagIds = tagsRes.data.data.map(t => t.id);
    } catch (e) {
      console.error('Failed to load job university tags:', e);
    }
  }

  mc.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">${isEdit ? '求人を編集' : '求人を追加'}</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="${isEdit ? `submitUpdateJob(event, ${job.id})` : 'submitCreateJob(event)'}">
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1">企業 *</label>
            <select name="company_id" required class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
              ${companies.map(c => `<option value="${c.id}" ${job?.company_id==c.id?'selected':''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">求人タイトル *</label>
              <input name="title" required value="${job?.title||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">スラッグ *</label>
              <input name="slug" required value="${job?.slug||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">職種 *</label>
            <select name="occupation" required class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
              ${renderAdminOccupationOptions(job?.occupation || 'その他')}
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">キャッチコピー</label>
            <input name="catch_copy" value="${job?.catch_copy||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">概要説明 *</label>
            <textarea name="description" required rows="2" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.description||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">業務内容 *</label>
            <textarea name="work_content" required rows="4" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.work_content||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">求める人材</label>
            <textarea name="requirements" rows="3" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.requirements||''}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">勤務時間</label>
              <input name="work_hours" value="${job?.work_hours||''}" placeholder="10:00〜18:00" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">勤務地</label>
              <input name="work_location" value="${job?.work_location||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">時給(最低)</label>
              <input name="hourly_wage_min" type="number" value="${job?.hourly_wage_min||''}" placeholder="1200" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">時給(最高)</label>
              <input name="hourly_wage_max" type="number" value="${job?.hourly_wage_max||''}" placeholder="1500" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">勤務形態</label>
              <select name="work_style" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
                <option value="onsite" ${job?.work_style==='onsite'?'selected':''}>出社</option>
                <option value="remote" ${job?.work_style==='remote'?'selected':''}>リモート</option>
                <option value="hybrid" ${job?.work_style==='hybrid'?'selected':''}>ハイブリッド</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">選考フロー</label>
            <input name="selection_flow" value="${job?.selection_flow||''}" placeholder="書類選考 → 一次面接 → 最終面接 → 内定" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">対象学年</label>
              <input name="target_grade" value="${job?.target_grade||''}" placeholder="大学1〜3年生" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">ステータス</label>
              <select name="status" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
                <option value="published" ${job?.status==='published'?'selected':''}>公開</option>
                <option value="draft" ${job?.status==='draft'?'selected':''}>下書き</option>
                <option value="closed" ${job?.status==='closed'?'selected':''}>クローズ</option>
              </select>
            </div>
          </div>
          <!-- Phase1 フィールド -->
          <div class="border-t border-white/10 pt-4">
            <p class="text-xs text-primary-400 font-bold mb-3"><i class="fas fa-star mr-1"></i>詳細ページ用フィールド（Phase1）</p>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">ヒーロー画像 URL <span class="text-gray-600 font-normal">（FVに表示）</span></label>
            <input name="hero_image_url" type="url" value="${job?.hero_image_url||''}" placeholder="https://..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">カード画像 URL <span class="text-gray-600 font-normal">（一覧カードに表示）</span></label>
            <input name="card_image_url" type="url" value="${job?.card_image_url||''}" placeholder="https://..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <!-- §2 魅力3点 (appeal_points) -->
          <div>
            <label class="block text-xs text-gray-400 mb-1">
              このインターンの魅力 <span class="text-gray-600 font-normal">（§2・最大3点、JSON保存）</span>
            </label>
            <div id="appeal-points-list" class="space-y-2 mb-2">
              ${(() => {
                let pts = [];
                try { pts = JSON.parse(job?.appeal_points || '[]'); } catch(e) {}
                if (!Array.isArray(pts) || pts.length === 0) pts = [{ icon: '🚀', title: '', body: '' }];
                return pts.slice(0,3).map((p, i) => `
                  <div class="flex gap-2 items-start appeal-point-row">
                    <input type="text" placeholder="🚀" value="${p.icon||''}" maxlength="4"
                      class="appeal-icon w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-primary-500">
                    <div class="flex-1 space-y-1">
                      <input type="text" placeholder="タイトル（例: 圧倒的な成長）" value="${(p.title||'').replace(/"/g,'&quot;')}"
                        class="appeal-title w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500">
                      <input type="text" placeholder="説明文（2〜3行）" value="${(p.body||p.description||'').replace(/"/g,'&quot;')}"
                        class="appeal-body w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500">
                    </div>
                    <button type="button" onclick="this.closest('.appeal-point-row').remove()" class="text-gray-600 hover:text-red-400 mt-1 text-xs px-1">✕</button>
                  </div>
                `).join('');
              })()}
            </div>
            <button type="button" onclick="addAppealPoint()" class="text-xs text-primary-400 hover:text-primary-300 border border-primary-500/20 rounded-lg px-3 py-1.5 transition-colors">
              <i class="fas fa-plus mr-1"></i>魅力ポイントを追加（最大3点）
            </button>
          </div>
          <!-- §10 スキルセット (skill_set) -->
          <div>
            <label class="block text-xs text-gray-400 mb-1">
              習得できるスキルセット <span class="text-gray-600 font-normal">（§10・カンマ区切りで入力）</span>
            </label>
            <input id="skill-set-input" type="text"
              value="${(() => { try { const s = JSON.parse(job?.skill_set||'[]'); return Array.isArray(s) ? s.map(x => typeof x==='string'?x:(x.name||'')).join(', ') : (job?.skill_set||''); } catch(e){ return job?.skill_set||''; } })()}"
              placeholder="例: Python, データ分析, マーケティング戦略, SQLite"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            <p class="text-xs text-gray-600 mt-1">スキル名をカンマ区切りで入力。保存時に自動でJSON配列に変換されます。</p>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">ポジションの特徴 <span class="text-gray-600 font-normal">（§6）</span></label>
            <textarea name="position_features" rows="3" placeholder="このポジションの特徴・魅力を記載..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.position_features||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">入社後の流れ <span class="text-gray-600 font-normal">（§8）</span></label>
            <textarea name="onboarding_flow" rows="3" placeholder="入社後〜3ヶ月の流れを記載..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.onboarding_flow||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">主な業務 / 案件例 <span class="text-gray-600 font-normal">（§9）</span></label>
            <textarea name="task_examples" rows="3" placeholder="具体的な業務内容・案件例を記載..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.task_examples||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">キャリアパス <span class="text-gray-600 font-normal">（§11）</span></label>
            <textarea name="career_path" rows="2" placeholder="卒業後のキャリアパスや実績事例..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.career_path||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">こんな人におすすめ <span class="text-gray-600 font-normal">（§12）</span></label>
            <textarea name="recommended_for" rows="2" placeholder="向いている人物像・推奨スキル..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${job?.recommended_for||''}</textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">おすすめ大学タグ
              <span class="text-gray-600 font-normal">（複数選択可能）</span>
            </label>
            <div id="university-tags-container" class="max-h-48 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-3">
              ${universityTags.length > 0 ? universityTags.map(tag => `
                <label class="flex items-center gap-2 py-1.5 hover:bg-white/5 rounded px-2 cursor-pointer">
                  <input type="checkbox" name="university_tag_ids" value="${tag.id}" ${selectedTagIds.includes(tag.id) ? 'checked' : ''} class="w-4 h-4 text-primary-500 rounded border-white/20 bg-white/5 focus:ring-primary-500">
                  <span class="text-sm text-gray-300">${tag.name}</span>
                </label>
              `).join('') : '<p class="text-sm text-gray-500">大学タグがありません</p>'}
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1 flex items-center gap-1">
              公開範囲
              <span class="text-gray-600 font-normal">（誰が閲覧できるか）</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 glass rounded-lg px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors border-2 ${job?.visibility==='members' ? 'border-yellow-500/50' : 'border-transparent'}" id="vis-public-label">
                <input type="radio" name="visibility" value="public" ${!job || job?.visibility==='public'?'checked':''} onchange="updateVisibilityUI(this)" class="hidden">
                <div class="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-globe text-green-400 text-sm"></i>
                </div>
                <div>
                  <p class="text-xs font-bold text-white">全員に公開</p>
                  <p class="text-xs text-gray-500">未登録でも閲覧可</p>
                </div>
              </label>
              <label class="flex items-center gap-2 glass rounded-lg px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors border-2 ${job?.visibility==='members' ? 'border-yellow-500/50' : 'border-transparent'}" id="vis-members-label">
                <input type="radio" name="visibility" value="members" ${job?.visibility==='members'?'checked':''} onchange="updateVisibilityUI(this)" class="hidden">
                <div class="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-lock text-yellow-400 text-sm"></i>
                </div>
                <div>
                  <p class="text-xs font-bold text-white">会員限定</p>
                  <p class="text-xs text-gray-500">登録学生のみ閲覧</p>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="closeModal()" class="flex-1 glass text-white text-sm py-2.5 rounded-lg hover:bg-white/10">キャンセル</button>
          <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-2.5 rounded-lg">${isEdit ? '更新する' : '追加する'}</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
}

function addAppealPoint() {
  const list = document.getElementById('appeal-points-list');
  if (!list) return;
  const rows = list.querySelectorAll('.appeal-point-row');
  if (rows.length >= 3) { alert('魅力ポイントは最大3点まで追加できます'); return; }
  const div = document.createElement('div');
  div.className = 'flex gap-2 items-start appeal-point-row';
  div.innerHTML = `
    <input type="text" placeholder="✨" maxlength="4"
      class="appeal-icon w-14 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-primary-500">
    <div class="flex-1 space-y-1">
      <input type="text" placeholder="タイトル（例: 圧倒的な成長）"
        class="appeal-title w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500">
      <input type="text" placeholder="説明文（2〜3行）"
        class="appeal-body w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500">
    </div>
    <button type="button" onclick="this.closest('.appeal-point-row').remove()" class="text-gray-600 hover:text-red-400 mt-1 text-xs px-1">✕</button>
  `;
  list.appendChild(div);
}

function collectAppealPoints() {
  const rows = document.querySelectorAll('.appeal-point-row');
  const points = [];
  rows.forEach(row => {
    const icon = row.querySelector('.appeal-icon')?.value?.trim() || '';
    const title = row.querySelector('.appeal-title')?.value?.trim() || '';
    const body = row.querySelector('.appeal-body')?.value?.trim() || '';
    if (title || body) points.push({ icon: icon || '✨', title, body });
  });
  return points;
}

function collectSkillSet() {
  const raw = document.getElementById('skill-set-input')?.value || '';
  if (!raw.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function updateVisibilityUI(radio) {
  const pubLabel = document.getElementById('vis-public-label');
  const memLabel = document.getElementById('vis-members-label');
  if (!pubLabel || !memLabel) return;
  if (radio.value === 'public') {
    pubLabel.classList.add('border-green-500/50');
    pubLabel.classList.remove('border-transparent');
    memLabel.classList.remove('border-yellow-500/50');
    memLabel.classList.add('border-transparent');
  } else {
    memLabel.classList.add('border-yellow-500/50');
    memLabel.classList.remove('border-transparent');
    pubLabel.classList.remove('border-green-500/50');
    pubLabel.classList.add('border-transparent');
  }
}

async function submitCreateJob(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.hourly_wage_min = data.hourly_wage_min ? parseInt(data.hourly_wage_min) : null;
  data.hourly_wage_max = data.hourly_wage_max ? parseInt(data.hourly_wage_max) : null;
  
  // appeal_points / skill_set を動的UIから収集してJSON化
  const appealPoints = collectAppealPoints();
  if (appealPoints.length > 0) data.appeal_points = JSON.stringify(appealPoints);
  const skillSet = collectSkillSet();
  if (skillSet.length > 0) data.skill_set = JSON.stringify(skillSet);

  // 大学タグIDを配列として取得
  const tagCheckboxes = e.target.querySelectorAll('input[name="university_tag_ids"]:checked');
  data.university_tag_ids = Array.from(tagCheckboxes).map(cb => parseInt(cb.value));
  
  try { 
    const res = await API.post('/jobs/admin', data);
    const jobId = res.data.data.id;
    
    // 大学タグを関連付け
    if (data.university_tag_ids.length > 0) {
      await API.post(`/homepage/jobs/${jobId}/university-tags`, {
        university_tag_ids: data.university_tag_ids
      });
    }
    
    closeModal(); 
    loadJobs(); 
  }
  catch(err) { alert(err.response?.data?.error || '作成に失敗しました'); }
}

async function submitUpdateJob(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.hourly_wage_min = data.hourly_wage_min ? parseInt(data.hourly_wage_min) : null;
  data.hourly_wage_max = data.hourly_wage_max ? parseInt(data.hourly_wage_max) : null;

  // appeal_points / skill_set を動的UIから収集してJSON化
  const appealPoints = collectAppealPoints();
  data.appeal_points = JSON.stringify(appealPoints);
  const skillSet = collectSkillSet();
  data.skill_set = JSON.stringify(skillSet);

  // 大学タグIDを配列として取得
  const tagCheckboxes = e.target.querySelectorAll('input[name="university_tag_ids"]:checked');
  data.university_tag_ids = Array.from(tagCheckboxes).map(cb => parseInt(cb.value));
  
  try { 
    await API.put(`/jobs/admin/${id}`, data);
    
    // 大学タグを更新（削除→再追加）
    if (data.university_tag_ids.length > 0) {
      await API.post(`/homepage/jobs/${id}/university-tags`, {
        university_tag_ids: data.university_tag_ids
      });
    } else {
      // タグが0件の場合は全削除のみ（APIのPOSTで自動削除される）
      await API.post(`/homepage/jobs/${id}/university-tags`, {
        university_tag_ids: []
      });
    }
    
    closeModal(); 
    loadJobs(); 
  }
  catch(err) { alert(err.response?.data?.error || '更新に失敗しました'); }
}

async function deleteJob(id) {
  if (!confirm('この求人を削除しますか？')) return;
  await API.delete(`/jobs/admin/${id}`); loadJobs();
}

// ==========================================
// 学生管理
// ==========================================
async function loadStudents() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;
  try {
    const res = await API.get('/students/admin');
    const students = res.data.data;
    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">学生一覧 <span class="text-gray-500 font-normal text-sm">(${students.length}名)</span></h2>
        <div class="flex gap-3">
          <input id="student-search" type="text" placeholder="名前・メール検索..." onkeydown="if(event.key==='Enter') searchStudents()"
            class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 w-48">
          <button onclick="searchStudents()" class="bg-primary-500/20 border border-primary-500/30 text-primary-400 text-sm px-3 py-1.5 rounded-lg">検索</button>
        </div>
      </div>
      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left text-xs text-gray-500 px-4 py-3">氏名</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3 hidden md:table-cell">大学・学年</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3 hidden lg:table-cell">連絡先</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3 hidden lg:table-cell">招待コード</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">登録日</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody id="students-tbody">
            ${renderStudentRows(students)}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) { content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`; }
}

function renderStudentRows(students) {
  if (!students.length) return '<tr><td colspan="6" class="text-center text-gray-600 py-8 text-sm">学生データがありません</td></tr>';
  return students.map(s => `
    <tr class="table-row border-b border-white/5 last:border-0">
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 bg-primary-500/20 rounded-full flex items-center justify-center text-xs font-bold text-primary-400">${(s.last_name||'?')[0]}</div>
          <div>
            <p class="text-sm font-medium">${s.last_name} ${s.first_name}</p>
            ${s.last_name_kana ? `<p class="text-xs text-gray-500">${s.last_name_kana} ${s.first_name_kana||''}</p>` : ''}
          </div>
        </div>
      </td>
      <td class="px-4 py-3 hidden md:table-cell">
        <p class="text-xs text-gray-300">${s.university}</p>
        <p class="text-xs text-gray-500">${s.grade}年生${s.faculty ? ' / '+s.faculty : ''}</p>
      </td>
      <td class="px-4 py-3 hidden lg:table-cell">
        <p class="text-xs text-gray-400">${s.email}</p>
        ${s.phone ? `<p class="text-xs text-gray-500">${s.phone}</p>` : ''}
      </td>
      <td class="px-4 py-3 hidden lg:table-cell">
        <span class="text-xs ${s.invite_code_used ? 'text-primary-400' : 'text-gray-600'}">${s.invite_code_used || 'なし'}</span>
      </td>
      <td class="px-4 py-3 text-xs text-gray-500">${s.created_at?.split('T')[0]||''}</td>
      <td class="px-4 py-3">
        <button onclick="showStudentDetail(${s.id})" class="text-xs text-primary-400 hover:text-primary-300">詳細</button>
      </td>
    </tr>
  `).join('');
}

async function searchStudents() {
  const q = document.getElementById('student-search')?.value;
  const res = await API.get(`/students/admin?q=${encodeURIComponent(q||'')}`);
  document.getElementById('students-tbody').innerHTML = renderStudentRows(res.data.data);
}

async function showStudentDetail(id) {
  const res = await API.get(`/students/admin/${id}`);
  const s = res.data.data;
  const modal = document.getElementById('modal');
  const mc = document.getElementById('modal-content');

  mc.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">${s.last_name} ${s.first_name}</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">メール</p>
            <p class="text-sm">${s.email}</p>
          </div>
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">電話</p>
            <p class="text-sm">${s.phone||'未登録'}</p>
          </div>
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">大学・学年</p>
            <p class="text-sm">${s.university} ${s.grade}年</p>
            ${s.faculty ? `<p class="text-xs text-gray-500">${s.faculty}</p>` : ''}
          </div>
          <div class="glass rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">招待コード</p>
            <p class="text-sm">${s.invite_code_used||'なし'}</p>
          </div>
          ${s.source_media ? `
          <div class="glass rounded-lg p-3 col-span-2">
            <p class="text-xs text-gray-500 mb-1">流入媒体</p>
            <span class="text-xs bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2 py-1 rounded-full"><i class="fas fa-share-alt mr-1"></i>${SOURCE_MEDIA_LABEL[s.source_media]||s.source_media}</span>
          </div>` : ''}
        </div>
        ${s.pr_text ? `
        <div class="glass rounded-lg p-3">
          <p class="text-xs text-gray-500 mb-1">自己PR</p>
          <p class="text-sm text-gray-300">${s.pr_text}</p>
        </div>` : ''}
        <!-- 管理メモ -->
        <div>
          <label class="block text-xs text-gray-400 mb-1">管理メモ</label>
          <textarea id="student-memo-${s.id}" rows="2" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${s.admin_memo||''}</textarea>
        </div>
        <!-- 応募履歴 -->
        ${s.applications?.length > 0 ? `
        <div>
          <h4 class="text-xs text-gray-500 mb-2">応募履歴 (${s.applications.length}件)</h4>
          <div class="space-y-2">
            ${s.applications.map(a => `
              <div class="flex items-center gap-3 glass rounded-lg px-3 py-2">
                <span class="status-badge ${STATUS_COLORS[a.status]||'bg-gray-500/20 text-gray-400'}">${STATUS_LABELS[a.status]||a.status}</span>
                <div>
                  <p class="text-xs font-medium">${a.job_title}</p>
                  <p class="text-xs text-gray-500">${a.company_name} / ${a.created_at?.split('T')[0]}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
        <div class="flex gap-3">
          <button onclick="closeModal()" class="flex-1 glass text-sm py-2 rounded-lg">閉じる</button>
          <button onclick="updateStudentMemo(${s.id})" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-2 rounded-lg">メモを保存</button>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function updateStudentMemo(id) {
  const memo = document.getElementById(`student-memo-${id}`)?.value;
  const res = await API.get(`/students/admin/${id}`);
  const s = res.data.data;
  await API.put(`/students/admin/${id}`, { ...s, admin_memo: memo });
  alert('保存しました');
}

// ==========================================
// 応募管理
// ==========================================
async function loadApplications() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;
  try {
    const res = await API.get('/applications/admin');
    const applications = res.data.data;

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">応募管理 <span class="text-gray-500 font-normal text-sm">(${applications.length}件)</span></h2>
        <div class="flex gap-2">
          <select id="app-filter-status" onchange="filterApplications()" class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none">
            <option value="">全ステータス</option>
            ${Object.entries(STATUS_LABELS).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <!-- カンバンボード風一覧 -->
      <div class="space-y-2" id="applications-list">
        ${renderApplicationRows(applications)}
      </div>
    `;
  } catch(e) { content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`; }
}

function renderApplicationRows(applications) {
  if (!applications.length) return '<div class="text-center text-gray-600 text-sm py-8">応募データがありません</div>';
  return applications.map(a => `
    <div class="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer" onclick="showApplicationDetail(${a.id})">
      <div class="w-9 h-9 bg-primary-500/20 rounded-full flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
        ${(a.student_name||'?')[0]}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <p class="text-sm font-medium">${a.student_name}</p>
          <span class="text-xs text-gray-500">${a.student_university} ${a.student_grade}年</span>
        </div>
        <p class="text-xs text-gray-500">${a.job_title} / <span class="text-gray-400">${a.company_name}</span></p>
        ${a.source_media ? `<span class="inline-flex items-center mt-1 text-xs bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2 py-0.5 rounded-full"><i class="fas fa-share-alt mr-1"></i>${SOURCE_MEDIA_LABEL[a.source_media]||a.source_media}</span>` : ''}
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        ${a.next_action ? `<span class="text-xs text-yellow-400"><i class="fas fa-exclamation-circle mr-1"></i>${a.next_action}</span>` : ''}
        <span class="status-badge ${STATUS_COLORS[a.status]||'bg-gray-500/20 text-gray-400'}">${STATUS_LABELS[a.status]||a.status}</span>
        <span class="text-xs text-gray-600 hidden lg:block">${a.created_at?.split('T')[0]||''}</span>
      </div>
    </div>
  `).join('');
}

async function filterApplications() {
  const status = document.getElementById('app-filter-status')?.value;
  const res = await API.get(`/applications/admin?status=${status}`);
  document.getElementById('applications-list').innerHTML = renderApplicationRows(res.data.data);
}

async function showApplicationDetail(id) {
  const res = await API.get(`/applications/admin/${id}`);
  const a = res.data.data;
  const modal = document.getElementById('modal');
  const mc = document.getElementById('modal-content');

  mc.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">応募詳細</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <!-- 学生情報 -->
        <div class="glass rounded-lg p-4">
          <h4 class="text-xs text-gray-500 mb-2">学生情報</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-500 text-xs">氏名</span><p>${a.last_name} ${a.first_name}</p></div>
            <div><span class="text-gray-500 text-xs">大学・学年</span><p>${a.student_university} ${a.student_grade}年</p></div>
            <div><span class="text-gray-500 text-xs">メール</span><p class="text-xs">${a.student_email}</p></div>
            <div><span class="text-gray-500 text-xs">電話</span><p class="text-xs">${a.student_phone||'未登録'}</p></div>
            ${a.source_media ? `<div><span class="text-gray-500 text-xs">応募時媒体</span><p class="text-xs mt-0.5"><span class="bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2 py-0.5 rounded-full"><i class="fas fa-share-alt mr-1"></i>${SOURCE_MEDIA_LABEL[a.source_media]||a.source_media}</span></p></div>` : ''}
            ${a.student_source_media ? `<div><span class="text-gray-500 text-xs">登録時媒体</span><p class="text-xs mt-0.5"><span class="bg-blue-500/15 border border-blue-500/25 text-blue-300 px-2 py-0.5 rounded-full"><i class="fas fa-user-plus mr-1"></i>${SOURCE_MEDIA_LABEL[a.student_source_media]||a.student_source_media}</span></p></div>` : ''}
          </div>
        </div>
        <!-- 求人情報 -->
        <div class="glass rounded-lg p-4">
          <h4 class="text-xs text-gray-500 mb-2">応募求人</h4>
          <p class="text-sm font-medium">${a.job_title}</p>
          <p class="text-xs text-gray-400">${a.company_name}</p>
        </div>
        <!-- 応募内容 -->
        ${a.motivation ? `
        <div class="glass rounded-lg p-4">
          <h4 class="text-xs text-gray-500 mb-2">応募動機</h4>
          <p class="text-sm text-gray-300 whitespace-pre-line">${a.motivation}</p>
        </div>` : ''}
        <!-- ステータス更新フォーム -->
        <form onsubmit="submitUpdateApplication(event, ${a.id})">
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-gray-400 mb-1">ステータス</label>
              <select name="status" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
                ${Object.entries(STATUS_LABELS).map(([k,v]) => `<option value="${k}" ${a.status===k?'selected':''}>${v}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">次のアクション</label>
              <input name="next_action" value="${a.next_action||''}" placeholder="例: 面接日程を調整する" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">面接日時</label>
              <input name="interview_date" type="datetime-local" value="${a.interview_date?.replace('Z','')||''}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">管理メモ</label>
              <textarea name="admin_memo" rows="3" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none">${a.admin_memo||''}</textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button type="button" onclick="closeModal()" class="flex-1 glass text-sm py-2 rounded-lg">閉じる</button>
            <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-2 rounded-lg">更新する</button>
          </div>
        </form>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function submitUpdateApplication(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  await API.put(`/applications/admin/${id}`, data);
  closeModal(); loadApplications();
}

// ==========================================
// 招待コード管理
// ==========================================
async function loadInvites() {
  const content = document.getElementById('admin-content');
  try {
    const res = await API.get('/invite/admin');
    const codes = res.data.data;
    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">招待コード <span class="text-gray-500 font-normal text-sm">(${codes.length}件)</span></h2>
        <div class="flex gap-2">
          <button onclick="showBulkCreateInvite()" class="glass border border-white/10 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10">
            <i class="fas fa-layer-group mr-1"></i>一括生成
          </button>
          <button onclick="showCreateInvite()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-1.5 rounded-lg">
            <i class="fas fa-plus mr-1"></i>コード作成
          </button>
        </div>
      </div>
      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left text-xs text-gray-500 px-4 py-3">コード</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">説明</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">使用数</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3 hidden md:table-cell">有効期限</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">状態</th>
              <th class="text-left text-xs text-gray-500 px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            ${codes.map(c => `
              <tr class="table-row border-b border-white/5 last:border-0">
                <td class="px-4 py-3">
                  <code class="bg-white/5 px-2 py-0.5 rounded text-sm font-mono text-primary-400">${c.code}</code>
                  <button onclick="navigator.clipboard.writeText('${c.code}')" class="ml-1 text-gray-600 hover:text-gray-300 text-xs">
                    <i class="fas fa-copy"></i>
                  </button>
                </td>
                <td class="px-4 py-3 text-xs text-gray-400">${c.description||'-'}</td>
                <td class="px-4 py-3 text-xs">
                  <span class="${c.current_uses >= c.max_uses ? 'text-red-400' : 'text-green-400'}">${c.current_uses}</span>
                  <span class="text-gray-600">/${c.max_uses}</span>
                </td>
                <td class="px-4 py-3 hidden md:table-cell text-xs text-gray-400">${c.expires_at?.split('T')[0]||'無期限'}</td>
                <td class="px-4 py-3">
                  <span class="status-badge ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-500'}">
                    ${c.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    ${c.is_active ? `<button onclick="deactivateInvite(${c.id})" class="text-xs text-yellow-400 hover:text-yellow-300">無効化</button>` : ''}
                    <button onclick="deleteInvite(${c.id})" class="text-xs text-red-400 hover:text-red-300">削除</button>
                  </div>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="6" class="text-center text-gray-600 py-8 text-sm">招待コードがありません</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) { content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`; }
}

function showCreateInvite() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">招待コードを作成</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="submitCreateInvite(event)">
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1">コード（空欄で自動生成）</label>
            <input name="code" placeholder="FRIEND001 または空欄" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 uppercase">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">説明（管理用）</label>
            <input name="description" placeholder="友人紹介コード" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">使用上限</label>
              <input name="max_uses" type="number" value="1" min="1" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">有効期限</label>
              <input name="expires_at" type="date" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="closeModal()" class="flex-1 glass text-sm py-2 rounded-lg">キャンセル</button>
          <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-2 rounded-lg">作成する</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
}

function showBulkCreateInvite() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">招待コードを一括生成</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="submitBulkCreateInvite(event)">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">生成数</label>
              <input name="count" type="number" value="10" min="1" max="100" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">プレフィックス（任意）</label>
              <input name="prefix" placeholder="INTERN" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 uppercase">
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">説明</label>
            <input name="description" placeholder="2024年度キャンペーン" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">有効期限</label>
            <input name="expires_at" type="date" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
          </div>
        </div>
        <div id="bulk-result" class="hidden mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 max-h-32 overflow-y-auto"></div>
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="closeModal()" class="flex-1 glass text-sm py-2 rounded-lg">閉じる</button>
          <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-2 rounded-lg">一括生成</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function submitCreateInvite(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.code = data.code || 'auto';
  try {
    const res = await API.post('/invite/admin', data);
    closeModal(); loadInvites();
    alert(`コード「${res.data.data.code}」を作成しました`);
  } catch(err) { alert(err.response?.data?.error || '作成に失敗しました'); }
}

async function submitBulkCreateInvite(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  try {
    const res = await API.post('/invite/admin/bulk', { ...data, count: parseInt(data.count), max_uses: 1 });
    const codes = res.data.data.codes;
    document.getElementById('bulk-result').innerHTML = codes.join('  ');
    document.getElementById('bulk-result').classList.remove('hidden');
    loadInvites();
  } catch(err) { alert(err.response?.data?.error || '生成に失敗しました'); }
}

async function deactivateInvite(id) {
  if (!confirm('このコードを無効化しますか？')) return;
  await API.put(`/invite/admin/${id}/deactivate`); loadInvites();
}
async function deleteInvite(id) {
  if (!confirm('このコードを削除しますか？')) return;
  await API.delete(`/invite/admin/${id}`); loadInvites();
}

// ==========================================
// 無料相談管理
// ==========================================
async function loadConsultations() {
  const content = document.getElementById('admin-content');
  try {
    const res = await API.get('/consultation/admin');
    const cons = res.data.data;
    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">無料相談一覧 <span class="text-gray-500 font-normal text-sm">(${cons.length}件)</span></h2>
        <select onchange="filterConsultations(this.value)" class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300">
          <option value="">全ステータス</option>
          <option value="pending">未対応</option>
          <option value="contacted">連絡済み</option>
          <option value="completed">対応完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>
      <div class="space-y-3" id="consultations-list">
        ${renderConsultationRows(cons)}
      </div>
    `;
  } catch(e) { content.innerHTML = `<div class="text-red-400">取得失敗</div>`; }
}

const SOURCE_MEDIA_LABEL = {
  sunconnect: 'SUNCONNECT',
  valueup: 'バリューアップ',
  genki_intern: '元気インターン',
  sokei_intern_compass: '早慶インターンコンパス',
  careersourcing: 'CareerSourcing',
  other: 'その他'
};

function renderConsultationRows(cons) {
  const statusMap = { pending: { label: '未対応', cls: 'bg-yellow-500/20 text-yellow-400' }, contacted: { label: '連絡済み', cls: 'bg-blue-500/20 text-blue-400' }, completed: { label: '対応完了', cls: 'bg-green-500/20 text-green-400' }, cancelled: { label: 'キャンセル', cls: 'bg-gray-600/20 text-gray-500' } };
  if (!cons.length) return '<div class="text-center text-gray-600 text-sm py-8">相談データがありません</div>';
  return cons.map(c => `
    <div class="glass rounded-xl p-4">
      <div class="flex items-start gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <p class="font-medium text-sm">${c.name}</p>
            <span class="status-badge ${(statusMap[c.status]||{cls:'bg-gray-500/20 text-gray-400'}).cls}">${(statusMap[c.status]||{label:c.status}).label}</span>
            ${c.source_media ? `<span class="text-xs bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2 py-0.5 rounded-full"><i class="fas fa-share-alt mr-1"></i>${SOURCE_MEDIA_LABEL[c.source_media]||c.source_media}</span>` : ''}
          </div>
          <p class="text-xs text-gray-400">${c.email} ${c.university ? '/ '+c.university : ''} ${c.grade ? c.grade+'年' : ''}</p>
          ${c.concern ? `<p class="text-xs text-gray-500 mt-1">${c.concern}</p>` : ''}
          ${c.message ? `<p class="text-sm text-gray-300 mt-2">${c.message}</p>` : ''}
          <p class="text-xs text-gray-600 mt-1">${c.created_at?.split('T')[0]||''}</p>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <select onchange="updateConsultationStatus(${c.id}, this.value)" class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300">
            <option value="pending" ${c.status==='pending'?'selected':''}>未対応</option>
            <option value="contacted" ${c.status==='contacted'?'selected':''}>連絡済み</option>
            <option value="completed" ${c.status==='completed'?'selected':''}>完了</option>
            <option value="cancelled" ${c.status==='cancelled'?'selected':''}>キャンセル</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}

async function filterConsultations(status) {
  const res = await API.get(`/consultation/admin?status=${status}`);
  document.getElementById('consultations-list').innerHTML = renderConsultationRows(res.data.data);
}

async function updateConsultationStatus(id, status) {
  await API.put(`/consultation/admin/${id}`, { status });
}

// ==========================================
// サイト設定ページ
// ==========================================
async function loadSiteSettings() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    const res = await API.get('/settings/admin/all');
    const settings = res.data.data;

    // グループ別にまとめる
    const groups = {};
    settings.forEach(s => {
      if (!groups[s.group_name]) groups[s.group_name] = [];
      groups[s.group_name].push(s);
    });

    // LP関連グループはLP編集ページで管理するため、サイト設定から除外
    const LP_GROUPS = ['hero', 'stats', 'cta', 'members', 'features'];

    const groupLabels = {
      site: 'サイト基本情報', general: 'サイト基本情報',
      line: 'LINE・SNS設定',
      footer: 'フッター設定',
      referral: '学生招待コード設定',
    };

    const settingLabels = {
      line_url: '公式LINE URL（デフォルト・旧導線）',
      line_id: '公式LINE ID',
      line_url_default: 'LINE URL（その他・デフォルト）',
      line_url_sunconnect: 'SUNCONNECT公式LINE URL',
      line_url_valueup: 'バリューアップ公式LINE URL',
      line_url_genki_intern: '元気インターン公式LINE URL',
      line_url_sokei_intern_compass: '早慶インターンコンパス公式LINE URL',
      line_url_careersourcing: 'CareerSourcing公式LINE URL',
      twitter_url: 'Twitter/X URL',
      instagram_url: 'Instagram URL',
      contact_email: '連絡先メールアドレス',
      site_name: 'サイト名',
      site_mode: '公開モード',
      coming_soon_title: 'Coming Soon見出し',
      coming_soon_subtitle: 'Coming Soon説明文',
      coming_soon_date: 'Coming Soon公開予定日',
      student_referral_enabled: '学生紹介機能',
    };

    const inputField = (s) => {
      if (s.setting_type === 'boolean') {
        return `<select id="setting-${s.setting_key}" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option value="1" ${s.setting_value==='1'?'selected':''}>有効</option>
          <option value="0" ${s.setting_value!=='1'?'selected':''}>無効</option>
        </select>`;
      }
      if (s.setting_type === 'text' || (s.setting_value && s.setting_value.length > 60)) {
        return `<textarea id="setting-${s.setting_key}" rows="3" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none">${s.setting_value||''}</textarea>`;
      }
      return `<input id="setting-${s.setting_key}" type="text" value="${(s.setting_value||'').replace(/"/g,'&quot;')}"
        class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">`;
    };

    // site_mode の現在値を取得
    const siteModeSetting = settings.find(s => s.setting_key === 'site_mode');
    const currentSiteMode = siteModeSetting?.setting_value || 'coming_soon';
    const isPublic = currentSiteMode === 'public';

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold">サイト設定</h2>
        <button onclick="saveAllSettings()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          <i class="fas fa-save mr-1"></i>すべて保存
        </button>
      </div>

      <!-- ★ 公開モード切替 -->
      <div class="glass rounded-xl p-5 mb-5 border ${isPublic ? 'border-green-500/30' : 'border-yellow-500/30'}">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold mb-1 flex items-center gap-2">
              <i class="fas fa-toggle-${isPublic ? 'on text-green-400' : 'off text-yellow-400'}"></i>
              公開モード切替
            </h3>
            <p class="text-xs text-gray-400">現在: <span id="site-mode-label" class="font-bold ${isPublic ? 'text-green-400' : 'text-yellow-400'}">${isPublic ? '✅ 公開中' : '🔒 Coming Soon'}</span></p>
            <p class="text-xs text-gray-500 mt-1">${isPublic ? '現在、全ユーザーが求人一覧・詳細を閲覧できます。' : '現在、Coming Soonページが表示されています。/register と /consultation は引き続き利用可能です。'}</p>
          </div>
          <div class="flex flex-col gap-2 items-end">
            <button onclick="toggleSiteMode('public')" ${isPublic ? 'disabled' : ''}
              class="px-4 py-2 text-sm rounded-lg font-bold transition-colors ${isPublic ? 'bg-green-500/10 text-green-500 cursor-not-allowed border border-green-500/20' : 'bg-green-500 hover:bg-green-600 text-white'}">
              <i class="fas fa-globe mr-1"></i>公開に切り替える
            </button>
            <button onclick="toggleSiteMode('coming_soon')" ${!isPublic ? 'disabled' : ''}
              class="px-4 py-2 text-sm rounded-lg font-bold transition-colors ${!isPublic ? 'bg-yellow-500/10 text-yellow-500 cursor-not-allowed border border-yellow-500/20' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}">
              <i class="fas fa-lock mr-1"></i>Coming Soon に変更
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-5 text-sm">
        <i class="fas fa-info-circle text-blue-400 mt-0.5 shrink-0"></i>
        <div>
          <p class="text-blue-300 font-medium mb-1">このページについて</p>
          <p class="text-gray-400 text-xs leading-relaxed">サービス名・LINE URL・フッターなどの<strong class="text-white">運営設定</strong>を管理します。<br>
          ヒーロー見出し・特徴カード・CTAなどの<strong class="text-white">LP表示設定</strong>は
          <button onclick="navigate('lp-edit')" class="text-primary-400 underline hover:text-primary-300">LP編集ページ</button>で管理してください。</p>
        </div>
      </div>
      <div id="settings-save-msg" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
        <i class="fas fa-check-circle mr-1"></i>保存しました
      </div>
      ${Object.entries(groups).filter(([groupName]) => !LP_GROUPS.includes(groupName)).map(([groupName, items]) => {
        // site_mode はトグルUIで管理するので通常のフォームから除外
        const filteredItems = items.filter(s => s.setting_key !== 'site_mode');
        if (filteredItems.length === 0) return '';
        return `
        <div class="glass rounded-xl p-5 mb-4">
          <h3 class="font-semibold text-sm mb-4 text-primary-400">
            <i class="fas fa-layer-group mr-2"></i>${groupLabels[groupName] || groupName}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filteredItems.map(s => `
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">${settingLabels[s.setting_key] || s.setting_key.replace(/_/g,' ')}</label>
                ${inputField(s)}
              </div>
            `).join('')}
          </div>
        </div>
      `;}).join('')}
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`;
  }
}

async function saveAllSettings() {
  const inputs = document.querySelectorAll('[id^="setting-"]');
  const data = {};
  inputs.forEach(el => {
    const key = el.id.replace('setting-', '');
    data[key] = el.value;
  });
  try {
    await API.put('/settings/admin/bulk/update', data);
    const msg = document.getElementById('settings-save-msg');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 3000);
  } catch(e) {
    alert('保存に失敗しました: ' + e.message);
  }
}

async function toggleSiteMode(mode) {
  const confirmMsg = mode === 'public'
    ? '⚠️ 公開に切り替えると、全ユーザーが求人一覧・詳細を閲覧できます。\n元に戻すことも可能です。\n\n公開に切り替えますか？'
    : 'Coming Soonページに切り替えますか？\n（/register と /consultation は引き続き利用可能です）';
  if (!confirm(confirmMsg)) return;

  try {
    await API.put('/settings/admin/site-mode', { site_mode: mode });
    // ページを再読み込みして状態を反映
    loadSiteSettings();
  } catch(e) {
    alert('切り替えに失敗しました: ' + (e.response?.data?.error || e.message));
  }
}

// ==========================================
// LP編集ページ
// ==========================================

// LP設定グループ定義（site_settingsのgroup_nameベース）
const LP_SETTING_GROUPS = [
  {
    key: 'hero',
    label: 'ヒーローセクション',
    icon: 'fas fa-star',
    description: 'ページ最上部の大見出し・サブテキスト・CTAボタン',
    fields: [
      { key: 'hero_badge_text',  label: 'バッジテキスト（上部小バッジ）', example: '高学歴大学生向け・厳選求人のみ掲載' },
      { key: 'hero_title_line1', label: '見出し 1行目（グラデーション）', example: '圧倒的な' },
      { key: 'hero_title_line2', label: '見出し 2行目', example: '実務経験を、' },
      { key: 'hero_title_line3', label: '見出し 3行目', example: '今すぐ始めよう。' },
      { key: 'hero_subtitle',    label: 'サブテキスト', example: 'スタートアップ・成長企業での長期インターンで、就活で差がつく本物のスキルを。', textarea: true },
      { key: 'hero_cta1_text',   label: 'CTAボタン1（メイン）', example: '求人を探す' },
      { key: 'hero_cta2_text',   label: 'CTAボタン2（サブ）',  example: '招待コードで登録' },
    ]
  },
  {
    key: 'stats',
    label: '数字・実績セクション',
    icon: 'fas fa-chart-bar',
    description: '掲載企業数・求人数・登録学生数。公開画面では掲載中データを優先して表示します。',
    fields: [
      { key: 'stat_companies',    label: '掲載企業数', example: '50' },
      { key: 'stat_jobs',         label: '求人数',     example: '200' },
      { key: 'stat_students',     label: '登録学生数', example: '1000' },
    ]
  },
  {
    key: 'features',
    label: '特徴セクション（タイトル）',
    icon: 'fas fa-th-large',
    description: '「選ばれる理由」セクションの見出しとカード3枚（下のカード編集と連動）',
    fields: [
      { key: 'feature_section_title',    label: 'セクションタイトル', example: '選ばれる理由' },
      { key: 'feature_section_subtitle', label: 'セクションサブタイトル', example: '就活で差をつける、本質的な成長環境を提供します', textarea: true },
    ]
  },
  {
    key: 'cta',
    label: 'CTAセクション（下部）',
    icon: 'fas fa-bullhorn',
    description: 'ページ下部の無料相談誘導エリア',
    fields: [
      { key: 'cta_title',    label: 'タイトル',     example: 'まずは無料相談から始めてみませんか？' },
      { key: 'cta_subtitle', label: '説明文',       example: '自分に合ったインターンが見つかるか不安な方も、お気軽にご相談ください。', textarea: true },
      { key: 'cta_btn_text', label: 'ボタンテキスト', example: '無料相談を申し込む' },
    ]
  },
  {
    key: 'members',
    label: '会員限定バナー',
    icon: 'fas fa-lock',
    description: '未登録ユーザーへの会員限定求人誘導バナー',
    fields: [
      { key: 'members_banner_enabled', label: '表示する（1=ON / 0=OFF）', example: '1' },
      { key: 'members_banner_title',   label: 'バナータイトル', example: '🔒 登録者限定！非公開求人あり' },
      { key: 'members_banner_text',    label: 'バナーテキスト', example: '登録するだけで見られる特別求人をチェックしよう', textarea: true },
      { key: 'members_banner_btn',     label: 'ボタンテキスト', example: '今すぐ登録して確認する' },
    ]
  },
];

async function loadLpEdit() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    // site_settings と lp_sections を並列取得
    const [settingsRes, lpRes] = await Promise.all([
      API.get('/settings/admin/all'),
      API.get('/settings/lp-sections/admin'),
    ]);

    // site_settings をキーマップに変換
    const settingsMap = {};
    (settingsRes.data.data || []).forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

    // lp_sections の features を取得
    const featuresSection = (lpRes.data.data || []).find(s => s.section_key === 'features');
    let featureItems = [];
    try { featureItems = JSON.parse(featuresSection?.content || '[]'); } catch(e) {}

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold">LP編集</h2>
        <a href="/" target="_blank" class="text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-3 py-2 transition-colors">
          <i class="fas fa-external-link-alt mr-1"></i>公開画面を確認
        </a>
      </div>

      <!-- 編集ガイドパネル -->
      <div class="glass rounded-xl p-5 mb-6 border border-primary-500/20">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-info-circle text-primary-400"></i>
          <h3 class="font-semibold text-sm text-primary-400">LP編集の使い方</h3>
          <button onclick="document.getElementById('lp-guide-body').classList.toggle('hidden')" class="ml-auto text-xs text-gray-500 hover:text-white">
            <i class="fas fa-chevron-down"></i> 折りたたむ
          </button>
        </div>
        <div id="lp-guide-body">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-white/5 rounded-lg p-3">
              <p class="text-xs font-bold text-white mb-1"><i class="fas fa-edit text-blue-400 mr-1"></i>① テキストを編集</p>
              <p class="text-xs text-gray-400 leading-relaxed">各フィールドに直接テキストを入力。編集後は必ず「保存」ボタンを押してください。</p>
            </div>
            <div class="bg-white/5 rounded-lg p-3">
              <p class="text-xs font-bold text-white mb-1"><i class="fas fa-save text-green-400 mr-1"></i>② セクションごとに保存</p>
              <p class="text-xs text-gray-400 leading-relaxed">各セクション下部の「保存」ボタンで個別保存。ページ全体を一括保存する必要はありません。</p>
            </div>
            <div class="bg-white/5 rounded-lg p-3">
              <p class="text-xs font-bold text-white mb-1"><i class="fas fa-external-link-alt text-purple-400 mr-1"></i>③ 公開画面で確認</p>
              <p class="text-xs text-gray-400 leading-relaxed">保存後、右上「公開画面を確認」から反映結果をリアルタイムで確認できます。</p>
            </div>
          </div>
          <div class="border-t border-white/10 pt-3">
            <p class="text-xs font-bold text-gray-300 mb-2"><i class="fas fa-lightbulb text-yellow-400 mr-1"></i>推奨テキスト事例</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div class="bg-white/5 rounded-lg p-3">
                <p class="text-white font-medium mb-1">ヒーロー見出し</p>
                <p class="text-gray-500 text-xs mb-1">パターンA（インパクト重視）</p>
                <p class="bg-black/30 rounded px-2 py-1 text-primary-300 font-mono text-xs mb-2">1行目: 選ばれた学生だけが<br>2行目: 手にできる、<br>3行目: 本物のキャリア。</p>
                <p class="text-gray-500 text-xs mb-1">パターンB（行動喚起型）</p>
                <p class="bg-black/30 rounded px-2 py-1 text-primary-300 font-mono text-xs">1行目: 3ヶ月で変わる、<br>2行目: 就活の結果が<br>3行目: 変わる。</p>
              </div>
              <div class="bg-white/5 rounded-lg p-3">
                <p class="text-white font-medium mb-1">サブテキスト</p>
                <p class="bg-black/30 rounded px-2 py-1 text-primary-300 font-mono text-xs mb-2">厳選された成長企業でのインターンで、就活で語れる本物の経験を積もう。大学1〜4年生、随時募集中。</p>
                <p class="text-white font-medium mb-1 mt-2">CTAボタン</p>
                <p class="bg-black/30 rounded px-2 py-1 text-primary-300 font-mono text-xs">求人を見る / 無料で登録 / 今すぐ応募</p>
              </div>
              <div class="bg-white/5 rounded-lg p-3">
                <p class="text-white font-medium mb-1">会員限定バナー</p>
                <p class="bg-black/30 rounded px-2 py-1 text-primary-300 font-mono text-xs">タイトル: 🔒 登録者限定！非公開求人あり<br>テキスト: 現在XX件の非公開求人を掲載中。<br>登録するだけで全て閲覧可能！</p>
              </div>
              <div class="bg-white/5 rounded-lg p-3">
                <p class="text-white font-medium mb-1">数字セクション（目安）</p>
                <p class="bg-black/30 rounded px-2 py-1 text-primary-300 font-mono text-xs">掲載企業数: 実際の掲載数<br>求人数: 掲載求人の総数<br>登録学生数: 累計登録数</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="lp-save-msg" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
        <i class="fas fa-check-circle mr-1"></i>保存しました
      </div>

      <!-- site_settings ベースのセクション -->
      ${LP_SETTING_GROUPS.map(group => `
        <div class="glass rounded-xl p-5 mb-4" id="lp-group-${group.key}">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-semibold text-sm text-primary-400">
              <i class="${group.icon} mr-2"></i>${group.label}
            </h3>
          </div>
          <p class="text-xs text-gray-500 mb-4">${group.description}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${group.fields.map(f => `
              <div>
                <label class="block text-xs text-gray-400 mb-1">${f.label}</label>
                ${f.textarea
                  ? `<textarea id="lpset-${f.key}" rows="3" placeholder="${f.example}"
                       class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:border-primary-500/50 outline-none">${settingsMap[f.key] || ''}</textarea>`
                  : `<input type="text" id="lpset-${f.key}" value="${(settingsMap[f.key] || '').replace(/"/g,'&quot;')}" placeholder="${f.example}"
                       class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary-500/50 outline-none">`
                }
              </div>
            `).join('')}
          </div>
          <button onclick="saveLpGroupSettings('${group.key}')"
            class="mt-4 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 text-xs px-4 py-2 rounded-lg transition-colors border border-primary-500/30">
            <i class="fas fa-save mr-1"></i>${group.label}を保存
          </button>
        </div>
      `).join('')}

      <!-- 特徴カード（lp_sections features 配列） -->
      <div class="glass rounded-xl p-5 mb-4">
        <div class="flex items-center justify-between mb-1">
          <h3 class="font-semibold text-sm text-primary-400">
            <i class="fas fa-layer-group mr-2"></i>特徴カード（3枚）
          </h3>
          <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" id="lp-features-visible" ${featuresSection?.is_visible ? 'checked' : ''}
              onchange="toggleLpSection('features', this.checked)" class="rounded">
            表示する
          </label>
        </div>
        <p class="text-xs text-gray-500 mb-4">ホームページの「選ばれる理由」セクションに表示されるカード。アイコンはFont Awesomeのクラス名（例: star, check, bolt）を入力。</p>
        <div id="lp-feature-cards">
          ${featureItems.map((item, i) => `
            <div class="bg-white/5 rounded-lg p-4 mb-3 border border-white/5">
              <p class="text-xs font-bold text-gray-300 mb-3">カード ${i + 1}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-400 mb-1">タイトル</label>
                  <input type="text" id="feat-${i}-title" value="${(item.title||'').replace(/"/g,'&quot;')}"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">アイコン（Font Awesome、例: filter / user-tie / bolt）</label>
                  <input type="text" id="feat-${i}-icon" value="${(item.icon||'').replace(/"/g,'&quot;')}"
                    placeholder="filter"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">カラー（primary / purple / green / blue / yellow）</label>
                  <input type="text" id="feat-${i}-color" value="${(item.color||'').replace(/"/g,'&quot;')}"
                    placeholder="primary"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                </div>
                <div>
                  <label class="block text-xs text-gray-400 mb-1">説明文</label>
                  <textarea id="feat-${i}-body" rows="2"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none outline-none">${item.body||''}</textarea>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <p class="text-xs text-gray-500 mb-2">※ カード枚数: ${featureItems.length}枚（現在固定。増減は開発者へ依頼）</p>
        <button onclick="saveLpFeatureCards(${featureItems.length})"
          class="mt-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 text-xs px-4 py-2 rounded-lg transition-colors border border-primary-500/30">
          <i class="fas fa-save mr-1"></i>特徴カードを保存
        </button>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400 p-4">取得失敗: ${e.message}</div>`;
  }
}

// site_settings グループ一括保存
async function saveLpGroupSettings(groupKey) {
  const group = LP_SETTING_GROUPS.find(g => g.key === groupKey);
  if (!group) return;
  const updates = {};
  group.fields.forEach(f => {
    const el = document.getElementById(`lpset-${f.key}`);
    if (el) updates[f.key] = el.value;
  });
  try {
    await API.put('/settings/admin/bulk/update', updates);
    const msg = document.getElementById('lp-save-msg');
    if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 3000); }
  } catch(e) {
    alert('保存失敗: ' + e.message);
  }
}

// 特徴カード（配列）を保存
async function saveLpFeatureCards(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      title: document.getElementById(`feat-${i}-title`)?.value || '',
      icon:  document.getElementById(`feat-${i}-icon`)?.value  || '',
      color: document.getElementById(`feat-${i}-color`)?.value || '',
      body:  document.getElementById(`feat-${i}-body`)?.value  || '',
    });
  }
  const isVisible = document.getElementById('lp-features-visible')?.checked ?? true;
  try {
    await API.put('/settings/lp-sections/admin/features', { content: items, is_visible: isVisible });
    const msg = document.getElementById('lp-save-msg');
    if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 3000); }
  } catch(e) {
    alert('保存失敗: ' + e.message);
  }
}

async function saveLpSection(sectionKey, fieldKeys) {
  const keys = typeof fieldKeys === 'string' ? JSON.parse(fieldKeys) : fieldKeys;
  const contentObj = {};
  keys.forEach(k => {
    const el = document.getElementById(`lp-${sectionKey}-${k}`);
    if (el) contentObj[k] = el.value;
  });
  const isVisible = document.getElementById(`lp-visible-${sectionKey}`)?.checked ?? true;
  try {
    await API.put(`/settings/lp-sections/admin/${sectionKey}`, { content: contentObj, is_visible: isVisible });
    const msg = document.getElementById('lp-save-msg');
    if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 3000); }
  } catch(e) {
    alert('保存失敗: ' + e.message);
  }
}

async function toggleLpSection(sectionKey, isVisible) {
  try {
    await API.put(`/settings/lp-sections/admin/${sectionKey}`, { is_visible: isVisible });
  } catch(e) { console.error(e); }
}

// ==========================================
// FAQ管理ページ
// ==========================================
async function loadFaqs() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    const res = await API.get('/settings/faqs/admin');
    const faqs = res.data.data;

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">FAQ管理 <span class="text-gray-500 font-normal text-sm">(${faqs.length}件)</span></h2>
        <button onclick="showFaqModal()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <i class="fas fa-plus mr-1"></i>FAQを追加
        </button>
      </div>
      <div class="glass rounded-xl overflow-hidden" id="faq-list">
        ${faqs.length ? faqs.map(f => renderFaqRow(f)).join('') :
          '<div class="text-center text-gray-600 py-10 text-sm">FAQがありません。追加してください。</div>'
        }
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`;
  }
}

function renderFaqRow(f) {
  return `
    <div class="border-b border-white/5 last:border-0 p-4" id="faq-row-${f.id}">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded-full ${f.is_visible ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-500'}">
              ${f.is_visible ? '表示' : '非表示'}
            </span>
            <span class="text-xs text-gray-500">${f.category || 'general'}</span>
            <span class="text-xs text-gray-600">順: ${f.display_order}</span>
          </div>
          <p class="text-sm font-medium mb-1">Q. ${f.question}</p>
          <p class="text-xs text-gray-400 line-clamp-2">A. ${f.answer}</p>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button onclick="showFaqModal(${JSON.stringify(f).replace(/"/g,'&quot;')})" class="text-xs text-primary-400 hover:text-primary-300">編集</button>
          <button onclick="deleteFaq(${f.id})" class="text-xs text-red-400 hover:text-red-300">削除</button>
        </div>
      </div>
    </div>
  `;
}

function showFaqModal(faq = null) {
  const isEdit = !!faq;
  const modal = document.getElementById('modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">${isEdit ? 'FAQ編集' : 'FAQ追加'}</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="${isEdit ? `submitUpdateFaq(event,${faq.id})` : 'submitCreateFaq(event)'}">
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1">質問 *</label>
            <input id="faq-question" type="text" required value="${(faq?.question||'').replace(/"/g,'&quot;')}"
              placeholder="例: 長期インターンとは何ですか？"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">回答 *</label>
            <textarea id="faq-answer" rows="4" required
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
              >${faq?.answer||''}</textarea>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">カテゴリ</label>
              <select id="faq-category" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="general" ${faq?.category==='general'?'selected':''}>一般</option>
                <option value="registration" ${faq?.category==='registration'?'selected':''}>登録</option>
                <option value="application" ${faq?.category==='application'?'selected':''}>応募</option>
                <option value="job" ${faq?.category==='job'?'selected':''}>求人</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">表示順</label>
              <input id="faq-order" type="number" value="${faq?.display_order||0}"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">表示</label>
              <select id="faq-visible" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="1" ${faq?.is_visible!==0?'selected':''}>表示</option>
                <option value="0" ${faq?.is_visible===0?'selected':''}>非表示</option>
              </select>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
            <i class="fas fa-save mr-1"></i>${isEdit ? '更新' : '追加'}
          </button>
          <button type="button" onclick="closeModal()" class="px-5 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">キャンセル</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function submitCreateFaq(e) {
  e.preventDefault();
  try {
    await API.post('/settings/faqs/admin', {
      question: document.getElementById('faq-question').value,
      answer: document.getElementById('faq-answer').value,
      category: document.getElementById('faq-category').value,
      display_order: parseInt(document.getElementById('faq-order').value) || 0,
      is_visible: document.getElementById('faq-visible').value === '1'
    });
    closeModal();
    loadFaqs();
  } catch(e) { alert('作成失敗: ' + e.message); }
}

async function submitUpdateFaq(e, id) {
  e.preventDefault();
  try {
    await API.put(`/settings/faqs/admin/${id}`, {
      question: document.getElementById('faq-question').value,
      answer: document.getElementById('faq-answer').value,
      category: document.getElementById('faq-category').value,
      display_order: parseInt(document.getElementById('faq-order').value) || 0,
      is_visible: document.getElementById('faq-visible').value === '1'
    });
    closeModal();
    loadFaqs();
  } catch(e) { alert('更新失敗: ' + e.message); }
}

async function deleteFaq(id) {
  if (!confirm('このFAQを削除しますか？')) return;
  try {
    await API.delete(`/settings/faqs/admin/${id}`);
    loadFaqs();
  } catch(e) { alert('削除失敗: ' + e.message); }
}

// ==========================================
// お知らせ管理ページ
// ==========================================
async function loadAnnouncements() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    const res = await API.get('/settings/announcements/admin');
    const items = res.data.data;

    const typeColors = {
      info: 'bg-blue-500/20 text-blue-400', warning: 'bg-yellow-500/20 text-yellow-400',
      success: 'bg-green-500/20 text-green-400', campaign: 'bg-purple-500/20 text-purple-400'
    };

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">お知らせ管理 <span class="text-gray-500 font-normal text-sm">(${items.length}件)</span></h2>
        <button onclick="showAnnouncementModal()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <i class="fas fa-plus mr-1"></i>お知らせを追加
        </button>
      </div>
      <div class="glass rounded-xl overflow-hidden">
        ${items.length ? items.map(a => `
          <div class="border-b border-white/5 last:border-0 p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="status-badge ${typeColors[a.type]||typeColors.info}">${a.type}</span>
                  <span class="text-xs ${a.is_visible ? 'text-green-400' : 'text-gray-500'}">${a.is_visible ? '表示中' : '非表示'}</span>
                  ${a.starts_at ? `<span class="text-xs text-gray-600">${a.starts_at?.split('T')[0]} ～</span>` : ''}
                  ${a.ends_at ? `<span class="text-xs text-gray-600">～ ${a.ends_at?.split('T')[0]}</span>` : ''}
                </div>
                <p class="text-sm font-medium">${a.title}</p>
                ${a.body ? `<p class="text-xs text-gray-400 mt-0.5">${a.body}</p>` : ''}
                ${a.link_url ? `<p class="text-xs text-primary-400 mt-0.5"><i class="fas fa-link mr-1"></i>${a.link_url}</p>` : ''}
              </div>
              <div class="flex gap-2 flex-shrink-0">
                <button onclick="showAnnouncementModal(${JSON.stringify(a).replace(/"/g,'&quot;')})" class="text-xs text-primary-400 hover:text-primary-300">編集</button>
                <button onclick="deleteAnnouncement(${a.id})" class="text-xs text-red-400 hover:text-red-300">削除</button>
              </div>
            </div>
          </div>
        `).join('') : '<div class="text-center text-gray-600 py-10 text-sm">お知らせがありません。</div>'}
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400">取得失敗: ${e.message}</div>`;
  }
}

function showAnnouncementModal(item = null) {
  const isEdit = !!item;
  const modal = document.getElementById('modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold">${isEdit ? 'お知らせ編集' : 'お知らせ追加'}</h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <form onsubmit="${isEdit ? `submitUpdateAnnouncement(event,${item.id})` : 'submitCreateAnnouncement(event)'}">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">タイトル *</label>
              <input id="ann-title" type="text" required value="${(item?.title||'').replace(/"/g,'&quot;')}"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">種類</label>
              <select id="ann-type" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="info" ${item?.type==='info'?'selected':''}>info（青）</option>
                <option value="warning" ${item?.type==='warning'?'selected':''}>warning（黄）</option>
                <option value="success" ${item?.type==='success'?'selected':''}>success（緑）</option>
                <option value="campaign" ${item?.type==='campaign'?'selected':''}>campaign（紫）</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">本文（任意）</label>
            <textarea id="ann-body" rows="2" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-primary-500">${item?.body||''}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">リンクURL（任意）</label>
              <input id="ann-link-url" type="text" value="${(item?.link_url||'').replace(/"/g,'&quot;')}"
                placeholder="https://..."
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">リンクテキスト</label>
              <input id="ann-link-text" type="text" value="${(item?.link_text||'').replace(/"/g,'&quot;')}"
                placeholder="詳細はこちら"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500">
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1">表示</label>
              <select id="ann-visible" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="1" ${item?.is_visible!==0?'selected':''}>表示</option>
                <option value="0" ${item?.is_visible===0?'selected':''}>非表示</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">開始日</label>
              <input id="ann-starts" type="date" value="${item?.starts_at?.split('T')[0]||''}"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">終了日</label>
              <input id="ann-ends" type="date" value="${item?.ends_at?.split('T')[0]||''}"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="submit" class="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
            <i class="fas fa-save mr-1"></i>${isEdit ? '更新' : '追加'}
          </button>
          <button type="button" onclick="closeModal()" class="px-5 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">キャンセル</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function submitCreateAnnouncement(e) {
  e.preventDefault();
  try {
    await API.post('/settings/announcements/admin', {
      title: document.getElementById('ann-title').value,
      body: document.getElementById('ann-body').value || null,
      type: document.getElementById('ann-type').value,
      link_url: document.getElementById('ann-link-url').value || null,
      link_text: document.getElementById('ann-link-text').value || null,
      is_visible: document.getElementById('ann-visible').value === '1',
      starts_at: document.getElementById('ann-starts').value || null,
      ends_at: document.getElementById('ann-ends').value || null,
    });
    closeModal();
    loadAnnouncements();
  } catch(e) { alert('作成失敗: ' + e.message); }
}

async function submitUpdateAnnouncement(e, id) {
  e.preventDefault();
  try {
    await API.put(`/settings/announcements/admin/${id}`, {
      title: document.getElementById('ann-title').value,
      body: document.getElementById('ann-body').value || null,
      type: document.getElementById('ann-type').value,
      link_url: document.getElementById('ann-link-url').value || null,
      link_text: document.getElementById('ann-link-text').value || null,
      is_visible: document.getElementById('ann-visible').value === '1',
      starts_at: document.getElementById('ann-starts').value || null,
      ends_at: document.getElementById('ann-ends').value || null,
    });
    closeModal();
    loadAnnouncements();
  } catch(e) { alert('更新失敗: ' + e.message); }
}

async function deleteAnnouncement(id) {
  if (!confirm('このお知らせを削除しますか？')) return;
  try {
    await API.delete(`/settings/announcements/admin/${id}`);
    loadAnnouncements();
  } catch(e) { alert('削除失敗: ' + e.message); }
}

// ==========================================
// ユーティリティ
// ==========================================
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ==========================================
// 内定者タイムライン管理ページ
// ==========================================
async function loadSuccessStories() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    const res = await API.get('/homepage/success-stories/admin');
    const stories = res.data.data;

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold">内定者タイムライン管理</h2>
        <button onclick="showSuccessStoryModal()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          <i class="fas fa-plus mr-1"></i>新規追加
        </button>
      </div>
      <div id="story-save-msg" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
        <i class="fas fa-check-circle mr-1"></i>保存しました
      </div>
      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-white/5 text-left text-xs text-gray-400">
            <tr>
              <th class="px-4 py-3">学生名</th>
              <th class="px-4 py-3">大学</th>
              <th class="px-4 py-3">内定先</th>
              <th class="px-4 py-3">所感</th>
              <th class="px-4 py-3">表示順</th>
              <th class="px-4 py-3">公開</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${stories.length ? stories.map(s => `
              <tr class="hover:bg-white/5">
                <td class="px-4 py-3 text-white">${s.student_name}</td>
                <td class="px-4 py-3 text-gray-400">${s.university}</td>
                <td class="px-4 py-3 text-gray-300">${s.company_name}</td>
                <td class="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">${s.comment || '-'}</td>
                <td class="px-4 py-3 text-gray-400">${s.display_order}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded text-xs ${s.is_visible ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
                    ${s.is_visible ? '公開' : '非公開'}
                  </span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button onclick="showSuccessStoryModal(${s.id})" class="text-blue-400 hover:text-blue-300 text-xs">
                    <i class="fas fa-edit"></i> 編集
                  </button>
                  <button onclick="deleteSuccessStory(${s.id})" class="text-red-400 hover:text-red-300 text-xs">
                    <i class="fas fa-trash"></i> 削除
                  </button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">データがありません</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400 p-4">取得失敗: ${e.message}</div>`;
  }
}

async function showSuccessStoryModal(id = null) {
  let story = { student_name: '', university: '', company_name: '', comment: '', is_visible: 1, display_order: 0 };
  if (id) {
    const res = await API.get('/homepage/success-stories/admin');
    story = res.data.data.find(s => s.id === id) || story;
  }
  
  document.getElementById('modal-container').innerHTML = `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onclick="if(event.target===this) closeModal()">
      <div class="bg-dark-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">${id ? '内定者タイムライン編集' : '内定者タイムライン追加'}</h3>
        <form onsubmit="${id ? `submitUpdateSuccessStory(event, ${id})` : 'submitCreateSuccessStory(event)'}" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">学生名（例: 山田 太郎さん）<span class="text-red-400">*</span></label>
              <input type="text" name="student_name" value="${story.student_name.replace(/"/g,'&quot;')}" required
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">大学名<span class="text-red-400">*</span></label>
              <input type="text" name="university" value="${story.university.replace(/"/g,'&quot;')}" required
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">内定先企業名<span class="text-red-400">*</span></label>
            <input type="text" name="company_name" value="${story.company_name.replace(/"/g,'&quot;')}" required
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">所感（1-2行）</label>
            <textarea name="comment" rows="2"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none">${story.comment||''}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">表示順（昇順）</label>
              <input type="number" name="display_order" value="${story.display_order}" min="0"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">公開設定</label>
              <select name="is_visible" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="1" ${story.is_visible?'selected':''}>公開</option>
                <option value="0" ${!story.is_visible?'selected':''}>非公開</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              キャンセル
            </button>
            <button type="submit" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-6 py-2 rounded-lg transition-colors">
              ${id ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function submitCreateSuccessStory(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    student_name: form.student_name.value,
    university: form.university.value,
    company_name: form.company_name.value,
    comment: form.comment.value,
    is_visible: Number(form.is_visible.value),
    display_order: Number(form.display_order.value)
  };
  try {
    await API.post('/homepage/success-stories/admin', data);
    closeModal();
    loadSuccessStories();
    showSaveMsg('story-save-msg');
  } catch(e) {
    alert('追加失敗: ' + e.message);
  }
}

async function submitUpdateSuccessStory(e, id) {
  e.preventDefault();
  const form = e.target;
  const data = {
    student_name: form.student_name.value,
    university: form.university.value,
    company_name: form.company_name.value,
    comment: form.comment.value,
    is_visible: Number(form.is_visible.value),
    display_order: Number(form.display_order.value)
  };
  try {
    await API.put(`/homepage/success-stories/admin/${id}`, data);
    closeModal();
    loadSuccessStories();
    showSaveMsg('story-save-msg');
  } catch(e) {
    alert('更新失敗: ' + e.message);
  }
}

async function deleteSuccessStory(id) {
  if (!confirm('この内定者タイムラインを削除しますか？')) return;
  try {
    await API.delete(`/homepage/success-stories/admin/${id}`);
    loadSuccessStories();
    showSaveMsg('story-save-msg');
  } catch(e) {
    alert('削除失敗: ' + e.message);
  }
}

// ==========================================
// ピックアップ求人設定ページ
// ==========================================
async function loadFeaturedJobs() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    const [featuredRes, allJobsRes] = await Promise.all([
      API.get('/homepage/featured-jobs/admin'),
      API.get('/jobs/admin/all')
    ]);
    const featured = featuredRes.data.data;
    const allJobs = allJobsRes.data.data;

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold">ピックアップ求人設定</h2>
        <button onclick="showFeaturedJobModal()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          <i class="fas fa-plus mr-1"></i>求人を追加
        </button>
      </div>
      <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-5 text-sm">
        <p class="text-blue-300 mb-2"><i class="fas fa-info-circle mr-1"></i>トップページ「人気の求人5選」に表示される求人を管理します。</p>
        <p class="text-gray-400 text-xs">表示順が小さい順に最大5件まで公開されます。</p>
      </div>
      <div id="featured-save-msg" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
        <i class="fas fa-check-circle mr-1"></i>保存しました
      </div>
      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-white/5 text-left text-xs text-gray-400">
            <tr>
              <th class="px-4 py-3">求人名</th>
              <th class="px-4 py-3">企業名</th>
              <th class="px-4 py-3">表示順</th>
              <th class="px-4 py-3">公開</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${featured.length ? featured.map(f => `
              <tr class="hover:bg-white/5">
                <td class="px-4 py-3 text-white">${f.job_title}</td>
                <td class="px-4 py-3 text-gray-400">${f.company_name}</td>
                <td class="px-4 py-3 text-gray-400">${f.display_order}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded text-xs ${f.is_visible ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
                    ${f.is_visible ? '公開' : '非公開'}
                  </span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button onclick="showFeaturedJobModal(${f.id})" class="text-blue-400 hover:text-blue-300 text-xs">
                    <i class="fas fa-edit"></i> 編集
                  </button>
                  <button onclick="deleteFeaturedJob(${f.id})" class="text-red-400 hover:text-red-300 text-xs">
                    <i class="fas fa-trash"></i> 削除
                  </button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">ピックアップ求人が設定されていません</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400 p-4">取得失敗: ${e.message}</div>`;
  }
}

async function showFeaturedJobModal(id = null) {
  const [featuredRes, allJobsRes] = await Promise.all([
    API.get('/homepage/featured-jobs/admin'),
    API.get('/jobs/admin/all')
  ]);
  const allJobs = allJobsRes.data.data;
  let featured = { job_id: '', is_visible: 1, display_order: 0 };
  
  if (id) {
    featured = featuredRes.data.data.find(f => f.id === id) || featured;
  }
  
  document.getElementById('modal-container').innerHTML = `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onclick="if(event.target===this) closeModal()">
      <div class="bg-dark-800 rounded-2xl w-full max-w-lg p-6">
        <h3 class="text-lg font-bold mb-4">${id ? 'ピックアップ求人編集' : 'ピックアップ求人追加'}</h3>
        <form onsubmit="${id ? `submitUpdateFeaturedJob(event, ${id})` : 'submitCreateFeaturedJob(event)'}" class="space-y-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">求人を選択<span class="text-red-400">*</span></label>
            <select name="job_id" required class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="">選択してください</option>
              ${allJobs.map(j => `<option value="${j.id}" ${j.id === featured.job_id ? 'selected' : ''}>${j.title} (${j.company_name})</option>`).join('')}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">表示順</label>
              <input type="number" name="display_order" value="${featured.display_order}" min="0"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">公開設定</label>
              <select name="is_visible" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="1" ${featured.is_visible?'selected':''}>公開</option>
                <option value="0" ${!featured.is_visible?'selected':''}>非公開</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              キャンセル
            </button>
            <button type="submit" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-6 py-2 rounded-lg transition-colors">
              ${id ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function submitCreateFeaturedJob(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    job_id: Number(form.job_id.value),
    is_visible: Number(form.is_visible.value),
    display_order: Number(form.display_order.value)
  };
  try {
    await API.post('/homepage/featured-jobs/admin', data);
    closeModal();
    loadFeaturedJobs();
    showSaveMsg('featured-save-msg');
  } catch(e) {
    alert('追加失敗: ' + e.message);
  }
}

async function submitUpdateFeaturedJob(e, id) {
  e.preventDefault();
  const form = e.target;
  const data = {
    job_id: Number(form.job_id.value),
    is_visible: Number(form.is_visible.value),
    display_order: Number(form.display_order.value)
  };
  try {
    await API.put(`/homepage/featured-jobs/admin/${id}`, data);
    closeModal();
    loadFeaturedJobs();
    showSaveMsg('featured-save-msg');
  } catch(e) {
    alert('更新失敗: ' + e.message);
  }
}

async function deleteFeaturedJob(id) {
  if (!confirm('このピックアップ求人を削除しますか？')) return;
  try {
    await API.delete(`/homepage/featured-jobs/admin/${id}`);
    loadFeaturedJobs();
    showSaveMsg('featured-save-msg');
  } catch(e) {
    alert('削除失敗: ' + e.message);
  }
}

// ==========================================
// 大学タグ管理ページ
// ==========================================
async function loadUniversityTags() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse h-64 bg-white/5 rounded-xl"></div>`;

  try {
    const res = await API.get('/homepage/university-tags/admin');
    const tags = res.data.data;

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold">大学タグ管理</h2>
        <button onclick="showUniversityTagModal()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          <i class="fas fa-plus mr-1"></i>新規追加
        </button>
      </div>
      <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-5 text-sm">
        <p class="text-blue-300 mb-2"><i class="fas fa-info-circle mr-1"></i>大学タグは求人に紐付けて「〇〇大学向けおすすめ求人」として表示できます。</p>
        <p class="text-gray-400 text-xs">求人編集ページで大学タグを選択して紐付けてください。</p>
      </div>
      <div id="tag-save-msg" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
        <i class="fas fa-check-circle mr-1"></i>保存しました
      </div>
      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-white/5 text-left text-xs text-gray-400">
            <tr>
              <th class="px-4 py-3">大学名</th>
              <th class="px-4 py-3">スラッグ</th>
              <th class="px-4 py-3">説明文</th>
              <th class="px-4 py-3">表示順</th>
              <th class="px-4 py-3">公開</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${tags.length ? tags.map(t => `
              <tr class="hover:bg-white/5">
                <td class="px-4 py-3 text-white">${t.name}</td>
                <td class="px-4 py-3 text-gray-400 font-mono text-xs">${t.slug}</td>
                <td class="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">${t.description || '-'}</td>
                <td class="px-4 py-3 text-gray-400">${t.display_order}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded text-xs ${t.is_visible ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
                    ${t.is_visible ? '公開' : '非公開'}
                  </span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button onclick="showUniversityTagModal(${t.id})" class="text-blue-400 hover:text-blue-300 text-xs">
                    <i class="fas fa-edit"></i> 編集
                  </button>
                  <button onclick="deleteUniversityTag(${t.id})" class="text-red-400 hover:text-red-300 text-xs">
                    <i class="fas fa-trash"></i> 削除
                  </button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">大学タグがありません</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="text-red-400 p-4">取得失敗: ${e.message}</div>`;
  }
}

async function showUniversityTagModal(id = null) {
  let tag = { name: '', slug: '', description: '', is_visible: 1, display_order: 0 };
  if (id) {
    const res = await API.get('/homepage/university-tags/admin');
    tag = res.data.data.find(t => t.id === id) || tag;
  }
  
  document.getElementById('modal-container').innerHTML = `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onclick="if(event.target===this) closeModal()">
      <div class="bg-dark-800 rounded-2xl w-full max-w-2xl p-6">
        <h3 class="text-lg font-bold mb-4">${id ? '大学タグ編集' : '大学タグ追加'}</h3>
        <form onsubmit="${id ? `submitUpdateUniversityTag(event, ${id})` : 'submitCreateUniversityTag(event)'}" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">大学名<span class="text-red-400">*</span></label>
              <input type="text" name="name" value="${tag.name.replace(/"/g,'&quot;')}" required
                placeholder="例: 東京大学"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">スラッグ（URL用）<span class="text-red-400">*</span></label>
              <input type="text" name="slug" value="${tag.slug.replace(/"/g,'&quot;')}" required
                placeholder="例: todai"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono">
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">説明文</label>
            <textarea name="description" rows="2"
              placeholder="例: 日本最高峰の学府。トップ企業への内定実績多数。"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none">${tag.description||''}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">表示順</label>
              <input type="number" name="display_order" value="${tag.display_order}" min="0"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">公開設定</label>
              <select name="is_visible" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="1" ${tag.is_visible?'selected':''}>公開</option>
                <option value="0" ${!tag.is_visible?'selected':''}>非公開</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              キャンセル
            </button>
            <button type="submit" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-6 py-2 rounded-lg transition-colors">
              ${id ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function submitCreateUniversityTag(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    slug: form.slug.value,
    description: form.description.value,
    is_visible: Number(form.is_visible.value),
    display_order: Number(form.display_order.value)
  };
  try {
    await API.post('/homepage/university-tags/admin', data);
    closeModal();
    loadUniversityTags();
    showSaveMsg('tag-save-msg');
  } catch(e) {
    alert('追加失敗: ' + e.message);
  }
}

async function submitUpdateUniversityTag(e, id) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    slug: form.slug.value,
    description: form.description.value,
    is_visible: Number(form.is_visible.value),
    display_order: Number(form.display_order.value)
  };
  try {
    await API.put(`/homepage/university-tags/admin/${id}`, data);
    closeModal();
    loadUniversityTags();
    showSaveMsg('tag-save-msg');
  } catch(e) {
    alert('更新失敗: ' + e.message);
  }
}

async function deleteUniversityTag(id) {
  if (!confirm('この大学タグを削除しますか？紐付いている求人からも解除されます。')) return;
  try {
    await API.delete(`/homepage/university-tags/admin/${id}`);
    loadUniversityTags();
    showSaveMsg('tag-save-msg');
  } catch(e) {
    alert('削除失敗: ' + e.message);
  }
}

// ==========================================
// 共通ヘルパー関数
// ==========================================
function showSaveMsg(id) {
  const msg = document.getElementById(id);
  if (msg) {
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 3000);
  }
}

// 初期化
window.addEventListener('DOMContentLoaded', async () => {
  const authenticated = await checkAuth();
  if (!authenticated) return;
  navigate('dashboard');
});
