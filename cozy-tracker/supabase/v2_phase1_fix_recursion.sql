-- ============================================
-- V2 Phase 1 FIX: Resolve RLS Infinite Recursion
-- ============================================
-- The original group_members SELECT policy caused infinite recursion
-- because it queried group_members to check access to group_members.
-- 
-- This fix uses profiles.current_group_id instead, which doesn't
-- cause recursion since profiles is a different table.
-- ============================================

-- Drop the problematic policies
drop policy if exists "Users can view group members" on group_members;
drop policy if exists "Admins can manage members" on group_members;

-- NEW: Users can view group members if they share the same current_group_id
-- This avoids the self-reference by checking profiles instead
create policy "Users can view group members" on group_members
  for select using (
    group_id = (select current_group_id from profiles where id = auth.uid())
  );

-- NEW: Users can insert themselves as members
-- (We already have this, but re-creating to be safe)
drop policy if exists "Users can join groups" on group_members;
create policy "Users can join groups" on group_members
  for insert with check (user_id = auth.uid());

-- NEW: Users can delete themselves from groups
-- Admins can delete others (check via profiles.current_group_id to avoid recursion)
create policy "Users can leave or admins can remove" on group_members
  for delete using (
    user_id = auth.uid() 
    or (
      -- Check if current user is admin of this group
      -- Use a join approach to avoid recursion
      exists (
        select 1 from group_members gm
        where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
      )
    )
  );

-- Also fix house_groups SELECT to avoid potential issues
drop policy if exists "Users can view their groups" on house_groups;
create policy "Users can view their groups" on house_groups
  for select using (
    id = (select current_group_id from profiles where id = auth.uid())
  );
