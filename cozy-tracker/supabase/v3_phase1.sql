-- Phase 1: Card Completion

-- Add completed_at column to cards table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'completed_at') THEN
        ALTER TABLE public.cards ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
