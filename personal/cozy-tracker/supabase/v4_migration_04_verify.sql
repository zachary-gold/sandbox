-- ============================================
-- V4 Migration Step 4: Verify Migration
-- ============================================
-- RUN THIS FOURTH!
-- Run these queries to verify the migration worked.
-- Compare counts between old and new tables.
-- ============================================

-- New table counts
SELECT 'playpens' as table_name, COUNT(*) as count FROM playpens
UNION ALL
SELECT 'playpen_members', COUNT(*) FROM playpen_members
UNION ALL
SELECT 'pens', COUNT(*) FROM pens
UNION ALL
SELECT 'items', COUNT(*) FROM items;

-- Old table counts (for comparison)
-- SELECT 'house_groups' as table_name, COUNT(*) as count FROM house_groups
-- UNION ALL
-- SELECT 'group_members', COUNT(*) FROM group_members
-- UNION ALL
-- SELECT 'cards', COUNT(*) FROM cards;
