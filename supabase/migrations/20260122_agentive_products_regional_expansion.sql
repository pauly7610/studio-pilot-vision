-- ============================================
-- Agentive Products & Regional Expansion Migration
-- ============================================
-- Adds AI/Agent products, expands to Africa region,
-- includes region-specific regulations and blockers
-- Date: 2026-01-22
-- ============================================

-- ============================================
-- PART 1: SCHEMA CHANGES
-- ============================================

-- Add new product type for AI/Agent products
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'ai_agents';

-- Add new dependency categories for AI/agent blockers
DO $$ BEGIN
    ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'model_validation';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'data_quality';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'security_review';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'infrastructure';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE dependency_category ADD VALUE IF NOT EXISTS 'ai_governance';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================
-- PART 2: NEW PRODUCTS (13 Total)
-- ============================================
-- Product IDs use pattern: a1a1a1a1-... for easy identification

INSERT INTO public.products (id, name, product_type, region, lifecycle_stage, launch_date, revenue_target, owner_email, success_metric, governance_tier) VALUES

-- EMEA AI/Agent Products
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Decision Intelligence Pro EU', 'ai_agents', 'EMEA', 'scaling', '2024-06-01', 18500000.00, 'di.pro.eu@mastercard.com', 'Fraud Detection Rate', 'tier_3'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Brighterion EMEA', 'ai_agents', 'EMEA', 'mature', '2021-03-15', 24000000.00, 'brighterion.emea@mastercard.com', 'False Positive Reduction', 'tier_3'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Agent Pay', 'ai_agents', 'EMEA', 'concept', NULL, 4500000.00, 'agentpay.innovation@mastercard.com', 'Agent Transaction Volume', 'tier_1'),
('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'EU AI Compliance Monitor', 'ai_agents', 'EMEA', 'concept', NULL, 2800000.00, 'ai.compliance.eu@mastercard.com', 'Compliance Score', 'tier_1'),

-- APAC AI/Agent Products  
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Payment Passkey APAC', 'ai_agents', 'APAC', 'pilot', '2025-01-15', 8200000.00, 'passkey.apac@mastercard.com', 'Biometric Auth Adoption', 'tier_2'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Brighterion India', 'ai_agents', 'APAC', 'scaling', '2024-08-01', 12500000.00, 'brighterion.india@mastercard.com', 'Merchant Protection Rate', 'tier_2'),
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'Smart Routing Engine', 'ai_agents', 'APAC', 'pilot', '2025-02-01', 6800000.00, 'smartroute.apac@mastercard.com', 'Authorization Optimization', 'tier_2'),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'APAC Tokenization Hub', 'data_services', 'APAC', 'mature', '2020-09-01', 21000000.00, 'mdes.apac@mastercard.com', 'Token Transaction Volume', 'tier_3'),

-- Africa Products (New Region)
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'MTN MoMo Cards', 'partnerships', 'Africa', 'scaling', '2024-02-15', 9500000.00, 'momo.africa@mastercard.com', 'Card Issuance Volume', 'tier_2'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Orange Money Connect', 'partnerships', 'Africa', 'pilot', '2024-10-01', 5200000.00, 'orange.africa@mastercard.com', 'Wallet-to-Card Activation', 'tier_2'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Community Pass', 'core_products', 'Africa', 'concept', NULL, 3200000.00, 'community.pass@mastercard.com', 'User Registrations', 'tier_1'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'Merchant Risk AI Africa', 'ai_agents', 'Africa', 'concept', NULL, 2100000.00, 'merchantrisk.africa@mastercard.com', 'Fraud Prevention Rate', 'tier_1'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'AfriGo Integration', 'payment_flows', 'Africa', 'pilot', '2024-11-01', 4800000.00, 'afrigo.nigeria@mastercard.com', 'Domestic Transaction Volume', 'tier_2');


-- ============================================
-- PART 3: PRODUCT READINESS SCORES
-- ============================================

INSERT INTO public.product_readiness (product_id, technical_readiness, commercial_readiness, operational_readiness, compliance_readiness, revenue_probability, risk_band) VALUES

-- EMEA Products
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 82, 78, 75, 68, 72, 'medium'),  -- DI Pro EU - AI Act compliance pending
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 95, 92, 90, 94, 91, 'low'),     -- Brighterion EMEA - Mature
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 25, 15, 20, 10, 22, 'high'),    -- Agent Pay - Early concept
('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 35, 20, 25, 45, 28, 'high'),    -- AI Compliance Monitor - Concept

-- APAC Products
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 72, 65, 60, 78, 58, 'medium'),  -- Payment Passkey - Pilot
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 85, 80, 78, 82, 76, 'low'),     -- Brighterion India - Scaling
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 68, 55, 52, 70, 48, 'medium'),  -- Smart Routing - Pilot
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 96, 94, 92, 95, 93, 'low'),     -- APAC Tokenization - Mature

