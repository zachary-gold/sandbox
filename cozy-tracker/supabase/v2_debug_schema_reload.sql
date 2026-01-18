-- ============================================
-- DEBUG FIX: Reload Schema Cache
-- ============================================
-- The error "PGRST204" means Supabase's API cache is stale
-- and doesn't know about the 'created_by' column (or others).
-- This command forces a reload.
-- ============================================

NOTIFY pgrst, 'reload schema';

-- Just to be double sure, ensuring the column exists:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'created_by') THEN
        ALTER TABLE cards ADD COLUMN created_by UUID REFERENCES profiles(id);
    END IF;
END $$;
