-- Replace demo products with real Mastercard product portfolio
-- Based on actual Mastercard offerings in North America (2025)

-- Clear existing demo data
DELETE FROM public.sales_training;
DELETE FROM public.product_compliance;
DELETE FROM public.product_actions;
DELETE FROM public.product_feedback;
DELETE FROM public.product_predictions;
DELETE FROM public.product_metrics;
DELETE FROM public.product_readiness;
DELETE FROM public.products;

-- Insert REAL Mastercard products
INSERT INTO public.products (id, name, product_type, region, lifecycle_stage, launch_date, revenue_target, owner_email) VALUES
-- Payment Flows
('11111111-1111-1111-1111-111111111111', 'Mastercard Send', 'payment_flows', 'North America', 'mature', '2015-06-01', 12500000.00, 'send.product@mastercard.com'),
('22222222-2222-2222-2222-222222222222', 'Click to Pay', 'payment_flows', 'North America', 'scaling', '2019-03-15', 8700000.00, 'clicktopay.pm@mastercard.com'),
('33333333-3333-3333-3333-333333333333', 'BNPL Gateway API', 'payment_flows', 'North America', 'pilot', '2024-10-01', 1950000.00, 'bnpl.lead@mastercard.com'),
('44444444-4444-4444-4444-444444444444', 'Cross-Border B2B Payments', 'payment_flows', 'North America', 'pilot', '2024-07-15', 3200000.00, 'b2b.payments@mastercard.com'),
('55555555-5555-5555-5555-555555555555', 'Mastercard Move', 'payment_flows', 'North America', 'concept', NULL, 2100000.00, 'move.innovation@mastercard.com'),

-- Core Products
('66666666-6666-6666-6666-666666666666', 'Mastercard Gateway', 'core_products', 'North America', 'mature', '2012-01-01', 24500000.00, 'gateway.pm@mastercard.com'),
('77777777-7777-7777-7777-777777777777', 'Virtual Card Services', 'core_products', 'North America', 'mature', '2018-05-01', 15200000.00, 'virtualcard.owner@mastercard.com'),
('88888888-8888-8888-8888-888888888888', 'Contactless Payments SDK', 'core_products', 'North America', 'scaling', '2020-09-01', 9800000.00, 'contactless.dev@mastercard.com'),
('99999999-9999-9999-9999-999999999999', 'Tokenization Platform', 'core_products', 'North America', 'mature', '2014-11-01', 18600000.00, 'token.platform@mastercard.com'),

-- Data Services
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Data & Services - Transaction Insights', 'data_services', 'North America', 'mature', '2017-03-01', 22100000.00, 'insights.lead@mastercard.com'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test & Learn Platform', 'data_services', 'North America', 'scaling', '2021-06-15', 6400000.00, 'testlearn.pm@mastercard.com'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Consumer Clarity', 'data_services', 'North America', 'pilot', '2024-04-01', 1850000.00, 'clarity.product@mastercard.com'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Dynamic Yield', 'data_services', 'North America', 'scaling', '2022-08-01', 7500000.00, 'dynamicyield.owner@mastercard.com'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Fraud Detection AI Suite', 'data_services', 'North America', 'mature', '2016-10-01', 28400000.00, 'fraud.ai@mastercard.com'),

-- Partnerships
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Open Banking Connect', 'partnerships', 'North America', 'pilot', '2024-11-01', 3100000.00, 'openbanking.lead@mastercard.com'),
('10101010-1010-1010-1010-101010101010', 'Finicity - Account Verification', 'partnerships', 'North America', 'mature', '2020-02-01', 14800000.00, 'finicity.pm@mastercard.com'),
('20202020-2020-2020-2020-202020202020', 'Small Business Edge', 'partnerships', 'North America', 'pilot', '2024-06-15', 1650000.00, 'smb.edge@mastercard.com'),
('30303030-3030-3030-3030-303030303030', 'Crypto Secure', 'partnerships', 'North America', 'concept', NULL, 900000.00, 'crypto.innovation@mastercard.com');

