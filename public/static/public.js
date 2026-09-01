// ==========================================
// ã‚¬ã‚¯ãƒã‚«ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ³ - å…¬é–‹ç”»é¢ JavaScript
// ==========================================

const API = axios.create({ baseURL: '/api' });

const JOB_OCCUPATION_OPTIONS = ['å–¶æ¥­', 'ãƒãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°', 'ã‚³ãƒ³ã‚µãƒ«ãƒ†ã‚£ãƒ³ã‚°', 'äº‹å‹™', 'ã‚¨ãƒ³ã‚¸ãƒ‹ã‚¢', 'äººäº‹', 'äº‹æ¥­é–‹ç™º', 'ãã®ä»–'];

function renderOccupationOptions(selected = '') {
  return `<option value="">å…¨è·ç¨®</option>` + JOB_OCCUPATION_OPTIONS.map(o =>
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
    // Cookie sessionãŒç„¡ã„å ´åˆã¯æ—¢å­˜localStorageã®äº’æ›å‹•ä½œã‚’æ®‹ã™ã€‚
  }
  return localStorage.getItem('student_id');
}

// ==========================================
// æµå…¥åª’ä½“ã‚ªãƒ—ã‚·ãƒ§ãƒ³ï¼ˆSOURCE_MEDIA_OPTIONSï¼‰
// ==========================================
const SOURCE_MEDIA_OPTIONS = [
  { value: 'sunconnect',  label: 'SUNCONNECT',        line_key: 'line_url_sunconnect' },
  { value: 'valueup',     label: 'ãƒãƒªãƒ¥ãƒ¼ã‚¢ãƒƒãƒ—',       line_key: 'line_url_valueup' },
  { value: 'genki_intern', label: 'å…ƒæ°—ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ³',       line_key: 'line_url_genki_intern', fallback_to_default: false },
  { value: 'sokei_intern_compass', label: 'æ—©æ…¶ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ³ã‚³ãƒ³ãƒ‘ã‚¹', line_key: 'line_url_sokei_intern_compass', fallback_to_default: false },
  { value: 'careersourcing', label: 'CareerSourcing',  line_key: 'line_url_careersourcing', fallback_to_default: false },
  { value: 'other',       label: 'ãã®ä»–',             line_key: 'line_url_default' },
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

function renderLineCta(lineUrl, label = 'å…¬å¼LINEã‚’å‹ã ã¡è¿½åŠ ', className = 'flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors') {
  if (!lineUrl) {
    return `
      <div class="flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 text-gray-500 font-bold py-3 px-8 rounded-xl text-sm">
        <i class="fab fa-line text-lg"></i>LINE URLæœªè¨­å®š
      </div>
    `;
  }
  return `
    <a href="${lineUrl}" target="_blank" rel="noopener" class="${className}">
      <i class="fab fa-line text-xl"></i>${label}
    </a>
  `;
}

// ã‚µã‚¤ãƒˆè¨­å®šã‚­ãƒ£ãƒƒã‚·ãƒ¥
let _siteSettings = null;
let _siteSettingsPromise = null;

const DEFAULT_SITE_NAME = 'ã‚¬ã‚¯ãƒã‚«ã‚¤ãƒ³ã‚¿ãƒ¼ãƒ³';

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
    asSettingText(settings.hero_title_line1) || 'åœ§å€’çš„ãª',
    asSettingText(settings.hero_title_line2) || 'å®Ÿå‹™çµŒé¨“ã‚’ã€',
    asSettingText(settings.hero_title_line3) || 'ä»Šã™ãå§‹ã‚ã‚ˆã†ã€‚'
  ];
}

