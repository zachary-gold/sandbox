-- ============================================
-- Playpen V4 Schema
-- ============================================
-- Complete schema rewrite for Playpen (formerly cozy-tracker).
-- Mobile-first shared to-do app for couples.
-- ============================================

-- 1. PLAYPENS (shared workspace, replaces house_groups)
CREATE TABLE IF NOT EXISTS playpens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT DEFAULT 'Our Playpen',
    invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PLAYPEN MEMBERS (users in a playpen)
CREATE TABLE IF NOT EXISTS playpen_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT,
    avatar_emoji TEXT DEFAULT '🐷',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playpen_id, user_id)
);

-- 3. PENS (category groupings with emoji)
CREATE TABLE IF NOT EXISTS pens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    color TEXT, -- hex for visual grouping (optional)
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE, -- true for starter pens
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ITEMS (the core task model)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    pen_id UUID REFERENCES pens(id) ON DELETE SET NULL,
    
    -- Content
    title TEXT NOT NULL,
    
    -- Scheduling
    focus_date DATE,              -- null = backlog only, date = on focus for that day
    due_date DATE,                -- optional soft deadline
    scheduled_time TIME,          -- optional time (for "Gym @ 6am")
    
    -- Recurrence (format: 'weekly:mon,wed,fri', 'biweekly:tue', 'monthly:15')
    recurrence_rule TEXT,
    recurrence_paused BOOLEAN DEFAULT FALSE,
    
    -- Multi-day projects
    is_project BOOLEAN DEFAULT FALSE,
    project_steps JSONB,          -- [{title, completed}]
    project_start_date DATE,
    
    -- State
    claimed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,     -- null = not done
    original_focus_date DATE,     -- for tracking overdue (what day was it supposed to be?)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. DAILY NOTES (partner messages)
CREATE TABLE IF NOT EXISTS daily_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playpen_id UUID REFERENCES playpens(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playpen_id, author_id, date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_playpen_members_playpen_id ON playpen_members(playpen_id);
CREATE INDEX IF NOT EXISTS idx_playpen_members_user_id ON playpen_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pens_playpen_id ON pens(playpen_id);
CREATE INDEX IF NOT EXISTS idx_items_playpen_id ON items(playpen_id);
CREATE INDEX IF NOT EXISTS idx_items_pen_id ON items(pen_id);
CREATE INDEX IF NOT EXISTS idx_items_focus_date ON items(focus_date);
CREATE INDEX IF NOT EXISTS idx_items_completed_at ON items(completed_at);
CREATE INDEX IF NOT EXISTS idx_daily_notes_playpen_date ON daily_notes(playpen_id, date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE playpens ENABLE ROW LEVEL SECURITY;
ALTER TABLE playpen_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pens ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- Helper: Get playpen IDs for current user
-- (used in policies below)

-- PLAYPENS policies
CREATE POLICY "Users can view their playpens" ON playpens
    FOR SELECT USING (
        id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create playpens" ON playpens
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Members can update playpen" ON playpens
    FOR UPDATE USING (
        id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

-- PLAYPEN_MEMBERS policies
CREATE POLICY "Users can view members of their playpen" ON playpen_members
    FOR SELECT USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can join playpens" ON playpen_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave playpens" ON playpen_members
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can update their own membership" ON playpen_members
    FOR UPDATE USING (user_id = auth.uid());

-- PENS policies
CREATE POLICY "Users can view pens in their playpen" ON pens
    FOR SELECT USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create pens in their playpen" ON pens
    FOR INSERT WITH CHECK (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update pens in their playpen" ON pens
    FOR UPDATE USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete pens in their playpen" ON pens
    FOR DELETE USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

-- ITEMS policies
CREATE POLICY "Users can view items in their playpen" ON items
    FOR SELECT USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create items in their playpen" ON items
    FOR INSERT WITH CHECK (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update items in their playpen" ON items
    FOR UPDATE USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete items in their playpen" ON items
    FOR DELETE USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

-- DAILY_NOTES policies
CREATE POLICY "Users can view notes in their playpen" ON daily_notes
    FOR SELECT USING (
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create their own notes" ON daily_notes
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        playpen_id IN (SELECT playpen_id FROM playpen_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own notes" ON daily_notes
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own notes" ON daily_notes
    FOR DELETE USING (author_id = auth.uid());

-- ============================================
-- STARTER PENS FUNCTION
-- ============================================
-- Creates default pens when a new playpen is created

CREATE OR REPLACE FUNCTION create_starter_pens()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pens (playpen_id, name, emoji, sort_order, is_default) VALUES
        (NEW.id, 'Groceries', '🛒', 1, TRUE),
        (NEW.id, 'Home', '🏠', 2, TRUE),
        (NEW.id, 'Calls', '📞', 3, TRUE),
        (NEW.id, 'Fitness', '💪', 4, TRUE),
        (NEW.id, 'Errands', '📦', 5, TRUE),
        (NEW.id, 'Projects', '🎨', 6, TRUE),
        (NEW.id, 'Someday', '🐷', 7, TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_playpen_created
    AFTER INSERT ON playpens
    FOR EACH ROW EXECUTE FUNCTION create_starter_pens();

-- NOTE: Auto-adding the creator as a member is handled in application code
-- because auth.uid() returns null in trigger context.
-- See usePlaypen.ts createPlaypen() for the implementation.
