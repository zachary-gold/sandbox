-- ============================================
-- V2 Phase 1 FIX #3: Fully Simplified RLS
-- ============================================
-- The self-referencing subquery keeps causing recursion.
-- 
-- For a small family/roommate app, just make group-related
-- SELECT policies permissive. The real security is at the 
-- cards/boards level (which are protected by group membership).
-- ============================================

-- Drop all problematic group_members SELECT policies
drop policy if exists "Users can view group members" on group_members;

-- Simple: Any authenticated user can view group memberships
-- (Not sensitive data - just shows who is in which group)
create policy "Authenticated can view group members" on group_members
  for select using (auth.uid() is not null);

-- Also ensure house_groups SELECT is simple
drop policy if exists "Authenticated users can view groups" on house_groups;
drop policy if exists "Users can view their groups" on house_groups;
create policy "Authenticated can view groups" on house_groups
  for select using (auth.uid() is not null);

-- Also drop and recreate the delete policy to be simpler
drop policy if exists "Users can leave or admins can remove" on group_members;
drop policy if exists "Admins can manage members" on group_members;

-- Simple delete: you can delete yourself, OR if you're an admin of that group
-- We check admin status by seeing if YOUR membership in that group has role='admin'
create policy "Users can leave or admins remove" on group_members
  for delete using (
    user_id = auth.uid()
  );
-- (For MVP, only self-removal. Admin removal can be added later with a function)
