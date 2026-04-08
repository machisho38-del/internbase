-- =============================================
-- サイト設定の初期データ
-- =============================================

-- ① サイト基本設定
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('site_name',        'InternBase',           'text', 'サービス名',         'サイト全体のサービス名', 'general', 1),
  ('site_tagline',     '圧倒的な実務経験を、今すぐ始めよう。', 'text', 'タグライン', 'ヒーローの大見出し', 'general', 2),
  ('site_description', '厳選された長期インターン求人。あなたのキャリアをここから始めよう。', 'text', 'サイト説明文', 'メタdescription・LP説明文', 'general', 3),
  ('site_logo_url',    '',                     'url',  'ロゴ画像URL',        '空欄の場合はテキストロゴを表示', 'general', 4),
  ('favicon_url',      '',                     'url',  'ファビコンURL',      'ブラウザタブのアイコン', 'general', 5),
  ('primary_color',    '#4f6ef7',              'text', 'メインカラー',       'ブランドカラー（16進数）', 'general', 6);

-- ② LINE・SNS設定
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('line_url',         'https://lin.ee/xxxxxxx', 'url', '公式LINE URL',     '応募完了・登録完了後の誘導先', 'contact', 1),
  ('line_id',          '@xxxxxxx',               'text','公式LINE ID',      'フッターに表示するLINE ID',  'contact', 2),
  ('twitter_url',      '',                       'url', 'Twitter/X URL',    'フッターSNSリンク', 'contact', 3),
  ('instagram_url',    '',                       'url', 'Instagram URL',    'フッターSNSリンク', 'contact', 4),
  ('note_url',         '',                       'url', 'Note URL',         'フッターSNSリンク', 'contact', 5),
  ('contact_email',    '',                       'text','お問い合わせメール', 'フッターに表示', 'contact', 6);

-- ③ LP ヒーローセクション
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('hero_badge_text',    '高学歴大学生向け・厳選求人のみ掲載',   'text', 'ヒーロー バッジテキスト',  'ヒーロー上部の小バッジ', 'hero', 1),
  ('hero_title_line1',   '圧倒的な',                             'text', 'ヒーロー見出し1行目',     'グラデーション文字', 'hero', 2),
  ('hero_title_line2',   '実務経験を、',                          'text', 'ヒーロー見出し2行目',     '白文字', 'hero', 3),
  ('hero_title_line3',   '今すぐ始めよう。',                      'text', 'ヒーロー見出し3行目',     '白文字', 'hero', 4),
  ('hero_subtitle',      'スタートアップ・成長企業での長期インターンで、就活で差がつく本物のスキルと実績を手に入れろ。', 'text', 'ヒーローサブテキスト', '見出し下の説明文', 'hero', 5),
  ('hero_cta1_text',     '求人を探す',                           'text', 'CTAボタン1テキスト',      'メインボタン', 'hero', 6),
  ('hero_cta2_text',     '招待コードで登録',                     'text', 'CTAボタン2テキスト',      'サブボタン', 'hero', 7);

-- ④ LP 数字セクション
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('stat_companies',     '50',   'number', '掲載企業数',  '数字セクション', 'stats', 1),
  ('stat_jobs',          '200',  'number', '求人数',      '数字セクション', 'stats', 2),
  ('stat_students',      '1000', 'number', '登録学生数',  '数字セクション', 'stats', 3),
  ('stat_success_rate',  '95',   'number', '就活成功率%', '数字セクション', 'stats', 4);

-- ⑤ LP 特徴セクション
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('feature_section_title',    '選ばれる理由',   'text', '特徴セクション タイトル', '', 'features', 1),
  ('feature_section_subtitle', '就活で差をつける、本質的な成長環境を提供します', 'text', '特徴セクション サブタイトル', '', 'features', 2);

-- ⑥ CTA セクション
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('cta_title',    'まずは無料相談から始めてみませんか？',  'text', 'CTAセクション タイトル',  'LP下部CTA', 'cta', 1),
  ('cta_subtitle', '自分に合ったインターンが見つかるか不安な方も、お気軽にご相談ください。', 'text', 'CTAセクション 説明文', '', 'cta', 2),
  ('cta_btn_text', '無料相談を申し込む',                   'text', 'CTAボタンテキスト',        '', 'cta', 3);

