-- Comprehensive Product Data Enhancement - FULLY CORRECTED
-- This version matches the ACTUAL table schemas exactly
-- Adds realistic, product-specific data across all dimensions

-- ============================================
-- PRODUCT ACTIONS (Governance)
-- ============================================
-- Schema: (product_id, action_type, title, description, assigned_to, status, priority, due_date)

INSERT INTO public.product_actions (product_id, action_type, title, description, assigned_to, status, priority, due_date) VALUES

-- MATURE PRODUCTS (Maintenance & Optimization Actions)
('11111111-1111-1111-1111-111111111111', 'review', 'Q1 2025 Performance Review', 'Annual performance assessment for mature product. Review adoption metrics, competitive positioning, and cost optimization opportunities.', 'send.product@mastercard.com', 'pending', 'medium', '2025-02-15'),
('11111111-1111-1111-1111-111111111111', 'compliance', 'PSD3 Compliance Assessment', 'Evaluate impact of upcoming PSD3 regulations on Send product. Engage compliance and legal teams for gap analysis.', 'send.product@mastercard.com', 'in_progress', 'high', '2025-01-31'),

('66666666-6666-6666-6666-666666666666', 'other', 'API v4 Deprecation Planning', 'Plan migration strategy for customers still on API v3. Set timeline for v3 sunset (90-day notice required).', 'gateway.pm@mastercard.com', 'pending', 'high', '2025-02-28'),
('66666666-6666-6666-6666-666666666666', 'review', 'Cost Optimization Initiative', 'Infrastructure costs increased 15% YoY. Review cloud spend, optimize database queries, implement caching strategies.', 'gateway.pm@mastercard.com', 'in_progress', 'medium', '2025-03-15'),

('77777777-7777-7777-7777-777777777777', 'partner', 'Issuer Integration Expansion', 'Onboard 5 new issuing banks in Q1 2025. Priority: Chase, Wells Fargo, PNC.', 'virtualcard.owner@mastercard.com', 'in_progress', 'high', '2025-03-31'),

('99999999-9999-9999-9999-999999999999', 'compliance', 'PCI-DSS 4.0 Migration', 'Migrate tokenization infrastructure to PCI-DSS 4.0 standards. Legacy systems need upgrade by March 2025.', 'token.platform@mastercard.com', 'in_progress', 'critical', '2025-03-15'),
('99999999-9999-9999-9999-999999999999', 'other', 'EMVCo Token Specification Update', 'Implement EMVCo 3.0 token specification. Required for interoperability with Visa/Amex networks.', 'token.platform@mastercard.com', 'pending', 'high', '2025-04-30'),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'other', 'Real-time Insights MVP', 'Launch real-time transaction insights (sub-second latency). Currently 15-minute delay. Pilot with 3 enterprise clients.', 'insights.lead@mastercard.com', 'in_progress', 'high', '2025-02-28'),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'review', 'Model Performance Review Q4 2024', 'AI model accuracy decreased 2.3% in Q4. Investigate data drift, retrain models with updated fraud patterns.', 'fraud.ai@mastercard.com', 'completed', 'critical', '2024-12-31'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'other', 'Generative AI Integration Research', 'Evaluate GPT-4/Claude for fraud pattern detection. Run PoC with 6 months historical fraud data.', 'fraud.ai@mastercard.com', 'pending', 'medium', '2025-03-15'),

('10101010-1010-1010-1010-101010101010', 'partner', 'Bank API Rate Limit Issues', 'Chase and Bank of America API rate limits causing 12% failed verification requests. Negotiate higher limits or implement retry logic.', 'finicity.pm@mastercard.com', 'in_progress', 'high', '2025-01-31'),

-- SCALING PRODUCTS (Growth & Expansion Actions)
('22222222-2222-2222-2222-222222222222', 'intervention', 'Merchant Onboarding Acceleration', 'Merchant onboarding taking 45 days avg (target: 21 days). Streamline KYC process, add self-service portal.', 'clicktopay.pm@mastercard.com', 'in_progress', 'high', '2025-02-15'),
('22222222-2222-2222-2222-222222222222', 'other', 'UX Simplification for 55+ Demographics', 'Enrollment flow confusing for older users (23% drop-off). Conduct user testing, simplify 3-step enrollment.', 'clicktopay.pm@mastercard.com', 'pending', 'medium', '2025-03-31'),
('22222222-2222-2222-2222-222222222222', 'review', 'EU Market Expansion Readiness', 'Assess readiness for EU launch Q2 2025. Compliance (GDPR, PSD2), localization (15 languages), partner enablement.', 'clicktopay.pm@mastercard.com', 'pending', 'high', '2025-01-31'),

