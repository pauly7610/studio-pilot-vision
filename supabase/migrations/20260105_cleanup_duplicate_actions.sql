-- Cleanup Duplicate Product Actions
-- Run this in Supabase SQL Editor to remove duplicate governance actions

-- ============================================
-- STEP 1: Identify Duplicates (Diagnostic)
-- ============================================
-- This shows how many duplicates you have
SELECT
    product_id,
    title,
    action_type,
    COUNT(*) as duplicate_count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM product_actions
GROUP BY product_id, title, action_type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================
-- STEP 2: Preview Which Records Will Be Kept
-- ============================================
-- This shows the records that will SURVIVE the cleanup
-- (keeps the oldest action for each product/title/type combo)
WITH ranked_actions AS (
    SELECT
        id,
        product_id,
        title,
        action_type,
        status,
        priority,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY product_id, title, action_type
            ORDER BY created_at ASC  -- Keep oldest
        ) as rn
    FROM product_actions
)
SELECT
    id,
    product_id,
    title,
    action_type,
    status,
    created_at
FROM ranked_actions
WHERE rn = 1
ORDER BY created_at DESC;

-- ============================================
-- STEP 3: Delete Duplicates (KEEP OLDEST)
-- ============================================
-- This deletes all duplicates, keeping only the oldest action
-- WARNING: This is destructive! Run STEP 1 and STEP 2 first!

DELETE FROM product_actions
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY product_id, title, action_type
                ORDER BY created_at ASC  -- Keep oldest (rn = 1)
            ) as rn
        FROM product_actions
    ) ranked
    WHERE rn > 1  -- Delete all except the oldest
);

-- Returns: DELETE X (where X is the number of duplicates removed)

-- ============================================
-- STEP 4: Verify Cleanup
-- ============================================
-- Run this after deletion to confirm no duplicates remain
SELECT
    product_id,
    title,
    action_type,
    COUNT(*) as count
FROM product_actions
GROUP BY product_id, title, action_type
HAVING COUNT(*) > 1;

-- Should return 0 rows if cleanup was successful

-- ============================================
-- STEP 5: Check Total Actions Remaining
-- ============================================
SELECT
    COUNT(*) as total_actions,
    COUNT(DISTINCT product_id) as products_with_actions,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM product_actions;

-- ============================================
-- ALTERNATIVE: Delete ALL Duplicates (KEEP NEWEST)
-- ============================================
-- Use this if you want to keep the NEWEST action instead
-- (Uncomment to use)

/*
DELETE FROM product_actions
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY product_id, title, action_type
                ORDER BY created_at DESC  -- Keep newest (rn = 1)
            ) as rn
        FROM product_actions
    ) ranked
    WHERE rn > 1  -- Delete all except the newest
);
*/

-- ============================================
-- PREVENTION: Add Unique Constraint (Optional)
-- ============================================
-- This prevents future duplicates from being created
-- Only run this AFTER cleaning up existing duplicates

/*


-- This allows multiple completed/cancelled actions with same title,
-- but prevents duplicate active actions
*/
