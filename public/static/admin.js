// ==========================================
// InternBase - 管理画面 JavaScript
// ==========================================

const API = axios.create({ baseURL: '/api' });

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
// 認証
// ==========================================
function checkAuth() {
  const token = localStorage.getItem('admin_token');
  const adminData = localStorage.getItem('admin_data');
  if (!token) { showLoginPage(); return false; }
  if (adminData) {
    const admin = JSON.parse(adminData);
    document.getElementById('admin-name').textContent = admin.name;
  }
  return true;
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
      localStorage.setItem('admin_token', res.data.data.token);
      localStorage.setItem('admin_data', JSON.stringify(res.data.data.admin));
      window.location.reload();
    }
  } catch(e) {
    document.getElementById('login-error').textContent = e.response?.data?.error || 'ログインに失敗しました';
    document.getElementById('login-error').classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>ログイン';
  }
}

function adminLogout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_data');
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
    students: '学生一覧', applications: '応募管理', invites: '招待コード', consultations: '無料相談'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  const pages = {
    dashboard: loadDashboard, companies: loadCompanies, jobs: loadJobs,
    students: loadStudents, applications: loadApplications, invites: loadInvites,
    consultations: loadConsultations
  };
  if (pages[page]) pages[page]();
}

// ==========================================
// ダッシュボード
// ==========================================
async function loadDashboard() {
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse space-y-4"><div class="h-24 bg-white/5 rounded-xl"></div><div class="h-64 bg-white/5 rounded-xl"></div></div>`;

  try {
    const res = await API.get('/applications/admin/stats/summary');
    const d = res.data.data;

    const statusBreakdown = {};
    d.status_breakdown.forEach(s => statusBreakdown[s.status] = s.count);

    content.innerHTML = `
      <!-- KPIカード -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${[
          { icon: 'user-graduate', label: '登録学生数', value: d.total_students, color: 'blue', sub: '名' },
          { icon: 'file-alt', label: '総応募数', value: d.total_applications, color: 'purple', sub: '件' },
          { icon: 'briefcase', label: '公開中求人', value: d.active_jobs, color: 'green', sub: '件' },
          { icon: 'bell', label: '未対応応募', value: d.pending_applications, color: 'yellow', sub: '件' },
        ].map(k => `
          <div class="glass rounded-xl p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="w-9 h-9 bg-${k.color}-500/20 rounded-lg flex items-center justify-center">
                <i class="fas fa-${k.icon} text-${k.color}-400 text-sm"></i>
              </div>
            </div>
            <div class="text-3xl font-black mb-1">${k.value}<span class="text-base font-normal text-gray-500 ml-1">${k.sub}</span></div>
            <div class="text-xs text-gray-500">${k.label}</div>
          </div>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- 応募ステータス内訳 -->
        <div class="lg:col-span-2 glass rounded-xl p-5">
          <h3 class="font-bold text-sm mb-4">応募ステータス内訳</h3>
          <div class="space-y-3">
            ${Object.entries(STATUS_LABELS).map(([k, label]) => {
              const count = statusBreakdown[k] || 0;
              const total = d.total_applications || 1;
              const pct = Math.round((count/total)*100);
              return `
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-gray-400">${label}</span>
                    <span class="font-bold">${count}件</span>
                  </div>
                  <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 rounded-full" style="width:${pct}%"></div>
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
    const [jobsRes, companiesRes] = await Promise.all([
      API.get('/jobs/admin/all'),
      API.get('/companies/admin/all')
    ]);
    const jobs = jobsRes.data.data;
    const companies = companiesRes.data.data;

    content.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold">求人一覧 <span class="text-gray-500 font-normal text-sm">(${jobs.length}件)</span></h2>
        <button onclick="showJobModal(null, ${JSON.stringify(companies).replace(/"/g,'&quot;')})" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
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
                </td>
                <td class="px-4 py-3 hidden md:table-cell text-xs text-gray-400">${j.company_name}</td>
                <td class="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                  ${j.hourly_wage_min ? '¥'+j.hourly_wage_min.toLocaleString()+'〜' : '応相談'}
                </td>
                <td class="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">${j.applicant_count}名</td>
                <td class="px-4 py-3">
                  <span class="status-badge ${j.status==='published' ? 'bg-green-500/20 text-green-400' : j.status==='draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}">
                    ${j.status==='published' ? '公開中' : j.status==='draft' ? '下書き' : 'クローズ'}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button onclick="showJobModal(${JSON.stringify(j).replace(/"/g,'&quot;')}, ${JSON.stringify(companies).replace(/"/g,'&quot;')})" class="text-xs text-primary-400 hover:text-primary-300">編集</button>
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

function showJobModal(job = null, companies = []) {
  const isEdit = !!job;
  const modal = document.getElementById('modal');
  const mc = document.getElementById('modal-content');

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

async function submitCreateJob(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.hourly_wage_min = data.hourly_wage_min ? parseInt(data.hourly_wage_min) : null;
  data.hourly_wage_max = data.hourly_wage_max ? parseInt(data.hourly_wage_max) : null;
  try { await API.post('/jobs/admin', data); closeModal(); loadJobs(); }
  catch(err) { alert(err.response?.data?.error || '作成に失敗しました'); }
}

async function submitUpdateJob(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  data.hourly_wage_min = data.hourly_wage_min ? parseInt(data.hourly_wage_min) : null;
  data.hourly_wage_max = data.hourly_wage_max ? parseInt(data.hourly_wage_max) : null;
  try { await API.put(`/jobs/admin/${id}`, data); closeModal(); loadJobs(); }
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

function renderConsultationRows(cons) {
  const statusMap = { pending: { label: '未対応', cls: 'bg-yellow-500/20 text-yellow-400' }, contacted: { label: '連絡済み', cls: 'bg-blue-500/20 text-blue-400' }, completed: { label: '対応完了', cls: 'bg-green-500/20 text-green-400' }, cancelled: { label: 'キャンセル', cls: 'bg-gray-600/20 text-gray-500' } };
  if (!cons.length) return '<div class="text-center text-gray-600 text-sm py-8">相談データがありません</div>';
  return cons.map(c => `
    <div class="glass rounded-xl p-4">
      <div class="flex items-start gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <p class="font-medium text-sm">${c.name}</p>
            <span class="status-badge ${(statusMap[c.status]||{cls:'bg-gray-500/20 text-gray-400'}).cls}">${(statusMap[c.status]||{label:c.status}).label}</span>
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
// ユーティリティ
// ==========================================
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// 初期化
window.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  navigate('dashboard');
});
