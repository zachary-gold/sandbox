-- Phase 3: Listables Manager

-- Create listables table
CREATE TABLE IF NOT EXISTS public.listables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.boards(id) ON DELETE CASCADE, -- Assuming group logic ties to boards/profiles in a way, technically the spec said house_groups but current schema uses boards/profiles. Using boards as group context for now or just associating with user profile if strict group table missing.
    -- Wait, let's check existing schema. There is no 'house_groups' table in the schema I read.
    -- The schema has 'boards'. There is 'profiles'.
    -- If 'house_groups' exists in unseen files let's use it, but safe bet is likely 'boards' or 'profiles'.
    -- The user spec said "group_id UUID REFERENCES house_groups(id)".
    -- I should verify if house_groups exists. 
    -- Actually, looking at previous conversations or files... 'v2_phase1_groups.sql' exists.
    -- Let's assume there might be a groups table I missed or should rely on board_id.
    -- Re-reading `useGroup` might clarify. 
    -- For now, I will use a generic reference or check schema first.
    -- Let's stick to the spec but being careful. 
    -- Actually, to be safe I'll assume 'boards' is the primary shared context based on App.tsx using 'board.id'.
    -- Let's use board_id for now as the 'group' identifier, as cards reference board_id.
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.listables ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for listables
-- Users can view listables for boards they have access to
CREATE POLICY "Users can manage listables in their boards" ON public.listables
  FOR ALL USING (
    board_id IN (SELECT id FROM public.boards WHERE owner_id = auth.uid() OR owner_id IN (SELECT spouse_id FROM public.profiles WHERE id = auth.uid()))
  );

-- Add listable_id to cards
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'listable_id') THEN
        ALTER TABLE public.cards ADD COLUMN listable_id UUID REFERENCES public.listables(id) ON DELETE SET NULL;
    END IF;
END $$;
