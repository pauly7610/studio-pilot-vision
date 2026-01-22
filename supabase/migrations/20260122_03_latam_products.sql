-- ============================================
-- Latin America & Caribbean Products
-- New products for the LAC region
-- ============================================
-- Run this AFTER 20260122_02_reorganize_product_regions.sql

-- ============================================
-- PRODUCTS (6 Total for LAC Region)
-- ============================================
-- Product IDs use pattern: d1d1d1d1-... for LAC products

INSERT INTO public.products (id, name, product_type, region, lifecycle_stage, launch_date, revenue_target, owner_email, success_metric, governance_tier) VALUES

-- PIX Integration (Brazil - instant payments)
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'PIX Gateway Integration', 'payment_flows', 'Latin America & Caribbean', 'scaling', '2023-11-01', 15500000.00, 'pix.brazil@mastercard.com', 'PIX Transaction Volume', 'tier_3'),

-- Mercado Pago Partnership (Regional e-commerce)
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Mercado Pago Connect', 'partnerships', 'Latin America & Caribbean', 'mature', '2021-06-15', 22000000.00, 'mercadopago.partner@mastercard.com', 'Partner GMV Growth', 'tier_3'),

-- Nubank Card Services (Brazil's largest digital bank)
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Nubank Card Issuance Platform', 'core_products', 'Latin America & Caribbean', 'mature', '2019-03-01', 28000000.00, 'nubank.partnership@mastercard.com', 'Cards Issued', 'tier_3'),

-- SPEI Mexico Integration
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'SPEI Real-Time Payments', 'payment_flows', 'Latin America & Caribbean', 'pilot', '2024-09-01', 6200000.00, 'spei.mexico@mastercard.com', 'Settlement Speed', 'tier_2'),

-- Rappi Super App Integration (Colombia)
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Rappi Super App Integration', 'partnerships', 'Latin America & Caribbean', 'scaling', '2024-01-15', 8900000.00, 'rappi.latam@mastercard.com', 'In-App Payment Volume', 'tier_2'),

-- Caribbean Tourism Payments (Multi-country)
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Caribbean Tourism Payments Hub', 'payment_flows', 'Latin America & Caribbean', 'concept', NULL, 3500000.00, 'caribbean.tourism@mastercard.com', 'Tourist Transaction Share', 'tier_1');


-- ============================================
-- PRODUCT READINESS SCORES
-- ============================================

INSERT INTO public.product_readiness (product_id, compliance_complete, sales_training_pct, partner_enabled_pct, onboarding_complete, documentation_score, readiness_score, risk_band) VALUES
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', true, 88, 85, true, 82, 85, 'low'),      -- PIX Gateway - Scaling well
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', true, 95, 100, true, 94, 95, 'low'),     -- Mercado Pago - Mature
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', true, 97, 100, true, 96, 96, 'low'),     -- Nubank - Mature flagship
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', false, 55, 45, true, 58, 52, 'medium'),  -- SPEI - Pilot
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', true, 72, 70, true, 68, 72, 'low'),      -- Rappi - Scaling
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', false, 18, 0, false, 25, 20, 'high');    -- Caribbean - Early concept


-- ============================================
-- PRODUCT ACTIONS (Governance)
-- ============================================

INSERT INTO public.product_actions (product_id, action_type, title, description, assigned_to, status, priority, due_date) VALUES

-- PIX Gateway Integration
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'partner', 'Itaú Bank PIX Routing Optimization', 'PIX transactions via Itaú taking 2.8s avg vs 1.2s target. Optimize API calls, implement direct connection.', 'pix.brazil@mastercard.com', 'in_progress', 'high', '2026-02-28'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'compliance', 'BACEN Regulation Update - PIX 2.0', 'Brazil Central Bank (BACEN) PIX 2.0 rules effective April 2026. Update API for scheduled payments feature.', 'pix.brazil@mastercard.com', 'pending', 'high', '2026-03-31'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'training', 'Brazil Sales Team Enablement', 'Train 45 Brazil sales reps on PIX Gateway positioning against Cielo and PagSeguro.', 'pix.brazil@mastercard.com', 'pending', 'medium', '2026-04-15'),