-- ⑦ 会員限定求人バナー設定
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('members_banner_enabled', '1',                   'boolean', '会員限定バナー表示',       '1=表示 0=非表示', 'members', 1),
  ('members_banner_title',   '🔒 登録者限定！非公開求人あり', 'text', '会員限定バナー タイトル', 'LP上の誘導バナー', 'members', 2),
  ('members_banner_text',    '登録するだけで見られる特別求人をチェックしよう', 'text', '会員限定バナー テキスト', '', 'members', 3),
  ('members_banner_btn',     '今すぐ登録して確認する',      'text', '会員限定バナー ボタン',   '', 'members', 4);

-- ⑧ 学生招待コード設定
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('student_referral_enabled', '1',                       'boolean', '学生招待コード機能',       '1=有効 0=無効', 'referral', 1),
  ('student_referral_benefit', '紹介特典：限定コミュニティへの招待', 'text', '紹介特典テキスト', 'マイページに表示する特典説明', 'referral', 2),
  ('student_referral_reward',  '被紹介者の入会で限定情報解放',      'text', '紹介報酬テキスト', '紹介した側への報酬説明', 'referral', 3);

-- ⑨ フッター設定
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, label, description, group_name, display_order) VALUES
  ('footer_copyright', '© 2024 InternBase. All rights reserved.', 'text', 'コピーライト', 'フッター最下部', 'footer', 1),
  ('privacy_policy_url', '#', 'url', 'プライバシーポリシーURL', '', 'footer', 2),
  ('terms_url',          '#', 'url', '利用規約URL',           '', 'footer', 3);

-- LPセクション: 特徴カード
INSERT OR IGNORE INTO lp_sections (section_key, section_name, content, is_visible, display_order) VALUES
  ('features', '特徴セクション（3カード）', '[
    {"icon":"filter","color":"primary","title":"厳選求人のみ","body":"成長環境・待遇・教育体制を独自審査。量より質を重視した厳選求人のみを掲載。"},
    {"icon":"user-tie","color":"purple","title":"プロによる無料相談","body":"キャリアのプロが就活・インターン選びを無料でサポート。一人で悩まない環境。"},
    {"icon":"fab fa-line","color":"green","title":"LINEでスムーズ連絡","body":"応募後の連絡は公式LINEで。メールより速く、選考をスムーズに進められる。"}
  ]', 1, 1);

-- FAQ初期データ
INSERT OR IGNORE INTO faqs (question, answer, category, display_order) VALUES
  ('長期インターンとは何ですか？', '長期インターンとは、3ヶ月以上にわたって企業で実際の業務を経験するインターンシップです。短期と異なり、実務に深く関わることができ、スキルや実績を積むことができます。', 'general', 1),
  ('大学何年生から参加できますか？', '大学1〜4年生を対象としています。特に2〜3年生での参加が就活前に実績を積む上で効果的です。', 'general', 2),
  ('招待コードがない場合でも登録できますか？', 'はい、招待コードは任意です。コードなしでも登録・応募は可能ですが、招待コードをお持ちの方は優先的にサポートを受けられます。', 'registration', 3),
  ('応募後のフローを教えてください。', '応募後、公式LINEにてご連絡します。その後、企業との面接日程調整→面接→内定という流れが一般的です。', 'application', 4),
  ('アルバイトと何が違うのですか？', 'アルバイトと異なり、長期インターンは「就業経験」として就活でアピールできます。また、企業の中核業務に携わることが多く、スキルや思考力が大きく成長します。', 'general', 5),
  ('無料相談では何を相談できますか？', '自分に合った業界・職種選び、インターンの選び方、就活との両立方法など、キャリアに関することなら何でもご相談いただけます。', 'consultation', 6);

-- お知らせ初期データ
INSERT OR IGNORE INTO announcements (title, body, type, is_visible, display_order) VALUES
  ('サービスをリリースしました！', '長期インターン求人サイトをオープンしました。多数の厳選求人を掲載中です。', 'success', 1, 1);
