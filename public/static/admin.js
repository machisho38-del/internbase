// ==========================================
// ã‚¬ã‚¯ãƒã‚«ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ³ - ç®¡ç†ç”»é¢ JavaScript
// ==========================================

const API = axios.create({ baseURL: '/api', withCredentials: true });
let featuredJobChoices = [];

const JOB_OCCUPATION_OPTIONS = ['å–¶æ¥­', 'ãƒãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°', 'ã‚³ãƒ³ã‚µãƒ«ãƒ†ã‚£ãƒ³ã‚°', 'äº‹å‹™', 'ã‚¨ãƒ³ã‚¸ãƒ‹ã‚¢', 'äººäº‹', 'äº‹æ¥­é–‹ç™º', 'ãã®ä»–'];

function renderAdminOccupationOptions(selected = 'ãã®ä»–') {
  return JOB_OCCUPATION_OPTIONS.map(o =>
    `<option value="${o}" ${selected === o ? 'selected' : ''}>${o}</option>`
  ).join('');
}

function parseAdminJsonArray(raw) {
  let value = raw;
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value !== 'string') return [];
    try {
      value = JSON.parse(value);
    } catch(e) {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
}

const STATUS_LABELS = {
  applied: 'å¿œå‹Ÿæ¸ˆã¿', reviewing: 'æ›¸é¡é¸è€ƒä¸­',
  interview1: '1æ¬¡é¢æ¥', interview2: '2æ¬¡é¢æ¥', interview3: 'æœ€çµ‚é¢æ¥',
  offered: 'å†…å®š', accepted: 'å†…å®šæ‰¿è«¾', rejected: 'ä¸æ¡ç”¨', withdrawn: 'è¾é€€'
};
const STATUS_COLORS = {
  applied: 'bg-gray-500/20 text-gray-300', reviewing: 'bg-blue-500/20 text-blue-300',
  interview1: 'bg-purple-500/20 text-purple-300', interview2: 'bg-violet-500/20 text-violet-300',
  interview3: 'bg-indigo-500/20 text-indigo-300', offered: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300', rejected: 'bg-red-500/20 text-red-400',
  withdrawn: 'bg-gray-600/20 text-gray-500'
};