-- Mercado Pago Connect
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'review', 'Mercado Libre Integration Expansion', 'Expand from payments to full commerce services: shipping, lending, insurance. Joint product roadmap session.', 'mercadopago.partner@mastercard.com', 'in_progress', 'high', '2026-02-15'),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'other', 'Argentina Currency Control Impact', 'Argentina peso volatility and capital controls affecting cross-border. Implement peso-stable pricing model.', 'mercadopago.partner@mastercard.com', 'in_progress', 'critical', '2026-01-31'),

-- Nubank Card Issuance
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'partner', 'Nubank Colombia Launch Support', 'Support Nubank expansion into Colombia. Adapt card products for Colombian market, BIN sponsorship.', 'nubank.partnership@mastercard.com', 'in_progress', 'high', '2026-03-15'),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'compliance', 'PIX Credit Card Rule Compliance', 'BACEN mandates PIX payment option for credit cards. Update Nubank card rails to support PIX routing.', 'nubank.partnership@mastercard.com', 'pending', 'high', '2026-04-30'),

-- SPEI Mexico
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'compliance', 'Banxico SPEI 2.0 Migration', 'Mexico Central Bank (Banxico) SPEI 2.0 requirements. ISO 20022 migration and extended hours support.', 'spei.mexico@mastercard.com', 'in_progress', 'critical', '2026-03-31'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'partner', 'BBVA Mexico Integration', 'Complete SPEI integration with BBVA Mexico. Largest retail bank, critical for pilot expansion.', 'spei.mexico@mastercard.com', 'in_progress', 'high', '2026-02-28'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'intervention', 'Settlement Reconciliation Issues', 'SPEI settlement reconciliation showing 2.3% discrepancy. Root cause analysis and process fix needed.', 'spei.mexico@mastercard.com', 'in_progress', 'high', '2026-02-15'),

-- Rappi Integration
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'partner', 'Rappi Pay Wallet Integration', 'Deep integration with Rappi Pay wallet. Enable Mastercard as default payment method in app.', 'rappi.latam@mastercard.com', 'in_progress', 'high', '2026-02-28'),
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'training', 'Colombia Market Training', 'Train Colombia sales team on super app partnerships. Focus on rider earnings, merchant solutions.', 'rappi.latam@mastercard.com', 'pending', 'medium', '2026-03-15'),

-- Caribbean Tourism Hub
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'review', 'Caribbean Market Feasibility Study', 'Assess payment infrastructure across 15 Caribbean markets. Map regulatory requirements, FX challenges.', 'caribbean.tourism@mastercard.com', 'in_progress', 'high', '2026-03-31'),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'partner', 'Cruise Line Partnership Exploration', 'Explore partnerships with Carnival, Royal Caribbean for onboard and port payment solutions.', 'caribbean.tourism@mastercard.com', 'pending', 'medium', '2026-04-30'),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'compliance', 'Multi-Currency Licensing Research', 'Research licensing requirements for multi-currency acceptance across Caribbean jurisdictions.', 'caribbean.tourism@mastercard.com', 'pending', 'high', '2026-05-15');


-- ============================================
-- PRODUCT DEPENDENCIES (Blockers)
-- ============================================

INSERT INTO public.product_dependencies (product_id, name, type, category, status, notes) VALUES

-- PIX Gateway
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'BACEN Direct Participant License', 'external', 'regulatory', 'pending', 'Direct PIX participant license approval from Brazil Central Bank. Currently operating via bank partner.'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Real-Time Settlement Infrastructure', 'internal', 'infrastructure', 'pending', 'Need dedicated Brazil data center for PIX settlement latency requirements (sub-second).'),

-- SPEI Mexico
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Banxico Direct Connection', 'external', 'regulatory', 'blocked', 'Direct SPEI connection requires Banxico approval. Currently 6-month backlog.'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'ISO 20022 Message Format', 'internal', 'engineering', 'pending', 'Legacy systems use proprietary format. ISO 20022 migration required for SPEI 2.0.'),

-- Caribbean Tourism Hub
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Multi-Jurisdiction Licensing', 'external', 'regulatory', 'blocked', 'Each Caribbean island has separate licensing. 15+ licenses needed for regional coverage.'),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Cross-Currency Settlement', 'internal', 'engineering', 'pending', 'Need FX engine supporting USD, EUR, and local currencies (JMD, BBD, TTD, XCD, etc.).');