('88888888-8888-8888-8888-888888888888', 'training', 'Developer Documentation Enhancement', 'SDK documentation scored 6.2/10 by developers. Rewrite getting-started guide, add video tutorials, expand code samples.', 'contactless.dev@mastercard.com', 'in_progress', 'medium', '2025-02-28'),
('88888888-8888-8888-8888-888888888888', 'other', 'iOS 18 Compatibility Update', 'Apple iOS 18 breaking changes affecting NFC tap-to-pay. Emergency SDK update required before iOS 18 GA.', 'contactless.dev@mastercard.com', 'in_progress', 'critical', '2025-01-15'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'intervention', 'Sales Training Gap - Feature Awareness', 'Only 62% of sales team aware of A/B testing features. Schedule 3 training sessions, create demo scripts.', 'testlearn.pm@mastercard.com', 'pending', 'high', '2025-02-15'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'partner', 'Data Integration - Snowflake Connector', 'Enterprise clients requesting Snowflake integration. Build connector, certify with Snowflake partner program.', 'testlearn.pm@mastercard.com', 'pending', 'medium', '2025-03-31'),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'review', 'Pricing Model Optimization', 'Customer feedback: pricing too complex (7 tiers). Simplify to 3 tiers (Standard, Professional, Enterprise).', 'dynamicyield.owner@mastercard.com', 'in_progress', 'high', '2025-02-28'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'other', 'Retail Vertical Expansion', 'Strong traction in e-commerce. Develop retail-specific features: in-store personalization, POS integration.', 'dynamicyield.owner@mastercard.com', 'pending', 'medium', '2025-04-30'),

-- PILOT PRODUCTS (Validation & Scaling Prep Actions)
('33333333-3333-3333-3333-333333333333', 'partner', 'Klarna Integration Performance Issues', 'Klarna integration taking 8.2s avg (SLA: 3s). Optimize API calls, implement caching, parallel requests.', 'bnpl.lead@mastercard.com', 'in_progress', 'critical', '2025-01-31'),
('33333333-3333-3333-3333-333333333333', 'training', 'Partner Documentation Update', 'Affirm integration guide missing error handling examples. 18 support tickets in December for same issue.', 'bnpl.lead@mastercard.com', 'pending', 'high', '2025-02-15'),
('33333333-3333-3333-3333-333333333333', 'compliance', 'Consumer Disclosure Requirements - CFPB', 'New CFPB rules for BNPL disclosures effective Feb 2025. Update API to require disclosure URLs in checkout flow.', 'bnpl.lead@mastercard.com', 'in_progress', 'critical', '2025-02-01'),

('44444444-4444-4444-4444-444444444444', 'intervention', 'FX Rate Transparency Feedback', 'Customers reporting FX markups not disclosed upfront. Add FX rate preview before payment confirmation.', 'b2b.payments@mastercard.com', 'in_progress', 'high', '2025-01-31'),
('44444444-4444-4444-4444-444444444444', 'compliance', 'SWIFT gpi Compliance Certification', 'Pilot customers require SWIFT gpi certification for cross-border tracking. Schedule audit, implement tracking APIs.', 'b2b.payments@mastercard.com', 'pending', 'high', '2025-03-15'),
('44444444-4444-4444-4444-444444444444', 'partner', 'Banking Partner Expansion - Asia', 'Need 5 additional banking partners in APAC for corridor coverage. Target: DBS, HSBC, ICBC, Standard Chartered.', 'b2b.payments@mastercard.com', 'pending', 'medium', '2025-04-30'),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'intervention', 'Adoption Rate Below Target', 'Adoption at 38% vs 60% target. Root cause analysis shows value proposition unclear. Revamp marketing materials.', 'clarity.product@mastercard.com', 'in_progress', 'high', '2025-02-15'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'training', 'Sales Team Certification Program', 'Only 45% of sales team certified on Consumer Clarity. Mandatory certification by Feb 15.', 'clarity.product@mastercard.com', 'pending', 'high', '2025-02-15'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'review', 'Pilot Results Analysis', '6-month pilot complete. Analyze results: adoption drivers, churn reasons, feature usage patterns.', 'clarity.product@mastercard.com', 'pending', 'medium', '2025-01-31'),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'partner', 'Bank Partnership Delays - Escalate to SteerCo', 'Critical: Bank of America, Chase, Wells Fargo partnerships 6+ months behind schedule. Executive engagement required.', 'openbanking.lead@mastercard.com', 'in_progress', 'critical', '2025-01-15'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'compliance', 'Financial Data Rights (FDR) Rule Compliance', 'CFPB Financial Data Rights rule effective Oct 2025. Major changes to data sharing, consent management required.', 'openbanking.lead@mastercard.com', 'pending', 'critical', '2025-03-31'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'intervention', 'Readiness Score Critical - 49%', 'Product readiness 49% (target: 70% for pilot). Critical gaps: compliance (incomplete), partner enablement (38%).', 'openbanking.lead@mastercard.com', 'in_progress', 'critical', '2025-02-01'),

