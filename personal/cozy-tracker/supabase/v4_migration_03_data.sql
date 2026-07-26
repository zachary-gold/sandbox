-- ============================================
-- V4 Migration Step 3: Migrate Data
-- ============================================
-- RUN THIS THIRD!
-- Migrates existing data from V2/V3 tables.
-- Skip this if starting fresh with no data.
-- ============================================

-- Migrate house_groups → playpens
INSERT INTO playpens (id, name, invite_code, created_at)
SELECT 
    id,
    COALESCE(name, 'Our Playpen'),
    COALESCE(invite_code, lower(substring(gen_random_uuid()::text, 1, 8))),
    COALESCE(created_at, NOW())
FROM house_groups
ON CONFLICT (id) DO NOTHING;

-- Migrate group_members → playpen_members
INSERT INTO playpen_members (id, playpen_id, user_id, display_name, avatar_emoji, joined_at)
SELECT 
    id,
    group_id,
    user_id,
    NULL,
    '🐷',
    COALESCE(joined_at, NOW())
FROM group_members
ON CONFLICT (playpen_id, user_id) DO NOTHING;

-- Migrate listables → pens (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listables') THEN
        INSERT INTO pens (playpen_id, name, emoji, sort_order)
        SELECT 
            b.group_id,
            l.name,
            '📝',
            0
        FROM listables l
        JOIN boards b ON l.board_id = b.id
        WHERE b.group_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Migrate cards → items
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
    NULL,
    c.title,
    c.date,
    NULL,
    NULL,
    CASE 
        WHEN c.recurrence_rule IS NOT NULL AND c.recurrence_rule->>'type' = 'daily' THEN 'daily'
        WHEN c.recurrence_rule IS NOT NULL AND c.recurrence_rule->>'type' = 'weekly' THEN 'weekly:mon,tue,wed,thu,fri,sat,sun'
        ELSE NULL
    END,
    FALSE,
    FALSE,
    NULL,
    NULL,
    c.assigned_to,
    CASE WHEN c.status = 'done' THEN c.created_at ELSE NULL END,
    c.date,
    c.created_at,
    c.created_by
FROM cards c
JOIN boards b ON c.board_id = b.id
WHERE (c.is_recurring_template = FALSE OR c.is_recurring_template IS NULL)
  AND b.group_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;
