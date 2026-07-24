-- =============================================
-- シードデータ（開発用）
-- =============================================

-- 管理者（パスワード: admin123）
-- src/routes/api.auth.ts の SHA-256(password + 'intern_salt_2024') と一致させる
INSERT OR IGNORE INTO admins (email, password_hash, name, role) VALUES
  ('admin@internship.jp', '5ed35afd3cd274ad80f692fd8485d7e30e1277f73b65fab3c441726cd0f74afc', 'システム管理者', 'super_admin');

-- 招待コード（サンプル）
INSERT OR IGNORE INTO invite_codes (code, description, max_uses, issued_by, expires_at) VALUES
  ('WELCOME2024', 'ローンチ記念コード', 100, 'admin', '2025-03-31 23:59:59'),
  ('FRIEND001', '友人紹介コード1', 1, 'admin', '2025-12-31 23:59:59'),
  ('FRIEND002', '友人紹介コード2', 1, 'admin', '2025-12-31 23:59:59'),
  ('EARLY2024', '早期登録コード', 50, 'admin', '2025-06-30 23:59:59');

-- サンプル企業1
INSERT OR IGNORE INTO companies (name, slug, industry, size, founded_year, website_url, description, mission, culture, office_location, office_access, status, display_order) VALUES
  (
    'Acroforce株式会社',
    'acroforce',
    'HR・人材',
    '11-50名',
    2020,
    'https://acroforce.co.jp',
    '「人と組織の可能性を最大化する」をミッションに掲げ、人材紹介・組織コンサルティングを展開する急成長スタートアップ。代表は大手商社出身で、リアルなビジネス現場を学べる環境が整っている。',
    '人と組織の可能性を最大化する',
    '仮説思考・振り返り文化・チームワークを重視。学生でも本気で仕事に向き合える環境。',
    '東京都品川区東品川4-12-4 品川シーサイドパークタワー11F',
    '品川シーサイド駅直結',
    'published',
    1
  );

-- サンプル企業2
INSERT OR IGNORE INTO companies (name, slug, industry, size, founded_year, description, mission, office_location, status, display_order) VALUES
  (
    'TechGrowth株式会社',
    'techgrowth',
    'IT・SaaS',
    '51-100名',
    2018,
    'AIを活用したSaaSプロダクトを開発・展開する急成長スタートアップ。エンジニアとビジネス両方のポジションで学生インターンを積極採用中。',
    'テクノロジーで、ビジネスの常識を変える',
    '渋谷オフィス（フルリモート可）',
    'published',
    2
  );

-- Acroforceの求人
INSERT OR IGNORE INTO jobs (
  company_id, title, slug, catch_copy,
  description, work_content, requirements, preferred_requirements,
  highlights, growth_points, work_hours, work_days,
  work_location, work_style, remote_available,
  hourly_wage_min, hourly_wage_max, wage_note,
  target_grade, university_level, min_hours_per_month, max_hours_per_month,
  selection_flow, tags, status, display_order
) VALUES (
  1,
  '営業・ビジネス開発インターン',
  'acroforce-sales',
  '未経験から圧倒的な営業力を。チームで挑み、ビジネスの"土台"を築く実践型インターン。',
  '人材紹介事業における営業活動を通じて、ビジネスの基礎から応用まで体系的に学べる実践型インターンです。入社3ヶ月でチームリーダーに抜擢された学生も多数在籍。',
  '・企業への新規開拓営業（テレアポ・メール・訪問）
・既存顧客へのフォローアップ営業
・求人票作成・候補者へのスカウト
・KPI管理・日次振り返りMTG参加
・マーケティング施策の立案・実行（成長に応じて）',
  '・週3日以上コミットできる方
・素直に学ぶ姿勢がある方
・チームで成果を出すことに喜びを感じる方
・大学1〜3年生（長期コミット可能な方）',
  '・営業未経験大歓迎
・体育会・インターン未経験でもOK
・就活本番前に実績を作りたい方',
  '[
    {"icon": "🏆", "title": "就活パスポート付き", "body": "6ヶ月以上の実務経験で、有名企業への最終選考パスが付与。就活のスタート位置が変わる。"},
    {"icon": "📈", "title": "ビジネスの土台を体系習得", "body": "営業の型・仮説思考・振り返り文化を通じて、ビジネスマンとしての土台を体系的に身につけられる。"},
    {"icon": "🚀", "title": "段階的な成長環境", "body": "営業実務に加え、KPI設計・戦略立案・マネジメントまで段階的に挑戦できる。"}
  ]',
  '・営業力・提案力
・ロジカルシンキング
・KPI設計・数値管理
・チームマネジメント（希望者）',
  '10:00〜18:00',
  '平日（月間72時間以上。学業優先で月56時間まで応相談）',
  '東京都品川区東品川4-12-4 品川シーサイドパークタワー11F',
  'onsite',
  0,
  1200, 1500,
  '成長に応じ昇給あり',
  '大学1〜4年生',
  '高学歴',
  56, 80,
  '書類選考 → 一次面接（オンライン） → 最終面接（対面） → 内定',
  '["営業", "ビジネス", "スタートアップ", "成長環境", "就活サポート"]',
  'published',
  1
);

-- TechGrowthの求人
INSERT OR IGNORE INTO jobs (
  company_id, title, slug, catch_copy,
  description, work_content, requirements,
  highlights, work_hours, work_days,
  work_location, work_style, remote_available,
  hourly_wage_min, hourly_wage_max,
  target_grade, min_hours_per_month, max_hours_per_month,
  selection_flow, tags, status, display_order
) VALUES (
  2,
  'Webマーケティング・グロースインターン',
  'techgrowth-marketing',
  'AIツールを武器に、SaaSのグロースを実現するマーケター育成プログラム',
  'BtoB SaaSのマーケティングチームで、リード獲得からナーチャリングまで担当。ChatGPTなどAIツールを積極活用し、データドリブンなマーケティングを実践できる環境。',
  '・SEO/コンテンツマーケティング
・SNS運用（X・LinkedIn）
・メールマーケティング施策
・広告運用（Google/Meta）
・データ分析・レポーティング',
  '・週3日以上コミット可能
・マーケティング/ITに興味がある方
・数字を見て改善するのが好きな方',
  '[
    {"icon": "🤖", "title": "AIフル活用環境", "body": "ChatGPT・Claudeなど最新AIツールを業務で使いこなすスキルが身につく。"},
    {"icon": "📊", "title": "データドリブン文化", "body": "施策ごとにKPIを設定し、効果測定→改善のサイクルを実践的に学べる。"},
    {"icon": "🌍", "title": "フルリモートOK", "body": "場所を選ばず働けるリモートワーク環境。週1出社も歓迎。"}
  ]',
  '10:00〜19:00（フレックス可）',
  '週3日以上（フルリモート）',
  '東京都渋谷区（リモートメイン）',
  'remote',
  1,
  1300, 1800,
  '大学1〜4年生',
  40, 80,
  '書類選考 → カジュアル面談 → 一次面接 → 内定',
  '["マーケティング", "AI活用", "リモート", "SaaS", "データ分析"]',
  'published',
  2
);