('20202020-2020-2020-2020-202020202020', 'intervention', 'High Churn Rate - 8.5%', 'Churn at 8.5% (healthy: 3%). Exit interviews show: value proposition not clear, onboarding too complex.', 'smb.edge@mastercard.com', 'in_progress', 'critical', '2025-01-31'),
('20202020-2020-2020-2020-202020202020', 'review', 'Value Proposition Refinement', 'Conduct customer interviews (20 churned, 20 active). Identify top 3 value drivers, update positioning.', 'smb.edge@mastercard.com', 'pending', 'high', '2025-02-15'),
('20202020-2020-2020-2020-202020202020', 'training', 'SMB Sales Specialist Training', 'General sales team struggling with SMB context. Train 15 SMB specialists, create SMB-specific pitch deck.', 'smb.edge@mastercard.com', 'pending', 'medium', '2025-03-01'),

-- CONCEPT PRODUCTS (Validation & PoC Actions)
('55555555-5555-5555-5555-555555555555', 'other', 'Market Research - Competitor Analysis', 'Analyze Venmo, Zelle, CashApp positioning. Identify differentiation opportunities for Move product.', 'move.innovation@mastercard.com', 'in_progress', 'medium', '2025-02-28'),
('55555555-5555-5555-5555-555555555555', 'review', 'Concept Validation - User Interviews', 'Conduct 30 user interviews (Gen Z, Millennials). Validate P2P payment pain points, test Move value props.', 'move.innovation@mastercard.com', 'pending', 'high', '2025-02-15'),
('55555555-5555-5555-5555-555555555555', 'compliance', 'Regulatory Requirements Research', 'Research money transmitter licensing requirements across 50 states. Engage legal team for compliance roadmap.', 'move.innovation@mastercard.com', 'pending', 'high', '2025-03-31'),

('30303030-3030-3030-3030-303030303030', 'review', 'FinCEN Travel Rule Compliance Assessment', 'Crypto transactions >$3K require Travel Rule compliance. Assess technical requirements for KYC/AML integration.', 'crypto.innovation@mastercard.com', 'pending', 'critical', '2025-02-28'),
('30303030-3030-3030-3030-303030303030', 'partner', 'Crypto Exchange Partnership Strategy', 'Evaluate partnerships: Coinbase, Kraken, Gemini. Determine partnership model (revenue share vs flat fee).', 'crypto.innovation@mastercard.com', 'in_progress', 'high', '2025-03-15'),
('30303030-3030-3030-3030-303030303030', 'other', 'Proof of Concept - Stablecoin Custody', 'Build PoC for USDC/USDT custody solution. Test with $100K testnet funds, validate security controls.', 'crypto.innovation@mastercard.com', 'pending', 'medium', '2025-04-30');


-- ============================================
-- CUSTOMER FEEDBACK
-- ============================================
-- Schema: (product_id, source, raw_text, theme, sentiment_score, impact_level, volume)

INSERT INTO public.product_feedback (product_id, source, sentiment_score, raw_text, theme, impact_level, volume) VALUES