-- Insert product readiness scores for REAL products
INSERT INTO public.product_readiness (product_id, compliance_complete, sales_training_pct, partner_enabled_pct, onboarding_complete, documentation_score, readiness_score, risk_band) VALUES
-- Mature products (high readiness)
('11111111-1111-1111-1111-111111111111', true, 98.00, 95.00, true, 96.00, 96.00, 'low'),
('66666666-6666-6666-6666-666666666666', true, 97.00, 98.00, true, 99.00, 98.00, 'low'),
('77777777-7777-7777-7777-777777777777', true, 94.00, 92.00, true, 95.00, 94.00, 'low'),
('99999999-9999-9999-9999-999999999999', true, 96.00, 94.00, true, 97.00, 95.00, 'low'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, 99.00, 96.00, true, 98.00, 97.00, 'low'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true, 95.00, 93.00, true, 96.00, 95.00, 'low'),
('10101010-1010-1010-1010-101010101010', true, 92.00, 90.00, true, 94.00, 92.00, 'low'),

-- Scaling products (medium readiness)
('22222222-2222-2222-2222-222222222222', true, 85.00, 78.00, true, 88.00, 83.00, 'medium'),
('88888888-8888-8888-8888-888888888888', true, 82.00, 75.00, true, 85.00, 80.00, 'medium'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, 78.00, 72.00, true, 80.00, 77.00, 'medium'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', true, 80.00, 74.00, true, 82.00, 79.00, 'medium'),

-- Pilot products (varied readiness)
('33333333-3333-3333-3333-333333333333', true, 68.00, 55.00, true, 72.00, 66.00, 'medium'),
('44444444-4444-4444-4444-444444444444', false, 62.00, 48.00, false, 65.00, 58.00, 'medium'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', true, 58.00, 45.00, true, 60.00, 56.00, 'medium'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', false, 52.00, 38.00, false, 58.00, 49.00, 'high'),
('20202020-2020-2020-2020-202020202020', false, 48.00, 35.00, false, 52.00, 44.00, 'high'),

-- Concept products (low readiness)
('55555555-5555-5555-5555-555555555555', false, 22.00, 10.00, false, 35.00, 20.00, 'high'),
('30303030-3030-3030-3030-303030303030', false, 18.00, 8.00, false, 28.00, 16.00, 'high');

-- Insert product metrics (December 2024 data)
INSERT INTO public.product_metrics (product_id, date, actual_revenue, adoption_rate, active_users, transaction_volume, churn_rate) VALUES
-- Mature products (strong performance)
('11111111-1111-1111-1111-111111111111', '2024-12-01', 1180000.00, 89.50, 245000, 8500000, 1.20),
('66666666-6666-6666-6666-666666666666', '2024-12-01', 2250000.00, 94.20, 425000, 15200000, 0.80),
('77777777-7777-7777-7777-777777777777', '2024-12-01', 1450000.00, 88.00, 185000, 6800000, 1.50),
('99999999-9999-9999-9999-999999999999', '2024-12-01', 1720000.00, 91.50, 312000, 9200000, 1.10),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2024-12-01', 2050000.00, 93.00, 385000, 12400000, 0.90),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-12-01', 2580000.00, 96.50, 450000, 18500000, 0.60),
('10101010-1010-1010-1010-101010101010', '2024-12-01', 1380000.00, 87.20, 198000, 7100000, 1.80),

-- Scaling products (growing performance)
('22222222-2222-2222-2222-222222222222', '2024-12-01', 685000.00, 72.50, 128000, 3200000, 2.80),
('88888888-8888-8888-8888-888888888888', '2024-12-01', 765000.00, 75.00, 145000, 3850000, 2.50),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-12-01', 485000.00, 68.00, 92000, 2100000, 3.20),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-12-01', 590000.00, 70.50, 105000, 2650000, 2.90),

-- Pilot products (early traction)
('33333333-3333-3333-3333-333333333333', '2024-12-01', 142000.00, 42.00, 12500, 485000, 5.80),
('44444444-4444-4444-4444-444444444444', '2024-12-01', 218000.00, 48.50, 18200, 720000, 4.90),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-12-01', 128000.00, 38.00, 9800, 380000, 6.50),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '2024-12-01', 185000.00, 35.00, 8500, 285000, 7.20),
('20202020-2020-2020-2020-202020202020', '2024-12-01', 95000.00, 28.50, 5200, 145000, 8.50);

