// ==========================================
// InternBase - 公開画面 JavaScript
// ==========================================

const API = axios.create({ baseURL: '/api' });

// サイト設定キャッシュ
let _siteSettings = null;
async function getSiteSettings() {
  if (_siteSettings) return _siteSettings;
  try {
    const res = await API.get('/settings');
    _siteSettings = res.data.data;
  } catch(e) { _siteSettings = {}; }
  return _siteSettings;
}

// ==========================================
// ホームページ (LP)
// ==========================================
async function initHomePage() {
  const app = document.getElementById('app');

  // サイト設定・お知らせ・FAQ・内定者タイムライン・ピックアップ求人・大学タグを並列取得
  const [s, annRes, faqRes, storiesRes, featuredRes, uniTagsRes] = await Promise.all([
    getSiteSettings(),
    API.get('/settings/announcements').catch(() => ({ data: { data: [] } })),
    API.get('/settings/faqs').catch(() => ({ data: { data: [] } })),
    API.get('/homepage/success-stories').catch(() => ({ data: { data: [] } })),
    API.get('/homepage/featured-jobs').catch(() => ({ data: { data: [] } })),
    API.get('/homepage/university-tags').catch(() => ({ data: { data: [] } }))
  ]);

  const announcements = annRes.data.data;
  const faqs = faqRes.data.data;
  const successStories = storiesRes.data.data;
  const featuredJobs = featuredRes.data.data;
  const universityTags = uniTagsRes.data.data;

  const typeColors = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    success: 'bg-green-500/10 border-green-500/20 text-green-300',
    campaign: 'bg-purple-500/10 border-purple-500/20 text-purple-300'
  };
  const typeIcons = { info: 'info-circle', warning: 'exclamation-triangle', success: 'check-circle', campaign: 'gift' };

  app.innerHTML = `
    <!-- お知らせバナー -->
    ${announcements.length > 0 ? `
    <div class="bg-dark-800 border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-1.5">
        ${announcements.map(a => `
          <div class="flex items-center gap-3 text-sm ${(typeColors[a.type]||typeColors.info)} border rounded-lg px-4 py-2">
            <i class="fas fa-${typeIcons[a.type]||'info-circle'} flex-shrink-0"></i>
            <span class="font-medium">${a.title}</span>
            ${a.body ? `<span class="opacity-75 text-xs hidden sm:block">— ${a.body}</span>` : ''}
            ${a.link_url && a.link_url !== '#' ? `<a href="${a.link_url}" class="ml-auto underline text-xs flex-shrink-0">${a.link_text || '詳細'}</a>` : ''}
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- ヒーローセクション（高学歴層特化ニュアンス） -->
    <section class="hero-gradient min-h-[90vh] flex items-center relative overflow-hidden">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div class="max-w-3xl fade-in">
          <div class="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-xs text-primary-400 mb-6">
            <i class="fas fa-star text-yellow-400"></i>
            ${s.hero_badge_text || '高学歴大学生向け・厳選求人のみ掲載'}
          </div>
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <span class="gradient-text">${s.hero_title_line1 || '圧倒的な'}</span><br>
            <span class="text-white">${s.hero_title_line2 || '実務経験を、'}</span><br>
            <span class="text-white">${s.hero_title_line3 || '今すぐ始めよう。'}</span>
          </h1>
          <p class="text-gray-400 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
            ${s.hero_subtitle || 'スタートアップ・成長企業での長期インターンで、就活で差がつく本物のスキルと実績を手に入れろ。'}
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="/jobs" class="bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-4 rounded-xl transition-all text-center shadow-lg shadow-primary-500/25">
              <i class="fas fa-search mr-2"></i>${s.hero_cta1_text || '求人を探す'}
            </a>
            <a href="/register" class="glass hover:bg-white/10 text-white font-medium px-8 py-4 rounded-xl transition-all text-center">
              <i class="fas fa-ticket-alt mr-2"></i>${s.hero_cta2_text || '招待コードで登録'}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 招待コード + 無料相談（LINE誘導）セクション -->
    <section class="py-12 border-b border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 gap-5">
          <!-- 招待コード -->
          <div class="glass rounded-2xl p-6 hover:bg-white/5 transition-all">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-primary-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="fas fa-ticket-alt text-primary-400 text-xl"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg mb-2">招待コード登録</h3>
                <p class="text-gray-400 text-sm mb-4">先輩・友人からの招待コードで特典をゲット</p>
                <a href="/register" class="inline-block bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors border border-primary-500/20">
                  登録する <i class="fas fa-arrow-right ml-1"></i>
                </a>
              </div>
            </div>
          </div>
          <!-- 無料相談（LINE） -->
          <div class="glass rounded-2xl p-6 hover:bg-white/5 transition-all" style="background: linear-gradient(135deg, rgba(6,198,85,0.05), transparent);">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="fab fa-line text-green-400 text-2xl"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg mb-2">無料相談（LINE）</h3>
                <p class="text-gray-400 text-sm mb-4">キャリアのプロが無料でサポート</p>
                <a href="${s.line_url || '#'}" target="_blank" class="inline-block bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors border border-green-500/20">
                  <i class="fab fa-line mr-1"></i>LINEで相談する <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 大学別おすすめ求人セクション -->
    ${universityTags.length > 0 ? `
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-black mb-3">あなたの大学のおすすめ求人</h2>
          <p class="text-gray-500">各大学に特化した厳選インターン</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          ${universityTags.slice(0, 12).map(tag => `
            <a href="/universities/${tag.slug}" class="glass rounded-xl p-4 text-center hover:bg-white/10 transition-all group">
              <div class="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-500/20 transition-colors">
                <i class="fas fa-university text-primary-400"></i>
              </div>
              <p class="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">${tag.name}</p>
            </a>
          `).join('')}
        </div>
        <div class="text-center">
          <a href="/universities" class="inline-block text-primary-400 hover:text-primary-300 text-sm transition-colors">
            全ての大学を見る <i class="fas fa-arrow-right ml-1"></i>
          </a>
        </div>
      </div>
    </section>` : ''}

    <!-- 人気求人5選（ピックアップ） -->
    ${featuredJobs.length > 0 ? `
    <section class="py-20 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="text-3xl font-black mb-2">人気求人5選</h2>
            <p class="text-gray-500">今最も注目されているインターン</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          ${featuredJobs.map(job => renderJobCard(job)).join('')}
        </div>
        <div class="text-center">
          <a href="/jobs" class="inline-block bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 font-medium px-8 py-3 rounded-xl transition-colors border border-primary-500/20">
            もっと見る <i class="fas fa-arrow-right ml-2"></i>
          </a>
        </div>
      </div>
    </section>` : ''}

    <!-- 会員限定バナー（登録済みでない場合のみ） -->
    ${!localStorage.getItem('student_id') && s.members_banner_enabled !== false ? `
    <section class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 flex flex-col sm:flex-row items-center gap-4">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none"></div>
          <div class="text-3xl">🔒</div>
          <div class="flex-1 text-center sm:text-left">
            <p class="font-bold text-yellow-300 text-lg">${s.members_banner_title || '登録者限定！非公開求人あり'}</p>
            <p class="text-gray-400 text-sm mt-0.5" id="members-job-count-text">
              ${s.members_banner_text || '登録するだけで見られる特別求人をチェックしよう'}
            </p>
          </div>
          <a href="/register" class="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
            ${s.members_banner_btn || '今すぐ登録して確認する'} <i class="fas fa-arrow-right ml-1"></i>
          </a>
        </div>
      </div>
    </section>` : ''}

    <!-- 実績セクション（数字） -->
    <section class="py-16 border-y border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">${s.stat_companies || '50'}<span class="text-2xl">+</span></div>
            <div class="text-gray-500 text-sm">掲載企業数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">${s.stat_jobs || '200'}<span class="text-2xl">+</span></div>
            <div class="text-gray-500 text-sm">求人数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">${s.stat_students || '1000'}<span class="text-2xl">+</span></div>
            <div class="text-gray-500 text-sm">登録学生数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">${s.stat_success_rate || '95'}<span class="text-2xl">%</span></div>
            <div class="text-gray-500 text-sm">就活成功率</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 内定者タイムライン（自動横スクロール） -->
    ${successStories.length > 0 ? `
    <section class="py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div class="text-center">
          <h2 class="text-3xl font-black mb-3">内定者タイムライン</h2>
          <p class="text-gray-500">先輩たちの成功ストーリー</p>
        </div>
      </div>
      <div class="relative">
        <div class="timeline-scroll flex gap-4 px-4" style="animation: scroll-timeline 30s linear infinite;">
          ${successStories.concat(successStories).map(story => `
            <div class="glass rounded-xl p-5 flex-shrink-0 w-80">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-primary-500/15 rounded-full flex items-center justify-center">
                  <i class="fas fa-user-graduate text-primary-400"></i>
                </div>
                <div>
                  <p class="text-sm font-bold">${story.university_name} ${story.student_name}</p>
                  <p class="text-xs text-gray-500">${story.company_name} 内定</p>
                </div>
              </div>
              <p class="text-sm text-gray-400 leading-relaxed">${story.comment}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    <style>
      @keyframes scroll-timeline {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .timeline-scroll:hover { animation-play-state: paused; }
    </style>` : ''}

    <!-- 特徴セクション -->
    <section class="py-20 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-black mb-3">${s.site_name || 'InternBase'}が${s.feature_section_title || '選ばれる理由'}</h2>
          <p class="text-gray-500">${s.feature_section_subtitle || '就活で差をつける、本質的な成長環境を提供します'}</p>
        </div>
        <div id="features-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="glass rounded-2xl p-7 text-center animate-pulse"><div class="h-12 bg-white/5 rounded mb-4"></div></div>
        </div>
      </div>
    </section>

    <!-- FAQ セクション -->
    ${faqs.length > 0 ? `
    <section class="py-20 border-t border-white/5">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-black mb-3">よくある質問</h2>
          <p class="text-gray-500">お気軽にご相談ください</p>
        </div>
        <div class="space-y-3">
          ${faqs.map((f, i) => `
            <div class="glass rounded-xl overflow-hidden">
              <button onclick="toggleFaq(${i})" class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors">
                <span class="font-medium text-sm pr-4">${f.question}</span>
                <i id="faq-icon-${i}" class="fas fa-chevron-down text-gray-500 text-xs flex-shrink-0 transition-transform"></i>
              </button>
              <div id="faq-body-${i}" class="hidden px-5 pb-4">
                <p class="text-gray-400 text-sm leading-relaxed">${f.answer}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>` : ''}

    <!-- CTA セクション（無料相談・LINE誘導・下段） -->
    <section class="py-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="glass rounded-3xl p-12 relative overflow-hidden" style="background: linear-gradient(135deg, rgba(6,198,85,0.05), rgba(79,110,247,0.05));">
          <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-primary-500/5 rounded-3xl"></div>
          <div class="relative">
            <div class="w-16 h-16 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i class="fab fa-line text-green-400 text-3xl"></i>
            </div>
            <h2 class="text-3xl sm:text-4xl font-black mb-4">まずは無料相談から<br>始めてみませんか？</h2>
            <p class="text-gray-400 mb-8 max-w-2xl mx-auto">自分に合ったインターンが見つかるか不安な方も、お気軽にご相談ください。<br>キャリアのプロがLINEでサポートします。</p>
            <a href="${s.line_url || '#'}" target="_blank" class="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-green-500/25">
              <i class="fab fa-line mr-2"></i>LINEで無料相談する <i class="fas fa-external-link-alt ml-1 text-sm"></i>
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  // 会員限定求人件数を取得
  const studentId = localStorage.getItem('student_id');
  const params = studentId ? `?student_id=${studentId}` : '';
  try {
    const res = await API.get('/jobs' + params);
    const membersCount = res.data.members_job_count || 0;

    // 会員限定件数を更新
    if (membersCount > 0 && !studentId) {
      const el = document.getElementById('members-job-count-text');
      if (el) el.textContent = `現在${membersCount}件の非公開求人あり。登録するだけで全て閲覧できます！`;
    }
  } catch(e) {}

  // 特徴カード取得
  try {
    const res = await API.get('/settings/lp-sections');
    const section = res.data.data.find(s => s.section_key === 'features');
    if (section) {
      let cards = [];
      try { cards = JSON.parse(section.content); } catch(e) {}
      const colorMap = { primary: 'bg-primary-500/15 text-primary-400', purple: 'bg-purple-500/15 text-purple-400', green: 'bg-green-500/15 text-green-400', yellow: 'bg-yellow-500/15 text-yellow-400', red: 'bg-red-500/15 text-red-400' };
      document.getElementById('features-grid').innerHTML = cards.map(card => `
        <div class="glass rounded-2xl p-7 text-center">
          <div class="w-14 h-14 ${colorMap[card.color]||colorMap.primary} rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i class="${card.icon?.startsWith('fab') ? card.icon : 'fas fa-'+card.icon} text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2">${card.title}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">${card.body}</p>
        </div>
      `).join('');
    }
  } catch(e) {}
}

function toggleFaq(i) {
  const body = document.getElementById(`faq-body-${i}`);
  const icon = document.getElementById(`faq-icon-${i}`);
  body.classList.toggle('hidden');
  icon.style.transform = body.classList.contains('hidden') ? '' : 'rotate(180deg)';
}

// ==========================================
// 求人一覧ページ
// ==========================================
async function initJobsPage() {
  const app = document.getElementById('app');
  const studentId = localStorage.getItem('student_id');

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-8">
        <h1 class="text-3xl font-black mb-2">求人を探す</h1>
        <p class="text-gray-500">厳選された長期インターン求人一覧</p>
      </div>

      <!-- フィルター -->
      <div class="glass rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
            <input id="search-q" type="text" placeholder="キーワードで検索..."
              class="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500">
          </div>
        </div>
        <select id="filter-industry" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
          <option value="">全業種</option>
          <option>HR・人材</option><option>IT・SaaS</option><option>マーケティング</option>
          <option>コンサルティング</option><option>EC・小売</option><option>メディア</option><option>その他</option>
        </select>
        <select id="filter-style" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
          <option value="">全勤務形態</option>
          <option value="onsite">出社</option><option value="remote">リモート</option><option value="hybrid">ハイブリッド</option>
        </select>
        <button onclick="searchJobs()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          <i class="fas fa-search mr-1"></i>検索
        </button>
      </div>

      <!-- 会員限定タブ（登録済みの場合） -->
      ${studentId ? `
      <div class="flex gap-2 mb-4">
        <button id="tab-public" onclick="switchJobTab('public')" class="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-500 text-white transition-colors">
          <i class="fas fa-globe mr-1"></i>公開求人
        </button>
        <button id="tab-members" onclick="switchJobTab('members')" class="px-4 py-1.5 rounded-lg text-sm font-medium glass text-gray-300 hover:text-white transition-colors">
          <i class="fas fa-lock mr-1"></i>会員限定求人
        </button>
      </div>` : `
      <div id="members-teaser" class="mb-4 p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-xl flex items-center gap-3 text-sm">
        <i class="fas fa-lock text-yellow-400"></i>
        <span class="text-gray-300"><span id="members-count-badge" class="font-bold text-yellow-400">？</span>件の会員限定求人があります。</span>
        <a href="/register" class="ml-auto text-yellow-400 hover:text-yellow-300 text-xs font-medium flex-shrink-0">登録して見る →</a>
      </div>`}

      <div id="jobs-count" class="text-xs text-gray-500 mb-4"></div>
      <div id="jobs-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${[1,2,3,4,5,6].map(() => `<div class="glass rounded-xl p-5 animate-pulse"><div class="h-4 bg-white/10 rounded mb-3 w-3/4"></div><div class="h-3 bg-white/5 rounded mb-2"></div></div>`).join('')}
      </div>
    </div>
  `;

  // URLパラメータからフィルタ設定
  const params = new URLSearchParams(window.location.search);
  if (params.get('industry')) document.getElementById('filter-industry').value = params.get('industry');
  if (params.get('work_style')) document.getElementById('filter-style').value = params.get('work_style');
  if (params.get('q')) document.getElementById('search-q').value = params.get('q');
  document.getElementById('search-q').addEventListener('keydown', e => { if(e.key==='Enter') searchJobs(); });

  await searchJobs();
}

let _currentJobTab = 'public';
function switchJobTab(tab) {
  _currentJobTab = tab;
  document.getElementById('tab-public')?.classList.toggle('bg-primary-500', tab === 'public');
  document.getElementById('tab-public')?.classList.toggle('text-white', tab === 'public');
  document.getElementById('tab-public')?.classList.toggle('glass', tab !== 'public');
  document.getElementById('tab-public')?.classList.toggle('text-gray-300', tab !== 'public');
  document.getElementById('tab-members')?.classList.toggle('bg-primary-500', tab === 'members');
  document.getElementById('tab-members')?.classList.toggle('text-white', tab === 'members');
  document.getElementById('tab-members')?.classList.toggle('glass', tab !== 'members');
  document.getElementById('tab-members')?.classList.toggle('text-gray-300', tab !== 'members');
  searchJobs();
}

async function searchJobs() {
  const q = document.getElementById('search-q')?.value;
  const industry = document.getElementById('filter-industry')?.value;
  const work_style = document.getElementById('filter-style')?.value;
  const studentId = localStorage.getItem('student_id');

  const urlParams = new URLSearchParams();
  if (q) urlParams.set('q', q);
  if (industry) urlParams.set('industry', industry);
  if (work_style) urlParams.set('work_style', work_style);
  if (studentId) urlParams.set('student_id', studentId);

  // 会員限定タブの場合はmembersフィルタ
  if (_currentJobTab === 'members' && studentId) {
    urlParams.set('members', '1');
  }

  document.getElementById('jobs-list').innerHTML = `<div class="glass rounded-xl p-5 animate-pulse col-span-3"><div class="h-4 bg-white/10 rounded w-3/4"></div></div>`;

  try {
    const res = await API.get('/jobs?' + urlParams.toString());
    const jobs = res.data.data;
    const membersCount = res.data.members_job_count || 0;

    document.getElementById('jobs-count').textContent = `${jobs.length}件の求人が見つかりました`;

    // 未登録ユーザー向けの件数バッジを更新
    const badge = document.getElementById('members-count-badge');
    if (badge) badge.textContent = membersCount;

    document.getElementById('jobs-list').innerHTML = jobs.length
      ? jobs.map(j => renderJobCard(j, _currentJobTab === 'members')).join('')
      : `<div class="col-span-3 text-center py-16 text-gray-500">
          <i class="fas fa-search text-4xl mb-4 block opacity-30"></i>
          ${_currentJobTab === 'members' ? '会員限定求人が見つかりませんでした' : '条件に合う求人が見つかりませんでした'}
        </div>`;
  } catch(e) {
    document.getElementById('jobs-list').innerHTML = '<p class="col-span-3 text-center text-red-400">取得に失敗しました</p>';
  }
}

// ==========================================
// 求人詳細ページ
// ==========================================
async function initJobDetailPage() {
  const slug = window.location.pathname.split('/jobs/')[1];
  const app = document.getElementById('app');
  const studentId = localStorage.getItem('student_id');

  app.innerHTML = `<div class="max-w-4xl mx-auto px-4 py-12"><div class="animate-pulse"><div class="h-8 bg-white/10 rounded mb-4 w-2/3"></div><div class="h-4 bg-white/5 rounded mb-2"></div></div></div>`;

  try {
    const params = studentId ? `?student_id=${studentId}` : '';
    const res = await API.get(`/jobs/${slug}${params}`);
    renderJobDetail(res.data.data);
  } catch(e) {
    if (e.response?.data?.error === 'members_only') {
      app.innerHTML = `
        <div class="max-w-xl mx-auto px-4 py-24 text-center">
          <div class="w-20 h-20 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-lock text-yellow-400 text-3xl"></i>
          </div>
          <h1 class="text-2xl font-black mb-3">会員限定求人です</h1>
          <p class="text-gray-400 mb-8 text-sm">この求人は登録学生のみ閲覧できます。<br>無料登録してすぐに確認しましょう！</p>
          <a href="/register" class="inline-block bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            <i class="fas fa-user-plus mr-2"></i>無料で登録する
          </a>
        </div>
      `;
    } else {
      app.innerHTML = `<div class="text-center py-20 text-gray-500"><i class="fas fa-exclamation-circle text-5xl mb-4 block"></i>求人が見つかりませんでした</div>`;
    }
  }
}

function renderJobDetail(job) {
  const app = document.getElementById('app');
  let highlights = [];
  try { highlights = JSON.parse(job.highlights || '[]'); } catch(e) {}
  let tags = [];
  try { tags = JSON.parse(job.tags || '[]'); } catch(e) {}

  const wageText = job.hourly_wage_min
    ? `¥${job.hourly_wage_min.toLocaleString()}${job.hourly_wage_max ? '〜¥'+job.hourly_wage_max.toLocaleString() : '〜'}/時`
    : '応相談';
  const workStyleMap = { onsite: '出社', remote: 'フルリモート', hybrid: 'ハイブリッド' };
  const workStyleText = workStyleMap[job.work_style] || '';

  app.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
      <div class="text-sm text-gray-500 mb-6">
        <a href="/" class="hover:text-white transition-colors">ホーム</a>
        <span class="mx-2">/</span>
        <a href="/jobs" class="hover:text-white transition-colors">求人一覧</a>
        <span class="mx-2">/</span>
        <span class="text-gray-300">${job.title}</span>
      </div>

      ${job.visibility === 'members' ? `
      <div class="mb-4 flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 w-fit">
        <i class="fas fa-lock"></i> 会員限定求人
      </div>` : ''}

      <div class="glass rounded-2xl p-8 mb-6">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            ${job.company_logo ? `<img src="${job.company_logo}" class="w-12 h-12 object-contain rounded-lg">` : `<span class="text-primary-400 font-bold text-xl">${(job.company_name||'?')[0]}</span>`}
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap gap-2 mb-2">
              <span class="tag text-xs px-2 py-0.5 rounded-full">${job.company_industry || ''}</span>
              ${workStyleText ? `<span class="tag text-xs px-2 py-0.5 rounded-full"><i class="fas fa-map-marker-alt mr-1"></i>${workStyleText}</span>` : ''}
              ${job.remote_available ? '<span class="bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-2 py-0.5 rounded-full">リモート可</span>' : ''}
            </div>
            <h1 class="text-2xl sm:text-3xl font-black mb-1">${job.title}</h1>
            <p class="text-primary-400 font-medium">${job.company_name}</p>
          </div>
        </div>
        ${job.catch_copy ? `<p class="text-gray-300 text-lg leading-relaxed border-l-2 border-primary-500 pl-4">${job.catch_copy}</p>` : ''}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div class="bg-white/5 rounded-xl p-3 text-center"><i class="fas fa-yen-sign text-primary-400 mb-1 block"></i><div class="text-sm font-bold">${wageText}</div><div class="text-xs text-gray-500">時給</div></div>
          <div class="bg-white/5 rounded-xl p-3 text-center"><i class="fas fa-clock text-primary-400 mb-1 block"></i><div class="text-xs font-medium">${job.work_hours || '要相談'}</div><div class="text-xs text-gray-500">勤務時間</div></div>
          <div class="bg-white/5 rounded-xl p-3 text-center"><i class="fas fa-map-marker-alt text-primary-400 mb-1 block"></i><div class="text-xs font-medium truncate">${job.work_location ? job.work_location.split('（')[0] : '要確認'}</div><div class="text-xs text-gray-500">勤務地</div></div>
          <div class="bg-white/5 rounded-xl p-3 text-center"><i class="fas fa-calendar text-primary-400 mb-1 block"></i><div class="text-xs font-medium">${job.min_hours_per_month ? job.min_hours_per_month+'h~/月' : '要相談'}</div><div class="text-xs text-gray-500">最低月間時間</div></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          ${highlights.length > 0 ? `
          <div class="glass rounded-2xl p-7">
            <h2 class="text-lg font-bold mb-5 flex items-center gap-2"><i class="fas fa-gift text-primary-400"></i>このインターンにしかない魅力</h2>
            <div class="space-y-4">
              ${highlights.map(h => `<div class="bg-primary-500/5 border border-primary-500/15 rounded-xl p-4"><div class="flex items-start gap-3"><span class="text-2xl">${h.icon||'✨'}</span><div><h3 class="font-bold text-sm mb-1">${h.title}</h3><p class="text-gray-400 text-sm leading-relaxed">${h.body}</p></div></div></div>`).join('')}
            </div>
          </div>` : ''}
          <div class="glass rounded-2xl p-7"><h2 class="text-lg font-bold mb-4 flex items-center gap-2"><i class="fas fa-tasks text-primary-400"></i>業務内容</h2><div class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.work_content}</div></div>
          ${job.requirements ? `<div class="glass rounded-2xl p-7"><h2 class="text-lg font-bold mb-4 flex items-center gap-2"><i class="fas fa-user-check text-primary-400"></i>求める人材</h2><div class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.requirements}</div>${job.preferred_requirements ? `<div class="mt-4 pt-4 border-t border-white/10"><p class="text-xs text-gray-500 mb-2">歓迎条件</p><div class="text-gray-400 text-sm whitespace-pre-line">${job.preferred_requirements}</div></div>` : ''}</div>` : ''}
          ${job.growth_points ? `<div class="glass rounded-2xl p-7"><h2 class="text-lg font-bold mb-4 flex items-center gap-2"><i class="fas fa-chart-line text-primary-400"></i>身につくスキル</h2><div class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.growth_points}</div></div>` : ''}
          ${job.selection_flow ? `<div class="glass rounded-2xl p-7"><h2 class="text-lg font-bold mb-4 flex items-center gap-2"><i class="fas fa-route text-primary-400"></i>選考フロー</h2><div class="text-gray-300 text-sm">${job.selection_flow}</div></div>` : ''}
        </div>
        <div class="space-y-4">
          <div class="glass rounded-2xl p-5 sticky top-20">
            <button onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g,"\\'")}')" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-500/25 text-sm mb-3">
              <i class="fas fa-paper-plane mr-2"></i>この求人に応募する
            </button>
            <a href="/consultation" class="block w-full glass hover:bg-white/10 text-white text-center font-medium py-3 rounded-xl transition-all text-sm">
              <i class="fas fa-comments mr-1"></i>まず相談してみる
            </a>
            <p class="text-xs text-gray-600 text-center mt-3"><i class="fas fa-lock mr-1"></i>応募後、公式LINEにてご連絡します</p>
          </div>
          <div class="glass rounded-2xl p-5">
            <h3 class="font-bold text-sm mb-4">勤務条件</h3>
            <div class="space-y-2.5 text-xs">
              ${[['時給',wageText],['勤務時間',job.work_hours],['勤務日数',job.work_days],['勤務地',job.work_location],['勤務形態',workStyleText],['対象学年',job.target_grade]].filter(([,v])=>v).map(([l,v])=>`<div class="flex gap-2"><span class="text-gray-500 w-16 flex-shrink-0">${l}</span><span class="text-gray-300 leading-relaxed">${v}</span></div>`).join('')}
            </div>
          </div>
          ${tags.length > 0 ? `<div class="glass rounded-2xl p-5"><h3 class="font-bold text-sm mb-3">関連タグ</h3><div class="flex flex-wrap gap-2">${tags.map(t=>`<span class="tag text-xs px-2 py-1 rounded-full">#${t}</span>`).join('')}</div></div>` : ''}
        </div>
      </div>
    </div>

    <div id="apply-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.8);backdrop-filter:blur(4px)">
      <div class="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-5">
          <h3 class="text-lg font-bold">応募する</h3>
          <button onclick="closeApplyModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
        <div id="apply-form-content"></div>
      </div>
    </div>
  `;
}

// ==========================================
// 登録ページ
// ==========================================
async function initRegisterPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-user-plus text-white text-xl"></i>
          </div>
          <h1 class="text-2xl font-black mb-2">新規登録</h1>
          <p class="text-gray-500 text-sm">招待コードをお持ちの方は入力してください</p>
        </div>
        <div class="glass rounded-2xl p-8">
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-300">招待コード <span class="text-gray-500 text-xs font-normal">（任意）</span></label>
            <div class="flex gap-2">
              <input id="invite-code-input" type="text" placeholder="例: WELCOME2024" maxlength="20"
                class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 uppercase text-sm tracking-wider">
              <button onclick="verifyInviteCode()" class="bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-400 px-4 py-3 rounded-lg transition-colors text-sm">確認</button>
            </div>
            <div id="invite-code-msg" class="mt-1.5 text-xs"></div>
          </div>
          <button onclick="showRegisterForm()" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
            登録フォームへ進む
          </button>
          <p class="text-center text-xs text-gray-600 mt-3">招待コードなしでも登録できます</p>
        </div>
      </div>
    </div>
  `;

  // URLに招待コードが含まれる場合は自動入力
  const params = new URLSearchParams(window.location.search);
  if (params.get('code')) {
    document.getElementById('invite-code-input').value = params.get('code').toUpperCase();
    await verifyInviteCode();
  }
}

function showRegisterForm() {
  const inviteCode = document.getElementById('invite-code-input')?.value || '';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-black mb-2">プロフィール入力</h1>
          <p class="text-gray-500 text-sm">基本情報を入力してください</p>
        </div>
        <div class="glass rounded-2xl p-8">
          <form id="register-form" onsubmit="submitRegister(event)">
            <input type="hidden" id="reg-invite-code" value="${inviteCode}">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><label class="block text-xs text-gray-400 mb-1.5">姓 <span class="text-red-400">*</span></label><input id="reg-last-name" type="text" required placeholder="山田" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
              <div><label class="block text-xs text-gray-400 mb-1.5">名 <span class="text-red-400">*</span></label><input id="reg-first-name" type="text" required placeholder="太郎" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><label class="block text-xs text-gray-400 mb-1.5">姓（フリガナ）</label><input id="reg-last-kana" type="text" placeholder="ヤマダ" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
              <div><label class="block text-xs text-gray-400 mb-1.5">名（フリガナ）</label><input id="reg-first-kana" type="text" placeholder="タロウ" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            </div>
            <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">メールアドレス <span class="text-red-400">*</span></label><input id="reg-email" type="email" required placeholder="example@univ.ac.jp" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">電話番号</label><input id="reg-phone" type="tel" placeholder="09012345678" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">大学名 <span class="text-red-400">*</span></label><input id="reg-university" type="text" required placeholder="○○大学" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><label class="block text-xs text-gray-400 mb-1.5">学部・学科</label><input id="reg-faculty" type="text" placeholder="経済学部" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
              <div><label class="block text-xs text-gray-400 mb-1.5">学年 <span class="text-red-400">*</span></label><select id="reg-grade" required class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500"><option value="">選択</option><option value="1">1年生</option><option value="2">2年生</option><option value="3">3年生</option><option value="4">4年生</option></select></div>
            </div>
            <div class="mb-6"><label class="block text-xs text-gray-400 mb-1.5">自己PR（任意）</label><textarea id="reg-pr" rows="3" placeholder="インターンへの動機や自己PR" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"></textarea></div>
            <div id="register-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
            <button type="submit" id="register-btn" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
              <i class="fas fa-user-plus mr-2"></i>登録する
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

async function verifyInviteCode() {
  const code = document.getElementById('invite-code-input').value.trim().toUpperCase();
  const msg = document.getElementById('invite-code-msg');
  if (!code) { msg.innerHTML = '<span class="text-yellow-400">コードを入力してください</span>'; return; }
  msg.innerHTML = '<span class="text-gray-400">確認中...</span>';
  try {
    const res = await API.post('/invite/verify', { code });
    if (res.data.success) msg.innerHTML = `<span class="text-green-400"><i class="fas fa-check-circle mr-1"></i>${res.data.data.description || '有効な招待コードです'}</span>`;
  } catch(e) {
    msg.innerHTML = `<span class="text-red-400"><i class="fas fa-times-circle mr-1"></i>${e.response?.data?.error || '無効なコードです'}</span>`;
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const errDiv = document.getElementById('register-error');
  btn.disabled = true; btn.textContent = '登録中...';
  errDiv.classList.add('hidden');

  const data = {
    last_name: document.getElementById('reg-last-name').value,
    first_name: document.getElementById('reg-first-name').value,
    last_name_kana: document.getElementById('reg-last-kana').value,
    first_name_kana: document.getElementById('reg-first-kana').value,
    email: document.getElementById('reg-email').value,
    phone: document.getElementById('reg-phone').value,
    university: document.getElementById('reg-university').value,
    faculty: document.getElementById('reg-faculty').value,
    grade: parseInt(document.getElementById('reg-grade').value),
    invite_code: document.getElementById('reg-invite-code').value,
    pr_text: document.getElementById('reg-pr').value,
  };

  try {
    const res = await API.post('/students/register', data);
    if (res.data.success) {
      localStorage.setItem('student_id', res.data.data.id);
      localStorage.setItem('student_name', data.last_name + data.first_name);
      localStorage.setItem('my_invite_code', res.data.data.my_invite_code || '');
      showRegisterSuccess(data, res.data.data.my_invite_code);
    }
  } catch(e) {
    errDiv.textContent = e.response?.data?.error || '登録に失敗しました';
    errDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>登録する';
  }
}

async function showRegisterSuccess(data, myCode) {
  const s = await getSiteSettings();
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-green-500/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-check text-green-400 text-3xl"></i>
        </div>
        <h1 class="text-2xl font-black mb-3">登録完了！</h1>
        <p class="text-gray-400 mb-2">${data.last_name}${data.first_name} さん、ようこそ！</p>
        ${myCode ? `
        <div class="glass rounded-xl p-4 mb-5 text-left">
          <p class="text-xs text-gray-500 mb-2"><i class="fas fa-ticket-alt mr-1"></i>あなたの招待コード</p>
          <div class="flex items-center gap-2">
            <code class="text-primary-400 font-bold font-mono text-lg tracking-wider">${myCode}</code>
            <button onclick="navigator.clipboard.writeText('${myCode}');this.textContent='コピー済み'" class="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-lg">コピー</button>
          </div>
          <p class="text-xs text-gray-500 mt-2">${s.student_referral_reward || '友人に共有して特典をゲットしよう'}</p>
          <a href="/mypage" class="text-xs text-primary-400 hover:text-primary-300 mt-1 block">マイページで詳細を確認 →</a>
        </div>` : ''}
        <p class="text-gray-500 text-sm mb-6">公式LINEを友だち追加して、インターン活動をスタートしましょう。</p>
        <div class="space-y-3">
          <a href="${s.line_url || '#'}" class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">
            <i class="fab fa-line text-xl"></i>公式LINEを友だち追加
          </a>
          <a href="/jobs" class="block text-primary-400 hover:text-primary-300 transition-colors text-sm py-2">
            <i class="fas fa-search mr-1"></i>会員限定求人を含む全求人を見る
          </a>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 無料相談ページ
// ==========================================
async function initConsultationPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-comments text-purple-400 text-xl"></i>
        </div>
        <h1 class="text-2xl font-black mb-2">無料相談</h1>
        <p class="text-gray-500 text-sm">キャリアのプロが、インターン選びを無料でサポートします</p>
      </div>
      <div class="glass rounded-2xl p-8">
        <form id="consultation-form" onsubmit="submitConsultation(event)">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="col-span-2 sm:col-span-1"><label class="block text-xs text-gray-400 mb-1.5">お名前 <span class="text-red-400">*</span></label><input id="con-name" type="text" required placeholder="山田 太郎" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            <div class="col-span-2 sm:col-span-1"><label class="block text-xs text-gray-400 mb-1.5">メールアドレス <span class="text-red-400">*</span></label><input id="con-email" type="email" required placeholder="example@univ.ac.jp" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><label class="block text-xs text-gray-400 mb-1.5">大学名</label><input id="con-university" type="text" placeholder="○○大学" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            <div><label class="block text-xs text-gray-400 mb-1.5">学年</label><select id="con-grade" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500"><option value="">選択</option><option value="1">1年生</option><option value="2">2年生</option><option value="3">3年生</option><option value="4">4年生</option></select></div>
          </div>
          <div class="mb-4">
            <label class="block text-xs text-gray-400 mb-1.5">お悩み・相談内容</label>
            <div class="grid grid-cols-2 gap-2 mb-3">
              ${['インターン選びで迷っている','就活との両立が不安','どんなスキルが身につくか知りたい','給与・条件について詳しく聞きたい','面接対策がしたい','その他'].map(c => `<label class="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10"><input type="checkbox" value="${c}" class="concern-check accent-primary-500"><span class="text-xs text-gray-300">${c}</span></label>`).join('')}
            </div>
          </div>
          <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">その他、気になることがあればご記入ください</label><textarea id="con-message" rows="4" placeholder="気になることを何でも" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"></textarea></div>
          <div class="mb-6"><label class="block text-xs text-gray-400 mb-1.5">ご希望の日時（任意）</label><input id="con-datetime" type="text" placeholder="平日の午後など" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
          <div id="consultation-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
          <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
            <i class="fas fa-calendar-alt mr-2"></i>無料相談を申し込む
          </button>
        </form>
      </div>
    </div>
  `;
}

async function submitConsultation(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = '送信中...';
  const concerns = [...document.querySelectorAll('.concern-check:checked')].map(c => c.value);
  try {
    const res = await API.post('/consultation', {
      name: document.getElementById('con-name').value,
      email: document.getElementById('con-email').value,
      university: document.getElementById('con-university').value,
      grade: parseInt(document.getElementById('con-grade').value) || null,
      concern: concerns.join('、'),
      message: document.getElementById('con-message').value,
      preferred_datetime: document.getElementById('con-datetime').value,
    });
    if (res.data.success) {
      const s = await getSiteSettings();
      document.getElementById('app').innerHTML = `
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="text-center max-w-md">
            <div class="w-20 h-20 bg-purple-500/20 border-2 border-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="fas fa-check text-purple-400 text-3xl"></i>
            </div>
            <h1 class="text-2xl font-black mb-3">お申し込みありがとうございます！</h1>
            <p class="text-gray-400 mb-8 text-sm">担当者より2営業日以内にご連絡いたします。<br>公式LINEを追加いただくとより迅速にご連絡できます。</p>
            <div class="space-y-3">
              <a href="${s.line_url || '#'}" class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                <i class="fab fa-line text-xl"></i>公式LINEを友だち追加
              </a>
              <a href="/" class="block text-gray-400 hover:text-white text-sm py-2"><i class="fas fa-home mr-1"></i>トップに戻る</a>
            </div>
          </div>
        </div>
      `;
    }
  } catch(e) {
    const errDiv = document.getElementById('consultation-error');
    errDiv.textContent = e.response?.data?.error || '送信に失敗しました';
    errDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-calendar-alt mr-2"></i>無料相談を申し込む';
  }
}

// ==========================================
// マイページ
// ==========================================
async function initMyPage() {
  const studentId = localStorage.getItem('student_id');
  const app = document.getElementById('app');

  if (!studentId) {
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class="text-center">
          <h1 class="text-xl font-bold mb-4">ログインが必要です</h1>
          <p class="text-gray-400 text-sm mb-6">マイページを見るには登録が必要です</p>
          <a href="/register" class="bg-primary-500 text-white font-bold px-6 py-3 rounded-xl">新規登録</a>
        </div>
      </div>`;
    return;
  }

  app.innerHTML = `<div class="max-w-3xl mx-auto px-4 py-12"><div class="animate-pulse space-y-4"><div class="h-24 bg-white/5 rounded-xl"></div></div></div>`;

  try {
    const [mypageRes, s] = await Promise.all([
      API.get(`/students/mypage/${studentId}`),
      getSiteSettings()
    ]);
    const d = mypageRes.data.data;
    const statusColors = { applied: 'bg-gray-500/20 text-gray-300', reviewing: 'bg-blue-500/20 text-blue-300', interview1: 'bg-purple-500/20 text-purple-300', offered: 'bg-yellow-500/20 text-yellow-300', accepted: 'bg-green-500/20 text-green-300', rejected: 'bg-red-500/20 text-red-400' };
    const statusLabels = { applied: '応募済み', reviewing: '書類選考中', interview1: '1次面接', interview2: '2次面接', interview3: '最終面接', offered: '内定', accepted: '内定承諾', rejected: '不採用', withdrawn: '辞退' };
    const myCode = d.my_invite_code || localStorage.getItem('my_invite_code');
    const referralEnabled = s.student_referral_enabled !== false;
    const inviteUrl = `${window.location.origin}/register?code=${myCode}`;

    app.innerHTML = `
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-2xl font-black mb-8">マイページ</h1>

        <!-- プロフィール -->
        <div class="glass rounded-2xl p-6 mb-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-primary-500/20 rounded-full flex items-center justify-center text-2xl font-black text-primary-400">
              ${(d.last_name||'?')[0]}
            </div>
            <div>
              <h2 class="text-xl font-bold">${d.last_name} ${d.first_name}</h2>
              <p class="text-gray-400 text-sm">${d.university} ${d.grade}年生</p>
              <p class="text-gray-500 text-xs">${d.email}</p>
            </div>
          </div>
        </div>

        <!-- 招待コード -->
        ${referralEnabled && myCode ? `
        <div class="glass rounded-2xl p-6 mb-5 border border-primary-500/20">
          <h3 class="font-bold mb-1 flex items-center gap-2">
            <i class="fas fa-ticket-alt text-primary-400"></i>あなたの招待コード
          </h3>
          <p class="text-xs text-gray-500 mb-4">${s.student_referral_benefit || '友人に共有すると特典が得られます'}</p>
          <div class="bg-dark-900 rounded-xl p-4 mb-4">
            <div class="flex items-center justify-between">
              <code class="text-primary-400 font-bold font-mono text-2xl tracking-widest">${myCode}</code>
              <button onclick="navigator.clipboard.writeText('${myCode}');this.innerHTML='<i class=\\'fas fa-check\\'></i> コピー済み'" class="text-xs bg-primary-500/20 border border-primary-500/30 text-primary-400 px-3 py-1.5 rounded-lg">
                <i class="fas fa-copy"></i> コピー
              </button>
            </div>
            <p class="text-xs text-gray-600 mt-2">使用回数: ${d.my_invite_code_uses || 0}回</p>
          </div>
          <div class="bg-white/5 rounded-xl p-3 mb-3">
            <p class="text-xs text-gray-500 mb-1">招待URL（シェア用）</p>
            <div class="flex items-center gap-2">
              <p class="text-xs text-gray-300 truncate flex-1">${inviteUrl}</p>
              <button onclick="navigator.clipboard.writeText('${inviteUrl}');this.textContent='コピー済み'" class="text-xs text-primary-400 flex-shrink-0">URLをコピー</button>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="text-center">
              <div class="text-2xl font-black gradient-text">${d.referral_count || 0}</div>
              <div class="text-xs text-gray-500">紹介した友人数</div>
            </div>
            <div class="text-gray-400 text-xs max-w-xs text-right">${s.student_referral_reward || '紹介した友人が入会するたびに特典がアップします'}</div>
          </div>
        </div>` : ''}

        <!-- 応募履歴 -->
        <div class="glass rounded-2xl p-6">
          <h3 class="font-bold mb-4 flex items-center gap-2">
            <i class="fas fa-file-alt text-primary-400"></i>応募履歴
            <span class="text-gray-500 font-normal text-sm">(${d.applications?.length || 0}件)</span>
          </h3>
          ${d.applications?.length > 0 ? `
          <div class="space-y-3">
            ${d.applications.map(a => `
              <a href="/jobs/${a.job_slug}" class="flex items-center gap-3 glass rounded-xl p-3 hover:bg-white/5 transition-colors block">
                <span class="status-badge ${statusColors[a.status]||'bg-gray-500/20 text-gray-400'}">${statusLabels[a.status]||a.status}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">${a.job_title}</p>
                  <p class="text-xs text-gray-500">${a.company_name}</p>
                </div>
                <p class="text-xs text-gray-600 flex-shrink-0">${a.created_at?.split('T')[0]||''}</p>
              </a>
            `).join('')}
          </div>` : `
          <div class="text-center py-8 text-gray-500">
            <i class="fas fa-file-alt text-3xl mb-3 block opacity-30"></i>
            <p class="text-sm">まだ応募していません</p>
            <a href="/jobs" class="text-primary-400 text-sm mt-2 block hover:text-primary-300">求人を探す →</a>
          </div>`}
        </div>

        <!-- ログアウト -->
        <div class="text-center mt-6">
          <button onclick="studentLogout()" class="text-xs text-gray-600 hover:text-red-400 transition-colors">
            <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
          </button>
        </div>
      </div>
    `;
  } catch(e) {
    app.innerHTML = `<div class="text-center py-20 text-gray-500">データの取得に失敗しました</div>`;
  }
}

function studentLogout() {
  localStorage.removeItem('student_id');
  localStorage.removeItem('student_name');
  localStorage.removeItem('my_invite_code');
  window.location.href = '/';
}

// ==========================================
// 応募モーダル
// ==========================================
function openApplyModal(jobId, jobTitle) {
  const studentId = localStorage.getItem('student_id');
  const studentName = localStorage.getItem('student_name');
  const modal = document.getElementById('apply-modal');
  const content = document.getElementById('apply-form-content');
  if (!studentId) {
    content.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-user text-4xl text-gray-600 mb-4 block"></i>
        <p class="text-gray-300 mb-2">応募するには登録が必要です</p>
        <p class="text-gray-500 text-sm mb-6">まずは会員登録を完了させてください。</p>
        <a href="/register" class="block w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors text-center mb-3">
          <i class="fas fa-user-plus mr-1"></i>新規登録
        </a>
      </div>`;
  } else {
    content.innerHTML = `
      <div class="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
        <p class="text-xs text-gray-400">応募求人</p><p class="font-bold text-sm">${jobTitle}</p>
      </div>
      <p class="text-sm text-gray-400 mb-4">登録者: <span class="text-white">${studentName}</span></p>
      <form onsubmit="submitApplication(event, ${jobId})">
        <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">応募動機 <span class="text-red-400">*</span></label><textarea id="apply-motivation" rows="4" required placeholder="なぜこの企業のインターンに応募したいですか？" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"></textarea></div>
        <div class="mb-6"><label class="block text-xs text-gray-400 mb-1.5">参加可能な時間帯</label><input id="apply-hours" type="text" placeholder="平日10-18時、週3日程度" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
        <div id="apply-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
        <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl"><i class="fas fa-paper-plane mr-2"></i>応募を確定する</button>
        <p class="text-xs text-gray-600 text-center mt-3"><i class="fab fa-line mr-1 text-green-400"></i>応募後、公式LINEにてご連絡します</p>
      </form>`;
  }
  modal.classList.remove('hidden');
}

function closeApplyModal() {
  document.getElementById('apply-modal')?.classList.add('hidden');
}

async function submitApplication(e, jobId) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = '送信中...';
  try {
    const res = await API.post('/applications', {
      student_id: parseInt(localStorage.getItem('student_id')),
      job_id: jobId,
      motivation: document.getElementById('apply-motivation').value,
      available_hours: document.getElementById('apply-hours').value,
    });
    if (res.data.success) {
      const s = await getSiteSettings();
      document.getElementById('apply-form-content').innerHTML = `
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-green-400 text-2xl"></i>
          </div>
          <h3 class="font-bold mb-2">応募が完了しました！</h3>
          <p class="text-gray-500 text-sm mb-5">公式LINEにてご連絡しますので、追加をお待ちください。</p>
          <a href="${s.line_url || '#'}" class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-sm">
            <i class="fab fa-line text-lg"></i>公式LINEを追加する
          </a>
        </div>`;
    }
  } catch(e) {
    const errDiv = document.getElementById('apply-error');
    errDiv.textContent = e.response?.data?.error || '応募に失敗しました';
    errDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>応募を確定する';
  }
}

// ==========================================
// 共通コンポーネント
// ==========================================
function renderJobCard(job, isMembersTab = false) {
  let tags = [];
  try { tags = JSON.parse(job.tags || '[]'); } catch(e) {}
  const wageText = job.hourly_wage_min
    ? `¥${job.hourly_wage_min.toLocaleString()}${job.hourly_wage_max ? '〜¥'+job.hourly_wage_max.toLocaleString() : '〜'}/h`
    : '応相談';
  const workStyleLabel = { onsite: '出社', remote: 'リモート', hybrid: 'ハイブリッド' };
  const workStyleIcon = { onsite: 'building', remote: 'laptop-house', hybrid: 'random' };
  const isMembersOnly = job.visibility === 'members';

  return `
    <a href="/jobs/${job.slug}" class="glass rounded-xl p-5 card-hover block cursor-pointer ${isMembersOnly ? 'border-yellow-500/20' : ''}">
      ${isMembersOnly ? `<div class="flex items-center gap-1 text-xs text-yellow-400 mb-2"><i class="fas fa-lock"></i> 会員限定</div>` : ''}
      <div class="flex items-start gap-3 mb-3">
        <div class="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          ${job.company_logo ? `<img src="${job.company_logo}" class="w-8 h-8 object-contain rounded">` : `<span class="text-primary-400 font-bold text-sm">${(job.company_name||'?')[0]}</span>`}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-500 truncate">${job.company_name || ''}</p>
          <h3 class="font-bold text-sm leading-tight">${job.title}</h3>
        </div>
      </div>
      ${job.catch_copy ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">${job.catch_copy}</p>` : ''}
      <div class="flex flex-wrap gap-1.5 mb-3">
        <span class="tag text-xs px-2 py-0.5 rounded-full">${job.company_industry || ''}</span>
        ${job.work_style ? `<span class="tag text-xs px-2 py-0.5 rounded-full"><i class="fas fa-${workStyleIcon[job.work_style]||'building'} mr-1"></i>${workStyleLabel[job.work_style]||''}</span>` : ''}
        ${job.remote_available ? '<span class="bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-2 py-0.5 rounded-full">リモート可</span>' : ''}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-white/5">
        <span class="text-primary-400 font-bold text-sm">${wageText}</span>
        <span class="text-xs text-gray-600">${job.applicant_count || 0}名応募</span>
      </div>
      ${tags.length > 0 ? `<div class="flex flex-wrap gap-1 mt-2">${tags.slice(0,3).map(t=>`<span class="text-xs text-gray-600">#${t}</span>`).join('')}</div>` : ''}
    </a>
  `;
}
