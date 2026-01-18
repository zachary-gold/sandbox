-- Phase 2: Time on Cards

-- Add scheduled_time column to cards table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'scheduled_time') THEN
        ALTER TABLE public.cards ADD COLUMN scheduled_time TIME;
    END IF;
END $$;
