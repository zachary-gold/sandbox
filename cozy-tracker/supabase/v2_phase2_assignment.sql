-- ============================================
-- V2 Phase 2: Assignment
-- ============================================
-- Adds assignment fields to cards:
-- - assigned_to: UUID of a specific group member (nullable = "whoever")
-- - assigned_to_both: Boolean for tasks that require both people
-- ============================================

-- Add assignment fields to cards
alter table cards add column if not exists assigned_to uuid references profiles(id);
alter table cards add column if not exists assigned_to_both boolean default false;

-- Index for filtering by assignment
create index if not exists idx_cards_assigned_to on cards(assigned_to);
