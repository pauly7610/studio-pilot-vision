-- Seed data for Studio Pilot Vision
-- Demo products for Mastercard North America portfolio

-- Insert products
INSERT INTO public.products (id, name, product_type, region, lifecycle_stage, launch_date, revenue_target, owner_email) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Digital Wallet API', 'payment_flows', 'North America', 'commercial', '2024-03-15', 5200000.00, 'sarah.chen@mastercard.com'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Fraud Detection ML', 'data_services', 'North America', 'pilot', '2024-08-01', 3100000.00, 'mike.johnson@mastercard.com'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Partner Integration Hub', 'partnerships', 'North America', 'early_pilot', '2024-11-01', 1800000.00, 'lisa.wang@mastercard.com'),
('d4e5f6a7-b8c9-0123-def1-234567890123', 'Merchant Insights Platform', 'data_services', 'North America', 'commercial', '2023-06-01', 4500000.00, 'david.smith@mastercard.com'),
('e5f6a7b8-c9d0-1234-ef12-345678901234', 'Contactless Checkout SDK', 'core_products', 'North America', 'pilot', '2024-09-15', 2800000.00, 'emma.davis@mastercard.com'),
('f6a7b8c9-d0e1-2345-f123-456789012345', 'Risk Scoring Platform', 'data_services', 'North America', 'early_pilot', '2024-12-01', 1500000.00, 'james.wilson@mastercard.com'),
('a7b8c9d0-e1f2-3456-0123-567890123456', 'Loyalty Platform', 'partnerships', 'North America', 'commercial', '2023-01-15', 6200000.00, 'olivia.brown@mastercard.com'),
('b8c9d0e1-f2a3-4567-1234-678901234567', 'B2B Payments Gateway', 'payment_flows', 'North America', 'pilot', '2024-07-01', 3800000.00, 'noah.taylor@mastercard.com'),
('c9d0e1f2-a3b4-5678-2345-789012345678', 'Cross-Border Settlement', 'payment_flows', 'North America', 'concept', NULL, 2000000.00, 'sophia.martinez@mastercard.com'),
('d0e1f2a3-b4c5-6789-3456-890123456789', 'Identity Verification API', 'data_services', 'North America', 'early_pilot', '2024-10-15', 1200000.00, 'liam.anderson@mastercard.com'),
('e1f2a3b4-c5d6-7890-4567-901234567890', 'Embedded Finance SDK', 'core_products', 'North America', 'concept', NULL, 1800000.00, 'ava.thomas@mastercard.com'),
('f2a3b4c5-d6e7-8901-5678-012345678901', 'Real-Time Analytics', 'data_services', 'North America', 'commercial', '2022-09-01', 7500000.00, 'ethan.jackson@mastercard.com'),
('a3b4c5d6-e7f8-9012-6789-123456789012', 'Small Business Suite', 'partnerships', 'North America', 'pilot', '2024-06-01', 2200000.00, 'mia.white@mastercard.com'),
('b4c5d6e7-f8a9-0123-7890-234567890123', 'Crypto Bridge API', 'payment_flows', 'North America', 'early_pilot', '2024-11-15', 900000.00, 'lucas.harris@mastercard.com'),
('c5d6e7f8-a9b0-1234-8901-345678901234', 'POS Integration Layer', 'core_products', 'North America', 'commercial', '2023-03-01', 4100000.00, 'charlotte.clark@mastercard.com'),
('d6e7f8a9-b0c1-2345-9012-456789012345', 'Subscription Management', 'payment_flows', 'North America', 'pilot', '2024-08-15', 1600000.00, 'benjamin.lewis@mastercard.com');

-- Insert product readiness scores
INSERT INTO public.product_readiness (product_id, compliance_complete, sales_training_pct, partner_enabled_pct, onboarding_complete, documentation_score, readiness_score, risk_band) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', true, 95.00, 88.00, true, 92.00, 91.00, 'low'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', true, 78.00, 65.00, true, 85.00, 76.00, 'medium'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', false, 45.00, 30.00, false, 60.00, 42.00, 'high'),
('d4e5f6a7-b8c9-0123-def1-234567890123', true, 92.00, 95.00, true, 98.00, 95.00, 'low'),
('e5f6a7b8-c9d0-1234-ef12-345678901234', true, 68.00, 55.00, true, 75.00, 68.00, 'medium'),
('f6a7b8c9-d0e1-2345-f123-456789012345', false, 35.00, 20.00, false, 50.00, 32.00, 'high'),
('a7b8c9d0-e1f2-3456-0123-567890123456', true, 98.00, 92.00, true, 95.00, 94.00, 'low'),
('b8c9d0e1-f2a3-4567-1234-678901234567', true, 72.00, 60.00, true, 80.00, 72.00, 'medium'),
('c9d0e1f2-a3b4-5678-2345-789012345678', false, 10.00, 5.00, false, 25.00, 12.00, 'high'),
('d0e1f2a3-b4c5-6789-3456-890123456789', false, 55.00, 40.00, false, 65.00, 52.00, 'medium'),
('e1f2a3b4-c5d6-7890-4567-901234567890', false, 15.00, 8.00, false, 30.00, 15.00, 'high'),
('f2a3b4c5-d6e7-8901-5678-012345678901', true, 96.00, 90.00, true, 94.00, 93.00, 'low'),
('a3b4c5d6-e7f8-9012-6789-123456789012', true, 65.00, 50.00, true, 70.00, 65.00, 'medium'),
('b4c5d6e7-f8a9-0123-7890-234567890123', false, 40.00, 25.00, false, 55.00, 38.00, 'high'),
('c5d6e7f8-a9b0-1234-8901-345678901234', true, 90.00, 85.00, true, 88.00, 88.00, 'low'),
('d6e7f8a9-b0c1-2345-9012-456789012345', true, 70.00, 58.00, true, 78.00, 70.00, 'medium');

