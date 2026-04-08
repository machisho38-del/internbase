// ==========================================
// InternBase - 公開画面 JavaScript
// ==========================================

const API = axios.create({ baseURL: '/api' });

// ==========================================
// ホームページ (LP)
// ==========================================
async function initHomePage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <!-- ヒーローセクション -->
    <section class="hero-gradient min-h-[90vh] flex items-center relative overflow-hidden">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div class="max-w-3xl fade-in">
          <div class="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-xs text-primary-400 mb-6">
            <i class="fas fa-star text-yellow-400"></i>
            高学歴大学生向け・厳選求人のみ掲載
          </div>
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            <span class="gradient-text">圧倒的な</span><br>
            <span class="text-white">実務経験を、</span><br>
            <span class="text-white">今すぐ始めよう。</span>
          </h1>
          <p class="text-gray-400 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
            スタートアップ・成長企業での長期インターンで、<br>
            就活で差がつく<span class="text-white font-semibold">本物のスキル</span>と<span class="text-white font-semibold">実績</span>を手に入れろ。
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="/jobs" class="bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-4 rounded-xl transition-all text-center shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40">
              <i class="fas fa-search mr-2"></i>求人を探す
            </a>
            <a href="/register" class="glass hover:bg-white/10 text-white font-medium px-8 py-4 rounded-xl transition-all text-center">
              <i class="fas fa-ticket-alt mr-2"></i>招待コードで登録
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 数字セクション -->
    <section class="py-16 border-y border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">50<span class="text-2xl">+</span></div>
            <div class="text-gray-500 text-sm">掲載企業数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">200<span class="text-2xl">+</span></div>
            <div class="text-gray-500 text-sm">求人数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">1000<span class="text-2xl">+</span></div>
            <div class="text-gray-500 text-sm">登録学生数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1">95<span class="text-2xl">%</span></div>
            <div class="text-gray-500 text-sm">就活成功率</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 新着求人 -->
    <section class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-10">
        <div>
          <h2 class="text-3xl font-black mb-2">新着求人</h2>
          <p class="text-gray-500">厳選されたスタートアップの最新募集情報</p>
        </div>
        <a href="/jobs" class="text-primary-400 hover:text-primary-300 text-sm transition-colors">
          全て見る <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
      <div id="home-jobs" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div class="glass rounded-xl p-5 animate-pulse">
          <div class="h-4 bg-white/10 rounded mb-3 w-3/4"></div>
          <div class="h-3 bg-white/5 rounded mb-2 w-full"></div>
          <div class="h-3 bg-white/5 rounded w-2/3"></div>
        </div>
      </div>
    </section>

    <!-- 特徴セクション -->
    <section class="py-20 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-black mb-3">InternBaseが選ばれる理由</h2>
          <p class="text-gray-500">就活で差をつける、本質的な成長環境を提供します</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="glass rounded-2xl p-7 text-center">
            <div class="w-14 h-14 bg-primary-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i class="fas fa-filter text-primary-400 text-xl"></i>
            </div>
            <h3 class="font-bold text-lg mb-2">厳選求人のみ</h3>
            <p class="text-gray-500 text-sm leading-relaxed">成長環境・待遇・教育体制を独自審査。量より質を重視した厳選求人のみを掲載。</p>
          </div>
          <div class="glass rounded-2xl p-7 text-center">
            <div class="w-14 h-14 bg-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i class="fas fa-user-tie text-purple-400 text-xl"></i>
            </div>
            <h3 class="font-bold text-lg mb-2">プロによる無料相談</h3>
            <p class="text-gray-500 text-sm leading-relaxed">キャリアのプロが就活・インターン選びを無料でサポート。一人で悩まない環境。</p>
          </div>
          <div class="glass rounded-2xl p-7 text-center">
            <div class="w-14 h-14 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <i class="fab fa-line text-green-400 text-xl"></i>
            </div>
            <h3 class="font-bold text-lg mb-2">LINEでスムーズ連絡</h3>
            <p class="text-gray-500 text-sm leading-relaxed">応募後の連絡は公式LINEで。メールより速く、選考をスムーズに進められる。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA セクション -->
    <section class="py-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="glass rounded-3xl p-12 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/5 rounded-3xl"></div>
          <div class="relative">
            <h2 class="text-3xl sm:text-4xl font-black mb-4">まずは無料相談から<br>始めてみませんか？</h2>
            <p class="text-gray-400 mb-8">自分に合ったインターンが見つかるか不安な方も、お気軽にご相談ください。</p>
            <a href="/consultation" class="inline-block bg-primary-500 hover:bg-primary-600 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-primary-500/25">
              <i class="fas fa-calendar-alt mr-2"></i>無料相談を申し込む
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  // 求人データ取得
  try {
    const res = await API.get('/jobs');
    const jobs = res.data.data.slice(0, 6);
    document.getElementById('home-jobs').innerHTML = jobs.length
      ? jobs.map(renderJobCard).join('')
      : '<p class="text-gray-500 col-span-3 text-center py-10">求人を読み込み中...</p>';
  } catch (e) {
    document.getElementById('home-jobs').innerHTML = '<p class="text-gray-500 col-span-3 text-center">求人の取得に失敗しました</p>';
  }
}

