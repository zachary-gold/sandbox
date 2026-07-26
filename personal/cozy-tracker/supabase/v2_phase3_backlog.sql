-- ============================================
-- V2 Phase 3: Backlog Enhancements
-- ============================================
-- Adds priority and due_date fields to cards:
-- - priority: text enum (high, normal, low)
-- - due_date: optional date for backlog items with deadlines
-- ============================================

-- Add priority field with default 'normal'
alter table cards add column if not exists priority text default 'normal';

-- Add check constraint for priority values
alter table cards add constraint priority_check check (priority in ('high', 'normal', 'low'));

-- Add due_date field (nullable - only set if item has a deadline)
alter table cards add column if not exists due_date date;

-- Index for sorting by priority and due_date
create index if not exists idx_cards_priority on cards(priority);
create index if not exists idx_cards_due_date on cards(due_date);
