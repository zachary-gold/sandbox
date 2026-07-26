-- ============================================
-- Playpen V4 Data Migration
-- ============================================
-- Migrates data from V2/V3 tables to new V4 schema.
-- RUN THIS AFTER v4_playpen_schema.sql
-- ============================================

-- IMPORTANT: Take a backup before running this!
-- This migration is DESTRUCTIVE once old tables are dropped.

-- ============================================
-- STEP 1: Migrate house_groups → playpens
-- ============================================

INSERT INTO playpens (id, name, invite_code, created_at)
SELECT 
    id,
    COALESCE(name, 'Our Playpen'),
    COALESCE(invite_code, substring(gen_random_uuid()::text, 1, 8)),
    COALESCE(created_at, NOW())
FROM house_groups
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Migrate group_members → playpen_members
-- ============================================

INSERT INTO playpen_members (id, playpen_id, user_id, display_name, avatar_emoji, joined_at)
SELECT 
    id,
    group_id,
    user_id,
    NULL, -- display_name not in old schema
    '🐷', -- default emoji
    COALESCE(joined_at, NOW())
FROM group_members
ON CONFLICT (playpen_id, user_id) DO NOTHING;

-- ============================================
-- STEP 3: Migrate listables → pens (if exists)
-- ============================================
-- If listables table doesn't exist, skip this step.
-- Starter pens are created automatically via trigger.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listables') THEN
        -- listables has: board_id, name, color (not emoji/sort_order)
        -- We need to map board_id to playpen via boards.group_id
        INSERT INTO pens (playpen_id, name, emoji, sort_order)
        SELECT 
            b.group_id,
            l.name,
            '📝', -- default emoji since listables don't have one
            0 -- default sort_order
        FROM listables l
        JOIN boards b ON l.board_id = b.id
        WHERE b.group_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- STEP 4: Migrate cards → items
-- ============================================
-- Flatten the cards table into the new items format.
-- Note: chain_id and chain_step are dropped (replaced by project_steps)

INSERT INTO items (
    id,
    playpen_id,
    pen_id,
    title,
    focus_date,
    due_date,
    scheduled_time,
    recurrence_rule,
    recurrence_paused,
    is_project,
    project_steps,
    project_start_date,
    claimed_by,
    completed_at,
    original_focus_date,
    created_at,
    created_by
)
SELECT 
    c.id,
    b.group_id,
    NULL, -- pen_id will need manual assignment
    c.title,
    c.date, -- focus_date
    NULL, -- due_date not in old schema
    NULL, -- scheduled_time not in old schema
    -- Convert recurrence_rule JSONB to our string format
    CASE 
        WHEN c.recurrence_rule IS NOT NULL AND c.recurrence_rule->>'type' = 'daily' THEN 'daily'
        WHEN c.recurrence_rule IS NOT NULL AND c.recurrence_rule->>'type' = 'weekly' THEN 'weekly:mon,tue,wed,thu,fri,sat,sun'
        ELSE NULL
    END,
    FALSE, -- recurrence_paused
    FALSE, -- is_project (chains don't migrate cleanly)
    NULL, -- project_steps
    NULL, -- project_start_date
    c.assigned_to, -- claimed_by (from v2_phase2_assignment)
    CASE WHEN c.status = 'done' THEN c.created_at ELSE NULL END, -- completed_at
    c.date, -- original_focus_date
    c.created_at,
    c.created_by
FROM cards c
JOIN boards b ON c.board_id = b.id
WHERE c.is_recurring_template = FALSE OR c.is_recurring_template IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 5: Update profiles.current_group_id → playpen reference
-- ============================================
-- The profiles table has current_group_id which we'll leave as-is
-- since it references the same UUIDs (house_groups.id = playpens.id)

-- ============================================
-- STEP 6: Cleanup (OPTIONAL - run manually after verification)
-- ============================================
-- Uncomment these ONLY after verifying migration was successful!

-- DROP TABLE IF EXISTS chain_steps CASCADE;
-- DROP TABLE IF EXISTS event_chains CASCADE;
-- DROP TABLE IF EXISTS checklist_items CASCADE;
-- DROP TABLE IF EXISTS cards CASCADE;
-- DROP TABLE IF EXISTS boards CASCADE;
-- DROP TABLE IF EXISTS group_members CASCADE;
-- DROP TABLE IF EXISTS house_groups CASCADE;
-- DROP TABLE IF EXISTS listables CASCADE;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify migration worked:

-- SELECT 'playpens' as table_name, COUNT(*) as count FROM playpens
-- UNION ALL
-- SELECT 'playpen_members', COUNT(*) FROM playpen_members
-- UNION ALL
-- SELECT 'pens', COUNT(*) FROM pens
-- UNION ALL
-- SELECT 'items', COUNT(*) FROM items;

-- Compare to old tables:
-- SELECT 'house_groups' as table_name, COUNT(*) as count FROM house_groups
-- UNION ALL
-- SELECT 'group_members', COUNT(*) FROM group_members
-- UNION ALL
-- SELECT 'cards', COUNT(*) FROM cards;