-- MATURE PRODUCTS
('11111111-1111-1111-1111-111111111111', 'Customer Survey', 0.88, 'Send has been rock-solid for our remittance business. Processing 50K transactions/month with 99.97% success rate.', 'reliability', 'low', 15),
('11111111-1111-1111-1111-111111111111', 'Partner Feedback', -0.32, 'API latency increased 18% in December. Our SLA is 500ms, seeing 650ms p95 latency. Need investigation.', 'performance', 'medium', 8),
('11111111-1111-1111-1111-111111111111', 'Support Ticket', 0.45, 'Would love to see real-time status updates for recipients. Currently 15-minute delay for delivery confirmation.', 'feature_request', 'low', 12),

('66666666-6666-6666-6666-666666666666', 'Customer Survey', 0.92, 'Gateway is the backbone of our payment infrastructure. Uptime has been flawless - zero incidents in 6 months.', 'reliability', 'low', 32),
('66666666-6666-6666-6666-666666666666', 'Partner Feedback', 0.78, 'Multi-currency support is excellent. Processed $12M across 47 currencies last month without issues.', 'functionality', 'low', 18),
('66666666-6666-6666-6666-666666666666', 'Support Ticket', -0.58, 'Dashboard UX is dated. Competitors (Stripe, Adyen) have much cleaner dashboards. Considering switch if not updated.', 'ux', 'medium', 22),

('77777777-7777-7777-7777-777777777777', 'Customer Survey', 0.85, 'Virtual cards perfect for our corporate expense management. Instant issuance and granular controls are game-changers.', 'functionality', 'low', 28),
('77777777-7777-7777-7777-777777777777', 'Partner Feedback', -0.48, 'Onboarding new issuers takes 4-6 months. Way too long. Need faster integration process or plug-and-play SDK.', 'integration', 'high', 6),
('77777777-7777-7777-7777-777777777777', 'Customer Survey', 0.65, 'Card lifecycle management API is powerful but documentation is sparse. Took us 3 weeks to implement freeze/unfreeze.', 'documentation', 'medium', 14),

('99999999-9999-9999-9999-999999999999', 'Customer Survey', 0.94, 'Tokenization reduced our PCI scope by 80%. Compliance audit went from 6 weeks to 1 week. Massive ROI.', 'security', 'low', 45),
('99999999-9999-9999-9999-999999999999', 'Partner Feedback', 0.82, 'Token vault performance is excellent. Handling 2M token lookups/day with sub-50ms latency.', 'performance', 'low', 19),
('99999999-9999-9999-9999-999999999999', 'Support Ticket', -0.35, 'Need support for network tokenization (Apple Pay, Google Pay). Currently only supporting merchant tokens.', 'feature_request', 'low', 11),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Customer Survey', 0.91, 'Transaction Insights helped us identify $2.3M in fraud we would have missed. ROI paid for itself in 2 months.', 'value', 'low', 38),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Partner Feedback', 0.76, 'Merchant insights dashboard is our CFO''s favorite tool. Uses it daily for revenue forecasting and trend analysis.', 'analytics', 'low', 25),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Support Ticket', 0.42, 'Would love real-time alerts for anomalies. Currently 15-minute latency means we miss time-sensitive patterns.', 'feature_request', 'high', 16),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Customer Survey', 0.98, 'Fraud losses down 63% YoY while approval rates stayed flat. Best fraud solution we''ve ever deployed.', 'value', 'low', 52),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Partner Feedback', 0.89, 'False positive rate dropped from 12% to 3.5%. Saved us $850K in manual review costs.', 'accuracy', 'low', 31),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Customer Survey', 0.72, 'Model explainability has improved but still want more detail. Need to understand WHY transactions flagged for compliance.', 'transparency', 'medium', 18),

('10101010-1010-1010-1010-101010101010', 'Customer Survey', 0.84, 'Account verification is 10x faster than traditional micro-deposits. 2 minutes vs 2 days. Game changer for UX.', 'speed', 'low', 29),
('10101010-1010-1010-1010-101010101010', 'Partner Feedback', -0.52, 'Bank API rate limits causing failed verifications for 12% of users. Chase and BofA most problematic.', 'reliability', 'critical', 8),
('10101010-1010-1010-1010-101010101010', 'Support Ticket', 0.38, 'Would love instant balance updates. Currently only get balances when user reconnects account.', 'feature_request', 'low', 14),