// ==========================================
// 求人一覧ページ
// ==========================================
async function initJobsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-8">
        <h1 class="text-3xl font-black mb-2">求人を探す</h1>
        <p class="text-gray-500">厳選された長期インターン求人一覧</p>
      </div>

      <!-- フィルター -->
      <div class="glass rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
            <input id="search-q" type="text" placeholder="キーワードで検索..." 
              class="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500">
          </div>
        </div>
        <select id="filter-industry" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
          <option value="">全業種</option>
          <option>HR・人材</option>
          <option>IT・SaaS</option>
          <option>マーケティング</option>
          <option>コンサルティング</option>
          <option>EC・小売</option>
          <option>メディア</option>
          <option>その他</option>
        </select>
        <select id="filter-style" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
          <option value="">全勤務形態</option>
          <option value="onsite">出社</option>
          <option value="remote">リモート</option>
          <option value="hybrid">ハイブリッド</option>
        </select>
        <button onclick="searchJobs()" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          <i class="fas fa-search mr-1"></i>検索
        </button>
      </div>

      <!-- 結果 -->
      <div id="jobs-count" class="text-xs text-gray-500 mb-4"></div>
      <div id="jobs-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${[1,2,3,4,5,6].map(() => `<div class="glass rounded-xl p-5 animate-pulse"><div class="h-4 bg-white/10 rounded mb-3 w-3/4"></div><div class="h-3 bg-white/5 rounded mb-2"></div><div class="h-3 bg-white/5 rounded w-2/3"></div></div>`).join('')}
      </div>
    </div>
  `;

  // URLパラメータからフィルタ設定
  const params = new URLSearchParams(window.location.search);
  if (params.get('industry')) document.getElementById('filter-industry').value = params.get('industry');
  if (params.get('work_style')) document.getElementById('filter-style').value = params.get('work_style');
  if (params.get('q')) document.getElementById('search-q').value = params.get('q');

  // Enter検索
  document.getElementById('search-q').addEventListener('keydown', e => { if(e.key==='Enter') searchJobs(); });

  await searchJobs();
}

async function searchJobs() {
  const q = document.getElementById('search-q')?.value;
  const industry = document.getElementById('filter-industry')?.value;
  const work_style = document.getElementById('filter-style')?.value;

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (industry) params.set('industry', industry);
  if (work_style) params.set('work_style', work_style);

  document.getElementById('jobs-list').innerHTML = `
    <div class="glass rounded-xl p-5 animate-pulse col-span-3"><div class="h-4 bg-white/10 rounded mb-3 w-3/4"></div></div>`;

  try {
    const res = await API.get('/jobs?' + params.toString());
    const jobs = res.data.data;
    document.getElementById('jobs-count').textContent = `${jobs.length}件の求人が見つかりました`;
    document.getElementById('jobs-list').innerHTML = jobs.length
      ? jobs.map(renderJobCard).join('')
      : `<div class="col-span-3 text-center py-16 text-gray-500">
          <i class="fas fa-search text-4xl mb-4 block opacity-30"></i>
          条件に合う求人が見つかりませんでした
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

  app.innerHTML = `<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div class="animate-pulse"><div class="h-8 bg-white/10 rounded mb-4 w-2/3"></div><div class="h-4 bg-white/5 rounded mb-2"></div><div class="h-4 bg-white/5 rounded w-3/4"></div></div></div>`;

  try {
    const res = await API.get('/jobs/' + slug);
    const job = res.data.data;
    renderJobDetail(job);
  } catch(e) {
    app.innerHTML = `<div class="text-center py-20 text-gray-500"><i class="fas fa-exclamation-circle text-5xl mb-4 block"></i>求人が見つかりませんでした</div>`;
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
      <!-- パンくず -->
      <div class="text-sm text-gray-500 mb-6">
        <a href="/" class="hover:text-white transition-colors">ホーム</a>
        <span class="mx-2">/</span>
        <a href="/jobs" class="hover:text-white transition-colors">求人一覧</a>
        <span class="mx-2">/</span>
        <span class="text-gray-300">${job.title}</span>
      </div>

      <!-- ヘッダー -->
      <div class="glass rounded-2xl p-8 mb-6">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            ${job.company_logo
              ? `<img src="${job.company_logo}" class="w-12 h-12 object-contain rounded-lg">`
              : `<span class="text-primary-400 font-bold text-xl">${(job.company_name||'?')[0]}</span>`}
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

        <!-- 基本情報バッジ -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div class="bg-white/5 rounded-xl p-3 text-center">
            <i class="fas fa-yen-sign text-primary-400 mb-1 block"></i>
            <div class="text-sm font-bold">${wageText}</div>
            <div class="text-xs text-gray-500">時給</div>
          </div>
          <div class="bg-white/5 rounded-xl p-3 text-center">
            <i class="fas fa-clock text-primary-400 mb-1 block"></i>
            <div class="text-xs font-medium">${job.work_hours || '要相談'}</div>
            <div class="text-xs text-gray-500">勤務時間</div>
          </div>
          <div class="bg-white/5 rounded-xl p-3 text-center">
            <i class="fas fa-map-marker-alt text-primary-400 mb-1 block"></i>
            <div class="text-xs font-medium truncate">${job.work_location ? job.work_location.split('（')[0] : '要確認'}</div>
            <div class="text-xs text-gray-500">勤務地</div>
          </div>
          <div class="bg-white/5 rounded-xl p-3 text-center">
            <i class="fas fa-calendar text-primary-400 mb-1 block"></i>
            <div class="text-xs font-medium">${job.min_hours_per_month ? job.min_hours_per_month+'h~/月' : '要相談'}</div>
            <div class="text-xs text-gray-500">最低月間時間</div>
          </div>
        </div>
      </div>

      <!-- 2カラムレイアウト -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- メインコンテンツ -->
        <div class="lg:col-span-2 space-y-6">

          <!-- 3つの魅力 -->
          ${highlights.length > 0 ? `
          <div class="glass rounded-2xl p-7">
            <h2 class="text-lg font-bold mb-5 flex items-center gap-2">
              <i class="fas fa-gift text-primary-400"></i>このインターンにしかない魅力
            </h2>
            <div class="space-y-4">
              ${highlights.map((h, i) => `
                <div class="bg-primary-500/5 border border-primary-500/15 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <span class="text-2xl">${h.icon || '✨'}</span>
                    <div>
                      <h3 class="font-bold text-sm mb-1">${h.title}</h3>
                      <p class="text-gray-400 text-sm leading-relaxed">${h.body}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

          <!-- 業務内容 -->
          <div class="glass rounded-2xl p-7">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <i class="fas fa-tasks text-primary-400"></i>業務内容
            </h2>
            <div class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.work_content}</div>
          </div>

          <!-- 求める人材 -->
          ${job.requirements ? `
          <div class="glass rounded-2xl p-7">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <i class="fas fa-user-check text-primary-400"></i>求める人材
            </h2>
            <div class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.requirements}</div>
            ${job.preferred_requirements ? `
            <div class="mt-4 pt-4 border-t border-white/10">
              <p class="text-xs text-gray-500 mb-2">歓迎条件</p>
              <div class="text-gray-400 text-sm leading-relaxed whitespace-pre-line">${job.preferred_requirements}</div>
            </div>` : ''}
          </div>` : ''}

          <!-- 成長できること -->
          ${job.growth_points ? `
          <div class="glass rounded-2xl p-7">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <i class="fas fa-chart-line text-primary-400"></i>身につくスキル・成長できること
            </h2>
            <div class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.growth_points}</div>
          </div>` : ''}

          <!-- 選考フロー -->
          ${job.selection_flow ? `
          <div class="glass rounded-2xl p-7">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <i class="fas fa-route text-primary-400"></i>選考フロー
            </h2>
            <div class="text-gray-300 text-sm">${job.selection_flow}</div>
          </div>` : ''}
        </div>

        <!-- サイドバー -->
        <div class="space-y-4">
          <!-- 応募ボタン -->
          <div class="glass rounded-2xl p-5 sticky top-20">
            <button onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')"
              class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-500/25 text-sm mb-3">
              <i class="fas fa-paper-plane mr-2"></i>この求人に応募する
            </button>
            <a href="/consultation" class="block w-full glass hover:bg-white/10 text-white text-center font-medium py-3 rounded-xl transition-all text-sm">
              <i class="fas fa-comments mr-1"></i>まず相談してみる
            </a>
            <p class="text-xs text-gray-600 text-center mt-3">
              <i class="fas fa-lock mr-1"></i>応募後、公式LINEにてご連絡します
            </p>
          </div>

          <!-- 勤務条件詳細 -->
          <div class="glass rounded-2xl p-5">
            <h3 class="font-bold text-sm mb-4">勤務条件</h3>
            <div class="space-y-3 text-sm">
              ${[
                ['時給', wageText + (job.wage_note ? `<br><span class="text-xs text-gray-500">${job.wage_note}</span>` : '')],
                ['勤務時間', job.work_hours],
                ['勤務日数', job.work_days],
                ['勤務地', job.work_location],
                ['勤務形態', workStyleText],
                ['対象学年', job.target_grade],
                ['月間時間', job.min_hours_per_month ? `${job.min_hours_per_month}h〜${job.max_hours_per_month ? job.max_hours_per_month+'h' : ''}` : null],
              ].filter(([,v]) => v).map(([label, val]) => `
                <div class="flex gap-2">
                  <span class="text-gray-500 w-20 flex-shrink-0 text-xs pt-0.5">${label}</span>
                  <span class="text-gray-300 text-xs leading-relaxed">${val}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 企業情報 -->
          <div class="glass rounded-2xl p-5">
            <h3 class="font-bold text-sm mb-4">企業情報</h3>
            <div class="space-y-2 text-xs text-gray-400">
              <p class="font-medium text-white">${job.company_name}</p>
              ${job.company_industry ? `<p><i class="fas fa-industry mr-1 text-gray-600"></i>${job.company_industry}</p>` : ''}
              ${job.company_description ? `<p class="leading-relaxed text-gray-500 mt-2">${job.company_description.substring(0, 100)}...</p>` : ''}
              ${job.company_website ? `<a href="${job.company_website}" target="_blank" class="text-primary-400 hover:text-primary-300 flex items-center gap-1 mt-2"><i class="fas fa-external-link-alt"></i>企業サイト</a>` : ''}
            </div>
          </div>

          <!-- タグ -->
          ${tags.length > 0 ? `
          <div class="glass rounded-2xl p-5">
            <h3 class="font-bold text-sm mb-3">関連タグ</h3>
            <div class="flex flex-wrap gap-2">
              ${tags.map(tag => `<span class="tag text-xs px-2 py-1 rounded-full">#${tag}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>
    </div>

    <!-- 応募モーダル -->
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
          <!-- ステップ1: 招待コード（任意） -->
          <div id="step-invite" class="">
            <div class="mb-6">
              <label class="block text-sm font-medium mb-2 text-gray-300">
                招待コード <span class="text-gray-500 text-xs font-normal">（任意）</span>
              </label>
              <div class="flex gap-2">
                <input id="invite-code-input" type="text" placeholder="例: WELCOME2024" maxlength="20"
                  class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 uppercase text-sm tracking-wider">
                <button onclick="verifyInviteCode()" class="bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-400 px-4 py-3 rounded-lg transition-colors text-sm">
                  確認
                </button>
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
    </div>
  `;
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
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">姓 <span class="text-red-400">*</span></label>
                <input id="reg-last-name" type="text" required placeholder="山田" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">名 <span class="text-red-400">*</span></label>
                <input id="reg-first-name" type="text" required placeholder="太郎" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">姓（フリガナ）</label>
                <input id="reg-last-kana" type="text" placeholder="ヤマダ" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">名（フリガナ）</label>
                <input id="reg-first-kana" type="text" placeholder="タロウ" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-xs text-gray-400 mb-1.5">メールアドレス <span class="text-red-400">*</span></label>
              <input id="reg-email" type="email" required placeholder="example@univ.ac.jp" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>

            <div class="mb-4">
              <label class="block text-xs text-gray-400 mb-1.5">電話番号</label>
              <input id="reg-phone" type="tel" placeholder="09012345678" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>

            <div class="mb-4">
              <label class="block text-xs text-gray-400 mb-1.5">大学名 <span class="text-red-400">*</span></label>
              <input id="reg-university" type="text" required placeholder="○○大学" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">学部・学科</label>
                <input id="reg-faculty" type="text" placeholder="経済学部" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">学年 <span class="text-red-400">*</span></label>
                <select id="reg-grade" required class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
                  <option value="">選択</option>
                  <option value="1">1年生</option>
                  <option value="2">2年生</option>
                  <option value="3">3年生</option>
                  <option value="4">4年生</option>
                </select>
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-xs text-gray-400 mb-1.5">自己PR（任意）</label>
              <textarea id="reg-pr" rows="3" placeholder="インターンに応募した動機や自己PRをご記入ください" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"></textarea>
            </div>

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
    if (res.data.success) {
      msg.innerHTML = `<span class="text-green-400"><i class="fas fa-check-circle mr-1"></i>${res.data.data.description || '有効な招待コードです'}</span>`;
    }
  } catch(e) {
    msg.innerHTML = `<span class="text-red-400"><i class="fas fa-times-circle mr-1"></i>${e.response?.data?.error || '無効なコードです'}</span>`;
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  const errDiv = document.getElementById('register-error');
  btn.disabled = true;
  btn.textContent = '登録中...';
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
      showRegisterSuccess(data);
    }
  } catch(e) {
    errDiv.textContent = e.response?.data?.error || '登録に失敗しました';
    errDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>登録する';
  }
}

function showRegisterSuccess(data) {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 bg-green-500/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i class="fas fa-check text-green-400 text-3xl"></i>
        </div>
        <h1 class="text-2xl font-black mb-3">登録完了！</h1>
        <p class="text-gray-400 mb-2">${data.last_name}${data.first_name} さん、ようこそ！</p>
        <p class="text-gray-500 text-sm mb-8">公式LINEを友だち追加して、インターン活動をスタートしましょう。</p>
        <div class="space-y-3">
          <a href="#" class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">
            <i class="fab fa-line text-xl"></i>公式LINEを友だち追加
          </a>
          <a href="/jobs" class="block text-primary-400 hover:text-primary-300 transition-colors text-sm py-2">
            <i class="fas fa-search mr-1"></i>求人を探す
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
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-xs text-gray-400 mb-1.5">お名前 <span class="text-red-400">*</span></label>
              <input id="con-name" type="text" required placeholder="山田 太郎" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="block text-xs text-gray-400 mb-1.5">メールアドレス <span class="text-red-400">*</span></label>
              <input id="con-email" type="email" required placeholder="example@univ.ac.jp" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">大学名</label>
              <input id="con-university" type="text" placeholder="○○大学" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">学年</label>
              <select id="con-grade" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
                <option value="">選択</option>
                <option value="1">1年生</option>
                <option value="2">2年生</option>
                <option value="3">3年生</option>
                <option value="4">4年生</option>
              </select>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs text-gray-400 mb-1.5">お悩み・相談内容</label>
            <div class="grid grid-cols-2 gap-2 mb-3">
              ${['インターン選びで迷っている', '就活との両立が不安', 'どんなスキルが身につくか知りたい', '給与・条件について詳しく聞きたい', '面接対策がしたい', 'その他'].map(c => `
                <label class="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="checkbox" value="${c}" class="concern-check accent-primary-500">
                  <span class="text-xs text-gray-300">${c}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs text-gray-400 mb-1.5">その他、気になることがあればご記入ください</label>
            <textarea id="con-message" rows="4" placeholder="気になることを何でも書いてください" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"></textarea>
          </div>

          <div class="mb-6">
            <label class="block text-xs text-gray-400 mb-1.5">ご希望の日時（任意）</label>
            <input id="con-datetime" type="text" placeholder="平日の午後など" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
          </div>

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
  btn.disabled = true;
  btn.textContent = '送信中...';

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
      document.getElementById('app').innerHTML = `
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="text-center max-w-md">
            <div class="w-20 h-20 bg-purple-500/20 border-2 border-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="fas fa-check text-purple-400 text-3xl"></i>
            </div>
            <h1 class="text-2xl font-black mb-3">お申し込みありがとうございます！</h1>
            <p class="text-gray-400 mb-8 text-sm">担当者より2営業日以内にご連絡いたします。<br>公式LINEを追加いただくと、より迅速にご連絡できます。</p>
            <div class="space-y-3">
              <a href="#" class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                <i class="fab fa-line text-xl"></i>公式LINEを友だち追加
              </a>
              <a href="/" class="block text-gray-400 hover:text-white transition-colors text-sm py-2">
                <i class="fas fa-home mr-1"></i>トップに戻る
              </a>
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
        <p class="text-xs text-gray-600">登録済みの方は求人詳細から直接応募できます</p>
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
        <p class="text-xs text-gray-400">応募求人</p>
        <p class="font-bold text-sm">${jobTitle}</p>
      </div>
      <p class="text-sm text-gray-400 mb-4">登録者: <span class="text-white">${studentName}</span></p>
      <form onsubmit="submitApplication(event, ${jobId})">
        <div class="mb-4">
          <label class="block text-xs text-gray-400 mb-1.5">応募動機 <span class="text-red-400">*</span></label>
          <textarea id="apply-motivation" rows="4" required placeholder="なぜこの企業のインターンに応募したいですか？" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"></textarea>
        </div>
        <div class="mb-6">
          <label class="block text-xs text-gray-400 mb-1.5">参加可能な時間帯</label>
          <input id="apply-hours" type="text" placeholder="平日10-18時、週3日程度など" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500">
        </div>
        <div id="apply-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
        <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
          <i class="fas fa-paper-plane mr-2"></i>応募を確定する
        </button>
        <p class="text-xs text-gray-600 text-center mt-3">
          <i class="fab fa-line mr-1 text-green-400"></i>応募後、公式LINEにてご連絡します
        </p>
      </form>
    `;
  }

  modal.classList.remove('hidden');
}

function closeApplyModal() {
  document.getElementById('apply-modal')?.classList.add('hidden');
}

async function submitApplication(e, jobId) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = '送信中...';

  try {
    const res = await API.post('/applications', {
      student_id: parseInt(localStorage.getItem('student_id')),
      job_id: jobId,
      motivation: document.getElementById('apply-motivation').value,
      available_hours: document.getElementById('apply-hours').value,
    });

    if (res.data.success) {
      document.getElementById('apply-form-content').innerHTML = `
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-green-400 text-2xl"></i>
          </div>
          <h3 class="font-bold mb-2">応募が完了しました！</h3>
          <p class="text-gray-500 text-sm mb-5">公式LINEにてご連絡しますので、追加をお待ちください。</p>
          <a href="#" class="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm">
            <i class="fab fa-line text-lg"></i>公式LINEを追加する
          </a>
        </div>
      `;
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
function renderJobCard(job) {
  let tags = [];
  try { tags = JSON.parse(job.tags || '[]'); } catch(e) {}
  const wageText = job.hourly_wage_min
    ? `¥${job.hourly_wage_min.toLocaleString()}${job.hourly_wage_max ? '〜¥'+job.hourly_wage_max.toLocaleString() : '〜'}/h`
    : '応相談';
  const workStyleIcon = { onsite: 'building', remote: 'laptop-house', hybrid: 'random' };
  const workStyleLabel = { onsite: '出社', remote: 'リモート', hybrid: 'ハイブリッド' };

  return `
    <a href="/jobs/${job.slug}" class="glass rounded-xl p-5 card-hover block cursor-pointer">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          ${job.company_logo
            ? `<img src="${job.company_logo}" class="w-8 h-8 object-contain rounded">`
            : `<span class="text-primary-400 font-bold text-sm">${(job.company_name||'?')[0]}</span>`}
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

      ${tags.length > 0 ? `
      <div class="flex flex-wrap gap-1 mt-2">
        ${tags.slice(0,3).map(t => `<span class="text-xs text-gray-600">#${t}</span>`).join('')}
      </div>` : ''}
    </a>
  `;
}