function getConfiguredDescription(settings = {}) {
  return asSettingText(settings.site_description) ||
    asSettingText(settings.hero_subtitle) ||
    'å³é¸ã•ã‚ŒãŸé•·æœŸã‚¤ãƒ³ã‚¿ãƒ¼ãƒ³æ±‚äººã€‚ã‚ãªãŸã®ã‚­ãƒ£ãƒªã‚¢ã‚’ã“ã“ã‹ã‚‰å§‹ã‚ã‚ˆã†ï¼';
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
    .from-primary-500 { --tw-gradient-from: rgb(var(--site-primary)) var(--tw-gradient-from-position) !important; }
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

async function getPublicOperatorInfo() {
  try {
    const res = await API.get(`/settings/public-info?ts=${Date.now()}`);
    return res.data.data || {};
  } catch(e) {
    return {};
  }
}

getSiteSettings().catch(() => {});

// ==========================================
// ãƒ›ãƒ¼ãƒ ãƒšãƒ¼ã‚¸ (LP)
// ==========================================
async function initHomePage() {
  const app = document.getElementById('app');
  await restoreStudentSession();

  // ã‚µã‚¤ãƒˆè¨­å®šãƒ»ãŠçŸ¥ã‚‰ã›ãƒ»FAQãƒ»å†…å®šè€…ã‚¿ã‚¤ãƒ ãƒ©ã‚¤ãƒ³ãƒ»ãƒ”ãƒƒã‚¯ã‚¢ãƒƒãƒ—æ±‚äººãƒ»å¤§å­¦ã‚¿ã‚°ã‚’ä¸¦åˆ—å–å¾—
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
  const successStoryCards = successStories.map(story => `
    <article class="timeline-card glass rounded-2xl p-5 flex-shrink-0 w-[min(82vw,22rem)]" role="listitem">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 bg-primary-500/15 rounded-full flex items-center justify-center flex-shrink-0">
          <i class="fas fa-user-graduate text-primary-600" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-gray-900 truncate">${escapeHtml(story.university)} ${escapeHtml(story.student_name)}</p>
          <p class="text-xs text-gray-700 truncate">${escapeHtml(story.company_name)} å†…å®š</p>
        </div>
      </div>
      <p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(story.comment)}</p>
    </article>
  `).join('');
  const siteName = getConfiguredSiteName(s);
  const heroTitleLines = getHeroTitleLines(s);
  const heroDescription = getConfiguredDescription(s);
  const heroDisplayLines = heroTitleLines.length === 1 && heroTitleLines[0].includes('ã€')
    ? [
        heroTitleLines[0].slice(0, heroTitleLines[0].indexOf('ã€') + 1),
        heroTitleLines[0].slice(heroTitleLines[0].indexOf('ã€') + 1)
      ].filter(Boolean)
    : heroTitleLines;
  const heroTitleHtml = heroDisplayLines.map((line, index) =>
    `<span class="hero-title-line"><span class="${index === heroDisplayLines.length - 1 ? 'hero-title-accent' : 'text-slate-950'}">${escapeHtml(line)}</span></span>`
  ).join('');
  const heroPrimaryCta = asSettingText(s.hero_cta1_text) === 'æ±‚äººã‚’æ¢ã™'
    ? 'æ±‚äººã‚’è¦‹ã‚‹'
    : asSettingText(s.hero_cta1_text) || 'æ±‚äººã‚’è¦‹ã‚‹';
  const heroSecondaryCta = asSettingText(s.hero_cta2_text) === 'æ‹›å¾…ã‚³ãƒ¼ãƒ‰ã§ç™»éŒ²'
    ? 'LINEã§ç„¡æ–™ç›¸è«‡'
    : asSettingText(s.hero_cta2_text) || 'LINEã§ç„¡æ–™ç›¸è«‡';

  const typeColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    campaign: 'bg-purple-50 border-purple-200 text-purple-700'
  };
  const typeIcons = { info: 'info-circle', warning: 'exclamation-triangle', success: 'check-circle', campaign: 'gift' };

  app.innerHTML = `
    <!-- ãŠçŸ¥ã‚‰ã›ãƒãƒŠãƒ¼ -->
    ${announcements.length > 0 ? `
    <div class="bg-gray-50 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-1.5">
        ${announcements.map(a => `
          <div class="flex items-center gap-3 text-sm ${(typeColors[a.type]||typeColors.info)} border rounded-lg px-4 py-2">
            <i class="fas fa-${typeIcons[a.type]||'info-circle'} flex-shrink-0"></i>
            <span class="font-ß~{æÚ$z{-®éÜj×~8î88î8~8‹ûŞXª8).8®[è^88ş88^8N8#Â÷àĞ¢G·&VæFW$Æ–æT7F†Æ–æUW&ÂÂ~XZÎ[ÈôÄ”ä^8).‹ûŞXª88(²rÂvfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"vÓ"&rÖw&VVâÓS†÷fW#¦&rÖw&VVâÓcFW‡B×v†—FRföçBÖ&öÆB’Ó2‚Ób&÷VæFVB×†ÂFW‡B×6Òr—ĞĞ¢ÂöF—cæ°Ğ¢ĞĞ¢Ò6F6‚†R’°Ğ¢6öç7BW'$F—bÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vÇ’ÖW'&÷"r“°Ğ¢W'$F—bçFW‡D6öçFVçBÒRç&W7öç6SòæFFòæW'&÷"ÇÂ~[ùÎX¹ş8¾ZKiY~8~8î8~8òs°Ğ¢W'$F—bæ6Æ74Æ—7Bç&VÖ÷fR‚v†–FFVâr“°Ğ¢'FâæF—6&ÆVBÒfÇ6S°Ğ¢'Fâæ–ææW$…DÔÂÒsÆ’6Æ73Ò&f2f×W"×ÆæR×"Ó"#ãÂö“î[ùÎX¹ş8).z+®Zé®88(²s°Ğ¢ĞĞ§ĞĞ Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¢òòX[˜	®8+>8;>89Ş8;Î88Ş8;>88€Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¦gVæ7F–öâ&VæFW$¦ö$6&B†¦ö"Â—4ÖVÖ&W'5F"ÒfÇ6R’°¢ÆWBFw2ÒµÓ°Ğ¢G'’²Fw2Ò¥4ôâç'6R†¦ö"çFw2ÇÂuµÒr“²Ò6F6‚†R’·ĞĞ¢6öç7BvvUFW‡BÒ¦ö"æ†÷W&Ç•÷vvUöÖ–àĞ¢ò*RG¶¦ö"æ†÷W&Ç•÷vvUöÖ–âçFôÆö6ÆU7G&–ær‚—ÒG¶¦ö"æ†÷W&Ç•÷vvUöÖ‚ò~8	Ì*Rr¶¦ö"æ†÷W&Ç•÷vvUöÖ‚çFôÆö6ÆU7G&–ær‚’¢~8	ÂwÒö† Ğ¢¢~[ùÎy»Š¸rs°Ğ¢6öç7Bv÷&µ7G–ÆTÆ&VÂÒ²öç6—FS¢~X{®zKârÂ&VÖ÷FS¢~8:®8:.8;Î88‚rÂ‡–'&–C¢~88ş8*N89n8:®88>88’rÓ°Ğ¢6öç7Bv÷&µ7G–ÆT–6öâÒ²öç6—FS¢v'V–ÆF–ærrÂ&VÖ÷FS¢vÆF÷Ö†÷W6RrÂ‡–'&–C¢w&æFöÒrÓ°¢6öç7B—4ÖVÖ&W'4öæÇ’Ò¦ö"çf—6–&–Æ—G’ÓÓÒvÖVÖ&W'2s°¢6öç7B6&D–ÖvRÒ¦ö"æ6&Eö–ÖvU÷W&ÂÇÂ¦ö"æ†W&õö–ÖvU÷W&ÂÇÂ¦ö"æ6ö×ç•ö†W&õö–ÖvU÷W&Ã°¢6öç7BÆö6F–öåFW‡BÒ¦ö"çv÷&µöÆö6F–öâò¦ö"çv÷&µöÆö6F–öâç7Æ—B‚~ûÈ‚r•³Ò¢rs° ¢&WGW&â ¢Æ‡&VcÒ"ö¦ö'2òG¶¦ö"ç6ÇVwÒ"6Æ73Ò&&r×v†—FR&÷&FW"&÷&FW"×6ÆFRÓ#&÷VæFVBÓ'†Â6&BÖ†÷fW"&Æö6²7W'6÷"×ö–çFW"÷fW&fÆ÷rÖ†–FFVâG¶—4ÖVÖ&W'4öæÇ’òv&÷&FW"×–VÆÆ÷rÓCócr¢rwÒ#à¢ÆF—b6Æ73Ò&¦ö"Ö6&BÖÖVF–&VÆF—fR#à¢G¶6&D–ÖvP¢òÆ–Ör7&3Ò"G¶6&D–ÖvWÒ"6Æ73Ò'rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6÷fW"G&ç6—F–öâ×G&ç6f÷&ÒGW&F–öâÓS†÷fW#§66ÆRÓR"ÇCÒ"#æ ¢¢ÆF—b6Æ73Ò'rÖgVÆÂ‚ÖgVÆÂfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"FW‡B×&–Ö'’Ó3#ãÆ’6Æ73Ò&f2fÖ6—G’FW‡BÓW†Â#ãÂö“ãÂöF—cæĞ¢G¶—4ÖVÖ&W'4öæÇ’òÇ7â6Æ73Ò&'6öÇWFRF÷Ó2ÆVgBÓ2&r×6ÆFRÓ“SóƒRFW‡B×v†—FR&÷VæFVBÖgVÆÂ‚Ó2’ÓãRFW‡BÕ³…ÒföçBÖ&öÆB&6¶G&÷Ö&ÇW"#ãÆ’6Æ73Ò&f2fÖÆö6²×"Ó#ãÂö“îKÉ®Y:™™Zé£Â÷7ãæ¢rwĞ¢G¶¦ö"çv÷&µ÷7G–ÆRòÇ7â6Æ73Ò&'6öÇWFRF÷Ó2&–v‡BÓ2&r×v†—FRó“RFW‡B×6ÆFRÓƒ&÷VæFVBÖgVÆÂ‚Ó2’ÓãRFW‡BÕ³…ÒföçBÖ&öÆB6†F÷r×6Ò#ãÆ’6Æ73Ò&f2fÒG·v÷&µ7G–ÆT–6öå¶¦ö"çv÷&µ÷7G–ÆU×ÇÂv'V–ÆF–ærwÒFW‡B×&–Ö'’ÓS×"Ó#ãÂö“âG·v÷&µ7G–ÆTÆ&VÅ¶¦ö"çv÷&µ÷7G–ÆU×ÇÂrwÓÂ÷7ãæ¢rwĞ¢ÂöF—cà¢ÆF—b6Æ73Ò'ÓR#à¢ÆF—b6Æ73Ò&fÆW‚—FV×2×7F'BvÓ2Ö"ÓB#à¢ÆF—b6Æ73Ò'rÓ‚Ó&r×v†—FR&÷&FW"&÷&FW"×6ÆFRÓ#&÷VæFVB×†ÂfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"fÆW‚×6‡&–æ²Ó6†F÷r×6Ò#à¢G¶¦ö"æ6ö×ç•öÆövòòÆ–Ör7&3Ò"G¶¦ö"æ6ö×ç•öÆöv÷Ò"6Æ73Ò'rÓ’‚Ó’ö&¦V7BÖ6öçF–â&÷VæFVB"ÇCÒ"#æ¢Ç7â6Æ73Ò'FW‡B×&–Ö'’ÓcföçBÖ&Æ6²FW‡B×6Ò#âG²†¦ö"æ6ö×ç•öæÖWÇÂsòr•³×ÓÂ÷7ãæĞ¢ÂöF—cà¢ÆF—b6Æ73Ò&fÆW‚ÓÖ–â×rÓ#à¢Ç6Æ73Ò'FW‡B×‡2FW‡B×6ÆFRÓSG'Væ6FRÖ"Ó#âG¶¦ö"æ6ö×ç•öæÖRÇÂrwÓÂ÷à¢Æƒ26Æ73Ò&föçBÖ&Æ6²FW‡BÖ&6RÆVF–ær×6çVrFW‡B×6ÆFRÓ“SÆ–æRÖ6Æ×Ó"#âG¶¦ö"çF—FÆWÓÂöƒ3à¢ÂöF—cà¢ÂöF—cà¢G¶¦ö"æ6F6…ö6÷’òÇ6Æ73Ò'FW‡B×‡2FW‡B×6ÆFRÓcÖ"ÓBÆ–æRÖ6Æ×Ó"ÆVF–ær×&VÆ†VB#âG¶¦ö"æ6F6…ö6÷—ÓÂ÷æ¢rwĞ¢ÆF—b6Æ73Ò&w&–Bw&–BÖ6öÇ2Ó"vÓ"Ö"ÓBFW‡B×‡2#à¢ÆF—b6Æ73Ò'&÷VæFVBÖÆr&r×6ÆFRÓSÓ"ãRFW‡B×6ÆFRÓs#ãÆ’6Æ73Ò&f2fÖ6ÆVæF"ÖF—2FW‡B×&–Ö'’ÓS×"ÓãR#ãÂö“âG¶¦ö"çv÷&µöF—2ÇÂ~XºNX¹iz^i[8şŠ›>{K8‚wÓÂöF—cà¢ÆF—b6Æ73Ò'&÷VæFVBÖÆr&r×6ÆFRÓSÓ"ãRFW‡B×6ÆFRÓsG'Væ6FR#ãÆ’6Æ73Ò&f2fÖÆö6F–öâÖF÷BFW‡B×&–Ö'’ÓS×"ÓãR#ãÂö“âG¶Æö6F–öåFW‡BÇÂ†¦ö"ç&VÖ÷FUöf–Æ&ÆRò~8:®8:.8;Î88Xúòr¢~XºNX¹YË8şŠ›>{K8‚r—ÓÂöF—cà¢ÂöF—cà¢ÆF—b6Æ73Ò&fÆW‚fÆW‚×w&vÓãRÖ"ÓB#à¢G¶¦ö"æö67WF–öâòÇ7â6Æ73Ò'FrFW‡BÕ³…Ò‚Ó"ãR’Ó&÷VæFVBÖgVÆÂ#âG¶¦ö"æö67WF–öçÓÂ÷7ãæ¢rwĞ¢G¶¦ö"æ6ö×ç•ö–æGW7G'’òÇ7â6Æ73Ò'FrFW‡BÕ³…Ò‚Ó"ãR’Ó&÷VæFVBÖgVÆÂ#âG¶¦ö"æ6ö×ç•ö–æGW7G'—ÓÂ÷7ãæ¢rwĞ¢G¶¦ö"ç&VÖ÷FUöf–Æ&ÆRòsÇ7â6Æ73Ò&&rÖw&VVâÓS&÷&FW"&÷&FW"Öw&VVâÓ#FW‡BÖw&VVâÓsföçBÖ&öÆBFW‡BÕ³…Ò‚Ó"ãR’Ó&÷VæFVBÖgVÆÂ#î8:®8:.8;Î88XúóÂ÷7ãâr¢rwĞ¢ÂöF—cà¢ÆF—b6Æ73Ò&fÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâBÓB&÷&FW"×B&÷&FW"×6ÆFRÓ#à¢Ç7â6Æ73Ò'FW‡B×&–Ö'’ÓcföçBÖ&Æ6²FW‡BÖ&6R#âG·vvUFW‡GÓÂ÷7ãà¢Ç7â6Æ73Ò'FW‡B×‡2FW‡B×6ÆFRÓsföçBÖ&öÆB#îŠ›>{K8).Šh¾8(²Æ’6Æ73Ò&f2fÖ'&÷r×&–v‡BÖÂÓFW‡B×&–Ö'’ÓS#ãÂö“ãÂ÷7ãà¢ÂöF—cà¢G·Fw2æÆVæwF‚âòÆF—b6Æ73Ò&fÆW‚fÆW‚×w&vÓ×BÓ2#âG·Fw2ç6Æ–6RƒÃ2’æÖ‡CÓæÇ7â6Æ73Ò'FW‡BÕ³…ÒFW‡B×6ÆFRÓSföçBÖÖVF—VÒ#â2G·GÓÂ÷7ãæ’æ¦ö–â‚rr—ÓÂöF—cæ¢rwĞ¢ÂöF—cà¢Âöà¢°§Ğ Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¢òòZJ~ZÚnKˆŠj~89®8;Î8+‚‚÷Væ—fW'6—F–W2Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¦7–æ2gVæ7F–öâ–æ—EVæ—fW'6—F–W5vR‚’°Ğ¢6öç7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vr“°Ğ¢ Ğ¢æ–ææW$…DÔÂÒ Ğ¢ÆF—b6Æ73Ò&Ö‚×rÓw†Â×‚ÖWFò‚ÓB6Ó§‚ÓbÆs§‚Ó‚’Ó"#àĞ¢ÆF—b6Æ73Ò&Ö"Ó#àĞ¢Æƒ6Æ73Ò'FW‡BÓ7†ÂföçBÖ&Æ6²Ö"Ó"FW‡BÖw&’Ó“#îZJ~ZÚnXŠ^8®888(k.K«£ÂöƒàĞ¢Ç6Æ73Ò'FW‡BÖw&’ÓS#î8.8®8ş8îZJ~ZÚn8¾x›XÉn8~8şXë>˜8*N8;>8+ş8;Î8;3Â÷àĞ¢ÂöF—càĞ¢ÆF—b6Æ73Ò&vÆ72&÷VæFVB×†ÂÓBÖ"Ób#àĞ¢ÆF—b6Æ73Ò'&VÆF—fR#àĞ¢Æ’6Æ73Ò&f2f×6V&6‚'6öÇWFRÆVgBÓ2F÷Óó"×G&ç6ÆFR×’Óó"FW‡BÖw&’ÓS#ãÂö“àĞ¢Æ–çWB–CÒ'Væ’×6V&6‚"G—SÒ'FW‡B"Æ6V†öÆFW#Ò.ZJ~ZÚnYŞ8~jIÎ{J"âââ"öæ¶W–F÷vãÒ&–b†WfVçBæ¶W“ÓÓÒtVçFW"r’f–ÇFW%Væ—fW'6—F–W2‚’ Ğ¢6Æ73Ò'rÖgVÆÂ&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆrÂÓ’"ÓB’Ó"ãRFW‡B×6ÒFW‡B×v†—FRÆ6V†öÆFW"Öw&’ÓSfö7W3¦÷WFÆ–æRÖæöæRfö7W3¦&÷&FW"×&–Ö'’ÓS#àĞ¢ÂöF—càĞ¢ÂöF—càĞ¢ÆF—b–CÒ'Væ—fW'6—F–W2Öw&–B"6Æ73Ò&w&–Bw&–BÖ6öÇ2Ó"6Ó¦w&–BÖ6öÇ2Ó2ÖC¦w&–BÖ6öÇ2ÓBÆs¦w&–BÖ6öÇ2ÓRvÓB#àĞ¢Gµ³Ã"Ã2ÃBÃUÒæÖ‚‚’ÓâÆF—b6Æ73Ò&vÆ72&÷VæFVB×†ÂÓRæ–ÖFR×VÇ6R‚Ó#‚#ãÂöF—cæ’æ¦ö–â‚rr—ĞĞ¢ÂöF—càĞ¢ÂöF—càĞ¢°Ğ Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚wVæ’×6V&6‚r“òæFDWfVçDÆ—7FVæW"‚v–çWBrÂf–ÇFW%Væ—fW'6—F–W2“°Ğ Ğ¢G'’°Ğ¢6öç7B&W2Òv—B’ævWB‚rö†öÖWvR÷Væ—fW'6—G’×Fw2r“°Ğ¢6öç7BVæ—fW'6—F–W2Ò&W2æFFæFFÇÂµÓ°Ğ¢ Ğ¢v–æF÷ræÆÅVæ—fW'6—F–W2ÒVæ—fW'6—F–W3²òò8+8:Ş8;Î898:¾8¾KùŞZÙ€Ğ¢F—7Æ•Væ—fW'6—F–W2‡Væ—fW'6—F–W2“°Ğ¢Ò6F6‚†R’°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚wVæ—fW'6—F–W2Öw&–Br’æ–ææW$…DÔÂÒsÇ6Æ73Ò&6öÂ×7âÓRFW‡BÖ6VçFW"FW‡BÖw&’ÓS’Ó#îZJ~ZÚnh8^Z8îŠªŞ8ş‹ëÎ8ş8¾ZKiY~8~8î8~8óÂ÷âs°Ğ¢ĞĞ§ĞĞ Ğ¦gVæ7F–öâF—7Æ•Væ—fW'6—F–W2‡Væ—fW'6—F–W2’°Ğ¢6öç7Bw&–BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚wVæ—fW'6—F–W2Öw&–Br“°Ğ¢–b‚w&–B’&WGW&ã°Ğ¢ Ğ¢–b‡Væ—fW'6—F–W2æÆVæwF‚ÓÓÒ’°Ğ¢w&–Bæ–ææW$…DÔÂÒsÇ6Æ73Ò&6öÂ×7âÓRFW‡BÖ6VçFW"FW‡BÖw&’ÓS’Ó#îŠ›.[Ù>88(¾ZJ~ZÚn8ÎŠh¾8N8¾8(®8î8¾8)3Â÷âs°Ğ¢&WGW&ã°Ğ¢ĞĞ¢ Ğ¢w&–Bæ–ææW$…DÔÂÒVæ—fW'6—F–W2æÖ‡Væ’Óâ Ğ¢Æ‡&VcÒ"÷Væ—fW'6—F–W2òG·Væ’ç6ÇVwÒ"6Æ73Ò&vÆ72&÷VæFVB×†ÂÓRFW‡BÖ6VçFW"†÷fW#¦&r×v†—FRóG&ç6—F–öâÖÆÂw&÷W#àĞ¢ÆF—b6Æ73Ò'rÓB‚ÓB&r×&–Ö'’ÓSó&÷VæFVBÖgVÆÂfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"×‚ÖWFòÖ"Ó2w&÷WÖ†÷fW#¦&r×&–Ö'’ÓSó#G&ç6—F–öâÖ6öÆ÷'2#àĞ¢Æ’6Æ73Ò&f2f×Væ—fW'6—G’FW‡B×&–Ö'’ÓCFW‡B×†Â#ãÂö“àĞ¢ÂöF—càĞ¢Ç6Æ73Ò&föçBÖÖVF—VÒFW‡B×6ÒÖ"Ów&÷WÖ†÷fW#§FW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2#âG·Væ’ææÖWÓÂ÷àĞ¢G·Væ’æFW67&—F–öâòÇ6Æ73Ò'FW‡B×‡2FW‡BÖw&’ÓSÆ–æRÖ6Æ×Ó"#âG·Væ’æFW67&—F–öçÓÂ÷æ¢rwĞĞ¢ÂöàĞ¢’æ¦ö–â‚rr“°Ğ§ĞĞ Ğ¦gVæ7F–öâf–ÇFW%Væ—fW'6—F–W2‚’°Ğ¢6öç7BVW'’ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚wVæ’×6V&6‚r’çfÇVRçG&–Ò‚’çFôÆ÷vW$66R‚“°Ğ¢–b‚v–æF÷ræÆÅVæ—fW'6—F–W2’&WGW&ã°Ğ¢ Ğ¢6öç7Bf–ÇFW&VBÒv–æF÷ræÆÅVæ—fW'6—F–W2æf–ÇFW"‡Væ’Óâ Ğ¢Væ’ææÖRçFôÆ÷vW$66R‚’æ–æ6ÇVFW2‡VW'’’ÇÂ Ğ¢Væ’ç6ÇVrçFôÆ÷vW$66R‚’æ–æ6ÇVFW2‡VW'’’ÇÀĞ¢‡Væ’æFW67&—F–öâbbVæ’æFW67&—F–öâçFôÆ÷vW$66R‚’æ–æ6ÇVFW2‡VW'’’Ğ¢“°Ğ¢ Ğ¢F—7Æ•Væ—fW'6—F–W2†f–ÇFW&VB“°Ğ§ĞĞ Ğ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¢òòZJ~ZÚnXŠ^k.K«®KˆŠj~89®8;Î8+‚‚÷Væ—fW'6—F–W2ó§6ÇVrĞ¢òòÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¦7–æ2gVæ7F–öâ–æ—EVæ—fW'6—G”¦ö'5vR‡6ÇVr’°Ğ¢6öç7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vr“°Ğ¢6öç7B7GVFVçD–BÒÆö6Å7F÷&vRævWD—FVÒ‚w7GVFVçEö–Br“°Ğ¢ Ğ¢æ–ææW$…DÔÂÒ Ğ¢ÆF—b6Æ73Ò&Ö‚×rÓw†Â×‚ÖWFò‚ÓB6Ó§‚ÓbÆs§‚Ó‚’Ó"#àĞ¢ÆF—b6Æ73Ò&Ö"Ó‚#àĞ¢Æ‡&VcÒ"÷Væ—fW'6—F–W2"6Æ73Ò'FW‡B×&–Ö'’ÓC†÷fW#§FW‡B×&–Ö'’Ó3FW‡B×6ÒÖ"Ó2–æÆ–æRÖ&Æö6²#àĞ¢Æ’6Æ73Ò&f2fÖ'&÷rÖÆVgB×"Ó#ãÂö“îZJ~ZÚnKˆŠj~8¾h‹¾8(°Ğ¢ÂöàĞ¢Æƒ–CÒ'Væ’ÖæÖR"6Æ73Ò'FW‡BÓ7†ÂföçBÖ&Æ6²Ö"Ó"#îŠªŞ8ş‹ëÎ8şKŠÒââãÂöƒàĞ¢Ç–CÒ'Væ’ÖFW62"6Æ73Ò'FW‡BÖw&’ÓS#ãÂ÷àĞ¢ÂöF—càĞ¢ Ğ¢ÂÒÒ89^8*>8:¾8+ş8;ÂÒÓàĞ¢ÆF—b6Æ73Ò&vÆ72&÷VæFVB×†ÂÓBÖ"ÓBfÆW‚fÆW‚×w&vÓ2—FV×2Ö6VçFW"#àĞ¢ÆF—b6Æ73Ò&fÆW‚ÓÖ–â×rÓC‚#àĞ¢ÆF—b6Æ73Ò'&VÆF—fR#àĞ¢Æ’6Æ73Ò&f2f×6V&6‚'6öÇWFRÆVgBÓ2F÷Óó"×G&ç6ÆFR×’Óó"FW‡BÖw&’ÓSFW‡B×6Ò#ãÂö“àĞ¢Æ–çWB–CÒ'6V&6‚×"G—SÒ'FW‡B"Æ6V†öÆFW#Ò.8*Ş8;Î8:ş8;Î888~jIÎ{J"âââ Ğ¢6Æ73Ò'rÖgVÆÂ&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆrÂÓ’"ÓB’Ó"FW‡B×6ÒFW‡B×v†—FRÆ6V†öÆFW"Öw&’ÓSfö7W3¦÷WFÆ–æRÖæöæRfö7W3¦&÷&FW"×&–Ö'’ÓS#àĞ¢ÂöF—càĞ¢ÂöF—càĞ¢Ç6VÆV7B–CÒ&f–ÇFW"Öö67WF–öâ"6Æ73Ò&&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡BÖw&’Ó3fö7W3¦÷WFÆ–æRÖæöæRfö7W3¦&÷&FW"×&–Ö'’ÓS#àĞ¢G·&VæFW$ö67WF–öä÷F–öç2‚—ĞĞ¢Â÷6VÆV7CàĞ¢Ç6VÆV7B–CÒ&f–ÇFW"Ö–æGW7G'’"6Æ73Ò&&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡BÖw&’Ó3fö7W3¦÷WFÆ–æRÖæöæRfö7W3¦&÷&FW"×&–Ö'’ÓS#àĞ¢Æ÷F–öâfÇVSÒ"#îXZjZŞzŠãÂö÷F–öãàĞ¢Æ÷F–öãä….8;¾K«®iÙÂö÷F–öããÆ÷F–öãä•N8;µ63Âö÷F–öããÆ÷F–öãî89î8;Î8+88n8*>8;>8+Âö÷F–öãàĞ¢Æ÷F–öãî8+>8;>8+^8:¾88n8*>8;>8+Âö÷F–öããÆ÷F–öãäT>8;¾[şZ;#Âö÷F–öããÆ÷F–öãî8:88~8*>8*#Âö÷F–öããÆ÷F–öãî8Ş8îK¹cÂö÷F–öãàĞ¢Â÷6VÆV7CàĞ¢Ç6VÆV7B–CÒ&f–ÇFW"×7G–ÆR"6Æ73Ò&&r×v†—FRóR&÷&FW"&÷&FW"×v†—FRó&÷VæFVBÖÆr‚Ó2’Ó"FW‡B×6ÒFW‡BÖw&’Ó3fö7W3¦÷WFÆ–æRÖæöæRfö7W3¦&÷&FW"×&–Ö'’ÓS#àĞ¢Æ÷F–öâfÇVSÒ"#îXZXºNX¹[Ú.hX³Âö÷F–öãàĞ¢Æ÷F–öâfÇVSÒ&öç6—FR#îX{®zKãÂö÷F–öããÆ÷F–öâfÇVSÒ'&VÖ÷FR#î8:®8:.8;Î88ƒÂö÷F–öããÆ÷F–öâfÇVSÒ&‡–'&–B#î88ş8*N89n8:®88>88“Âö÷F–öãàĞ¢Â÷6VÆV7CàĞ¢Æ'WGFöâöæ6Æ–6³Ò'6V&6…Væ—fW'6—G”¦ö'2‚rG·6ÇVwÒr’"6Æ73Ò&&r×&–Ö'’ÓS†÷fW#¦&r×&–Ö'’ÓcFW‡B×v†—FRFW‡B×6Ò‚ÓR’Ó"&÷VæFVBÖÆrG&ç6—F–öâÖ6öÆ÷'2#àĞ¢Æ’6Æ73Ò&f2f×6V&6‚×"Ó#ãÂö“îjIÎ{J Ğ¢Âö'WGFöãàĞ¢ÂöF—càĞ¢ Ğ¢ÆF—b–CÒ&¦ö'2ÖÆ—7B"6Æ73Ò&w&–Bw&–BÖ6öÇ2ÓÖC¦w&–BÖ6öÇ2Ó"Æs¦w&–BÖ6öÇ2Ó2vÓR#àĞ¢Gµ³Ã"Ã5ÒæÖ‚‚’ÓâÆF—b6Æ73Ò&vÆ72&÷VæFVB×†ÂÓRæ–ÖFR×VÇ6R‚ÓC‚#ãÂöF—cæ’æ¦ö–â‚rr—ĞĞ¢ÂöF—càĞ¢ÂöF—càĞ¢°Ğ Ğ¢6öç7B6V&6„–çWBÒFö7VÖVçBævWDVÆVÖVçD'”–B‚w6V&6‚×r“°Ğ¢6V&6„–çWCòæFDWfVçDÆ—7FVæW"‚v–çWBrÂ‚’Óâ°Ğ¢6ÆV%F–ÖV÷WB‡v–æF÷råõ÷Væ—fW'6—G”¦ö%6V&6…F–ÖW"“°Ğ¢v–æF÷råõ÷Væ—fW'6—G”¦ö%6V&6…F–ÖW"Ò6WEF–ÖV÷WB‚‚’Óâ6V&6…Væ—fW'6—G”¦ö'2‡6ÇVr’Â#S“°Ğ¢Ò“°Ğ¢6V&6„–çWCòæFDWfVçDÆ—7FVæW"‚v¶W–F÷vârÂRÓâ²–b†Ræ¶W“ÓÓÒtVçFW"r’6V&6…Væ—fW'6—G”¦ö'2‡6ÇVr“²Ò“°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vf–ÇFW"Öö67WF–öâr“òæFDWfVçDÆ—7FVæW"‚v6†ævRrÂ‚’Óâ6V&6…Væ—fW'6—G”¦ö'2‡6ÇVr’“°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vf–ÇFW"Ö–æGW7G'’r“òæFDWfVçDÆ—7FVæW"‚v6†ævRrÂ‚’Óâ6V&6…Væ—fW'6—G”¦ö'2‡6ÇVr’“°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vf–ÇFW"×7G–ÆRr“òæFDWfVçDÆ—7FVæW"‚v6†ævRrÂ‚’Óâ6V&6…Væ—fW'6—G”¦ö'2‡6ÇVr’“°Ğ Ğ¢G'’°Ğ¢òòZJ~ZÚnh8^ZXùn[épĞ¢6öç7BVæ•&W2Òv—B’ævWB‚rö†öÖWvR÷Væ—fW'6—G’×Fw2r“°Ğ¢6öç7BVæ—fW'6—F–W2ÒVæ•&W2æFFæFFÇÂµÓ°Ğ¢6öç7BVæ’ÒVæ—fW'6—F–W2æf–æB‡RÓâRç6ÇVrÓÓÒ6ÇVr“°Ğ¢ Ğ¢–b‚Væ’’°Ğ¢æ–ææW$…DÔÂÒ Ğ¢ÆF—b6Æ73Ò&Ö‚×rÓw†Â×‚ÖWFò‚ÓB6Ó§‚ÓbÆs§‚Ó‚’Ó"FW‡BÖ6VçFW"#àĞ¢Ç6Æ73Ò'FW‡BÖw&’ÓSÖ"ÓB#îŠ›.[Ù>88(¾ZJ~ZÚn8ÎŠh¾8N8¾8(®8î8¾8)3Â÷àĞ¢Æ‡&VcÒ"÷Væ—fW'6—F–W2"6Æ73Ò'FW‡B×&–Ö'’ÓC†÷fW#§FW‡B×&–Ö'’Ó3#îZJ~ZÚnKˆŠj~8¾h‹¾8(³ÂöàĞ¢ÂöF—càĞ¢°Ğ¢&WGW&ã°Ğ¢ĞĞ¢ Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚wVæ’ÖæÖRr’çFW‡D6öçFVçBÒVæ’ææÖR²r8î8®888(k.K«¢s°Ğ¢–b‡Væ’æFW67&—F–öâ’°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚wVæ’ÖFW62r’çFW‡D6öçFVçBÒVæ’æFW67&—F–öã°Ğ¢ĞĞ¢ Ğ¢òòZJ~ZÚnXŠ^k.K«®Xùn[épĞ¢6öç7B¦ö'5&W2Òv—B’ævWB†ö†öÖWvR÷Væ—fW'6—F–W2òG·6ÇVwÒö¦ö'2G·7GVFVçD–Bòs÷7GVFVçEö–CÒr·7GVFVçD–B¢rwÖ“°Ğ¢6öç7B¦ö'2Ò¦ö'5&W2æFFæFFÇÂµÓ°Ğ¢ Ğ¢6öç7BÆ—7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚v¦ö'2ÖÆ—7Br“°Ğ¢–b†¦ö'2æÆVæwF‚ÓÓÒ’°Ğ¢Æ—7Bæ–ææW$…DÔÂÒsÇ6Æ73Ò&6öÂ×7âÓ2FW‡BÖ6VçFW"FW‡BÖw&’ÓS’Ó#î8î88>8îZJ~ZÚnY	88îk.K«®8ş8.8(®8î8¾8)3Â÷âs°Ğ¢ÒVÇ6R°Ğ¢Æ—7Bæ–ææW$…DÔÂÒ¦ö'2æÖ†¦ö"Óâ&VæFW$¦ö$6&B†¦ö"’’æ¦ö–â‚rr“°Ğ¢ĞĞ¢ Ğ¢v–æF÷ræ7W'&VçEVæ—fW'6—G•6ÇVrÒ6ÇVs°Ğ¢v–æF÷ræ7W'&VçEVæ—fW'6—G”¦ö'2Ò¦ö'3°Ğ¢Ò6F6‚†R’°Ğ¢6öç6öÆRæW'&÷"†R“°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚v¦ö'2ÖÆ—7Br’æ–ææW$…DÔÂÒsÇ6Æ73Ò&6öÂ×7âÓ2FW‡BÖ6VçFW"FW‡B×&VBÓC’Ó#îk.K«®h8^Z8îŠªŞ8ş‹ëÎ8ş8¾ZKiY~8~8î8~8óÂ÷âs°Ğ¢ĞĞ§ĞĞ Ğ¦gVæ7F–öâvWE6V&6†&ÆT¦ö%FW‡B†¦ö"’°Ğ¢ÆWBFw2ÒµÓ°Ğ¢G'’²Fw2Ò¥4ôâç'6R†¦ö"çFw2ÇÂuµÒr“²Ò6F6‚†R’·ĞĞ¢6öç7Bv÷&µ7G–ÆTÆ&VÂÒ²öç6—FS¢~X{®zKârÂ&VÖ÷FS¢~8:®8:.8;Î88‚rÂ‡–'&–C¢~88ş8*N89n8:®88>88’rÓ°Ğ¢&WGW&â°Ğ¢¦ö"çF—FÆRÂ¦ö"ç6ÇVrÂ¦ö"æ6F6…ö6÷’Â¦ö"æFW67&—F–öâÂ¦ö"çv÷&µö6öçFVçBÀĞ¢¦ö"æö67WF–öâÂ¦ö"æ6ö×ç•öæÖRÂ¦ö"æ6ö×ç•ö–æGW7G'’Â¦ö"çv÷&µ÷7G–ÆRÂv÷&µ7G–ÆTÆ&VÅ¶¦ö"çv÷&µ÷7G–ÆUÒÀĞ¢¦ö"çv÷&µö†÷W'2Â¦ö"çv÷&µöF—2Â¦ö"çv÷&µöÆö6F–öâÂ¦ö"çF&vWEöw&FRÂ¦ö"çVæ—fW'6—G•öÆWfVÂÀĞ¢¦ö"ç&WV—&VÖVçG2Â¦ö"ç&VfW'&VE÷&WV—&VÖVçG2Â¦ö"ç6VÆV7F–öåöfÆ÷rÂ¦ö"ç&V6öÖÖVæFVEöf÷"ÀĞ¢ââçFw0Ğ¢Òæf–ÇFW"„&ööÆVâ’æ¦ö–â‚rr’çFôÆ÷vW$66R‚“°Ğ§ĞĞ Ğ¦gVæ7F–öâ6V&6…Væ—fW'6—G”¦ö'2‡6ÇVr’°Ğ¢6öç7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚w6V&6‚×r’çfÇVRçG&–Ò‚’çFôÆ÷vW$66R‚“°Ğ¢6öç7Bö67WF–öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vf–ÇFW"Öö67WF–öâr’çfÇVS°Ğ¢6öç7B–æGW7G'’ÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vf–ÇFW"Ö–æGW7G'’r’çfÇVS°Ğ¢6öç7B7G–ÆRÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vf–ÇFW"×7G–ÆRr’çfÇVS°Ğ¢ Ğ¢–b‚v–æF÷ræ7W'&VçEVæ—fW'6—G”¦ö'2’&WGW&ã°Ğ¢ Ğ¢ÆWBf–ÇFW&VBÒv–æF÷ræ7W'&VçEVæ—fW'6—G”¦ö'2æf–ÇFW"†¦ö"Óâ°Ğ¢6öç7BÖF6…ÒÇÂvWE6V&6†&ÆT¦ö%FW‡B†¦ö"’æ–æ6ÇVFW2‡“°Ğ¢6öç7BÖF6„ö67WF–öâÒö67WF–öâÇÂ¦ö"æö67WF–öâÓÓÒö67WF–öã°Ğ¢6öç7BÖF6„–æGW7G'’Ò–æGW7G'’ÇÂ¦ö"æ6ö×ç•ö–æGW7G'’ÓÓÒ–æGW7G'“°Ğ¢6öç7BÖF6…7G–ÆRÒ7G–ÆRÇÂ¦ö"çv÷&µ÷7G–ÆRÓÓÒ7G–ÆS°Ğ¢&WGW&âÖF6…bbÖF6„ö67WF–öâbbÖF6„–æGW7G'’bbÖF6…7G–ÆS°Ğ¢Ò“°Ğ¢ Ğ¢6öç7BÆ—7BÒFö7VÖVçBævWDVÆVÖVçD'”–B‚v¦ö'2ÖÆ—7Br“°Ğ¢–b†f–ÇFW&VBæÆVæwF‚ÓÓÒ’°Ğ¢Æ—7Bæ–ææW$…DÔÂÒsÇ6Æ73Ò&6öÂ×7âÓ2FW‡BÖ6VçFW"FW‡BÖw&’ÓS’Ó#îiÚK»n8¾Y8nk.K«®8ÎŠh¾8N8¾8(®8î8¾8)3Â÷âs°Ğ¢ÒVÇ6R°Ğ¢Æ—7Bæ–ææW$…DÔÂÒf–ÇFW&VBæÖ†¦ö"Óâ&VæFW$¦ö$6&B†¦ö"’’æ¦ö–â‚rr“°Ğ¢ĞĞ§ĞĞ