-- Africa Products
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 75, 70, 62, 65, 64, 'medium'),  -- MTN MoMo - Scaling, infrastructure gaps
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 62, 55, 48, 58, 45, 'medium'),  -- Orange Money - Pilot
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 30, 18, 22, 35, 20, 'high'),    -- Community Pass - Concept
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 28, 12, 15, 20, 18, 'high'),    -- Merchant Risk AI - Early concept
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 58, 52, 45, 42, 40, 'high');    -- AfriGo - Regulatory complexity


-- ============================================
-- PART 4: PRODUCT ACTIONS (Governance)
-- ============================================

INSERT INTO public.product_actions (product_id, action_type, title, description, assigned_to, status, priority, due_date) VALUES

-- Decision Intelligence Pro EU
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'compliance', 'EU AI Act High-Risk Classification', 'DI Pro classified as high-risk AI system under EU AI Act. Complete conformity assessment, technical documentation, and register in EU database.', 'di.pro.eu@mastercard.com', 'in_progress', 'critical', '2026-08-01'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'review', 'Model Explainability Audit', 'EU regulators require explainable AI decisions. Implement SHAP/LIME explanations for fraud scoring. Document decision rationale for each flagged transaction.', 'di.pro.eu@mastercard.com', 'pending', 'high', '2026-04-15'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'other', 'GDPR Data Minimization Review', 'Audit transaction data retention policies. Ensure only necessary data processed for fraud detection per GDPR Article 5(1)(c).', 'di.pro.eu@mastercard.com', 'pending', 'medium', '2026-03-31'),

-- Brighterion EMEA
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'review', 'PSD3 Strong Customer Authentication Update', 'PSD3 draft expands SCA requirements. Review Brighterion risk scoring integration with 3DS exemption engine for compliance.', 'brighterion.emea@mastercard.com', 'pending', 'high', '2026-06-30'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'partner', 'UK FCA Regulatory Sandbox Renewal', 'Post-Brexit UK requires separate FCA authorization. Renew sandbox participation for continued UK operations.', 'brighterion.emea@mastercard.com', 'in_progress', 'medium', '2026-02-28'),

-- Agent Pay (Concept)
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'review', 'Agentic Commerce Feasibility Study', 'Evaluate technical architecture for AI agents executing payments autonomously. Define trust boundaries, liability model, and consumer protection framework.', 'agentpay.innovation@mastercard.com', 'in_progress', 'high', '2026-03-15'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'compliance', 'EU AI Act Agent Liability Research', 'AI Act Article 52 requires transparency for AI agents. Research disclosure requirements for agent-initiated transactions.', 'agentpay.innovation@mastercard.com', 'pending', 'high', '2026-04-30'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'other', 'Consumer Trust Research - Agent Payments', 'Conduct 500-person survey across EU markets on willingness to delegate payment authority to AI agents.', 'agentpay.innovation@mastercard.com', 'pending', 'medium', '2026-05-15'),

-- EU AI Compliance Monitor
('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'review', 'AI Act Taxonomy Mapping', 'Map all Mastercard AI products to EU AI Act risk categories. Create compliance checklist for each risk tier.', 'ai.compliance.eu@mastercard.com', 'in_progress', 'critical', '2026-02-28'),
('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'other', 'Automated Bias Detection PoC', 'Build proof-of-concept for automated bias detection in fraud models. Test on Brighterion EU training data.', 'ai.compliance.eu@mastercard.com', 'pending', 'high', '2026-04-30'),

-- Payment Passkey APAC
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'partner', 'Singapore MAS Biometric Guidelines Compliance', 'MAS Technology Risk Management Guidelines require biometric template protection. Implement on-device processing for Singapore pilot.', 'passkey.apac@mastercard.com', 'in_progress', 'critical', '2026-02-15'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'training', 'APAC Issuer Enablement Program', 'Train 50 issuing banks across Singapore, Malaysia, Vietnam on Passkey integration. Develop localized documentation.', 'passkey.apac@mastercard.com', 'pending', 'high', '2026-03-31'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'intervention', 'India RBI Tokenization Mandate Alignment', 'RBI mandates on-device tokenization. Ensure Payment Passkey meets RBI circular requirements for card-on-file tokenization.', 'passkey.apac@mastercard.com', 'in_progress', 'high', '2026-01-31'),

-- Brighterion India
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'partner', 'PayU Integration Performance Optimization', 'Transaction scoring latency at 85ms, target is 50ms. Optimize India data center deployment, implement edge caching.', 'brighterion.india@mastercard.com', 'in_progress', 'high', '2026-02-28'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'compliance', 'RBI Data Localization Audit', 'RBI requires all payment data stored in India. Complete audit of data flows, ensure no cross-border leakage.', 'brighterion.india@mastercard.com', 'pending', 'critical', '2026-03-15'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'review', 'Merchant Fraud Pattern Analysis Q4', 'Analyze Q4 2025 fraud patterns. 18% increase in card-not-present fraud in tier-2 cities. Retrain models.', 'brighterion.india@mastercard.com', 'completed', 'high', '2026-01-15'),