-- ============================================
-- PRODUCT FEEDBACK
-- ============================================

INSERT INTO public.product_feedback (product_id, source, sentiment_score, raw_text, theme, impact_level, volume) VALUES

-- PIX Gateway Integration
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Customer Survey', 0.92, 'PIX integration transformed our checkout. 65% of customers now pay with PIX. Instant settlement is game-changing.', 'value', 'low', 38),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Partner Feedback', 0.78, 'API documentation in Portuguese greatly appreciated. Integration took 3 weeks vs 6 weeks for competitors.', 'documentation', 'low', 15),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Support Ticket', -0.42, 'PIX refund process is manual. Need automated refund API matching original PIX transaction.', 'feature_request', 'medium', 12),

-- Mercado Pago Connect
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Customer Survey', 0.88, 'Mercado Pago integration gave us access to 50M+ users. Best decision for LATAM expansion.', 'value', 'low', 42),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Partner Feedback', -0.55, 'Argentina capital controls causing settlement delays. Need workaround for USD repatriation.', 'compliance', 'critical', 8),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Support Ticket', 0.62, 'Fraud tools are excellent. Chargeback rate dropped 40% since integration.', 'value', 'low', 18),

-- Nubank Card Issuance
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Partner Feedback', 0.95, 'Partnership with Mastercard enables our 80M customers. Critical infrastructure relationship.', 'partnership', 'low', 28),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Customer Survey', 0.82, 'Card arrives in 5 days. Fastest in Brazil. App experience is best-in-class.', 'delivery', 'low', 52),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Support Ticket', 0.45, 'Would like premium metal card option. Competitors offering Ultravioleta and C6 Carbon.', 'feature_request', 'low', 14),

-- SPEI Mexico
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Customer Survey', 0.65, 'SPEI pilot working well for domestic transfers. Want cross-border to US for remittances.', 'feature_request', 'high', 18),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Partner Feedback', -0.48, 'Settlement reconciliation issues causing operational overhead. Need automated matching.', 'reliability', 'high', 9),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Support Ticket', -0.35, 'Extended hours (24/7) not yet supported. Losing transactions on weekends and holidays.', 'feature_request', 'medium', 11),

-- Rappi Integration
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Customer Survey', 0.78, 'Love using Mastercard in Rappi. Rewards and cashback automatically applied. Seamless.', 'ux', 'low', 35),
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Partner Feedback', 0.68, 'Rider payouts via Mastercard cards working well. 85% of riders activated cards.', 'adoption', 'low', 12),
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Support Ticket', -0.38, 'Peru and Chile expansion delayed. Need localized cards and compliance for both markets.', 'expansion', 'medium', 8),

-- Caribbean Tourism Hub
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Focus Group', 0.52, 'Hotel operators want single payment gateway for all Caribbean properties. Currently managing 8 different providers.', 'market_research', 'high', 6),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Market Research', 0.45, 'Cruise passengers spend $150 avg at port. Opportunity for mobile-first payment solution.', 'market_research', 'medium', 4),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'User Interview', -0.32, 'Tourists frustrated by DCC (Dynamic Currency Conversion) markups. Need transparent FX.', 'pricing', 'high', 8);


-- ============================================
-- SALES TRAINING
-- ============================================

INSERT INTO public.sales_training (product_id, total_reps, trained_reps, last_training_date) VALUES
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 45, 40, '2025-12-15'),   -- PIX Gateway - Brazil team
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 72, 68, '2025-12-20'),   -- Mercado Pago - LATAM wide
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 45, 44, '2025-12-22'),   -- Nubank - Brazil team
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 28, 15, '2025-11-30'),   -- SPEI - Mexico team (pilot)
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 35, 25, '2025-12-10'),   -- Rappi - Colombia + regional
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 18, 3, '2025-10-15');    -- Caribbean - Early concept


-- ============================================
-- PRODUCT PARTNERS
-- ============================================

INSERT INTO public.product_partners (product_id, partner_name, enabled, onboarded_date, integration_status) VALUES

