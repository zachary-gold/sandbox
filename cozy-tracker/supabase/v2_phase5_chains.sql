-- ============================================
-- V2 Phase 5: Chained Events
-- ============================================
-- Enables multi-step task workflows with prompts.
-- When completing a task, user can be prompted
-- to create the next step in the chain.
-- ============================================

-- Event chain templates (e.g., "Laundry Cycle")
CREATE TABLE IF NOT EXISTS event_chains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES house_groups(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., "Laundry Cycle"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual steps in a chain
CREATE TABLE IF NOT EXISTS chain_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chain_id UUID REFERENCES event_chains(id) ON DELETE CASCADE NOT NULL,
    step_order INTEGER NOT NULL, -- 1, 2, 3...
    title TEXT NOT NULL, -- e.g., "Wash", "Dry", "Fold"
    default_delay_hours INTEGER, -- Suggested delay (e.g., 2 hours), null = user picks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link cards to chains for tracking progress
ALTER TABLE cards ADD COLUMN IF NOT EXISTS chain_id UUID REFERENCES event_chains(id);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS chain_step INTEGER; -- Current step in chain

-- Index for chain lookups
CREATE INDEX IF NOT EXISTS idx_event_chains_group_id ON event_chains(group_id);
CREATE INDEX IF NOT EXISTS idx_chain_steps_chain_id ON chain_steps(chain_id);
CREATE INDEX IF NOT EXISTS idx_cards_chain_id ON cards(chain_id);

-- RLS Policies for event_chains
ALTER TABLE event_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chains in their group" ON event_chains
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chains in their group" ON event_chains
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update chains in their group" ON event_chains
    FOR UPDATE USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chains in their group" ON event_chains
    FOR DELETE USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for chain_steps
ALTER TABLE chain_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view steps for chains in their group" ON chain_steps
    FOR SELECT USING (
        chain_id IN (
            SELECT id FROM event_chains WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert steps for chains in their group" ON chain_steps
    FOR INSERT WITH CHECK (
        chain_id IN (
            SELECT id FROM event_chains WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update steps for chains in their group" ON chain_steps
    FOR UPDATE USING (
        chain_id IN (
            SELECT id FROM event_chains WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete steps for chains in their group" ON chain_steps
    FOR DELETE USING (
        chain_id IN (
            SELECT id FROM event_chains WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );
