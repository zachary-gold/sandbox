-- ============================================
-- V2 Phase 1: House Groups Migration
-- ============================================
-- This migration replaces the spouse_id model with 
-- a proper group membership system supporting 2-5 people.
-- ============================================

-- 1. Create house_groups table
create table if not exists house_groups (
  id uuid default gen_random_uuid() primary key,
  name text default 'Our Home',
  invite_code text unique default substring(gen_random_uuid()::text, 1, 8), -- Short 8-char code
  created_at timestamp with time zone default now()
);

-- 2. Create group_members junction table
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references house_groups(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member', -- 'admin' or 'member'
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- 3. Update profiles table
alter table profiles add column if not exists current_group_id uuid references house_groups(id);
alter table profiles add column if not exists timezone text default 'America/Chicago';

-- 4. Update boards table to be group-owned
alter table boards add column if not exists group_id uuid references house_groups(id) on delete cascade;

-- 5. Enable RLS on new tables
alter table house_groups enable row level security;
alter table group_members enable row level security;

-- ============================================
-- RLS Policies for house_groups
-- ============================================

-- Users can view groups they are members of
create policy "Users can view their groups" on house_groups
  for select using (
    id in (select group_id from group_members where user_id = auth.uid())
  );

-- Any authenticated user can create a group
create policy "Users can create groups" on house_groups
  for insert with check (auth.uid() is not null);

-- Only admins can update group settings
create policy "Admins can update groups" on house_groups
  for update using (
    id in (
      select group_id from group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can delete groups
create policy "Admins can delete groups" on house_groups
  for delete using (
    id in (
      select group_id from group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- RLS Policies for group_members
-- ============================================

-- Users can view members of groups they belong to
create policy "Users can view group members" on group_members
  for select using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

-- Users can join groups (insert themselves)
create policy "Users can join groups" on group_members
  for insert with check (user_id = auth.uid());

-- Admins can remove members (or user can remove self)
create policy "Admins can manage members" on group_members
  for delete using (
    user_id = auth.uid() 
    or group_id in (
      select group_id from group_members 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- Updated RLS Policies for boards (group-based)
-- ============================================

-- Drop old policies if they exist (ignore errors)
drop policy if exists "Users can view own or spouse board" on boards;
drop policy if exists "Users can insert own board" on boards;

-- New: Users can view boards belonging to their group
create policy "Users can view group boards" on boards
  for select using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

-- New: Users can insert boards for their group
create policy "Users can insert group boards" on boards
  for insert with check (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );

-- ============================================
-- Updated RLS Policies for cards (group-based via board)
-- ============================================

-- Drop old policies if they exist
drop policy if exists "Users can view cards on accessible boards" on cards;
drop policy if exists "Users can insert cards on accessible boards" on cards;
drop policy if exists "Users can update cards on accessible boards" on cards;

-- New: Users can view cards on boards they have access to via group
create policy "Users can view group cards" on cards
  for select using (
    board_id in (
      select b.id from boards b
      join group_members gm on b.group_id = gm.group_id
      where gm.user_id = auth.uid()
    )
  );

-- New: Users can insert cards on accessible boards
create policy "Users can insert group cards" on cards
  for insert with check (
    board_id in (
      select b.id from boards b
      join group_members gm on b.group_id = gm.group_id
      where gm.user_id = auth.uid()
    )
  );

-- New: Users can update cards on accessible boards
create policy "Users can update group cards" on cards
  for update using (
    board_id in (
      select b.id from boards b
      join group_members gm on b.group_id = gm.group_id
      where gm.user_id = auth.uid()
    )
  );

-- New: Users can delete cards on accessible boards
create policy "Users can delete group cards" on cards
  for delete using (
    board_id in (
      select b.id from boards b
      join group_members gm on b.group_id = gm.group_id
      where gm.user_id = auth.uid()
    )
  );
