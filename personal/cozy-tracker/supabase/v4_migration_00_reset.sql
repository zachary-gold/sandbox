-- ============================================
-- V4 Migration Step 0: RESET (if needed)
-- ============================================
-- RUN THIS FIRST if you had a partial migration!
-- Drops V4 tables/policies so you can start fresh.
-- ============================================

-- Drop policies first
DROP POLICY IF EXISTS "Members can view their playpen" ON playpens;
DROP POLICY IF EXISTS "Authenticated users can create playpens" ON playpens;
DROP POLICY IF EXISTS "Members can view playpen members" ON playpen_members;
DROP POLICY IF EXISTS "Users can join playpens" ON playpen_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON playpen_members;
DROP POLICY IF EXISTS "Members can view pens" ON pens;
DROP POLICY IF EXISTS "Members can manage pens" ON pens;
DROP POLICY IF EXISTS "Members can view items" ON items;
DROP POLICY IF EXISTS "Members can manage items" ON items;
DROP POLICY IF EXISTS "Members can view daily notes" ON daily_notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON daily_notes;

-- Drop triggers
DROP TRIGGER IF EXISTS on_playpen_created_starter_pens ON playpens;
DROP TRIGGER IF EXISTS on_playpen_created_add_member ON playpens;

-- Drop functions (CASCADE to drop dependent triggers)
DROP FUNCTION IF EXISTS create_starter_pens() CASCADE;
DROP FUNCTION IF EXISTS add_creator_to_playpen() CASCADE;

-- Drop tables (CASCADE drops dependent objects)
DROP TABLE IF EXISTS daily_notes CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS pens CASCADE;
DROP TABLE IF EXISTS playpen_members CASCADE;
DROP TABLE IF EXISTS playpens CASCADE;

-- Now run v4_migration_01_schema.sql!