-- PIX Gateway
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Itaú Unibanco', true, '2023-11-01', 'complete'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Banco do Brasil', true, '2024-02-15', 'complete'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Bradesco', true, '2024-05-01', 'in_progress'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'Santander Brasil', false, NULL, 'not_started'),

-- Mercado Pago Connect
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Mercado Libre', true, '2021-06-15', 'complete'),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Mercado Shops', true, '2022-03-01', 'complete'),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Mercado Crédito', true, '2023-01-15', 'complete'),

-- Nubank Card Issuance
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Nubank Brazil', true, '2019-03-01', 'complete'),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Nubank Mexico', true, '2022-06-01', 'complete'),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'Nubank Colombia', true, '2024-09-01', 'in_progress'),

-- SPEI Mexico
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'BBVA Mexico', true, '2024-09-01', 'in_progress'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Banorte', false, NULL, 'not_started'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Citibanamex', false, NULL, 'not_started'),

-- Rappi Integration
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Rappi Colombia', true, '2024-01-15', 'complete'),
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Rappi Mexico', true, '2024-04-01', 'complete'),
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Rappi Brazil', true, '2024-08-01', 'in_progress'),
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'Rappi Peru', false, NULL, 'not_started'),

-- Caribbean Tourism Hub
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Carnival Cruise', false, NULL, 'not_started'),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Royal Caribbean', false, NULL, 'not_started'),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Sandals Resorts', false, NULL, 'not_started');


-- ============================================
-- PRODUCT COMPLIANCE
-- ============================================

INSERT INTO public.product_compliance (product_id, certification_type, status, completed_date, expiry_date, notes) VALUES

-- PIX Gateway
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'BACEN', 'complete', '2023-10-15', '2024-10-15', 'Brazil Central Bank PIX participant authorization'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'LGPD', 'complete', '2023-09-01', NULL, 'Brazil Data Protection Law compliance'),
('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'PCI-DSS', 'complete', '2024-06-01', '2025-06-01', 'Level 1 Service Provider'),

-- Mercado Pago Connect
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'LGPD', 'complete', '2021-08-01', NULL, 'Brazil compliance'),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'Argentina DPL', 'complete', '2021-09-15', NULL, 'Argentina Data Protection Law'),
('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'PCI-DSS', 'complete', '2024-04-01', '2025-04-01', 'Level 1 Service Provider'),

-- Nubank Card Issuance
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'BACEN', 'complete', '2019-02-01', NULL, 'Brazil card issuer license'),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'LGPD', 'complete', '2020-08-15', NULL, 'Full compliance'),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'PCI-DSS', 'complete', '2024-08-01', '2025-08-01', 'Level 1 Service Provider'),
('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'CNBV Mexico', 'complete', '2022-05-01', NULL, 'Mexico financial services license'),

-- SPEI Mexico
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Banxico', 'in_progress', NULL, NULL, 'Mexico Central Bank SPEI participant approval'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'LFPDPPP', 'complete', '2024-08-01', NULL, 'Mexico Federal Data Protection Law'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'PCI-DSS', 'in_progress', NULL, NULL, 'Pilot phase certification'),

-- Rappi Integration
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'SFC Colombia', 'complete', '2024-01-01', NULL, 'Colombia financial services approval'),
('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'PCI-DSS', 'complete', '2024-06-15', '2025-06-15', 'Level 2 Service Provider'),

-- Caribbean Tourism Hub
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Jamaica BOJ', 'pending', NULL, NULL, 'Bank of Jamaica payment services license'),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Barbados CBB', 'pending', NULL, NULL, 'Central Bank of Barbados license'),
('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'Trinidad CBTT', 'pending', NULL, NULL, 'Central Bank of Trinidad and Tobago license');


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify LAC products added
-- SELECT name, product_type, lifecycle_stage, revenue_target 
-- FROM public.products 
-- WHERE region = 'Latin America & Caribbean'
-- ORDER BY revenue_target DESC;

-- Verify regional distribution
-- SELECT region, COUNT(*) as count, SUM(revenue_target) as total_revenue
-- FROM public.products
-- GROUP BY region
-- ORDER BY total_revenue DESC;