-- Smart Routing Engine APAC
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'review', 'Authorization Rate A/B Testing', 'Run A/B test comparing ML-based routing vs rule-based. Target: 3% authorization rate improvement.', 'smartroute.apac@mastercard.com', 'in_progress', 'medium', '2026-03-15'),
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'partner', 'Vietnam Napas Network Integration', 'Integrate with Vietnam National Payment Switch (Napas) for domestic routing optimization.', 'smartroute.apac@mastercard.com', 'pending', 'high', '2026-04-30'),

-- APAC Tokenization Hub
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'compliance', 'PCI-DSS 4.0 Migration APAC', 'Migrate all APAC tokenization infrastructure to PCI-DSS 4.0. Deadline March 2025 extended to June 2025 for some requirements.', 'mdes.apac@mastercard.com', 'in_progress', 'critical', '2026-06-30'),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'other', 'Australia CDR Token Integration', 'Australian Consumer Data Right (CDR) requires token-based data sharing. Implement CDR-compliant tokenization for Open Banking.', 'mdes.apac@mastercard.com', 'pending', 'high', '2026-05-31'),

-- MTN MoMo Cards (Africa)
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'partner', 'MTN Ghana Card Rollout Acceleration', 'Ghana rollout behind schedule (45% vs 70% target). Increase card production capacity, simplify KYC for rural users.', 'momo.africa@mastercard.com', 'in_progress', 'high', '2026-02-28'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'compliance', 'South Africa POPIA Compliance Assessment', 'POPIA April 2025 amendments require enhanced consent mechanisms. Update MoMo card enrollment flow.', 'momo.africa@mastercard.com', 'pending', 'high', '2026-03-31'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'intervention', 'Mobile Network Coverage Gaps', '38% of target users in rural areas have intermittent connectivity. Implement offline transaction capability with sync-on-connect.', 'momo.africa@mastercard.com', 'in_progress', 'critical', '2026-04-15'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'training', 'Agent Network Training - West Africa', 'Train 5,000 MoMo agents on card issuance and troubleshooting. Focus on Nigeria, Ghana, Cameroon.', 'momo.africa@mastercard.com', 'pending', 'medium', '2026-05-31'),

-- Orange Money Connect (Africa)
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'partner', 'Orange Senegal Pilot Expansion', 'Senegal pilot successful (28K cards). Expand to Mali and Guinea-Bissau. Secure Orange corporate approval.', 'orange.africa@mastercard.com', 'in_progress', 'high', '2026-02-15'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'compliance', 'BCEAO Regional Compliance', 'West African Central Bank (BCEAO) requires approval for card-linked mobile wallets. Submit application for 7-country operation.', 'orange.africa@mastercard.com', 'pending', 'critical', '2026-03-31'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'intervention', 'Card Activation Rate Below Target', 'Only 42% of issued cards activated within 30 days. Implement SMS reminder campaign, agent incentive program.', 'orange.africa@mastercard.com', 'in_progress', 'high', '2026-02-28'),

-- Community Pass (Africa)
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'review', 'Digital Identity Framework Design', 'Design interoperable digital identity framework compatible with national ID systems in Kenya, Uganda, Rwanda.', 'community.pass@mastercard.com', 'in_progress', 'high', '2026-03-31'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'partner', 'Kenya NIIMS Integration Research', 'Research integration with Kenya National Integrated Identity Management System (NIIMS/Huduma Namba).', 'community.pass@mastercard.com', 'pending', 'medium', '2026-04-30'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'other', 'Rural Connectivity Infrastructure Assessment', 'Map connectivity gaps across target regions. Identify satellite/USSD fallback requirements for offline operation.', 'community.pass@mastercard.com', 'pending', 'high', '2026-05-15'),

