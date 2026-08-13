-- Public operator/legal information used by the footer and legal pages.
-- Values are intentionally blank until the operator confirms the official details.
INSERT OR IGNORE INTO site_settings
  (setting_key, setting_value, setting_type, label, description, group_name, display_order)
VALUES
  ('operator_name', '', 'text', '運営者名', '法人名または正式な運営者名', 'operator', 1),
  ('operator_representative', '', 'text', '代表者名', '公開する代表者名', 'operator', 2),
  ('operator_address', '', 'text', '所在地', '公開する事業者所在地', 'operator', 3),
  ('operator_business', '長期インターン求人情報サービスの企画・運営', 'text', '事業内容', '運営者情報ページに掲載', 'operator', 4),
  ('operator_contact_email', '', 'text', '公開お問い合わせメール', '公開ページに掲載する問い合わせ先', 'operator', 5),
  ('legal_updated_at', '2026年8月4日', 'text', '規約最終更新日', 'プライバシーポリシー・利用規約に掲載', 'operator', 6);
