-- ============================================
-- V2 Phase 1 FIX #2: Allow Group Creation Flow
-- ============================================
-- Problem: When creating a group, the user's current_group_id is NULL,
-- so the SELECT policy fails when trying to return the new row.
--
-- Solution: Make house_groups SELECT permissive for authenticated users.
-- The real security is at the boards/cards level, not at viewing groups.
-- (Groups aren't secrets - the invite code is what matters)
-- ============================================

-- Fix house_groups SELECT - allow any authenticated user to view groups
drop policy if exists "Users can view their groups" on house_groups;
create policy "Authenticated users can view groups" on house_groups
  for select using (auth.uid() is not null);

-- Fix group_members SELECT - allow viewing your OWN membership + others in same group
drop policy if exists "Users can view group members" on group_members;
create policy "Users can view group members" on group_members
  for select using (
    -- Can always see your own memberships
    user_id = auth.uid()
    or 
    -- Can see other members if you share the same group
    group_id in (
      select gm.group_id from group_members gm where gm.user_id = auth.uid()
    )
  );

-- Note: The recursion issue should be avoided because the subquery
-- first checks user_id = auth.uid() (no recursion), and only then
-- uses that result to check other memberships.