-- SCALING PRODUCTS
('22222222-2222-2222-2222-222222222222', 'Customer Survey', 0.92, 'One-click checkout reduced cart abandonment by 28%. Customers love not re-entering card details every purchase.', 'ux', 'low', 42),
('22222222-2222-2222-2222-222222222222', 'Partner Feedback', -0.45, 'Merchant onboarding is painful. 45-day average time to go live. Competitors (Shop Pay) are 7 days.', 'onboarding', 'critical', 11),
('22222222-2222-2222-2222-222222222222', 'Support Ticket', -0.38, 'Enrollment flow confusing for older demographics (55+). 23% drop-off rate during signup. Need simplification.', 'ux', 'high', 18),
('22222222-2222-2222-2222-222222222222', 'Customer Survey', 0.78, 'Mobile checkout experience is seamless. Conversion rate on mobile up 34% since Click to Pay launch.', 'mobile', 'low', 24),

('88888888-8888-8888-8888-888888888888', 'Partner Feedback', 0.68, 'SDK works great once implemented but documentation is lacking. Took our team 3 weeks when it should be 3 days.', 'documentation', 'critical', 9),
('88888888-8888-8888-8888-888888888888', 'Support Ticket', -0.72, 'iOS 18 beta is breaking NFC tap-to-pay functionality. Need urgent fix before iOS 18 public release.', 'bug', 'critical', 15),
('88888888-8888-8888-8888-888888888888', 'Customer Survey', 0.55, 'Android implementation smooth. iOS has quirks with NFC session management that need better error handling.', 'platform_specific', 'medium', 12),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Customer Survey', 0.72, 'A/B testing platform helped us optimize checkout flow. 18% conversion lift from one experiment.', 'value', 'low', 16),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Partner Feedback', -0.42, 'Statistical significance calculations seem off. Ran same test twice, got different confidence intervals.', 'accuracy', 'high', 7),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Support Ticket', 0.35, 'Would love Snowflake integration. Currently exporting CSVs manually which is tedious for large datasets.', 'integration', 'low', 11),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Customer Survey', 0.58, 'UI is functional but not intuitive. Had to watch 4 tutorial videos to understand experiment setup.', 'ux', 'medium', 13),

('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Customer Survey', 0.81, 'Personalization engine increased our average order value by 22%. ROI was positive in first quarter.', 'value', 'low', 21),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Partner Feedback', -0.55, 'Pricing is too complex. 7 tiers with overlapping features. Took 3 sales calls to understand which tier we needed.', 'pricing', 'critical', 14),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Support Ticket', 0.48, 'E-commerce features are strong. Would love in-store personalization for our retail locations.', 'feature_request', 'high', 8),

-- PILOT PRODUCTS
('33333333-3333-3333-3333-333333333333', 'Partner Feedback', -0.55, 'Klarna integration taking 8+ seconds per transaction. Way too slow for checkout experience. Need urgent optimization.', 'performance', 'critical', 8),
('33333333-3333-3333-3333-333333333333', 'Support Ticket', -0.68, 'Error handling is poor. When Affirm rejects customer, we get generic error. Need specific decline reasons for UX.', 'integration', 'high', 12),
('33333333-3333-3333-3333-333333333333', 'Customer Survey', 0.62, 'Multi-provider support is unique value prop. Can offer Klarna, Affirm, Afterpay from one API. Love it.', 'functionality', 'low', 6),
('33333333-3333-3333-3333-333333333333', 'Partner Feedback', 0.45, 'Sandbox environment is well-built. Helped us test all edge cases before production launch.', 'developer_experience', 'low', 4),

('44444444-4444-4444-4444-444444444444', 'Customer Survey', 0.58, 'Cross-border payments finally simple. Used to take 5-7 days, now 24-48 hours. Big improvement for our supply chain.', 'speed', 'low', 9),
('44444444-4444-4444-4444-444444444444', 'Partner Feedback', -0.62, 'FX markups not transparent. Customers complaining they don''t see exchange rate until after payment confirmed.', 'transparency', 'critical', 7),
('44444444-4444-4444-4444-444444444444', 'Support Ticket', -0.48, 'Need more banking corridors. Currently only 12 countries supported. Customers need India, Brazil, Indonesia.', 'feature_request', 'high', 11),
('44444444-4444-4444-4444-444444444444', 'Customer Survey', 0.52, 'Payment tracking is decent but not real-time. Would love SWIFT gpi tracking for enterprise clients.', 'feature_request', 'medium', 5),

