-- ============================================
-- Fix: Migrate Existing Boards to Groups
-- ============================================
-- This updates any existing boards without a group_id to use
-- the owner's current_group_id, enabling RLS to work correctly.
-- ============================================

-- Update boards that have an owner_id but no group_id
update boards 
set group_id = (
  select current_group_id 
  from profiles 
  where profiles.id = boards.owner_id
)
where group_id is null and owner_id is not null;

-- Also ensure the cards RLS INSERT policy exists and works
-- (The previous migration should have created this, but let's be sure)
drop policy if exists "Users can insert group cards" on cards;
create policy "Users can insert group cards" on cards
  for insert with check (
    board_id in (
      select b.id from boards b
      where b.group_id in (
        select gm.group_id from group_members gm where gm.user_id = auth.uid()
      )
    )
  );