-- Insert product predictions
INSERT INTO public.product_predictions (product_id, success_probability, revenue_probability, failure_risk, model_version, features) VALUES
-- Mature products (high confidence)
('11111111-1111-1111-1111-111111111111', 96.00, 94.00, 4.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "strong", "competitive_position": "leader"}'),
('66666666-6666-6666-6666-666666666666', 98.00, 96.00, 2.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "strong", "competitive_position": "leader"}'),
('77777777-7777-7777-7777-777777777777', 94.00, 92.00, 6.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "strong", "competitive_position": "leader"}'),
('99999999-9999-9999-9999-999999999999', 95.00, 93.00, 5.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "strong", "competitive_position": "leader"}'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 97.00, 95.00, 3.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong", "competitive_position": "leader"}'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 99.00, 97.00, 1.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong", "competitive_position": "leader"}'),
('10101010-1010-1010-1010-101010101010', 92.00, 90.00, 8.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "strong", "competitive_position": "strong"}'),

-- Scaling products (moderate confidence)
('22222222-2222-2222-2222-222222222222', 82.00, 78.00, 18.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong", "competitive_position": "growing"}'),
('88888888-8888-8888-8888-888888888888', 85.00, 80.00, 15.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "moderate", "competitive_position": "growing"}'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 78.00, 74.00, 22.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate", "competitive_position": "moderate"}'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 80.00, 76.00, 20.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "moderate", "competitive_position": "moderate"}'),

-- Pilot products (mixed outlook)
('33333333-3333-3333-3333-333333333333', 68.00, 62.00, 32.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "moderate", "competitive_position": "emerging"}'),
('44444444-4444-4444-4444-444444444444', 65.00, 58.00, 35.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate", "competitive_position": "emerging"}'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 58.00, 52.00, 42.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate", "competitive_position": "emerging"}'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 52.00, 45.00, 48.00, 'v2.1', '{"adoption_trend": "down", "market_fit": "weak", "competitive_position": "emerging"}'),
('20202020-2020-2020-2020-202020202020', 48.00, 42.00, 52.00, 'v2.1', '{"adoption_trend": "down", "market_fit": "weak", "competitive_position": "emerging"}'),

-- Concept products (uncertain)
('55555555-5555-5555-5555-555555555555', 35.00, 28.00, 65.00, 'v2.1', '{"adoption_trend": "unknown", "market_fit": "untested", "competitive_position": "concept"}'),
('30303030-3030-3030-3030-303030303030', 32.00, 25.00, 68.00, 'v2.1', '{"adoption_trend": "unknown", "market_fit": "untested", "competitive_position": "concept"}');

-- Insert product feedback (realistic Mastercard product feedback)
INSERT INTO public.product_feedback (product_id, source, raw_text, theme, sentiment_score, impact_level, volume) VALUES
-- BNPL Gateway
('33333333-3333-3333-3333-333333333333', 'Partner Feedback', 'Integration with Klarna/Affirm taking longer than expected, API documentation needs improvement', 'Integration Complexity', -0.55, 'High', 8),
('33333333-3333-3333-3333-333333333333', 'Customer Survey', 'BNPL option at checkout increased conversion by 18%', 'Business Value', 0.85, 'High', 12),

-- Click to Pay
('22222222-2222-2222-2222-222222222222', 'Customer Survey', 'One-click checkout reduced cart abandonment significantly', 'User Experience', 0.92, 'High', 45),
('22222222-2222-2222-2222-222222222222', 'Support Ticket', 'Consumer enrollment flow confusing for older demographics', 'User Experience', -0.42, 'Medium', 18),

-- Open Banking Connect
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Partner Feedback', 'Bank partnerships taking 6+ months to close, delaying launch', 'Partnership Delays', -0.75, 'High', 5),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Customer Survey', 'Account linking via Plaid integration works smoothly', 'Integration', 0.68, 'Medium', 7),

-- Fraud Detection AI
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Customer Survey', 'Reduced fraud losses by 63% while maintaining approval rates', 'Performance', 0.98, 'High', 125),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Support Ticket', 'ML model retraining documentation needs update for v3.2', 'Documentation', -0.28, 'Low', 3),

-- Mastercard Send
('11111111-1111-1111-1111-111111111111', 'Customer Survey', 'P2P transfers instant and reliable, customers love it', 'Performance', 0.94, 'High', 230),
('11111111-1111-1111-1111-111111111111', 'Partner Feedback', 'Would like multi-currency support for cross-border remittances', 'Feature Request', 0.65, 'Medium', 42),