-- Insert product metrics (recent data)
INSERT INTO public.product_metrics (product_id, date, actual_revenue, adoption_rate, active_users, transaction_volume, churn_rate) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2024-12-01', 485000.00, 78.50, 12500, 245000, 2.10),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', '2024-12-01', 210000.00, 45.20, 3200, 89000, 4.50),
('c3d4e5f6-a7b8-9012-cdef-123456789012', '2024-12-01', 85000.00, 22.00, 850, 12000, 8.20),
('d4e5f6a7-b8c9-0123-def1-234567890123', '2024-12-01', 520000.00, 82.30, 18500, 320000, 1.80),
('e5f6a7b8-c9d0-1234-ef12-345678901234', '2024-12-01', 165000.00, 38.50, 2100, 45000, 5.20),
('f6a7b8c9-d0e1-2345-f123-456789012345', '2024-12-01', 45000.00, 15.00, 420, 5500, 12.00),
('a7b8c9d0-e1f2-3456-0123-567890123456', '2024-12-01', 680000.00, 88.00, 25000, 450000, 1.20),
('b8c9d0e1-f2a3-4567-1234-678901234567', '2024-12-01', 195000.00, 42.00, 2800, 65000, 4.80),
('d0e1f2a3-b4c5-6789-3456-890123456789', '2024-12-01', 62000.00, 28.00, 680, 8500, 6.50),
('f2a3b4c5-d6e7-8901-5678-012345678901', '2024-12-01', 750000.00, 92.00, 32000, 580000, 0.90),
('a3b4c5d6-e7f8-9012-6789-123456789012', '2024-12-01', 125000.00, 35.00, 1500, 28000, 5.80),
('c5d6e7f8-a9b0-1234-8901-345678901234', '2024-12-01', 420000.00, 75.00, 15000, 280000, 2.50),
('d6e7f8a9-b0c1-2345-9012-456789012345', '2024-12-01', 95000.00, 32.00, 1200, 22000, 6.20);