-- Merchant Risk AI Africa
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'review', 'Africa Fraud Pattern Research', 'Analyze fraud patterns unique to African markets: agent fraud, SIM swap attacks, mobile money laundering. Build training dataset.', 'merchantrisk.africa@mastercard.com', 'in_progress', 'high', '2026-03-31'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'other', 'Brighterion Model Adaptation Study', 'Evaluate adapting Brighterion models for African market characteristics: cash-heavy economy, agent networks, mobile-first.', 'merchantrisk.africa@mastercard.com', 'pending', 'medium', '2026-04-30'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'compliance', 'Nigeria NDPA Data Processing Assessment', 'Nigeria Data Protection Act (NDPA) and GAID 2025 effective Sept 2025. Assess data processing requirements for AI training.', 'merchantrisk.africa@mastercard.com', 'pending', 'high', '2026-02-28'),

-- AfriGo Integration (Nigeria)
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'partner', 'CBN AfriGo API Integration', 'Complete integration with Central Bank of Nigeria AfriGo domestic card scheme. Enable Mastercard-AfriGo interoperability.', 'afrigo.nigeria@mastercard.com', 'in_progress', 'critical', '2026-02-28'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'compliance', 'CBN ISO 20022 Migration', 'Central Bank of Nigeria mandates ISO 20022 by Oct 2025. Ensure all message formats compliant with CBN specifications.', 'afrigo.nigeria@mastercard.com', 'in_progress', 'critical', '2026-01-31'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'intervention', 'Naira Volatility Impact Assessment', 'NGN/USD volatility affecting FX conversion pricing. Implement dynamic pricing, hedge strategy for cross-border transactions.', 'afrigo.nigeria@mastercard.com', 'pending', 'high', '2026-03-15'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'training', 'Nigerian Bank Partner Enablement', 'Train 15 Nigerian banks on AfriGo-Mastercard integration. Priority: GTBank, Zenith, Access Bank, First Bank.', 'afrigo.nigeria@mastercard.com', 'pending', 'medium', '2026-04-30');


-- ============================================
-- PART 5: PRODUCT DEPENDENCIES (Blockers)
-- ============================================

INSERT INTO public.product_dependencies (product_id, name, type, category, status, impact, description, owner, due_date) VALUES

-- Decision Intelligence Pro EU - AI Act blockers
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'EU AI Act Conformity Assessment', 'external', 'regulatory', 'blocked', 'critical', 'High-risk AI system classification requires third-party conformity assessment before EU market deployment. No approved conformity assessment bodies available until Q2 2026.', 'di.pro.eu@mastercard.com', '2026-06-30'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Model Explainability Implementation', 'internal', 'ai_governance', 'pending', 'high', 'EU AI Act requires explainable decisions. Current black-box neural network needs SHAP/LIME layer implementation.', 'di.pro.eu@mastercard.com', '2026-04-15'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'EU Training Data Audit', 'internal', 'data_quality', 'pending', 'medium', 'GDPR Article 22 requires human review of automated decisions. Training data must be audited for bias.', 'di.pro.eu@mastercard.com', '2026-03-31'),

-- Agent Pay - Novel concept blockers
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Agent Liability Legal Framework', 'external', 'legal', 'blocked', 'critical', 'No legal precedent for AI agent liability in financial transactions. Requires legal opinion from each EU member state.', 'agentpay.innovation@mastercard.com', '2026-06-30'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Consumer Protection Framework', 'external', 'regulatory', 'blocked', 'critical', 'PSD2/PSD3 consumer protection rules unclear for agent-initiated transactions. ECB consultation required.', 'agentpay.innovation@mastercard.com', '2026-05-31'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Trust Token Architecture', 'internal', 'technical', 'pending', 'high', 'Need to design cryptographic trust tokens for agent authorization. Security review required.', 'agentpay.innovation@mastercard.com', '2026-04-30'),

-- Payment Passkey APAC - Regional blockers
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'RBI Biometric Storage Guidelines', 'external', 'regulatory', 'pending', 'critical', 'RBI prohibits biometric template storage. Must implement on-device-only authentication for India market.', 'passkey.apac@mastercard.com', '2026-02-15'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Android Device Fragmentation', 'internal', 'technical', 'pending', 'high', 'APAC has high Android fragmentation. 40% of devices lack secure enclave. Need fallback authentication.', 'passkey.apac@mastercard.com', '2026-03-31'),

-- Brighterion India - Data localization
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'India Data Localization Infrastructure', 'internal', 'infrastructure', 'pending', 'critical', 'RBI data localization requires all payment data in India. Need dedicated India data center with no cross-border replication.', 'brighterion.india@mastercard.com', '2026-03-15'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'PayU API Rate Limits', 'external', 'partner', 'pending', 'medium', 'PayU API rate limits causing 8% transaction scoring failures during peak hours. Negotiating higher limits.', 'brighterion.india@mastercard.com', '2026-02-28'),

