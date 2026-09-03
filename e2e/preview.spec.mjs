import { test, expect } from '@playwright/test';

const publicPages = [
  ['/', 'ガクチカインターン'],
  ['/jobs', '求人'],
  ['/universities', '大学'],
  ['/register', '登録'],
  ['/login', 'ログイン'],
  ['/forgot-password', 'パスワードを忘れた方'],
  ['/reset-password', '再設定リンクが無効です'],
  ['/consultation', '無料相談フォーム'],
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

  test('home hero stays compact on mobile and expands into two columns on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.hero-title-mobile .hero-title-line')).toHaveCount(3);
    await expect(page.locator('.hero-title-mobile')).toBeVisible();
    await expect(page.locator('.home-hero-photo')).toHaveCSS('height', '190px');
    await expect(page.locator('.mobile-cta-title .cta-title-line')).toHaveCount(2);
    await expect(page.locator('.mobile-cta-title + p + button')).toHaveCSS('white-space', 'nowrap');

    await page.setViewportSize({ width: 1600, height: 1000 });
    await expect(page.locator('.home-hero-photo')).toHaveCSS('height', '544px');
    await expect(page.locator('.hero-title-desktop')).toBeVisible();
    await expect(page.locator('.hero-title-desktop .hero-title-line').first()).toHaveCSS('white-space', 'nowrap');
  });

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

  test('development seed content is not publicly exposed', async ({ request }) => {
    const jobsResponse = await request.get('/api/jobs?visibility=public');
    expect(jobsResponse.status()).toBe(200);
    const jobsPayload = await jobsResponse.json();
    const publicJobSlugs = (jobsPayload.data || []).map(job => job.slug);
    expect(publicJobSlugs).not.toContain('acroforce-sales');
    expect(publicJobSlugs).not.toContain('techgrowth-marketing');
    expect(publicJobSlugs).not.toContain('sssssssssss');

    const storiesResponse = await request.get('/api/homepage/success-stories');
    expect(storiesResponse.status()).toBe(200);
    expect((await storiesResponse.json()).data || []).toEqual([]);

    const universitiesResponse = await request.get('/api/homepage/university-tags');
    expect(universitiesResponse.status()).toBe(200);
    expect((await universitiesResponse.json()).data || []).toEqual([]);
  });

  test('signed-out visitors cannot forge student access with ids in requests', async ({ request }) => {
    const mypage = await request.get('/api/students/mypage/1');
    expect(mypage.status()).toBe(401);

    const application = await request.post('/api/applications', {
      data: { student_id: 1, job_id: 1, motivation: 'authorization check' }
    });
    expect(application.status()).toBe(401);

    const members = await request.get('/api/jobs?members=1&student_id=1');
    expect(members.status()).toBe(401);

    const publicJobs = await request.get('/api/jobs?student_id=1');
    expect(publicJobs.status()).toBe(200);
    const payload = await publicJobs.json();
    expect((payload.data || []).every(job => job.visibility === 'public')).toBe(true);
  });

  test('registration requires explicit terms and privacy consent', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('radio', { name: 'その他' }).check();
    await page.getByRole('button', { name: '登録フォームへ進む' }).click();

    const consent = page.locator('#reg-terms-consent');
    const registrationForm = page.locator('#register-form');
    await expect(consent).toBeVisible();
    await expect(consent).toHaveAttribute('required', '');
    await expect(registrationForm.getByRole('link', { name: '利用規約' })).toHaveAttribute('href', '/terms');
    await expect(registrationForm.getByRole('link', { name: 'プライバシーポリシー' })).toHaveAttribute('href', '/privacy');
  });

  test('password reset request does not reveal whether an account exists', async ({ request }) => {
    const response = await request.post('/api/students/password-reset/request', {
      data: { email: 'not-registered-password-reset-e2e@example.com' }
    });
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.message).toContain('登録状況にかかわらず');

    const invalidReset = await request.post('/api/students/password-reset/confirm', {
      data: { token: 'invalid', password: 'new-password-123' }
    });
    expect(invalidReset.status()).toBe(400);
    expect((await invalidReset.json()).error).toContain('無効か、期限切れ');
  });

  test('LINE consultation is the single public consultation entry point', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a[href="/consultation"]')).toHaveCount(0);

    const lineConsultationButton = page.locator('nav button[onclick="openLineModal()"]');
    await expect(lineConsultationButton).toHaveCount(1);
    await lineConsultationButton.click();
    await expect(page.locator('#line-modal')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Webサイト・その他' })).toHaveAttribute('href', '/consultation?source=web');
  });

  test('web consultation opens the form directly and requires a phone number', async ({ page, request }) => {
    await page.goto('/consultation?source=web');
    await expect(page.locator('#con-source-step')).toHaveCount(0);
    await expect(page.locator('#consultation-form')).toBeVisible();
    await expect(page.locator('#con-phone')).toHaveAttribute('required', '');

    const missingPhone = await request.post('/api/consultation', {
      data: { name: 'E2E確認', email: 'consultation-e2e@example.com', source_media: 'web' }
    });
    expect(missingPhone.status()).toBe(400);
    expect((await missingPhone.json()).error).toContain('電話番号');
  });

  test('unknown routes return the custom 404 page', async ({ page }) => {
    const response = await page.goto('/__e2e_not_found__');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('ページが見つかりません')).toBeVisible();
  });

  test('visible success stories appear in the moving timeline', async ({ page, request }) => {
    const response = await request.get('/api/homepage/success-stories');
    expect(response.status()).toBe(200);
    const payload = await response.json();
    const stories = payload.data || [];
    test.skip(stories.length === 0, 'Preview D1 has no visible success stories');

    await page.goto('/');
    await expect(page.locator('#success-stories')).toBeVisible();
    await expect(page.locator('.timeline-track')).toHaveCSS('animation-name', 'scroll-success-stories');
    await expect(page.locator('.timeline-card').first()).toContainText(stories[0].university);
    await expect(page.locator('.timeline-card').first()).toContainText(stories[0].student_name);
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
    ['lp-edit', 'LP編集'],
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

  test('LP editor only shows settings connected to the current homepage', async ({ page }) => {
    await page.locator('[data-page="lp-edit"]').click();
    await expect(page.locator('#lpset-site_tagline')).toBeVisible();
    await expect(page.locator('#lpset-site_description')).toBeVisible();
    await expect(page.locator('#lpset-hero_cta1_text')).toBeVisible();
    await expect(page.locator('#lp-features-visible')).toBeVisible();
    await expect(page.locator('#lpset-members_banner_title')).toBeVisible();

    await expect(page.locator('#lp-group-stats')).toHaveCount(0);
    await expect(page.locator('#lp-group-cta')).toHaveCount(0);
    await expect(page.locator('#lpset-hero_subtitle')).toHaveCount(0);
    await expect(page.locator('#lpset-hero_cta2_text')).toHaveCount(0);
  });

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

  test('hidden homepage content can be created, updated, and deleted safely', async ({ page }) => {
    const marker = `E2E-${Date.now()}`;
    let storyId;
    let tagId;

    try {
      const storyResponse = await page.context().request.post('/api/homepage/success-stories/admin', {
        data: {
          student_name: marker,
          university: 'E2E大学',
          company_name: 'E2E株式会社',
          comment: '非公開CRUD確認',
          is_visible: 0,
          display_order: 9999
        }
      });
      expect(storyResponse.status()).toBe(200);
      storyId = (await storyResponse.json()).id;

      const storyUpdate = await page.context().request.put(`/api/homepage/success-stories/admin/${storyId}`, {
        data: {
          student_name: `${marker}-updated`,
          university: 'E2E大学',
          company_name: 'E2E株式会社',
          comment: '更新済み',
          is_visible: 0,
          display_order: 9999
        }
      });
      expect(storyUpdate.status()).toBe(200);

      const storiesAdmin = await page.context().request.get('/api/homepage/success-stories/admin');
      expect((await storiesAdmin.json()).data.some(story => story.id === storyId && story.is_visible === 0)).toBe(true);
      const storiesPublic = await page.context().request.get('/api/homepage/success-stories');
      expect((await storiesPublic.json()).data.some(story => story.id === storyId)).toBe(false);

      const tagResponse = await page.context().request.post('/api/homepage/university-tags/admin', {
        data: {
          name: marker,
          slug: `e2e-${Date.now()}`,
          description: '非公開CRUD確認',
          is_visible: 0,
          display_order: 9999
        }
      });
      expect(tagResponse.status()).toBe(200);
      tagId = (await tagResponse.json()).id;

      const tagsPublic = await page.context().request.get('/api/homepage/university-tags');
      expect((await tagsPublic.json()).data.some(tag => tag.id === tagId)).toBe(false);
    } finally {
      if (storyId) await page.context().request.delete(`/api/homepage/success-stories/admin/${storyId}`);
      if (tagId) await page.context().request.delete(`/api/homepage/university-tags/admin/${tagId}`);
    }
  });
});
