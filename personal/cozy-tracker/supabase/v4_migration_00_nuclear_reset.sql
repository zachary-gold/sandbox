-- ============================================
-- NUCLEAR RESET: Drop Everything and Start Fresh
-- ============================================
-- WARNING: This deletes ALL data! Only use if you're OK losing everything.
-- ============================================

-- Drop ALL functions first (CASCADE handles triggers)
DROP FUNCTION IF EXISTS create_starter_pens() CASCADE;
DROP FUNCTION IF EXISTS add_creator_to_playpen() CASCADE;
DROP FUNCTION IF EXISTS handle_chain_completion() CASCADE;
DROP FUNCTION IF EXISTS create_default_board() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop ALL tables (in dependency order)
DROP TABLE IF EXISTS daily_notes CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS pens CASCADE;
DROP TABLE IF EXISTS playpen_members CASCADE;
DROP TABLE IF EXISTS playpens CASCADE;

DROP TABLE IF EXISTS chain_steps CASCADE;
DROP TABLE IF EXISTS event_chains CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS listables CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS house_groups CASCADE;

-- Keep profiles and auth tables - those are needed!
-- Just clear the current_group_id reference
UPDATE profiles SET current_group_id = NULL WHERE current_group_id IS NOT NULL;

-- Done! Now run v4_migration_01_schema.sql
