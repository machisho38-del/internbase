import { test, expect } from '@playwright/test';

const publicPages = [
  ['/', 'InternBase'],
  ['/jobs', '求人'],
  ['/universities', '大学'],
  ['/register', '登録'],
  ['/login', 'ログイン'],
  ['/privacy', 'プライバシーポリシー'],
  ['/terms', '利用規約'],
  ['/company', '運営者情報']
];

test.describe('Preview public site', () => {
  test('Preview D1 is configured in public mode', async ({ request }) => {
    const response = await request.get('/api/settings/site-mode');
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.data?.site_mode).toBe('public');
  });

  for (const [path, expectedText] of publicPages) {
    test(`${path} renders without browser errors`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

      expect(response?.status()).toBe(200);
      expect(response?.headers()['x-robots-tag']).toContain('noindex');
      await expect(page.locator('body')).toContainText(expectedText);
      expect(errors).toEqual([]);
    });
  }

  test('robots and sitemap prevent Preview indexing', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain('Disallow: /');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).not.toContain('<url>');
  });

  test('default OGP image and page metadata are available', async ({ page, request }) => {
    const response = await request.get('/og-default.png');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).length).toBeGreaterThan(1_000);

    await page.goto('/jobs');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/jobs$/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-default\.png/);
  });

  test('a published job has dynamic metadata and JobPosting data', async ({ page, request }) => {
    const jobsResponse = await request.get('/api/jobs?visibility=public');
    expect(jobsResponse.status()).toBe(200);
    const payload = await jobsResponse.json();
    const jobs = payload.data || [];
    test.skip(jobs.length === 0, 'Preview D1 has no public jobs');

    const job = jobs[0];
    await page.goto(`/jobs/${encodeURIComponent(job.slug)}`);
    await expect(page).toHaveTitle(new RegExp(job.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(jsonLd)['@type']).toBe('JobPosting');
  });

  test('unknown routes return the custom 404 page', async ({ page }) => {
    const response = await page.goto('/__e2e_not_found__');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('ページが見つかりません')).toBeVisible();
  });
});

test.describe('Preview admin', () => {
  test.skip(
    !process.env.PREVIEW_ADMIN_EMAIL || !process.env.PREVIEW_ADMIN_PASSWORD,
    'PREVIEW_ADMIN_EMAIL and PREVIEW_ADMIN_PASSWORD are not configured'
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.locator('#login-email').fill(process.env.PREVIEW_ADMIN_EMAIL);
    await page.locator('#login-password').fill(process.env.PREVIEW_ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page.locator('#sidebar')).toBeVisible();
  });

  const adminPages = [
    ['dashboard', 'ダッシュボード'],
    ['companies', '企業管理'],
    ['jobs', '求人管理'],
    ['students', '学生一覧'],
    ['applications', '応募管理'],
    ['invites', '招待コード'],
    ['site-settings', 'サイト設定'],
    ['success-stories', '内定者タイムライン管理'],
    ['featured-jobs', 'ピックアップ求人設定'],
    ['university-tags', '大学タグ管理']
  ];

  for (const [pageName, title] of adminPages) {
    test(`${title} opens`, async ({ page }) => {
      await page.locator(`[data-page="${pageName}"]`).click();
      await expect(page.locator('#page-title')).toHaveText(title);
      await expect(page.locator('#admin-content')).not.toContainText('データの取得に失敗しました');
    });
  }

  test('homepage management modals open and close', async ({ page }) => {
    const cases = [
      ['success-stories', '新規追加', '内定者タイムライン追加'],
      ['featured-jobs', '求人を追加', 'ピックアップ求人追加'],
      ['university-tags', '新規追加', '大学タグ追加']
    ];

    for (const [pageName, buttonName, heading] of cases) {
      await page.locator(`[data-page="${pageName}"]`).click();
      await page.getByRole('button', { name: buttonName }).click();
      await expect(page.locator('#modal')).toBeVisible();
      await expect(page.locator('#modal-content')).toContainText(heading);
      await page.locator('#modal-content').getByRole('button', { name: 'キャンセル' }).click();
      await expect(page.locator('#modal')).toBeHidden();
    }
  });
});