('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Customer Survey', 0.42, 'Concept is interesting but value proposition unclear. Not sure how this is different from existing transaction categorization tools.', 'value_prop', 'high', 8),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Partner Feedback', -0.58, 'Adoption below expectations. Only 38% of pilot users activated feature. Need better onboarding and education.', 'adoption', 'critical', 6),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Support Ticket', 0.28, 'Categorization accuracy is 78% which is okay but not great. Miscategorizes food delivery as groceries frequently.', 'accuracy', 'medium', 9),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Customer Survey', 0.55, 'Insights dashboard is clean. Love the spending trends visualization. Helps with budgeting.', 'ux', 'low', 7),

('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Partner Feedback', -0.78, 'Bank partnerships 6+ months behind schedule. Can''t launch product without BofA, Chase, Wells Fargo. Extremely frustrated.', 'partnership', 'critical', 5),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Support Ticket', -0.82, 'API reliability is poor. 15% failure rate for account connections. Users giving up after 2-3 failed attempts.', 'reliability', 'high', 7),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Customer Survey', -0.35, 'Concept is strong but execution needs work. When it works, it''s great. But "when it works" is only 60% of the time.', 'reliability', 'medium', 6),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Partner Feedback', 0.38, 'OAuth flow is well-designed. Security team approved implementation after thorough audit.', 'security', 'low', 3),

('20202020-2020-2020-2020-202020202020', 'Customer Survey', -0.68, 'Churned after 2 months. Value proposition wasn''t clear. Seemed like generic SMB tools bundled together. Not compelling.', 'value_prop', 'critical', 15),
('20202020-2020-2020-2020-202020202020', 'Partner Feedback', -0.72, 'Onboarding took 3 weeks. Too complex for small business owners. Need QuickBooks-level simplicity.', 'onboarding', 'high', 11),
('20202020-2020-2020-2020-202020202020', 'Support Ticket', 0.32, 'Cash flow forecasting feature is useful. Helped us avoid overdraft twice last month.', 'functionality', 'low', 6),
('20202020-2020-2020-2020-202020202020', 'Customer Survey', -0.45, 'Pricing seems high for small businesses ($199/mo). Competitors offering similar tools for $49-99/mo.', 'pricing', 'medium', 9),

-- CONCEPT PRODUCTS
('55555555-5555-5555-5555-555555555555', 'User Interview', 0.68, 'Gen Z feedback: Venmo and CashApp work fine. Would need compelling reason to switch. Maybe crypto integration?', 'market_research', 'low', 12),
('55555555-5555-5555-5555-555555555555', 'Focus Group', 0.45, 'Millennials: Interested in no-fee international P2P. Sending money to family abroad is painful and expensive.', 'market_research', 'high', 8),
('55555555-5555-5555-5555-555555555555', 'User Interview', -0.28, 'Trust concern: Why use Mastercard Move vs Venmo which all my friends use? Network effects are real barrier.', 'market_research', 'medium', 7),

('30303030-3030-3030-3030-303030303030', 'Market Research', 0.52, 'Enterprise interest in stablecoin custody. CFOs want crypto exposure without self-custody risk. Mastercard brand = trust.', 'market_research', 'low', 5),
('30303030-3030-3030-3030-303030303030', 'Focus Group', -0.42, 'Regulatory uncertainty is huge concern. FinCEN Travel Rule compliance seems expensive and complex.', 'market_research', 'high', 6),
('30303030-3030-3030-3030-303030303030', 'User Interview', 0.58, 'Crypto traders: Would use Mastercard-backed solution for on/off ramp. Better than sketchy exchanges.', 'market_research', 'low', 4);


-- ============================================
-- SALES TRAINING
-- ============================================
-- Schema: (product_id, total_reps, trained_reps, last_training_date)
-- Note: coverage_pct is auto-generated; UNIQUE constraint on product_id

INSERT INTO public.sales_training (product_id, total_reps, trained_reps, last_training_date) VALUES

