// ==========================================
// InternBase - 公開画面 JavaScript
// ==========================================

const API = axios.create({ baseURL: '/api' });

const JOB_OCCUPATION_OPTIONS = ['営業', 'マーケティング', 'コンサルティング', '事務', 'エンジニア', '人事', '事業開発', 'その他'];

function renderOccupationOptions(selected = '') {
  return `<option value="">全職種</option>` + JOB_OCCUPATION_OPTIONS.map(o =>
    `<option value="${o}" ${selected === o ? 'selected' : ''}>${o}</option>`
  ).join('');
}

function parseJsonArrayField(raw) {
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

let _studentSessionChecked = false;

function storeStudentAuth(data) {
  localStorage.setItem('student_id', data.id);
  localStorage.setItem('student_name', data.name || '');
  localStorage.setItem('my_invite_code', data.my_invite_code || '');
}

function clearStudentAuth() {
  localStorage.removeItem('student_id');
  localStorage.removeItem('student_name');
  localStorage.removeItem('my_invite_code');
}

async function restoreStudentSession() {
  if (_studentSessionChecked) return localStorage.getItem('student_id');
  _studentSessionChecked = true;
  try {
    const res = await API.get('/students/me');
    if (res.data.success) storeStudentAuth(res.data.data);
  } catch(e) {
    // Cookie sessionが無い場合は既存localStorageの互換動作を残す。
  }
  return localStorage.getItem('student_id');
}

// ==========================================
// 流入媒体オプション（SOURCE_MEDIA_OPTIONS）
// ==========================================
const SOURCE_MEDIA_OPTIONS = [
  { value: 'sunconnect',  label: 'SUNCONNECT',        line_key: 'line_url_sunconnect' },
  { value: 'valueup',     label: 'バリューアップ',       line_key: 'line_url_valueup' },
  { value: 'genki_intern', label: '元気インターン',       line_key: 'line_url_genki_intern', fallback_to_default: false },
  { value: 'sokei_intern_compass', label: '早慶インターンコンパス', line_key: 'line_url_sokei_intern_compass', fallback_to_default: false },
  { value: 'careersourcing', label: 'CareerSourcing',  line_key: 'line_url_careersourcing', fallback_to_default: false },
  { value: 'other',       label: 'その他',             line_key: 'line_url_default' },
];

function isUsableUrl(url) {
  return !!url && url !== '#' && !String(url).includes('xxxx');
}

function resolveLineUrl(settings, sourceMedia) {
  const mediaOpt = SOURCE_MEDIA_OPTIONS.find(o => o.value === sourceMedia);
  const lineKey = mediaOpt ? mediaOpt.line_key : 'line_url_default';
  const rawLineUrl = settings[lineKey] ||
    (mediaOpt?.fallback_to_default === false ? '' : settings.line_url_default || settings.line_url || '');
  return isUsableUrl(rawLineUrl) ? rawLineUrl : '';
}

function renderLineCta(lineUrl, label = '公式LINEを友だち追加', className = 'flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors') {
  if (!lineUrl) {
    return `
      <div class="flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 text-gray-500 font-bold py-3 px-8 rounded-xl text-sm">
        <i class="fab fa-line text-lg"></i>LINE URL未設定
      </div>
    `;
  }
  return `
    <a href="${lineUrl}" target="_blank" rel="noopener" class="${className}">
      <i class="fab fa-line text-xl"></i>${label}
    </a>
  `;
}

// サイト設定キャッシュ
let _siteSettings = null;
let _siteSettingsPromise = null;

const DEFAULT_SITE_NAME = 'InternBase';

function asSettingText(value) {
  return value == null ? '' : String(value).trim();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function getConfiguredSiteName(settings = {}) {
  return asSettingText(settings.site_name) || DEFAULT_SITE_NAME;
}

function getHeroTitleLines(settings = {}) {
  const tagline = asSettingText(settings.site_tagline);
  if (tagline) {
    const lines = tagline.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length) return lines.slice(0, 4);
  }
  return [
    asSettingText(settings.hero_title_line1) || '圧倒的な',
    asSettingText(settings.hero_title_line2) || '実務経験を、',
    asSettingText(settings.hero_title_line3) || '今すぐ始めよう。'
  ];
}

function getConfiguredDescription(settings = {}) {
  return asSettingText(settings.site_description) ||
    asSettingText(settings.hero_subtitle) ||
    '厳選された長期インターン求人。あなたのキャリアをここから始めよう！';
}

function isSafeRelativeOrAbsoluteUrl(url) {
  const value = asSettingText(url);
  return value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://');
}

function setMetaContent(selector, content) {
  const el = document.querySelector(selector);
  if (el && content) el.setAttribute('content', content);
}

function hexToRgb(hex) {
  const match = asSettingText(hex).match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  };
}

function shadeRgb(rgb, amount) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  return { r: clamp(rgb.r + amount), g: clamp(rgb.g + amount), b: clamp(rgb.b + amount) };
}

function rgbCss(rgb) {
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

function applyPrimaryColor(color) {
  const rgb = hexToRgb(color);
  if (!rgb) return;
  const darker = shadeRgb(rgb, -28);
  let style = document.getElementById('dynamic-primary-color');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamic-primary-color';
    document.head.appendChild(style);
  }
  style.textContent = `
    :root { --site-primary: ${rgbCss(rgb)}; --site-primary-dark: ${rgbCss(darker)}; }
    .text-primary-400, .text-primary-500, .text-primary-600, .text-primary-700 { color: rgb(var(--site-primary)) !important; }
    .bg-primary-500 { background-color: rgb(var(--site-primary)) !important; }
    .hover\\:bg-primary-600:hover { background-color: rgb(var(--site-primary-dark)) !important; }
    .border-primary-500 { border-color: rgb(var(--site-primary)) !important; }
    .focus\\:border-primary-500:focus { border-color: rgb(var(--site-primary)) !important; }
    .from-primary-500 { --tw-gradient-from: rgb(var(--site-primary)) var(--tw-gradient-from-position) !important; --tw-gradient-to: rgb(var(--site-primary) / 0) var(--tw-gradient-to-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
    .to-primary-500 { --tw-gradient-to: rgb(var(--site-primary)) var(--tw-gradient-to-position) !important; }
    .bg-primary-500\\/10 { background-color: rgb(var(--site-primary) / 0.10) !important; }
    .bg-primary-500\\/15 { background-color: rgb(var(--site-primary) / 0.15) !important; }
    .bg-primary-500\\/20 { background-color: rgb(var(--site-primary) / 0.20) !important; }
    .border-primary-500\\/20 { border-color: rgb(var(--site-primary) / 0.20) !important; }
    .border-primary-500\\/25 { border-color: rgb(var(--site-primary) / 0.25) !important; }
    .border-primary-500\\/30 { border-color: rgb(var(--site-primary) / 0.30) !important; }
    .gradient-text { background: linear-gradient(135deg, rgb(var(--site-primary)), #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  `;
}

function applySiteChromeSettings(settings = {}) {
  const siteName = getConfiguredSiteName(settings);
  const description = getConfiguredDescription(settings);

  document.querySelectorAll('.js-site-name').forEach(el => { el.textContent = siteName; });
  const footerDescription = document.getElementById('footer-site-description');
  if (footerDescription) footerDescription.textContent = description;

  if (document.title.includes(DEFAULT_SITE_NAME)) document.title = document.title.replaceAll(DEFAULT_SITE_NAME, siteName);
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[property="og:site_name"]', siteName);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[name="twitter:description"]', description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle?.content?.includes(DEFAULT_SITE_NAME)) ogTitle.content = ogTitle.content.replaceAll(DEFAULT_SITE_NAME, siteName);
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle?.content?.includes(DEFAULT_SITE_NAME)) twitterTitle.content = twitterTitle.content.replaceAll(DEFAULT_SITE_NAME, siteName);

  const logoUrl = asSettingText(settings.site_logo_url);
  const hasLogo = isSafeRelativeOrAbsoluteUrl(logoUrl);
  document.querySelectorAll('.js-site-logo-img').forEach(img => {
    if (hasLogo) {
      img.src = logoUrl;
      img.alt = siteName;
      img.classList.remove('hidden');
    } else {
      img.classList.add('hidden');
    }
  });
  document.querySelectorAll('.js-site-logo-icon').forEach(icon => {
    icon.classList.toggle('hidden', hasLogo);
  });

  const faviconUrl = asSettingText(settings.favicon_url);
  if (isSafeRelativeOrAbsoluteUrl(faviconUrl)) {
    document.querySelectorAll('link[rel~="icon"]').forEach(link => { link.href = faviconUrl; });
  }

  const copyright = asSettingText(settings.footer_copyright);
  if (copyright) document.getElementById('footer-copyright')?.replaceChildren(copyright);
  const privacyUrl = asSettingText(settings.privacy_policy_url);
  if (isSafeRelativeOrAbsoluteUrl(privacyUrl)) document.getElementById('footer-privacy-link')?.setAttribute('href', privacyUrl);
  const termsUrl = asSettingText(settings.terms_url);
  if (isSafeRelativeOrAbsoluteUrl(termsUrl)) document.getElementById('footer-terms-link')?.setAttribute('href', termsUrl);

  applyPrimaryColor(settings.primary_color);
}