-- MTN MoMo Cards - Africa infrastructure blockers
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Rural Mobile Network Coverage', 'external', 'infrastructure', 'blocked', 'critical', '38% of target users in areas with <2G coverage. Card transactions fail without connectivity. Need offline mode.', 'momo.africa@mastercard.com', '2026-04-15'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Multi-Country KYC Harmonization', 'external', 'regulatory', 'pending', 'high', '13 countries with different KYC requirements. Need harmonized digital KYC that satisfies all regulators.', 'momo.africa@mastercard.com', '2026-05-31'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Card Production Capacity', 'internal', 'resourcing', 'pending', 'medium', 'Local card production capacity insufficient. 6-week lead time vs 2-week target. Evaluating additional suppliers.', 'momo.africa@mastercard.com', '2026-03-31'),

-- Orange Money Connect - West Africa blockers
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'BCEAO Card-Wallet Approval', 'external', 'regulatory', 'blocked', 'critical', 'BCEAO (West African Central Bank) has not approved card-linked mobile wallet products. Regulatory engagement ongoing.', 'orange.africa@mastercard.com', '2026-03-31'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Orange Corporate Approval', 'external', 'partner', 'pending', 'high', 'Orange Group HQ approval required for expansion beyond Senegal. Business case under review in Paris.', 'orange.africa@mastercard.com', '2026-02-28'),

-- Community Pass - Digital identity blockers
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'National ID System Integration', 'external', 'partner', 'pending', 'critical', 'Integration with Kenya NIIMS, Uganda NIRA requires government MOU. Negotiations in progress.', 'community.pass@mastercard.com', '2026-06-30'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Offline-First Architecture', 'internal', 'technical', 'pending', 'high', 'Target users have intermittent connectivity. Need USSD fallback and sync-on-connect architecture.', 'community.pass@mastercard.com', '2026-05-15'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Biometric Capture in Low-Resource Settings', 'internal', 'technical', 'pending', 'medium', 'Fingerprint scanners fail in humid/dusty conditions common in rural Africa. Evaluate alternative biometrics.', 'community.pass@mastercard.com', '2026-04-30'),

-- AfriGo Integration - Nigeria blockers
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'CBN Technical Specifications', 'external', 'regulatory', 'pending', 'critical', 'CBN AfriGo technical specifications still being finalized. Cannot complete integration without final specs.', 'afrigo.nigeria@mastercard.com', '2026-02-15'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'Naira Liquidity for Settlement', 'external', 'financial', 'pending', 'high', 'FX restrictions making Naira liquidity for settlement challenging. Need CBN approval for settlement account.', 'afrigo.nigeria@mastercard.com', '2026-03-15'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'ISO 20022 Message Translation', 'internal', 'technical', 'pending', 'medium', 'Legacy systems use ISO 8583. Need message translation layer for ISO 20022 compliance.', 'afrigo.nigeria@mastercard.com', '2026-01-31');


-- ============================================
-- PART 6: PRODUCT FEEDBACK
-- ============================================

INSERT INTO public.product_feedback (product_id, source, sentiment_score, raw_text, theme, impact_level, volume) VALUES

-- Decision Intelligence Pro EU
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Customer Survey', 0.85, 'DI Pro reduced our fraud losses by 28% in the first quarter. False positive rate dropped from 4.2% to 1.8%. Excellent ROI.', 'value', 'low', 24),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Partner Feedback', -0.42, 'AI Act compliance deadline approaching. Need clear guidance on explainability requirements. Current documentation insufficient.', 'compliance', 'critical', 8),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Support Ticket', 0.55, 'Would like more granular control over risk thresholds by merchant category. Current one-size-fits-all approach too restrictive.', 'feature_request', 'medium', 12),

-- Brighterion EMEA
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Customer Survey', 0.92, 'Brighterion is the backbone of our fraud operations. Processing 2M transactions/day with sub-50ms latency. World-class.', 'performance', 'low', 35),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Partner Feedback', 0.78, 'Model refresh process is smooth. Quarterly retraining with our data keeps accuracy high. Good partnership.', 'value', 'low', 18),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Support Ticket', -0.35, 'UK post-Brexit regulatory requirements differ from EU. Need separate model tuning for UK market.', 'compliance', 'medium', 9),