-- MATURE PRODUCTS (High training coverage ~95%)
('11111111-1111-1111-1111-111111111111', 148, 144, '2024-12-01'),
('66666666-6666-6666-6666-666666666666', 148, 141, '2024-12-10'),
('77777777-7777-7777-7777-777777777777', 148, 139, '2024-12-05'),
('99999999-9999-9999-9999-999999999999', 148, 142, '2024-12-12'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 148, 147, '2024-12-18'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 148, 141, '2024-12-15'),
('10101010-1010-1010-1010-101010101010', 148, 136, '2024-12-01'),

-- SCALING PRODUCTS (Good training coverage ~80%)
('22222222-2222-2222-2222-222222222222', 148, 126, '2024-12-20'),
('88888888-8888-8888-8888-888888888888', 148, 121, '2024-11-28'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 148, 107, '2024-12-12'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 148, 118, '2024-12-08'),

-- PILOT PRODUCTS (Lower training coverage ~55%)
('33333333-3333-3333-3333-333333333333', 148, 92, '2024-12-15'),
('44444444-4444-4444-4444-444444444444', 148, 86, '2024-11-28'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 148, 67, '2024-12-18'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 148, 71, '2024-12-10'),
('20202020-2020-2020-2020-202020202020', 148, 62, '2024-11-30'),

-- CONCEPT PRODUCTS (Minimal training ~20%)
('55555555-5555-5555-5555-555555555555', 148, 30, '2024-12-15'),
('30303030-3030-3030-3030-303030303030', 148, 24, '2024-12-01');


-- ============================================
-- PRODUCT PARTNERS
-- ============================================
-- Schema: (product_id, partner_name, enabled, onboarded_date, integration_status)
-- NOTE: NO partnership_type, status, contract dates, or revenue_share columns

INSERT INTO public.product_partners (product_id, partner_name, enabled, onboarded_date, integration_status) VALUES

-- Open Banking Connect
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Plaid', true, '2024-11-01', 'in_progress'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Bank of America', false, NULL, 'not_started'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Chase', false, NULL, 'not_started'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Wells Fargo', false, NULL, 'not_started'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Capital One', true, '2024-11-15', 'complete'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Ally Bank', true, '2024-12-01', 'complete'),

-- Finicity
('10101010-1010-1010-1010-101010101010', 'Bank of America', true, '2020-02-01', 'complete'),
('10101010-1010-1010-1010-101010101010', 'Chase', true, '2020-03-15', 'complete'),
('10101010-1010-1010-1010-101010101010', 'Wells Fargo', true, '2020-04-01', 'complete'),
('10101010-1010-1010-1010-101010101010', 'Citibank', true, '2020-06-15', 'complete'),
('10101010-1010-1010-1010-101010101010', 'US Bank', true, '2020-08-01', 'complete'),
('10101010-1010-1010-1010-101010101010', 'PNC Bank', true, '2021-01-15', 'complete'),
('10101010-1010-1010-1010-101010101010', 'Capital One', true, '2021-03-01', 'complete'),

-- Small Business Edge
('20202020-2020-2020-2020-202020202020', 'QuickBooks', true, '2024-06-15', 'complete'),
('20202020-2020-2020-2020-202020202020', 'Gusto', true, '2024-09-01', 'in_progress'),
('20202020-2020-2020-2020-202020202020', 'Shopify', false, NULL, 'not_started'),
('20202020-2020-2020-2020-202020202020', 'Square', true, '2024-10-01', 'in_progress'),

-- Crypto Secure
('30303030-3030-3030-3030-303030303030', 'Coinbase', false, NULL, 'not_started'),
('30303030-3030-3030-3030-303030303030', 'Kraken', false, NULL, 'not_started'),
('30303030-3030-3030-3030-303030303030', 'Fireblocks', true, '2024-12-01', 'in_progress'),

-- BNPL Gateway
('33333333-3333-3333-3333-333333333333', 'Klarna', true, '2024-10-01', 'complete'),
('33333333-3333-3333-3333-333333333333', 'Affirm', true, '2024-10-15', 'complete'),
('33333333-3333-3333-3333-333333333333', 'Afterpay', true, '2024-11-01', 'in_progress'),
('33333333-3333-3333-3333-333333333333', 'Zip', false, NULL, 'not_started'),

-- Cross-Border B2B Payments
('44444444-4444-4444-4444-444444444444', 'HSBC', true, '2024-07-15', 'complete'),
('44444444-4444-4444-4444-444444444444', 'Standard Chartered', true, '2024-08-01', 'complete'),
('44444444-4444-4444-4444-444444444444', 'Citibank', true, '2024-09-01', 'complete'),
('44444444-4444-4444-4444-444444444444', 'DBS Bank', false, NULL, 'not_started'),
('44444444-4444-4444-4444-444444444444', 'ICBC', false, NULL, 'not_started');