-- Small Business Edge
('20202020-2020-2020-2020-202020202020', 'Customer Survey', 'SMB dashboard insights not actionable enough', 'Value', -0.48, 'High', 15),
('20202020-2020-2020-2020-202020202020', 'Support Ticket', 'Pricing too high for micro-businesses under 10 employees', 'Pricing', -0.72, 'High', 22);

-- Insert product actions (realistic governance actions)
INSERT INTO public.product_actions (product_id, action_type, priority, status, title, description, assigned_to, due_date) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'intervention', 'high', 'pending', 'Escalate Open Banking partnership delays to SteerCo', 'Bank partnerships exceeding 6mo timeline, need executive engagement', 'openbanking.lead@mastercard.com', '2025-01-15'),
('33333333-3333-3333-3333-333333333333', 'other', 'medium', 'in_progress', 'Improve BNPL API documentation', 'Partner feedback indicates integration docs need work', 'bnpl.lead@mastercard.com', '2025-01-20'),
('20202020-2020-2020-2020-202020202020', 'intervention', 'high', 'pending', 'Review Small Business Edge value proposition', 'Churn rate 8.5%, customer feedback indicates weak value prop', 'smb.edge@mastercard.com', '2025-01-10'),
('22222222-2222-2222-2222-222222222222', 'other', 'low', 'in_progress', 'Simplify Click to Pay enrollment for older users', 'Usability testing shows confusion in 55+ demographic', 'clicktopay.pm@mastercard.com', '2025-02-01');

-- Insert compliance records
INSERT INTO public.product_compliance (product_id, certification_type, status, completed_date, expiry_date, notes) VALUES
-- All payment products need PCI-DSS
('11111111-1111-1111-1111-111111111111', 'PCI-DSS', 'complete', '2024-03-15', '2025-03-15', 'Level 1 Service Provider'),
('22222222-2222-2222-2222-222222222222', 'PCI-DSS', 'complete', '2024-06-01', '2025-06-01', NULL),
('33333333-3333-3333-3333-333333333333', 'PCI-DSS', 'in_progress', NULL, NULL, 'Expected Q1 2025'),
('66666666-6666-6666-6666-666666666666', 'PCI-DSS', 'complete', '2024-01-10', '2025-01-10', 'Level 1 Service Provider'),
('99999999-9999-9999-9999-999999999999', 'PCI-DSS', 'complete', '2024-04-20', '2025-04-20', NULL),

-- SOC2 for data services
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SOC2', 'complete', '2024-09-01', '2025-09-01', 'Type II'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'SOC2', 'complete', '2024-11-15', '2025-11-15', 'Type II'),
('10101010-1010-1010-1010-101010101010', 'SOC2', 'complete', '2024-07-01', '2025-07-01', 'Type II'),

-- GDPR for applicable products
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GDPR', 'complete', '2024-05-01', NULL, 'Global compliance'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'GDPR', 'complete', '2024-08-15', NULL, 'Global compliance');

-- Insert sales training data
INSERT INTO public.sales_training (product_id, total_reps, trained_reps, last_training_date) VALUES
-- Mature products (high training completion)
('11111111-1111-1111-1111-111111111111', 150, 147, '2024-12-10'),
('66666666-6666-6666-6666-666666666666', 150, 146, '2024-12-05'),
('77777777-7777-7777-7777-777777777777', 150, 141, '2024-11-20'),
('99999999-9999-9999-9999-999999999999', 150, 144, '2024-12-01'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 150, 149, '2024-12-15'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 150, 143, '2024-11-28'),
('10101010-1010-1010-1010-101010101010', 150, 138, '2024-11-15'),

-- Scaling products (moderate training)
('22222222-2222-2222-2222-222222222222', 150, 128, '2024-10-30'),
('88888888-8888-8888-8888-888888888888', 150, 123, '2024-10-15'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 150, 117, '2024-09-20'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 150, 120, '2024-10-05'),

-- Pilot products (in-progress training)
('33333333-3333-3333-3333-333333333333', 150, 102, '2024-11-01'),
('44444444-4444-4444-4444-444444444444', 150, 93, '2024-10-10'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 150, 87, '2024-09-15'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 150, 78, '2024-08-25'),
('20202020-2020-2020-2020-202020202020', 150, 72, '2024-08-10');