-- Agent Pay
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Focus Group', 0.62, 'Concept is fascinating. Would use AI agent for routine purchases like groceries, subscriptions. Not for large purchases.', 'market_research', 'low', 15),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'User Interview', -0.28, 'Trust is the issue. How do I know the agent won''t overspend? Need spending limits, approval workflows for large amounts.', 'market_research', 'high', 8),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Market Research', 0.45, 'Enterprise interest high for B2B procurement agents. Automating routine PO approvals and vendor payments.', 'market_research', 'medium', 6),

-- Payment Passkey APAC
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Customer Survey', 0.75, 'Biometric authentication much faster than OTP. Love not waiting for SMS. Checkout time reduced 40%.', 'ux', 'low', 22),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Partner Feedback', -0.55, 'Device compatibility issues in Vietnam. 35% of users on older phones without fingerprint sensors.', 'technical', 'critical', 11),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Support Ticket', 0.38, 'Face ID works great on iPhone but Android face unlock less reliable. Need fallback options.', 'feature_request', 'medium', 14),

-- Brighterion India
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Customer Survey', 0.82, 'Merchant fraud detection excellent. Caught Rs 2.3 crore in fraudulent transactions in first month.', 'value', 'low', 28),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Partner Feedback', -0.48, 'Latency spikes during UPI payment peaks (8-9 PM). Need better infrastructure for India traffic patterns.', 'performance', 'high', 9),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Support Ticket', 0.52, 'Model accuracy varies by region. Better in metros, weaker in tier-2/tier-3 cities. Need localized training.', 'accuracy', 'medium', 7),

-- Smart Routing Engine
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'Customer Survey', 0.68, 'Routing optimization improved auth rates by 2.1%. Meaningful for our volume. Want to see more improvement.', 'value', 'low', 16),
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'Partner Feedback', -0.38, 'Black-box routing decisions make it hard to troubleshoot declined transactions. Need more transparency.', 'transparency', 'medium', 8),

-- APAC Tokenization Hub
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Customer Survey', 0.94, 'Tokenization reduced our PCI scope significantly. Compliance costs down 60%. Highly recommend.', 'value', 'low', 42),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Partner Feedback', 0.85, 'Token vault reliability is exceptional. 99.999% uptime over 12 months. No complaints.', 'reliability', 'low', 25),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Support Ticket', 0.42, 'Need support for network tokens (Apple Pay, Google Pay) in addition to merchant tokens.', 'feature_request', 'medium', 11),

-- MTN MoMo Cards
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Customer Survey', 0.72, 'Finally can shop online with my MoMo wallet! Card works at most merchants. Life-changing for e-commerce.', 'functionality', 'low', 35),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Partner Feedback', -0.62, 'Card activation rate in rural areas only 28%. Users struggle with activation flow. Need simpler USSD-based activation.', 'adoption', 'critical', 12),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Support Ticket', -0.48, 'Card doesn''t work when mobile network is down. Need offline transaction capability for rural areas.', 'reliability', 'high', 18),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Customer Survey', 0.58, 'International transactions work but FX rates not competitive. 4% markup vs 2% from competitors.', 'pricing', 'medium', 14),

-- Orange Money Connect
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Customer Survey', 0.65, 'Card arrived quickly. Works well in Dakar. Happy to have access to e-commerce finally.', 'functionality', 'low', 18),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Partner Feedback', -0.55, 'Pilot limited to urban Senegal. Rural users asking when they can get cards. Expansion needed.', 'expansion', 'high', 8),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Support Ticket', -0.42, 'Card to wallet sync takes up to 24 hours. Should be instant. Users confused about balance discrepancies.', 'sync', 'medium', 11),

-- Community Pass
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Focus Group', 0.58, 'Digital ID could help access government services. Currently travel 50km to nearest office for ID verification.', 'market_research', 'high', 12),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'User Interview', -0.35, 'Concerned about privacy. Who has access to my data? Government? Banks? Need clear explanation.', 'privacy', 'high', 8),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Market Research', 0.48, 'Agricultural cooperatives interested for farmer identity and credit history. Could enable microloans.', 'market_research', 'medium', 5),

-- Merchant Risk AI Africa
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'Market Research', 0.52, 'Mobile money agent fraud is a major problem. Agents creating fake transactions to earn commissions.', 'market_research', 'critical', 6),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'Partner Feedback', -0.45, 'Existing fraud models trained on Western data. Don''t catch Africa-specific patterns like SIM swap fraud.', 'accuracy', 'high', 4),