async function getSiteSettings() {
  if (_siteSettings) return _siteSettings;
  if (_siteSettingsPromise) return _siteSettingsPromise;
  _siteSettingsPromise = (async () => {
    try {
      const res = await API.get(`/settings?ts=${Date.now()}`);
      _siteSettings = res.data.data || {};
    } catch(e) { _siteSettings = {}; }
    applySiteChromeSettings(_siteSettings);
    return _siteSettings;
  })();
  return _siteSettingsPromise;
}

getSiteSettings().catch(() => {});

// ==========================================
// ホームページ (LP)
// ==========================================
async function initHomePage() {
  const app = document.getElementById('app');
  await restoreStudentSession();

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
  const showSuccessStories = s.success_stories_enabled === true || s.success_stories_enabled === '1';
  const siteName = getConfiguredSiteName(s);
  const heroTitleLines = getHeroTitleLines(s);
  const heroDescription = getConfiguredDescription(s);
  const heroTitleHtml = heroTitleLines.map((line, index) =>
    `<span class="${index === 0 ? 'gradient-text' : 'text-gray-900'}">${escapeHtml(line)}</span>`
  ).join('<br>');

  const typeColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    campaign: 'bg-purple-50 border-purple-200 text-purple-700'
  };
  const typeIcons = { info: 'info-circle', warning: 'exclamation-triangle', success: 'check-circle', campaign: 'gift' };

  app.innerHTML = `
    <!-- お知らせバナー -->
    ${announcements.length > 0 ? `
    <div class="bg-gray-50 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-1.5">
        ${announcements.map(a => `
          <div class="flex items-center gap-3 text-sm ${(typeColors[a.type]||typeColors.info)} border rounded-lg px-4 py-2">
            <i class="fas fa-${typeIcons[a.type]||'info-circle'} flex-shrink-0"></i>
            <span class="font-medium">${a.title}</span>
            ${a.body ? `<span class="opacity-75 text-xs hidden sm:block">— ${a.body}</span>` : ''}
            ${a.link_url && a.link_url !== '#' ? `<a href="${a.link_url}" class="ml-auto underline text-xs flex-shrink-0 hover:opacity-80">${a.link_text || '詳細'}</a>` : ''}
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- ヒーローセクション（高学歴層特化ニュアンス） -->
    <section class="hero-gradient min-h-[620px] sm:min-h-[680px] lg:min-h-[720px] flex items-center relative overflow-hidden">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20 w-full">
        <div class="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-center">
        <div class="max-w-3xl fade-in">
          <div class="inline-flex items-center gap-2 bg-primary-500/15 border border-primary-500/30 rounded-full px-4 py-1.5 text-xs text-primary-700 font-medium mb-6">
            <i class="fas fa-star text-yellow-400"></i>
            ${s.hero_badge_text || '高学歴大学生向け・厳選求人のみ掲載'}
          </div>
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            ${heroTitleHtml}
          </h1>
          <p class="text-gray-700 text-base sm:text-xl leading-relaxed mb-8 max-w-xl">
            ${escapeHtml(heroDescription)}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <a href="/register" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white font-bold px-6 sm:px-10 py-4 rounded-xl transition-all text-center shadow-lg shadow-primary-500/25 text-base">
              <i class="fas fa-ticket-alt text-xl"></i>${s.hero_cta2_text || '招待コードで登録'}
            </a>
            <a href="/jobs" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-6 sm:px-8 py-4 rounded-xl transition-all text-center shadow-lg border border-gray-200">
              <i class="fas fa-search mr-1"></i>${s.hero_cta1_text || '求人を見る'}
            </a>
          </div>
        </div>
        <div class="hidden lg:block fade-in">
          <div class="glass rounded-2xl p-5">
            <p class="text-xs font-bold text-primary-700 mb-1">すぐ探せる条件</p>
            <h2 class="text-xl font-black text-gray-900 mb-4">気になる条件から求人を見る</h2>
            <div class="space-y-2.5">
              <a href="/jobs?industry=IT・SaaS" class="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <span><i class="fas fa-laptop-code text-primary-500 mr-2"></i>業界</span>
                <i class="fas fa-chevron-right text-xs text-gray-300"></i>
              </a>
              <a href="/jobs?work_style=remote" class="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <span><i class="fas fa-house-laptop text-primary-500 mr-2"></i>勤務形態</span>
                <i class="fas fa-chevron-right text-xs text-gray-300"></i>
              </a>
              <a href="/universities" class="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <span><i class="fas fa-university text-primary-500 mr-2"></i>大学別おすすめ</span>
                <i class="fas fa-chevron-right text-xs text-gray-300"></i>
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>

    <!-- LINE無料相談セクション -->
    <section class="py-16 border-b border-gray-100 bg-gradient-to-br from-green-50/60 to-emerald-50/40">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-4 py-1.5 text-xs text-green-700 font-medium mb-4">
          <i class="fab fa-line"></i>無料LINE相談
        </div>
        <h2 class="text-2xl sm:text-3xl font-black mb-3 text-gray-900">インターンについて<br class="sm:hidden">LINE相談してみませんか？</h2>
        <p class="text-gray-600 text-sm mb-8">あなたが見てくれたメディアの専用LINEがあります。気軽にご相談ください</p>
        <button onclick="openLineModal()"
          class="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-green-500/25 text-base">
          <i class="fab fa-line text-xl"></i>公式LINEで無料相談する
          <i class="fas fa-chevron-right text-sm opacity-75"></i>
        </button>
      </div>
    </section>

    <!-- 大学別求人セクション -->
    <section class="py-16 border-b border-gray-100 bg-gradient-to-br from-primary-50/40 to-purple-50/30">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/25 rounded-full px-4 py-1.5 text-xs text-primary-700 font-medium mb-4">
          <i class="fas fa-university"></i>大学別求人
        </div>
        <h2 class="text-2xl sm:text-3xl font-black mb-3 text-gray-900">大学ごとに特化した<br class="sm:hidden">厳選インターンを探す</h2>
        <p class="text-gray-600 text-sm mb-8">あなたの大学に合わせた求人を厳選してご紹介します</p>
        <button onclick="openUniversityModal()"
          class="inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-primary-500/25 text-base">
          <i class="fas fa-university text-lg"></i>大学別求人を見る
          <i class="fas fa-chevron-right text-sm opacity-75"></i>
        </button>
      </div>
    </section>

    <!-- 人気求人5選（ピックアップ） -->
    ${featuredJobs.length > 0 ? `
    <section class="py-20 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="text-3xl font-black mb-2 text-gray-900">人気求人5選</h2>
            <p class="text-gray-700">今最も注目されているインターン</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          ${featuredJobs.map(job => renderJobCard(job)).join('')}
        </div>
        <div class="text-center">
          <a href="/jobs" class="inline-block bg-primary-500/15 hover:bg-primary-500/25 text-primary-700 font-medium px-8 py-3 rounded-xl transition-colors border border-primary-500/30 shadow-sm">
            もっと見る <i class="fas fa-arrow-right ml-2"></i>
          </a>
        </div>
      </div>
    </section>` : ''}

    <!-- 会員限定バナー（登録済みでない場合のみ） -->
    ${!localStorage.getItem('student_id') && s.members_banner_enabled !== false ? `
    <section class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative overflow-hidden rounded-2xl border border-yellow-300 bg-yellow-50 p-6 flex flex-col sm:flex-row items-center gap-4">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-100/50 to-transparent pointer-events-none"></div>
          <div class="text-3xl">🔒</div>
          <div class="flex-1 text-center sm:text-left">
            <p class="font-bold text-yellow-800 text-lg">${s.members_banner_title || '登録者限定！非公開求人あり'}</p>
            <p class="text-yellow-700 text-sm mt-0.5" id="members-job-count-text">
              ${s.members_banner_text || '登録するだけで見られる特別求人をチェックしよう'}
            </p>
          </div>
          <a href="/register" class="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap shadow-md">
            ${s.members_banner_btn || '今すぐ登録して確認する'} <i class="fas fa-arrow-right ml-1"></i>
          </a>
        </div>
      </div>
    </section>` : ''}

    <!-- 実績セクション（数字） -->
    <section class="py-16 border-y border-gray-200 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1"><span id="stat-companies-value">${s.stat_companies || '0'}</span><span class="text-2xl">+</span></div>
            <div class="text-gray-700 text-sm">掲載企業数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1"><span id="stat-jobs-value">${s.stat_jobs || '0'}</span><span class="text-2xl">+</span></div>
            <div class="text-gray-700 text-sm">求人数</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-black gradient-text mb-1"><span id="stat-students-value">${s.stat_students || '0'}</span><span class="text-2xl">+</span></div>
            <div class="text-gray-700 text-sm">登録学生数</div>
          </div>
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-black gradient-text mb-1">受付中</div>
            <div class="text-gray-700 text-sm">無料相談</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 内定者タイムライン（自動横スクロール） -->
    ${showSuccessStories && successStories.length > 0 ? `
    <section class="py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div class="text-center">
          <h2 class="text-3xl font-black mb-3 text-gray-900">内定者タイムライン</h2>
          <p class="text-gray-700">先輩たちの成功ストーリー</p>
        </div>
      </div>
      <div class="relative">
        <div class="timeline-scroll flex gap-4 px-4" style="animation: scroll-timeline 30s linear infinite;">
          ${successStories.concat(successStories).map(story => `
            <div class="glass rounded-xl p-5 flex-shrink-0 w-80">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-primary-500/15 rounded-full flex items-center justify-center">
                  <i class="fas fa-user-graduate text-primary-600"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-900">${story.university_name} ${story.student_name}</p>
                  <p class="text-xs text-gray-700">${story.company_name} 内定</p>
                </div>
              </div>
              <p class="text-sm text-gray-700 leading-relaxed">${story.comment}</p>
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
          <h2 class="text-3xl font-black mb-3 text-gray-900">${escapeHtml(siteName)}が${s.feature_section_title || '選ばれる理由'}</h2>
          <p class="text-gray-700">${s.feature_section_subtitle || '就活で差をつける、本質的な成長環境を提供します'}</p>
        </div>
        <div id="features-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="glass rounded-2xl p-7 text-center animate-pulse"><div class="h-12 bg-gray-100 rounded mb-4"></div></div>
        </div>
      </div>
    </section>

    <!-- FAQ セクション -->
    ${faqs.length > 0 ? `
    <section class="py-20 border-t border-white/5">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-black mb-3 text-gray-900">よくある質問</h2>
          <p class="text-gray-700">お気軽にご相談ください</p>
        </div>
        <div class="space-y-3">
          ${faqs.map((f, i) => `
            <div class="glass rounded-xl overflow-hidden">
              <button onclick="toggleFaq(${i})" class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                <span class="font-medium text-sm pr-4 text-gray-800">${f.question}</span>
                <i id="faq-icon-${i}" class="fas fa-chevron-down text-gray-500 text-xs flex-shrink-0 transition-transform"></i>
              </button>
              <div id="faq-body-${i}" class="hidden px-5 pb-4">
                <p class="text-gray-700 text-sm leading-relaxed">${f.answer}</p>
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
            <p class="text-gray-700 mb-8 max-w-2xl mx-auto">自分に合ったインターンが見つかるか不安な方も、お気軽にご相談ください。<br>キャリアのプロがLINEでサポートします。</p>
            <button onclick="openLineModal()" class="inline-flex items-center justify-center bg-green-500 hover:bg-green-400 text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg shadow-green-500/25 border-none cursor-pointer">
              <i class="fab fa-line mr-2"></i>LINEで無料相談する <i class="fas fa-external-link-alt ml-1 text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;

  // 会員限定求人件数を取得
  const studentId = localStorage.getItem('student_id');
  const params = studentId ? `?student_id=${studentId}` : '';
  try {
    const [jobsRes, companiesRes] = await Promise.all([
      API.get('/jobs' + params),
      API.get('/companies').catch(() => ({ data: { data: [] } }))
    ]);
    const jobs = jobsRes.data.data || [];
    const companies = companiesRes.data.data || [];
    const membersCount = jobsRes.data.members_job_count || 0;

    document.getElementById('stat-jobs-value')?.replaceChildren(String(jobs.length));
    document.getElementById('stat-companies-value')?.replaceChildren(String(companies.length));

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
      const colorMap = { primary: 'bg-primary-500/15 text-primary-700', purple: 'bg-purple-500/15 text-purple-700', green: 'bg-green-500/15 text-green-700', yellow: 'bg-yellow-500/15 text-yellow-700', red: 'bg-red-500/15 text-red-700' };
      document.getElementById('features-grid').innerHTML = cards.map(card => `
        <div class="glass rounded-2xl p-7 text-center">
          <div class="w-14 h-14 ${colorMap[card.color]||colorMap.primary} rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i class="${card.icon?.startsWith('fab') ? card.icon : 'fas fa-'+card.icon} text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2 text-gray-900">${card.title}</h3>
          <p class="text-gray-700 text-sm leading-relaxed">${card.body}</p>
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
  await restoreStudentSession();
  const studentId = localStorage.getItem('student_id');

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-8">
        <h1 class="text-3xl font-black mb-2 text-gray-900">求人を探す</h1>
        <p class="text-gray-500">厳選された長期インターン求人一覧</p>
      </div>

      <!-- フィルター -->
      <div class="glass rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
            <input id="search-q" type="text" placeholder="キーワードで検索..."
              class="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500">
          </div>
        </div>
        <select id="filter-occupation" class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary-500">
          ${renderOccupationOptions()}
        </select>
        <select id="filter-industry" class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary-500">
          <option value="">全業種</option>
          <option>HR・人材</option><option>IT・SaaS</option><option>マーケティング</option>
          <option>コンサルティング</option><option>EC・小売</option><option>メディア</option><option>その他</option>
        </select>
        <select id="filter-style" class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary-500">
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
        <button id="tab-members" onclick="switchJobTab('members')" class="px-4 py-1.5 rounded-lg text-sm font-medium glass text-gray-700 hover:text-primary-600 transition-colors">
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
  if (params.get('occupation')) document.getElementById('filter-occupation').value = params.get('occupation');
  if (params.get('industry')) document.getElementById('filter-industry').value = params.get('industry');
  if (params.get('work_style')) document.getElementById('filter-style').value = params.get('work_style');
  if (params.get('q')) document.getElementById('search-q').value = params.get('q');
  document.getElementById('search-q').addEventListener('input', () => {
    clearTimeout(window.__jobSearchTimer);
    window.__jobSearchTimer = setTimeout(searchJobs, 250);
  });
  document.getElementById('search-q').addEventListener('keydown', e => { if(e.key==='Enter') searchJobs(); });
  document.getElementById('filter-occupation').addEventListener('change', searchJobs);
  document.getElementById('filter-industry').addEventListener('change', searchJobs);
  document.getElementById('filter-style').addEventListener('change', searchJobs);

  await searchJobs();
}

let _currentJobTab = 'public';
function switchJobTab(tab) {
  _currentJobTab = tab;
  document.getElementById('tab-public')?.classList.toggle('bg-primary-500', tab === 'public');
  document.getElementById('tab-public')?.classList.toggle('text-white', tab === 'public');
  document.getElementById('tab-public')?.classList.toggle('glass', tab !== 'public');
  document.getElementById('tab-public')?.classList.toggle('text-gray-700', tab !== 'public');
  document.getElementById('tab-members')?.classList.toggle('bg-primary-500', tab === 'members');
  document.getElementById('tab-members')?.classList.toggle('text-white', tab === 'members');
  document.getElementById('tab-members')?.classList.toggle('glass', tab !== 'members');
  document.getElementById('tab-members')?.classList.toggle('text-gray-700', tab !== 'members');
  searchJobs();
}

async function searchJobs() {
  const q = document.getElementById('search-q')?.value.trim();
  const occupation = document.getElementById('filter-occupation')?.value;
  const industry = document.getElementById('filter-industry')?.value;
  const work_style = document.getElementById('filter-style')?.value;
  const studentId = localStorage.getItem('student_id');

  const urlParams = new URLSearchParams();
  if (q) urlParams.set('q', q);
  if (occupation) urlParams.set('occupation', occupation);
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
  await restoreStudentSession();
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

  // JSONフィールドのパース
  let highlights = parseJsonArrayField(job.highlights);
  let appealPoints = parseJsonArrayField(job.appeal_points);
  let skillSet = parseJsonArrayField(job.skill_set);
  let tags = parseJsonArrayField(job.tags);

  // §2の魅力ポイント：appeal_points優先、なければhighlights
  const attractionPoints = appealPoints.length > 0 ? appealPoints : highlights;

  const wageText = job.hourly_wage_min
    ? `¥${Number(job.hourly_wage_min).toLocaleString()}${job.hourly_wage_max ? '〜¥'+Number(job.hourly_wage_max).toLocaleString() : '〜'}/時`
    : '応相談';
  const workStyleMap = { onsite: '出社', remote: 'フルリモート', hybrid: 'ハイブリッド' };
  const workStyleText = workStyleMap[job.work_style] || '';

  // 応募ボタンのHTML（再利用）
  const ctaHTML = `
    <button onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g,"\\'")}')" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-500/25 mb-3">
      <i class="fas fa-paper-plane mr-2"></i>この求人に応募する
    </button>
    <a href="/consultation" class="block w-full glass text-gray-800 hover:text-primary-600 text-center font-bold py-3 rounded-xl transition-all text-sm">
      <i class="fas fa-comments mr-1"></i>まず相談してみる
    </a>
    <p class="text-xs text-gray-600 text-center mt-3"><i class="fas fa-lock mr-1"></i>応募後、公式LINEにてご連絡します</p>
  `;

  app.innerHTML = `
    <div class="fade-in">

      <!-- §1 FV（ファーストビュー） -->
      <section id="job-fv" class="relative">
        ${job.hero_image_url
          ? `<div class="w-full h-56 sm:h-72 lg:h-80 overflow-hidden"><img src="${job.hero_image_url}" class="w-full h-full object-cover" alt="${job.title}"></div>`
          : `<div class="w-full h-40 sm:h-56 bg-gradient-to-r from-primary-900 via-dark-800 to-purple-900"></div>`
        }
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- パンくず -->
          <nav class="text-sm text-gray-500 mb-5">
            <a href="/" class="hover:text-white transition-colors">ホーム</a>
            <span class="mx-2">/</span>
            <a href="/jobs" class="hover:text-white transition-colors">求人一覧</a>
            <span class="mx-2">/</span>
            <span class="text-gray-300">${job.title}</span>
          </nav>
          <div class="glass rounded-2xl p-6 sm:p-8">
            <div class="flex items-start gap-4 mb-5">
              <div class="w-16 h-16 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-500/20">
                ${job.company_logo
                  ? `<img src="${job.company_logo}" class="w-12 h-12 object-contain rounded-lg" alt="${job.company_name}">`
                  : `<span class="text-primary-400 font-bold text-xl">${(job.company_name||'?')[0]}</span>`}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap gap-2 mb-2">
                  ${job.visibility === 'members' ? '<span class="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs px-2 py-0.5 rounded-full"><i class="fas fa-lock mr-1"></i>会員限定</span>' : ''}
                  ${job.occupation ? `<span class="tag text-xs px-2 py-0.5 rounded-full"><i class="fas fa-briefcase mr-1"></i>${job.occupation}</span>` : ''}
                  ${job.company_industry ? `<span class="tag text-xs px-2 py-0.5 rounded-full">${job.company_industry}</span>` : ''}
                  ${workStyleText ? `<span class="tag text-xs px-2 py-0.5 rounded-full"><i class="fas fa-map-marker-alt mr-1"></i>${workStyleText}</span>` : ''}
                  ${job.remote_available ? '<span class="bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-2 py-0.5 rounded-full">リモート可</span>' : ''}
                </div>
                <h1 class="text-2xl sm:text-3xl font-black mb-1 leading-tight">${job.title}</h1>
                <p class="text-primary-400 font-semibold">${job.company_name}</p>
              </div>
            </div>
            ${job.catch_copy ? `<p class="text-gray-300 text-base sm:text-lg leading-relaxed border-l-4 border-primary-500 pl-4 mb-5">${job.catch_copy}</p>` : ''}
            <!-- 勤務条件サマリー（§3 先出し） -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-white/5 rounded-xl p-3 text-center">
                <i class="fas fa-yen-sign text-primary-400 mb-1 block text-sm"></i>
                <div class="text-sm font-bold leading-tight">${wageText}</div>
                <div class="text-xs text-gray-500 mt-0.5">時給</div>
              </div>
              <div class="bg-white/5 rounded-xl p-3 text-center">
                <i class="fas fa-clock text-primary-400 mb-1 block text-sm"></i>
                <div class="text-xs font-medium leading-tight">${job.work_hours || '要相談'}</div>
                <div class="text-xs text-gray-500 mt-0.5">勤務時間</div>
              </div>
              <div class="bg-white/5 rounded-xl p-3 text-center">
                <i class="fas fa-map-marker-alt text-primary-400 mb-1 block text-sm"></i>
                <div class="text-xs font-medium leading-tight truncate">${job.work_location ? job.work_location.split('（')[0] : '要確認'}</div>
                <div class="text-xs text-gray-500 mt-0.5">勤務地</div>
              </div>
              <div class="bg-white/5 rounded-xl p-3 text-center">
                <i class="fas fa-calendar-alt text-primary-400 mb-1 block text-sm"></i>
                <div class="text-xs font-medium leading-tight">${job.min_hours_per_month ? job.min_hours_per_month+'h~/月' : '要相談'}</div>
                <div class="text-xs text-gray-500 mt-0.5">最低月間</div>
              </div>
            </div>
            <!-- モバイル：CTA -->
            <div class="mt-5 lg:hidden">
              ${ctaHTML}
            </div>
          </div>
        </div>
      </section>

      <!-- メインコンテンツ + サイドバー -->
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- 左：メインコンテンツ -->
          <main class="lg:col-span-2 space-y-6">

            <!-- §2 このインターンの魅力3点 -->
            ${attractionPoints.length > 0 ? `
            <section id="job-attraction" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-5 flex items-center gap-2">
                <i class="fas fa-gift text-primary-400"></i>このインターンの魅力
              </h2>
              <div class="space-y-4">
                ${attractionPoints.map((h, i) => `
                  <div class="bg-primary-500/5 border border-primary-500/15 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                      <span class="text-2xl flex-shrink-0">${h.icon || ['🚀','💡','🌟'][i] || '✨'}</span>
                      <div>
                        <h3 class="font-bold text-sm mb-1">${h.title || ''}</h3>
                        <p class="text-gray-400 text-sm leading-relaxed">${h.body || h.description || ''}</p>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>` : ''}

            <!-- §4 会社概要 / ミッション -->
            ${(job.company_description || job.company_mission) ? `
            <section id="job-company-about" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-building text-primary-400"></i>会社概要
              </h2>
              ${job.company_hero_image_url ? `<img src="${job.company_hero_image_url}" class="w-full h-40 object-cover rounded-xl mb-4" alt="${job.company_name}">` : ''}
              ${job.company_description ? `<p class="text-gray-300 text-sm leading-relaxed mb-3">${job.company_description}</p>` : ''}
              ${job.company_mission ? `
              <div class="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4 mt-3">
                <p class="text-xs text-primary-400 font-bold mb-1"><i class="fas fa-flag mr-1"></i>ミッション</p>
                <p class="text-gray-300 text-sm leading-relaxed">${job.company_mission}</p>
              </div>` : ''}
            </section>` : ''}

            <!-- §5 サービス / 事業内容 -->
            ${job.company_service_description ? `
            <section id="job-service" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-briefcase text-primary-400"></i>サービス / 事業内容
              </h2>
              <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.company_service_description}</p>
            </section>` : ''}

            <!-- §6 ポジションの特徴 -->
            ${job.position_features ? `
            <section id="job-position" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-star text-primary-400"></i>ポジションの特徴
              </h2>
              <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.position_features}</p>
            </section>` : ''}

            <!-- §7 業務概要 -->
            <section id="job-work" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-tasks text-primary-400"></i>業務概要
              </h2>
              <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.work_content}</p>
            </section>

            <!-- §8 入社後の流れ -->
            ${job.onboarding_flow ? `
            <section id="job-onboarding" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-route text-primary-400"></i>入社後の流れ
              </h2>
              <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.onboarding_flow}</p>
            </section>` : ''}

            <!-- §9 主な業務 / 案件例 -->
            ${job.task_examples ? `
            <section id="job-tasks" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-list-ul text-primary-400"></i>主な業務 / 案件例
              </h2>
              <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.task_examples}</p>
            </section>` : ''}

            <!-- §10 習得できるスキルセット -->
            ${(skillSet.length > 0 || job.growth_points) ? `
            <section id="job-skills" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-graduation-cap text-primary-400"></i>習得できるスキルセット
              </h2>
              ${skillSet.length > 0
                ? `<div class="flex flex-wrap gap-2">${skillSet.map(s => `<span class="bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs px-3 py-1.5 rounded-full font-medium">${typeof s === 'string' ? s : (s.name || s)}</span>`).join('')}</div>`
                : `<p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.growth_points}</p>`
              }
            </section>` : ''}

            <!-- §11 キャリアパス -->
            ${job.career_path ? `
            <section id="job-career" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-chart-line text-primary-400"></i>キャリアパス
              </h2>
              <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.career_path}</p>
            </section>` : ''}

            <!-- §12 こんな人におすすめ -->
            ${job.recommended_for ? `
            <section id="job-recommended" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-user-check text-primary-400"></i>こんな人におすすめ
              </h2>
              <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">${job.recommended_for}</p>
            </section>` : ''}

            <!-- §13 応募 / 相談 CTA（メインコンテンツ内） -->
            <section id="job-cta-main" class="glass rounded-2xl p-7 border border-primary-500/20">
              <h2 class="text-lg font-bold mb-2">応募 / 相談</h2>
              <p class="text-gray-400 text-sm mb-5">少しでも興味があれば、まずは気軽にご応募ください。</p>
              ${ctaHTML}
            </section>

            <!-- §14 採用情報 -->
            ${(job.requirements || job.preferred_requirements || job.selection_flow) ? `
            <section id="job-requirements" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-clipboard-list text-primary-400"></i>採用情報
              </h2>
              ${job.requirements ? `
              <div class="mb-4">
                <h3 class="text-sm font-bold text-gray-300 mb-2">求める人材</h3>
                <p class="text-gray-400 text-sm leading-relaxed whitespace-pre-line">${job.requirements}</p>
              </div>` : ''}
              ${job.preferred_requirements ? `
              <div class="mb-4 pt-4 border-t border-white/10">
                <h3 class="text-sm font-bold text-gray-300 mb-2">歓迎条件</h3>
                <p class="text-gray-400 text-sm leading-relaxed whitespace-pre-line">${job.preferred_requirements}</p>
              </div>` : ''}
              ${job.selection_flow ? `
              <div class="${(job.requirements || job.preferred_requirements) ? 'pt-4 border-t border-white/10' : ''}">
                <h3 class="text-sm font-bold text-gray-300 mb-2">選考フロー</h3>
                <p class="text-gray-400 text-sm">${job.selection_flow}</p>
              </div>` : ''}
            </section>` : ''}

            <!-- §15 会社情報 -->
            ${(job.office_location || job.office_access || job.company_website) ? `
            <section id="job-company-info" class="glass rounded-2xl p-7">
              <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-map-marker-alt text-primary-400"></i>会社情報
              </h2>
              <div class="space-y-3 text-sm">
                ${[
                  ['勤務地', job.work_location || job.office_location],
                  ['アクセス', job.office_access],
                  ['勤務形態', workStyleText],
                  ['勤務時間', job.work_hours],
                  ['勤務日数', job.work_days],
                  ['対象学年', job.target_grade],
                  ['月間最低時間', job.min_hours_per_month ? job.min_hours_per_month + 'h' : null],
                  ['Webサイト', job.company_website ? `<a href="${job.company_website}" target="_blank" rel="noopener" class="text-primary-400 hover:text-primary-300 underline">${job.company_website}</a>` : null],
                ].filter(([,v]) => v).map(([l,v]) => `
                  <div class="flex gap-3">
                    <span class="text-gray-500 w-24 flex-shrink-0 text-xs leading-relaxed pt-0.5">${l}</span>
                    <span class="text-gray-300 leading-relaxed text-sm">${v}</span>
                  </div>
                `).join('')}
                ${tags.length > 0 ? `
                <div class="flex gap-3 pt-3 border-t border-white/10">
                  <span class="text-gray-500 w-24 flex-shrink-0 text-xs pt-0.5">関連タグ</span>
                  <div class="flex flex-wrap gap-1.5">${tags.map(t=>`<span class="tag text-xs px-2 py-1 rounded-full">#${t}</span>`).join('')}</div>
                </div>` : ''}
              </div>
            </section>` : ''}

            <!-- §16 最終CTA -->
            <section id="job-cta-final" class="glass rounded-2xl p-7 text-center border border-primary-500/30 bg-gradient-to-br from-primary-900/20 to-purple-900/20">
              <h2 class="text-xl font-black mb-2">一緒に働きませんか？</h2>
              <p class="text-gray-400 text-sm mb-6">まずは気軽にご応募を。選考フローもシンプルです。</p>
              <div class="max-w-xs mx-auto">
                ${ctaHTML}
              </div>
            </section>

          </main>

          <!-- 右：サイドバー（PC のみ sticky CTA） -->
          <aside class="hidden lg:block space-y-4">
            <!-- §13 サイドバー sticky CTA -->
            <div class="glass rounded-2xl p-5 sticky top-20">
              <p class="text-xs text-gray-500 mb-3 font-medium">${job.company_name}</p>
              <p class="text-sm font-bold mb-4 leading-snug">${job.title}</p>
              ${ctaHTML}
            </div>
            <!-- §3 勤務条件詳細 -->
            <div class="glass rounded-2xl p-5">
              <h3 class="font-bold text-sm mb-4 flex items-center gap-2">
                <i class="fas fa-clipboard text-gray-400"></i>勤務条件
              </h3>
              <div class="space-y-2.5 text-xs">
                ${[
                  ['時給', wageText],
                  ['勤務時間', job.work_hours],
                  ['勤務日数', job.work_days],
                  ['勤務地', job.work_location],
                  ['勤務形態', workStyleText],
                  ['対象学年', job.target_grade],
                ].filter(([,v]) => v).map(([l,v]) => `
                  <div class="flex gap-2">
                    <span class="text-gray-500 w-16 flex-shrink-0">${l}</span>
                    <span class="text-gray-300 leading-relaxed">${v}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </aside>

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

      <!-- モバイル floating CTA -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-dark-900/90 backdrop-blur-sm border-t border-white/10">
        <button onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g,"\\'")}')" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-all">
          <i class="fas fa-paper-plane mr-2"></i>この求人に応募する
        </button>
      </div>

    </div>
  `;
}

// ==========================================
// 登録ページ
// ==========================================
async function initLoginPage() {
  await restoreStudentSession();
  const existingId = localStorage.getItem('student_id');
  const app = document.getElementById('app');

  if (existingId) {
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center py-12 px-4">
        <div class="w-full max-w-md text-center">
          <div class="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i class="fas fa-circle-check text-primary-400 text-2xl"></i>
          </div>
          <h1 class="text-2xl font-black mb-3">ログイン済みです</h1>
          <p class="text-gray-500 text-sm mb-6">マイページや会員限定求人を確認できます。</p>
          <div class="space-y-3">
            <a href="/mypage" class="block w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
              <i class="fas fa-user mr-1"></i>マイページへ
            </a>
            <a href="/jobs" class="block w-full glass text-gray-800 hover:text-primary-600 font-bold py-3 rounded-xl transition-colors">
              <i class="fas fa-search mr-1"></i>求人を探す
            </a>
            <button onclick="studentLogout()" class="text-xs text-gray-500 hover:text-red-400 transition-colors">
              ログアウト
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-right-to-bracket text-white text-xl"></i>
          </div>
          <h1 class="text-2xl font-black mb-2">学生ログイン</h1>
          <p class="text-gray-500 text-sm">登録済みのメールアドレスとパスワードでログインしてください。</p>
        </div>
        <div class="glass rounded-2xl p-8">
          <form id="login-form" onsubmit="submitStudentLogin(event)">
            <div class="mb-4">
              <label class="block text-xs text-gray-400 mb-1.5">メールアドレス <span class="text-red-400">*</span></label>
              <input id="login-email" type="email" required autocomplete="email" placeholder="example@univ.ac.jp">
            </div>
            <div class="mb-4">
              <label class="block text-xs text-gray-400 mb-1.5">パスワード <span class="text-red-400">*</span></label>
              <input id="login-password" type="password" required autocomplete="current-password" placeholder="パスワード">
            </div>
            <div id="login-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
            <button type="submit" id="login-btn" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
              <i class="fas fa-right-to-bracket mr-2"></i>ログイン
            </button>
          </form>
          <p class="text-center text-xs text-gray-500 mt-5">
            初めての方は <a href="/register" class="text-primary-400 hover:text-primary-300 font-bold">新規登録</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

async function submitStudentLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errDiv = document.getElementById('login-error');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>ログイン中...';
  errDiv.classList.add('hidden');

  try {
    const res = await API.post('/students/login', {
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    if (res.data.success) {
      storeStudentAuth(res.data.data);
      window.location.href = '/mypage';
    }
  } catch(e) {
    errDiv.textContent = e.response?.data?.error || 'ログインに失敗しました';
    errDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-right-to-bracket mr-2"></i>ログイン';
  }
}

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
          <p class="text-gray-500 text-sm">まず、どこでInternBaseを知りましたか？</p>
        </div>
        <!-- STEP 1: 流入媒体選択 -->
        <div class="glass rounded-2xl p-8 mb-4" id="source-media-step">
          <h3 class="font-bold mb-4 text-sm">どこで知りましたか？ <span class="text-red-400">*</span></h3>
          <div class="grid grid-cols-1 gap-2">
            ${SOURCE_MEDIA_OPTIONS.map(opt => `
              <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all" id="source-opt-${opt.value}">
                <input type="radio" name="source_media" value="${opt.value}" onchange="onSourceMediaChange('${opt.value}')"
                  class="accent-primary-500 w-4 h-4">
                <span class="text-sm text-gray-200">${opt.label}</span>
              </label>
            `).join('')}
          </div>
          <div id="source-media-error" class="hidden mt-3 text-xs text-red-400">流入媒体を選択してください</div>
        </div>
        <!-- STEP 2: 招待コード + 進むボタン -->
        <div class="glass rounded-2xl p-8" id="invite-code-step">
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2 text-gray-300">招待コード <span class="text-gray-500 text-xs font-normal">（任意）</span></label>
            <div class="flex gap-2">
              <input id="invite-code-input" type="text" placeholder="例: WELCOME2024" maxlength="20"
                class="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 uppercase text-sm tracking-wider">
              <button onclick="verifyInviteCode()" class="bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 text-primary-400 px-4 py-3 rounded-lg transition-colors text-sm">確認</button>
            </div>
            <div id="invite-code-msg" class="mt-1.5 text-xs"></div>
          </div>
          <button onclick="proceedToRegisterForm()" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
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

function onSourceMediaChange(value) {
  // ラジオボタン選択時のUI更新
  SOURCE_MEDIA_OPTIONS.forEach(opt => {
    const el = document.getElementById(`source-opt-${opt.value}`);
    if (!el) return;
    if (opt.value === value) {
      el.classList.add('border-primary-500', 'bg-primary-500/10');
    } else {
      el.classList.remove('border-primary-500', 'bg-primary-500/10');
    }
  });
}

function proceedToRegisterForm() {
  const selected = document.querySelector('input[name="source_media"]:checked');
  if (!selected) {
    document.getElementById('source-media-error')?.classList.remove('hidden');
    return;
  }
  document.getElementById('source-media-error')?.classList.add('hidden');
  showRegisterForm(selected.value);
}

function showRegisterForm(sourceMedia = 'other') {
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
            <input type="hidden" id="reg-source-media" value="${sourceMedia}">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><label class="block text-xs text-gray-400 mb-1.5">姓 <span class="text-red-400">*</span></label><input id="reg-last-name" type="text" required placeholder="山田" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
              <div><label class="block text-xs text-gray-400 mb-1.5">名 <span class="text-red-400">*</span></label><input id="reg-first-name" type="text" required placeholder="太郎" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            </div>
            <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">メールアドレス <span class="text-red-400">*</span></label><input id="reg-email" type="email" required placeholder="example@univ.ac.jp" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">大学名 <span class="text-red-400">*</span></label><input id="reg-university" type="text" required placeholder="○○大学" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><label class="block text-xs text-gray-400 mb-1.5">学部・学科 <span class="text-gray-500 font-normal">（任意）</span></label><input id="reg-faculty" type="text" placeholder="経済学部" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
              <div><label class="block text-xs text-gray-400 mb-1.5">学年 <span class="text-red-400">*</span></label><select id="reg-grade" required class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500"><option value="">選択</option><option value="1">1年生</option><option value="2">2年生</option><option value="3">3年生</option><option value="4">4年生</option></select></div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div><label class="block text-xs text-gray-400 mb-1.5">パスワード <span class="text-red-400">*</span></label><input id="reg-password" type="password" required minlength="8" autocomplete="new-password" placeholder="8文字以上" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
              <div><label class="block text-xs text-gray-400 mb-1.5">パスワード確認 <span class="text-red-400">*</span></label><input id="reg-password-confirm" type="password" required minlength="8" autocomplete="new-password" placeholder="もう一度入力" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
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

  const sourceMedia = document.getElementById('reg-source-media')?.value || 'other';
  const password = document.getElementById('reg-password').value;
  const passwordConfirm = document.getElementById('reg-password-confirm').value;
  if (password.length < 8 || password !== passwordConfirm) {
    errDiv.textContent = password.length < 8 ? 'パスワードは8文字以上で入力してください' : 'パスワードが一致しません';
    errDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>登録する';
    return;
  }

  const data = {
    last_name: document.getElementById('reg-last-name').value,
    first_name: document.getElementById('reg-first-name').value,
    email: document.getElementById('reg-email').value,
    university: document.getElementById('reg-university').value,
    faculty: document.getElementById('reg-faculty').value,
    grade: parseInt(document.getElementById('reg-grade').value),
    invite_code: document.getElementById('reg-invite-code').value,
    source_media: sourceMedia,
    password,
  };

  try {
    const res = await API.post('/students/register', data);
    if (res.data.success) {
      storeStudentAuth({
        id: res.data.data.id,
        name: data.last_name + data.first_name,
        my_invite_code: res.data.data.my_invite_code || ''
      });
      showRegisterSuccess(data, res.data.data.my_invite_code, sourceMedia);
    }
  } catch(e) {
    errDiv.textContent = e.response?.data?.error || '登録に失敗しました';
    errDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>登録する';
  }
}

async function showRegisterSuccess(data, myCode, sourceMedia) {
  const s = await getSiteSettings();
  // source_mediaに対応したLINE URLを取得
  const lineUrl = resolveLineUrl(s, sourceMedia);

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
          ${renderLineCta(lineUrl)}
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
      <!-- STEP 1: 流入媒体選択 -->
      <div class="glass rounded-2xl p-8 mb-4" id="con-source-step">
        <h3 class="font-bold mb-4 text-sm">どこでInternBaseを知りましたか？ <span class="text-red-400">*</span></h3>
        <div class="grid grid-cols-1 gap-2">
          ${SOURCE_MEDIA_OPTIONS.map(opt => `
            <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all" id="con-source-opt-${opt.value}">
              <input type="radio" name="con_source_media" value="${opt.value}" onchange="onConSourceMediaChange('${opt.value}')"
                class="accent-purple-500 w-4 h-4">
              <span class="text-sm text-gray-200">${opt.label}</span>
            </label>
          `).join('')}
        </div>
        <div id="con-source-error" class="hidden mt-3 text-xs text-red-400">流入媒体を選択してください</div>
        <button onclick="proceedToConsultationForm()" class="w-full mt-5 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition-colors">
          相談フォームへ進む
        </button>
      </div>
      <!-- STEP 2: 相談フォーム（初期非表示） -->
      <div class="glass rounded-2xl p-8 hidden" id="con-form-step">
        <form id="consultation-form" onsubmit="submitConsultation(event)">
          <input type="hidden" id="con-source-media" value="">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="col-span-2 sm:col-span-1"><label class="block text-xs text-gray-400 mb-1.5">お名前 <span class="text-red-400">*</span></label><input id="con-name" type="text" required placeholder="山田 太郎" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"></div>
            <div class="col-span-2 sm:col-span-1"><label class="block text-xs text-gray-400 mb-1.5">メールアドレス <span class="text-red-400">*</span></label><input id="con-email" type="email" required placeholder="example@univ.ac.jp" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"></div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><label class="block text-xs text-gray-400 mb-1.5">大学名</label><input id="con-university" type="text" placeholder="○○大学" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"></div>
            <div><label class="block text-xs text-gray-400 mb-1.5">学年</label><select id="con-grade" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-500"><option value="">選択</option><option value="1">1年生</option><option value="2">2年生</option><option value="3">3年生</option><option value="4">4年生</option></select></div>
          </div>
          <div class="mb-4">
            <label class="block text-xs text-gray-400 mb-1.5">お悩み・相談内容</label>
            <div class="grid grid-cols-2 gap-2 mb-3">
              ${['インターン選びで迷っている','就活との両立が不安','どんなスキルが身につくか知りたい','給与・条件について詳しく聞きたい','面接対策がしたい','その他'].map(c => `<label class="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10"><input type="checkbox" value="${c}" class="concern-check accent-purple-500"><span class="text-xs text-gray-300">${c}</span></label>`).join('')}
            </div>
          </div>
          <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">その他、気になることがあればご記入ください</label><textarea id="con-message" rows="4" placeholder="気になることを何でも" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"></textarea></div>
          <div class="mb-6"><label class="block text-xs text-gray-400 mb-1.5">ご希望の日時（任意）</label><input id="con-datetime" type="text" placeholder="平日の午後など" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"></div>
          <div id="consultation-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
          <button type="submit" class="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition-colors">
            <i class="fas fa-calendar-alt mr-2"></i>無料相談を申し込む
          </button>
        </form>
      </div>
    </div>
  `;
}

function onConSourceMediaChange(value) {
  SOURCE_MEDIA_OPTIONS.forEach(opt => {
    const el = document.getElementById(`con-source-opt-${opt.value}`);
    if (!el) return;
    if (opt.value === value) {
      el.classList.add('border-purple-500', 'bg-purple-500/10');
    } else {
      el.classList.remove('border-purple-500', 'bg-purple-500/10');
    }
  });
}

function proceedToConsultationForm() {
  const selected = document.querySelector('input[name="con_source_media"]:checked');
  if (!selected) {
    document.getElementById('con-source-error')?.classList.remove('hidden');
    return;
  }
  document.getElementById('con-source-error')?.classList.add('hidden');
  document.getElementById('con-source-media').value = selected.value;
  document.getElementById('con-source-step').classList.add('hidden');
  document.getElementById('con-form-step').classList.remove('hidden');
}

async function submitConsultation(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = '送信中...';
  const concerns = [...document.querySelectorAll('.concern-check:checked')].map(c => c.value);
  const sourceMedia = document.getElementById('con-source-media')?.value || 'other';
  try {
    const res = await API.post('/consultation', {
      name: document.getElementById('con-name').value,
      email: document.getElementById('con-email').value,
      university: document.getElementById('con-university').value,
      grade: parseInt(document.getElementById('con-grade').value) || null,
      concern: concerns.join('、'),
      message: document.getElementById('con-message').value,
      preferred_datetime: document.getElementById('con-datetime').value,
      source_media: sourceMedia,
    });
    if (res.data.success) {
      const s = await getSiteSettings();
      // source_mediaに対応したLINE URLを取得
      const lineUrl = resolveLineUrl(s, sourceMedia);
      document.getElementById('app').innerHTML = `
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="text-center max-w-md">
            <div class="w-20 h-20 bg-purple-500/20 border-2 border-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i class="fas fa-check text-purple-400 text-3xl"></i>
            </div>
            <h1 class="text-2xl font-black mb-3">お申し込みありがとうございます！</h1>
            <p class="text-gray-400 mb-8 text-sm">担当者より2営業日以内にご連絡いたします。<br>公式LINEを追加いただくとより迅速にご連絡できます。</p>
            <div class="space-y-3">
              ${renderLineCta(lineUrl)}
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
  await restoreStudentSession();
  const studentId = localStorage.getItem('student_id');
  const app = document.getElementById('app');

  if (!studentId) {
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class="text-center">
          <h1 class="text-xl font-bold mb-4">ログインが必要です</h1>
          <p class="text-gray-400 text-sm mb-6">マイページを見るには登録が必要です</p>
          <div class="flex justify-center gap-3">
            <a href="/login" class="bg-primary-500 text-white font-bold px-6 py-3 rounded-xl">ログイン</a>
            <a href="/register" class="glass text-gray-800 hover:text-primary-600 font-bold px-6 py-3 rounded-xl">新規登録</a>
          </div>
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
                  <p class="text-xs text-gray-700">${a.company_name}</p>
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

async function studentLogout() {
  try {
    await API.post('/students/logout');
  } catch(e) {}
  clearStudentAuth();
  window.location.href = '/';
}

// ==========================================
// 法務ページ
// ==========================================
function renderLegalPage(title, lead, sections) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-10">
        <p class="text-sm text-primary-600 font-semibold mb-2">InternBase</p>
        <h1 class="text-3xl sm:text-4xl font-black text-gray-900 mb-4">${title}</h1>
        <p class="text-gray-600 leading-relaxed">${lead}</p>
        <p class="text-xs text-gray-400 mt-4">最終更新日：2026年7月7日</p>
      </div>
      <div class="space-y-6">
        ${sections.map((section, index) => `
          <section class="glass rounded-2xl p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-3">${index + 1}. ${section.heading}</h2>
            <div class="space-y-3 text-sm leading-7 text-gray-700">
              ${section.body.map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </div>
  `;
}

function initPrivacyPage() {
  renderLegalPage(
    'プライバシーポリシー',
    'InternBaseは、長期インターン求人情報の提供、応募・相談対応、サービス改善のために必要な範囲で個人情報を取り扱います。',
    [
      {
        heading: '取得する情報',
        body: [
          '氏名、メールアドレス、電話番号、大学名、学年、希望職種、応募内容、相談内容、招待コード、流入媒体、サービス利用履歴などを取得する場合があります。',
          'Cookieやアクセス解析情報を利用し、表示改善、セキュリティ対策、不正利用防止、サービス改善に活用する場合があります。'
        ]
      },
      {
        heading: '利用目的',
        body: [
          '求人紹介、応募受付、企業との選考連絡、無料相談、本人確認、問い合わせ対応、サービス改善、重要なお知らせの配信のために利用します。',
          '個人を特定できない形に加工した統計情報を、掲載企業への説明やサービス改善に利用する場合があります。'
        ]
      },
      {
        heading: '第三者提供',
        body: [
          '応募または相談の目的達成に必要な範囲で、応募先企業または提携先に情報を提供する場合があります。',
          '法令に基づく場合を除き、本人の同意なく目的外の第三者提供は行いません。'
        ]
      },
      {
        heading: '安全管理',
        body: [
          '取得した情報について、漏えい、滅失、毀損、不正アクセスを防止するため、必要かつ適切な安全管理措置を講じます。',
          '管理画面やデータベースへのアクセス権限は、運用上必要な範囲に限定します。'
        ]
      },
      {
        heading: '開示・訂正・削除',
        body: [
          '本人から個人情報の開示、訂正、利用停止、削除等の申し出があった場合、法令に従って合理的な範囲で対応します。',
          'お問い合わせ先は、サービス内または運営者情報ページで案内する連絡先をご確認ください。'
        ]
      }
    ]
  );
}

function initTermsPage() {
  renderLegalPage(
    '利用規約',
    'この利用規約は、InternBaseが提供する長期インターン求人情報サービスの利用条件を定めるものです。',
    [
      {
        heading: 'サービス内容',
        body: [
          'InternBaseは、学生向けに長期インターン求人情報、応募導線、無料相談、関連情報を提供するサービスです。',
          '掲載情報の正確性には努めますが、求人条件、選考状況、募集終了時期などは変更される場合があります。'
        ]
      },
      {
        heading: '利用者の責任',
        body: [
          '利用者は、登録情報、応募情報、相談内容について、真実かつ正確な情報を提供するものとします。',
          '他人になりすます行為、虚偽情報の登録、サービス運営を妨げる行為、法令または公序良俗に反する行為を禁止します。'
        ]
      },
      {
        heading: '求人応募と選考',
        body: [
          '応募後の選考、面接、採否、雇用契約、勤務条件の最終決定は、応募先企業と利用者の間で行われます。',
          'InternBaseは、求人紹介や連絡補助を行う場合がありますが、採用や勤務条件を保証するものではありません。'
        ]
      },
      {
        heading: 'サービスの変更・停止',
        body: [
          'InternBaseは、必要に応じてサービス内容の変更、機能追加、一時停止、終了を行う場合があります。',
          '保守、障害、外部サービスの停止、その他やむを得ない事情により、事前告知なくサービスを停止することがあります。'
        ]
      },
      {
        heading: '免責',
        body: [
          'InternBaseの利用により生じた損害について、運営者に故意または重過失がある場合を除き、運営者は責任を負いません。',
          '利用者と掲載企業または第三者との間で生じたトラブルは、当事者間で解決するものとします。'
        ]
      }
    ]
  );
}

// ==========================================
// 応募モーダル
// ==========================================
let currentApplyContext = null;

function openApplyModal(jobId, jobTitle) {
  const studentId = localStorage.getItem('student_id');
  const studentName = localStorage.getItem('student_name');
  const modal = document.getElementById('apply-modal');
  const content = document.getElementById('apply-form-content');
  currentApplyContext = { jobId, jobTitle };

  if (!studentId) {
    content.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-user text-4xl text-gray-600 mb-4 block"></i>
        <p class="text-gray-300 mb-2">応募するにはログインが必要です</p>
        <p class="text-gray-500 text-sm mb-6">登録済みの方はログイン、初めての方は新規登録に進んでください。</p>
        <a href="/login" class="block w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors text-center mb-3">
          <i class="fas fa-right-to-bracket mr-1"></i>ログイン
        </a>
        <a href="/register" class="block w-full glass text-gray-800 hover:text-primary-600 font-bold py-3 rounded-xl transition-colors text-center">
          <i class="fas fa-user-plus mr-1"></i>新規登録
        </a>
      </div>`;
  } else {
    renderApplySourceStep(jobTitle);
  }
  modal.classList.remove('hidden');
}

function renderApplySourceStep(jobTitle) {
  document.getElementById('apply-form-content').innerHTML = `
    <div class="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
      <p class="text-xs text-gray-400">応募求人</p><p class="font-bold text-sm">${jobTitle}</p>
    </div>
    <p class="text-sm text-gray-400 mb-4">LINE連携のため、どの媒体から知ったか選択してください。</p>
    <div class="space-y-2 mb-4">
      ${SOURCE_MEDIA_OPTIONS.map(opt => `
        <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all" id="apply-source-opt-${opt.value}">
          <input type="radio" name="apply_source_media" value="${opt.value}" onchange="onApplicationSourceMediaChange('${opt.value}')"
            class="accent-primary-500 w-4 h-4">
          <span class="text-sm text-gray-200">${opt.label}</span>
        </label>
      `).join('')}
    </div>
    <div id="apply-source-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">流入媒体を選択してください</div>
    <button onclick="proceedToApplicationForm()" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors">
      応募内容の入力へ進む
    </button>
  `;
}

function onApplicationSourceMediaChange(value) {
  SOURCE_MEDIA_OPTIONS.forEach(opt => {
    const el = document.getElementById(`apply-source-opt-${opt.value}`);
    if (!el) return;
    if (opt.value === value) {
      el.classList.add('border-primary-500', 'bg-primary-500/10');
      el.classList.remove('border-white/10');
    } else {
      el.classList.remove('border-primary-500', 'bg-primary-500/10');
      el.classList.add('border-white/10');
    }
  });
  document.getElementById('apply-source-error')?.classList.add('hidden');
}

function proceedToApplicationForm() {
  const selected = document.querySelector('input[name="apply_source_media"]:checked');
  if (!selected) {
    document.getElementById('apply-source-error')?.classList.remove('hidden');
    return;
  }
  if (!currentApplyContext) return;
  renderApplicationForm(currentApplyContext.jobId, currentApplyContext.jobTitle, selected.value);
}

function renderApplicationForm(jobId, jobTitle, sourceMedia) {
  const studentName = localStorage.getItem('student_name');
  const sourceOption = SOURCE_MEDIA_OPTIONS.find(opt => opt.value === sourceMedia);
  document.getElementById('apply-form-content').innerHTML = `
      <div class="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
        <p class="text-xs text-gray-400">応募求人</p><p class="font-bold text-sm">${jobTitle}</p>
      </div>
      <p class="text-sm text-gray-400 mb-4">登録者: <span class="text-white">${studentName}</span></p>
      <p class="text-xs text-gray-500 mb-4">流入媒体: <span class="text-primary-300">${sourceOption?.label || 'その他'}</span></p>
      <form onsubmit="submitApplication(event, ${jobId})">
        <input type="hidden" id="apply-source-media" value="${sourceMedia}">
        <div class="mb-4"><label class="block text-xs text-gray-400 mb-1.5">応募動機 <span class="text-red-400">*</span></label><textarea id="apply-motivation" rows="4" required placeholder="なぜこの企業のインターンに応募したいですか？" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"></textarea></div>
        <div class="mb-6"><label class="block text-xs text-gray-400 mb-1.5">参加可能な時間帯</label><input id="apply-hours" type="text" placeholder="平日10-18時、週3日程度" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"></div>
        <div id="apply-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs"></div>
        <button type="submit" class="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl"><i class="fas fa-paper-plane mr-2"></i>応募を確定する</button>
        <p class="text-xs text-gray-600 text-center mt-3"><i class="fab fa-line mr-1 text-green-400"></i>応募後、公式LINEにてご連絡します</p>
      </form>`;
}

function closeApplyModal() {
  document.getElementById('apply-modal')?.classList.add('hidden');
  currentApplyContext = null;
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
      source_media: document.getElementById('apply-source-media')?.value || 'other',
    });
    if (res.data.success) {
      const s = await getSiteSettings();
      const sourceMedia = document.getElementById('apply-source-media')?.value || 'other';
      const lineUrl = resolveLineUrl(s, sourceMedia);
      document.getElementById('apply-form-content').innerHTML = `
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check text-green-400 text-2xl"></i>
          </div>
          <h3 class="font-bold mb-2">応募が完了しました！</h3>
          <p class="text-gray-500 text-sm mb-5">公式LINEにてご連絡しますので、追加をお待ちください。</p>
          ${renderLineCta(lineUrl, '公式LINEを追加する', 'flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-sm')}
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
    <a href="/jobs/${job.slug}" class="glass rounded-xl p-5 card-hover block cursor-pointer ${isMembersOnly ? 'border-yellow-400/40' : ''}">
      ${isMembersOnly ? `<div class="flex items-center gap-1 text-xs text-yellow-700 font-medium mb-2"><i class="fas fa-lock"></i> 会員限定</div>` : ''}
      <div class="flex items-start gap-3 mb-3">
        <div class="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          ${job.company_logo ? `<img src="${job.company_logo}" class="w-8 h-8 object-contain rounded">` : `<span class="text-primary-600 font-bold text-sm">${(job.company_name||'?')[0]}</span>`}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-600 truncate">${job.company_name || ''}</p>
          <h3 class="font-bold text-sm leading-tight text-gray-900">${job.title}</h3>
        </div>
      </div>
      ${job.catch_copy ? `<p class="text-xs text-gray-700 mb-3 line-clamp-2 leading-relaxed">${job.catch_copy}</p>` : ''}
      <div class="flex flex-wrap gap-1.5 mb-3">
        ${job.occupation ? `<span class="tag text-xs px-2 py-0.5 rounded-full"><i class="fas fa-briefcase mr-1"></i>${job.occupation}</span>` : ''}
        <span class="tag text-xs px-2 py-0.5 rounded-full">${job.company_industry || ''}</span>
        ${job.work_style ? `<span class="tag text-xs px-2 py-0.5 rounded-full"><i class="fas fa-${workStyleIcon[job.work_style]||'building'} mr-1"></i>${workStyleLabel[job.work_style]||''}</span>` : ''}
        ${job.remote_available ? '<span class="bg-green-50 border border-green-300 text-green-700 font-medium text-xs px-2 py-0.5 rounded-full">リモート可</span>' : ''}
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <span class="text-primary-600 font-bold text-sm">${wageText}</span>
        <span class="text-xs text-gray-600 font-medium">${job.applicant_count || 0}名応募</span>
      </div>
      ${tags.length > 0 ? `<div class="flex flex-wrap gap-1 mt-2">${tags.slice(0,3).map(t=>`<span class="text-xs text-gray-600 font-medium">#${t}</span>`).join('')}</div>` : ''}
    </a>
  `;
}

// ==========================================
// 大学一覧ページ (/universities)
// ==========================================
async function initUniversitiesPage() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-10">
        <h1 class="text-3xl font-black mb-2 text-gray-900">大学別おすすめ求人</h1>
        <p class="text-gray-500">あなたの大学に特化した厳選インターン</p>
      </div>
      <div class="glass rounded-xl p-4 mb-6">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input id="uni-search" type="text" placeholder="大学名で検索..." onkeydown="if(event.key==='Enter') filterUniversities()"
            class="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500">
        </div>
      </div>
      <div id="universities-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        ${[1,2,3,4,5].map(() => `<div class="glass rounded-xl p-5 animate-pulse h-28"></div>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('uni-search')?.addEventListener('input', filterUniversities);

  try {
    const res = await API.get('/homepage/university-tags');
    const universities = res.data.data || [];
    
    window.allUniversities = universities; // グローバルに保存
    displayUniversities(universities);
  } catch(e) {
    document.getElementById('universities-grid').innerHTML = '<p class="col-span-5 text-center text-gray-500 py-10">大学情報の読み込みに失敗しました</p>';
  }
}

function displayUniversities(universities) {
  const grid = document.getElementById('universities-grid');
  if (!grid) return;
  
  if (universities.length === 0) {
    grid.innerHTML = '<p class="col-span-5 text-center text-gray-500 py-10">該当する大学が見つかりません</p>';
    return;
  }
  
  grid.innerHTML = universities.map(uni => `
    <a href="/universities/${uni.slug}" class="glass rounded-xl p-5 text-center hover:bg-white/10 transition-all group">
      <div class="w-14 h-14 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-500/20 transition-colors">
        <i class="fas fa-university text-primary-400 text-xl"></i>
      </div>
      <p class="font-medium text-sm mb-1 group-hover:text-white transition-colors">${uni.name}</p>
      ${uni.description ? `<p class="text-xs text-gray-500 line-clamp-2">${uni.description}</p>` : ''}
    </a>
  `).join('');
}

function filterUniversities() {
  const query = document.getElementById('uni-search').value.trim().toLowerCase();
  if (!window.allUniversities) return;
  
  const filtered = window.allUniversities.filter(uni => 
    uni.name.toLowerCase().includes(query) || 
    uni.slug.toLowerCase().includes(query) ||
    (uni.description && uni.description.toLowerCase().includes(query))
  );
  
  displayUniversities(filtered);
}

// ==========================================
// 大学別求人一覧ページ (/universities/:slug)
// ==========================================
async function initUniversityJobsPage(slug) {
  const app = document.getElementById('app');
  const studentId = localStorage.getItem('student_id');
  
  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="mb-8">
        <a href="/universities" class="text-primary-400 hover:text-primary-300 text-sm mb-3 inline-block">
          <i class="fas fa-arrow-left mr-1"></i>大学一覧に戻る
        </a>
        <h1 id="uni-name" class="text-3xl font-black mb-2">読み込み中...</h1>
        <p id="uni-desc" class="text-gray-500"></p>
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
        <select id="filter-occupation" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
          ${renderOccupationOptions()}
        </select>
        <select id="filter-industry" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
          <option value="">全業種</option>
          <option>HR・人材</option><option>IT・SaaS</option><option>マーケティング</option>
          <option>コンサルティング</option><option>EC・小売</option><option>メディア</option><option>その他</option>
        </select>
        <select id="filter-style" class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary-500">
          <option value="">全勤務形態</option>
          <option value="onsite">出社</option><option value="remote">リモート</option><option value="hybrid">ハイブリッド</option>
        </select>
        <button onclick="searchUniversityJobs('${slug}')" class="bg-primary-500 hover:bg-primary-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
          <i class="fas fa-search mr-1"></i>検索
        </button>
      </div>
      
      <div id="jobs-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${[1,2,3].map(() => `<div class="glass rounded-xl p-5 animate-pulse h-48"></div>`).join('')}
      </div>
    </div>
  `;

  const searchInput = document.getElementById('search-q');
  searchInput?.addEventListener('input', () => {
    clearTimeout(window.__universityJobSearchTimer);
    window.__universityJobSearchTimer = setTimeout(() => searchUniversityJobs(slug), 250);
  });
  searchInput?.addEventListener('keydown', e => { if(e.key==='Enter') searchUniversityJobs(slug); });
  document.getElementById('filter-occupation')?.addEventListener('change', () => searchUniversityJobs(slug));
  document.getElementById('filter-industry')?.addEventListener('change', () => searchUniversityJobs(slug));
  document.getElementById('filter-style')?.addEventListener('change', () => searchUniversityJobs(slug));

  try {
    // 大学情報取得
    const uniRes = await API.get('/homepage/university-tags');
    const universities = uniRes.data.data || [];
    const uni = universities.find(u => u.slug === slug);
    
    if (!uni) {
      app.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p class="text-gray-500 mb-4">該当する大学が見つかりません</p>
          <a href="/universities" class="text-primary-400 hover:text-primary-300">大学一覧に戻る</a>
        </div>
      `;
      return;
    }
    
    document.getElementById('uni-name').textContent = uni.name + ' のおすすめ求人';
    if (uni.description) {
      document.getElementById('uni-desc').textContent = uni.description;
    }
    
    // 大学別求人取得
    const jobsRes = await API.get(`/homepage/universities/${slug}/jobs${studentId ? '?student_id='+studentId : ''}`);
    const jobs = jobsRes.data.data || [];
    
    const list = document.getElementById('jobs-list');
    if (jobs.length === 0) {
      list.innerHTML = '<p class="col-span-3 text-center text-gray-500 py-10">まだこの大学向けの求人はありません</p>';
    } else {
      list.innerHTML = jobs.map(job => renderJobCard(job)).join('');
    }
    
    window.currentUniversitySlug = slug;
    window.currentUniversityJobs = jobs;
  } catch(e) {
    console.error(e);
    document.getElementById('jobs-list').innerHTML = '<p class="col-span-3 text-center text-red-400 py-10">求人情報の読み込みに失敗しました</p>';
  }
}

function getSearchableJobText(job) {
  let tags = [];
  try { tags = JSON.parse(job.tags || '[]'); } catch(e) {}
  const workStyleLabel = { onsite: '出社', remote: 'リモート', hybrid: 'ハイブリッド' };
  return [
    job.title, job.slug, job.catch_copy, job.description, job.work_content,
    job.occupation, job.company_name, job.company_industry, job.work_style, workStyleLabel[job.work_style],
    job.work_hours, job.work_days, job.work_location, job.target_grade, job.university_level,
    job.requirements, job.preferred_requirements, job.selection_flow, job.recommended_for,
    ...tags
  ].filter(Boolean).join(' ').toLowerCase();
}

function searchUniversityJobs(slug) {
  const q = document.getElementById('search-q').value.trim().toLowerCase();
  const occupation = document.getElementById('filter-occupation').value;
  const industry = document.getElementById('filter-industry').value;
  const style = document.getElementById('filter-style').value;
  
  if (!window.currentUniversityJobs) return;
  
  let filtered = window.currentUniversityJobs.filter(job => {
    const matchQ = !q || getSearchableJobText(job).includes(q);
    const matchOccupation = !occupation || job.occupation === occupation;
    const matchIndustry = !industry || job.company_industry === industry;
    const matchStyle = !style || job.work_style === style;
    return matchQ && matchOccupation && matchIndustry && matchStyle;
  });
  
  const list = document.getElementById('jobs-list');
  if (filtered.length === 0) {
    list.innerHTML = '<p class="col-span-3 text-center text-gray-500 py-10">条件に合う求人が見つかりません</p>';
  } else {
    list.innerHTML = filtered.map(job => renderJobCard(job)).join('');
  }
}
