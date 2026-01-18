-- ============================================
-- Fix: Add CASCADE delete for template_id
-- ============================================
-- When deleting a routine template, also delete
-- all generated instances that reference it.
-- ============================================

-- First, drop the existing constraint
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_template_id_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE cards 
ADD CONSTRAINT cards_template_id_fkey 
FOREIGN KEY (template_id) REFERENCES cards(id) ON DELETE CASCADE;