-- AfriGo Integration
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'Customer Survey', 0.62, 'Excited about Naira-only transactions. No more FX fees for domestic purchases. Good for the economy.', 'value', 'low', 15),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'Partner Feedback', -0.68, 'CBN keeps changing specifications. Third revision in 2 months. Integration timeline slipping.', 'partner', 'critical', 7),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'Support Ticket', -0.52, 'Naira volatility making pricing unpredictable. Need real-time FX rate integration for cross-border.', 'pricing', 'high', 9);


-- ============================================
-- PART 7: SALES TRAINING
-- ============================================

INSERT INTO public.sales_training (product_id, total_reps, trained_reps, last_training_date) VALUES

-- EMEA Products (Good training coverage 75-95%)
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 85, 72, '2025-12-15'),   -- DI Pro EU
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 85, 81, '2025-12-20'),   -- Brighterion EMEA (mature)
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 85, 18, '2025-11-01'),   -- Agent Pay (concept)
('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 85, 12, '2025-12-01'),   -- AI Compliance Monitor (concept)

-- APAC Products (Moderate training 50-80%)
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 62, 38, '2025-12-10'),   -- Payment Passkey (pilot)
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 62, 52, '2025-12-18'),   -- Brighterion India (scaling)
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 62, 28, '2025-11-15'),   -- Smart Routing (pilot)
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 62, 58, '2025-12-22'),   -- APAC Tokenization (mature)

-- Africa Products (Lower training - newer market 20-50%)
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 35, 22, '2025-12-05'),   -- MTN MoMo (scaling)
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 35, 14, '2025-11-20'),   -- Orange Money (pilot)
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 35, 6, '2025-10-15'),    -- Community Pass (concept)
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 35, 4, '2025-11-01'),    -- Merchant Risk AI (concept)
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 35, 12, '2025-12-01');   -- AfriGo (pilot)


-- ============================================
-- PART 8: PRODUCT PARTNERS
-- ============================================

INSERT INTO public.product_partners (product_id, partner_name, enabled, onboarded_date, integration_status) VALUES

-- Decision Intelligence Pro EU
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Deutsche Bank', true, '2024-08-01', 'complete'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'BNP Paribas', true, '2024-09-15', 'complete'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ING Group', true, '2024-11-01', 'in_progress'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Santander', false, NULL, 'not_started'),

-- Brighterion EMEA
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Barclays', true, '2022-03-01', 'complete'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'HSBC Europe', true, '2022-06-15', 'complete'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Lloyds Banking Group', true, '2023-01-01', 'complete'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Rabobank', true, '2023-08-01', 'complete'),

-- Payment Passkey APAC
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'DBS Bank', true, '2025-01-15', 'in_progress'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'OCBC', true, '2025-01-20', 'in_progress'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Maybank', false, NULL, 'not_started'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'HDFC Bank', false, NULL, 'not_started'),

-- Brighterion India
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'PayU India', true, '2024-08-01', 'complete'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'HDFC Bank', true, '2024-10-01', 'in_progress'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'ICICI Bank', true, '2024-11-15', 'in_progress'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Axis Bank', false, NULL, 'not_started'),

-- APAC Tokenization Hub
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Commonwealth Bank', true, '2021-03-01', 'complete'),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'ANZ', true, '2021-06-01', 'complete'),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Westpac', true, '2021-09-01', 'complete'),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'NAB', true, '2022-01-01', 'complete'),

-- MTN MoMo Cards
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'MTN Ghana', true, '2024-02-15', 'complete'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'MTN Nigeria', true, '2024-04-01', 'in_progress'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'MTN Cameroon', true, '2024-06-01', 'in_progress'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'MTN South Africa', false, NULL, 'not_started'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'MTN Uganda', false, NULL, 'not_started'),

-- Orange Money Connect
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Orange Senegal', true, '2024-10-01', 'complete'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Orange Mali', false, NULL, 'not_started'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'Orange Côte d''Ivoire', false, NULL, 'not_started'),

-- Community Pass
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Kenya NIIMS', false, NULL, 'not_started'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Uganda NIRA', false, NULL, 'not_started'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Rwanda NIDA', false, NULL, 'not_started'),

-- AfriGo Integration
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'GTBank', true, '2024-11-15', 'in_progress'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'Zenith Bank', true, '2024-12-01', 'in_progress'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'Access Bank', false, NULL, 'not_started'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'First Bank Nigeria', false, NULL, 'not_started');


-- ============================================
-- PART 9: PRODUCT COMPLIANCE
-- ============================================

INSERT INTO public.product_compliance (product_id, certification_type, status, completed_date, expiry_date, notes) VALUES

