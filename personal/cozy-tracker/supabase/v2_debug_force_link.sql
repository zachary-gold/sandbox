-- ============================================
-- DEBUG FIX: Force Link Boards to Group
-- ============================================
-- The previous fix might have failed if owner_id didn't match perfectly
-- or if there were multiple boards.
-- This script matches boards by the current user's ID directly.
-- ============================================

-- 1. Get the current user's group ID
-- 2. Update ALL boards owned by this user to belong to that group
update boards 
set group_id = (
  select current_group_id 
  from profiles 
  where id = auth.uid()
)
where owner_id = auth.uid();
