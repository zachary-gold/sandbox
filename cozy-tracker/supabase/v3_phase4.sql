-- Phase 4: Notes vs Tasks

-- Add item_type column to cards table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'item_type') THEN
        ALTER TABLE public.cards ADD COLUMN item_type TEXT DEFAULT 'task';
    END IF;
END $$;