-- Insert product predictions
INSERT INTO public.product_predictions (product_id, success_probability, revenue_probability, failure_risk, model_version, features) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 92.00, 88.00, 8.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong"}'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 75.00, 70.00, 25.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate"}'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 45.00, 38.00, 55.00, 'v2.1', '{"adoption_trend": "down", "market_fit": "weak"}'),
('d4e5f6a7-b8c9-0123-def1-234567890123', 95.00, 92.00, 5.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong"}'),
('e5f6a7b8-c9d0-1234-ef12-345678901234', 68.00, 62.00, 32.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate"}'),
('f6a7b8c9-d0e1-2345-f123-456789012345', 35.00, 28.00, 65.00, 'v2.1', '{"adoption_trend": "down", "market_fit": "weak"}'),
('a7b8c9d0-e1f2-3456-0123-567890123456', 94.00, 90.00, 6.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong"}'),
('b8c9d0e1-f2a3-4567-1234-678901234567', 72.00, 68.00, 28.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate"}'),
('c9d0e1f2-a3b4-5678-2345-789012345678', 25.00, 20.00, 75.00, 'v2.1', '{"adoption_trend": "unknown", "market_fit": "untested"}'),
('d0e1f2a3-b4c5-6789-3456-890123456789', 58.00, 52.00, 42.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "moderate"}'),
('e1f2a3b4-c5d6-7890-4567-901234567890', 30.00, 25.00, 70.00, 'v2.1', '{"adoption_trend": "unknown", "market_fit": "untested"}'),
('f2a3b4c5-d6e7-8901-5678-012345678901', 96.00, 94.00, 4.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong"}'),
('a3b4c5d6-e7f8-9012-6789-123456789012', 65.00, 60.00, 35.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate"}'),
('b4c5d6e7-f8a9-0123-7890-234567890123', 40.00, 35.00, 60.00, 'v2.1', '{"adoption_trend": "down", "market_fit": "weak"}'),
('c5d6e7f8-a9b0-1234-8901-345678901234', 88.00, 85.00, 12.00, 'v2.1', '{"adoption_trend": "up", "market_fit": "strong"}'),
('d6e7f8a9-b0c1-2345-9012-456789012345', 70.00, 65.00, 30.00, 'v2.1', '{"adoption_trend": "stable", "market_fit": "moderate"}');

-- Insert product feedback
INSERT INTO public.product_feedback (product_id, source, raw_text, theme, sentiment_score, impact_level, volume) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Support Ticket', 'OAuth2 documentation incomplete, delaying integration timeline', 'Integration Complexity', -0.65, 'High', 23),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Customer Survey', 'API performance excellent, very satisfied with latency', 'Performance', 0.85, 'Medium', 45),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Customer Survey', 'ML model accuracy impressive, reduced fraud by 40%', 'Performance', 0.92, 'High', 18),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Support Ticket', 'False positive rate still too high for our use case', 'Accuracy', -0.45, 'High', 12),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Partner Feedback', 'Integration process taking longer than expected', 'Onboarding', -0.55, 'Medium', 8),
('d4e5f6a7-b8c9-0123-def1-234567890123', 'Customer Survey', 'Insights are actionable and driving real business value', 'Value', 0.88, 'High', 52),
('e5f6a7b8-c9d0-1234-ef12-345678901234', 'Support Ticket', 'SDK crashes on certain Android devices', 'Stability', -0.72, 'High', 15),
('a7b8c9d0-e1f2-3456-0123-567890123456', 'Customer Survey', 'Loyalty program has significantly increased retention', 'Value', 0.90, 'High', 38),
('a7b8c9d0-e1f2-3456-0123-567890123456', 'Support Ticket', 'Merchant onboarding exceeding SLA - 3 weeks vs 48hr promise', 'Onboarding', -0.80, 'High', 5),
('f2a3b4c5-d6e7-8901-5678-012345678901', 'Customer Survey', 'Real-time dashboards are game-changing for our ops team', 'Value', 0.95, 'High', 62),
('c5d6e7f8-a9b0-1234-8901-345678901234', 'Partner Feedback', 'POS integration went smoothly, great documentation', 'Integration', 0.78, 'Medium', 28);

-- Insert product actions
INSERT INTO public.product_actions (product_id, action_type, priority, status, title, description, assigned_to, due_date) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'intervention', 'high', 'pending', 'Governance intervention required for Digital Wallet API', 'Review and approve Q1 scaling plan', 'sarah.chen@mastercard.com', '2025-01-15'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'intervention', 'high', 'pending', 'Governance intervention required for Partner Integration Hub', 'Address partner onboarding delays', 'lisa.wang@mastercard.com', '2025-01-10'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'review', 'medium', 'in_progress', 'Reduce false positive rate', 'Tune ML model to reduce false positives below 5%', 'mike.johnson@mastercard.com', '2025-01-20'),
('e5f6a7b8-c9d0-1234-ef12-345678901234', 'review', 'high', 'pending', 'Fix Android SDK stability issues', 'Address crashes on Android 12+ devices', 'emma.davis@mastercard.com', '2025-01-08'),
('f6a7b8c9-d0e1-2345-f123-456789012345', 'compliance', 'medium', 'pending', 'Complete compliance review', 'Finish SOC2 certification before pilot expansion', 'james.wilson@mastercard.com', '2025-02-01'),
('a7b8c9d0-e1f2-3456-0123-567890123456', 'partner', 'low', 'in_progress', 'Expand to LATAM region', 'Prepare localization and compliance for Brazil launch', 'olivia.brown@mastercard.com', '2025-03-01');

-- Insert compliance records
INSERT INTO public.product_compliance (product_id, certification_type, status, completed_date, expiry_date, notes) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'PCI-DSS', 'complete', '2024-06-15', '2025-06-15', 'Annual renewal required'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SOC2', 'complete', '2024-08-01', '2025-08-01', NULL),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'SOC2', 'in_progress', NULL, NULL, 'Expected completion Q1 2025'),
('d4e5f6a7-b8c9-0123-def1-234567890123', 'PCI-DSS', 'complete', '2024-03-01', '2025-03-01', NULL),
('d4e5f6a7-b8c9-0123-def1-234567890123', 'GDPR', 'complete', '2024-05-15', NULL, 'No expiry'),
('f2a3b4c5-d6e7-8901-5678-012345678901', 'SOC2', 'complete', '2024-09-01', '2025-09-01', NULL),
('c5d6e7f8-a9b0-1234-8901-345678901234', 'PCI-DSS', 'complete', '2024-04-15', '2025-04-15', NULL);

-- Insert sales training data
INSERT INTO public.sales_training (product_id, total_reps, trained_reps, last_training_date) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 120, 114, '2024-11-15'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 120, 94, '2024-10-20'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 120, 54, '2024-09-01'),
('d4e5f6a7-b8c9-0123-def1-234567890123', 120, 110, '2024-12-01'),
('e5f6a7b8-c9d0-1234-ef12-345678901234', 120, 82, '2024-10-15'),
('f6a7b8c9-d0e1-2345-f123-456789012345', 120, 42, '2024-08-15'),
('a7b8c9d0-e1f2-3456-0123-567890123456', 120, 118, '2024-12-10'),
('b8c9d0e1-f2a3-4567-1234-678901234567', 120, 86, '2024-11-01'),
('f2a3b4c5-d6e7-8901-5678-012345678901', 120, 115, '2024-12-05'),
('c5d6e7f8-a9b0-1234-8901-345678901234', 120, 108, '2024-11-20');