// ==========================================
// èªè¨¼ï¼ˆCookie ãƒ™ãƒ¼ã‚¹ï¼‰
// ==========================================
async function checkAuth() {
  try {
    const res = await API.get('/auth/admin/me');
    if (res.data.success) {
      const admin = res.data.data;
      const nameEl = document.getElementById('admin-name');
      if (nameEl) nameEl.textContent = admin.name || 'ç®¡ç†è€…';
      return true;
    }
  } catch(e) {
    // 401 ãªã© â†’ æœªèªè¨¼
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
          <h1 class="text-2xl font-bold mb-1">ç®¡ç†ç”»é¢</h1>
          <p class="text-gray-500 text-sm">ã‚¬ã‚¯ãƒã‚«ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ³ Admin</p>
        </div>
        <div class="glass rounded-2xl p-7">
          <form onsubmit="submitLogin(event)">
            <div class="mb-4">
              <label class="block text-xs text-gray-400 mb-1.5">ãƒ¡ãƒ¼ãƒ«ã‚¢ãƒ‰ãƒ¬ã‚¹</label>
              <input id="login-email" type="email" required placeholder="admin@internship.jp"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>
            <div class="mb-5">
              <label class="block text-xs text-gray-400 mb-1.5">ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰</label>
              <input id="login-password" type="password" required placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>
            <div id="login-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
            <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
              <i class="fas fa-sign-in-alt mr-2"></i>ãƒ­ã‚°ã‚¤ãƒ³
            </button>
          </form>
          <div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p class="text-xs text-yellow-400/80">
              <i class="fas fa-info-circle mr-1"></i>
              åˆå›ã¯ <code class="bg-white/10 px-1 rounded">/api/auth/admin/setup</code> ã§ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã‚’è¨­å®šã—ã¦ãã ã•ã„
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
  btn.disabled = true; btn.textContent = 'ãƒ­ã‚°ã‚¤ãƒ³ä¸­...';

  try {
    const res = await API.post('/auth/admin/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    });
    if (res.data.success) {
      // Cookie ã¯è‡ªå‹•ã§è¨­å®šã•ã‚Œã‚‹ï¼ˆHttpOnlyï¼‰
      window.location.reload();
    }
  } catch(e) {
    document.getElementById('login-error').textContent = e.response?.data?.error || 'ãƒ­ã‚°ã‚¤ãƒ³ã«å¤±æ•—ã—ã¾ã—ãŸ';
    document.getElementById('login-error').classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>ãƒ­ã‚°ã‚¤ãƒ³';
  }
}

async function adminLogout() {
  try {
    await API.post('/auth/admin/logout');
  } catch(e) { /* ignore */ }
  window.location.reload();
}

// ==========================================
// ãƒŠãƒ“ã‚²ãƒ¼ã‚·ãƒ§ãƒ³
// ==========================================
function navigate(page) {
  document.querySelectorAll('[data-page]').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const titles = {
    dashboard: 'ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰', companies: 'ä¼æ¥­ç®¡ç†', jobs: 'æ±‚äººç®¡ç†',
    students: 'å­¦ç”Ÿä¸€è¦§', applications: 'å¿œå‹Ÿç®¡ç†', invites: 'æ‹›å¾…ã‚³ãƒ¼ãƒ‰', consultations: 'ç„¡æ–™ç›¸è«‡',
    'site-settings': 'ã‚µã‚¤ãƒˆè¨­å®š', 'lp-edit': 'LPç·¨é›†', faqs: 'FAQç®¡ç†', announcements: 'ãŠçŸ¥ã‚‰ã›ç®¡ç†',
    'success-stories': 'å†…å®šè€…ã‚¿ã‚¤ãƒ ãƒ©ã‚¤ãƒ³ç®¡ç†', 'featured-jobs': 'ãƒ”ãƒƒã‚¯ã‚¢ãƒƒãƒ—æ±‚äººè¨­å®š', 'university-tags': 'å¤§å­¦ã‚¿ã‚°ç®¡ç†'
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
// ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰
// ==========================================
let _dashTerm = 'month'; // ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆ: æœˆé–“

async function loadDashboard(term) {
  if (term) _dashTerm = term;
  const content = document.getElementById('admin-content');
  content.innerHTML = `<div class="animate-pulse space-y-4"><div class="h-24 bg-white/5 rounded-xl"></div><div class="h-64 bg-white/5 rounded-xl"></div></div>`;

  try {
    const res = await API.get(`/applications/admin/stats/summary?term=${_dashTerm}`);
    const d = res.data.data;

    const statusBreakdown = {};
    d.status_breakdown.forEach(s => statusBreakdown[s.status] = s.count);

    const termLabel = { week: 'é€±é–“', month: 'æœˆé–“', year: 'å¹´é–“', all: 'ç´¯è¨ˆ' };
    const termBtns = ['week', 'month', 'year', 'all'].map(t => `
      <button onclick="loadDashboard('${t}')"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${_dashTerm===t ? 'bg-primary-500 text-white' : 'glass text-gray-400 hover:text-white'}">
        ${termLabel[t]}
      </button>
    `).join('');

    content.innerHTML = `
      <!-- ã‚¿ãƒ¼ãƒ åˆ‡ã‚Šæ›¿ãˆ -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-bold text-lg">ãƒ€ãƒƒã‚·ãƒ¥ãƒœãƒ¼ãƒ‰</h2>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500 mr-1">è¡¨ç¤ºæœŸé–“ï¼š</span>
          ${termBtns}
        </div>
      </div>

      <!-- KPIã‚«ãƒ¼ãƒ‰ï¼ˆ5æšï¼‰ -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-user-graduate text-blue-400 text-sm"></i>
            </div>
            <span class="text-xs text-gray-600">ç´¯è¨ˆ</span>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.total_students}<span class="text-base font-normal text-gray-500 ml-1">å</span></div>
          <div class="text-xs text-gray-500 mb-1">ç™»éŒ²å­¦ç”Ÿæ•°</div>
          ${_dashTerm !== 'all' ? `<div class="text-xs text-green-400"><i class="fas fa-arrow-up mr-0.5"></i>${termLabel[_dashTerm]}æ–°è¦ ${d.term_students}å</div>` : ''}
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-file-alt text-purple-400 text-sm"></i>
            </div>
            <span class="text-xs text-gray-600">ç´¯è¨ˆ</span>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.total_applications}<span class="text-base font-normal text-gray-500 ml-1">ä»¶</span></div>
          <div class="text-xs text-gray-500 mb-1">ç·å¿œå‹Ÿæ•°</div>
          ${_dashTerm !== 'all' ? `<div class="text-xs text-purple-400"><i class="fas fa-arrow-up mr-0.5"></i>${termLabel[_dashTerm]}å¿œå‹Ÿ ${d.term_applications}ä»¶</div>` : ''}
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
              <i class="fab fa-line text-green-400 text-sm"></i>
            </div>
            <span class="text-xs text-gray-600">ç´¯è¨ˆ</span>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.total_consultations}<span class="text-base font-normal text-gray-500 ml-1">ä»¶</span></div>
          <div class="text-xs text-gray-500 mb-1">ç„¡æ–™ç›¸è«‡æ•°</div>
          <div class="text-xs text-orange-400">${d.pending_consultations}ä»¶ å¯¾å¿œå¾…ã¡</div>
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-briefcase text-teal-400 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.active_jobs}<span class="text-base font-normal text-gray-500 ml-1">ä»¶</span></div>
          <div class="text-xs text-gray-500">å…¬é–‹ä¸­æ±‚äºº</div>
        </div>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="w-9 h-9 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <i class="fas fa-bell text-yellow-400 text-sm"></i>
            </div>
          </div>
          <div class="text-3xl font-black mb-0.5">${d.pending_applications}<span class="text-base font-normal text-gray-500 ml-1">ä»¶</span></div>
          <div class="text-xs text-gray-500">æœªå¯¾å¿œå¿œå‹Ÿ</div>
        </div>
      </div>

      <!-- å¿œå‹Ÿæ¨ç§»ã‚°ãƒ©ãƒ• + ä¼æ¥­åˆ¥å¿œå‹Ÿãƒ©ãƒ³ã‚­ãƒ³ã‚° + æµå…¥åª’ä½“åˆ¥ã‚°ãƒ©ãƒ• -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- å¿œå‹Ÿæ¨ç§» -->
        <div class="lg:col-span-2 glass rounded-xl p-5">
          <h3 class="font-bold text-sm mb-4">å¿œå‹Ÿæ•°æ¨ç§» <span class="text-gray-500 font-normal text-xs">ï¼ˆ${termLabel[_dashTerm]}ï¼‰</span></h3>
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
            <p class="text-center">ãƒ‡ãƒ¼ã‚¿ãŒã¾ã ã‚ã‚Šã¾ã›ã‚“</p>
          </div>`}
        </div>

        <!-- ä¼æ¥­åˆ¥å¿œå‹Ÿãƒ©ãƒ³ã‚­ãƒ³ã‚° -->
        <div class="glass rounded-xl p-5">
          <h3 class="font-bold text-sm mb-4">ä¼æ¥­åˆ¥å¿œå‹Ÿæ•° <span class="text-gray-500 font-normal text-xs">Top 5</span></h3>
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
                        <span class="font-bold text-white flex-shrink-0">${co.cnt}ä»¶</span>
                      </div>
                      <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all" style="width:${pct}%; background:hsl(${230 + i*20},70%,60%)"></div>
                      </div>
                    </div>
                  `;
                }).join('')
              : '<p class="text-gray-600 text-xs text-center py-4">ãƒ‡ãƒ¼ã‚¿ãŒã‚ã‚Šã¾ã›ã‚“</p>'
            }
          </div>ã{ÚÚ$z{-®éÜj×~8n8ş88^8N8#Â÷âr¢rwĞĞ¢ÂöF—càĞ¢ÆF—b6Æ73Ò&w&–Bw&–BÖ6öÇ2Ó"vÓB#àĞ¢ÆF—càĞ¢ÆÆ&VÂ6Æ73Ò&&Æö6²FW‡B×‡2FW‡BÖw&’ÓCÖ"ÓãR#îŠzK®šcÂöÆ&VÃàĞ¢Æ–çWBG—SÒ&çVÖ&W""æÖSÒ&F—7Æ•ö÷&FW""fÇVSÒ"G¶fVGW&VBæF—7Æ•ö÷&FW'Ò"Ö–ãÒ# Ğ¢6Æ73Ò'rÖgVÆÂ&r×v†—FR&÷&FW"&÷&FW"Öw&’Ó3&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡BÖw&’Ó“#àĞ¢ÂöF—càĞ¢ÆF—càĞ¢ÆÆ&VÂ6Æ73Ò&&Æö6²FW‡B×‡2FW‡BÖw&’ÓCÖ"ÓãR#îXZÎ™h¾ŠŠŞZé£ÂöÆ&VÃàĞ¢Ç6VÆV7BæÖSÒ&—5÷f—6–&ÆR"6Æ73Ò&fVGW&VBÖ¦ö"Ö6öçG&öÂrÖgVÆÂ&r×v†—FR&÷&FW"&÷&FW"Öw&’Ó3&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡BÖw&’Ó“#àĞ¢Æ÷F–öâfÇVSÒ#"7G–ÆSÒ&&6¶w&÷VæC¢6ffc¶6öÆ÷#¢3ƒ#r"G¶fVGW&VBæ—5÷f—6–&ÆSòw6VÆV7FVBs¢rwÓîXZÎ™h³Âö÷F–öãàĞ¢Æ÷F–öâfÇVSÒ#"7G–ÆSÒ&&6¶w&÷VæC¢6ffc¶6öÆ÷#¢3ƒ#r"G²fVGW&VBæ—5÷f—6–&ÆSòw6VÆV7FVBs¢rwÓî™ÙîXZÎ™h³Âö÷F–öãàĞ¢Â÷6VÆV7CàĞ¢ÂöF—càĞ¢ÂöF—càĞ¢ÆF—b6Æ73Ò&fÆW‚§W7F–g’ÖVæBvÓ2BÓB#àĞ¢Æ'WGFöâG—SÒ&'WGFöâ"öæ6Æ–6³Ò&6Æ÷6TÖöFÂ‚’"6Æ73Ò'‚ÓB’Ó"FW‡B×6ÒFW‡BÖw&’ÓC†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#àĞ¢8*Ş8:>8;>8+¾8:°Ğ¢Âö'WGFöãàĞ¢Æ'WGFöâG—SÒ'7V&Ö—B"G·6VÆV7F&ÆT¦ö'2æÆVæwF‚ÓÓÒòvF—6&ÆVBr¢rwÒ6Æ73Ò&&r×&–Ö'’ÓS†÷fW#¦&r×&–Ö'’ÓcF—6&ÆVC¦÷6—G’ÓCF—6&ÆVC¦7W'6÷"Öæ÷BÖÆÆ÷vVBFW‡B×v†—FRFW‡B×6Ò‚Ób’Ó"&÷VæFVBÖÆrG&ç6—F–öâÖ6öÆ÷'2#àĞ¢G¶–Bò~i»Nikr¢~‹ûŞXªwĞĞ¢Âö'WGFöãàĞ¢ÂöF—càĞ¢Âöf÷&ÓàĞ¢ÂöF—càĞ¢ÂöF—càĞ¢°Ğ¢ÖöFÂæ6Æ74Æ—7Bç&VÖ÷fR‚v†–FFVâr“°Ğ§ĞĞ Ğ¦gVæ7F–öâf–ÇFW$fVGW&VD¦ö$6†ö–6W2‡VW'’’°Ğ¢6öç7B¦ö$–D–çWBÒFö7VÖVçBçVW'•6VÆV7F÷"‚r6ÖöFÂÖ6öçFVçB–çWE¶æÖSÒ&¦ö%ö–B%Òr“°Ğ¢–b†¦ö$–D–çWB’¦ö$–D–çWBçfÇVRÒrs°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vfVGW&VBÖ¦ö"×6VÆV7FVBr“òæ6Æ74Æ—7BæFB‚v†–FFVâr“°Ğ¢&VæFW$fVGW&VD¦ö$6†ö–6W2‡VW'’“°Ğ§ĞĞ Ğ¦gVæ7F–öâ&VæFW$fVGW&VD¦ö$6†ö–6W2‡VW'’Òrr’°Ğ¢6öç7B&W7VÇG2ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vfVGW&VBÖ¦ö"×&W7VÇG2r“°Ğ¢–b‚&W7VÇG2’&WGW&ã°Ğ Ğ¢6öç7Bæ÷&ÖÆ—¦VEVW'’Ò7G&–ær‡VW'’’çG&–Ò‚’çFôÆ÷vW$66R‚“°Ğ¢6öç7BÖF6†W2ÒfVGW&VD¦ö$6†ö–6W2æf–ÇFW"†¦ö"ÓàĞ¢G¶¦ö"çF—FÆWÒG¶¦ö"æ6ö×ç•öæÖWÖçFôÆ÷vW$66R‚’æ–æ6ÇVFW2†æ÷&ÖÆ—¦VEVW'’Ğ¢“°Ğ Ğ¢&W7VÇG2æ–ææW$…DÔÂÒÖF6†W2æÆVæwF€Ğ¢òÖF6†W2æÖ†¦ö"Óâ Ğ¢Æ'WGFöâG—SÒ&'WGFöâ"öæ6Æ–6³Ò'6VÆV7DfVGW&VD¦ö$6†ö–6R‚G´çVÖ&W"†¦ö"æ–B—Ò’ Ğ¢6Æ73Ò&&Æö6²rÖgVÆÂ‚ÓB’Ó2FW‡BÖÆVgB&r×v†—FRFW‡BÖw&’Ó“†÷fW#¦&rÖw&’Ófö7W3¦&rÖw&’Ófö7W3¦÷WFÆ–æRÖæöæR&÷&FW"Ö"&÷&FW"Öw&’ÓÆ7C¦&÷&FW"Ö"Ó#àĞ¢Ç7â6Æ73Ò&&Æö6²FW‡B×6ÒföçBÖÖVF—VÒFW‡BÖw&’Ó“#âG¶W66TFÖ–ä‡FÖÂ†¦ö"çF—FÆR—ÓÂ÷7ãàĞ¢Ç7â6Æ73Ò&&Æö6²×BÓãRFW‡B×‡2FW‡BÖw&’Óc#âG¶W66TFÖ–ä‡FÖÂ†¦ö"æ6ö×ç•öæÖR—ÓÂ÷7ãàĞ¢Âö'WGFöãàĞ¢’æ¦ö–â‚rrĞ¢¢sÇ6Æ73Ò'‚ÓB’ÓBFW‡B×6ÒFW‡BÖw&’Óc&r×v†—FR#îiÚK»n8¾Kˆˆ{N88(¾k.K«®8Î8.8(®8î8¾8)3Â÷âs°Ğ¢&W7VÇG2æ6Æ74Æ—7Bç&VÖ÷fR‚v†–FFVâr“°Ğ§ĞĞ Ğ¦gVæ7F–öâ6VÆV7DfVGW&VD¦ö$6†ö–6R†¦ö$–B’°Ğ¢6öç7B¦ö"ÒfVGW&VD¦ö$6†ö–6W2æf–æB†—FVÒÓâçVÖ&W"†—FVÒæ–B’ÓÓÒçVÖ&W"†¦ö$–B’“°Ğ¢–b‚¦ö"’&WGW&ã°Ğ Ğ¢6öç7BÆ&VÂÒG¶¦ö"çF—FÆWÒ‚G¶¦ö"æ6ö×ç•öæÖWÒ–°Ğ¢6öç7B¦ö$–D–çWBÒFö7VÖVçBçVW'•6VÆV7F÷"‚r6ÖöFÂÖ6öçFVçB–çWE¶æÖSÒ&¦ö%ö–B%Òr“°Ğ¢6öç7B6V&6„–çWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vfVGW&VBÖ¦ö"×6V&6‚r“°Ğ¢6öç7B6VÆV7FVBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vfVGW&VBÖ¦ö"×6VÆV7FVBr“°Ğ¢–b†¦ö$–D–çWB’¦ö$–D–çWBçfÇVRÒ7G&–ær†¦ö"æ–B“°Ğ¢–b‡6V&6„–çWB’6V&6„–çWBçfÇVRÒÆ&VÃ°Ğ¢–b‡6VÆV7FVB’°Ğ¢6VÆV7FVBçVW'•6VÆV7F÷"‚w7âr’çFW‡D6öçFVçBÒ˜h©îKŠÓ¢G¶Æ&VÇÖ°Ğ¢6VÆV7FVBæ6Æ74Æ—7Bç&VÖ÷fR‚v†–FFVâr“°Ğ¢ĞĞ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vfVGW&VBÖ¦ö"×&W7VÇG2r“òæ6Æ74Æ—7BæFB‚v†–FFVâr“°Ğ§ĞĞ Ğ¦7–æ2gVæ7F–öâ7V&Ö—D7&VFTfVGW&VD¦ö"†R’°Ğ¢Rç&WfVçDFVfVÇB‚“°Ğ¢6öç7Bf÷&ÒÒRçF&vWC°Ğ¢–b‚f÷&Òæ¦ö%ö–BçfÇVR’°Ğ¢ÆW'B‚~‹ûŞXª88(¾k.K«®8).jIÎ{J.{YiéÎ8¾8(˜h©î8~8n8ş88^8Br“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7BFFÒ°Ğ¢¦ö%ö–C¢çVÖ&W"†f÷&Òæ¦ö%ö–BçfÇVR’ÀĞ¢—5÷f—6–&ÆS¢çVÖ&W"†f÷&Òæ—5÷f—6–&ÆRçfÇVR’ÀĞ¢F—7Æ•ö÷&FW#¢çVÖ&W"†f÷&ÒæF—7Æ•ö÷&FW"çfÇVRĞ¢Ó°Ğ¢G'’°Ğ¢v—B’ç÷7B‚rö†öÖWvRöfVGW&VBÖ¦ö'2öFÖ–ârÂFF“°Ğ¢6Æ÷6TÖöFÂ‚“°Ğ¢v—BÆöDfVGW&VD¦ö'2‚“°Ğ¢6†÷u6fT×6r‚vfVGW&VB×6fRÖ×6rr“°Ğ¢Ò6F6‚†R’°Ğ¢ÆW'B‚~‹ûŞXªZKiYs¢r²vWD”W'&÷$ÖW76vR†R’“°Ğ¢ĞĞ§ĞĞ Ğ¦7–æ2gVæ7F–öâ7V&Ö—EWFFTfVGW&VD¦ö"†RÂ–B’°Ğ¢Rç&WfVçDFVfVÇB‚“°Ğ¢6öç7Bf÷&ÒÒRçF&vWC°Ğ¢–b‚f÷&Òæ¦ö%ö–BçfÇVR’°Ğ¢ÆW'B‚~i»Nik88(¾k.K«®8).jIÎ{J.{YiéÎ8¾8(˜h©î8~8n8ş88^8Br“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7BFFÒ°Ğ¢¦ö%ö–C¢çVÖ&W"†f÷&Òæ¦ö%ö–BçfÇVR’ÀĞ¢—5÷f—6–&ÆS¢çVÖ&W"†f÷&Òæ—5÷f—6–&ÆRçfÇVR’ÀĞ¢F—7Æ•ö÷&FW#¢çVÖ&W"†f÷&ÒæF—7Æ•ö÷&FW"çfÇVRĞ¢Ó°Ğ¢G'’°Ğ¢v—B’çWB†ö†öÖWvRöfVGW&VBÖ¦ö'2öFÖ–âòG¶–GÖÂFF“°Ğ¢6Æ÷6TÖöFÂ‚“°Ğ¢v—BÆöDfVGW&VD¦ö'2‚“°Ğ¢6†÷u6fT×6r‚vfVGW&VB×6fRÖ×6rr“°Ğ¢Ò6F6‚†R’°Ğ¢ÆW'B‚~i»NikZKiYs¢r²vWD”W'&÷$ÖW76vR†R’“°Ğ¢ĞĞ§ĞĞ Ğ¦7–æ2gVæ7F–öâFVÆWFTfVGW&VD¦ö"†–B’°Ğ¢–b‚6öæf—&Ò‚~8>8î89N88>8*ş8*.88>89~k.K«®8).X˜®™šN8~8î88¾ûÉòr’’&WGW&ã°Ğ¢G'’°Ğ¢v—B’æFVÆWFR†ö†öÖWvRöfVGW&VBÖ¦ö'2öFÖ–âòG¶–GÖ“°Ğ¢ÆöDfVGW&VD¦ö'2‚“°Ğ¢6†÷u6fT×6r‚vfVGW&VB×6fRÖ×6rr“°Ğ¢Ò6F6‚†R’°Ğ¢ÆW'B‚~X˜®™šNZKiYs¢r²RæÖW76vR“°Ğ¢ĞĞ§ĞĞ Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¢òòZJ~ZÚn8+ş8+zêyn89®8;Î8+€Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¦7–æ2gVæ7F–öâÆöEVæ—fW'6—G•Fw2‚’°Ğ¢6öç7B6öçFVçBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vFÖ–âÖ6öçFVçBr“°Ğ¢6öçFVçBæ–ææW$…DÔÂÒÆF—b6Æ73Ò&æ–ÖFR×VÇ6R‚ÓcB&r×v†—FRóR&÷VæFVB×†Â#ãÂöF—cæ°Ğ Ğ¢G'’°Ğ¢6öç7B&W2Òv—B’ævWB‚rö†öÖWvR÷Væ—fW'6—G’×Fw2öFÖ–âr“°Ğ¢6öç7BFw2Ò&W2æFFæFF°Ğ Ğ¢6öçFVçBæ–ææW$…DÔÂÒ Ğ¢ÆF—b6Æ73Ò&fÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâÖ"ÓR#àĞ¢Æƒ"6Æ73Ò'FW‡BÖÆrföçBÖ&öÆB#îZJ~ZÚn8+ş8+zêycÂöƒ#àĞ¢Æ'WGFöâöæ6Æ–6³Ò'6†÷uVæ—fW'6—G•FtÖöFÂ‚’"6Æ73Ò&&r×&–Ö'’ÓS†÷fW#¦&r×&–Ö'’ÓcFW‡B×v†—FRFW‡B×6Ò‚ÓR’Ó"&÷VæFVBÖÆrG&ç6—F–öâÖ6öÆ÷'2#àĞ¢Æ’6Æ73Ò&f2f×ÇW2×"Ó#ãÂö“îikŠhş‹ûŞXª Ğ¢Âö'WGFöãàĞ¢ÂöF—càĞ¢ÆF—b6Æ73Ò&&rÖ&ÇVRÓSó&÷&FW"&÷&FW"Ö&ÇVRÓSó#&÷VæFVB×†ÂÓBÖ"ÓRFW‡B×6Ò#àĞ¢Ç6Æ73Ò'FW‡BÖ&ÇVRÓ3Ö"Ó"#ãÆ’6Æ73Ò&f2fÖ–æfòÖ6—&6ÆR×"Ó#ãÂö“îZJ~ZÚn8+ş8+8şk.K«®8¾{IK¹88n8Î8~8~ZJ~ZÚnY	88®888(k.K«®8Ş88~8nŠzK®8~8Ş8î88#Â÷àĞ¢Ç6Æ73Ò'FW‡BÖw&’ÓCFW‡B×‡2#îk.K«®{z™¸n89®8;Î8+8~ZJ~ZÚn8+ş8+8).˜h©î8~8n{IK¹88n8ş88^8N8#Â÷àĞ¢ÂöF—càĞ¢ÆF—b–CÒ'Fr×6fRÖ×6r"6Æ73Ò&†–FFVâÖ"ÓBÓ2&rÖw&VVâÓSó&÷&FW"&÷&FW"Öw&VVâÓSó3&÷VæFVBÖÆrFW‡BÖw&VVâÓCFW‡B×6Ò#àĞ¢Æ’6Æ73Ò&f2fÖ6†V6²Ö6—&6ÆR×"Ó#ãÂö“îKùŞZÙ8~8î8~8ğĞ¢ÂöF—càĞ¢ÆF—b6Æ73Ò&vÆ72&÷VæFVB×†Â÷fW&fÆ÷rÖ†–FFVâ#àĞ¢ÇF&ÆR6Æ73Ò'rÖgVÆÂFW‡B×6Ò#àĞ¢ÇF†VB6Æ73Ò&&r×v†—FRóRFW‡BÖÆVgBFW‡B×‡2FW‡BÖw&’ÓC#àĞ¢ÇG#àĞ¢ÇF‚6Æ73Ò'‚ÓB’Ó2#îZJ~ZÚnYÓÂ÷FƒàĞ¢ÇF‚6Æ73Ò'‚ÓB’Ó2#î8+8:88>8+Â÷FƒàĞ¢ÇF‚6Æ73Ò'‚ÓB’Ó2#îŠªÎiˆîihsÂ÷FƒàĞ¢ÇF‚6Æ73Ò'‚ÓB’Ó2#îŠzK®šcÂ÷FƒàĞ¢ÇF‚6Æ73Ò'‚ÓB’Ó2#îXZÎ™h³Â÷FƒàĞ¢ÇF‚6Æ73Ò'‚ÓB’Ó2FW‡B×&–v‡B#îi8ŞKÙÃÂ÷FƒàĞ¢Â÷G#àĞ¢Â÷F†VCàĞ¢ÇF&öG’6Æ73Ò&F—f–FR×’F—f–FR×v†—FRóR#àĞ¢G·Fw2æÆVæwF‚òFw2æÖ‡BÓâ Ğ¢ÇG"6Æ73Ò&†÷fW#¦&r×v†—FRóR#àĞ¢ÇFB6Æ73Ò'‚ÓB’Ó2FW‡B×v†—FR#âG·BææÖWÓÂ÷FCàĞ¢ÇFB6Æ73Ò'‚ÓB’Ó2FW‡BÖw&’ÓCföçBÖÖöæòFW‡B×‡2#âG·Bç6ÇVwÓÂ÷FCàĞ¢ÇFB6Æ73Ò'‚ÓB’Ó2FW‡BÖw&’ÓCFW‡B×‡2Ö‚×r×‡2G'Væ6FR#âG·BæFW67&—F–öâÇÂrÒwÓÂ÷FCàĞ¢ÇFB6Æ73Ò'‚ÓB’Ó2FW‡BÖw&’ÓC#âG·BæF—7Æ•ö÷&FW'ÓÂ÷FCàĞ¢ÇFB6Æ73Ò'‚ÓB’Ó2#àĞ¢Ç7â6Æ73Ò'‚Ó"’Ó&÷VæFVBFW‡B×‡2G·Bæ—5÷f—6–&ÆRòv&rÖw&VVâÓSó#FW‡BÖw&VVâÓCr¢v&rÖw&’ÓSó#FW‡BÖw&’ÓCwÒ#àĞ¢G·Bæ—5÷f—6–&ÆRò~XZÎ™h²r¢~™ÙîXZÎ™h²wĞĞ¢Â÷7ãàĞ¢Â÷FCàĞ¢ÇFB6Æ73Ò'‚ÓB’Ó2FW‡B×&–v‡B76R×‚Ó"#àĞ¢Æ'WGFöâöæ6Æ–6³Ò'6†÷uVæ—fW'6—G•FtÖöFÂ‚G·Bæ–GÒ’"6Æ73Ò'FW‡BÖ&ÇVRÓC†÷fW#§FW‡BÖ&ÇVRÓ3FW‡B×‡2#àĞ¢Æ’6Æ73Ò&f2fÖVF—B#ãÂö“â{z™¸`Ğ¢Âö'WGFöãàĞ¢Æ'WGFöâöæ6Æ–6³Ò&FVÆWFUVæ—fW'6—G•Fr‚G·Bæ–GÒ’"6Æ73Ò'FW‡B×&VBÓC†÷fW#§FW‡B×&VBÓ3FW‡B×‡2#àĞ¢Æ’6Æ73Ò&f2f×G&6‚#ãÂö“âX˜®™š@Ğ¢Âö'WGFöãàĞ¢Â÷FCàĞ¢Â÷G#àĞ¢’æ¦ö–â‚rr’¢sÇG#ãÇFB6öÇ7ãÒ#b"6Æ73Ò'‚ÓB’Ó‚FW‡BÖ6VçFW"FW‡BÖw&’ÓS#îZJ~ZÚn8+ş8+8Î8.8(®8î8¾8)3Â÷FCãÂ÷G#âwĞĞ¢Â÷F&öG“àĞ¢Â÷F&ÆSàĞ¢ÂöF—càĞ¢°Ğ¢Ò6F6‚†R’°Ğ¢6öçFVçBæ–ææW$…DÔÂÒÆF—b6Æ73Ò'FW‡B×&VBÓCÓB#îXùn[é~ZKiYs¢G¶RæÖW76vWÓÂöF—cæ°Ğ¢ĞĞ§ĞĞ Ğ¦7–æ2gVæ7F–öâ6†÷uVæ—fW'6—G•FtÖöFÂ†–BÒçVÆÂ’°Ğ¢ÆWBFrÒ²æÖS¢rrÂ6ÇVs¢rrÂFW67&—F–öã¢rrÂ—5÷f—6–&ÆS¢ÂF—7Æ•ö÷&FW#¢Ó°Ğ¢6öç7BÖöFÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vÖöFÂr“°Ğ¢6öç7BÖöFÄ6öçFVçBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vÖöFÂÖ6öçFVçBr“°Ğ¢–b‚ÖöFÂÇÂÖöFÄ6öçFVçB’°Ğ¢ÆW'B‚~8:.8;Î888:¾8).™h¾88î8¾8)>8~8~8ş8.yK¾™Ú.8).XhŞŠªŞ8ş‹ëÎ8ş8~8nXhŞ[ªn8®Ššn8~8ş88^8N8"r“°Ğ¢&WGW&ã°Ğ¢ĞĞ Ğ¢–b†–B’°Ğ¢G'’°Ğ¢6öç7B&W2Òv—B’ævWB‚rö†öÖWvR÷Væ—fW'6—G’×Fw2öFÖ–âr“°Ğ¢FrÒ&W2æFFæFFæf–æB‡BÓâçVÖ&W"‡Bæ–B’ÓÓÒçVÖ&W"†–B’’ÇÂFs°Ğ¢Ò6F6‚†R’°Ğ¢ÆW'B‚~ZJ~ZÚn8+ş8+8).Xùn[é~8~8Ş8î8¾8)>8~8~8ó¢r²vWD”W'&÷$ÖW76vR†R’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢ĞĞ Ğ¢ÖöFÄ6öçFVçBæ–ææW$…DÔÂÒ Ğ¢ÆF—b6Æ73Ò'Ób#àĞ¢Æƒ26Æ73Ò'FW‡BÖÆrföçBÖ&öÆBÖ"ÓB#âG¶–Bò~ZJ~ZÚn8+ş8+{z™¸br¢~ZJ~ZÚn8+ş8+‹ûŞXªwÓÂöƒ3àĞ¢Æf÷&Òöç7V&Ö—CÒ"G¶–Bò7V&Ö—EWFFUVæ—fW'6—G•Fr†WfVçBÂG¶–GÒ–¢w7V&Ö—D7&VFUVæ—fW'6—G•Fr†WfVçB’wÒ"6Æ73Ò'76R×’ÓB#àĞ¢ÆF—b6Æ73Ò&w&–Bw&–BÖ6öÇ2Ó"vÓB#àĞ¢ÆF—càĞ¢ÆÆ&VÂ6Æ73Ò&&Æö6²FW‡B×‡2FW‡BÖw&’ÓCÖ"ÓãR#îZJ~ZÚnYÓÇ7â6Æ73Ò'FW‡B×&VBÓC#â£Â÷7ããÂöÆ&VÃàĞ¢Æ–çWBG—SÒ'FW‡B"æÖSÒ&æÖR"fÇVSÒ"G¶W66TFÖ–ä‡FÖÂ‡FrææÖRÇÂrr—Ò"&WV—&V@Ğ¢Æ6V†öÆFW#Ò.Kè³¢iÛKªÎZJ~ZÚb Ğ¢6Æ73Ò'rÖgVÆÂ&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡B×v†—FR#àĞ¢ÂöF—càĞ¢ÆF—càĞ¢ÆÆ&VÂ6Æ73Ò&&Æö6²FW‡B×‡2FW‡BÖw&’ÓCÖ"ÓãR#î8+8:88>8+ûÈ…U$ÎyJûÈ“Ç7â6Æ73Ò'FW‡B×&VBÓC#â£Â÷7ããÂöÆ&VÃàĞ¢Æ–çWBG—SÒ'FW‡B"æÖSÒ'6ÇVr"fÇVSÒ"G¶W66TFÖ–ä‡FÖÂ‡Frç6ÇVrÇÂrr—Ò"&WV—&V@Ğ¢Æ6V†öÆFW#Ò.Kè³¢FöF’ Ğ¢6Æ73Ò'rÖgVÆÂ&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡B×v†—FRföçBÖÖöæò#àĞ¢ÂöF—càĞ¢ÂöF—càĞ¢ÆF—càĞ¢ÆÆ&VÂ6Æ73Ò&&Æö6²FW‡B×‡2FW‡BÖw&’ÓCÖ"ÓãR#îŠªÎiˆîihsÂöÆ&VÃàĞ¢ÇFW‡F&VæÖSÒ&FW67&—F–öâ"&÷w3Ò#" Ğ¢Æ6V†öÆFW#Ò.Kè³¢iz^iÊÎiÈš¹[;8îZÚn[©Î8.8888>89~KÈjZŞ88îXh^Zé®Zéş{‹îZI®i[8" Ğ¢6Æ73Ò'rÖgVÆÂ&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡B×v†—FR&W6—¦RÖæöæR#âG¶W66TFÖ–ä‡FÖÂ‡FræFW67&—F–öâÇÂrr—ÓÂ÷FW‡F&VàĞ¢ÂöF—càĞ¢ÆF—b6Æ73Ò&w&–Bw&–BÖ6öÇ2Ó"vÓB#àĞ¢ÆF—càĞ¢ÆÆ&VÂ6Æ73Ò&&Æö6²FW‡B×‡2FW‡BÖw&’ÓCÖ"ÓãR#îŠzK®šcÂöÆ&VÃàĞ¢Æ–çWBG—SÒ&çVÖ&W""æÖSÒ&F—7Æ•ö÷&FW""fÇVSÒ"G·FræF—7Æ•ö÷&FW'Ò"Ö–ãÒ# Ğ¢6Æ73Ò'rÖgVÆÂ&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡B×v†—FR#àĞ¢ÂöF—càĞ¢ÆF—càĞ¢ÆÆ&VÂ6Æ73Ò&&Æö6²FW‡B×‡2FW‡BÖw&’ÓCÖ"ÓãR#îXZÎ™h¾ŠŠŞZé£ÂöÆ&VÃàĞ¢Ç6VÆV7BæÖSÒ&—5÷f—6–&ÆR"6Æ73Ò'rÖgVÆÂ&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡B×v†—FR#àĞ¢Æ÷F–öâfÇVSÒ#"G·Fræ—5÷f—6–&ÆSòw6VÆV7FVBs¢rwÓîXZÎ™h³Âö÷F–öãàĞ¢Æ÷F–öâfÇVSÒ#"G²Fræ—5÷f—6–&ÆSòw6VÆV7FVBs¢rwÓî™ÙîXZÎ™h³Âö÷F–öãàĞ¢Â÷6VÆV7CàĞ¢ÂöF—càĞ¢ÂöF—càĞ¢ÆF—b6Æ73Ò&fÆW‚§W7F–g’ÖVæBvÓ2BÓB#àĞ¢Æ'WGFöâG—SÒ&'WGFöâ"öæ6Æ–6³Ò&6Æ÷6TÖöFÂ‚’"6Æ73Ò'‚ÓB’Ó"FW‡B×6ÒFW‡BÖw&’ÓC†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#àĞ¢8*Ş8:>8;>8+¾8:°Ğ¢Âö'WGFöãàĞ¢Æ'WGFöâG—SÒ'7V&Ö—B"6Æ73Ò&&r×&–Ö'’ÓS†÷fW#¦&r×&–Ö'’ÓcFW‡B×v†—FRFW‡B×6Ò‚Ób’Ó"&÷VæFVBÖÆrG&ç6—F–öâÖ6öÆ÷'2#àĞ¢G¶–Bò~i»Nikr¢~‹ûŞXªwĞĞ¢Âö'WGFöãàĞ¢ÂöF—càĞ¢Âöf÷&ÓàĞ¢ÂöF—càĞ¢°Ğ¢ÖöFÂæ6Æ74Æ—7Bç&VÖ÷fR‚v†–FFVâr“°Ğ§ĞĞ Ğ¦7–æ2gVæ7F–öâ7V&Ö—D7&VFUVæ—fW'6—G•Fr†R’°Ğ¢Rç&WfVçDFVfVÇB‚“°Ğ¢6öç7Bf÷&ÒÒRçF&vWC°Ğ¢6öç7BFFÒ°Ğ¢æÖS¢f÷&ÒææÖRçfÇVRÀĞ¢6ÇVs¢f÷&Òç6ÇVrçfÇVRÀĞ¢FW67&—F–öã¢f÷&ÒæFW67&—F–öâçfÇVRÀĞ¢—5÷f—6–&ÆS¢çVÖ&W"†f÷&Òæ—5÷f—6–&ÆRçfÇVR’ÀĞ¢F—7Æ•ö÷&FW#¢çVÖ&W"†f÷&ÒæF—7Æ•ö÷&FW"çfÇVRĞ¢Ó°Ğ¢G'’°Ğ¢v—B’ç÷7B‚rö†öÖWvR÷Væ—fW'6—G’×Fw2öFÖ–ârÂFF“°Ğ¢6Æ÷6TÖöFÂ‚“°Ğ¢v—BÆöEVæ—fW'6—G•Fw2‚“°Ğ¢6†÷u6fT×6r‚wFr×6fRÖ×6rr“°Ğ¢Ò6F6‚†R’°Ğ¢ÆW'B‚~‹ûŞXªZKiYs¢r²vWD”W'&÷$ÖW76vR†R’“°Ğ¢ĞĞ§ĞĞ Ğ¦7–æ2gVæ7F–öâ7V&Ö—EWFFUVæ—fW'6—G•Fr†RÂ–B’°Ğ¢Rç&WfVçDFVfVÇB‚“°Ğ¢6öç7Bf÷&ÒÒRçF&vWC°Ğ¢6öç7BFFÒ°Ğ¢æÖS¢f÷&ÒææÖRçfÇVRÀĞ¢6ÇVs¢f÷&Òç6ÇVrçfÇVRÀĞ¢FW67&—F–öã¢f÷&ÒæFW67&—F–öâçfÇVRÀĞ¢—5÷f—6–&ÆS¢çVÖ&W"†f÷&Òæ—5÷f—6–&ÆRçfÇVR’ÀĞ¢F—7Æ•ö÷&FW#¢çVÖ&W"†f÷&ÒæF—7Æ•ö÷&FW"çfÇVRĞ¢Ó°Ğ¢G'’°Ğ¢v—B’çWB†ö†öÖWvR÷Væ—fW'6—G’×Fw2öFÖ–âòG¶–GÖÂFF“°Ğ¢6Æ÷6TÖöFÂ‚“°Ğ¢v—BÆöEVæ—fW'6—G•Fw2‚“°Ğ¢6†÷u6fT×6r‚wFr×6fRÖ×6rr“°Ğ¢Ò6F6‚†R’°Ğ¢ÆW'B‚~i»NikZKiYs¢r²vWD”W'&÷$ÖW76vR†R’“°Ğ¢ĞĞ§ĞĞ Ğ¦7–æ2gVæ7F–öâFVÆWFUVæ—fW'6—G•Fr†–B’°Ğ¢–b‚6öæf—&Ò‚~8>8îZJ~ZÚn8+ş8+8).X˜®™šN8~8î88¾ûÉş{IK¹8N8n8N8(¾k.K«®8¾8(8(.Šz>™šN8^8(Î8î88"r’’&WGW&ã°Ğ¢G'’°Ğ¢v—B’æFVÆWFR†ö†öÖWvR÷Væ—fW'6—G’×Fw2öFÖ–âòG¶–GÖ“°Ğ¢v—BÆöEVæ—fW'6—G•Fw2‚“°Ğ¢6†÷u6fT×6r‚wFr×6fRÖ×6rr“°Ğ¢Ò6F6‚†R’°Ğ¢ÆW'B‚~X˜®™šNZKiYs¢r²vWD”W'&÷$ÖW76vR†R’“°Ğ¢ĞĞ§ĞĞ Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¢òòX[˜	®898:¾898;Î™j.i[ Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¦gVæ7F–öâ6†÷u6fT×6r†–B’°Ğ¢6öç7B×6rÒFö7VÖVçBævWDVÆVÖVçD'”–B†–B“°Ğ¢–b†×6r’°Ğ¢×6ræ6Æ74Æ—7Bç&VÖ÷fR‚v†–FFVâr“°Ğ¢6WEF–ÖV÷WB‚‚’Óâ×6ræ6Æ74Æ—7BæFB‚v†–FFVâr’Â3“°Ğ¢ĞĞ§ĞĞ Ğ¦gVæ7F–öâvWD”W'&÷$ÖW76vR†W'&÷"’°Ğ¢&WGW&âW'&÷#òç&W7öç6SòæFFòæW'&÷"ÇÂW'&÷#òæÖW76vRÇÂ~KˆŞiˆî8®8*8:8;Âs°Ğ§ĞĞ Ğ¦gVæ7F–öâW66TFÖ–ä‡FÖÂ‡fÇVR’°Ğ¢&WGW&â7G&–ær‡fÇVR’ç&WÆ6R‚õ²cÃâr%ÒörÂ6†&7FW"Óâ‡°Ğ¢rbs¢rf×²rÂsÂs¢rfÇC²rÂsâs¢rfwC²rÂ"r#¢rb33“²rÂr"s¢rgV÷C²pĞ¢Ò•¶6†&7FW%Ò“°Ğ§ĞĞ Ğ¢òòX‰ŞiÉşXÉ`Ğ§v–æF÷ræFDWfVçDÆ—7FVæW"‚tDôÔ6öçFVçDÆöFVBrÂ7–æ2‚’Óâ°Ğ¢6öç7BWF†VçF–6FVBÒv—B6†V6´WF‚‚“°Ğ¢–b‚WF†VçF–6FVB’&WGW&ã°Ğ¢æf–vFR‚vF6†&ö&Br“°Ğ§Ò“°Ğ