-- ============================================
-- PRODUCT COMPLIANCE
-- ============================================
-- Schema: (product_id, certification_type, status, completed_date, expiry_date, notes)
-- NOTE: Each certification is a SEPARATE ROW, not a column
-- UNIQUE constraint on (product_id, certification_type)

-- Additional compliance certifications for mature products
INSERT INTO public.product_compliance (product_id, certification_type, status, completed_date, expiry_date, notes) VALUES

-- Mastercard Send - additional compliance
('11111111-1111-1111-1111-111111111111', 'SOC2', 'complete', '2024-05-10', '2025-05-10', 'Type II certification'),
('11111111-1111-1111-1111-111111111111', 'ISO-27001', 'complete', '2024-07-15', '2027-07-15', 'Information Security Management'),

-- Gateway - additional compliance
('66666666-6666-6666-6666-666666666666', 'SOC2', 'complete', '2024-02-20', '2025-02-20', 'Type II certification'),
('66666666-6666-6666-6666-666666666666', 'ISO-27001', 'complete', '2024-04-01', '2027-04-01', 'Information Security Management'),

-- Virtual Cards - additional compliance
('77777777-7777-7777-7777-777777777777', 'PCI-DSS', 'complete', '2024-05-15', '2025-05-15', 'Level 1 Service Provider'),
('77777777-7777-7777-7777-777777777777', 'SOC2', 'complete', '2024-06-01', '2025-06-01', 'Type II certification'),

-- Tokenization - additional compliance
('99999999-9999-9999-9999-999999999999', 'SOC2', 'complete', '2024-08-10', '2025-08-10', 'Type II certification'),
('99999999-9999-9999-9999-999999999999', 'ISO-27001', 'complete', '2024-09-01', '2027-09-01', 'Information Security Management'),

-- Click to Pay
('22222222-2222-2222-2222-222222222222', 'SOC2', 'in_progress', NULL, NULL, 'Expected completion Q1 2025'),
('22222222-2222-2222-2222-222222222222', 'GDPR', 'complete', '2024-03-01', NULL, 'EU expansion compliance'),

-- Contactless SDK
('88888888-8888-8888-8888-888888888888', 'SOC2', 'complete', '2024-10-15', '2025-10-15', 'Type II certification'),

-- Test & Learn
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SOC2', 'in_progress', NULL, NULL, 'Scheduled for Q1 2025'),

-- Dynamic Yield
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'SOC2', 'complete', '2024-09-20', '2025-09-20', 'Type II certification'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'GDPR', 'complete', '2024-05-25', NULL, 'EU customer data compliance'),

-- BNPL Gateway
('33333333-3333-3333-3333-333333333333', 'SOC2', 'in_progress', NULL, NULL, 'Target: Q2 2025'),

-- Cross-Border B2B
('44444444-4444-4444-4444-444444444444', 'PCI-DSS', 'in_progress', NULL, NULL, 'Pilot phase - certification in progress'),
('44444444-4444-4444-4444-444444444444', 'SWIFT CSP', 'pending', NULL, NULL, 'Customer Security Programme assessment needed'),

-- Consumer Clarity
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'SOC2', 'pending', NULL, NULL, 'Pilot phase - not yet required'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'GDPR', 'complete', '2024-04-15', NULL, 'Pilot includes EU participants'),

-- Open Banking Connect
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'PCI-DSS', 'in_progress', NULL, NULL, 'Critical blocker - expected Feb 2025'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'GDPR', 'complete', '2024-11-01', NULL, 'EU pilot compliance'),

-- Small Business Edge
('20202020-2020-2020-2020-202020202020', 'SOC2', 'pending', NULL, NULL, 'Scheduled for Q1 2025'),

-- Concept products (compliance roadmap)
('55555555-5555-5555-5555-555555555555', 'FinCEN MSB', 'pending', NULL, NULL, 'Money transmitter licensing required across states'),
('30303030-3030-3030-3030-303030303030', 'FinCEN Travel Rule', 'pending', NULL, NULL, 'Crypto transaction compliance required');