-- Decision Intelligence Pro EU
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'GDPR', 'complete', '2024-03-15', NULL, 'Article 22 automated decision-making compliance'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'EU AI Act', 'in_progress', NULL, NULL, 'High-risk AI system - conformity assessment pending'),
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'SOC2', 'complete', '2024-08-01', '2025-08-01', 'Type II certification'),

-- Brighterion EMEA
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'GDPR', 'complete', '2022-05-01', NULL, 'Full compliance'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'PSD2', 'complete', '2022-06-01', NULL, 'SCA exemption integration'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'SOC2', 'complete', '2024-04-15', '2025-04-15', 'Type II certification'),
('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'ISO-27001', 'complete', '2023-09-01', '2026-09-01', 'Information Security Management'),

-- Agent Pay
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'EU AI Act', 'pending', NULL, NULL, 'Agent classification under review'),
('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'PSD2', 'pending', NULL, NULL, 'Agent-initiated payment framework unclear'),

-- EU AI Compliance Monitor
('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'EU AI Act', 'in_progress', NULL, NULL, 'Tool designed for AI Act compliance - meta-compliance needed'),

-- Payment Passkey APAC
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'MAS TRM', 'in_progress', NULL, NULL, 'Singapore Technology Risk Management Guidelines'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'RBI Tokenization', 'in_progress', NULL, NULL, 'India card-on-file tokenization mandate'),
('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'PCI-DSS', 'complete', '2025-01-10', '2026-01-10', 'Level 1 Service Provider'),

-- Brighterion India
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'RBI Data Localization', 'in_progress', NULL, NULL, 'All payment data must reside in India'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'PCI-DSS', 'complete', '2024-10-01', '2025-10-01', 'Level 1 Service Provider'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'SOC2', 'complete', '2024-11-15', '2025-11-15', 'Type II certification'),

-- Smart Routing Engine
('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'PCI-DSS', 'in_progress', NULL, NULL, 'Pilot phase certification'),

-- APAC Tokenization Hub
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'PCI-DSS', 'complete', '2024-06-01', '2025-06-01', 'Level 1 Service Provider - 4.0 migration in progress'),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Australia CDR', 'in_progress', NULL, NULL, 'Consumer Data Right accreditation'),
('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'SOC2', 'complete', '2024-09-01', '2025-09-01', 'Type II certification'),

-- MTN MoMo Cards
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'POPIA', 'in_progress', NULL, NULL, 'South Africa data protection - April 2025 amendments'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'Ghana BoG', 'complete', '2024-02-01', '2025-02-01', 'Bank of Ghana e-money license'),
('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'PCI-DSS', 'in_progress', NULL, NULL, 'Card issuance certification'),

-- Orange Money Connect
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'BCEAO', 'pending', NULL, NULL, 'West African Central Bank approval pending'),
('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'PCI-DSS', 'in_progress', NULL, NULL, 'Pilot phase certification'),

-- Community Pass
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Kenya DPA', 'pending', NULL, NULL, 'Kenya Data Protection Act 2019'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Uganda DPP', 'pending', NULL, NULL, 'Uganda Data Protection and Privacy Act'),

-- Merchant Risk AI Africa
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'NDPA', 'pending', NULL, NULL, 'Nigeria Data Protection Act - GAID 2025 compliance'),
('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'POPIA', 'pending', NULL, NULL, 'South Africa data protection assessment'),

-- AfriGo Integration
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'CBN', 'in_progress', NULL, NULL, 'Central Bank of Nigeria AfriGo scheme compliance'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'ISO 20022', 'in_progress', NULL, NULL, 'CBN mandate - deadline Oct 2025'),
('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5', 'NDPA', 'pending', NULL, NULL, 'Nigeria Data Protection Act compliance');


-- ============================================
-- VERIFICATION QUERIES (Commented out)
-- ============================================

-- Verify new products by region
-- SELECT region, lifecycle_stage, COUNT(*) as count 
-- FROM products 
-- WHERE id LIKE 'a%' OR id LIKE 'b%' OR id LIKE 'c%'
-- GROUP BY region, lifecycle_stage
-- ORDER BY region, lifecycle_stage;

-- Verify dependency categories
-- SELECT category, COUNT(*) as count 
-- FROM product_dependencies 
-- GROUP BY category;

-- Verify compliance by region
-- SELECT p.region, pc.certification_type, pc.status, COUNT(*) as count
-- FROM products p
-- JOIN product_compliance pc ON p.id = pc.product_id
-- WHERE p.id LIKE 'a%' OR p.id LIKE 'b%' OR p.id LIKE 'c%'
-- GROUP BY p.region, pc.certification_type, pc.status
-- ORDER BY p.region, pc.certification_type;
