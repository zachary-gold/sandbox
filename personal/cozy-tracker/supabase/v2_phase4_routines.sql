-- ============================================
-- V2 Phase 4: Routines Enhancement
-- ============================================
-- Adds new fields to cards for better routine management:
-- - time_of_day: Optional time for the event
-- - start_date: When this routine begins
-- - end_date: When this routine ends (nullable = no end)
-- - is_active: Pause/resume without deleting
-- ============================================

-- Add time of day for routines
ALTER TABLE cards ADD COLUMN IF NOT EXISTS time_of_day TIME;

-- Add start/end date range for routines
ALTER TABLE cards ADD COLUMN IF NOT EXISTS routine_start_date DATE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS routine_end_date DATE;

-- Add active/paused state
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Index for filtering active routines
CREATE INDEX IF NOT EXISTS idx_cards_is_active ON cards(is_active);
CREATE INDEX IF NOT EXISTS idx_cards_is_recurring ON cards(is_recurring_template);
